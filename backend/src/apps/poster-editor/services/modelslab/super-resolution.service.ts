import axios from 'axios'
import type { ModelsLabSuperResolutionParams, ModelsLabResponse } from '../../types'

const MODELSLAB_API_KEY = process.env.MODELSLAB_API_KEY!
const MODELSLAB_BASE_URL = 'https://modelslab.com/api/v6'

export class SuperResolutionService {
  /**
   * Upscale image using ModelsLab Super Resolution API
   */
  async upscale(params: ModelsLabSuperResolutionParams): Promise<ModelsLabResponse> {
    try {
      const response = await axios.post(
        `${MODELSLAB_BASE_URL}/image_editing/super_resolution`,
        {
          key: MODELSLAB_API_KEY,
          init_image: params.imageUrl,
          scale: params.scale,
          face_enhance: params.faceEnhance || false,
          model_id: params.model || 'realesr-general-x4v3',
          webhook: params.webhookUrl,
          track_id: Date.now().toString(),
        },
        {
          timeout: 120000, // 2 minutes
        }
      )

      return response.data as ModelsLabResponse
    } catch (error: any) {
      console.error('ModelsLab Super Resolution Error:', error.response?.data || error.message)
      throw new Error(
        `Super Resolution failed: ${error.response?.data?.message || error.message}`
      )
    }
  }

  /**
   * Check status of upscaling job
   */
  async checkStatus(fetchUrl: string): Promise<ModelsLabResponse> {
    try {
      const response = await axios.post(fetchUrl, {
        key: MODELSLAB_API_KEY,
      })

      return response.data as ModelsLabResponse
    } catch (error: any) {
      console.error('Status check error:', error.message)
      throw new Error(`Status check failed: ${error.message}`)
    }
  }

  /**
   * Download upscaled image
   */
  async downloadImage(url: string): Promise<Buffer> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 60000,
      })

      return Buffer.from(response.data)
    } catch (error: any) {
      console.error('Image download error:', error.message)
      throw new Error(`Download failed: ${error.message}`)
    }
  }

  /**
   * Get available upscaling models
   */
  getAvailableModels(): string[] {
    return [
      'realesr-general-x4v3', // Default, best quality
      'RealESRGAN_x4plus', // General purpose
      'RealESRGAN_x4plus_anime_6B', // For illustrations/anime
      'RealESRGAN_x2plus', // Faster, 2x only
      'ultra_resolution', // Maximum quality
    ]
  }
}

export const superResolutionService = new SuperResolutionService()
