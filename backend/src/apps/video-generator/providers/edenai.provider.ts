import { VideoProvider, VideoModel, GenerateVideoParams, VideoGenerationResult, VideoStatus } from './base.provider'
import axios from 'axios'
import * as fs from 'fs'
import FormData from 'form-data'

/**
 * EdenAI Video Generation Provider
 *
 * API Documentation: https://docs.edenai.co/reference/video_generation_async_create
 * Endpoint: POST https://api.edenai.run/v2/video/generation_async
 *
 * Supported Providers via EdenAI:
 * 1. Amazon Nova Reel
 * 2. Runway Gen-3
 * 3. Kling AI 2.5
 */

export class EdenAIProvider extends VideoProvider {
  readonly name = 'edenai'
  readonly displayName = 'EdenAI'
  private readonly apiKey: string
  private readonly baseUrl = 'https://api.edenai.run/v2/video'

  readonly models: VideoModel[] = [
    {
      id: 'amazon-nova-reel',
      name: 'Amazon Nova Reel',
      provider: 'edenai',
      maxDuration: 6,
      defaultDuration: 6,
      resolutions: ['720p'],
      aspectRatios: ['16:9', '9:16', '1:1'],
      costPerSecond: 0.08,
      supportsTextToVideo: true,
      supportsImageToVideo: true,
      supportsVideoToVideo: false,
      supportsNegativePrompt: false,
      supportsAudioGeneration: true,
      description: 'Amazon Nova Reel - Fast and cost-effective',
    },
    {
      id: 'runway-gen-3',
      name: 'Runway Gen-3',
      provider: 'edenai',
      maxDuration: 10,
      defaultDuration: 10,
      resolutions: ['720p', '1080p'],
      aspectRatios: ['16:9', '9:16', '1:1'],
      costPerSecond: 0.096,
      supportsTextToVideo: true,
      supportsImageToVideo: true,
      supportsVideoToVideo: true,
      supportsNegativePrompt: false,
      supportsAudioGeneration: false,
      description: 'Runway Gen-3 Alpha - High quality cinematic',
    },
    {
      id: 'kling-2.5',
      name: 'Kling AI 2.5',
      provider: 'edenai',
      maxDuration: 5,
      defaultDuration: 5,
      resolutions: ['720p', '1080p'],
      aspectRatios: ['16:9', '9:16', '1:1'],
      costPerSecond: 0.12,
      supportsTextToVideo: true,
      supportsImageToVideo: true,
      supportsVideoToVideo: false,
      supportsNegativePrompt: true,
      supportsAudioGeneration: false,
      description: 'Kling AI 2.5 - Advanced motion consistency',
    },
  ]

  constructor() {
    super()
    this.apiKey = process.env.EDENAI_API_KEY || ''

    if (!this.apiKey) {
      console.warn('⚠️  EDENAI_API_KEY not set in environment variables')
    }
  }

  /**
   * Map model ID to EdenAI provider name
   */
  private mapModelToProvider(modelId: string): string {
    const mapping: Record<string, string> = {
      'amazon-nova-reel': 'amazon',
      'runway-gen-3': 'runwayml',
      'kling-2.5': 'kling',
    }
    return mapping[modelId] || 'amazon'
  }

  /**
   * Map resolution to dimensions
   */
  private mapResolution(resolution: string): { width: number; height: number } {
    const mapping: Record<string, { width: number; height: number }> = {
      '720p': { width: 1280, height: 720 },
      '1080p': { width: 1920, height: 1080 },
    }
    return mapping[resolution] || mapping['720p']
  }

  /**
   * Generate video
   */
  async generateVideo(params: GenerateVideoParams): Promise<VideoGenerationResult> {
    // Validate capabilities
    const validation = this.validateCapabilities(params)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    const provider = this.mapModelToProvider(params.modelId)
    const dims = this.mapResolution(params.resolution)

    // Prepare form data
    const formData = new FormData()
    formData.append('providers', provider)
    formData.append('text', params.prompt)
    formData.append('resolution', params.resolution)
    formData.append('num_frames', params.duration.toString())

    // Add aspect ratio
    if (params.aspectRatio !== '16:9') {
      formData.append('aspect_ratio', params.aspectRatio)
    }

    // Add start image if provided
    if (params.startImagePath) {
      const imageBuffer = await fs.promises.readFile(params.startImagePath)
      formData.append('file', imageBuffer, {
        filename: 'start_image.jpg',
        contentType: 'image/jpeg',
      })
    }

    // Add negative prompt if supported
    if (params.negativePrompt && params.modelId === 'kling-2.5') {
      formData.append('negative_prompt', params.negativePrompt)
    }

    try {
      const response = await axios.post(`${this.baseUrl}/generation_async`, formData, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          ...formData.getHeaders(),
        },
        timeout: 60000,
      })

      const data = response.data

      return {
        jobId: data.public_id,
        status: 'processing',
        estimatedTime: 60,
        providerResponse: data,
      }
    } catch (error: any) {
      console.error('EdenAI API Error:', error.response?.data || error.message)
      throw new Error(`EdenAI generation failed: ${error.response?.data?.detail || error.message}`)
    }
  }

  /**
   * Check generation status
   */
  async checkStatus(jobId: string): Promise<VideoStatus> {
    try {
      const response = await axios.get(`${this.baseUrl}/generation_async/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })

      const data = response.data

      let status: 'pending' | 'processing' | 'completed' | 'failed' = 'processing'

      // Map EdenAI status to our status
      if (data[this.mapModelToProvider(jobId)]?.status === 'success') {
        status = 'completed'
      } else if (data[this.mapModelToProvider(jobId)]?.status === 'fail') {
        status = 'failed'
      } else if (data[this.mapModelToProvider(jobId)]?.status === 'pending') {
        status = 'pending'
      }

      const providerData = data[this.mapModelToProvider(jobId)] || data

      return {
        jobId,
        status,
        videoUrl: providerData.video_resource_url,
        errorMessage: providerData.error?.message,
      }
    } catch (error: any) {
      console.error('EdenAI Status Check Error:', error.response?.data || error.message)
      return {
        jobId,
        status: 'failed',
        errorMessage: error.message,
      }
    }
  }

  /**
   * Download generated video
   */
  async downloadVideo(jobId: string, videoUrl: string): Promise<Buffer> {
    try {
      const response = await axios.get(videoUrl, {
        responseType: 'arraybuffer',
        timeout: 300000, // 5 minutes
      })

      return Buffer.from(response.data)
    } catch (error: any) {
      console.error('EdenAI Download Error:', error.message)
      throw new Error(`Failed to download video: ${error.message}`)
    }
  }
}
