import { VideoGenRepository } from '../repositories/video-gen.repository'
import { videoProviderRegistry } from '../providers/loader'
import { videoGeneratorConfig } from '../plugin.config'
import { GenerateVideoParams } from '../providers/base.provider'

/**
 * Video Generator Service
 *
 * Business logic for video generation
 */

export class VideoGenService {
  private repository: VideoGenRepository

  constructor() {
    this.repository = new VideoGenRepository()
  }

  // ========================================
  // PROJECT MANAGEMENT
  // ========================================

  async getProjects(userId: string) {
    return this.repository.getProjects(userId)
  }

  async getProjectById(projectId: string, userId: string) {
    return this.repository.getProjectById(projectId, userId)
  }

  async createProject(userId: string, name: string, description?: string) {
    return this.repository.createProject({ userId, name, description })
  }

  async updateProject(projectId: string, userId: string, data: { name?: string; description?: string }) {
    return this.repository.updateProject(projectId, userId, data)
  }

  async deleteProject(projectId: string, userId: string) {
    return this.repository.deleteProject(projectId, userId)
  }

  // ========================================
  // GENERATION MANAGEMENT
  // ========================================

  async getGenerations(projectId: string) {
    return this.repository.getGenerationsByProject(projectId)
  }

  async getGenerationById(generationId: string) {
    return this.repository.getGenerationById(generationId)
  }

  // ========================================
  // CREDIT CALCULATION
  // ========================================

  /**
   * Calculate credits required for video generation
   */
  calculateCredits(params: {
    modelId: string
    resolution: string
    duration: number
    startImagePath?: string
    endImagePath?: string
    generateAudio?: boolean
    enhancePrompt?: boolean
  }): { total: number; breakdown: Record<string, number> } {
    const credits = videoGeneratorConfig.credits
    const breakdown: Record<string, number> = {}

    // 1. Base model cost
    const baseCredits = credits[params.modelId as keyof typeof credits] as number || 500
    breakdown['base'] = baseCredits

    // 2. Resolution modifier
    let resolutionMultiplier = 1
    if (params.resolution === '1080p') {
      resolutionMultiplier = 1 + (credits.resolution1080p / 100)
      breakdown['resolution'] = Math.round(baseCredits * (credits.resolution1080p / 100))
    } else if (params.resolution === '4k') {
      resolutionMultiplier = 1 + (credits.resolution4k / 100)
      breakdown['resolution'] = Math.round(baseCredits * (credits.resolution4k / 100))
    }

    // 3. Duration modifier (if exceeds default)
    const model = videoProviderRegistry.getModelById(params.modelId)
    if (model && params.duration > model.model.defaultDuration) {
      const extraSeconds = params.duration - model.model.defaultDuration
      const extraBlocks = Math.ceil(extraSeconds / 5) // Per 5 seconds
      const durationCost = Math.round(baseCredits * (credits.durationPer5Seconds / 100) * extraBlocks)
      breakdown['duration'] = durationCost
    }

    // 4. Image input modifiers
    if (params.startImagePath && params.endImagePath) {
      breakdown['images'] = Math.round(baseCredits * (credits.bothImages / 100))
    } else if (params.startImagePath) {
      breakdown['images'] = Math.round(baseCredits * (credits.startImage / 100))
    } else if (params.endImagePath) {
      breakdown['images'] = Math.round(baseCredits * (credits.endImage / 100))
    }

    // 5. Additional features
    if (params.generateAudio) {
      breakdown['audio'] = credits.audioGeneration
    }
    if (params.enhancePrompt) {
      breakdown['promptEnhance'] = credits.enhancedPrompt
    }

    // Calculate total
    const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0)

