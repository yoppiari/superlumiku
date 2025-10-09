import { Context } from 'hono'
import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs/promises'
import { inpaintingService } from '../services/modelslab/inpainting.service'
import { getSAMIntegrationService } from '../services/sam-integration.service'
import { CreditService } from '../../../services/credit.service'
import { saveMaskToTemp, copyImageToTemp, cleanupTempFile, getPublicUrl } from '../utils/image.utils'

const prisma = new PrismaClient()
const samService = getSAMIntegrationService()
const creditService = new CreditService()

interface BatchAnnotation {
  x: number
  y: number
  xPercent: number
  yPercent: number
  prompt: string
  maskRadius: number
  segmentationMode: 'circular' | 'sam'
  samObjectPrompt?: string
  samMaskBase64?: string
}

interface BatchJob {
  annotationIndex: number
  jobId: string
  status: 'processing' | 'completed' | 'failed'
  outputUrl?: string
  error?: string
  tempFiles?: string[] // Temporary file paths for cleanup
  fetchUrl?: string // ModelsLab fetch URL for status checking
}

// In-memory storage for batch jobs
const batchJobs = new Map<string, {
  posterId: string
  userId: string
  annotations: BatchAnnotation[]
  jobs: BatchJob[]
  currentImagePath: string // Track current image for sequential processing
}>()

/**
 * POST /api/apps/poster-editor/inpaint-batch
 * Start batch inpainting with multiple annotations
 */
