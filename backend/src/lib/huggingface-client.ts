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
   * Generate ultra-realistic avatar using FLUX
   * Used for high-quality portrait generation
   *
   * NOTE: HuggingFace Inference API does NOT support LoRA parameters.
   * LoRA support requires ComfyUI, Replicate, or custom endpoints.
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

    try {
      // CRITICAL: HuggingFace Inference API does NOT support LoRA parameters
      // Removed lora and lora_scale to fix 400 error
      const requestBody: any = {
        inputs: params.prompt,
        parameters: {
          width: params.width || 1024,
          height: params.height || 1024,
          num_inference_steps: params.numInferenceSteps || 30,
          guidance_scale: params.guidanceScale || 3.5, // FLUX works better with lower guidance
        }
      }

      // Add negative prompt only if provided (some FLUX models don't support it)
      if (params.negativePrompt) {
        requestBody.parameters.negative_prompt = params.negativePrompt
      }

      // Add seed if provided
      if (params.seed !== undefined) {
        requestBody.parameters.seed = params.seed
      }

      console.log(`🎨 FLUX Generation Request:`)
      console.log(`   Model: ${modelId}`)
      console.log(`   Prompt: ${params.prompt.substring(0, 100)}...`)
      console.log(`   Parameters:`, requestBody.parameters)

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

      console.log(`✅ FLUX generation successful (${response.data.byteLength} bytes)`)
      return Buffer.from(response.data)
    } catch (error: any) {
      // Enhanced error logging
      console.error('❌ FLUX generation error:')
      console.error('   Status:', error.response?.status)
      console.error('   Status Text:', error.response?.statusText)
      console.error('   Error Data:', JSON.stringify(error.response?.data, null, 2))
      console.error('   Error Message:', error.message)

      // Try to parse error response if it's a buffer
      if (error.response?.data instanceof ArrayBuffer || Buffer.isBuffer(error.response?.data)) {
        try {
          const errorText = Buffer.from(error.response.data).toString('utf-8')
          console.error('   Parsed Error:', errorText)
        } catch (e) {
          console.error('   Could not parse error data')
        }
      }

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

      // Handle 400 Bad Request - try fallback to FLUX.1-schnell
      if (error.response?.status === 400 && modelId.includes('FLUX.1-dev')) {
        console.log('⚠️  FLUX.1-dev failed, trying FLUX.1-schnell fallback...')
        return this.fluxSchnellFallback(params)
      }

      throw error
    }
  }

  /**
   * Fallback to FLUX.1-schnell (free tier model)
   * Used when FLUX.1-dev returns 400 (may require PRO subscription)
   */
  private async fluxSchnellFallback(params: {
    prompt: string
    negativePrompt?: string
    width?: number
    height?: number
    numInferenceSteps?: number
    guidanceScale?: number
    seed?: number
  }): Promise<Buffer> {
    const modelId = 'black-forest-labs/FLUX.1-schnell'

    console.log(`🔄 Using FLUX.1-schnell fallback (free tier)`)

    const requestBody: any = {
      inputs: params.prompt,
      parameters: {
        width: params.width || 1024,
        height: params.height || 1024,
        num_inference_steps: 4, // Schnell uses 4 steps
        guidance_scale: 0, // Schnell doesn't use guidance
      }
    }

    // Schnell doesn't support negative prompts well
    if (params.seed !== undefined) {
      requestBody.parameters.seed = params.seed
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
        timeout: 180000
      }
    )

    console.log(`✅ FLUX.1-schnell fallback successful`)
    return Buffer.from(response.data)
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
   * Generate avatar with PhotoMaker V2 (identity-preserving)
   * Upload 1-4 photos + text prompt → studio-quality portrait
   */
  async photoMakerGeneration(params: {
    inputPhotos: Buffer[]
    prompt: string
    negativePrompt?: string
    width?: number
    height?: number
    numInferenceSteps?: number
    guidanceScale?: number
    styleStrength?: number
  }): Promise<Buffer> {
    const modelId = 'TencentARC/PhotoMaker'

    if (!params.inputPhotos || params.inputPhotos.length === 0) {
      throw new Error('At least one input photo is required for PhotoMaker')
    }

    if (params.inputPhotos.length > 4) {
      throw new Error('PhotoMaker supports maximum 4 input photos')
    }

    try {
      // PhotoMaker requires special prompt format with "img" token
      // Example: "A professional headshot of img person, studio lighting"
      const enhancedPrompt = params.prompt.includes('img')
        ? params.prompt
        : `${params.prompt}, img person`

      console.log(`📸 PhotoMaker Generation Request:`)
      console.log(`   Model: ${modelId}`)
      console.log(`   Input Photos: ${params.inputPhotos.length}`)
      console.log(`   Prompt: ${enhancedPrompt}`)

      // Convert photos to base64
      const photosBase64 = params.inputPhotos.map(photo => photo.toString('base64'))

      const requestBody = {
        inputs: {
          prompt: enhancedPrompt,
          input_id_images: photosBase64, // PhotoMaker expects array of base64 images
        },
        parameters: {
          negative_prompt: params.negativePrompt || 'ugly, blurry, low quality, distorted, bad anatomy',
          num_inference_steps: params.numInferenceSteps || 50,
          guidance_scale: params.guidanceScale || 7.5,
          width: params.width || 1024,
          height: params.height || 1024,
          style_strength: params.styleStrength || 20, // PhotoMaker style strength (0-100)
        }
      }

      console.log(`   Parameters:`, {
        ...requestBody.parameters,
        input_photos_count: photosBase64.length
      })

      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${modelId}`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer',
          timeout: 180000 // 3 minutes for PhotoMaker
        }
      )

      console.log(`✅ PhotoMaker generation successful (${response.data.byteLength} bytes)`)
      return Buffer.from(response.data)
    } catch (error: any) {
      console.error('❌ PhotoMaker generation error:')
      console.error('   Status:', error.response?.status)
      console.error('   Status Text:', error.response?.statusText)

      // Try to parse error response
      if (error.response?.data instanceof ArrayBuffer || Buffer.isBuffer(error.response?.data)) {
        try {
          const errorText = Buffer.from(error.response.data).toString('utf-8')
          console.error('   Error Response:', errorText)
        } catch (e) {
          console.error('   Could not parse error data')
        }
      } else {
        console.error('   Error Data:', error.response?.data)
      }

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

      throw error
    }
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
