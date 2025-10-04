import { LoopingFlowRepository } from '../repositories/looping-flow.repository'

export class LoopingFlowService {
  private repository = new LoopingFlowRepository()

  // Credit calculation: 2 credits per 15 minutes (900 seconds)
  calculateCreditCost(targetDuration: number): number {
    return Math.ceil(targetDuration / 900) * 2
  }

  async getProjects(userId: string) {
    return this.repository.getProjects(userId)
  }

  async createProject(userId: string, name: string, description?: string) {
    return this.repository.createProject(userId, name, description)
  }

  async getProject(projectId: string, userId: string) {
    return this.repository.getProject(projectId, userId)
  }

  async deleteProject(projectId: string, userId: string) {
    return this.repository.deleteProject(projectId, userId)
  }

  async createVideo(data: any) {
    return this.repository.createVideo(data)
  }

  async getVideoById(videoId: string, userId: string) {
    return this.repository.getVideoById(videoId, userId)
  }

  async deleteVideo(videoId: string, userId: string) {
    return this.repository.deleteVideo(videoId, userId)
  }

  async createGeneration(
    projectId: string,
    userId: string,
    videoId: string,
    targetDuration: number,
    options?: {
      loopStyle?: string
      crossfadeDuration?: number
      videoCrossfade?: boolean
      audioCrossfade?: boolean
      masterVolume?: number
      audioFadeIn?: number
      audioFadeOut?: number
      muteOriginal?: boolean
    }
  ) {
    const creditUsed = this.calculateCreditCost(targetDuration)
    return this.repository.createGeneration(
      projectId,
      userId,
      videoId,
      targetDuration,
      creditUsed,
      options
    )
  }

  async getGenerations(projectId: string, userId: string) {
    return this.repository.getGenerations(projectId, userId)
  }

  async getGenerationById(generationId: string, userId: string) {
    return this.repository.getGenerationById(generationId, userId)
  }

  async getStats(userId: string) {
    return this.repository.getStats(userId)
  }

  async cancelGeneration(generationId: string, userId: string) {
    const generation = await this.repository.getGenerationById(generationId, userId)

    // Only allow canceling pending or processing generations
    if (generation.status !== 'pending' && generation.status !== 'processing') {
      throw new Error('Can only cancel pending or processing generations')
    }

    return this.repository.cancelGeneration(generationId)
  }

  // Audio layer methods
  async getAudioLayers(generationId: string) {
    return this.repository.getAudioLayers(generationId)
  }

  async createAudioLayer(data: any) {
    return this.repository.createAudioLayer(data)
  }

  async updateAudioLayer(layerId: string, data: any) {
    return this.repository.updateAudioLayer(layerId, data)
  }

  async deleteAudioLayer(layerId: string, userId: string) {
    // Get the audio layer to verify ownership through generation
    const layer = await this.repository.getAudioLayers('')
    const layerData = layer.find((l: any) => l.id === layerId)

    if (!layerData) {
      throw new Error('Audio layer not found')
    }

    // Verify the generation belongs to the user
    await this.repository.getGenerationById(layerData.generationId, userId)

    // Delete the layer
    const deleted = await this.repository.deleteAudioLayer(layerId)
    return deleted
  }
}
