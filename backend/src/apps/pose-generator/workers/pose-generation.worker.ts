/**
 * Pose Generation Worker
 *
 * Phase 3: Backend API & Workers Implementation
 *
 * This worker processes pose generation jobs from the BullMQ queue.
 * It handles:
 * - Gallery reference mode (selected poses from library)
 * - Text description mode (AI-generated pose from prompt)
 * - Progress tracking and WebSocket updates
 * - Automatic checkpoint recovery
 * - Partial failure handling with refunds
 *
 * Architecture:
 * - Worker polls Redis queue for jobs
 * - Processes poses sequentially with progress updates
 * - Publishes progress to Redis Pub/Sub for WebSocket clients
 * - Updates database with generation status
 * - Handles errors gracefully with automatic refunds
 *
 * Reference: docs/POSE_GENERATOR_ARCHITECTURE.md Section 4.5
 */

import { Worker, Job } from 'bullmq'
import { PrismaClient } from '@prisma/client'
import { fluxApiService, AIGenerationError } from '../services/flux-api.service'
import { PoseGenerationJob, redisConnection } from '../queue/queue.config'
import { CreditService } from '../../../services/credit.service'
import { exportService } from '../services/export.service'
import { poseStorageService } from '../services/storage.service'
import { controlNetService } from '../services/controlnet.service'
import Redis from 'ioredis'

// ========================================
// Dependencies
// ========================================

const prisma = new PrismaClient()
const creditService = new CreditService()

// Redis for pub/sub (separate connection from BullMQ)
const redisPubSub = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
})

// ========================================
// Worker Implementation
// ========================================

/**
 * Main pose generation worker
 *
 * Concurrency: 5 jobs in parallel (configurable via env)
 */
