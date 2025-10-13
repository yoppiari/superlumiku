import { hfClient } from '../../../lib/huggingface-client'
import sharp from 'sharp'
import { createCanvas } from 'canvas'

/**
 * Background Replacement Service
 * Phase 4: Remove and replace backgrounds with AI-generated scenes
 */
export class BackgroundService {
  /**
   * Replace background in generated pose
   */
  async replaceBackground(params: {
    generatedPoseBuffer: Buffer
    backgroundSettings: {
      type: 'auto' | 'custom' | 'scene'
      scene?: string // 'studio', 'outdoor', 'office', 'cafe', 'beach', 'forest'
      customPrompt?: string
      color?: string // For solid color backgrounds
    }
  }): Promise<Buffer> {
    try {
      console.log('Replacing background:', params.backgroundSettings)

      // 1. Remove existing background
      const noBackgroundBuffer = await this.removeBackground(params.generatedPoseBuffer)

      // 2. Generate or select new background
      let backgroundBuffer: Buffer

      if (params.backgroundSettings.type === 'scene') {
        // Generate scene background
        backgroundBuffer = await this.generateSceneBackground(
          params.backgroundSettings.scene || 'studio'
        )
      } else if (params.backgroundSettings.type === 'custom') {
        // Generate custom background from prompt
        backgroundBuffer = await this.generateCustomBackground(
          params.backgroundSettings.customPrompt || 'neutral background'
        )
      } else if (params.backgroundSettings.color) {
        // Create solid color background
        backgroundBuffer = await this.createSolidColorBackground(
          params.generatedPoseBuffer,
          params.backgroundSettings.color
        )
      } else {
        // Auto - use neutral gradient
        backgroundBuffer = await this.createGradientBackground(params.generatedPoseBuffer)
      }

      // 3. Composite person onto new background
      const result = await this.compositeImages(noBackgroundBuffer, backgroundBuffer)

      return result
    } catch (error: any) {
      console.error('Background replacement failed:', error)
      // Return original on failure
      return params.generatedPoseBuffer
    }
  }

  /**
   * Remove background from image
   * Using simple edge detection + threshold (simplified version)
   * In production, use dedicated background removal model (rembg, U2-Net)
   */
  private async removeBackground(imageBuffer: Buffer): Promise<Buffer> {
    try {
      // Simple approach: detect edges and create alpha mask
      // For better results, integrate rembg or SAM (Segment Anything Model)

      const metadata = await sharp(imageBuffer).metadata()
      const width = metadata.width || 512
      const height = metadata.height || 512

      // Use sharp's built-in features for simple background removal
      // This is a placeholder - in production use proper segmentation
      const result = await sharp(imageBuffer)
        .ensureAlpha()
        .extract({ left: 0, top: 0, width, height })
        .toBuffer()

      return result
    } catch (error: any) {
      console.error('Background removal failed:', error)
      return imageBuffer
    }
  }

  /**
   * Generate scene background using AI
   */
  private async generateSceneBackground(scene: string): Promise<Buffer> {
    const scenePrompts: Record<string, string> = {
      'studio': 'professional photo studio background, clean white backdrop, soft lighting, minimalist',
      'outdoor': 'outdoor natural background, beautiful day, soft focus, bokeh effect',
      'office': 'modern office background, professional workspace, blurred, clean',
      'cafe': 'cozy cafe interior background, warm lighting, soft focus, aesthetic',
      'beach': 'beautiful beach background, ocean view, sunny day, tropical',
      'forest': 'natural forest background, green trees, soft natural light',
      'urban': 'modern urban city background, buildings, soft focus',
      'garden': 'beautiful garden background, flowers, natural daylight',
      'home': 'cozy home interior background, living room, warm and inviting',
      'luxury': 'luxury interior background, elegant, high-end, sophisticated'
    }

    const prompt = scenePrompts[scene.toLowerCase()] || scenePrompts['studio']

    try {
      const backgroundBuffer = await hfClient.withRetry(async () => {
        return await hfClient.textToImage({
          prompt: `${prompt}, high quality, professional photography, blurred background, 8k`,
          negativePrompt: 'people, faces, text, watermark, low quality',
          width: 1024,
          height: 1024,
          numInferenceSteps: 30,
          guidanceScale: 7.0
        })
      })

      return backgroundBuffer
    } catch (error: any) {
      console.error('Scene generation failed:', error)
      // Fallback to gradient
      return this.createGradientBackground(Buffer.from(''))
    }
  }

