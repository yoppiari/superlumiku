import { VideoProvider, VideoModel, GenerateVideoParams, VideoGenerationResult, VideoStatus } from './base.provider'
import { env } from '../../../config/env'
import axios from 'axios'
import * as fs from 'fs'

/**
 * ModelsLab Video Generation Provider
 *
 * API Documentation: https://modelslab.com/models
 * Endpoint: POST /api/v7/video-fusion/text-to-video
 *
 * Supported Models:
 * 1. Google Veo 3
 * 2. Google Veo 2
 * 3. Text-to-Video Ultra
 * 4. Wan 2.2 T2V
 * 5. Seedance T2V
 */

export class ModelsLabProvider extends VideoProvider {
  readonly name = 'modelslab'
  readonly displayName = 'ModelsLab'
  private readonly apiKey: string
  private readonly baseUrl = 'https://modelslab.com/api/v6/video'

  readonly models: VideoModel[] = [
    {
      id: 'wan2.2',
      name: 'Text-to-Video Ultra (Wan 2.2)',
      provider: 'modelslab',
      maxDuration: 6,
      defaultDuration: 5,
      resolutions: ['720p'],
      aspectRatios: ['16:9', '9:16'],
      costPerSecond: 0.20,
      supportsTextToVideo: true,
      supportsImageToVideo: false,
      supportsVideoToVideo: false,
      supportsNegativePrompt: false,
      supportsAudioGeneration: false,
      description: 'Text-to-Video Ultra - Fast and efficient',
    },
  ]

  constructor() {
    super()
    this.apiKey = process.env.MODELSLAB_API_KEY || ''

    if (!this.apiKey) {
      console.warn('⚠️  MODELSLAB_API_KEY not set in environment variables')
    }
  }

  /**
   * Map resolution to ModelsLab format
   * Note: Text-to-Video Ultra API has max resolution of 480px
   */
  private mapResolution(resolution: string): { width: number; height: number } {
    const mapping: Record<string, { width: number; height: number }> = {
      '720p': { width: 480, height: 270 },   // 16:9 ratio, max 480
      '1080p': { width: 480, height: 270 },  // Same as 720p due to API limit
      '4k': { width: 480, height: 270 },     // Same as 720p due to API limit
    }
    return mapping[resolution] || mapping['720p']
  }

  /**
   * Map aspect ratio to dimensions
   */
  private adjustDimensionsForAspectRatio(
    dims: { width: number; height: number },
    aspectRatio: string
  ): { width: number; height: number } {
    if (aspectRatio === '9:16') {
      return { width: dims.height, height: dims.width } // Swap for vertical
    }
    if (aspectRatio === '1:1') {
      return { width: dims.height, height: dims.height } // Square
    }
    if (aspectRatio === '4:5') {
      return { width: Math.round(dims.height * 0.8), height: dims.height }
    }
    return dims // 16:9 default
  }

  /**
   * Convert image file to base64
   */
  private async imageToBase64(imagePath: string): Promise<string> {
    const buffer = await fs.promises.readFile(imagePath)
    return buffer.toString('base64')
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

    const dims = this.mapResolution(params.resolution)
    const finalDims = this.adjustDimensionsForAspectRatio(dims, params.aspectRatio)

    // Prepare request body
    const body: any = {
      key: this.apiKey,
      model_id: params.modelId,
      prompt: params.prompt,
      height: finalDims.height,
      width: finalDims.width,
      num_frames: Math.min(params.duration * 24, 200), // 24 fps
      num_inference_steps: 25,
      guidance_scale: 7.5,
      output_type: 'mp4',
      webhook: params.webhookUrl,
      track_id: null,
    }

    // Only add negative_prompt if provided (some models don't support it)
    if (params.negativePrompt && params.negativePrompt.trim()) {
      body.negative_prompt = params.negativePrompt
    }

    // Add start image if provided (image-to-video)
    if (params.startImagePath && typeof params.startImagePath === 'string' && params.startImagePath.trim()) {
      const base64 = await this.imageToBase64(params.startImagePath)
      body.init_image = base64
      body.strength = 0.8 // How much to transform the image
    }

    // Add audio generation flag for Veo models
    if (params.generateAudio && (params.modelId === 'veo2' || params.modelId === 'veo3')) {
      body.generate_audio = true
    }

    try {
      const response = await axios.post(`${this.baseUrl}/text2video_ultra`, body, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60 seconds
      })

      const data = response.data

      // Debug: Log the full response
      console.log('📹 ModelsLab API Response:', JSON.stringify(data, null, 2))

      // Extract job ID from various possible fields
      const jobId = data.id || data.fetch_result || data.request_id || data.job_id || data.eta_relative_path

      if (!jobId) {
        console.error('❌ No job ID found in ModelsLab response:', data)
        throw new Error('ModelsLab did not return a valid job ID')
      }

      console.log('✅ Job ID extracted:', jobId)

      // ModelsLab returns job ID for async processing
      return {
        jobId: String(jobId), // Convert to string for database
        status: data.status === 'processing' ? 'processing' : 'pending',
        videoUrl: data.output?.[0] || data.future_links?.[0],
        estimatedTime: data.eta || 60,
        providerResponse: data,
      }
    } catch (error: any) {
      console.error('❌ ModelsLab API Error:', error.response?.data || error.message)
      throw new Error(`ModelsLab generation failed: ${error.response?.data?.message || error.message}`)
    }
  }

  /**
   * Check generation status
   */
  async checkStatus(jobId: string): Promise<VideoStatus> {
    try {
      // Use the full fetch URL that was returned in the initial response
      const fetchUrl = `https://modelslab.com/api/v6/video/fetch/${jobId}`

      const response = await axios.post(
        fetchUrl,
        {
          key: this.apiKey,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      const data = response.data

      let status: 'pending' | 'processing' | 'completed' | 'failed' = 'pending'

      if (data.status === 'success' || data.status === 'completed') {
        status = 'completed'
      } else if (data.status === 'processing') {
        status = 'processing'
      } else if (data.status === 'failed' || data.status === 'error') {
        status = 'failed'
      }

      return {
        jobId,
        status,
        progress: data.eta ? Math.min(90, 100 - data.eta) : undefined,
        videoUrl: data.output?.[0] || data.future_links?.[0],
        thumbnailUrl: data.meta?.thumbnail,
        errorMessage: data.message || data.error,
        processingTime: data.generationTime,
      }
    } catch (error: any) {
      console.error('ModelsLab Status Check Error:', error.response?.data || error.message)
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
        timeout: 300000, // 5 minutes for large videos
      })

      return Buffer.from(response.data)
    } catch (error: any) {
      console.error('ModelsLab Download Error:', error.message)
      throw new Error(`Failed to download video: ${error.message}`)
    }
  }
}
