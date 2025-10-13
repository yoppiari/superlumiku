import prisma from '../../../db/client'
import { AvatarProject } from '../types'

export class AvatarProjectRepository {
  /**
   * Get all projects for user
   */
  async findByUserId(userId: string): Promise<AvatarProject[]> {
    const projects = await prisma.avatarProject.findMany({
      where: { userId },
      include: {
        avatars: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return projects as AvatarProject[]
  }

  /**
   * Get single project by ID
   */
  async findById(projectId: string, userId: string): Promise<AvatarProject | null> {
    const project = await prisma.avatarProject.findFirst({
      where: { id: projectId, userId },
      include: {
        avatars: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    return project as AvatarProject | null
  }

  /**
   * Create new project
   */
  async create(userId: string, name: string, description?: string): Promise<AvatarProject> {
    const project = await prisma.avatarProject.create({
      data: {
        userId,
        name,
        description: description || null,
      },
      include: {
        avatars: true,
      },
    })

    return project as AvatarProject
  }

  /**
   * Update project
   */
  async update(
    projectId: string,
    userId: string,
    data: { name?: string; description?: string }
  ): Promise<AvatarProject> {
    const project = await prisma.avatarProject.update({
      where: { id: projectId, userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description || null }),
      },
      include: {
        avatars: true,
      },
    })

    return project as AvatarProject
  }

  /**
   * Delete project (cascade deletes avatars)
   */
  async delete(projectId: string, userId: string): Promise<void> {
    await prisma.avatarProject.delete({
      where: { id: projectId, userId },
    })
  }
}

export const avatarProjectRepository = new AvatarProjectRepository()
