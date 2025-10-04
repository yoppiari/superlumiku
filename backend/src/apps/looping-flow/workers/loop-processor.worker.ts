import { LoopingFlowRepository } from '../repositories/looping-flow.repository'
import { FFmpegLooper } from '../utils/ffmpeg-looper'
import path from 'path'
import { createId } from '@paralleldrive/cuid2'

export class LoopProcessorWorker {
  private repository = new LoopingFlowRepository()
  private ffmpegLooper = new FFmpegLooper()
  private isRunning = false
  private pollInterval = 5000 // 5 seconds
  private intervalId?: NodeJS.Timeout

  /**
   * Start the worker
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️  Loop processor worker already running')
      return
    }

    this.isRunning = true
    console.log('🚀 Loop processor worker started')

    // Start polling
    this.intervalId = setInterval(() => {
      this.processNextJob().catch((error) => {
        console.error('❌ Worker error:', error)
      })
    }, this.pollInterval)

    // Process first job immediately
    this.processNextJob().catch((error) => {
      console.error('❌ Worker error:', error)
    })
  }

  /**
   * Stop the worker
   */
  async stop() {
    if (!this.isRunning) {
      console.log('⚠️  Loop processor worker not running')
      return
    }

    this.isRunning = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }
    console.log('🛑 Loop processor worker stopped')
  }

  /**
   * Process next pending job
   */
  private async processNextJob() {
    if (!this.isRunning) return

    try {
      // Get next pending generation
      const pendingGenerations = await this.repository.getPendingGenerations()

      if (pendingGenerations.length === 0) {
        // No pending jobs
        return
      }

      const generation = pendingGenerations[0]
      console.log(`📋 Processing generation: ${generation.id}`)

      await this.processGeneration(generation)
    } catch (error) {
      console.error('❌ Error processing job:', error)
    }
  }

  /**
   * Process a single generation
   */
  private async processGeneration(generation: any) {
    try {
      // Update status to processing
      await this.repository.updateGenerationStatus(generation.id, 'processing')
      console.log(`⚙️  Generation ${generation.id} → processing`)

      // Get video info
      const video = await this.repository.getVideoById(generation.videoId, generation.userId)
      const inputPath = path.join(process.cwd(), 'uploads', video.filePath)

      // Generate output path
      const outputFileName = `loop-${generation.id}-${createId()}.mp4`
      const outputPath = path.join(process.cwd(), 'uploads', 'loops', outputFileName)
      const outputStoragePath = `/loops/${outputFileName}`

      console.log(`📥 Input: ${inputPath}`)
      console.log(`📤 Output: ${outputPath}`)
      console.log(`🎬 Target duration: ${generation.targetDuration}s`)
      console.log(`🎥 Source duration: ${video.duration}s`)

      // Get audio layers for this generation
      const audioLayers = await this.repository.getAudioLayers(generation.id)

      // Build loop options
      const loopOptions = {
        loopStyle: generation.loopStyle as 'simple' | 'crossfade' | 'boomerang',
        crossfadeDuration: generation.crossfadeDuration,
        videoCrossfade: generation.videoCrossfade,
        audioCrossfade: generation.audioCrossfade,
        audioLayers: audioLayers.map((layer) => ({
          filePath: path.join(process.cwd(), 'uploads', layer.filePath),
          volume: layer.volume,
          muted: layer.muted,
          fadeIn: layer.fadeIn,
          fadeOut: layer.fadeOut,
        })),
        masterVolume: generation.masterVolume,
        audioFadeIn: generation.audioFadeIn,
        audioFadeOut: generation.audioFadeOut,
        muteOriginal: generation.muteOriginal,
      }

      console.log(`🎵 Loop style: ${loopOptions.loopStyle}`)
      console.log(`🎚️  Audio layers: ${audioLayers.length}`)

      // Process video looping
      const result = await this.ffmpegLooper.processLoop(
        inputPath,
        outputPath,
        generation.targetDuration,
        video.duration,
        loopOptions
      )

      if (result.success) {
        // Mark as completed
        await this.repository.updateGenerationOutput(generation.id, outputStoragePath)
        console.log(`✅ Generation ${generation.id} completed`)
      } else {
        // Mark as failed
        await this.repository.markGenerationFailed(
          generation.id,
          result.error || 'Unknown error'
        )
        console.log(`❌ Generation ${generation.id} failed: ${result.error}`)
      }
    } catch (error: any) {
      console.error(`❌ Error processing generation ${generation.id}:`, error)

      // Mark as failed
      await this.repository.markGenerationFailed(
        generation.id,
        error.message || 'Processing error'
      )
    }
  }
}
