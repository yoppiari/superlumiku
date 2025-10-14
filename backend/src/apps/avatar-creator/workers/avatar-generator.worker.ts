import { Worker, Job } from 'bullmq'
import { redis, isRedisEnabled } from '../../../lib/redis'
import { AvatarGenerationJob } from '../../../lib/queue'
import { fluxGenerator } from '../providers/flux-generator.provider'
import { CreditService } from '../../../services/credit.service'
import * as repository from '../repositories/avatar-creator.repository'
import path from 'path'
import fs from 'fs/promises'
import sharp from 'sharp'
import { BaseAppError, AIProviderError, InternalError } from '../../../core/errors'

// Initialize credit service for refunds
const creditService = new CreditService()

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

      // Extract AI model configuration from metadata
      const aiModelConfig = metadata.aiModel || {
        modelId: 'black-forest-labs/FLUX.1-dev',
        modelKey: 'avatar-creator:flux-dev-base',
        loraModel: null,
        loraScale: 0,
        useLoRA: false,
        numInferenceSteps: 30,
        guidanceScale: 3.5,
      }

      console.log(`🤖 AI Model: ${aiModelConfig.modelId || 'FLUX.1-dev (default)'}`)
      if (aiModelConfig.loraModel) {
        console.log(`🎨 LoRA: ${aiModelConfig.loraModel} (scale: ${aiModelConfig.loraScale})`)
      }
      console.log(`⚙️  Steps: ${aiModelConfig.numInferenceSteps || 30}, Guidance: ${aiModelConfig.guidanceScale || 3.5}`)

      // Update status to processing
      await repository.updateGenerationStatus(generationId, 'processing')

      // Update job progress
      await job.updateProgress(10)

      // Parse persona and attributes
      const persona = metadata.persona
      const attributes = metadata.attributes

      // Generate image with FLUX using model configuration
      await job.updateProgress(20)
      const imageBuffer = await this.generateWithModelConfig({
        prompt,
        persona,
        attributes,
        seed: options.seed,
        width: options.width || 1024,
        height: options.height || 1024,
        modelConfig: aiModelConfig,
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
    } catch (error) {
      // Convert to structured error
      const structuredError = error instanceof BaseAppError
        ? error
        : error instanceof Error
        ? new AIProviderError('FLUX', error.message)
        : new InternalError('Avatar generation failed')

      console.error(`❌ Generation failed for ${generationId}:`, {
        generationId,
        userId,
        projectId,
        errorCode: structuredError.code,
        errorMessage: structuredError.message,
        errorCategory: structuredError.category,
        stack: structuredError.stack,
      })

      // Update generation status to failed
      await repository.updateGenerationStatus(generationId, 'failed', {
        errorMessage: structuredError.message,
      })

      // CRITICAL: Refund credits to user since generation failed
      // Credits were already deducted when the job was queued
      // Get refund amount from job metadata (passed from route handler)
      const refundAmount = metadata.creditCost || 10 // Default to 10 if not specified

      // Only refund if cost > 0 (enterprise users have 0 cost)
      if (refundAmount > 0) {
        try {
          // Refund credits
          await creditService.addCredits({
            userId,
            amount: refundAmount,
            type: 'refund',
            description: `Avatar generation failed: ${structuredError.message}`,
            paymentId: generationId, // Use generation ID as reference
          })

          console.log(`✅ Refunded ${refundAmount} credits to user ${userId} for failed generation ${generationId}`)
        } catch (refundError) {
          const refundStructuredError = refundError instanceof Error
            ? refundError
            : new InternalError('Credit refund failed')

          // CRITICAL: If refund fails, log prominently for manual investigation
          console.error('❌❌❌ CRITICAL: Failed to refund credits for failed generation ❌❌❌', {
            userId,
            generationId,
            refundAmount,
            originalError: structuredError.message,
            refundError: refundStructuredError.message,
            stack: refundStructuredError.stack,
          })
          console.error('⚠️  MANUAL INTERVENTION REQUIRED: User needs credit refund')

          // TODO: Send alert to monitoring system (Sentry, PagerDuty, etc.)
          // await sentryService.captureException(refundStructuredError, {
          //   extra: { userId, generationId, refundAmount, originalError: structuredError.message }
          // })
        }
      } else {
        console.log(`ℹ️  No refund needed for enterprise user ${userId} (generation ${generationId})`)
      }

      throw structuredError // Re-throw to mark job as failed in queue
    }
  }

  /**
   * Generate avatar using model configuration from database
   * This method replaces the hardcoded FLUX generation
   */
  private async generateWithModelConfig(params: {
    prompt: string
    persona?: any
    attributes?: any
    seed?: number
    width: number
    height: number
    modelConfig: {
      modelId?: string
      loraModel?: string | null
      loraScale?: number
      useLoRA?: boolean
      numInferenceSteps?: number
      guidanceScale?: number
    }
  }): Promise<Buffer> {
    const { prompt, persona, attributes, seed, width, height, modelConfig } = params

    // Build enhanced prompt using FLUX generator's prompt builder
    const promptResult = fluxGenerator.buildPrompt(prompt, persona, attributes)

    console.log('📝 Enhanced prompt:', promptResult.enhancedPrompt)
    console.log('🚫 Negative prompt:', promptResult.negativePrompt)

    // Use HuggingFace client directly with model configuration
    const { hfClient } = await import('../../../lib/huggingface-client')

    // Determine which model to use
    const modelId = modelConfig.modelId || 'black-forest-labs/FLUX.1-dev'
    const isSchnell = modelId.includes('schnell')

    // Check if we should use LoRA
    const useLoRA = modelConfig.useLoRA !== false && modelConfig.loraModel !== null

    console.log(`🎨 Generating with ${modelId}`)
    if (useLoRA) {
      console.log(`   + LoRA: ${modelConfig.loraModel} (${modelConfig.loraScale || 0.9})`)
    }

    // Generate with FLUX using configured parameters
    const imageBuffer = await hfClient.withRetry(
      () =>
        hfClient.fluxTextToImage({
          prompt: promptResult.enhancedPrompt,
          negativePrompt: promptResult.negativePrompt,
          width,
          height,
          numInferenceSteps: modelConfig.numInferenceSteps || (isSchnell ? 4 : 30),
          guidanceScale: modelConfig.guidanceScale || (isSchnell ? 0 : 3.5),
          useLoRA,
          loraScale: modelConfig.loraScale || 0.9,
          seed,
        }),
      3, // max retries
      5000 // base delay
    )

    console.log('✅ Avatar generated successfully with model configuration')
    return imageBuffer
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
