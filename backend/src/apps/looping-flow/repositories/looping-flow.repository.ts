import prisma from '../../../db/client'

export class LoopingFlowRepository {
  async getProjects(userId: string) {
    return prisma.loopingFlowProject.findMany({
      where: { userId },
      include: {
        videos: true,
        generations: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { updatedAt: 'desc' },
    })
  }

  async createProject(userId: string, name: string, description?: string) {
    return prisma.loopingFlowProject.create({
      data: { userId, name, description },
    })
  }

  async getProject(projectId: string, userId: string) {
    const project = await prisma.loopingFlowProject.findFirst({
      where: { id: projectId, userId },
      include: {
        videos: true,
        generations: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!project) throw new Error('Project not found')
    return project
  }

  async deleteProject(projectId: string, userId: string) {
    const project = await prisma.loopingFlowProject.findFirst({
      where: { id: projectId, userId },
    })
    if (!project) throw new Error('Project not found')
    return prisma.loopingFlowProject.delete({ where: { id: projectId } })
  }

  async createVideo(data: any) {
    return prisma.loopingFlowVideo.create({ data })
  }

  async getVideoById(videoId: string, userId: string) {
    const video = await prisma.loopingFlowVideo.findFirst({
      where: {
        id: videoId,
        project: { userId },
      },
    })
    if (!video) throw new Error('Video not found')
    return video
  }

  async deleteVideo(videoId: string, userId: string) {
    const video = await this.getVideoById(videoId, userId)
    return prisma.loopingFlowVideo.delete({ where: { id: video.id } })
  }

  async createGeneration(
    projectId: string,
    userId: string,
    videoId: string,
    targetDuration: number,
    creditUsed: number,
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
    return prisma.loopingFlowGeneration.create({
      data: {
        projectId,
        userId,
        videoId,
        targetDuration,
        creditUsed,
        status: 'pending',
        loopStyle: options?.loopStyle || 'crossfade',
        crossfadeDuration: options?.crossfadeDuration ?? 1.0,
        videoCrossfade: options?.videoCrossfade ?? true,
        audioCrossfade: options?.audioCrossfade ?? true,
        masterVolume: options?.masterVolume ?? 100,
        audioFadeIn: options?.audioFadeIn ?? 2.0,
        audioFadeOut: options?.audioFadeOut ?? 2.0,
        muteOriginal: options?.muteOriginal ?? false,
      },
    })
  }

  async getGenerations(projectId: string, userId: string) {
    return prisma.loopingFlowGeneration.findMany({
      where: { projectId, userId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getGenerationById(generationId: string, userId: string) {
    const generation = await prisma.loopingFlowGeneration.findFirst({
      where: { id: generationId, userId },
    })
    if (!generation) throw new Error('Generation not found')
    return generation
  }

  async getStats(userId: string) {
    const totalProjects = await prisma.loopingFlowProject.count({ where: { userId } })
    const totalGenerations = await prisma.loopingFlowGeneration.count({ where: { userId } })
    const completedGenerations = await prisma.loopingFlowGeneration.count({
      where: { userId, status: 'completed' },
    })

    return {
      totalProjects,
      totalGenerations,
      completedGenerations,
    }
  }

  async cancelGeneration(generationId: string) {
    return prisma.loopingFlowGeneration.update({
      where: { id: generationId },
      data: {
        status: 'cancelled',
        errorMessage: 'Cancelled by user',
        completedAt: new Date(),
      },
    })
  }

  // Worker methods
  async getPendingGenerations() {
    return prisma.loopingFlowGeneration.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      take: 1,
    })
  }

  async updateGenerationStatus(generationId: string, status: string) {
    return prisma.loopingFlowGeneration.update({
      where: { id: generationId },
      data: { status },
    })
  }

  async updateGenerationOutput(generationId: string, outputPath: string) {
    return prisma.loopingFlowGeneration.update({
      where: { id: generationId },
      data: {
        status: 'completed',
        outputPath,
        completedAt: new Date(),
      },
    })
  }

  async markGenerationFailed(generationId: string, errorMessage: string) {
    return prisma.loopingFlowGeneration.update({
      where: { id: generationId },
      data: {
        status: 'failed',
        errorMessage,
        completedAt: new Date(),
      },
    })
  }

  // Audio layer methods
  async getAudioLayers(generationId: string) {
    return prisma.loopingFlowAudioLayer.findMany({
      where: { generationId },
      orderBy: { layerIndex: 'asc' },
    })
  }

  async createAudioLayer(data: {
    generationId: string
    layerIndex: number
    fileName: string
    filePath: string
    fileSize: number
    duration: number
    volume?: number
    muted?: boolean
    fadeIn?: number
    fadeOut?: number
  }) {
    return prisma.loopingFlowAudioLayer.create({ data })
  }

  async updateAudioLayer(
    layerId: string,
    data: {
      volume?: number
      muted?: boolean
      fadeIn?: number
      fadeOut?: number
    }
  ) {
    return prisma.loopingFlowAudioLayer.update({
      where: { id: layerId },
      data,
    })
  }

  async deleteAudioLayer(layerId: string) {
    return prisma.loopingFlowAudioLayer.delete({
      where: { id: layerId },
    })
  }
}
