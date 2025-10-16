/**
 * Pose Generator Service
 *
 * Implements core business logic for pose generation:
 * - Project CRUD operations
 * - Pose library browsing
 * - Generation workflow (gallery & text modes)
 * - Credit management integration
 * - Ownership verification
 * - Statistics aggregation
 *
 * Phase 1.4: Service Layer Implementation
 */

import prisma from '../../../db/client'
import { CreditService } from '../../../services/credit.service'
import {
  NotFoundError,
  ResourceForbiddenError,
  InsufficientCreditsError,
  ValidationError,
  InsufficientQuotaError,
} from '../../../core/errors/errors'
import { enqueuePoseGeneration } from '../queue/queue.config'
import type {
  CreateProjectRequest,
  UpdateProjectRequest,
  GenerateRequest,
  GetLibraryRequest,
  PoseGeneratorProject,
  PoseGeneration,
  PoseLibraryItem,
  PoseCategory,
  PaginationMeta,
  GeneratedPose,
} from '../types'

const creditService = new CreditService()

export class PoseGeneratorService {
  // ============================================
  // PROJECT METHODS
  // ============================================

  /**
   * Create new project
   */
  async createProject(
    userId: string,
    data: CreateProjectRequest
  ): Promise<PoseGeneratorProject> {
    // Validate avatar exists if from Avatar Creator
    if (data.avatarSource === 'AVATAR_CREATOR' && data.avatarId) {
      const avatar = await prisma.avatar.findUnique({
        where: { id: data.avatarId },
      })

      if (!avatar) {
        throw new NotFoundError('Avatar not found')
      }

      // Verify ownership
      if (avatar.userId !== userId) {
        throw new ResourceForbiddenError('Avatar', data.avatarId)
      }
    }

    // Create project
    const project = await prisma.poseGeneratorProject.create({
      data: {
        userId,
        projectName: data.projectName,
        description: data.description || null,
        avatarImageUrl: data.avatarImageUrl,
        avatarSource: data.avatarSource,
        avatarId: data.avatarId || null,
        status: 'active',
      },
    })

    return project as PoseGeneratorProject
  }

