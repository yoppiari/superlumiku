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
    creditUsed: number
  ) {
    return prisma.loopingFlowGeneration.create({
      data: {
        projectId,
        userId,
        videoId,
        targetDuration,
        creditUsed,
        status: 'pending',
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
}