export const poseGenerationWorker = new Worker<PoseGenerationJob>(
  'pose-generation',
  async (job: Job<PoseGenerationJob>) => {
    const {
      generationId,
      userId,
      generationType,
      selectedPoseIds,
      textPrompt,
      batchSize,
      totalExpectedPoses,
      useBackgroundChanger,
      avatarId,
      isRecovery,
    } = job.data

    console.log(`[Worker] Processing generation ${generationId}`)
    console.log(`[Worker] Type: ${generationType}, Total: ${totalExpectedPoses}`)

    if (isRecovery) {
      console.log(`[Worker] RECOVERY MODE: Resuming from checkpoint`)
    }

    try {
      // ========================================
      // 1. Load Generation Record
      // ========================================

      const generation = await prisma.poseGeneration.findUnique({
        where: { id: generationId },
        include: {
          project: {
            include: { avatar: true },
          },
          poseSelections: {
            include: { poseLibrary: true },
          },
          poses: true,
        },
      })

      if (!generation) {
        throw new Error(`Generation ${generationId} not found in database`)
      }

      // ========================================
      // 2. Check if Resuming from Checkpoint
      // ========================================

      const startIndex = generation.posesCompleted || 0

      if (startIndex > 0) {
        console.log(
          `[Worker] Resuming from checkpoint: ${startIndex}/${totalExpectedPoses} poses completed`
        )

        if (isRecovery) {
          console.log(`[Worker] Recovery: Skipping ${startIndex} already completed poses`)
        }
      }

      // ========================================
      // 3. Update Status to Processing
      // ========================================

      await prisma.poseGeneration.update({
        where: { id: generationId },
        data: {
          status: 'processing',
          startedAt: new Date(),
        },
      })

      await publishProgress(userId, generationId, {
        type: 'started',
        message: 'Generation started',
      })

      // ========================================
      // 4. Generate Poses
      // ========================================

      let posesCompleted = startIndex
      let posesFailed = 0
      const generatedPoseIds: string[] = []

      if (generationType === 'GALLERY_REFERENCE') {
        // Gallery mode: Generate variations for each selected pose
        const posesToGenerate = generation.poseSelections

        for (let i = 0; i < posesToGenerate.length; i++) {
          const selection = posesToGenerate[i]
          const libraryPose = selection.poseLibrary

          if (!libraryPose) {
            console.warn(`[Worker] Pose library ${selection.poseLibraryId} not found, skipping`)
            continue
          }

          console.log(
            `[Worker] Generating ${batchSize} variations for pose: ${libraryPose.name}`
          )

          // Generate variations for this pose
          for (let v = 0; v < batchSize; v++) {
            // IMPROVED: Check if this specific variation already generated (for recovery)
            const variationKey = `${libraryPose.id}-v${v}`
            const existingPose = generation.poses.find(
              (p) =>
                p.variationKey === variationKey &&
                (p.status === 'completed' || p.status === 'processing')
            )

            if (existingPose && isRecovery) {
              console.log(
                `[Worker] Variation ${variationKey} already exists (status: ${existingPose.status}), skipping`
              )
              if (existingPose.status === 'completed') {
                posesCompleted++
              }
              continue
            }

            try {
              const poseId = await generateSinglePose({
                generationId,
                libraryPose,
                variationIndex: v,
                totalVariations: batchSize,
                prompt: generation.textPrompt,
                avatarAttributes: generation.avatarAttributes
                  ? JSON.parse(generation.avatarAttributes)
                  : null,
              })

              generatedPoseIds.push(poseId)
              posesCompleted++

              // Update progress every 5 poses
              if (posesCompleted % 5 === 0 || posesCompleted === totalExpectedPoses) {
                await updateProgress(
                  generationId,
                  posesCompleted,
                  totalExpectedPoses
                )
                await publishProgress(userId, generationId, {
                  type: 'progress',
                  completed: posesCompleted,
                  total: totalExpectedPoses,
                  percentage: Math.round((posesCompleted / totalExpectedPoses) * 100),
                })
              }
            } catch (error) {
              console.error(`[Worker] Failed to generate pose variation:`, error)

              posesFailed++

              // Create failed pose record
              await prisma.generatedPose.create({
                data: {
                  generationId,
                  poseLibraryId: libraryPose.id,
                  outputImageUrl: '',
                  thumbnailUrl: '',
                  exportFormats: {},
                  promptUsed: '',
                  status: 'failed',
                  errorMessage:
                    error instanceof Error ? error.message : 'Unknown error',
                },
              })
            }
          }
        }
      } else if (generationType === 'TEXT_DESCRIPTION') {
        // Text mode: Generate poses from prompt
        console.log(`[Worker] Generating ${batchSize} poses from text prompt`)

        for (let i = 0; i < batchSize; i++) {
          // IMPROVED: Check if this specific variation already generated (for recovery)
          const variationKey = `text-v${i}`
          const existingPose = generation.poses.find(
            (p) =>
              p.variationKey === variationKey &&
              (p.status === 'completed' || p.status === 'processing')
          )

          if (existingPose && isRecovery) {
            console.log(
              `[Worker] Variation ${variationKey} already exists (status: ${existingPose.status}), skipping`
            )
            if (existingPose.status === 'completed') {
              posesCompleted++
            }
            continue
          }

          try {
            const poseId = await generateSinglePose({
              generationId,
              libraryPose: null,
              variationIndex: i,
              totalVariations: batchSize,
              prompt: textPrompt || 'professional standing pose',
              avatarAttributes: generation.avatarAttributes
                ? JSON.parse(generation.avatarAttributes)
                : null,
            })

            generatedPoseIds.push(poseId)
            posesCompleted++

            // Update progress
            if (posesCompleted % 5 === 0 || posesCompleted === totalExpectedPoses) {
              await updateProgress(
                generationId,
                posesCompleted,
                totalExpectedPoses
              )
              await publishProgress(userId, generationId, {
                type: 'progress',
                completed: posesCompleted,
                total: totalExpectedPoses,
                percentage: Math.round((posesCompleted / totalExpectedPoses) * 100),
              })
            }
          } catch (error) {
            console.error(`[Worker] Failed to generate pose from text:`, error)

            posesFailed++

            // Create failed pose record
            await prisma.generatedPose.create({
              data: {
                generationId,
                poseLibraryId: null,
                outputImageUrl: '',
                thumbnailUrl: '',
                exportFormats: {},
                promptUsed: textPrompt || '',
                status: 'failed',
                errorMessage:
                  error instanceof Error ? error.message : 'Unknown error',
              },
            })
          }
        }
      }

      // ========================================
      // 5. Handle Completion
      // ========================================

      // Calculate refund if any poses failed
      let creditRefunded = 0
      if (posesFailed > 0) {
        creditRefunded = await handlePartialFailure(
          generationId,
          posesFailed,
          userId
        )
      }

      // Mark as completed
      await prisma.poseGeneration.update({
        where: { id: generationId },
        data: {
          status: posesCompleted > 0 ? 'completed' : 'failed',
          posesCompleted,
          posesFailed,
          creditRefunded,
          completedAt: new Date(),
          progress: 100,
        },
      })

      // Publish completion event
      await publishProgress(userId, generationId, {
        type: 'completed',
        completed: posesCompleted,
        failed: posesFailed,
        creditRefunded,
        total: totalExpectedPoses,
      })

      console.log(
        `[Worker] Completed generation ${generationId}: ${posesCompleted} successful, ${posesFailed} failed`
      )

      return {
        success: true,
        posesCompleted,
        posesFailed,
        creditRefunded,
      }
    } catch (error) {
      console.error(`[Worker] Fatal error in generation ${generationId}:`, error)

      // Determine if we should refund credits
      const shouldRefund =
        error instanceof AIGenerationError ||
        (error instanceof Error && error.message.includes('API'))

      // Calculate refund amount (full refund on fatal errors)
      const generation = await prisma.poseGeneration.findUnique({
        where: { id: generationId },
      })
      const refundAmount = generation?.creditCharged || 0

      // Mark as failed with transaction
      await prisma.$transaction(
        async (tx) => {
          await tx.poseGeneration.update({
            where: { id: generationId },
            data: {
              status: 'failed',
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
              completedAt: new Date(),
              creditRefunded: shouldRefund ? refundAmount : 0,
            },
          })
        },
        {
          isolationLevel: 'Serializable',
          maxWait: 5000,
          timeout: 15000,
        }
      )

      // Refund credits if applicable (creditService handles its own transaction)
      if (shouldRefund && refundAmount > 0) {
        await creditService.refundCredits({
          userId,
          amount: refundAmount,
          description: `Full refund: Generation failed - ${error instanceof Error ? error.message : 'Unknown error'}`,
          referenceId: generationId,
          referenceType: 'pose_generation_failed',
        })
        console.log(`[Worker] Refunded ${refundAmount} credits due to fatal error`)
      }

      // Publish failure event
      await publishProgress(userId, generationId, {
        type: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        creditRefunded: shouldRefund ? refundAmount : 0,
      })

      throw error
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
    },
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5'),
  }
)

