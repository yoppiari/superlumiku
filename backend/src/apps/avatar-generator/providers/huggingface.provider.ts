import fetch from 'node-fetch'

export interface HuggingFaceControlNetRequest {
  inputImage: Buffer | string // User's photo
  poseImage: Buffer | string // Pose template/skeleton
  prompt: string
  negativePrompt?: string
  modelId: string // e.g., 'lllyasviel/control_v11p_sd15_openpose'
  numInferenceSteps?: number
  guidanceScale?: number
  controlnetConditioningScale?: number
  seed?: number
}

export interface HuggingFaceResponse {
  success: boolean
  imageUrl?: string
  imageBuffer?: Buffer
  error?: string
}

export class HuggingFaceProvider {
  private apiKey: string
  private baseUrl = 'https://api-inference.huggingface.co/models'

  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY || ''
    if (!this.apiKey) {
      console.warn('⚠️  HUGGINGFACE_API_KEY not set')
    }
  }

  /**
   * Generate avatar using ControlNet with OpenPose
   */
  async generateAvatar(request: HuggingFaceControlNetRequest): Promise<HuggingFaceResponse> {
    try {
      if (!this.apiKey) {
        throw new Error('Hugging Face API key not configured')
      }

      // For Hugging Face Inference API, we need to use the diffusers pipeline
      // Currently, Inference API doesn't directly support ControlNet multi-input
      // We'll use the model's endpoint with proper parameters

      const modelEndpoint = `${this.baseUrl}/${request.modelId}`

      // Convert images to base64 if they're buffers
      const inputImageBase64 = Buffer.isBuffer(request.inputImage)
        ? request.inputImage.toString('base64')
        : request.inputImage

      const poseImageBase64 = Buffer.isBuffer(request.poseImage)
        ? request.poseImage.toString('base64')
        : request.poseImage

      // Prepare the request payload
      // Note: Hugging Face Inference API may require specific format
      const payload = {
        inputs: {
          prompt: request.prompt,
          negative_prompt: request.negativePrompt || 'ugly, blurry, low quality, distorted',
          image: poseImageBase64, // Pose conditioning image
          num_inference_steps: request.numInferenceSteps || 30,
          guidance_scale: request.guidanceScale || 7.5,
          controlnet_conditioning_scale: request.controlnetConditioningScale || 1.0,
          ...(request.seed && { seed: request.seed })
        }
      }

      console.log(`🤗 Calling Hugging Face API: ${request.modelId}`)

      const response = await fetch(modelEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Hugging Face API error:', errorText)
        throw new Error(`API request failed: ${response.status} - ${errorText}`)
      }

      // The response is the generated image as a blob
      const imageBuffer = Buffer.from(await response.arrayBuffer())

      return {
        success: true,
        imageBuffer
      }
    } catch (error: any) {
      console.error('Hugging Face generation error:', error)
      return {
        success: false,
        error: error.message || 'Failed to generate avatar'
      }
    }
  }

  /**
   * Extract pose from image using OpenPose detector
   * This can be done client-side or using a separate HF model
   */
  async extractPose(imageBuffer: Buffer): Promise<HuggingFaceResponse> {
    try {
      if (!this.apiKey) {
        throw new Error('Hugging Face API key not configured')
      }

      // Use OpenPose detection model
      const openPoseModel = 'lllyasviel/Annotators' // OpenPose annotator
      const modelEndpoint = `${this.baseUrl}/${openPoseModel}`

      const response = await fetch(modelEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'image/jpeg'
        },
        body: imageBuffer
      })

      if (!response.ok) {
        throw new Error(`OpenPose extraction failed: ${response.status}`)
      }

      const poseImageBuffer = Buffer.from(await response.arrayBuffer())

      return {
        success: true,
        imageBuffer: poseImageBuffer
      }
    } catch (error: any) {
      console.error('Pose extraction error:', error)
      return {
        success: false,
        error: error.message || 'Failed to extract pose'
      }
    }
  }

  /**
   * Check model availability
   */
  async checkModelAvailability(modelId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${modelId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })

      return response.ok
    } catch (error) {
      console.error(`Model ${modelId} availability check failed:`, error)
      return false
    }
  }

  /**
   * Get estimated time for model loading
   */
  async getModelStatus(modelId: string): Promise<{
    loaded: boolean
    estimatedTime?: number
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/${modelId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: 'test' })
      })

      // If model is loading, HF returns 503 with estimated_time
      if (response.status === 503) {
        const data = await response.json() as any
        return {
          loaded: false,
          estimatedTime: data.estimated_time || 20
        }
      }

      return { loaded: true }
    } catch (error) {
      return { loaded: false }
    }
  }
}

export const huggingFaceProvider = new HuggingFaceProvider()
