import { prisma } from '../../../db/client'
import { creditService } from '../../../services/credit.service'
import { BackgroundRemovalTier } from '../types'
import { pricingService } from './pricing.service'
import { subscriptionService } from './subscription.service'
import { aiProviderService } from './ai-provider.service'
import { storageService } from './storage.service'
import { emailService } from './email.service'
import { addBackgroundRemovalBatchJob } from '../../../lib/queue'
import { nanoid } from 'nanoid'

/**
 * Main Background Remover Service
 */
class BackgroundRemoverService {
  /**
   * Process single image
   */
  async processSingleImage(
    userId: string,
    imageBuffer: Buffer,
    tier: BackgroundRemovalTier
  ) {
    // Check subscription first
    const quotaCheck = await subscriptionService.checkSubscriptionQuota(userId, tier, 1)

    let pricingType: 'credit' | 'subscription' = 'credit'
    const creditsForTier = pricingService.getCreditCostForTier(tier)

    // Use subscription if available and has quota
    if (quotaCheck.canUseSubscription) {
      pricingType = 'subscription'
    } else {
      // Deduct credits BEFORE processing
      await creditService.deductCredits({
        userId,
        amount: creditsForTier,
        description: 'background_removal',
        referenceType: 'background_removal_job',
        metadata: {
          appId: 'background-remover',
          action: 'single_removal',
          tier,
        }
      })
    }

    // Validate image
    const validation = aiProviderService.validateImage(imageBuffer)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    // Save original
    const originalFile = await storageService.saveUploadedFile(
      imageBuffer,
      userId,
      'original.png'
    )

    // Create job record
    const job = await prisma.backgroundRemovalJob.create({
      data: {
        userId,
        status: 'processing',
        originalUrl: originalFile.filePath,
        originalSize: originalFile.fileSize,
        tier,
        creditsUsed: pricingType === 'subscription' ? 0 : creditsForTier,
        pricingType,
      },
    })

    try {
      // Process with AI
      const startTime = Date.now()
      const result = await aiProviderService.removeBackground(imageBuffer, tier)

      if (!result.success) {
        throw new Error(result.error)
      }

      // Convert data URL to buffer and save
      const processedBuffer = storageService.dataUrlToBuffer(result.processedUrl!)
      const savedFile = await storageService.saveProcessedImage(
        processedBuffer,
        userId,
        job.id
      )

      // Update job
      await prisma.backgroundRemovalJob.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          processedUrl: savedFile.filePath,
          thumbnailUrl: savedFile.thumbnailPath,
          processedSize: savedFile.fileSize,
          aiProvider: result.aiProvider,
          modelName: result.modelName,
          processingTime: result.processingTime,
          completedAt: new Date(),
        },
      })

      // Record subscription usage
      if (pricingType === 'subscription') {
        await subscriptionService.recordUsage(userId, tier, 1)
      }

      return await prisma.backgroundRemovalJob.findUnique({
        where: { id: job.id },
      })
    } catch (error: any) {
      // Update job as failed
      await prisma.backgroundRemovalJob.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          errorMessage: error.message,
          completedAt: new Date(),
        },
      })

      // Refund credits if used
      if (pricingType === 'credit') {
        await creditService.addCredits({
          userId,
          amount: creditsForTier,
          type: 'refund',
          description: 'Background removal failed - refunded'
        })
      }

      throw error
    }
  }

  /**
   * Start batch processing
   */
  async startBatchProcessing(
    userId: string,
    files: Array<{ buffer: Buffer; name: string }>,
    tier: BackgroundRemovalTier
  ) {
    const totalImages = files.length

    // Validate batch size
    if (totalImages === 0) {
      throw new Error('No files provided')
    }
    if (totalImages > 500) {
      throw new Error('Maximum 500 images per batch')
    }

    // Calculate pricing
    const pricing = pricingService.calculateBatchPricing(totalImages, tier)

    // Check subscription
    const quotaCheck = await subscriptionService.checkSubscriptionQuota(
      userId,
      tier,
      totalImages
    )

    let pricingType: 'credit' | 'subscription' = 'credit'

    if (quotaCheck.canUseSubscription) {
      pricingType = 'subscription'
    } else {
      // Deduct credits UPFRONT for batch
      await creditService.deductCredits({
        userId,
        amount: pricing.finalPrice,
        description: 'background_removal_batch',
        referenceType: 'background_removal_batch',
        metadata: {
          appId: 'background-remover',
          action: 'batch_removal',
          tier,
          totalImages,
          discount: pricing.discountPercentage,
        }
      })
    }

    // Generate batch ID
    const batchId = nanoid(12)

    // Create batch record
    const batch = await prisma.backgroundRemovalBatch.create({
      data: {
        userId,
        batchId,
        status: 'pending',
        totalImages,
        tier,
        totalCredits: pricing.finalPrice,
        discountPercentage: pricing.discountPercentage,
        originalPrice: pricing.originalPrice,
        finalPrice: pricing.finalPrice,
      },
    })

    // Save uploaded files and create job records
    const jobItems = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const originalFile = await storageService.saveUploadedFile(
        file.buffer,
        userId,
        file.name
      )

      const job = await prisma.backgroundRemovalJob.create({
        data: {
          userId,
          batchId: batch.id,
          itemIndex: i,
          status: 'pending',
          originalUrl: originalFile.filePath,
          originalSize: originalFile.fileSize,
          tier,
          creditsUsed: pricingType === 'subscription' ? 0 : pricing.creditPerImage,
          pricingType,
        },
      })

      jobItems.push({
        id: job.id,
        itemIndex: i,
        originalUrl: originalFile.filePath,
      })
    }

    // Add to queue
    await addBackgroundRemovalBatchJob({
      batchId: batch.batchId,
      userId,
      tier,
      items: jobItems,
    })

    return batch
  }

  /**
   * Get batch status
   */
  async getBatchStatus(batchId: string, userId: string) {
    const batch = await prisma.backgroundRemovalBatch.findFirst({
      where: {
        batchId,
        userId,
      },
      include: {
        jobs: {
          orderBy: { itemIndex: 'asc' },
        },
      },
    })

    if (!batch) {
      throw new Error('Batch not found')
    }

    return batch
  }

  /**
   * Get user's jobs
   */
  async getUserJobs(userId: string, limit: number = 50) {
    return await prisma.backgroundRemovalJob.findMany({
      where: {
        userId,
        batchId: null, // Only single jobs
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  /**
   * Get user's batches
   */
  async getUserBatches(userId: string, limit: number = 20) {
    return await prisma.backgroundRemovalBatch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        _count: {
          select: { jobs: true },
        },
      },
    })
  }
}

export const backgroundRemoverService = new BackgroundRemoverService()
