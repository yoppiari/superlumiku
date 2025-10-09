import prisma from '../../../db/client'

export class PosterEditorService {
  /**
   * Create a new poster project
   */
  async createProject(userId: string, name: string, description?: string) {
    return await prisma.posterEditorProject.create({
      data: {
        userId,
        name,
        description,
      },
      include: {
        posters: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    })
  }

  /**
   * Get all projects for a user
   */
  async getProjects(userId: string) {
    return await prisma.posterEditorProject.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        posters: {
          orderBy: { createdAt: 'desc' },
          take: 5, // Latest 5 posters per project
        },
      },
    })
  }

  /**
   * Get a specific project by ID
   */
  async getProjectById(projectId: string, userId: string) {
    return await prisma.posterEditorProject.findFirst({
      where: {
        id: projectId,
        userId,
      },
      include: {
        posters: {
          orderBy: { createdAt: 'desc' },
          include: {
            exports: true,
          },
        },
      },
    })
  }

  /**
   * Update project details
   */
  async updateProject(projectId: string, userId: string, data: { name?: string; description?: string }) {
    // Verify ownership
    const project = await prisma.posterEditorProject.findFirst({
      where: {
        id: projectId,
        userId,
      },
    })

    if (!project) {
      throw new Error('Project not found')
    }

    return await prisma.posterEditorProject.update({
      where: { id: projectId },
      data,
    })
  }

  /**
   * Delete a project and all its posters
   */
  async deleteProject(projectId: string, userId: string) {
    // Verify ownership
    const project = await prisma.posterEditorProject.findFirst({
      where: {
        id: projectId,
        userId,
      },
    })

    if (!project) {
      throw new Error('Project not found')
    }

    // Delete project (cascades to posters and exports)
    await prisma.posterEditorProject.delete({
      where: { id: projectId },
    })
  }

  /**
   * Get posters for a specific project
   */
  async getPosters(projectId: string) {
    return await prisma.posterEdit.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        exports: true,
      },
    })
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string) {
    const [totalProjects, totalPosters, totalExports] = await Promise.all([
      prisma.posterEditorProject.count({
        where: { userId },
      }),
      prisma.posterEdit.count({
        where: { userId },
      }),
      prisma.posterExport.count({
        where: {
          posterEdit: {
            userId,
          },
        },
      }),
    ])

    return {
      totalProjects,
      totalPosters,
      totalExports,
    }
  }
}

export const posterEditorService = new PosterEditorService()
