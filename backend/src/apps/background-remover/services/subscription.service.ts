import { prisma } from '../../../db/client'
import { BackgroundRemovalTier, SubscriptionQuotaCheck } from '../types'
import { pricingService } from './pricing.service'

/**
 * SubscriptionService - Check quotas and manage plans
 */
class SubscriptionService {
  /**
   * Get user's subscription
   */
  async getUserSubscription(userId: string) {
    return await prisma.backgroundRemoverSubscription.findUnique({
      where: { userId },
      include: {
        usageRecords: {
          where: {
            date: this.getTodayDate(),
          },
        },
      },
    })
  }

  /**
   * Check if user can use subscription for tier
   */
  async checkSubscriptionQuota(
    userId: string,
    tier: BackgroundRemovalTier,
    quantity: number = 1
  ): Promise<SubscriptionQuotaCheck> {
    const subscription = await this.getUserSubscription(userId)

    // No active subscription
    if (!subscription || subscription.status !== 'active') {
      return {
        hasSubscription: false,
        dailyQuota: 0,
        usedToday: 0,
        remainingToday: 0,
        professionalQuota: 0,
        professionalUsedToday: 0,
        professionalRemainingToday: 0,
        canUseSubscription: false,
        needsCredits: true,
        quotaExceeded: false,
      }
    }

    // Check if subscription expired
    if (subscription.currentPeriodEnd < new Date()) {
      return {
        hasSubscription: true,
        plan: subscription.plan as 'starter' | 'pro',
        dailyQuota: subscription.dailyQuota,
        usedToday: 0,
        remainingToday: 0,
        professionalQuota: subscription.professionalDailyQuota,
        professionalUsedToday: 0,
        professionalRemainingToday: 0,
        canUseSubscription: false,
        needsCredits: true,
        quotaExceeded: false,
      }
    }

    // Check if tier is allowed
    const tierAllowed = subscription.allowedTiers.includes(tier)
    if (!tierAllowed) {
      return {
        hasSubscription: true,
        plan: subscription.plan as 'starter' | 'pro',
        dailyQuota: subscription.dailyQuota,
        usedToday: 0,
        remainingToday: 0,
        professionalQuota: subscription.professionalDailyQuota,
        professionalUsedToday: 0,
        professionalRemainingToday: 0,
        canUseSubscription: false,
        needsCredits: true,
        quotaExceeded: false,
      }
    }

    // Calculate usage for today
    const todayDate = this.getTodayDate()
    const todayUsage = subscription.usageRecords || []

    const totalUsedToday = todayUsage.reduce((sum, record) => sum + record.removalsCount, 0)
    const professionalUsedToday = todayUsage
      .filter((r) => r.tier === 'professional' || r.tier === 'industry')
      .reduce((sum, record) => sum + record.removalsCount, 0)

    const remainingToday = subscription.dailyQuota - totalUsedToday
    const professionalRemainingToday =
      subscription.professionalDailyQuota - professionalUsedToday

    // Check if user has enough quota
    const needsProfessionalQuota = tier === 'professional' || tier === 'industry'
    const canUseSubscription = needsProfessionalQuota
      ? remainingToday >= quantity && professionalRemainingToday >= quantity
      : remainingToday >= quantity

    return {
      hasSubscription: true,
      plan: subscription.plan as 'starter' | 'pro',
      dailyQuota: subscription.dailyQuota,
      usedToday: totalUsedToday,
      remainingToday,
      professionalQuota: subscription.professionalDailyQuota,
      professionalUsedToday,
      professionalRemainingToday,
      canUseSubscription,
      needsCredits: !canUseSubscription,
      quotaExceeded: remainingToday < quantity,
    }
  }

  /**
   * Record subscription usage
   */
  async recordUsage(
    userId: string,
    tier: BackgroundRemovalTier,
    quantity: number = 1
  ): Promise<void> {
    const subscription = await this.getUserSubscription(userId)

    if (!subscription) {
      throw new Error('No active subscription found')
    }

    const todayDate = this.getTodayDate()
    const creditsEquivalent = pricingService.calculateCreditsEquivalent(quantity, tier)

    // Upsert usage record
    await prisma.backgroundRemoverSubscriptionUsage.upsert({
      where: {
        subscriptionId_date_tier: {
          subscriptionId: subscription.id,
          date: todayDate,
          tier,
        },
      },
      update: {
        removalsCount: {
          increment: quantity,
        },
        totalCreditsEquivalent: {
          increment: creditsEquivalent,
        },
      },
      create: {
        subscriptionId: subscription.id,
        userId,
        date: todayDate,
        tier,
        removalsCount: quantity,
        totalCreditsEquivalent: creditsEquivalent,
      },
    })
  }

