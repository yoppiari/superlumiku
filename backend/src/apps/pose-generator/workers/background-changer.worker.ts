/**
 * Background Changer Worker
 *
 * Phase 3: Advanced Features - Background Replacement
 *
 * This worker processes background change requests for generated poses.
 * It supports three modes:
 * 1. AI Generate: Uses FLUX API to generate a new background from text prompt
 * 2. Solid Color: Fills background with a solid color
 * 3. Upload: Composites with a user-uploaded background image
 *
 * Processing Steps:
 * 1. Load original pose image from storage
 * 2. Remove background (using REMBG or similar - currently mocked)
 * 3. Apply new background based on selected mode
 * 4. Save the new image to storage
 * 5. Update pose record with new image URL
 * 6. Refund credits on failure (10 credits per pose)
 *
 * Error Handling:
 * - All errors are caught and logged
 * - Credits are refunded if background change fails
 * - Pose status is updated to reflect failure
 * - WebSocket notifications sent for real-time updates
 *
 * @module workers/background-changer
 */

import { Job, Worker } from 'bullmq'
import sharp from 'sharp'
import axios from 'axios'
import prisma from '../../../db/client'
import { poseStorageService } from '../services/storage.service'
import { creditsService } from '../../../services/credits.service'
import { fluxApiService } from '../services/flux-api.service'
import { redisConnection } from '../queue/queue.config'
import type { BackgroundChangeJob } from '../queue/queue.config'

/**
 * Background Changer Worker Class
 *
 * Processes background change jobs from the queue.
 * Each job represents a single pose background replacement.
 */
export class BackgroundChangerWorker {
  private worker: Worker<BackgroundChangeJob>

  constructor() {
    this.worker = new Worker<BackgroundChangeJob>(
      'background-changer',
      async (job: Job<BackgroundChangeJob>) => {
        return await this.processJob(job)
      },
      {
        connection: redisConnection,
        concurrency: 3, // Process 3 background changes in parallel
        limiter: {
          max: 10, // Max 10 jobs per minute
          duration: 60 * 1000,
        },
      }
    )

    // Event handlers
    this.worker.on('completed', (job) => {
      console.log(`[Background Changer] Job ${job.id} completed`)
    })

    this.worker.on('failed', (job, error) => {
      console.error(`[Background Changer] Job ${job?.id} failed:`, error)
    })

    this.worker.on('error', (error) => {
      console.error('[Background Changer] Worker error:', error)
    })

    console.log('[Background Changer] Worker initialized')
  }

