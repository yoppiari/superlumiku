import prisma from '../db/client'
import { addDays } from 'date-fns'

export class QuotaService {
  /**
   * Check if user has quota available
   */
  async checkQuota(userId: string, quotaCost: number = 1): Promise<{
    allowed: boolean
    current: number
    limit: number
    remaining: number
    resetAt: Date
  }> {
    const today = new Date().toISOString().split('T')[0]

    let quota = await prisma.quotaUsage.findUnique({
      where: {
        userId_period_quotaType: {
          userId,
          period: today,
          quotaType: 'daily'
        }
      }
    })

    // Initialize quota if not exists
    if (!quota) {
      quota = await this.initializeDailyQuota(userId)
    }

    const remaining = quota.quotaLimit - quota.usageCount
    const allowed = remaining >= quotaCost

    return {
      allowed,
      current: quota.usageCount,
      limit: quota.quotaLimit,
      remaining,
      resetAt: quota.resetAt
    }
  }

  /**
   * Initialize daily quota for user
   */
  private async initializeDailyQuota(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: { include: { plan: true } } }
    })

    const dailyLimit = user?.subscription?.plan?.dailyQuota || 10 // Default 10 for free

    const today = new Date().toISOString().split('T')[0]
    const tomorrow = addDays(new Date(), 1)
    tomorrow.setHours(0, 0, 0, 0)

    return await prisma.quotaUsage.create({
      data: {
        userId,
        quotaType: 'daily',
        period: today,
        usageCount: 0,
        quotaLimit: dailyLimit,
        resetAt: tomorrow
      }
    })
  }

  /**
   * Increment quota usage
   * Uses database transaction with atomic increment to prevent race conditions
   */
  async incrementQuota(
    userId: string,
    modelKey: string,
    quotaCost: number = 1
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0]

    await prisma.$transaction(async (tx) => {
      const quota = await tx.quotaUsage.findUnique({
        where: {
          userId_period_quotaType: {
            userId,
            period: today,
            quotaType: 'daily'
          }
        }
      })

      if (!quota) {
        throw new Error('Quota record not found')
      }

      // Check if increment would exceed quota limit
      if (quota.usageCount + quotaCost > quota.quotaLimit) {
        throw new Error('Quota limit would be exceeded')
      }

      // Parse model breakdown
      const breakdown = quota.modelBreakdown
        ? JSON.parse(quota.modelBreakdown)
        : {}

      const modelId = modelKey.split(':')[1]
      breakdown[modelId] = (breakdown[modelId] || 0) + quotaCost

      // Update quota with atomic increment
      await tx.quotaUsage.update({
        where: { id: quota.id },
        data: {
          usageCount: { increment: quotaCost }, // Atomic increment!
          modelBreakdown: JSON.stringify(breakdown)
        }
      })
    }, {
      isolationLevel: 'Serializable',
      maxWait: 5000,
      timeout: 10000,
    })
  }

  /**
   * Get remaining quota
   */
  async getRemainingQuota(userId: string): Promise<number> {
    const result = await this.checkQuota(userId)
    return result.remaining
  }

  /**
   * Get quota usage details
   */
  async getQuotaUsage(userId: string) {
    const today = new Date().toISOString().split('T')[0]

    return await prisma.quotaUsage.findUnique({
      where: {
        userId_period_quotaType: {
          userId,
          period: today,
          quotaType: 'daily'
        }
      }
    })
  }

  /**
   * Reset daily quotas (cron job)
   */
  async resetDailyQuotas(): Promise<number> {
    const now = new Date()

    // Find all expired quotas
    const expiredQuotas = await prisma.quotaUsage.findMany({
      where: {
        quotaType: 'daily',
        resetAt: { lte: now }
      }
    })

    // Delete old quota records
    await prisma.quotaUsage.deleteMany({
      where: {
        quotaType: 'daily',
        resetAt: { lte: now }
      }
    })

    // Create new quota records for today
    const tomorrow = addDays(now, 1)
    tomorrow.setHours(0, 0, 0, 0)
    const today = now.toISOString().split('T')[0]

    for (const oldQuota of expiredQuotas) {
      await prisma.quotaUsage.create({
        data: {
          userId: oldQuota.userId,
          quotaType: 'daily',
          period: today,
          usageCount: 0,
          quotaLimit: oldQuota.quotaLimit,
          resetAt: tomorrow
        }
      })
    }

    return expiredQuotas.length
  }

  /**
   * Get quota breakdown by model
   */
  async getQuotaBreakdown(userId: string): Promise<Record<string, number>> {
    const quota = await this.getQuotaUsage(userId)

    if (!quota?.modelBreakdown) {
      return {}
    }

    return JSON.parse(quota.modelBreakdown)
  }
}

export const quotaService = new QuotaService()
