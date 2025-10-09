import prisma from '../../../db/client'
import { VideoGeneratorProject, VideoGeneration } from '@prisma/client'

/**
 * Video Generator Repository
 *
 * Handles all database operations for Video Generator app
 */

export class VideoGenRepository {
  // ========================================
  // PROJECT OPERATIONS
  // ========================================

  /**
   * Get all projects for a user
   */
  async getProjects(userId: string) {
    return prisma.videoGeneratorProject.findMany({
      where: { userId },
      include: {
        generations: {
          orderBy: { createdAt: 'desc' },
          take: 5, // Latest 5 generations per project
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Get project by ID
   */
  async getProjectById(projectId: string, userId: string) {
    return prisma.videoGeneratorProject.findFirst({
      where: {
        id: projectId,
        userId,
      },
      include: {
        generations: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })
  }

  /**
   * Create new project
   */
  async createProject(data: { userId: string; name: string; description?: string }) {
    return prisma.videoGeneratorProject.create({
      data,
      include: {
        generations: true,
      },
    })
  }

  /**
   * Update project
   */
  async updateProject(projectId: string, userId: string, data: { name?: string; description?: string }) {
    return prisma.videoGeneratorProject.updateMany({
      where: {
        id: projectId,
        userId,
      },
      data,
    })
  }

  /**
   * Delete project
   */
  async deleteProject(projectId: string, userId: string) {
    return prisma.videoGeneratorProject.deleteMany({
      where: {
        id: projectId,
        userId,
      },
    })
  }

  // ========================================
  // GENERATION OPERATIONS
  // ========================================

  /**
   * Create new generation
   */
  async createGeneration(data: {
    projectId: string
    userId: string
    provider: string
    modelId: string
    modelName: string
    prompt: string
    negativePrompt?: string
    startImagePath?: string
    endImagePath?: string
    resolution: string
    duration: number
    aspectRatio: string
    creditUsed: number
    advancedSettings?: string
  }) {
    return prisma.videoGeneration.create({
      data: {
        ...data,
        status: 'pending',
      },
    })
  }

  /**
   * Update generation status
   */
  async updateGenerationStatus(
    generationId: string,
    data: {
      status?: string
      outputPath?: string
      thumbnailPath?: string
      errorMessage?: string
      providerJobId?: string
      providerResponse?: string
      completedAt?: Date
    }
  ) {
    return prisma.videoGeneration.update({
      where: { id: generationId },
      data,
    })
  }

  /**
   * Get generation by ID
   */
  async getGenerationById(generationId: string) {
    return prisma.videoGeneration.findUnique({
      where: { id: generationId },
      include: {
        project: true,
      },
    })
  }

  /**
   * Get all generations for a project
   */
  async getGenerationsByProject(projectId: string) {
    return prisma.videoGeneration.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Get generations by status
   */
  async getGenerationsByStatus(status: string) {
    return prisma.videoGeneration.findMany({
      where: { status },
      include: {
        project: true,
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  /**
   * Get user's recent generations
   */
  async getUserGenerations(userId: string, limit: number = 20) {
    return prisma.videoGeneration.findMany({
      where: { userId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  /**
   * Get pending/processing generations for polling
   */
  async getActiveGenerations() {
    return prisma.videoGeneration.findMany({
      where: {
        status: {
          in: ['pending', 'processing'],
        },
      },
      include: {
        project: true,
      },
    })
  }

  /**
   * Get generation by provider job ID
   */
  async getGenerationByJobId(providerJobId: string) {
    return prisma.videoGeneration.findFirst({
      where: { providerJobId },
    })
  }

  // ========================================
  // STATISTICS
  // ========================================

  /**
   * Get user statistics
   */
  async getUserStats(userId: string) {
    const [totalProjects, totalGenerations, completedGenerations, totalCreditsUsed] = await Promise.all([
      prisma.videoGeneratorProject.count({
        where: { userId },
      }),
      prisma.videoGeneration.count({
        where: { userId },
      }),
      prisma.videoGeneration.count({
        where: {
          userId,
          status: 'completed',
        },
      }),
      prisma.videoGeneration.aggregate({
        where: { userId },
        _sum: {
          creditUsed: true,
        },
      }),
    ])

    return {
      totalProjects,
      totalGenerations,
      completedGenerations,
      failedGenerations: totalGenerations - completedGenerations,
      totalCreditsUsed: totalCreditsUsed._sum.creditUsed || 0,
    }
  }

  /**
   * Get global app statistics
   */
  async getAppStats() {
    const [totalProjects, totalGenerations, totalUsers] = await Promise.all([
      prisma.videoGeneratorProject.count(),
      prisma.videoGeneration.count(),
      prisma.videoGeneratorProject.groupBy({
        by: ['userId'],
      }),
    ])

    return {
      totalProjects,
      totalGenerations,
      totalUsers: totalUsers.length,
    }
  }
}
