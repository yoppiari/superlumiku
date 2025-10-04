import prisma from '../db/client'
import path from 'path'
import fs from 'fs/promises'

export interface GenerationItem {
  id: string
  appId: 'video-mixer' | 'carousel-mix'
  appName: string
  appIcon: string
  appColor: string
  projectId: string
  projectName: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  outputPaths: string[]
  thumbnailUrl?: string
  creditUsed: number
  createdAt: Date
  completedAt?: Date
  fileCount: number
  totalSize?: number
}

export interface GenerationFilters {
  appId?: string
  status?: string
  limit?: number
  offset?: number
  sort?: 'latest' | 'oldest' | 'name'
}

export class GenerationService {
  /**
   * Get all generations for a user with filters
   */
  async getAllGenerations(
    userId: string,
    filters: GenerationFilters = {}
  ): Promise<{ generations: GenerationItem[]; total: number; hasMore: boolean }> {
    const { appId, status, limit = 20, offset = 0, sort = 'latest' } = filters

    const generations: GenerationItem[] = []

    // Fetch from Video Mixer if not filtered to another app
    if (!appId || appId === 'video-mixer') {
      const videoMixerGens = await prisma.videoMixerGeneration.findMany({
        where: {
          userId,
          ...(status && { status }),
        },
        include: {
          project: true,
        },
        orderBy: { createdAt: sort === 'latest' ? 'desc' : 'asc' },
      })

      for (const gen of videoMixerGens) {
        const outputPaths = gen.outputPaths ? JSON.parse(gen.outputPaths) : []
        const thumbnailUrl = await this.getThumbnailUrl('video-mixer', userId, gen.id)
        const totalSize = await this.calculateTotalSize(outputPaths)

        generations.push({
          id: gen.id,
          appId: 'video-mixer',
          appName: 'Video Mixer',
          appIcon: 'video',
          appColor: 'purple',
          projectId: gen.projectId,
          projectName: gen.project.name,
          status: gen.status as any,
          outputPaths,
          thumbnailUrl,
          creditUsed: gen.creditUsed,
          createdAt: gen.createdAt,
          completedAt: gen.completedAt || undefined,
          fileCount: outputPaths.length,
          totalSize,
        })
      }
    }

    // Fetch from Carousel Mix if not filtered to another app
    if (!appId || appId === 'carousel-mix') {
      const carouselGens = await prisma.carouselGeneration.findMany({
        where: {
          userId,
          ...(status && { status }),
        },
        include: {
          project: true,
        },
        orderBy: { createdAt: sort === 'latest' ? 'desc' : 'asc' },
      })

      for (const gen of carouselGens) {
        const outputPaths = gen.outputPaths ? JSON.parse(gen.outputPaths) : []
        const thumbnailUrl = await this.getThumbnailUrl('carousel-mix', userId, gen.id)
        const totalSize = await this.calculateTotalSize(outputPaths)

        generations.push({
          id: gen.id,
          appId: 'carousel-mix',
          appName: 'Carousel Mix',
          appIcon: 'folder-open',
          appColor: 'blue',
          projectId: gen.projectId,
          projectName: gen.project.name,
          status: gen.status as any,
          outputPaths,
          thumbnailUrl,
          creditUsed: gen.creditUsed,
          createdAt: gen.createdAt,
          completedAt: gen.completedAt || undefined,
          fileCount: outputPaths.length,
          totalSize,
        })
      }
    }

    // Sort all generations together
    generations.sort((a, b) => {
      if (sort === 'latest') {
        return b.createdAt.getTime() - a.createdAt.getTime()
      } else if (sort === 'oldest') {
        return a.createdAt.getTime() - b.createdAt.getTime()
      } else if (sort === 'name') {
        return a.projectName.localeCompare(b.projectName)
      }
      return 0
    })

    // Apply pagination
    const total = generations.length
    const paginatedGenerations = generations.slice(offset, offset + limit)
    const hasMore = offset + limit < total

    return {
      generations: paginatedGenerations,
      total,
      hasMore,
    }
  }

  /**
   * Get recent generations (latest 5)
   */
  async getRecentGenerations(userId: string, limit = 5): Promise<GenerationItem[]> {
    const result = await this.getAllGenerations(userId, { limit, sort: 'latest' })
    return result.generations
  }

  /**
   * Delete a generation and cleanup files
   */
  async deleteGeneration(generationId: string, appId: string, userId: string): Promise<void> {
    if (appId === 'video-mixer') {
      const generation = await prisma.videoMixerGeneration.findFirst({
        where: { id: generationId, userId },
      })

      if (!generation) {
        throw new Error('Generation not found')
      }

      // Delete files
      const generationDir = path.join(process.cwd(), 'uploads', 'video-mixer', userId, generationId)
      await this.deleteDirectory(generationDir)

      // Delete from database
      await prisma.videoMixerGeneration.delete({
        where: { id: generationId },
      })
    } else if (appId === 'carousel-mix') {
      const generation = await prisma.carouselGeneration.findFirst({
        where: { id: generationId, userId },
      })

      if (!generation) {
        throw new Error('Generation not found')
      }

      // Delete files
      const generationDir = path.join(process.cwd(), 'uploads', 'carousel-mix', userId, generationId)
      await this.deleteDirectory(generationDir)

      // Delete from database
      await prisma.carouselGeneration.delete({
        where: { id: generationId },
      })
    } else {
      throw new Error('Invalid app ID')
    }
  }

  /**
   * Get thumbnail URL for a generation
   */
  private async getThumbnailUrl(appId: string, userId: string, generationId: string): Promise<string | undefined> {
    const thumbPath = path.join(process.cwd(), 'uploads', appId, userId, generationId, 'thumb.jpg')
    try {
      await fs.access(thumbPath)
      return `/uploads/${appId}/${userId}/${generationId}/thumb.jpg`
    } catch {
      return undefined
    }
  }

  /**
   * Calculate total size of files
   */
  private async calculateTotalSize(filePaths: string[]): Promise<number> {
    let totalSize = 0
    for (const filePath of filePaths) {
      try {
        const fullPath = path.join(process.cwd(), filePath)
        const stats = await fs.stat(fullPath)
        totalSize += stats.size
      } catch {
        // File doesn't exist, skip
      }
    }
    return totalSize
  }

  /**
   * Delete directory recursively
   */
  private async deleteDirectory(dirPath: string): Promise<void> {
    try {
      await fs.rm(dirPath, { recursive: true, force: true })
    } catch (error) {
      console.error('Error deleting directory:', error)
    }
  }
}