  /**
   * Process a background change job
   *
   * Main worker processing logic. Handles all three background modes
   * and manages credits, storage, and database updates.
   *
   * @param job - BullMQ job with background change data
   */
  private async processJob(job: Job<BackgroundChangeJob>): Promise<void> {
    const {
      poseId,
      userId,
      generationId,
      backgroundMode,
      backgroundPrompt,
      backgroundColor,
      backgroundImageUrl,
      originalImageUrl,
      creditCharged,
    } = job.data

    console.log(`[Background Changer] Processing pose ${poseId} (mode: ${backgroundMode})`)

    try {
      // Step 1: Load original image from storage
      const originalImageBuffer = await this.loadImageFromStorage(originalImageUrl)

      // Step 2: Remove background from original image
      // TODO: Integrate with REMBG API for production
      // For now, we'll use a mock that assumes background removal
      const foregroundBuffer = await this.removeBackground(originalImageBuffer)

      // Step 3: Generate/load new background based on mode
      let backgroundBuffer: Buffer

      switch (backgroundMode) {
        case 'ai_generate':
          if (!backgroundPrompt) {
            throw new Error('Background prompt is required for AI generate mode')
          }
          backgroundBuffer = await this.generateAiBackground(backgroundPrompt)
          break

        case 'solid_color':
          if (!backgroundColor) {
            throw new Error('Background color is required for solid color mode')
          }
          backgroundBuffer = await this.createSolidColorBackground(
            backgroundColor,
            foregroundBuffer
          )
          break

        case 'upload':
          if (!backgroundImageUrl) {
            throw new Error('Background image URL is required for upload mode')
          }
          backgroundBuffer = await this.loadImageFromStorage(backgroundImageUrl)
          break

        default:
          throw new Error(`Invalid background mode: ${backgroundMode}`)
      }

      // Step 4: Composite foreground onto new background
      const finalImageBuffer = await this.compositeImages(foregroundBuffer, backgroundBuffer)

      // Step 5: Save the new image to storage
      const result = await poseStorageService.savePoseWithThumbnail({
        imageBuffer: finalImageBuffer,
        generationId,
        poseId: `${poseId}_bg`,
      })

      // Step 6: Update pose record in database
      await prisma.generatedPose.update({
        where: { id: poseId },
        data: {
          outputImageUrl: result.imageUrl,
          thumbnailUrl: result.thumbnailUrl,
          backgroundChanged: true,
          backgroundPrompt: backgroundPrompt || null,
        },
      })

      console.log(`[Background Changer] Successfully processed pose ${poseId}`)

      // Step 7: Send WebSocket notification (best effort)
      await this.notifyCompletion(userId, poseId, result.imageUrl)
    } catch (error) {
      console.error(`[Background Changer] Failed to process pose ${poseId}:`, error)

      // Refund credits on failure
      if (creditCharged > 0) {
        await creditsService.refund({
          userId,
          amount: creditCharged,
          reason: `Background change failed for pose ${poseId}`,
          referenceId: poseId,
          metadata: {
            generationId,
            poseId,
            backgroundMode,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        })

        console.log(`[Background Changer] Refunded ${creditCharged} credits to user ${userId}`)
      }

      // Update pose record to reflect failure
      await prisma.generatedPose.update({
        where: { id: poseId },
        data: {
          errorMessage: error instanceof Error ? error.message : 'Background change failed',
        },
      })

      // Send failure notification
      await this.notifyFailure(userId, poseId, error instanceof Error ? error.message : 'Unknown error')

      throw error // Re-throw to mark job as failed
    }
  }

  /**
   * Load image from storage URL
   *
   * Handles both local storage and remote URLs.
   *
   * @param imageUrl - Image URL or file path
   * @returns Image buffer
   */
  private async loadImageFromStorage(imageUrl: string): Promise<Buffer> {
    try {
      // If it's a local path, read from storage service
      if (imageUrl.startsWith('/uploads/')) {
        const filePath = poseStorageService.resolveToFilePath(imageUrl)
        return await poseStorageService.readLocal(
          filePath.replace(process.env.UPLOAD_PATH || '/app/backend/uploads', '').substring(1)
        )
      }

      // Otherwise, download from URL
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 second timeout
      })

      return Buffer.from(response.data)
    } catch (error) {
      console.error(`[Background Changer] Failed to load image from ${imageUrl}:`, error)
      throw new Error(`Failed to load image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Remove background from image
   *
   * TODO: PRODUCTION - Integrate with REMBG API
   *
   * Current implementation is a MOCK for Phase 3 demonstration.
   * In production, this should call a background removal service like:
   * - rembg (https://github.com/danielgatis/rembg)
   * - remove.bg API
   * - Custom trained model
   *
   * Integration steps for production:
   * 1. Set up REMBG service (Docker container or API endpoint)
   * 2. Update this method to call REMBG API
   * 3. Handle transparency properly (PNG with alpha channel)
   * 4. Add caching for repeated background removals
   *
   * @param imageBuffer - Original image buffer
   * @returns Image buffer with background removed (RGBA PNG)
   */
  private async removeBackground(imageBuffer: Buffer): Promise<Buffer> {
    console.log('[Background Changer] Removing background (MOCK - TODO: Integrate REMBG)')

    // MOCK: For now, just return the original image with slight processing
    // This simulates background removal without actually implementing it
    try {
      // Convert to RGBA PNG to simulate transparency
      const processedImage = await sharp(imageBuffer)
        .ensureAlpha() // Add alpha channel if missing
        .png()
        .toBuffer()

      // TODO: Replace this with actual REMBG API call:
      // const response = await axios.post('http://rembg-service:5000/api/remove', {
      //   image: imageBuffer.toString('base64')
      // })
      // return Buffer.from(response.data.image, 'base64')

      return processedImage
    } catch (error) {
      console.error('[Background Changer] Background removal failed:', error)
      throw new Error(`Background removal failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate AI background using FLUX API
   *
   * Uses the FLUX API service to generate a background from text prompt.
   *
   * @param prompt - Text description of desired background
   * @returns Generated background image buffer
   */
  private async generateAiBackground(prompt: string): Promise<Buffer> {
    console.log(`[Background Changer] Generating AI background: "${prompt}"`)

    try {
      // Enhance prompt for better background generation
      const enhancedPrompt = `Professional photography background: ${prompt}, high quality, 8K, blurred foreground, depth of field`

      // Generate background using FLUX API
      const result = await fluxApiService.generateImage({
        prompt: enhancedPrompt,
        width: 1024,
        height: 1024,
        numInferenceSteps: 30,
        guidanceScale: 7.5,
      })

      // Download the generated image
      const response = await axios.get(result.url, {
        responseType: 'arraybuffer',
        timeout: 60000, // 60 second timeout
      })

      return Buffer.from(response.data)
    } catch (error) {
      console.error('[Background Changer] AI background generation failed:', error)
      throw new Error(`AI background generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Create solid color background
   *
   * Generates a solid color background matching the foreground dimensions.
   *
   * @param hexColor - Hex color code (e.g., "#FF5733")
   * @param foregroundBuffer - Foreground image to match dimensions
   * @returns Solid color background buffer
   */
  private async createSolidColorBackground(
    hexColor: string,
    foregroundBuffer: Buffer
  ): Promise<Buffer> {
    console.log(`[Background Changer] Creating solid color background: ${hexColor}`)

    try {
      // Get foreground dimensions
      const foregroundMeta = await sharp(foregroundBuffer).metadata()
      const width = foregroundMeta.width || 1024
      const height = foregroundMeta.height || 1024

      // Parse hex color to RGB
      const hex = hexColor.replace('#', '')
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)

      // Create solid color image
      const colorBuffer = await sharp({
        create: {
          width,
          height,
          channels: 3,
          background: { r, g, b },
        },
      })
        .png()
        .toBuffer()

      return colorBuffer
    } catch (error) {
      console.error('[Background Changer] Solid color background creation failed:', error)
      throw new Error(`Solid color background failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Composite foreground onto background
   *
   * Combines the background-removed foreground with the new background.
   *
   * @param foregroundBuffer - Foreground image (RGBA PNG)
   * @param backgroundBuffer - Background image (RGB or RGBA)
   * @returns Composited final image
   */
  private async compositeImages(
    foregroundBuffer: Buffer,
    backgroundBuffer: Buffer
  ): Promise<Buffer> {
    console.log('[Background Changer] Compositing foreground onto background')

    try {
      // Get dimensions of both images
      const foregroundMeta = await sharp(foregroundBuffer).metadata()
      const backgroundMeta = await sharp(backgroundBuffer).metadata()

      // Resize background to match foreground dimensions if needed
      let processedBackground = backgroundBuffer
      if (
        backgroundMeta.width !== foregroundMeta.width ||
        backgroundMeta.height !== foregroundMeta.height
      ) {
        processedBackground = await sharp(backgroundBuffer)
          .resize(foregroundMeta.width, foregroundMeta.height, {
            fit: 'cover',
            position: 'center',
          })
          .png()
          .toBuffer()
      }

      // Composite foreground onto background
      const compositedImage = await sharp(processedBackground)
        .composite([
          {
            input: foregroundBuffer,
            blend: 'over', // Alpha blending
          },
        ])
        .png({ quality: 95 })
        .toBuffer()

      return compositedImage
    } catch (error) {
      console.error('[Background Changer] Image compositing failed:', error)
      throw new Error(`Image compositing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Send WebSocket notification on completion
   *
   * Notifies the user that background change is complete.
   *
   * @param userId - User ID to notify
   * @param poseId - Pose ID that was processed
   * @param newImageUrl - New image URL
   */
  private async notifyCompletion(
    userId: string,
    poseId: string,
    newImageUrl: string
  ): Promise<void> {
    try {
      // Publish to Redis pub/sub for WebSocket delivery
      await redisConnection.publish(
        `pose-generator:${userId}`,
        JSON.stringify({
          type: 'background_change_complete',
          poseId,
          imageUrl: newImageUrl,
          timestamp: new Date().toISOString(),
        })
      )
    } catch (error) {
      // Non-critical - just log the error
      console.warn('[Background Changer] Failed to send WebSocket notification:', error)
    }
  }

  /**
   * Send WebSocket notification on failure
   *
   * Notifies the user that background change failed.
   *
   * @param userId - User ID to notify
   * @param poseId - Pose ID that failed
   * @param errorMessage - Error message
   */
  private async notifyFailure(
    userId: string,
    poseId: string,
    errorMessage: string
  ): Promise<void> {
    try {
      await redisConnection.publish(
        `pose-generator:${userId}`,
        JSON.stringify({
          type: 'background_change_failed',
          poseId,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        })
      )
    } catch (error) {
      console.warn('[Background Changer] Failed to send failure notification:', error)
    }
  }

  /**
   * Gracefully close the worker
   */
  async close(): Promise<void> {
    await this.worker.close()
    console.log('[Background Changer] Worker closed')
  }
}

// ========================================
// SINGLETON INSTANCE
// ========================================

let workerInstance: BackgroundChangerWorker | null = null

/**
 * Initialize the background changer worker
 *
 * Call this during application startup.
 */
export function initBackgroundChangerWorker(): BackgroundChangerWorker {
  if (!workerInstance) {
    workerInstance = new BackgroundChangerWorker()
  }
  return workerInstance
}

/**
 * Get the background changer worker instance
 */
export function getBackgroundChangerWorker(): BackgroundChangerWorker | null {
  return workerInstance
}

/**
 * Close the background changer worker
 */
export async function closeBackgroundChangerWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.close()
    workerInstance = null
  }
}
