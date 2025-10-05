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

      // Calculate if two-stage rendering is needed
      const totalLoops = Math.ceil(targetDuration / sourceDuration)
      const MAX_SAFE_LOOPS = 25

      console.log(`📊 Total loops needed: ${totalLoops} (source: ${sourceDuration}s, target: ${targetDuration}s)`)

      let result: { success: boolean; error?: string }

      if (totalLoops > MAX_SAFE_LOOPS) {
        // TWO-STAGE RENDERING: Create base loop then extend via concat
        console.log(`🔄 Two-stage rendering: ${totalLoops} loops > ${MAX_SAFE_LOOPS}`)

        // Stage 1: Create base loop with seamless crossfades
        const baseDuration = sourceDuration * MAX_SAFE_LOOPS
        const baseLoopFileName = `base-${generationId.substring(0, 8)}-${createId()}.mp4`
        const baseLoopPath = path.join(process.cwd(), OUTPUT_DIR, baseLoopFileName).replace(/\\/g, '/')

        console.log(`📦 Stage 1: Creating base loop (${baseDuration}s = ${MAX_SAFE_LOOPS} loops)...`)

        const baseResult = await looper.processLoop(
          fullVideoPath,
          baseLoopPath,
          baseDuration,  // ← Use baseDuration, NOT targetDuration
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

        if (!baseResult.success) {
          console.error(`❌ Stage 1 failed: ${baseResult.error}`)
          throw new Error(baseResult.error || 'Base loop creation failed')
        }

        console.log(`✅ Stage 1 complete: ${baseLoopPath}`)

        // Verify base file exists and get actual duration
        if (!fs.existsSync(baseLoopPath)) {
          throw new Error('Base loop file not created')
        }

        const baseFileSize = fs.statSync(baseLoopPath).size
        const baseActualDuration = await getVideoDuration(baseLoopPath)
        console.log(`📊 Base loop: ${(baseFileSize / 1024 / 1024).toFixed(2)} MB, ${baseActualDuration}s duration`)

        // Stage 2: Extend via concat demuxer (ultra fast, no re-encode)
        console.log(`📦 Stage 2: Extending ${baseActualDuration}s → ${targetDuration}s via concat demuxer...`)

        const extendResult = await looper.extendWithConcatDemuxer(
          baseLoopPath,
          outputFullPath,
          baseActualDuration,
          targetDuration
        )

        if (!extendResult.success) {
          console.error(`❌ Stage 2 failed: ${extendResult.error}`)
          // Cleanup base file
          if (fs.existsSync(baseLoopPath)) {
            fs.unlinkSync(baseLoopPath)
          }
          throw new Error(extendResult.error || 'Concat demuxer failed')
        }

        console.log(`✅ Stage 2 complete`)

        // Cleanup base loop file
        if (fs.existsSync(baseLoopPath)) {
          fs.unlinkSync(baseLoopPath)
          console.log(`🗑️  Cleaned up base loop: ${baseLoopFileName}`)
        }

        result = { success: true }
      } else {
        // DIRECT RENDERING: ≤25 loops, no need for two-stage
        console.log(`⚡ Direct rendering: ${totalLoops} loops ≤ ${MAX_SAFE_LOOPS}`)

        result = await looper.processLoop(
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
      }

      // Verify final output
      if (!fs.existsSync(outputFullPath)) {
        throw new Error('Final output file not created')
      }

      const finalFileSize = fs.statSync(outputFullPath).size
      const finalDuration = await getVideoDuration(outputFullPath)
      console.log(`📊 Final output: ${(finalFileSize / 1024 / 1024).toFixed(2)} MB, ${finalDuration}s duration (target: ${targetDuration}s)`)

      // Check if duration matches target (allow 1s tolerance)
      if (Math.abs(finalDuration - targetDuration) > 1) {
        console.warn(`⚠️  Duration mismatch: expected ${targetDuration}s, got ${finalDuration}s (diff: ${(finalDuration - targetDuration).toFixed(2)}s)`)
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
