import axios from 'axios'
import type { ModelsLabInpaintingParams, ModelsLabResponse } from '../../types'

const MODELSLAB_API_KEY = process.env.MODELSLAB_API_KEY!
const MODELSLAB_BASE_URL = 'https://modelslab.com/api/v6'

export class InpaintingService {
  /**
   * Remove text from poster using ModelsLab Inpainting API
   */
  async removeText(params: ModelsLabInpaintingParams): Promise<ModelsLabResponse> {
    try {
      const response = await axios.post(
        `${MODELSLAB_BASE_URL}/image_editing/inpaint`,
        {
          key: MODELSLAB_API_KEY,
          init_image: params.initImageUrl,
          mask_image: params.maskImageUrl,
          prompt: params.prompt || 'clean background, seamless, high quality, professional',
          negative_prompt:
            params.negativePrompt || 'text, letters, words, watermark, logo, writing',
          strength: params.strength || 0.9,
          num_inference_steps: params.numInferenceSteps || 30,
          guidance_scale: params.guidanceScale || 7.5,
          samples: 1,
          safety_checker: false,
          webhook: params.webhookUrl,
          track_id: Date.now().toString(),
        },
        {
          timeout: 120000, // 2 minutes
        }
      )

      return response.data as ModelsLabResponse
    } catch (error: any) {
      console.error('ModelsLab Inpainting Error:', error.response?.data || error.message)
      throw new Error(`Inpainting failed: ${error.response?.data?.message || error.message}`)
    }
  }

  /**
   * Check status of inpainting job
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
   * Download result image
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
}

export const inpaintingService = new InpaintingService()
