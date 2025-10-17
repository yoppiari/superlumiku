import { Worker, Job } from 'bullmq'
import { redis, isRedisEnabled } from '../../../lib/redis'
import { prisma } from '../../../db/client'
import { aiProviderService } from '../services/ai-provider.service'
import { storageService } from '../services/storage.service'
import { emailService } from '../services/email.service'
import { subscriptionService } from '../services/subscription.service'
import { BackgroundRemovalTier } from '../types'
import { BackgroundRemovalBatchJob } from '../../../lib/queue'
import os from 'os'
import fs from 'fs/promises'
import path from 'path'

/**
 * Background Removal Batch Worker
 * Processes batches with adaptive concurrency based on CPU cores
 */

// Calculate optimal concurrency
const cpuCount = os.cpus().length
const concurrency = Math.min(Math.max(cpuCount - 1, 5), 20)

console.log(`🔧 Background Remover Worker initialized`)
console.log(`   CPU Cores: ${cpuCount}`)
console.log(`   Concurrency: ${concurrency}`)

let worker: Worker | null = null

if (isRedisEnabled() && redis) {
  worker = new Worker<BackgroundRemovalBatchJob>(
    'background-remover-batch',
    async (job: Job<BackgroundRemovalBatchJob>) => {
      console.log(`\n📦 Processing batch: ${job.data.batchId}`)
      console.log(`   Total items: ${job.data.items.length}`)
      console.log(`   Tier: ${job.data.tier}`)

      const { batchId, userId, tier, items } = job.data

      // Get batch record
      const batch = await prisma.backgroundRemovalBatch.findFirst({
        where: { batchId },
      })

      if (!batch) {
        throw new Error(`Batch ${batchId} not found`)
      }

      // Update batch status
      await prisma.backgroundRemovalBatch.update({
        where: { id: batch.id },
        data: {
          status: 'processing',
          startedAt: new Date(),
        },
      })

      const startTime = Date.now()
      let processedCount = 0
      let failedCount = 0

      // Process items with progress tracking
      for (let i = 0; i < items.length; i++) {
        const item = items[i]

        try {
          // Update job status
          await prisma.backgroundRemovalJob.update({
            where: { id: item.id },
            data: {
              status: 'processing',
              startedAt: new Date(),
            },
          })

          // Load original image
          const originalPath = path.join(process.cwd(), item.originalUrl)
          const imageBuffer = await fs.readFile(originalPath)

          // Process with AI
          const itemStartTime = Date.now()
          const result = await aiProviderService.removeBackground(
            imageBuffer,
            tier as BackgroundRemovalTier
          )

          if (!result.success) {
            throw new Error(result.error)
          }

          // Save processed image
          const processedBuffer = storageService.dataUrlToBuffer(result.processedUrl!)
          const savedFile = await storageService.saveProcessedImage(
            processedBuffer,
            userId,
            item.id
          )

          // Update job as completed
          await prisma.backgroundRemovalJob.update({
            where: { id: item.id },
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

          processedCount++
        } catch (error: any) {
          console.error(`❌ Failed to process item ${item.itemIndex}:`, error.message)

          // Update job as failed
          await prisma.backgroundRemovalJob.update({
            where: { id: item.id },
            data: {
              status: 'failed',
              errorMessage: error.message,
              retryCount: { increment: 1 },
              completedAt: new Date(),
            },
          })

          failedCount++
        }

        // Update batch progress every 5 images
        if ((i + 1) % 5 === 0 || i === items.length - 1) {
          const progress = ((i + 1) / items.length) * 100

          await prisma.backgroundRemovalBatch.update({
            where: { id: batch.id },
            data: {
              processedImages: processedCount,
              failedImages: failedCount,
              progressPercentage: progress,
            },
          })

          // Report progress to BullMQ
          await job.updateProgress(progress)

          console.log(`   Progress: ${progress.toFixed(1)}% (${i + 1}/${items.length})`)
        }
      }

      const processingTime = Date.now() - startTime

      // Create ZIP file from successful jobs
      const successfulJobs = await prisma.backgroundRemovalJob.findMany({
        where: {
          batchId: batch.id,
          status: 'completed',
        },
        orderBy: { itemIndex: 'asc' },
      })

      let zipUrl: string | undefined
      let zipSize: number | undefined

      if (successfulJobs.length > 0) {
        try {
          const zipResult = await storageService.createZipFromBatch(
            batchId,
            successfulJobs.map((j) => ({
              id: j.id,
              processedUrl: j.processedUrl!,
              itemIndex: j.itemIndex!,
            }))
          )

          zipUrl = zipResult.zipPath
          zipSize = zipResult.zipSize

          console.log(`📦 ZIP created: ${zipUrl} (${(zipSize / 1024 / 1024).toFixed(2)}MB)`)
        } catch (error) {
          console.error('Failed to create ZIP:', error)
        }
      }

      // Determine final status
      const finalStatus =
        failedCount === 0 ? 'completed' : processedCount === 0 ? 'failed' : 'partial'

      // Update batch as completed
      await prisma.backgroundRemovalBatch.update({
        where: { id: batch.id },
        data: {
          status: finalStatus,
          processedImages: processedCount,
          failedImages: failedCount,
          progressPercentage: 100,
          processingTimeMs: processingTime,
          zipUrl,
          zipSize,
          zipGenerated: !!zipUrl,
          completedAt: new Date(),
        },
      })

      // Record subscription usage if applicable
      const firstJob = await prisma.backgroundRemovalJob.findFirst({
        where: { batchId: batch.id },
      })

      if (firstJob?.pricingType === 'subscription' && processedCount > 0) {
        await subscriptionService.recordUsage(userId, tier as BackgroundRemovalTier, processedCount)
      }

      // Send email notification
      if (zipUrl) {
        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (user?.email) {
          await emailService.sendBatchCompletionEmail(user.email, batchId, {
            totalImages: items.length,
            processedImages: processedCount,
            failedImages: failedCount,
            zipUrl,
          })
        }
      }

      console.log(`✅ Batch ${batchId} completed`)
      console.log(`   Processed: ${processedCount}`)
      console.log(`   Failed: ${failedCount}`)
      console.log(`   Time: ${(processingTime / 1000).toFixed(2)}s`)

      return {
        batchId,
        status: finalStatus,
        processedCount,
        failedCount,
        processingTime,
        zipUrl,
      }
    },
    {
      connection: redis,
      concurrency, // Adaptive concurrency based on CPU
      limiter: {
        max: concurrency * 2, // Max jobs per interval
        duration: 1000, // 1 second
      },
    }
  )

  // Event handlers
  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed successfully`)
  })

  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message)
  })

  worker.on('error', (err) => {
    console.error('❌ Worker error:', err)
  })

  console.log(`✅ Background Remover Worker started`)
  console.log(`   Listening on queue: background-remover-batch`)
} else {
  console.warn('⚠️  Redis not configured - Worker will not start')
  console.warn('   See TODO_REDIS_SETUP.md for setup instructions')
}

export { worker }
