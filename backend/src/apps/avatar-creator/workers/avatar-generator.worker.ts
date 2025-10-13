import { Worker, Job } from 'bullmq'
import { redis, isRedisEnabled } from '../../../lib/redis'
import { AvatarGenerationJob } from '../../../lib/queue'
import { fluxGenerator } from '../providers/flux-generator.provider'
import * as repository from '../repositories/avatar-creator.repository'
import path from 'path'
import fs from 'fs/promises'
import sharp from 'sharp'

/**
 * Avatar Generator Worker
 *
 * Processes avatar generation jobs in background
 * Handles FLUX image generation and file storage
 */

class AvatarGeneratorWorker {
  private worker: Worker<AvatarGenerationJob> | null = null
  private uploadBasePath: string

  constructor() {
    this.uploadBasePath = path.join(process.cwd(), 'uploads', 'avatar-creator')
    this.initialize()
  }

  private initialize() {
    if (!isRedisEnabled() || !redis) {
      console.log('⚠️  Redis not enabled - Avatar generator worker will not start')
      return
    }

    this.worker = new Worker<AvatarGenerationJob>(
      'avatar-generation',
      async (job: Job<AvatarGenerationJob>) => {
        return await this.processJob(job)
      },
      {
        connection: redis,
        concurrency: 2, // Process 2 generations simultaneously
      }
    )

    // Event listeners
    this.worker.on('completed', (job) => {
      console.log(`✅ Avatar generation completed: ${job.id}`)
    })

    this.worker.on('failed', (job, error) => {
      console.error(`❌ Avatar generation failed: ${job?.id}`, error)
    })

    this.worker.on('active', (job) => {
      console.log(`🎨 Processing avatar generation: ${job.id}`)
    })

    console.log('🚀 Avatar Generator Worker started')
  }

  /**
   * Process a single generation job
   */
  private async processJob(job: Job<AvatarGenerationJob>): Promise<void> {
    const { generationId, userId, projectId, prompt, options, metadata } = job.data

    try {
      console.log(`\n📸 Generating avatar for user ${userId}`)
      console.log(`📝 Prompt: ${prompt}`)

      // Update status to processing
      await repository.updateGenerationStatus(generationId, 'processing')

      // Update job progress
      await job.updateProgress(10)

      // Parse persona and attributes
      const persona = metadata.persona
      const attributes = metadata.attributes

      // Generate image with FLUX
      await job.updateProgress(20)
      const imageBuffer = await fluxGenerator.generateAvatar({
        prompt,
        persona,
        attributes,
        seed: options.seed,
        width: options.width || 1024,
        height: options.height || 1024,
      })

      await job.updateProgress(70)

      // Save image and create thumbnail
      const { imagePath, thumbnailPath } = await this.saveImageWithThumbnail(
        userId,
        imageBuffer,
        `avatar-${Date.now()}.jpg`
      )

      await job.updateProgress(90)

      // Create avatar record in database
      const avatar = await repository.createAvatar({
        userId,
        projectId,
        name: metadata.name,
        baseImageUrl: imagePath,
        thumbnailUrl: thumbnailPath,
        sourceType: metadata.sourceType,
        generationPrompt: prompt,
        seedUsed: options.seed,
        // Persona
        personaName: persona?.name,
        personaAge: persona?.age,
        personaPersonality: persona?.personality ? JSON.stringify(persona.personality) : undefined,
        personaBackground: persona?.background,
        // Visual attributes
        gender: attributes?.gender,
        ageRange: attributes?.ageRange,
        ethnicity: attributes?.ethnicity,
        bodyType: attributes?.bodyType,
        hairStyle: attributes?.hairStyle,
        hairColor: attributes?.hairColor,
        eyeColor: attributes?.eyeColor,
        skinTone: attributes?.skinTone,
        style: attributes?.style,
      })

      // Update generation status to completed
      await repository.updateGenerationStatus(generationId, 'completed', {
        avatarId: avatar.id,
      })

      await job.updateProgress(100)

      console.log(`✅ Avatar created successfully: ${avatar.id}`)
    } catch (error: any) {
      console.error(`❌ Generation failed for ${generationId}:`, error)

      // Update generation status to failed
      await repository.updateGenerationStatus(generationId, 'failed', {
        errorMessage: error.message || 'Generation failed',
      })

      throw error // Re-throw to mark job as failed in queue
    }
  }

  /**
   * Save image with thumbnail
   */
  private async saveImageWithThumbnail(
    userId: string,
    imageBuffer: Buffer,
    filename: string
  ): Promise<{ imagePath: string; thumbnailPath: string }> {
    // Create user directory
    const userDir = path.join(this.uploadBasePath, userId)
    await fs.mkdir(userDir, { recursive: true })

    // Generate filenames
    const timestamp = Date.now()
    const baseFilename = `${timestamp}.jpg`
    const thumbnailFilename = `${timestamp}_thumb.jpg`

    // File paths
    const imageFullPath = path.join(userDir, baseFilename)
    const thumbnailFullPath = path.join(userDir, thumbnailFilename)

    // Relative paths for database
    const imagePath = `/uploads/avatar-creator/${userId}/${baseFilename}`
    const thumbnailPath = `/uploads/avatar-creator/${userId}/${thumbnailFilename}`

    // Save original image
    await fs.writeFile(imageFullPath, imageBuffer)

    // Generate and save thumbnail
    const thumbnailBuffer = await sharp(imageBuffer)
      .resize(300, 300, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 85 })
      .toBuffer()

    await fs.writeFile(thumbnailFullPath, thumbnailBuffer)

    return { imagePath, thumbnailPath }
  }

  /**
   * Graceful shutdown
   */
  async close() {
    if (this.worker) {
      await this.worker.close()
      console.log('👋 Avatar Generator Worker stopped')
    }
  }
}

// Create and export worker instance
const avatarWorker = new AvatarGeneratorWorker()

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker...')
  await avatarWorker.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing worker...')
  await avatarWorker.close()
  process.exit(0)
})

export default avatarWorker
