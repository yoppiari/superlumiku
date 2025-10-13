import { hfClient } from '../../../lib/huggingface-client'
import { createCanvas, loadImage } from 'canvas'
import sharp from 'sharp'

/**
 * Fashion Enhancement Service
 * Phase 3: Add fashion items (hijab, accessories, outfit)
 */
export class FashionEnhancementService {
  /**
   * Add fashion items to generated pose
   */
  async addFashionItems(params: {
    generatedPoseBuffer: Buffer
    fashionSettings: {
      hijab?: { style: string, color: string }
      accessories?: string[] // ['jewelry', 'bag', 'watch', 'sunglasses']
      outfit?: string
    }
  }): Promise<Buffer> {
    let resultBuffer = params.generatedPoseBuffer

    try {
      // 1. Add hijab if specified
      if (params.fashionSettings.hijab) {
        console.log('Adding hijab:', params.fashionSettings.hijab)
        resultBuffer = await this.addHijab(resultBuffer, params.fashionSettings.hijab)
      }

      // 2. Add outfit enhancements if specified
      if (params.fashionSettings.outfit) {
        console.log('Enhancing outfit:', params.fashionSettings.outfit)
        resultBuffer = await this.enhanceOutfit(resultBuffer, params.fashionSettings.outfit)
      }

      // 3. Add accessories if specified
      if (params.fashionSettings.accessories && params.fashionSettings.accessories.length > 0) {
        console.log('Adding accessories:', params.fashionSettings.accessories)
        resultBuffer = await this.addAccessories(resultBuffer, params.fashionSettings.accessories)
      }

      return resultBuffer
    } catch (error: any) {
      console.error('Fashion enhancement failed:', error)
      // Return original on failure
      return params.generatedPoseBuffer
    }
  }

  /**
   * Add hijab using inpainting
   */
  private async addHijab(imageBuffer: Buffer, hijabSettings: { style: string, color: string }): Promise<Buffer> {
    try {
      // Create mask for head/hair region
      const maskBuffer = await this.createHeadMask(imageBuffer)

      // Build inpainting prompt
      const prompt = this.buildHijabPrompt(hijabSettings)

      // Apply inpainting with retry
      const result = await hfClient.withRetry(async () => {
        return await hfClient.inpaintImage({
          inputImage: imageBuffer,
          maskImage: maskBuffer,
          prompt,
          negativePrompt: 'ugly, unnatural, messy, poorly drawn, low quality',
          numInferenceSteps: 30,
          guidanceScale: 7.5
        })
      })

      return result
    } catch (error: any) {
      console.error('Hijab addition failed:', error)
      return imageBuffer // Return original on failure
    }
  }

  /**
   * Build prompt for hijab inpainting
   */
  private buildHijabPrompt(hijabSettings: { style: string, color: string }): string {
    const styleMap: Record<string, string> = {
      'modern': 'modern hijab, neatly wrapped',
      'pashmina': 'pashmina hijab, elegant draping',
      'turban': 'turban style hijab, fashionable',
      'square': 'square hijab, traditional style',
      'instant': 'instant hijab, simple and neat',
      'sport': 'sport hijab, athletic style'
    }

    const styleDesc = styleMap[hijabSettings.style.toLowerCase()] || 'hijab'

    return `wearing ${hijabSettings.color} ${styleDesc}, professional photo, natural lighting, realistic fabric texture, proper shadows, well-fitted, elegant`
  }

  /**
   * Create mask for head region (where hijab will be applied)
   * This is a simplified version - ideally use segmentation model
   */
  private async createHeadMask(imageBuffer: Buffer): Promise<Buffer> {
    // Get image dimensions
    const metadata = await sharp(imageBuffer).metadata()
    const width = metadata.width || 512
    const height = metadata.height || 512

    // Create canvas for mask
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')

    // Fill with black (no inpaint)
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, width, height)

    // Create white (inpaint) region for head/hair area
    // Approximate head region (top 40% of image, center 60% width)
    ctx.fillStyle = '#FFFFFF'
    const headWidth = width * 0.6
    const headHeight = height * 0.4
    const headX = (width - headWidth) / 2
    const headY = 0

    // Draw ellipse for head/hair region
    ctx.beginPath()
    ctx.ellipse(
      width / 2,           // center X
      headHeight / 2,      // center Y
      headWidth / 2,       // radius X
      headHeight / 2,      // radius Y
      0,                   // rotation
      0,                   // start angle
      2 * Math.PI          // end angle
    )
    ctx.fill()

