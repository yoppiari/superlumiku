import prisma from '../db/client'
import { Subscription, SubscriptionPlan } from '@prisma/client'
import { addDays, addMonths, addYears } from 'date-fns'

export class SubscriptionService {
  /**
   * Create new subscription
   */
  async createSubscription(userId: string, planId: string): Promise<Subscription> {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { planId }
    })

    if (!plan) throw new Error('Subscription plan not found')

    const now = new Date()
    const endDate = plan.billingCycle === 'monthly'
      ? addMonths(now, 1)
      : addYears(now, 1)

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId,
        status: 'active',
        startDate: now,
        endDate,
        billingCycle: plan.billingCycle,
        autoRenew: true,
        nextBillingDate: endDate
      }
    })

    // Update user account type and tier
    await prisma.user.update({
      where: { id: userId },
      data: {
        accountType: 'subscription',
        subscriptionTier: plan.tier
      }
    })

    // Initialize quota usage
    await this.initializeQuota(userId, plan.dailyQuota)

    return subscription
  }

  /**
   * Initialize daily quota for new subscriber
   */
  private async initializeQuota(userId: string, dailyLimit: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = addDays(new Date(), 1)
    tomorrow.setHours(0, 0, 0, 0)

    await prisma.quotaUsage.create({
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
   * Get user subscription
   */
  async getUserSubscription(userId: string): Promise<(Subscription & { plan: SubscriptionPlan }) | null> {
    return await prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true }
    })
  }

  /**
   * Check if subscription is active
   */
  async isSubscriptionActive(userId: string): Promise<boolean> {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      select: { status: true, endDate: true }
    })

    if (!subscription) return false

    return subscription.status === 'active' && subscription.endDate > new Date()
  }

  /**
   * Get user tier
   */
  async getUserTier(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true }
    })

    return user?.subscriptionTier || 'free'
  }

  /**
   * Cancel subscription (keep until end of period)
   */
  async cancelSubscription(userId: string, reason?: string): Promise<void> {
    await prisma.subscription.update({
      where: { userId },
      data: {
        autoRenew: false,
        cancelledAt: new Date(),
        cancelReason: reason
      }
    })
  }

  /**
   * Renew subscription (after payment confirmed)
   */
  async renewSubscription(userId: string): Promise<void> {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true }
    })

    if (!subscription) throw new Error('Subscription not found')

    const newEndDate = subscription.billingCycle === 'monthly'
      ? addMonths(subscription.endDate, 1)
      : addYears(subscription.endDate, 1)

    await prisma.subscription.update({
      where: { userId },
      data: {
        status: 'active',
        endDate: newEndDate,
        nextBillingDate: newEndDate
      }
    })
  }

  /**
   * Expire subscriptions (cron job)
   */
  async expireSubscriptions(): Promise<number> {
    const now = new Date()

    const result = await prisma.subscription.updateMany({
      where: {
        status: 'active',
        endDate: { lte: now },
        autoRenew: false
      },
      data: { status: 'expired' }
    })

    // Revert users to PAYG
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: { status: 'expired' },
      select: { userId: true }
    })

    for (const sub of expiredSubscriptions) {
      await prisma.user.update({
        where: { id: sub.userId },
        data: {
          accountType: 'payg',
          subscriptionTier: 'free'
        }
      })
    }

    return result.count
  }

  /**
   * Change plan (upgrade/downgrade)
   */
  async changePlan(userId: string, newPlanId: string): Promise<void> {
    const newPlan = await prisma.subscriptionPlan.findUnique({
      where: { planId: newPlanId }
    })

    if (!newPlan) throw new Error('Plan not found')

    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    })

    if (!subscription) throw new Error('No active subscription')

    // Update subscription plan
    await prisma.subscription.update({
      where: { userId },
      data: { planId: newPlanId }
    })

    // Update user tier
    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionTier: newPlan.tier }
    })

    // Update quota limit
    const today = new Date().toISOString().split('T')[0]
    await prisma.quotaUsage.updateMany({
      where: {
        userId,
        period: today,
        quotaType: 'daily'
      },
      data: { quotaLimit: newPlan.dailyQuota }
    })
  }
}

export const subscriptionService = new SubscriptionService()