  /**
   * Create subscription
   */
  async createSubscription(
    userId: string,
    plan: 'starter' | 'pro',
    paymentId?: string
  ) {
    const planDetails = pricingService.getSubscriptionPlanDetails(plan)

    const currentDate = new Date()
    const nextMonth = new Date(currentDate)
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    return await prisma.backgroundRemoverSubscription.create({
      data: {
        userId,
        plan,
        status: 'active',
        monthlyPrice: planDetails.price,
        dailyQuota: planDetails.dailyQuota,
        professionalDailyQuota: planDetails.dailyQuota === 200 ? 50 : 0,
        allowedTiers: planDetails.allowedTiers as any,
        subscribedAt: currentDate,
        currentPeriodEnd: nextMonth,
        nextBillingDate: nextMonth,
        lastPaymentId: paymentId,
        autoRenew: true,
      },
    })
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string, reason?: string) {
    const subscription = await prisma.backgroundRemoverSubscription.findUnique({
      where: { userId },
    })

    if (!subscription) {
      throw new Error('No subscription found')
    }

    return await prisma.backgroundRemoverSubscription.update({
      where: { userId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelReason: reason,
        autoRenew: false,
      },
    })
  }

  /**
   * Reactivate subscription
   */
  async reactivateSubscription(userId: string) {
    return await prisma.backgroundRemoverSubscription.update({
      where: { userId },
      data: {
        status: 'active',
        cancelledAt: null,
        cancelReason: null,
        autoRenew: true,
      },
    })
  }

  /**
   * Get subscription usage statistics
   */
  async getUsageStats(userId: string, days: number = 7) {
    const subscription = await this.getUserSubscription(userId)

    if (!subscription) {
      return null
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const usageRecords = await prisma.backgroundRemoverSubscriptionUsage.findMany({
      where: {
        subscriptionId: subscription.id,
        date: {
          gte: this.formatDate(startDate),
        },
      },
      orderBy: {
        date: 'asc',
      },
    })

    // Group by date
    const dailyStats = usageRecords.reduce(
      (acc, record) => {
        if (!acc[record.date]) {
          acc[record.date] = {
            date: record.date,
            totalRemovals: 0,
            byTier: {} as Record<string, number>,
            creditsEquivalent: 0,
          }
        }

        acc[record.date].totalRemovals += record.removalsCount
        acc[record.date].byTier[record.tier] = record.removalsCount
        acc[record.date].creditsEquivalent += record.totalCreditsEquivalent

        return acc
      },
      {} as Record<string, any>
    )

    return {
      subscription: {
        plan: subscription.plan,
        dailyQuota: subscription.dailyQuota,
        professionalDailyQuota: subscription.professionalDailyQuota,
      },
      dailyStats: Object.values(dailyStats),
      totalRemovals: usageRecords.reduce((sum, r) => sum + r.removalsCount, 0),
      totalCreditsEquivalent: usageRecords.reduce(
        (sum, r) => sum + r.totalCreditsEquivalent,
        0
      ),
    }
  }

  /**
   * Helper: Get today's date string (YYYY-MM-DD)
   */
  private getTodayDate(): string {
    return this.formatDate(new Date())
  }

  /**
   * Helper: Format date as YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  /**
   * Check and update expired subscriptions (cron job)
   */
  async updateExpiredSubscriptions(): Promise<number> {
    const now = new Date()

    const result = await prisma.backgroundRemoverSubscription.updateMany({
      where: {
        status: 'active',
        currentPeriodEnd: {
          lt: now,
        },
        autoRenew: false,
      },
      data: {
        status: 'expired',
      },
    })

    return result.count
  }
}

export const subscriptionService = new SubscriptionService()
