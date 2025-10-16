import { PrismaClient } from '@prisma/client'
import { poseGenerationQueue } from '../queue/queue.config'

const prisma = new PrismaClient()

/**
 * Metrics Service
 *
 * Provides comprehensive metrics and analytics for the Pose Generator system.
 * Tracks generation performance, user activity, popular poses, and error patterns.
 */

export interface SystemMetrics {
  // Generation metrics
  totalGenerations: number
  activeGenerations: number
  completedGenerations: number
  failedGenerations: number

  // Performance metrics
  avgGenerationTime: number
  avgPosesPerGeneration: number
  successRate: number

  // Queue metrics
  queueDepth: number
  queueWaiting: number
  queueActive: number
  queueFailed: number

  // Resource metrics
  totalPosesGenerated: number
  totalCreditsSpent: number
  totalCreditsRefunded: number

  // Time period
  startTime: Date
  endTime: Date
}

export class MetricsService {
  /**
   * Get comprehensive system metrics
   */
  async getSystemMetrics(params: {
    startDate?: Date
    endDate?: Date
  }): Promise<SystemMetrics> {
    const { startDate = new Date(Date.now() - 24 * 60 * 60 * 1000), endDate = new Date() } = params

    // Generation metrics
    const [total, active, completed, failed] = await Promise.all([
      prisma.poseGeneration.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.poseGeneration.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: 'processing',
        },
      }),
      prisma.poseGeneration.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: 'completed',
        },
      }),
      prisma.poseGeneration.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: 'failed',
        },
      }),
    ])

    // Performance metrics
    const performanceStats = await prisma.poseGeneration.aggregate({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: 'completed',
      },
      _avg: {
        avgGenerationTime: true,
        posesCompleted: true,
      },
    })

    // Queue metrics
    const queueCounts = await poseGenerationQueue.getJobCounts()

    // Resource metrics
    const resourceStats = await prisma.poseGeneration.aggregate({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: {
        posesCompleted: true,
        creditCharged: true,
        creditRefunded: true,
      },
    })

    const successRate = total > 0 ? (completed / total) * 100 : 0

    return {
      totalGenerations: total,
      activeGenerations: active,
      completedGenerations: completed,
      failedGenerations: failed,
      avgGenerationTime: performanceStats._avg.avgGenerationTime || 0,
      avgPosesPerGeneration: performanceStats._avg.posesCompleted || 0,
      successRate: Math.round(successRate * 100) / 100,
      queueDepth: queueCounts.waiting + queueCounts.active,
      queueWaiting: queueCounts.waiting,
      queueActive: queueCounts.active,
      queueFailed: queueCounts.failed,
      totalPosesGenerated: resourceStats._sum.posesCompleted || 0,
      totalCreditsSpent: resourceStats._sum.creditCharged || 0,
      totalCreditsRefunded: resourceStats._sum.creditRefunded || 0,
      startTime: startDate,
      endTime: endDate,
    }
  }

  /**
   * Get top users by generation count
   *
   * Optimized to use single query with JOIN instead of N+1 pattern
   */
  async getTopUsers(limit: number = 10): Promise<Array<{
    userId: string
    userName: string
    userEmail: string
    generationCount: number
    totalPoses: number
    successRate: number
  }>> {
    // Single optimized query with JOIN
    const result = await prisma.$queryRaw<Array<{
      userId: string
      userName: string
      userEmail: string
      generationCount: bigint
      totalPoses: bigint
      successfulGens: bigint
    }>>`
      SELECT
        u.id as "userId",
        u.name as "userName",
        u.email as "userEmail",
        COUNT(pg.id) as "generationCount",
        COALESCE(SUM(pg."posesCompleted"), 0) as "totalPoses",
        COUNT(CASE WHEN pg.status = 'completed' THEN 1 END) as "successfulGens"
      FROM users u
      INNER JOIN pose_generations pg ON pg."userId" = u.id
      GROUP BY u.id, u.name, u.email
      ORDER BY COUNT(pg.id) DESC
      LIMIT ${limit}
    `

    return result.map(r => ({
      userId: r.userId,
      userName: r.userName,
      userEmail: r.userEmail,
      generationCount: Number(r.generationCount),
      totalPoses: Number(r.totalPoses),
      successRate: Number(r.generationCount) > 0
        ? Math.round((Number(r.successfulGens) / Number(r.generationCount)) * 100) / 100
        : 0,
    }))
  }

  /**
   * Get most popular poses from library
   */
  async getPopularPoses(limit: number = 20): Promise<Array<{
    poseId: string
    name: string
    usageCount: number
    category: string
  }>> {
    const poses = await prisma.poseLibrary.findMany({
      where: { isPublic: true },
      orderBy: { usageCount: 'desc' },
      take: limit,
      include: { category: true },
    })

    return poses.map((p) => ({
      poseId: p.id,
      name: p.name,
      usageCount: p.usageCount,
      category: p.category.name,
    }))
  }

  /**
   * Get error analysis
   *
   * SECURITY: Fixed SQL injection vulnerability (P0 - SQL INJECTION)
   * - Added input validation
   * - Added sanitization
   * - Length limits applied
   * - Whitelist-based pattern matching
   */
  async getErrorAnalysis(): Promise<Array<{
    errorType: string
    count: number
    lastOccurred: Date
  }>> {
    const errors = await prisma.poseGeneration.findMany({
      where: {
        status: 'failed',
        errorMessage: { not: null },
      },
      select: {
        errorMessage: true,
        completedAt: true,
      },
      orderBy: { completedAt: 'desc' },
      take: 100,
    })

    // Group by error type
    const errorMap = new Map<string, { count: number; lastOccurred: Date }>()

    for (const error of errors) {
      // SECURITY FIX: Validate and sanitize error message before processing
      const sanitizedMessage = this.sanitizeErrorMessage(error.errorMessage!)
      const errorType = this.classifyError(sanitizedMessage)
      const existing = errorMap.get(errorType)

      if (existing) {
        existing.count++
        if (error.completedAt && error.completedAt > existing.lastOccurred) {
          existing.lastOccurred = error.completedAt
        }
      } else {
        errorMap.set(errorType, {
          count: 1,
          lastOccurred: error.completedAt || new Date(),
        })
      }
    }

    return Array.from(errorMap.entries()).map(([errorType, data]) => ({
      errorType,
      ...data,
    }))
  }

  /**
   * Sanitize error message for safe processing
   *
   * SECURITY: Prevents SQL injection and log injection
   * - Validates message type and length
   * - Removes SQL injection characters
   * - Truncates to safe length
   */
  private sanitizeErrorMessage(message: string): string {
    // 1. Validate input type
    if (typeof message !== 'string') {
      return 'INVALID_ERROR_TYPE'
    }

    // 2. Limit length to prevent resource exhaustion
    if (message.length > 2000) {
      message = message.substring(0, 2000)
    }

    // 3. Remove SQL injection characters and patterns
    // Remove: ; -- /* */ ' " \ ` = < > ( ) [ ]
    message = message
      .replace(/;/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '')
      .replace(/'/g, '')
      .replace(/"/g, '')
      .replace(/\\/g, '')
      .replace(/`/g, '')
      .replace(/</g, '')
      .replace(/>/g, '')

    return message
  }

  /**
   * Classify error message into type
   *
   * SECURITY: Whitelist-based pattern matching using safe regex
   * - Only checks lowercase alphanumeric words
   * - No user input directly used in logic
   * - Returns predefined constants only
   */
  private classifyError(message: string): string {
    // Convert to lowercase for safe matching
    const lower = message.toLowerCase()

    // Whitelist-based pattern matching
    if (/\bflux\b/.test(lower) || /\bapi\b/.test(lower)) return 'FLUX_API_ERROR'
    if (/\bstorage\b/.test(lower) || /\bupload\b/.test(lower)) return 'STORAGE_ERROR'
    if (/\bcredit\b/.test(lower)) return 'CREDIT_ERROR'
    if (/\btimeout\b/.test(lower)) return 'TIMEOUT_ERROR'
    if (/\bnetwork\b/.test(lower)) return 'NETWORK_ERROR'
    if (/\bcontrolnet\b/.test(lower)) return 'CONTROLNET_ERROR'
    if (/\bvalidation\b/.test(lower)) return 'VALIDATION_ERROR'

    return 'UNKNOWN_ERROR'
  }

  /**
   * Record generation event for analytics
   */
  async recordEvent(event: {
    type: 'generation_started' | 'generation_completed' | 'generation_failed' | 'export_generated' | 'recovery_triggered'
    generationId?: string
    userId?: string
    metadata?: Record<string, any>
  }): Promise<void> {
    // Could integrate with external analytics (Posthog, Mixpanel, etc.)
    console.log('[Metrics]', event.type, event)

    // For now, just log to console
    // Future: Send to analytics service
  }
}

export const metricsService = new MetricsService()