    return canvas.toBuffer('image/png')
  }

  /**
   * Enhance outfit using inpainting
   */
  private async enhanceOutfit(imageBuffer: Buffer, outfitDescription: string): Promise<Buffer> {
    try {
      // Create mask for body region
      const maskBuffer = await this.createBodyMask(imageBuffer)

      const prompt = `wearing ${outfitDescription}, professional photo, high quality fashion, realistic fabric, proper fit, elegant style`

      const result = await hfClient.withRetry(async () => {
        return await hfClient.inpaintImage({
          inputImage: imageBuffer,
          maskImage: maskBuffer,
          prompt,
          negativePrompt: 'ugly, low quality, poorly fitted, wrinkled',
          numInferenceSteps: 30,
          guidanceScale: 7.5
        })
      })

      return result
    } catch (error: any) {
      console.error('Outfit enhancement failed:', error)
      return imageBuffer
    }
  }

  /**
   * Create mask for body region (for outfit enhancement)
   */
  private async createBodyMask(imageBuffer: Buffer): Promise<Buffer> {
    const metadata = await sharp(imageBuffer).metadata()
    const width = metadata.width || 512
    const height = metadata.height || 512

    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')

    // Black background
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, width, height)

    // White region for body (40%-80% height, 40%-60% width)
    ctx.fillStyle = '#FFFFFF'
    const bodyWidth = width * 0.6
    const bodyHeight = height * 0.5
    const bodyX = (width - bodyWidth) / 2
    const bodyY = height * 0.3

    ctx.fillRect(bodyX, bodyY, bodyWidth, bodyHeight)

    return canvas.toBuffer('image/png')
  }

  /**
   * Add accessories (overlay method - simpler than inpainting)
   */
  private async addAccessories(imageBuffer: Buffer, accessories: string[]): Promise<Buffer> {
    // For now, this is a placeholder
    // In production, you would:
    // 1. Use object detection to find where to place accessories
    // 2. Use inpainting or compositing to add them naturally
    // 3. Or use a specialized accessories model

    // Simple enhancement: adjust image properties for jewelry/accessories look
    const enhanced = await sharp(imageBuffer)
      .modulate({
        brightness: 1.05,
        saturation: 1.1
      })
      .toBuffer()

    return enhanced
  }

  /**
   * Batch enhance multiple poses
   */
  async batchEnhance(params: {
    poses: Array<{ id: string, buffer: Buffer }>
    fashionSettings: {
      hijab?: { style: string, color: string }
      accessories?: string[]
      outfit?: string
    }
    onProgress?: (current: number, total: number) => void
  }): Promise<Array<{ id: string, buffer: Buffer, success: boolean }>> {
    const results: Array<{ id: string, buffer: Buffer, success: boolean }> = []

    for (let i = 0; i < params.poses.length; i++) {
      const pose = params.poses[i]

      try {
        const enhanced = await this.addFashionItems({
          generatedPoseBuffer: pose.buffer,
          fashionSettings: params.fashionSettings
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
        console.error(`Failed to enhance pose ${pose.id}:`, error)
        results.push({
          id: pose.id,
          buffer: pose.buffer, // Return original
          success: false
        })
      }

      // Small delay
      if (i < params.poses.length - 1) {
        await this.sleep(500)
      }
    }

    return results
  }

  /**
   * Get available hijab styles
   */
  getAvailableHijabStyles(): string[] {
    return [
      'modern',
      'pashmina',
      'turban',
      'square',
      'instant',
      'sport'
    ]
  }

  /**
   * Get available accessories
   */
  getAvailableAccessories(): string[] {
    return [
      'jewelry',
      'necklace',
      'earrings',
      'bracelet',
      'watch',
      'bag',
      'handbag',
      'clutch',
      'sunglasses',
      'scarf',
      'belt'
    ]
  }

  /**
   * Estimate enhancement time
   */
  estimateEnhancementTime(poseCount: number, settings: {
    hijab?: boolean
    outfit?: boolean
    accessories?: boolean
  }): number {
    let timePerPose = 0

    if (settings.hijab) timePerPose += 15 // seconds
    if (settings.outfit) timePerPose += 15
    if (settings.accessories) timePerPose += 3

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
export const fashionEnhancementService = new FashionEnhancementService()

// Export class
export default FashionEnhancementService