  /**
   * Get user's projects with pagination
   */
  async getProjects(
    userId: string,
    page: number = 1,
    limit: number = 10,
    status?: 'active' | 'archived'
  ): Promise<{
    projects: Array<PoseGeneratorProject & { totalGenerations: number; totalPosesGenerated: number }>
    pagination: PaginationMeta
  }> {
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = { userId }
    if (status) {
      where.status = status
    }

    // Get total count
    const total = await prisma.poseGeneratorProject.count({ where })

    // Get projects with aggregated stats
    const projects = await prisma.poseGeneratorProject.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        generations: {
          select: {
            id: true,
            totalExpectedPoses: true,
            posesCompleted: true,
          },
        },
      },
    })

    // Calculate stats
    const projectsWithStats = projects.map((project) => ({
      ...project,
      totalGenerations: project.generations.length,
      totalPosesGenerated: project.generations.reduce(
        (sum, gen) => sum + gen.posesCompleted,
        0
      ),
      generations: undefined, // Remove from response
    }))

    return {
      projects: projectsWithStats as any,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    }
  }

  /**
   * Get project by ID with ownership verification
   */
  async getProjectById(
    projectId: string,
    userId: string
  ): Promise<PoseGeneratorProject & { generations?: PoseGeneration[] }> {
    const project = await prisma.poseGeneratorProject.findUnique({
      where: { id: projectId },
      include: {
        generations: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!project) {
      throw new NotFoundError('Project not found')
    }

    // Verify ownership
    if (project.userId !== userId) {
      throw new ResourceForbiddenError('Project', projectId)
    }

    return project as any
  }

  /**
   * Update project
   */
  async updateProject(
    projectId: string,
    userId: string,
    data: UpdateProjectRequest
  ): Promise<PoseGeneratorProject> {
    // Verify ownership
    await this.verifyProjectOwnership(projectId, userId)

    // Update project
    const project = await prisma.poseGeneratorProject.update({
      where: { id: projectId },
      data: {
        projectName: data.projectName,
        description: data.description,
        status: data.status,
        updatedAt: new Date(),
      },
    })

    return project as PoseGeneratorProject
  }

  /**
   * Delete project (cascade deletes generations and poses)
   */
  async deleteProject(projectId: string, userId: string): Promise<void> {
    // Verify ownership
    await this.verifyProjectOwnership(projectId, userId)

    // Check for active generations
    const activeGeneration = await prisma.poseGeneration.findFirst({
      where: {
        projectId,
        status: { in: ['pending', 'processing'] },
      },
    })

    if (activeGeneration) {
      throw new ValidationError(
        'Cannot delete project with active generations. Please wait for them to complete or cancel them first.'
      )
    }

    // Delete project (Prisma cascade will handle generations and poses)
    await prisma.poseGeneratorProject.delete({
      where: { id: projectId },
    })
  }

  // ============================================
  // POSE LIBRARY METHODS
  // ============================================

  /**
   * Browse pose library with filters and pagination
   */
  async getPoseLibrary(filters: GetLibraryRequest): Promise<{
    poses: PoseLibraryItem[]
    pagination: PaginationMeta
  }> {
    const page = parseInt(filters.page || '1')
    const limit = parseInt(filters.limit || '24')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = { isPublic: true }

    if (filters.category) {
      // Support both category ID and slug
      const category = await prisma.poseCategory.findFirst({
        where: {
          OR: [{ id: filters.category }, { name: filters.category }],
        },
      })

      if (category) {
        where.categoryId = category.id
      }
    }

    if (filters.difficulty) {
      where.difficulty = filters.difficulty
    }

    if (filters.genderSuitability) {
      where.genderSuitability = filters.genderSuitability
    }

    if (filters.featured === 'true') {
      where.isPremium = true
    }

    if (filters.search) {
      // Sanitize search input to prevent SQL injection
      // Escape SQL wildcards and limit length
      const sanitized = filters.search
        .replace(/[%_\\]/g, '\\$&')  // Escape SQL LIKE wildcards
        .trim()
        .substring(0, 100)  // Limit to 100 characters max

      // Only apply filter if search term is at least 2 characters
      if (sanitized.length >= 2) {
        where.OR = [
          { name: { contains: sanitized, mode: 'insensitive' } },
          { tags: { has: sanitized } },
        ]
      }
    }

    // Get total count
    const total = await prisma.poseLibrary.count({ where })

    // Get poses
    const poses = await prisma.poseLibrary.findMany({
      where,
      skip,
      take: limit,
      orderBy: { popularityScore: 'desc' },
      include: {
        category: true,
      },
    })

    return {
      poses: poses as any,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    }
  }

  /**
   * Get single pose by ID
   */
  async getPoseById(poseId: string): Promise<PoseLibraryItem> {
    const pose = await prisma.poseLibrary.findUnique({
      where: { id: poseId },
      include: { category: true },
    })

    if (!pose) {
      throw new NotFoundError('Pose not found')
    }

    if (!pose.isPublic) {
      throw new ResourceForbiddenError('Pose', poseId)
    }

    // Increment usage count (fire and forget)
    prisma.poseLibrary
      .update({
        where: { id: poseId },
        data: {
          usageCount: { increment: 1 },
          popularityScore: { increment: 1 },
        },
      })
      .catch(() => {}) // Ignore errors

    return pose as any
  }

  /**
   * Get all categories with hierarchical structure
   */
  async getCategories(): Promise<PoseCategory[]> {
    const categories = await prisma.poseCategory.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        children: true,
        _count: {
          select: { poses: true },
        },
      },
    })

    // Build hierarchical structure (root categories only)
    const rootCategories = categories.filter((cat) => !cat.parentId)

    return rootCategories.map((cat) => ({
      ...cat,
      poseCount: (cat as any)._count.poses,
      children: categories.filter((child) => child.parentId === cat.id),
    })) as any
  }

  // ============================================
  // GENERATION METHODS
  // ============================================

  /**
   * Start pose generation (gallery or text mode)
   */
  async startGeneration(
    userId: string,
    data: GenerateRequest
  ): Promise<PoseGeneration> {
    // Verify project ownership
    await this.verifyProjectOwnership(data.projectId, userId)

    // Calculate pose count
    const poseCount = this.calculatePoseCount(data)

    // Calculate credit cost (server-side!)
    const creditCost = this.calculateCreditCost(data, poseCount)

    // Check unlimited tier quota OR deduct credits
    const usedUnlimitedQuota = await this.checkAndUseUnlimitedQuota(userId, poseCount)

    // Create generation record first
    const generation = await prisma.poseGeneration.create({
      data: {
        projectId: data.projectId,
        userId,
        generationType: data.generationType,
        textPrompt: data.textPrompt || null,
        batchSize: data.batchSize || 4,
        totalExpectedPoses: poseCount,
        posesCompleted: 0,
        posesFailed: 0,
        creditCharged: usedUnlimitedQuota ? 0 : creditCost,
        creditRefunded: 0,
        useBackgroundChanger: data.useBackgroundChanger || false,
        backgroundMode: data.backgroundMode || null,
        backgroundPrompt: data.backgroundPrompt || null,
        exportFormats: data.outputFormats || [],
        avatarId: data.avatarId || null,
        status: 'pending',
      },
    })

    if (!usedUnlimitedQuota) {
      // SECURITY FIX: Use atomic transaction to prevent race condition in credit deduction
      // Multiple concurrent requests could bypass credit check without this
      await prisma.$transaction(async (tx) => {
        // 1. Lock user row to prevent concurrent modifications
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true }
        })

        if (!user) {
          throw new NotFoundError('User not found')
        }

        // 2. Get latest credit balance with lock (FOR UPDATE equivalent)
        const latestCredit = await tx.credit.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' }
        })

        const currentBalance = latestCredit?.balance || 0

        // 3. Verify sufficient balance AFTER acquiring lock
        if (currentBalance < creditCost) {
          throw new InsufficientCreditsError(creditCost, currentBalance)
        }

        // 4. Deduct credits atomically - balance is calculated within transaction
        await tx.credit.create({
          data: {
            userId,
            amount: -creditCost,
            balance: currentBalance - creditCost,
            type: 'usage',
            description: `Pose generation: ${poseCount} poses`,
            referenceType: 'pose_generation',
            referenceId: generation.id,
            metadata: {
              app: 'pose-generator',
              poseCount,
              costPerPose: 30,
              backgroundChangerCost: data.useBackgroundChanger ? poseCount * 10 : 0
            }
          }
        })
      }, {
        isolationLevel: 'Serializable',  // Highest isolation level
        timeout: 10000  // 10 second timeout
      })
    }

    // Create pose selections if gallery mode
    if (data.generationType === 'GALLERY_REFERENCE' && data.selectedPoseIds) {
      await prisma.poseSelection.createMany({
        data: data.selectedPoseIds.map((poseId) => ({
          generationId: generation.id,
          poseLibraryId: poseId,
        })),
      })
    }

    // Get avatar attributes if available
    let avatarAttributes = null
    if (data.avatarId) {
      const avatar = await prisma.avatar.findUnique({
        where: { id: data.avatarId },
        select: {
          gender: true,
          ageRange: true,
          ethnicity: true,
          style: true,
        },
      })
      if (avatar) {
        avatarAttributes = JSON.stringify(avatar)
      }
    }

    // Queue BullMQ job for processing
    const job = await enqueuePoseGeneration(
      {
        generationId: generation.id,
        userId,
        projectId: data.projectId,
        generationType: data.generationType,
        selectedPoseIds: data.selectedPoseIds,
        textPrompt: data.textPrompt,
        batchSize: data.batchSize || 4,
        totalExpectedPoses: poseCount,
        useBackgroundChanger: data.useBackgroundChanger || false,
        backgroundMode: data.backgroundMode,
        backgroundPrompt: data.backgroundPrompt,
        backgroundColor: data.backgroundColor,
        backgroundImageUrl: data.backgroundImageUrl,
        exportFormats: data.outputFormats,
        avatarId: data.avatarId,
        avatarAttributes,
        creditCharged: creditCost,
      },
      usedUnlimitedQuota ? 10 : 5 // Higher priority for unlimited users
    )

    // Update generation with job ID
    await prisma.poseGeneration.update({
      where: { id: generation.id },
      data: {
        queueJobId: job.id as string,
      },
    })

    console.log(
      `[PoseGenerator] Queued generation ${generation.id} (job ${job.id}) with ${poseCount} poses`
    )

    return generation as any as PoseGeneration
  }

  /**
   * Get generation status
   */
  async getGenerationStatus(
    generationId: string,
    userId: string
  ): Promise<PoseGeneration & { poses?: GeneratedPose[] }> {
    const generation = await prisma.poseGeneration.findUnique({
      where: { id: generationId },
      include: {
        poses: true,
        project: true,
      },
    })

    if (!generation) {
      throw new NotFoundError('Generation not found')
    }

    // Verify ownership
    if (generation.userId !== userId) {
      throw new ResourceForbiddenError('Generation', generationId)
    }

    return generation as any
  }

  /**
   * Get generation results (completed poses)
   */
  async getGenerationResults(
    generationId: string,
    userId: string
  ): Promise<{
    results: GeneratedPose[]
    generation: {
      id: string
      status: string
      totalPoses: number
      successCount: number
      failedCount: number
      creditCharged: number
      creditRefunded: number
    }
  }> {
    const generation = await prisma.poseGeneration.findUnique({
      where: { id: generationId },
      include: {
        poses: {
          where: { status: 'completed' },
        },
      },
    })

    if (!generation) {
      throw new NotFoundError('Generation not found')
    }

    // Verify ownership
    if (generation.userId !== userId) {
      throw new ResourceForbiddenError('Generation', generationId)
    }

    // Verify status
    if (!['completed', 'partial'].includes(generation.status)) {
      throw new ValidationError(
        'Generation is not completed yet. Please check status first.'
      )
    }

    return {
      results: generation.poses as any,
      generation: {
        id: generation.id,
        status: generation.status,
        totalPoses: generation.totalExpectedPoses,
        successCount: generation.posesCompleted,
        failedCount: generation.posesFailed,
        creditCharged: generation.creditCharged,
        creditRefunded: generation.creditRefunded,
      },
    }
  }

  // ============================================
  // STATS METHODS
  // ============================================

  /**
   * Get user statistics for dashboard
   *
   * P1-1 FIX: Optimized to eliminate N+1 queries using aggregations and parallel queries
   * PERFORMANCE: Reduced from ~8 sequential queries to 2 parallel batches
   */
  async getUserStats(userId: string): Promise<{
    totalPosesGenerated: number
    totalProjects: number
    recentGenerations: number
    creditUsage: {
      totalSpent: number
      last30Days: number
      averagePerGeneration: number
    }
    topUsedPoses: Array<{
      poseId: string
      poseName: string
      usageCount: number
      previewUrl: string
    }>
  }> {
    // Calculate date ranges once
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // BATCH 1: Execute all independent queries in parallel (major performance improvement)
    const [
      totalPosesGenerated,
      totalProjects,
      recentGenerations,
      creditStatsTotal,
      creditStatsLast30Days,
      generationCount,
      topPoses
    ] = await Promise.all([
      // Count total poses generated
      prisma.generatedPose.count({
        where: {
          generation: { userId },
        },
      }),

      // Count total active projects
      prisma.poseGeneratorProject.count({
        where: { userId, status: 'active' },
      }),

      // Count recent generations (last 7 days)
      prisma.poseGeneration.count({
        where: {
          userId,
          createdAt: { gte: sevenDaysAgo },
        },
      }),

      // Aggregate total credit usage (database-level aggregation - much faster)
      prisma.credit.aggregate({
        where: {
          userId,
          type: 'usage',
          referenceType: 'pose_generation',
        },
        _sum: { amount: true },
      }),

      // Aggregate last 30 days credit usage (separate optimized query)
      prisma.credit.aggregate({
        where: {
          userId,
          type: 'usage',
          referenceType: 'pose_generation',
          createdAt: { gte: thirtyDaysAgo },
        },
        _sum: { amount: true },
      }),

      // Get generation count for average calculation
      prisma.poseGeneration.count({ where: { userId } }),

      // Get top used poses with groupBy (optimized query)
      prisma.poseSelection.groupBy({
        by: ['poseLibraryId'],
        where: {
          generation: { userId },
        },
        _count: {
          poseLibraryId: true,
        },
        orderBy: {
          _count: {
            poseLibraryId: 'desc',
          },
        },
        take: 5,
      })
    ])

    const totalSpent = Math.abs(creditStatsTotal._sum.amount || 0)
    const last30Days = Math.abs(creditStatsLast30Days._sum.amount || 0)
    const averagePerGeneration = generationCount > 0 ? totalSpent / generationCount : 0

    // BATCH 2: Batch fetch pose details in single query (eliminates N+1 problem)
    const topPoseIds = topPoses.map((p) => p.poseLibraryId)
    const poseDetails = topPoseIds.length > 0
      ? await prisma.poseLibrary.findMany({
          where: { id: { in: topPoseIds } },
          select: {
            id: true,
            name: true,
            previewImageUrl: true,
          },
        })
      : []

    // Create lookup map for O(1) access instead of O(n) find
    const poseDetailsMap = new Map(
      poseDetails.map((pose) => [pose.id, pose])
    )

    const topUsedPoses = topPoses.map((p) => {
      const pose = poseDetailsMap.get(p.poseLibraryId)
      return {
        poseId: p.poseLibraryId,
        poseName: pose?.name || 'Unknown',
        usageCount: p._count.poseLibraryId,
        previewUrl: pose?.previewImageUrl || '',
      }
    })

    return {
      totalPosesGenerated,
      totalProjects,
      recentGenerations,
      creditUsage: {
        totalSpent,
        last30Days,
        averagePerGeneration: Math.round(averagePerGeneration),
      },
      topUsedPoses,
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Calculate total pose count from request
   */
  private calculatePoseCount(data: GenerateRequest): number {
    if (data.generationType === 'GALLERY_REFERENCE') {
      const batchSize = data.batchSize || 4
      return (data.selectedPoseIds?.length || 0) * batchSize
    } else {
      // TEXT_DESCRIPTION mode
      return data.variationCount || 4
    }
  }

  /**
   * Calculate credit cost (server-side, client cannot be trusted)
   */
  private calculateCreditCost(data: GenerateRequest, poseCount: number): number {
    const baseCost = poseCount * 30 // 30 credits per pose

    // Background changer: +10 credits per pose
    const backgroundCost = data.useBackgroundChanger ? poseCount * 10 : 0

    return baseCost + backgroundCost
  }

  /**
   * Verify project ownership (throws if not owner)
   */
  private async verifyProjectOwnership(
    projectId: string,
    userId: string
  ): Promise<void> {
    const project = await prisma.poseGeneratorProject.findUnique({
      where: { id: projectId },
      select: { userId: true },
    })

    if (!project) {
      throw new NotFoundError('Project not found')
    }

    if (project.userId !== userId) {
      throw new ResourceForbiddenError('Project', projectId)
    }
  }

  /**
   * Check unlimited tier quota and deduct if available
   * Returns true if quota was used, false if need to use credits
   */
  private async checkAndUseUnlimitedQuota(
    userId: string,
    poseCount: number
  ): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        unlimitedPoseActive: true,
        unlimitedPoseDailyQuota: true,
        unlimitedPoseQuotaUsed: true,
        unlimitedPoseQuotaResetAt: true,
        unlimitedPoseExpiresAt: true,
      },
    })

    if (!user || !user.unlimitedPoseActive) {
      return false // No unlimited tier
    }

    // Check if expired
    if (user.unlimitedPoseExpiresAt && user.unlimitedPoseExpiresAt < new Date()) {
      return false
    }

    // Check if quota needs reset (period-based, handles multi-day downtime)
    const now = new Date()
    const todayPeriod = now.toISOString().split('T')[0] // "2025-10-14"
    const lastResetPeriod = user.unlimitedPoseQuotaResetAt
      ? user.unlimitedPoseQuotaResetAt.toISOString().split('T')[0]
      : null

    // Reset if new day
    if (todayPeriod !== lastResetPeriod) {
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)

      await prisma.user.update({
        where: { id: userId },
        data: {
          unlimitedPoseQuotaUsed: poseCount,
          unlimitedPoseQuotaResetAt: tomorrow,
        },
      })

      return true
    }

    // Check if quota available
    const quotaRemaining = user.unlimitedPoseDailyQuota - user.unlimitedPoseQuotaUsed

    if (quotaRemaining < poseCount) {
      throw new InsufficientQuotaError('daily pose quota')
    }

    // Deduct quota
    await prisma.user.update({
      where: { id: userId },
      data: {
        unlimitedPoseQuotaUsed: { increment: poseCount },
      },
    })

    return true
  }

  /**
   * Handle partial failure refunds with Serializable transaction
   * Refunds credits for failed poses in a generation
   */
  async handlePartialFailure(generationId: string): Promise<{
    alreadyRefunded?: boolean
    refundAmount: number
    failedCount?: number
  }> {
    return await prisma.$transaction(async (tx) => {
      const generation = await tx.poseGeneration.findUnique({
        where: { id: generationId },
        include: { poses: { where: { status: 'failed' } } }
      })

      if (!generation) {
        throw new NotFoundError('Generation not found')
      }

      if (generation.creditRefunded > 0) {
        return { alreadyRefunded: true, refundAmount: 0 }
      }

      const failedCount = generation.poses.length
      const refundAmount = failedCount * 30

      if (refundAmount === 0) {
        return { refundAmount: 0, failedCount: 0 }
      }

      // Get balance with lock
      const latestCredit = await tx.credit.findFirst({
        where: { userId: generation.userId },
        orderBy: { createdAt: 'desc' }
      })
      const currentBalance = latestCredit?.balance || 0

      // Create refund atomically
      await tx.credit.create({
        data: {
          userId: generation.userId,
          amount: refundAmount,
          balance: currentBalance + refundAmount,
          type: 'refund',
          description: `Refund for ${failedCount} failed poses`,
          referenceId: generationId,
          referenceType: 'pose_generation'
        }
      })

      // Mark as refunded
      await tx.poseGeneration.update({
        where: { id: generationId },
        data: {
          creditRefunded: refundAmount,
          status: generation.posesCompleted > 0 ? 'partial' : 'failed'
        }
      })

      return { refundAmount, failedCount }
    }, {
      isolationLevel: 'Serializable',
      maxWait: 5000,
      timeout: 10000
    })
  }
}

export const poseGeneratorService = new PoseGeneratorService()
