import prisma from '../../../db/client'
import { Avatar, CreateAvatarRequest, UpdateAvatarRequest, AvatarStats } from '../types'
import path from 'path'
import fs from 'fs/promises'
import { existsSync } from 'fs'

export class AvatarService {
  /**
   * Create new avatar
   */
  async createAvatar(
    userId: string,
    projectId: string,
    data: CreateAvatarRequest,
    imagePath: string
  ): Promise<Avatar> {
    // Create thumbnail path
    const thumbnailPath = imagePath.replace(/(\.\w+)$/, '_thumb$1')

    // TODO: Generate thumbnail (future enhancement)
    // For now, use same image as thumbnail

    const avatar = await prisma.avatar.create({
      data: {
        userId,
        projectId,
        name: data.name,
        baseImageUrl: imagePath,
        thumbnailUrl: imagePath, // Use original for now
        gender: data.gender || null,
        ageRange: data.ageRange || null,
        style: data.style || null,
        ethnicity: data.ethnicity || null,
        sourceType: 'upload',
        usageCount: 0,
      },
    })

    return avatar as Avatar
  }

  /**
   * Get all avatars for user (all projects)
   */
  async getUserAvatars(userId: string): Promise<Avatar[]> {
    const avatars = await prisma.avatar.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return avatars as Avatar[]
  }

  /**
   * Get avatars in specific project
   */
  async getProjectAvatars(projectId: string, userId: string): Promise<Avatar[]> {
    const avatars = await prisma.avatar.findMany({
      where: { projectId, userId },
      orderBy: { createdAt: 'desc' },
    })

    return avatars as Avatar[]
  }

  /**
   * Get avatar by ID
   */
  async getAvatar(id: string, userId: string): Promise<Avatar | null> {
    const avatar = await prisma.avatar.findFirst({
      where: { id, userId },
    })

    return avatar as Avatar | null
  }

  /**
   * Update avatar
   */
  async updateAvatar(
    id: string,
    userId: string,
    data: UpdateAvatarRequest
  ): Promise<Avatar> {
    // Verify ownership
    const avatar = await this.getAvatar(id, userId)
    if (!avatar) {
      throw new Error('Avatar not found')
    }

    const updated = await prisma.avatar.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.gender !== undefined && { gender: data.gender || null }),
        ...(data.ageRange !== undefined && { ageRange: data.ageRange || null }),
        ...(data.style !== undefined && { style: data.style || null }),
        ...(data.ethnicity !== undefined && { ethnicity: data.ethnicity || null }),
      },
    })

    return updated as Avatar
  }

  /**
   * Delete avatar
   */
  async deleteAvatar(id: string, userId: string): Promise<void> {
    // Verify ownership
    const avatar = await this.getAvatar(id, userId)
    if (!avatar) {
      throw new Error('Avatar not found')
    }

    // Delete avatar files
    try {
      const baseImagePath = path.join(process.cwd(), avatar.baseImageUrl)
      if (existsSync(baseImagePath)) {
        await fs.unlink(baseImagePath)
      }

      if (avatar.thumbnailUrl && avatar.thumbnailUrl !== avatar.baseImageUrl) {
        const thumbnailPath = path.join(process.cwd(), avatar.thumbnailUrl)
        if (existsSync(thumbnailPath)) {
          await fs.unlink(thumbnailPath)
        }
      }
    } catch (error) {
      console.error('Error deleting avatar files:', error)
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await prisma.avatar.delete({
      where: { id },
    })
  }

  /**
   * Increment usage count
   */
  async incrementUsage(id: string): Promise<void> {
    await prisma.avatar.update({
      where: { id },
      data: {
        usageCount: { increment: 1 },
      },
    })
  }

  /**
   * Get avatar statistics for user (all projects)
   */
  async getStats(userId: string): Promise<AvatarStats> {
    const avatars = await prisma.avatar.findMany({
      where: { userId },
    })

    const totalAvatars = avatars.length
    const recentUploads = avatars.filter(a => {
      const dayAgo = new Date()
      dayAgo.setDate(dayAgo.getDate() - 7)
      return a.createdAt > dayAgo
    }).length

    const totalUsage = avatars.reduce((sum, a) => sum + a.usageCount, 0)
    const averageUsage = totalAvatars > 0 ? totalUsage / totalAvatars : 0

    return {
      totalAvatars,
      recentUploads,
      totalUsage,
      averageUsage: Math.round(averageUsage * 10) / 10,
    }
  }

  /**
   * Get avatar statistics for specific project
   */
  async getProjectStats(projectId: string, userId: string): Promise<AvatarStats> {
    const avatars = await prisma.avatar.findMany({
      where: { projectId, userId },
    })

    const totalAvatars = avatars.length
    const recentUploads = avatars.filter(a => {
      const dayAgo = new Date()
      dayAgo.setDate(dayAgo.getDate() - 7)
      return a.createdAt > dayAgo
    }).length

    const totalUsage = avatars.reduce((sum, a) => sum + a.usageCount, 0)
    const averageUsage = totalAvatars > 0 ? totalUsage / totalAvatars : 0

    return {
      totalAvatars,
      recentUploads,
      totalUsage,
      averageUsage: Math.round(averageUsage * 10) / 10,
    }
  }
}

export const avatarService = new AvatarService()
