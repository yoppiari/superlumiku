import { HfInference } from '@huggingface/inference'
import axios from 'axios'

/**
 * HuggingFace API Client Wrapper
 * Provides unified interface for all HF model interactions
 */
export class HuggingFaceClient {
  private hf: HfInference
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.HUGGINGFACE_API_KEY || ''

    if (!this.apiKey) {
      throw new Error('HUGGINGFACE_API_KEY is required')
    }

    this.hf = new HfInference(this.apiKey)
  }

  /**
   * Generate image using ControlNet with pose conditioning
   * Used for Phase 1: Pose Generation
   */
  async controlNetImageToImage(params: {
    inputImage: Buffer
    controlImage: Buffer
    prompt: string
    negativePrompt?: string
    numInferenceSteps?: number
    guidanceScale?: number
    controlnetConditioningScale?: number
    seed?: number
    modelId?: string
  }): Promise<Buffer> {
    const modelId = params.modelId || process.env.CONTROLNET_MODEL_SD || 'lllyasviel/control_v11p_sd15_openpose'

    try {
      // HuggingFace Inference API for ControlNet
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${modelId}`,
        {
          inputs: params.inputImage.toString('base64'),
          parameters: {
            prompt: params.prompt,
            negative_prompt: params.negativePrompt || 'ugly, blurry, low quality, distorted, deformed',
            num_inference_steps: params.numInferenceSteps || 30,
            guidance_scale: params.guidanceScale || 7.5,
            controlnet_conditioning_scale: params.controlnetConditioningScale || 1.0,
            control_image: params.controlImage.toString('base64'),
            seed: params.seed || Math.floor(Math.random() * 1000000)
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer',
          timeout: 120000 // 2 minutes
        }
      )

      return Buffer.from(response.data)
    } catch (error: any) {
      // Handle model loading error (cold start)
      if (error.response?.data?.error?.includes('loading')) {
        throw new Error('MODEL_LOADING')
      }

      // Handle rate limit
      if (error.response?.status === 429) {
        throw new Error('RATE_LIMIT_EXCEEDED')
      }

      throw error
    }
  }

  /**
   * Generate avatar from text prompt using SDXL
   * Used for Phase 2: Text-to-Avatar
   */
  async textToImage(params: {
    prompt: string
    negativePrompt?: string
    width?: number
    height?: number
    numInferenceSteps?: number
    guidanceScale?: number
    seed?: number
    modelId?: string
  }): Promise<Buffer> {
    const modelId = params.modelId || process.env.SDXL_MODEL || 'stabilityai/stable-diffusion-xl-base-1.0'

    try {
      const response = await this.hf.textToImage({
        model: modelId,
        inputs: params.prompt,
        parameters: {
          negative_prompt: params.negativePrompt || 'ugly, blurry, low quality, distorted',
          width: params.width || 1024,
          height: params.height || 1024,
          num_inference_steps: params.numInferenceSteps || 50,
          guidance_scale: params.guidanceScale || 7.5
        }
      })

      return Buffer.from(await response.arrayBuffer())
    } catch (error: any) {
      if (error.message?.includes('loading')) {
        throw new Error('MODEL_LOADING')
      }
      throw error
    }
  }

  /**
   * Generate ultra-realistic avatar using FLUX + Realism LoRA
   * Used for high-quality portrait generation
   */
  async fluxTextToImage(params: {
    prompt: string
    negativePrompt?: string
    width?: number
    height?: number
    numInferenceSteps?: number
    guidanceScale?: number
    seed?: number
    useLoRA?: boolean
    loraScale?: number
  }): Promise<Buffer> {
    const modelId = process.env.FLUX_MODEL || 'black-forest-labs/FLUX.1-dev'
    const loraModel = process.env.FLUX_LORA_MODEL || 'XLabs-AI/flux-RealismLora'

    try {
      // FLUX with LoRA support via direct API call
      const requestBody: any = {
        inputs: params.prompt,
        parameters: {
          negative_prompt: params.negativePrompt || 'ugly, blurry, low quality, distorted, deformed, bad anatomy',
          width: params.width || 1024,
          height: params.height || 1024,
          num_inference_steps: params.numInferenceSteps || 30,
          guidance_scale: params.guidanceScale || 3.5, // FLUX works better with lower guidance
        }
      }

      // Add LoRA if requested
      if (params.useLoRA !== false) { // Default true
        requestBody.parameters.lora = loraModel
        requestBody.parameters.lora_scale = params.loraScale || 0.9 // LoRA strength
      }

      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${modelId}`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer',
          timeout: 180000 // 3 minutes for FLUX (slower than SDXL)
        }
      )

      return Buffer.from(response.data)
    } catch (error: any) {
      // Handle model loading error (cold start)
      if (error.response?.data?.error?.includes('loading') ||
          error.response?.data?.error?.includes('currently loading')) {
        throw new Error('MODEL_LOADING')
      }

      // Handle rate limit
      if (error.response?.status === 429) {
        throw new Error('RATE_LIMIT_EXCEEDED')
      }

      // Handle timeout
      if (error.code === 'ECONNABORTED') {
        throw new Error('GENERATION_TIMEOUT')
      }

      console.error('FLUX generation error:', error.response?.data || error.message)
      throw error
    }
  }

  /**
   * Inpaint image (add elements like hijab, accessories)
   * Used for Phase 3: Fashion Enhancement
   */
  async inpaintImage(params: {
    inputImage: Buffer
    maskImage: Buffer
    prompt: string
    negativePrompt?: string
    numInferenceSteps?: number
    guidanceScale?: number
    modelId?: string
  }): Promise<Buffer> {
    const modelId = params.modelId || process.env.INPAINTING_MODEL || 'runwayml/stable-diffusion-inpainting'

    try {
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${modelId}`,
        {
          inputs: {
            image: params.inputImage.toString('base64'),
            mask: params.maskImage.toString('base64')
          },
          parameters: {
            prompt: params.prompt,
            negative_prompt: params.negativePrompt || 'ugly, blurry, unnatural',
            num_inference_steps: params.numInferenceSteps || 30,
            guidance_scale: params.guidanceScale || 7.5
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer',
          timeout: 120000
        }
      )

      return Buffer.from(response.data)
    } catch (error: any) {
      if (error.response?.data?.error?.includes('loading')) {
        throw new Error('MODEL_LOADING')
      }
      throw error
    }
  }

  /**
   * Retry wrapper with exponential backoff
   * Handles model cold-start and transient errors
   */
  async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error: any) {
        lastError = error

        // Model loading - retry with exponential backoff
        if (error.message === 'MODEL_LOADING') {
          const delay = baseDelay * Math.pow(2, attempt)
          console.log(`Model loading, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`)
          await this.sleep(delay)
          continue
        }

        // Rate limit - wait longer
        if (error.message === 'RATE_LIMIT_EXCEEDED') {
          const delay = 60000 // 1 minute
          console.log(`Rate limit exceeded, waiting ${delay}ms`)
          await this.sleep(delay)
          continue
        }

        // Other errors - don't retry
        throw error
      }
    }

    throw lastError || new Error('Max retries exceeded')
  }

  /**
   * Helper: Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Check API health
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try a simple request to verify API key works
      await axios.get('https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: 10000
      })
      return true
    } catch {
      return false
    }
  }
}

// Singleton instance
export const hfClient = new HuggingFaceClient()

// Export for testing/custom instances
export default HuggingFaceClient
