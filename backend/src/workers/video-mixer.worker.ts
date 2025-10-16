/**
 * Video Mixer Worker
 *
 * BullMQ worker for processing video mixing jobs with:
 * - Structured logging
 * - Error handling with retries
 * - Progress reporting
 * - Graceful shutdown
 * - Resource cleanup
 */

import { Worker, Job } from 'bullmq'
import { redis } from '../lib/redis'
import { logger } from '../lib/logger'
import { FFmpegService } from '../lib/ffmpeg'
import prisma from '../db/client'
import path from 'path'
import { randomBytes } from 'crypto'
import { VideoMixerJob } from '../lib/queue'
import fs from 'fs'

const workerLogger = logger.child({ worker: 'video-mixer' })

const ffmpegService = new FFmpegService()
const OUTPUT_DIR = process.env.OUTPUT_DIR || './uploads/outputs'
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  workerLogger.info('Output directory created', { path: OUTPUT_DIR })
}

/**
 * Safe job processor with error handling
 */
async function processVideoMixerJob(job: Job<VideoMixerJob>) {
  const { generationId, projectId, settings, totalVideos } = job.data

  workerLogger.info('Processing generation', {
    jobId: job.id,
    generationId,
    projectId,
    totalVideos
  })

  try {
      // Update status to processing
      await prisma.videoMixerGeneration.update({
        where: { id: generationId },
        data: { status: 'processing' },
      })

      // Load project videos and groups
      const project = await prisma.videoMixerProject.findUnique({
        where: { id: projectId },
        include: {
          videos: {
            orderBy: { order: 'asc' },
          },
          groups: {
            include: {
              videos: {
                orderBy: { order: 'asc' },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
      })

      if (!project || project.videos.length === 0) {
        throw new Error('No videos found in project')
      }

      workerLogger.info('Project loaded', {
        generationId,
        sourceVideos: project.videos.length,
        groups: project.groups.length
      })

      const outputPaths: string[] = []

      // Generate multiple videos
      for (let i = 0; i < totalVideos; i++) {
        console.log(`   📹 Generating video ${i + 1}/${totalVideos}`)

        // Prepare inputs with Group-Based Mixing support
        let inputs: Array<{ filePath: string; duration: number; order: number; groupId?: string | null }> = []

        if (settings.enableGroupMixing && project.groups.length > 0) {
          // Group-Based Mixing: Pick ONE video from EACH group
          console.log(`      ✓ Group mixing enabled (${settings.groupMixingMode} mode)`)
          console.log(`      Groups available: ${project.groups.length}`)

          if (settings.groupMixingMode === 'sequential') {
            // Sequential/Strict Order: Pick from each group in order, cycling through videos
            for (const group of project.groups) {
              if (group.videos.length > 0) {
                const videoIndex = i % group.videos.length  // Cycle: 0,1,2,0,1,2...
                const video = group.videos[videoIndex]
                inputs.push({
                  filePath: path.join(UPLOAD_DIR, video.filePath),
                  duration: video.duration,
                  order: inputs.length,
                  groupId: group.id,
                })
                console.log(`        Group "${group.name}": video ${videoIndex + 1}/${group.videos.length} (${video.duration.toFixed(1)}s)`)
              }
            }
          } else {
            // Random: Pick random video from each group
            for (const group of project.groups) {
              if (group.videos.length > 0) {
                const randomIndex = Math.floor(Math.random() * group.videos.length)
                const video = group.videos[randomIndex]
                inputs.push({
                  filePath: path.join(UPLOAD_DIR, video.filePath),
                  duration: video.duration,
                  order: inputs.length,
                  groupId: group.id,
                })
                console.log(`        Group "${group.name}": random video ${randomIndex + 1}/${group.videos.length} (${video.duration.toFixed(1)}s)`)
              }
            }
          }

          // NOTE: Videos without group are EXCLUDED in group-based mixing mode
          const totalDuration = inputs.reduce((sum, input) => sum + input.duration, 0)
          console.log(`      Total duration from groups: ${totalDuration.toFixed(2)}s`)
        } else {
          // Regular: Use all videos
          inputs = project.videos.map((v, index) => ({
            filePath: path.join(UPLOAD_DIR, v.filePath),
            duration: v.duration,
            order: index,
            groupId: v.groupId,
          }))
        }

        // Apply order mixing
        if (settings.enableOrderMixing) {
          inputs = ffmpegService.shuffleArray(inputs)
          console.log(`      ✓ Order mixed`)
        }

        // Apply different start
        if (settings.enableDifferentStart && i > 0) {
          // Rotate array for each generation
          inputs = ffmpegService.rotateArray(inputs, i)
          console.log(`      ✓ Different start (rotation: ${i})`)
        }

        // Apply fixed start video
        if (settings.fixedStartVideoId && i === 0) {
          const fixedStartIndex = inputs.findIndex(
            (input) => input.filePath.includes(settings.fixedStartVideoId)
          )
          if (fixedStartIndex > 0) {
            // Move fixed start video to beginning
            const [fixedVideo] = inputs.splice(fixedStartIndex, 1)
            inputs.unshift(fixedVideo)
            console.log(`      ✓ Fixed start video applied`)
          }
        }

        // Update order numbers
        inputs = inputs.map((input, index) => ({ ...input, order: index }))

        // Apply Fixed Duration fitting (if enabled)
        if (settings.durationType === 'fixed' && settings.fixedDuration) {
          const totalOriginalDuration = inputs.reduce((sum, input) => sum + input.duration, 0)
          const targetDuration = settings.fixedDuration

          console.log(`      ⏱️  Fixed Duration: ${targetDuration}s (current: ${totalOriginalDuration.toFixed(2)}s)`)

          if (Math.abs(totalOriginalDuration - targetDuration) < 0.1) {
            console.log(`      ✓ Duration already perfect!`)
          } else if (settings.smartDistribution) {
            // STRATEGY 1: Trim videos proportionally
            console.log(`      ✓ Smart Distribution: ${settings.distributionMode} mode`)

            if (settings.distributionMode === 'equal') {
              // Equal: Each video gets same duration
              const durationPerVideo = targetDuration / inputs.length
              inputs = inputs.map(input => ({
                ...input,
                trimDuration: Math.min(durationPerVideo, input.duration)
              }))
              console.log(`        Each video trimmed to: ${durationPerVideo.toFixed(2)}s`)
            } else if (settings.distributionMode === 'proportional') {
              // Proportional: Based on original duration ratio
              inputs = inputs.map(input => ({
                ...input,
                trimDuration: (input.duration / totalOriginalDuration) * targetDuration
              }))
              console.log(`        Proportional trim applied`)
            } else if (settings.distributionMode === 'weighted') {
              // Weighted: Longer videos get more weight
              const weights = inputs.map(input => Math.pow(input.duration, 1.5))
              const totalWeight = weights.reduce((sum, w) => sum + w, 0)
              inputs = inputs.map((input, idx) => ({
                ...input,
                trimDuration: (weights[idx] / totalWeight) * targetDuration
              }))
              console.log(`        Weighted trim applied`)
            }
          } else {
            // STRATEGY 2: Apply speed adjustment to fit duration
            const speedFactor = totalOriginalDuration / targetDuration

            // Check if speed factor is within reasonable range (0.5x - 2.0x)
            if (speedFactor < 0.5 || speedFactor > 2.0) {
              console.warn(`        ⚠️  Speed factor ${speedFactor.toFixed(2)}x is extreme! Consider using Smart Distribution.`)
            }

            console.log(`      ✓ Speed Adjustment: ${speedFactor.toFixed(3)}x (${speedFactor > 1 ? 'faster' : 'slower'})`)

            // Apply speed to ALL videos
            inputs = inputs.map(input => ({
              ...input,
              speedFactor: speedFactor
            }))
          }
        }

        // Generate output filename
        const timestamp = Date.now()
        const randomId = randomBytes(4).toString('hex')
        const outputFilename = `${generationId}_${i + 1}_${timestamp}_${randomId}.mp4`
        const outputPath = path.join(OUTPUT_DIR, outputFilename)

        console.log(`      Processing: ${outputFilename}`)

        // Process with FFmpeg
        let lastProgress = 0
        await ffmpegService.mixVideos(
          inputs,
          outputPath,
          {
            resolution: settings.videoResolution,
            frameRate: settings.frameRate,
            aspectRatio: settings.aspectRatio,
            bitrate: settings.videoBitrate,
            audioOption: settings.audioOption,
            speedMin: settings.speedMin,
            speedMax: settings.speedMax,
            enableSpeedVariations: settings.enableSpeedVariations,
            durationType: settings.durationType,
            fixedDuration: settings.fixedDuration,
            metadataSource: settings.metadataSource,
          },
          (progress) => {
            // Update job progress every 10%
            if (progress - lastProgress >= 10) {
              const overallProgress = ((i / totalVideos) * 100) + ((progress / 100) * (100 / totalVideos))
              job.updateProgress({
                currentVideo: i + 1,
                totalVideos,
                videoProgress: Math.round(progress),
                overallProgress: Math.round(overallProgress),
              })
              lastProgress = progress
            }
          }
        )

        outputPaths.push(`/outputs/${outputFilename}`)
        console.log(`   ✅ Generated: ${outputFilename}`)
      }

      // Generate thumbnail from first video
      if (outputPaths.length > 0) {
        try {
          const generation = await prisma.videoMixerGeneration.findUnique({
            where: { id: generationId },
          })
          if (generation) {
            const thumbnailDir = path.join(UPLOAD_DIR, 'video-mixer', generation.userId, generationId)
            fs.mkdirSync(thumbnailDir, { recursive: true })
            const thumbnailPath = path.join(thumbnailDir, 'thumb.jpg')
            const firstVideoPath = path.join(process.cwd(), outputPaths[0])
            await ffmpegService.generateThumbnail(firstVideoPath, thumbnailPath)
            console.log(`   📸 Thumbnail generated: thumb.jpg`)
          }
        } catch (error) {
          console.error(`   ⚠️  Thumbnail generation failed:`, error)
        }
      }

      // Update generation status
      await prisma.videoMixerGeneration.update({
        where: { id: generationId },
        data: {
          status: 'completed',
          outputPaths: JSON.stringify(outputPaths),
          completedAt: new Date(),
        },
      })

      console.log(`✅ Generation completed: ${generationId}`)
      console.log(`   Generated ${outputPaths.length} videos`)

      return { success: true, outputPaths }
    } catch (error: any) {
      console.error(`❌ Generation failed: ${generationId}`, error.message)

      // Update generation status to failed
      await prisma.videoMixerGeneration.update({
        where: { id: generationId },
        data: { status: 'failed' },
      })

      throw error
    }
}

const worker = new Worker<VideoMixerJob>(
  'video-mixer',
  processVideoMixerJob,
  {
    connection: redis ? redis : undefined,
    concurrency: 1, // Process one job at a time (CPU intensive)
  } as any
)

worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`)
})

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message)
})

worker.on('error', (err) => {
  console.error('❌ Worker error:', err)
})

worker.on('ready', () => {
  console.log('🔧 Video Mixer Worker ready and listening for jobs')
})

// Graceful shutdown handlers
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`)

  try {
    // Stop accepting new jobs
    console.log('Closing worker...')
    await worker.close()

    // Cleanup all active FFmpeg processes
    console.log('Cleaning up FFmpeg processes...')
    await ffmpegService.cleanupAll()

    // Disconnect from Redis
    if (redis) {
      console.log('Disconnecting from Redis...')
      await redis.quit()
    }

    // Disconnect from database
    console.log('Disconnecting from database...')
    await prisma.$disconnect()

    console.log('✅ Graceful shutdown complete')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error during shutdown:', error)
    process.exit(1)
  }
}

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection in worker:', reason)
  console.error('Promise:', promise)
  // Exit process to trigger restart by process manager
  process.exit(1)
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception in worker:', error)
  // Exit process to trigger restart by process manager
  process.exit(1)
})

console.log('🚀 Video Mixer Worker started')
