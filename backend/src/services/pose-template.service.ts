import prisma from '../db/client'

export interface PoseTemplate {
  id: string
  category: string
  subcategory: string | null
  keypointsJson: string
  previewUrl: string
  difficulty: string
  tags: string
  description: string | null
  gender: string | null
  productPlacement: string | null
  isActive: boolean
  successRate: number
  avgQualityScore: number
  usageCount: number
  createdAt: Date
  updatedAt: Date
}

export interface PoseTemplateFilters {
  category?: string
  difficulty?: string
  gender?: string
  tags?: string // Search in tags
  isActive?: boolean
  limit?: number
  offset?: number
  sort?: 'popular' | 'quality' | 'recent' | 'random'
}

export interface PoseTemplateResponse {
  data: PoseTemplate[]
  meta: {
    total: number
    page: number
    perPage: number
    totalPages: number
    hasMore: boolean
  }
}

export class PoseTemplateService {
  /**
   * Get all pose templates with filters and pagination
   */
  async getAllPoseTemplates(
    filters: PoseTemplateFilters = {}
  ): Promise<PoseTemplateResponse> {
    const {
      category,
      difficulty,
      gender,
      tags,
      isActive = true,
      limit = 20,
      offset = 0,
      sort = 'recent',
    } = filters

    // Build where clause
    const where: any = {
      isActive,
      ...(category && { category }),
      ...(difficulty && { difficulty }),
      ...(gender && { gender }),
      ...(tags && {
        tags: {
          contains: tags,
        },
      }),
    }

    // Get total count
    const total = await prisma.poseTemplate.count({ where })

    // Build orderBy clause
    let orderBy: any
    if (sort === 'popular') {
      orderBy = { usageCount: 'desc' }
    } else if (sort === 'quality') {
      orderBy = { avgQualityScore: 'desc' }
    } else if (sort === 'recent') {
      orderBy = { createdAt: 'desc' }
    } else if (sort === 'random') {
      // For random, we'll use a different approach
      orderBy = { createdAt: 'desc' } // fallback to recent
    }

    // Fetch poses
    let poses: PoseTemplate[]

    if (sort === 'random') {
      // Get total count and generate random offset
      const randomOffset = Math.floor(Math.random() * Math.max(0, total - limit))
      poses = await prisma.poseTemplate.findMany({
        where,
        skip: randomOffset,
        take: limit,
      })
    } else {
      poses = await prisma.poseTemplate.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
      })
    }

    // Calculate pagination metadata
    const perPage = limit
    const page = Math.floor(offset / limit) + 1
    const totalPages = Math.ceil(total / perPage)
    const hasMore = offset + limit < total

    return {
      data: poses,
      meta: {
        total,
        page,
        perPage,
        totalPages,
        hasMore,
      },
    }
  }

  /**
   * Get a single pose template by ID
   */
  async getPoseTemplateById(id: string): Promise<PoseTemplate | null> {
    const pose = await prisma.poseTemplate.findUnique({
      where: { id },
    })

    // Increment usage count
    if (pose) {
      await prisma.poseTemplate.update({
        where: { id },
        data: { usageCount: { increment: 1 } },
      })
    }

    return pose
  }

  /**
   * Get a random pose template with optional filters
   */
  async getRandomPoseTemplate(filters: Omit<PoseTemplateFilters, 'limit' | 'offset' | 'sort'> = {}): Promise<PoseTemplate | null> {
    const { category, difficulty, gender, tags, isActive = true } = filters

    // Build where clause
    const where: any = {
      isActive,
      ...(category && { category }),
      ...(difficulty && { difficulty }),
      ...(gender && { gender }),
      ...(tags && {
        tags: {
          contains: tags,
        },
      }),
    }

    // Get total count
    const total = await prisma.poseTemplate.count({ where })

    if (total === 0) {
      return null
    }

    // Generate random offset
    const randomOffset = Math.floor(Math.random() * total)

    // Fetch one pose
    const poses = await prisma.poseTemplate.findMany({
      where,
      skip: randomOffset,
      take: 1,
    })

    const pose = poses[0] || null

    // Increment usage count
    if (pose) {
      await prisma.poseTemplate.update({
        where: { id: pose.id },
        data: { usageCount: { increment: 1 } },
      })
    }

    return pose
  }

  /**
   * Get pose template statistics
   */
  async getPoseTemplateStats() {
    const total = await prisma.poseTemplate.count()
    const active = await prisma.poseTemplate.count({ where: { isActive: true } })

    // Category distribution
    const categoryStats = await prisma.poseTemplate.groupBy({
      by: ['category'],
      _count: {
        category: true,
      },
      where: {
        isActive: true,
      },
    })

    // Difficulty distribution
    const difficultyStats = await prisma.poseTemplate.groupBy({
      by: ['difficulty'],
      _count: {
        difficulty: true,
      },
      where: {
        isActive: true,
      },
    })

    // Gender distribution
    const genderStats = await prisma.poseTemplate.groupBy({
      by: ['gender'],
      _count: {
        gender: true,
      },
      where: {
        isActive: true,
        gender: {
          not: null,
        },
      },
    })

    return {
      total,
      active,
      categories: categoryStats.map((s) => ({
        category: s.category,
        count: s._count.category,
      })),
      difficulties: difficultyStats.map((s) => ({
        difficulty: s.difficulty,
        count: s._count.difficulty,
      })),
      genders: genderStats.map((s) => ({
        gender: s.gender,
        count: s._count.gender,
      })),
    }
  }
}

export const poseTemplateService = new PoseTemplateService()