    return { total, breakdown }
  }

  /**
   * Estimate credits before generation
   */
  async estimateCredits(params: {
    modelId: string
    resolution: string
    duration: number
    startImagePath?: string
    endImagePath?: string
    generateAudio?: boolean
    enhancePrompt?: boolean
  }) {
    const result = this.calculateCredits(params)

    // Get model info
    const modelInfo = videoProviderRegistry.getModelById(params.modelId)

    return {
      total: result.total,
      breakdown: result.breakdown,
      model: modelInfo?.model.name || params.modelId,
      provider: modelInfo?.provider.displayName || 'Unknown',
    }
  }

  // ========================================
  // VIDEO GENERATION
  // ========================================

  /**
   * Create video generation job
   */
  async createGeneration(params: {
    projectId: string
    userId: string
    modelId: string
    prompt: string
    negativePrompt?: string
    startImagePath?: string
    endImagePath?: string
    resolution: string
    duration: number
    aspectRatio: string
    generateAudio?: boolean
    enhancePrompt?: boolean
  }) {
    // Get model and provider
    const modelInfo = videoProviderRegistry.getModelById(params.modelId)
    if (!modelInfo) {
      throw new Error(`Model ${params.modelId} not found`)
    }

    // Calculate credits
    const { total: creditUsed } = this.calculateCredits(params)

    // Create generation record
    const generation = await this.repository.createGeneration({
      projectId: params.projectId,
      userId: params.userId,
      provider: modelInfo.provider.name,
      modelId: params.modelId,
      modelName: modelInfo.model.name,
      prompt: params.prompt,
      negativePrompt: params.negativePrompt,
      startImagePath: params.startImagePath,
      endImagePath: params.endImagePath,
      resolution: params.resolution,
      duration: params.duration,
      aspectRatio: params.aspectRatio,
      creditUsed,
      advancedSettings: JSON.stringify({
        generateAudio: params.generateAudio,
        enhancePrompt: params.enhancePrompt,
      }),
    })

    return generation
  }

  /**
   * Start video generation with provider
   */
  async startGeneration(generationId: string) {
    const generation = await this.repository.getGenerationById(generationId)
    if (!generation) {
      throw new Error('Generation not found')
    }

    const modelInfo = videoProviderRegistry.getModelById(generation.modelId)
    if (!modelInfo) {
      throw new Error(`Model ${generation.modelId} not found`)
    }

    try {
      // Prepare params for provider
      const providerParams: GenerateVideoParams = {
        modelId: generation.modelId,
        prompt: generation.prompt,
        negativePrompt: generation.negativePrompt || undefined,
        startImagePath: generation.startImagePath || undefined,
        endImagePath: generation.endImagePath || undefined,
        resolution: generation.resolution,
        duration: generation.duration,
        aspectRatio: generation.aspectRatio,
      }

      // Parse advanced settings
      if (generation.advancedSettings) {
        const advanced = JSON.parse(generation.advancedSettings)
        providerParams.generateAudio = advanced.generateAudio
        providerParams.enhancePrompt = advanced.enhancePrompt
      }

      // Call provider
      const result = await modelInfo.provider.generateVideo(providerParams)

      // Update generation with provider job ID
      await this.repository.updateGenerationStatus(generationId, {
        status: result.status,
        providerJobId: result.jobId,
        providerResponse: JSON.stringify(result.providerResponse),
      })

      return result
    } catch (error: any) {
      // Update generation as failed
      await this.repository.updateGenerationStatus(generationId, {
        status: 'failed',
        errorMessage: error.message,
      })
      throw error
    }
  }

  /**
   * Check generation status
   */
  async checkGenerationStatus(generationId: string) {
    const generation = await this.repository.getGenerationById(generationId)
    if (!generation) {
      throw new Error('Generation not found')
    }

    if (!generation.providerJobId) {
      return {
        id: generationId,
        status: generation.status,
        errorMessage: generation.errorMessage,
      }
    }

    const modelInfo = videoProviderRegistry.getModelById(generation.modelId)
    if (!modelInfo) {
      throw new Error(`Model ${generation.modelId} not found`)
    }

    try {
      const status = await modelInfo.provider.checkStatus(generation.providerJobId)

      // Update if status changed
      if (status.status !== generation.status) {
        await this.repository.updateGenerationStatus(generationId, {
          status: status.status,
          outputPath: status.videoUrl,
          thumbnailPath: status.thumbnailUrl,
          errorMessage: status.errorMessage,
          completedAt: status.status === 'completed' ? new Date() : undefined,
        })
      }

      return {
        id: generationId,
        ...status,
      }
    } catch (error: any) {
      console.error('Status check error:', error)
      throw error
    }
  }

  /**
   * Download generated video
   */
  async downloadVideo(generationId: string) {
    const generation = await this.repository.getGenerationById(generationId)
    if (!generation) {
      throw new Error('Generation not found')
    }

    if (generation.status !== 'completed' || !generation.outputPath) {
      throw new Error('Video not ready for download')
    }

    const modelInfo = videoProviderRegistry.getModelById(generation.modelId)
    if (!modelInfo) {
      throw new Error(`Model ${generation.modelId} not found`)
    }

    const buffer = await modelInfo.provider.downloadVideo(generation.providerJobId!, generation.outputPath)
    return buffer
  }

  // ========================================
  // STATISTICS
  // ========================================

  async getUserStats(userId: string) {
    return this.repository.getUserStats(userId)
  }

  async getAppStats() {
    return this.repository.getAppStats()
  }

  // ========================================
  // BACKGROUND JOBS
  // ========================================

  /**
   * Get active generations for worker polling
   */
  async getActiveGenerations() {
    return this.repository.getActiveGenerations()
  }
}
