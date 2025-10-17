import axios from 'axios'
import { BackgroundRemovalTier, AIProcessingResult } from '../types'
import backgroundRemoverConfig from '../plugin.config'

/**
 * AIProviderService - HuggingFace API integration
 * All tiers (Basic, Standard, Professional, Industry) use HuggingFace models
 */
class AIProviderService {
  private hfApiKey: string

  constructor() {
    this.hfApiKey = process.env.HUGGINGFACE_API_KEY || ''

    if (!this.hfApiKey) {
      throw new Error('HUGGINGFACE_API_KEY is required')
    }
  }

  /**
   * Remove background from image using specified tier
   * All tiers use HuggingFace models (RMBG-1.4 or RMBG-2.0)
   */
  async removeBackground(
    imageBuffer: Buffer,
    tier: BackgroundRemovalTier
  ): Promise<AIProcessingResult> {
    const startTime = Date.now()
    const tierConfig = backgroundRemoverConfig.tiers[tier]

    if (!tierConfig) {
      throw new Error(`Invalid tier: ${tier}`)
    }

    try {
      // All tiers use HuggingFace - simplified logic
      const processedBuffer = await this.removeBackgroundHuggingFace(
        imageBuffer,
        tierConfig.modelName
      )

      const processingTime = Date.now() - startTime

      // Convert buffer to base64 for temporary storage (or save to disk)
      const processedUrl = `data:image/png;base64,${processedBuffer.toString('base64')}`

      return {
        success: true,
        processedUrl,
        processingTime,
        aiProvider: tierConfig.aiProvider,
        modelName: tierConfig.modelName,
      }
    } catch (error: any) {
      const processingTime = Date.now() - startTime
      console.error('Background removal failed:', error)

      return {
        success: false,
        processingTime,
        aiProvider: tierConfig.aiProvider,
        modelName: tierConfig.modelName,
        error: error.message || 'Background removal failed',
      }
    }
  }

  /**
   * Remove background using HuggingFace (RMBG-1.4, RMBG-2.0)
   * Used by all tiers: Basic, Standard, Professional, Industry
   */
  private async removeBackgroundHuggingFace(
    imageBuffer: Buffer,
    modelName: string
  ): Promise<Buffer> {
    try {
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${modelName}`,
        imageBuffer,
        {
          headers: {
            Authorization: `Bearer ${this.hfApiKey}`,
            'Content-Type': 'application/octet-stream',
          },
          responseType: 'arraybuffer',
          timeout: 60000, // 1 minute
        }
      )

      return Buffer.from(response.data)
    } catch (error: any) {
      // Handle model loading error (cold start)
      if (
        error.response?.data?.error?.includes('loading') ||
        error.response?.status === 503
      ) {
        // Retry once after 20 seconds for cold start
        console.log('Model loading, waiting 20 seconds...')
        await this.sleep(20000)

        const retryResponse = await axios.post(
          `https://api-inference.huggingface.co/models/${modelName}`,
          imageBuffer,
          {
            headers: {
              Authorization: `Bearer ${this.hfApiKey}`,
              'Content-Type': 'application/octet-stream',
            },
            responseType: 'arraybuffer',
            timeout: 60000,
          }
        )

        return Buffer.from(retryResponse.data)
      }

      // Handle rate limit
      if (error.response?.status === 429) {
        throw new Error('HuggingFace rate limit exceeded')
      }

      throw error
    }
  }

  /**
   * Validate image before processing
   */
  validateImage(imageBuffer: Buffer): { valid: boolean; error?: string } {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (imageBuffer.length > maxSize) {
      return {
        valid: false,
        error: 'Image size exceeds 10MB limit',
      }
    }

    // Check if buffer is valid image (basic check)
    const isPNG = imageBuffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    const isJPEG = imageBuffer.slice(0, 2).equals(Buffer.from([0xff, 0xd8]))
    const isWEBP = imageBuffer.slice(0, 4).toString() === 'RIFF'

    if (!isPNG && !isJPEG && !isWEBP) {
      return {
        valid: false,
        error: 'Invalid image format. Only PNG, JPEG, and WEBP are supported',
      }
    }

    return { valid: true }
  }

  /**
   * Health check for HuggingFace API
   */
  async healthCheck(): Promise<{
    huggingface: boolean
  }> {
    const checks = {
      huggingface: false,
    }

    // Check HuggingFace
    try {
      await axios.get('https://api-inference.huggingface.co/models/briaai/RMBG-1.4', {
        headers: {
          Authorization: `Bearer ${this.hfApiKey}`,
        },
        timeout: 10000,
      })
      checks.huggingface = true
    } catch (error) {
      console.error('HuggingFace health check failed')
    }

    return checks
  }

  /**
   * Helper: Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

export const aiProviderService = new AIProviderService()