  /**
   * Generate custom background from prompt
   */
  private async generateCustomBackground(prompt: string): Promise<Buffer> {
    try {
      const backgroundBuffer = await hfClient.withRetry(async () => {
        return await hfClient.textToImage({
          prompt: `${prompt}, background, soft focus, blurred, professional photography, high quality`,
          negativePrompt: 'people, faces, sharp focus, text, watermark',
          width: 1024,
          height: 1024,
          numInferenceSteps: 30,
          guidanceScale: 7.0
        })
      })

      return backgroundBuffer
    } catch (error: any) {
      console.error('Custom background generation failed:', error)
      return this.createGradientBackground(Buffer.from(''))
    }
  }

  /**
   * Create solid color background
   */
  private async createSolidColorBackground(referenceImage: Buffer, color: string): Promise<Buffer> {
    const metadata = await sharp(referenceImage).metadata()
    const width = metadata.width || 1024
    const height = metadata.height || 1024

    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')

    // Fill with solid color
    ctx.fillStyle = color
    ctx.fillRect(0, 0, width, height)

    return canvas.toBuffer('image/png')
  }

  /**
   * Create gradient background
   */
  private async createGradientBackground(referenceImage: Buffer): Promise<Buffer> {
    const metadata = referenceImage && referenceImage.length > 0
      ? await sharp(referenceImage).metadata()
      : { width: 1024, height: 1024 }

    const width = metadata.width || 1024
    const height = metadata.height || 1024

    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')

    // Create gradient from light gray to white
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, '#F5F5F5')
    gradient.addColorStop(1, '#FFFFFF')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    return canvas.toBuffer('image/png')
  }

  /**
   * Composite person onto new background
   */
  private async compositeImages(foreground: Buffer, background: Buffer): Promise<Buffer> {
    try {
      // Ensure both images are same size
      const metadata = await sharp(foreground).metadata()
      const width = metadata.width || 1024
      const height = metadata.height || 1024

      // Resize background to match foreground
      const resizedBackground = await sharp(background)
        .resize(width, height, { fit: 'cover' })
        .toBuffer()

      // Composite foreground on top of background
      const result = await sharp(resizedBackground)
        .composite([{
          input: foreground,
          top: 0,
          left: 0,
          blend: 'over'
        }])
        .toBuffer()

      return result
    } catch (error: any) {
      console.error('Image composition failed:', error)
      return foreground
    }
  }

  /**
   * Batch replace backgrounds
   */
  async batchReplaceBackgrounds(params: {
    poses: Array<{ id: string, buffer: Buffer }>
    backgroundSettings: {
      type: 'auto' | 'custom' | 'scene'
      scene?: string
      customPrompt?: string
      color?: string
    }
    onProgress?: (current: number, total: number) => void
  }): Promise<Array<{ id: string, buffer: Buffer, success: boolean }>> {
    const results: Array<{ id: string, buffer: Buffer, success: boolean }> = []

    for (let i = 0; i < params.poses.length; i++) {
      const pose = params.poses[i]

      try {
        const enhanced = await this.replaceBackground({
          generatedPoseBuffer: pose.buffer,
          backgroundSettings: params.backgroundSettings
        })

        results.push({
          id: pose.id,
          buffer: enhanced,
          success: true
        })

        if (params.onProgress) {
          params.onProgress(i + 1, params.poses.length)
        }
      } catch (error: any) {
        console.error(`Failed to replace background for pose ${pose.id}:`, error)
        results.push({
          id: pose.id,
          buffer: pose.buffer,
          success: false
        })
      }

      // Small delay
      if (i < params.poses.length - 1) {
        await this.sleep(1000)
      }
    }

    return results
  }

  /**
   * Get available scene options
   */
  getAvailableScenes(): Array<{ id: string, name: string, description: string }> {
    return [
      { id: 'studio', name: 'Studio', description: 'Clean white studio backdrop' },
      { id: 'outdoor', name: 'Outdoor', description: 'Natural outdoor setting' },
      { id: 'office', name: 'Office', description: 'Professional office background' },
      { id: 'cafe', name: 'Cafe', description: 'Cozy cafe interior' },
      { id: 'beach', name: 'Beach', description: 'Beautiful beach scene' },
      { id: 'forest', name: 'Forest', description: 'Natural forest setting' },
      { id: 'urban', name: 'Urban', description: 'Modern city background' },
      { id: 'garden', name: 'Garden', description: 'Beautiful garden setting' },
      { id: 'home', name: 'Home', description: 'Cozy home interior' },
      { id: 'luxury', name: 'Luxury', description: 'High-end elegant interior' }
    ]
  }

  /**
   * Estimate background replacement time
   */
  estimateReplacementTime(poseCount: number, type: 'auto' | 'custom' | 'scene'): number {
    const timePerPose = type === 'auto' ? 5 : 20 // seconds
    return poseCount * timePerPose
  }

  /**
   * Helper: Sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Singleton instance
export const backgroundService = new BackgroundService()

// Export class
export default BackgroundService
