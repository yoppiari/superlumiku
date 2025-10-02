import prisma from '../../../db/client'

export class VideoMixerRepository {
  // ===== Projects =====
  async createProject(userId: string, name: string, description?: string) {
    return await prisma.videoMixerProject.create({
      data: {
        userId,
        name,
        description,
      },
    })
  }

  async findProjectsByUserId(userId: string) {
    return await prisma.videoMixerProject.findMany({
      where: { userId },
      include: {
        videos: true,
        groups: {
          include: {
            videos: true,
          },
        },
        generations: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findProjectById(projectId: string, userId: string) {
    return await prisma.videoMixerProject.findFirst({
      where: { id: projectId, userId },
      include: {
        videos: {
          orderBy: { order: 'asc' },
        },
        groups: {
          include: {
            videos: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        generations: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })
  }

  async updateProject(projectId: string, userId: string, data: { name?: string; description?: string }) {
    return await prisma.videoMixerProject.updateMany({
      where: { id: projectId, userId },
      data,
    })
  }

  async deleteProject(projectId: string, userId: string) {
    return await prisma.videoMixerProject.deleteMany({
      where: { id: projectId, userId },
    })
  }

  // ===== Groups =====
  async createGroup(projectId: string, name: string, order: number = 0) {
    return await prisma.videoMixerGroup.create({
      data: {
        projectId,
        name,
        order,
      },
    })
  }

  async findGroupsByProjectId(projectId: string) {
    return await prisma.videoMixerGroup.findMany({
      where: { projectId },
      include: {
        videos: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    })
  }

  async updateGroup(groupId: string, data: { name?: string; order?: number }) {
    return await prisma.videoMixerGroup.update({
      where: { id: groupId },
      data,
    })
  }

  async deleteGroup(groupId: string) {
    return await prisma.videoMixerGroup.delete({
      where: { id: groupId },
    })
  }

  // ===== Videos =====
  async createVideo(data: {
    projectId: string
    groupId?: string
    fileName: string
    filePath: string
    fileSize: number
    duration: number
    mimeType: string
    order?: number
  }) {
    return await prisma.videoMixerVideo.create({
      data,
    })
  }

  async findVideosByProjectId(projectId: string) {
    return await prisma.videoMixerVideo.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    })
  }

  async findVideosByGroupId(groupId: string) {
    return await prisma.videoMixerVideo.findMany({
      where: { groupId },
      orderBy: { order: 'asc' },
    })
  }

  async updateVideo(videoId: string, data: { fileName?: string; groupId?: string; order?: number }) {
    return await prisma.videoMixerVideo.update({
      where: { id: videoId },
      data,
    })
  }

  async deleteVideo(videoId: string) {
    return await prisma.videoMixerVideo.delete({
      where: { id: videoId },
    })
  }

  async findVideoById(videoId: string) {
    return await prisma.videoMixerVideo.findUnique({
      where: { id: videoId },
    })
  }

  // ===== Generations =====
  async createGeneration(data: {
    projectId: string
    userId: string
    totalVideos: number
    settings: string
    creditUsed: number
    estimatedDuration?: number
  }) {
    return await prisma.videoMixerGeneration.create({
      data: {
        ...data,
        status: 'pending',
      },
    })
  }

  async findGenerationsByProjectId(projectId: string) {
    return await prisma.videoMixerGeneration.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findGenerationById(generationId: string) {
    return await prisma.videoMixerGeneration.findUnique({
      where: { id: generationId },
    })
  }

  async updateGeneration(generationId: string, data: {
    status?: string
    outputPaths?: string
    completedAt?: Date
  }) {
    return await prisma.videoMixerGeneration.update({
      where: { id: generationId },
      data,
    })
  }

  async deleteGeneration(generationId: string) {
    return await prisma.videoMixerGeneration.delete({
      where: { id: generationId },
    })
  }
}
