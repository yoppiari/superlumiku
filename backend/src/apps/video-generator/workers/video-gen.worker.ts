import { Worker, Job } from 'bullmq'
import { redis, isRedisEnabled } from '../../../lib/redis'
import { VideoGeneratorJob } from '../../../lib/queue'
import { VideoGenService } from '../services/video-gen.service'
import { CreditService } from '../../../services/credit.service'
import { saveFile } from '../../../lib/storage'
import { loadVideoProviders } from '../providers/loader'

const service = new VideoGenService()
const creditService = new CreditService()

// Load providers on worker start
loadVideoProviders()

/**
 * Video Generator Worker
 *
 * Processes video generation jobs in the background
 */

async function processVideoGeneration(job: Job<VideoGeneratorJob>) {
  const { generationId, creditUsed } = job.data

  console.log(`\n🎬 Processing video generation: ${generationId}`)
  console.log(`   Credits: ${creditUsed}`)

  try {
    // Get generation details
    const generation = await service.getGenerationById(generationId)
    if (!generation) {
      throw new Error('Generation not found')
    }

    console.log(`   Model: ${generation.modelName}`)
    console.log(`   Provider: ${generation.provider}`)
    console.log(`   Prompt: ${generation.prompt.substring(0, 50)}...`)

    // Step 1: Start generation with provider
    await job.updateProgress(10)
    console.log('   Step 1: Starting generation with provider...')

    const result = await service.startGeneration(generationId)
    console.log(`   ✅ Generation started. Job ID: ${result.jobId}`)

    // Step 2: Poll status until completed
    await job.updateProgress(30)
    console.log('   Step 2: Polling generation status...')

    let attempts = 0
    const maxAttempts = 120 // 10 minutes max (5s interval)
    let status

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds

      status = await service.checkGenerationStatus(generationId)
      attempts++

      const progress = 30 + Math.min(50, attempts * 0.5) // 30% to 80%
      await job.updateProgress(progress)

      console.log(`   Polling attempt ${attempts}/${maxAttempts} - Status: ${status.status}`)

      if (status.status === 'completed') {
        console.log('   ✅ Generation completed!')
        break
      }

      if (status.status === 'failed') {
        throw new Error(status.errorMessage || 'Generation failed')
      }
    }

    if (attempts >= maxAttempts) {
      throw new Error('Generation timeout - exceeded maximum wait time')
    }

    // Step 3: Download video
    await job.updateProgress(85)
    console.log('   Step 3: Downloading generated video...')

    const videoBuffer = await service.downloadVideo(generationId)
    console.log(`   ✅ Video downloaded. Size: ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB`)

    // Step 4: Save video to storage
    await job.updateProgress(90)
    console.log('   Step 4: Saving video to storage...')

    const videoPath = await saveFile(
      videoBuffer,
      `video-generator/${generation.userId}/${generationId}.mp4`,
      'video/mp4'
    )

    console.log(`   ✅ Video saved: ${videoPath}`)

    // Step 5: Deduct credits
    await job.updateProgress(95)

    // 🧪 TRIAL MODE: Skip credit deduction when creditUsed = 0
    if (creditUsed > 0) {
      console.log('   Step 5: Deducting credits...')
      await creditService.deductCredits({
        userId: generation.userId,
        amount: creditUsed,
        description: `Video generation: ${generation.modelName}`,
        referenceId: generationId,
        referenceType: 'video_generation'
      })
      console.log(`   ✅ Credits deducted: ${creditUsed}`)
    } else {
      console.log('   ⚠️  TRIAL MODE: Skipping credit deduction (0 credits)')
    }

    // Step 6: Mark as completed
    await job.updateProgress(100)
    console.log('   ✅ Video generation completed successfully!')

    return {
      generationId,
      videoPath,
      creditUsed,
      status: 'completed',
    }
  } catch (error: any) {
    console.error(`\n❌ Video generation failed: ${error.message}`)
    console.error(`   Generation ID: ${generationId}`)

    // Mark generation as failed in database
    try {
      const generation = await service.getGenerationById(generationId)
      if (generation) {
        const repo = (service as any).repository
        await repo.updateGenerationStatus(generationId, {
          status: 'failed',
          errorMessage: error.message,
        })
      }
    } catch (dbError) {
      console.error('   Failed to update generation status:', dbError)
    }

    throw error
  }
}

// Create worker if Redis is enabled
let worker: Worker<VideoGeneratorJob> | null = null

if (isRedisEnabled() && redis) {
  worker = new Worker<VideoGeneratorJob>('video-generator', processVideoGeneration, {
    connection: redis,
    concurrency: 3, // Process up to 3 videos simultaneously
    limiter: {
      max: 5, // Max 5 jobs
      duration: 60000, // Per minute (rate limiting)
    },
  })

  worker.on('completed', (job) => {
    console.log(`✅ Video generation job completed: ${job.id}`)
  })

  worker.on('failed', (job, err) => {
    console.error(`❌ Video generation job failed: ${job?.id}`)
    console.error(`   Error: ${err.message}`)
  })

  worker.on('error', (err) => {
    console.error('❌ Worker error:', err)
  })

  console.log('🎬 Video Generator worker started (concurrency: 3)')
} else {
  console.warn('⚠️  Video Generator worker NOT started - Redis not configured')
  console.warn('   Jobs will remain in pending status')
  console.warn('   See TODO_REDIS_SETUP.md for setup instructions')
}

export default worker
