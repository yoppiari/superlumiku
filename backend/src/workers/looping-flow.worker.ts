import { Worker, Job } from 'bullmq'
import { redis } from '../lib/redis'
import prisma from '../db/client'
import path from 'path'
import { LoopingFlowJob } from '../lib/queue'
import fs from 'fs'
import { FFmpegLooper } from '../apps/looping-flow/utils/ffmpeg-looper'
import { getVideoDuration } from '../lib/video-utils'
import { createId } from '@paralleldrive/cuid2'
import { CreditService } from '../services/credit.service'

const creditService = new CreditService()

const OUTPUT_DIR = process.env.OUTPUT_DIR || './uploads/outputs'
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'

// Ensure output directory exists
const ensureOutputDir = () => {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
    console.log(`✅ Output directory created: ${OUTPUT_DIR}`)
  }
}

ensureOutputDir()

const worker = new Worker<LoopingFlowJob>(
  'looping-flow',
  async (job: Job<LoopingFlowJob>) => {
    const {
      generationId,
      videoPath,
      targetDuration,
      loopStyle,
      crossfadeDuration,
      videoCrossfade,
      audioCrossfade,
      masterVolume,
      audioFadeIn,
      audioFadeOut,
      muteOriginal,
      audioLayers,
    } = job.data

    console.log(`🔁 Processing Looping Flow generation: ${generationId}`)
    console.log(`   Video: ${videoPath}`)
    console.log(`   Target Duration: ${targetDuration}s (${(targetDuration / 60).toFixed(1)} min)`)
    console.log(`   Loop Style: ${loopStyle}`)

    try {
      // Update status to processing
      await prisma.loopingFlowGeneration.update({
        where: { id: generationId },
        data: { status: 'processing' },
      })

      // Prepare full video path
      const fullVideoPath = path.join(process.cwd(), UPLOAD_DIR, videoPath).replace(/\\/g, '/')

      // Get video duration
      const sourceDuration = await getVideoDuration(fullVideoPath)

      // Generate output path
      const outputFileName = `loop-${generationId.substring(0, 8)}-${createId()}.mp4`
      const outputFullPath = path.join(process.cwd(), OUTPUT_DIR, outputFileName).replace(/\\/g, '/')
      const outputStoragePath = `/outputs/${outputFileName}`

      // Initialize FFmpeg Looper
      const looper = new FFmpegLooper()

      // Prepare audio layer paths
      const audioLayerPaths = audioLayers?.map((layer) => ({
        ...layer,
        filePath: path.join(process.cwd(), UPLOAD_DIR, layer.filePath).replace(/\\/g, '/'),
      }))

      // Generate loop with progress callback
      let lastProgress = 0
      const result = await looper.processLoop(
        fullVideoPath,
        outputFullPath,
        targetDuration,
        sourceDuration,
        {
          loopStyle,
          crossfadeDuration,
          videoCrossfade,
          audioCrossfade,
          masterVolume,
          audioFadeIn,
          audioFadeOut,
          muteOriginal,
          audioLayers: audioLayerPaths,
        }
      )

      if (!result.success) {
        throw new Error(result.error || 'Loop generation failed')
      }

      console.log(`   ✅ Loop generated: ${outputStoragePath}`)

      // Update generation status
      await prisma.loopingFlowGeneration.update({
        where: { id: generationId },
        data: {
          status: 'completed',
          outputPath: outputStoragePath,
          completedAt: new Date(),
        },
      })

      console.log(`✅ Looping Flow generation completed: ${generationId}`)

      return { success: true, outputPath: outputStoragePath }
    } catch (error: any) {
      console.error(`❌ Looping Flow generation failed: ${generationId}`, error.message)

      // Get generation to retrieve creditUsed and userId
      const generation = await prisma.loopingFlowGeneration.findUnique({
        where: { id: generationId },
        select: { creditUsed: true, userId: true },
      })

      // Refund credits if generation had credit cost
      if (generation && generation.creditUsed > 0) {
        try {
          await creditService.addCredits({
            userId: generation.userId,
            amount: generation.creditUsed,
            type: 'refund',
            description: `Refund for failed loop generation (${generationId.substring(0, 8)})`,
          })
          console.log(
            `💰 Refunded ${generation.creditUsed} credits to user ${generation.userId}`
          )
        } catch (refundError: any) {
          console.error('❌ Credit refund failed:', refundError.message)
        }
      }

      // Update generation status to failed
      await prisma.loopingFlowGeneration.update({
        where: { id: generationId },
        data: {
          status: 'failed',
          errorMessage: error.message,
          completedAt: new Date(),
        },
      })

      throw error
    }
  },
  {
    connection: redis ? redis : undefined,
    concurrency: 2, // Process 2 looping jobs concurrently (can be increased based on server capacity)
  } as any
)

worker.on('completed', (job) => {
  console.log(`✅ Looping Flow job ${job.id} completed`)
})

worker.on('failed', (job, err) => {
  console.error(`❌ Looping Flow job ${job?.id} failed:`, err.message)
})

worker.on('error', (err) => {
  console.error('❌ Looping Flow Worker error:', err)
})

worker.on('ready', () => {
  console.log('🔧 Looping Flow Worker ready and listening for jobs')
})

console.log('🚀 Looping Flow Worker started (concurrency: 2)')
