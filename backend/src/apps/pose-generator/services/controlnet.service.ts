import { createCanvas, loadImage, Image as CanvasImage } from 'canvas'
import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'
import { hfClient } from '../../../lib/huggingface-client'

/**
 * ControlNet Service for Pose Generation
 * Phase 1: Core AI Integration
 */
export class ControlNetService {
  /**
   * Generate pose using ControlNet
   * Takes avatar image and applies pose skeleton to create new pose
   */
  async generatePose(params: {
    avatarImagePath: string
    poseKeypoints: any // OpenPose format keypoints
    prompt: string
    negativePrompt?: string
    quality?: 'sd' | 'hd'
    seed?: number
  }): Promise<Buffer> {
    try {
      // 1. Load and prepare avatar image
      const avatarBuffer = await this.prepareAvatarImage(params.avatarImagePath, params.quality)

      // 2. Render pose skeleton from keypoints
      const poseSkeletonBuffer = await this.renderPoseSkeleton(params.poseKeypoints, params.quality)

      // 3. Enhance prompt for better results
      const enhancedPrompt = this.enhancePrompt(params.prompt, params.quality)

      // 4. Call ControlNet API with retry
      const resultBuffer = await hfClient.withRetry(async () => {
        return await hfClient.controlNetImageToImage({
          inputImage: avatarBuffer,
          controlImage: poseSkeletonBuffer,
          prompt: enhancedPrompt,
          negativePrompt: params.negativePrompt,
          numInferenceSteps: params.quality === 'hd' ? 50 : 30,
          guidanceScale: 7.5,
          controlnetConditioningScale: 1.0,
          seed: params.seed,
          modelId: params.quality === 'hd'
            ? process.env.CONTROLNET_MODEL_HD
            : process.env.CONTROLNET_MODEL_SD
        })
      })

      // 5. Post-process: upscale if needed
      if (params.quality === 'hd') {
        return await this.upscaleImage(resultBuffer)
      }

      return resultBuffer
    } catch (error: any) {
      console.error('ControlNet generation failed:', error)
      throw new Error(`Pose generation failed: ${error.message}`)
    }
  }

  /**
   * Prepare avatar image for ControlNet
   * Resize and optimize for best results
   */
  private async prepareAvatarImage(imagePath: string, quality?: 'sd' | 'hd'): Promise<Buffer> {
    const targetSize = quality === 'hd' ? 1024 : 512

    const imageBuffer = await fs.readFile(imagePath)

    return await sharp(imageBuffer)
      .resize(targetSize, targetSize, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 95 })
      .toBuffer()
  }

  /**
   * Render pose skeleton from OpenPose keypoints
   * Creates a visual representation of the pose for ControlNet conditioning
   */
  private async renderPoseSkeleton(keypoints: any, quality?: 'sd' | 'hd'): Promise<Buffer> {
    const size = quality === 'hd' ? 1024 : 512
    const canvas = createCanvas(size, size)
    const ctx = canvas.getContext('2d')

    // Fill with white background
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, size, size)

    // Parse keypoints if string
    const keypointsData = typeof keypoints === 'string' ? JSON.parse(keypoints) : keypoints

    // OpenPose 18 keypoints connections (body skeleton)
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],    // Head to right arm
      [1, 5], [5, 6], [6, 7],            // Head to left arm
      [1, 8], [8, 9], [9, 10],           // Torso to right leg
      [1, 11], [11, 12], [12, 13],       // Torso to left leg
      [0, 14], [14, 16],                 // Head to right eye/ear
      [0, 15], [15, 17]                  // Head to left eye/ear
    ]

    // Draw skeleton connections
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = Math.floor(size / 128) // Scale line width with image size
    ctx.lineCap = 'round'

    for (const [startIdx, endIdx] of connections) {
      const start = keypointsData[startIdx]
      const end = keypointsData[endIdx]

      if (start && end && start.confidence > 0.1 && end.confidence > 0.1) {
        ctx.beginPath()
        ctx.moveTo(start.x * size, start.y * size)
        ctx.lineTo(end.x * size, end.y * size)
        ctx.stroke()
      }
    }

    // Draw keypoints (joints)
    ctx.fillStyle = '#FF0000'
    const pointRadius = Math.floor(size / 64)

    for (const point of keypointsData) {
      if (point && point.confidence > 0.1) {
        ctx.beginPath()
        ctx.arc(point.x * size, point.y * size, pointRadius, 0, 2 * Math.PI)
        ctx.fill()
      }
    }

    // Convert canvas to buffer
    return canvas.toBuffer('image/png')
  }

  /**
   * Enhance prompt for better ControlNet results
   */
  private enhancePrompt(basePrompt: string, quality?: 'sd' | 'hd'): string {
    const qualityTerms = quality === 'hd'
      ? '4k, 8k, ultra detailed, sharp focus, professional photography'
      : 'high quality, detailed, professional photo'

    return `${basePrompt}, ${qualityTerms}, natural lighting, realistic, photorealistic`
  }

  /**
   * Upscale image for HD quality
   */
  private async upscaleImage(imageBuffer: Buffer): Promise<Buffer> {
    return await sharp(imageBuffer)
      .resize(2048, 2048, {
        kernel: sharp.kernel.lanczos3,
        fit: 'inside'
      })
      .sharpen()
      .toBuffer()
  }

  /**
   * Batch generate multiple poses
   * Optimized for processing many poses at once
   */
  async batchGeneratePoses(params: {
    avatarImagePath: string
    poseTemplates: Array<{ id: string, keypointsJson: string }>
    basePrompt: string
    negativePrompt?: string
    quality?: 'sd' | 'hd'
    onProgress?: (current: number, total: number) => void
  }): Promise<Array<{ templateId: string, buffer: Buffer, success: boolean, error?: string }>> {
    const results: Array<{ templateId: string, buffer: Buffer, success: boolean, error?: string }> = []

    for (let i = 0; i < params.poseTemplates.length; i++) {
      const template = params.poseTemplates[i]

      try {
        const buffer = await this.generatePose({
          avatarImagePath: params.avatarImagePath,
          poseKeypoints: template.keypointsJson,
          prompt: params.basePrompt,
          negativePrompt: params.negativePrompt,
          quality: params.quality
        })

        results.push({
          templateId: template.id,
          buffer,
          success: true
        })

        // Call progress callback
        if (params.onProgress) {
          params.onProgress(i + 1, params.poseTemplates.length)
        }
      } catch (error: any) {
        console.error(`Failed to generate pose for template ${template.id}:`, error)
        results.push({
          templateId: template.id,
          buffer: Buffer.from(''), // Empty buffer
          success: false,
          error: error.message
        })
      }

      // Small delay to avoid rate limiting
      if (i < params.poseTemplates.length - 1) {
        await this.sleep(1000) // 1 second between poses
      }
    }

    return results
  }

  /**
   * Estimate generation time
   */
  estimateGenerationTime(poseCount: number, quality: 'sd' | 'hd'): number {
    const baseTime = quality === 'hd' ? 45 : 25 // seconds per pose
    return poseCount * baseTime
  }

  /**
   * Helper: Sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Singleton instance
export const controlNetService = new ControlNetService()

// Export class for custom instances
export default ControlNetService
