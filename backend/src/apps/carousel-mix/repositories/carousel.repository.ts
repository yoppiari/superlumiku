import prisma from '../../../db/client'

export class CarouselRepository {
  // ===========================
  // PROJECT OPERATIONS
  // ===========================

  async createProject(userId: string, data: { name: string; description?: string }) {
    return prisma.carouselProject.create({
      data: {
        userId,
        ...data,
      },
      include: {
        slides: {
          orderBy: { order: 'asc' },
        },
        texts: {
          orderBy: { order: 'asc' },
        },
      },
    })
  }

  async findProjectsByUserId(userId: string) {
    return prisma.carouselProject.findMany({
      where: { userId },
      include: {
        slides: {
          orderBy: { order: 'asc' },
        },
        texts: {
          orderBy: { order: 'asc' },
        },
        generations: {
          orderBy: { createdAt: 'desc' },
          take: 5, // Last 5 generations
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findProjectById(id: string) {
    return prisma.carouselProject.findUnique({
      where: { id },
      include: {
        slides: {
          orderBy: { order: 'asc' },
        },
        texts: {
          orderBy: { order: 'asc' },
        },
        generations: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })
  }

  async updateProject(id: string, data: Partial<{ name: string; description: string }>) {
    return prisma.carouselProject.update({
      where: { id },
      data,
      include: {
        slides: {
          orderBy: { order: 'asc' },
        },
        texts: {
          orderBy: { order: 'asc' },
        },
      },
    })
  }

  async deleteProject(id: string) {
    return prisma.carouselProject.delete({
      where: { id },
    })
  }

  // ===========================
  // SLIDE OPERATIONS
  // ===========================

  async createSlide(projectId: string, data: {
    fileName: string
    filePath: string
    fileType: string
    fileSize: number
    order: number
  }) {
    return prisma.carouselSlide.create({
      data: {
        projectId,
        ...data,
      },
    })
  }

  async findSlidesByProjectId(projectId: string) {
    return prisma.carouselSlide.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    })
  }

  async deleteSlide(id: string) {
    return prisma.carouselSlide.delete({
      where: { id },
    })
  }

  async updateSlideOrder(id: string, order: number) {
    return prisma.carouselSlide.update({
      where: { id },
      data: { order },
    })
  }

  // ===========================
  // TEXT OPERATIONS
  // ===========================

  async createText(projectId: string, data: {
    content: string
    styleData?: string
    positionData?: string
    position?: string
    alignment?: string
    fontSize?: number
    fontColor?: string
    fontWeight?: string
    order: number
  }) {
    return prisma.carouselText.create({
      data: {
        projectId,
        ...data,
      },
    })
  }

  async findTextsByProjectId(projectId: string) {
    return prisma.carouselText.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    })
  }

  async updateText(id: string, data: Partial<{
    content: string
    styleData: string
    positionData: string
    position: string
    alignment: string
    fontSize: number
    fontColor: string
    fontWeight: string
    order: number
  }>) {
    return prisma.carouselText.update({
      where: { id },
      data,
    })
  }

  async deleteText(id: string) {
    return prisma.carouselText.delete({
      where: { id },
    })
  }

  // ===========================
  // GENERATION OPERATIONS
  // ===========================

  async createGeneration(data: {
    projectId: string
    userId: string
    numSlides: number
    numSetsGenerated: number
    creditUsed: number
  }) {
    return prisma.carouselGeneration.create({
      data,
    })
  }

  async findGenerationsByProjectId(projectId: string) {
    return prisma.carouselGeneration.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findGenerationById(id: string) {
    return prisma.carouselGeneration.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            slides: true,
            texts: true,
          },
        },
      },
    })
  }

  async updateGenerationStatus(
    id: string,
    data: {
      status: string
      outputPath?: string
      errorMessage?: string
      completedAt?: Date
    }
  ) {
    return prisma.carouselGeneration.update({
      where: { id },
      data,
    })
  }

  // ===========================
  // STATISTICS
  // ===========================

  async getProjectStats(userId: string) {
    const totalProjects = await prisma.carouselProject.count({
      where: { userId },
    })

    const totalSlides = await prisma.carouselSlide.count({
      where: {
        project: { userId },
      },
    })

    const totalGenerations = await prisma.carouselGeneration.count({
      where: { userId },
    })

    const totalSetsGenerated = await prisma.carouselGeneration.aggregate({
      where: { userId },
      _sum: {
        numSetsGenerated: true,
      },
    })

    return {
      totalProjects,
      totalSlides,
      totalGenerations,
      totalSetsGenerated: totalSetsGenerated._sum.numSetsGenerated || 0,
    }
  }
}