export async function startBatchInpaint(c: Context) {
  try {
    const userId = c.get('userId') as string
    const { posterId, annotations } = await c.req.json()

    // Validate input
    if (!posterId || !annotations || !Array.isArray(annotations) || annotations.length === 0) {
      return c.json({ error: 'Invalid request: posterId and annotations array required' }, 400)
    }

    // Verify poster ownership
    const poster = await prisma.posterEdit.findFirst({
      where: {
        id: posterId,
        project: {
          userId
        }
      },
      include: {
        project: true
      }
    })

    if (!poster) {
      return c.json({ error: 'Poster not found or unauthorized' }, 404)
    }

    // Calculate total credits needed
    const totalCredits = annotations.length * 400

    // Check user credits
    const hasCredits = await creditService.hasEnoughCredits(userId, totalCredits)

    if (!hasCredits) {
      const balance = await creditService.getBalance(userId)
      return c.json({
        error: `Insufficient credits. Required: ${totalCredits}, Available: ${balance}`
      }, 400)
    }

    // Deduct credits immediately
    await creditService.deductCredits({
      userId,
      amount: totalCredits,
      description: `Poster Editor: AI Inpaint (${annotations.length} annotations)`,
      referenceId: poster.id,
      referenceType: 'poster_inpaint_batch'
    })

    console.log(`💳 Deducted ${totalCredits} credits from user ${userId}`)

    // Get current image path
    const imageUrl = poster.editedUrl || poster.originalUrl
    if (!imageUrl) {
      return c.json({ error: 'Poster has no image' }, 400)
    }

    const imagePath = path.join(process.cwd(), 'uploads', imageUrl.replace(/^\/uploads\//, ''))

    // Get image dimensions (from first annotation or default)
    const imageWidth = poster.width || 1024
    const imageHeight = poster.height || 1024

    // Generate batch ID
    const batchId = `batch-${Date.now()}-${Math.random().toString(36).substring(7)}`

    // Initialize batch job storage
    batchJobs.set(batchId, {
      posterId,
      userId,
      annotations,
      jobs: [],
      currentImagePath: imagePath
    })

    // Start processing first annotation
    const firstAnnotation = annotations[0]
    const firstJobId = await processAnnotation(
      batchId,
      0,
      firstAnnotation,
      imagePath,
      imageWidth,
      imageHeight
    )

    // Return batch ID and first job
    return c.json({
      success: true,
      batchId,
      totalAnnotations: annotations.length,
      totalCreditsUsed: totalCredits,
      firstJobId
    })

  } catch (error: any) {
    console.error('❌ Batch inpaint error:', error)
    return c.json({ error: error.message || 'Failed to start batch inpaint' }, 500)
  }
}

/**
 * Process a single annotation in the batch
 */
async function processAnnotation(
  batchId: string,
  annotationIndex: number,
  annotation: BatchAnnotation,
  imagePath: string,
  imageWidth: number,
  imageHeight: number
): Promise<string> {
  const batch = batchJobs.get(batchId)
  if (!batch) {
    throw new Error('Batch not found')
  }

  // Convert percentage to pixels
  const x = (annotation.xPercent / 100) * imageWidth
  const y = (annotation.yPercent / 100) * imageHeight

  let maskDataUrl: string

  // Generate mask based on segmentation mode
  if (annotation.segmentationMode === 'sam' && annotation.samMaskBase64) {
    // Use pre-generated SAM mask from frontend
    console.log(`🎯 Using SAM mask for annotation ${annotationIndex}`)
    maskDataUrl = annotation.samMaskBase64
  } else if (annotation.segmentationMode === 'sam') {
    // Generate SAM mask on backend (fallback)
    console.log(`🎯 Generating SAM mask for annotation ${annotationIndex}`)
    const imageBuffer = await fs.readFile(imagePath)
    const imageBase64 = `data:image/png;base64,${imageBuffer.toString('base64')}`

    const samResult = await samService.generateSAMMask(imageBase64, {
      id: `temp-${annotationIndex}`,
      x: Math.round(x),
      y: Math.round(y),
      xPercent: annotation.xPercent,
      yPercent: annotation.yPercent,
      prompt: annotation.prompt,
      segmentationMode: 'sam',
      samObjectPrompt: annotation.samObjectPrompt
    })

    maskDataUrl = samResult.maskBase64
  } else {
    // Generate circular mask (default)
    console.log(`⭕ Using circular mask for annotation ${annotationIndex}`)
    // For circular mask, we need to generate it using canvas
    // For now, fall back to SAM mode or skip
    throw new Error('Circular mask mode not yet supported with new service')
  }

  // Save mask and init image to temporary files
  console.log('💾 Saving images to temporary files...')
  const maskTempUrl = await saveMaskToTemp(maskDataUrl)
  const initTempUrl = await copyImageToTemp(imagePath)

  // Convert to public URLs for ModelsLab API
  const maskPublicUrl = getPublicUrl(maskTempUrl)
  const initPublicUrl = getPublicUrl(initTempUrl)

  console.log('🌐 Public URLs:', { maskPublicUrl, initPublicUrl })

  // Start inpaint job using working service
  const result = await inpaintingService.removeText({
    initImageUrl: initPublicUrl,
    maskImageUrl: maskPublicUrl,
    prompt: annotation.prompt,
    strength: 0.9
  })

  console.log('📊 ModelsLab response:', JSON.stringify(result, null, 2))

  // Extract job ID and fetch URL from response
  const jobId = result.id || result.fetch_result || `job-${Date.now()}`
  const fetchUrl = result.fetch_result || result.id

  // Store job info with temp file paths for cleanup
  batch.jobs.push({
    annotationIndex,
    jobId,
    status: 'processing',
    tempFiles: [maskTempUrl, initTempUrl], // Store for cleanup later
    fetchUrl: fetchUrl // Store fetch URL for status checking
  })

  batchJobs.set(batchId, batch)

  return jobId
}

/**
 * GET /api/apps/poster-editor/inpaint-batch/:batchId/status
 * Check batch processing status
 */
export async function getBatchStatus(c: Context) {
  try {
    const userId = c.get('userId') as string
    const batchId = c.req.param('batchId')

    const batch = batchJobs.get(batchId)
    if (!batch) {
      return c.json({ error: 'Batch not found' }, 404)
    }

    // Verify ownership
    if (batch.userId !== userId) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    // Check status of all jobs
    const updatedJobs: BatchJob[] = []

    for (const job of batch.jobs) {
      if (job.status === 'processing') {
        // Check ModelsLab status using fetch URL
        if (!job.fetchUrl) {
          console.warn(`⚠️ Job ${job.jobId} has no fetch URL, skipping status check`)
          updatedJobs.push(job)
          continue
        }

        const status = await inpaintingService.checkStatus(job.fetchUrl)

        if (status.status === 'success' && status.output && status.output[0]) {
          // Download completed image
          const outputUrl = status.output[0]
          const filename = `inpaint-batch-${batchId}-${job.annotationIndex}-${Date.now()}.png`
          const outputPath = path.join(process.cwd(), 'uploads', 'poster-editor', 'inpainted', filename)

          await fs.mkdir(path.dirname(outputPath), { recursive: true })

          // Download using working service
          const imageBuffer = await inpaintingService.downloadImage(outputUrl)
          await fs.writeFile(outputPath, imageBuffer)

          const relativeUrl = `/uploads/poster-editor/inpainted/${filename}`

          // Update batch with new image path for next annotation
          batch.currentImagePath = outputPath

          // Cleanup temporary files
          if (job.tempFiles) {
            for (const tempFile of job.tempFiles) {
              await cleanupTempFile(tempFile)
            }
          }

          updatedJobs.push({
            ...job,
            status: 'completed',
            outputUrl: relativeUrl
          })

          // Start next annotation if exists
          const nextIndex = job.annotationIndex + 1
          if (nextIndex < batch.annotations.length) {
            const nextAnnotation = batch.annotations[nextIndex]
            const poster = await prisma.posterEdit.findUnique({
              where: { id: batch.posterId }
            })

            if (poster) {
              const nextJobId = await processAnnotation(
                batchId,
                nextIndex,
                nextAnnotation,
                batch.currentImagePath,
                poster.width || 1024,
                poster.height || 1024
              )

              console.log(`✅ Started next annotation ${nextIndex + 1}/${batch.annotations.length}: ${nextJobId}`)
            }
          }

        } else if (status.status === 'error') {
          // Cleanup temporary files on failure
          if (job.tempFiles) {
            for (const tempFile of job.tempFiles) {
              await cleanupTempFile(tempFile)
            }
          }

          updatedJobs.push({
            ...job,
            status: 'failed',
            error: status.message || 'Inpainting failed'
          })
        } else {
          // Still processing
          updatedJobs.push(job)
        }
      } else {
        updatedJobs.push(job)
      }
    }

    // Update batch
    batch.jobs = updatedJobs
    batchJobs.set(batchId, batch)

    // Determine overall status
    const allCompleted = updatedJobs.every(j => j.status === 'completed')
    const anyFailed = updatedJobs.some(j => j.status === 'failed')
    const overallStatus = allCompleted ? 'completed' : anyFailed ? 'partial' : 'processing'

    // If all completed, update poster with final image
    if (allCompleted && updatedJobs.length > 0) {
      const lastJob = updatedJobs[updatedJobs.length - 1]
      if (lastJob.outputUrl) {
        await prisma.posterEdit.update({
          where: { id: batch.posterId },
          data: { editedUrl: lastJob.outputUrl }
        })
        console.log(`✅ Batch ${batchId} complete! Updated poster with final image`)
      }
    }

    return c.json({
      success: true,
      batchId,
      overallStatus,
      totalAnnotations: batch.annotations.length,
      jobs: updatedJobs
    })

  } catch (error: any) {
    console.error('❌ Batch status error:', error)
    return c.json({ error: error.message || 'Failed to check batch status' }, 500)
  }
}

/**
 * POST /api/apps/poster-editor/inpaint-batch/:batchId/cleanup
 * Clean up batch data after completion
 */
export async function cleanupBatch(c: Context) {
  try {
    const userId = c.get('userId') as string
    const batchId = c.req.param('batchId')

    const batch = batchJobs.get(batchId)
    if (!batch) {
      return c.json({ error: 'Batch not found' }, 404)
    }

    // Verify ownership
    if (batch.userId !== userId) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    // Delete batch data
    batchJobs.delete(batchId)

    return c.json({ success: true, message: 'Batch cleaned up' })

  } catch (error: any) {
    console.error('❌ Batch cleanup error:', error)
    return c.json({ error: error.message || 'Failed to cleanup batch' }, 500)
  }
}