// ========================================
// Helper Functions
// ========================================

/**
 * Generate a single pose
 *
 * @param params Generation parameters
 * @returns Generated pose ID
 */
async function generateSinglePose(params: {
  generationId: string
  libraryPose: any | null
  variationIndex: number
  totalVariations: number
  prompt: string | null
  avatarAttributes: any | null
  exportFormats?: string[] // Phase 4D: Export formats to generate
}): Promise<string> {
  const {
    generationId,
    libraryPose,
    variationIndex,
    totalVariations,
    prompt,
    avatarAttributes,
    exportFormats,
  } = params

  const startTime = Date.now()

  // Build prompt
  let finalPrompt = prompt || 'professional portrait'

  if (libraryPose) {
    finalPrompt = `${finalPrompt}, ${libraryPose.name}, ${libraryPose.description || ''}`
  }

  // Enhance prompt with avatar attributes
  if (avatarAttributes) {
    finalPrompt = fluxApiService.buildEnhancedPrompt(
      finalPrompt,
      libraryPose?.description,
      avatarAttributes
    )
  }

  // Generate seed for variation
  const seed = Math.floor(Math.random() * 1000000)

  console.log(
    `[Worker] Generating pose variation ${variationIndex + 1}/${totalVariations}`
  )

  // ========================================
  // Phase 4B: Load ControlNet map if available
  // ========================================
  let controlNetBuffer: Buffer | undefined
  let poseDescription: string | undefined

  if (libraryPose && libraryPose.controlNetMapUrl) {
    try {
      const mapBuffer = await controlNetService.loadControlNetMap(libraryPose.controlNetMapUrl)
      if (mapBuffer) {
        // Process map to target dimensions
        controlNetBuffer = await controlNetService.processForFlux(mapBuffer, 1024, 1024)
        console.log('[Worker] Loaded and processed ControlNet map')
      }

      // Extract pose description for prompt enhancement
      poseDescription = controlNetService.extractPoseDescription(libraryPose)
      console.log(`[Worker] Pose description: ${poseDescription}`)
    } catch (error) {
      console.warn('[Worker] ControlNet processing failed, continuing with text-only:', error)
    }
  }

  // Generate image via FLUX API
  const imageBuffer = await fluxApiService.generateWithControlNet({
    prompt: finalPrompt,
    controlNetImage: controlNetBuffer,
    poseDescription,
    width: 1024,
    height: 1024,
    seed,
  })

  const generationTime = (Date.now() - startTime) / 1000

  // Generate variation key for duplicate detection
  const variationKey = libraryPose
    ? `${libraryPose.id}-v${variationIndex}`
    : `text-v${variationIndex}`

  // Use transaction to ensure atomic pose creation and URL updates
  const generatedPose = await prisma.$transaction(
    async (tx) => {
      // Create pose record first to get ID
      const pose = await tx.generatedPose.create({
        data: {
          generationId,
          poseLibraryId: libraryPose?.id || null,
          outputImageUrl: '', // Will be updated after upload
          thumbnailUrl: '',
          originalImageUrl: '',
          exportFormats: {},
          promptUsed: finalPrompt,
          seedUsed: seed,
          controlnetWeight: 0.75,
          generationTime,
          status: 'processing',
          variationKey, // Add variation key for recovery
        },
      })

      // Upload to storage with thumbnail generation (outside transaction)
      // Note: Storage operations are not transactional but can be retried
      const { imageUrl, thumbnailUrl, originalImageUrl } =
        await poseStorageService.savePoseWithThumbnail({
          imageBuffer,
          generationId,
          poseId: pose.id,
          poseLibraryId: libraryPose?.id,
        })

      // Update pose record with URLs atomically
      const updatedPose = await tx.generatedPose.update({
        where: { id: pose.id },
        data: {
          outputImageUrl: imageUrl,
          thumbnailUrl: thumbnailUrl,
          originalImageUrl: originalImageUrl,
          status: 'completed',
        },
      })

      return updatedPose
    },
    {
      isolationLevel: 'Serializable',
      maxWait: 10000, // Wait up to 10 seconds for transaction
      timeout: 60000, // Transaction timeout 60 seconds
    }
  )

  try {

    console.log(
      `[Worker] Generated pose ${generatedPose.id} in ${generationTime.toFixed(1)}s`
    )

    // ========================================
    // Phase 4D: Generate Export Formats
    // ========================================
    const exportFormats = params.exportFormats
    if (exportFormats && exportFormats.length > 0) {
      try {
        console.log(`[Worker] Generating ${exportFormats.length} export formats for pose ${generatedPose.id}`)

        const exportUrls = await exportService.generateExports({
          sourceImagePath: generatedPose.outputImageUrl,
          generationId,
          poseId: generatedPose.id,
          selectedFormats: exportFormats,
        })

        // Update pose with export URLs
        await prisma.generatedPose.update({
          where: { id: generatedPose.id },
          data: { exportFormats: exportUrls },
        })

        console.log(`[Worker] Generated ${Object.keys(exportUrls).length} export formats successfully`)
      } catch (error) {
        console.error(`[Worker] Failed to generate exports for pose ${generatedPose.id}:`, error)
        // Don't fail the entire pose generation if exports fail
      }
    }

    return generatedPose.id
  } catch (error) {
    // If storage or export fails, mark pose as failed with transaction
    console.error(`[Worker] Failed to complete pose ${generatedPose.id}:`, error)

    await prisma.$transaction(
      async (tx) => {
        await tx.generatedPose.update({
          where: { id: generatedPose.id },
          data: {
            status: 'failed',
            errorMessage: `Storage/Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        })
      },
      { isolationLevel: 'Serializable' }
    )

    throw error
  }
}

/**
 * Update generation progress in database
 *
 * @param generationId Generation ID
 * @param completed Poses completed
 * @param total Total poses
 */
async function updateProgress(
  generationId: string,
  completed: number,
  total: number
) {
  // Update checkpoint atomically to prevent race conditions
  await prisma.$transaction(
    async (tx) => {
      await tx.poseGeneration.update({
        where: { id: generationId },
        data: {
          posesCompleted: completed,
          progress: Math.round((completed / total) * 100),
        },
      })
    },
    {
      isolationLevel: 'Serializable',
      maxWait: 5000,
      timeout: 10000,
    }
  )
}

/**
 * Publish progress to Redis Pub/Sub for WebSocket clients
 *
 * @param userId User ID
 * @param generationId Generation ID
 * @param data Progress data
 */
async function publishProgress(
  userId: string,
  generationId: string,
  data: any
) {
  const message = {
    generationId,
    userId,
    timestamp: new Date().toISOString(),
    ...data,
  }

  await redisPubSub.publish(
    `pose-generation:${userId}`,
    JSON.stringify(message)
  )
}

/**
 * Handle partial failure with refund
 *
 * @param generationId Generation ID
 * @param failedCount Number of failed poses
 * @param userId User ID
 * @returns Refund amount
 */
async function handlePartialFailure(
  generationId: string,
  failedCount: number,
  userId: string
): Promise<number> {
  const refundAmount = failedCount * 30 // 30 credits per pose

  console.log(
    `[Worker] Refunding ${refundAmount} credits for ${failedCount} failed poses`
  )

  // Use credit service to handle refund properly with balance calculation
  await creditService.refundCredits({
    userId,
    amount: refundAmount,
    description: `Refund for ${failedCount} failed poses in generation ${generationId}`,
    referenceId: generationId,
    referenceType: 'pose_generation',
  })

  return refundAmount
}

// ========================================
// Worker Event Handlers
// ========================================

poseGenerationWorker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully`)
})

poseGenerationWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message)
})

poseGenerationWorker.on('error', (err) => {
  console.error('[Worker] Worker error:', err)
})

// ========================================
// Graceful Shutdown
// ========================================

process.on('SIGTERM', async () => {
  console.log('[Worker] SIGTERM received, closing worker gracefully...')
  await poseGenerationWorker.close()
  await prisma.$disconnect()
  await redisPubSub.quit()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('[Worker] SIGINT received, closing worker gracefully...')
  await poseGenerationWorker.close()
  await prisma.$disconnect()
  await redisPubSub.quit()
  process.exit(0)
})

console.log('[Worker] Pose generation worker started successfully')
console.log(`[Worker] Concurrency: ${process.env.WORKER_CONCURRENCY || '5'}`)
