/**
 * Base Video Provider Interface
 *
 * All video generation providers must implement this interface.
 * This allows easy extension with new providers without modifying existing code.
 */

export interface VideoModel {
  id: string                    // Unique model ID (e.g., 'veo3', 'kling-2.5')
  name: string                  // Display name for UI
  provider: string              // Provider name
  maxDuration: number           // Maximum duration in seconds
  defaultDuration: number       // Default duration in seconds
  resolutions: string[]         // Supported resolutions ['720p', '1080p', '4k']
  aspectRatios: string[]        // Supported aspect ratios ['16:9', '9:16', '1:1', '4:5']
  costPerSecond: number         // Base cost in USD per second
  supportsTextToVideo: boolean  // Text prompt to video
  supportsImageToVideo: boolean // Start image to video
  supportsVideoToVideo: boolean // Video to video (end image)
  supportsNegativePrompt: boolean
  supportsAudioGeneration: boolean
  description?: string          // Model description for UI
}

export interface GenerateVideoParams {
  modelId: string
  prompt: string
  negativePrompt?: string
  startImagePath?: string       // Local path to uploaded start image
  endImagePath?: string         // Local path to uploaded end image
  resolution: string            // '720p', '1080p', '4k'
  duration: number              // Duration in seconds
  aspectRatio: string           // '16:9', '9:16', '1:1', '4:5'
  generateAudio?: boolean       // Generate audio (if supported)
  enhancePrompt?: boolean       // AI prompt enhancement (if supported)
  webhookUrl?: string           // Webhook for async completion
}

export interface VideoGenerationResult {
  jobId: string                 // Provider's job ID for status checking
  status: 'pending' | 'processing' | 'completed' | 'failed'
  videoUrl?: string             // URL to generated video (if completed)
  thumbnailUrl?: string         // URL to thumbnail (if available)
  errorMessage?: string         // Error message (if failed)
  providerResponse?: any        // Full provider response for debugging
  estimatedTime?: number        // Estimated completion time in seconds
}

export interface VideoStatus {
  jobId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress?: number             // Progress percentage (0-100)
  videoUrl?: string             // URL to generated video (if completed)
  thumbnailUrl?: string         // Thumbnail URL
  errorMessage?: string
  processingTime?: number       // Time spent processing (seconds)
}

/**
 * Abstract Base Provider Class
 */
export abstract class VideoProvider {
  abstract readonly name: string
  abstract readonly displayName: string
  abstract readonly models: VideoModel[]

  /**
   * Generate video from text/image
   */
  abstract generateVideo(params: GenerateVideoParams): Promise<VideoGenerationResult>

  /**
   * Check generation status
   */
  abstract checkStatus(jobId: string): Promise<VideoStatus>

  /**
   * Download generated video
   */
  abstract downloadVideo(jobId: string, videoUrl: string): Promise<Buffer>

  /**
   * Get model by ID
   */
  getModel(modelId: string): VideoModel | undefined {
    return this.models.find(m => m.id === modelId)
  }

  /**
   * Validate if provider supports the requested features
   */
  validateCapabilities(params: GenerateVideoParams): { valid: boolean; error?: string } {
    const model = this.getModel(params.modelId)

    if (!model) {
      return { valid: false, error: `Model ${params.modelId} not found in ${this.name}` }
    }

    if (params.startImagePath && !model.supportsImageToVideo) {
      return { valid: false, error: `Model ${model.name} does not support image-to-video` }
    }

    if (params.endImagePath && !model.supportsVideoToVideo) {
      return { valid: false, error: `Model ${model.name} does not support video-to-video` }
    }

    if (params.negativePrompt && !model.supportsNegativePrompt) {
      return { valid: false, error: `Model ${model.name} does not support negative prompts` }
    }

    if (params.generateAudio && !model.supportsAudioGeneration) {
      return { valid: false, error: `Model ${model.name} does not support audio generation` }
    }

    if (!model.resolutions.includes(params.resolution)) {
      return { valid: false, error: `Resolution ${params.resolution} not supported. Supported: ${model.resolutions.join(', ')}` }
    }

    if (!model.aspectRatios.includes(params.aspectRatio)) {
      return { valid: false, error: `Aspect ratio ${params.aspectRatio} not supported. Supported: ${model.aspectRatios.join(', ')}` }
    }

    if (params.duration > model.maxDuration) {
      return { valid: false, error: `Duration ${params.duration}s exceeds max ${model.maxDuration}s for ${model.name}` }
    }

    return { valid: true }
  }
}
