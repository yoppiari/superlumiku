import { Context, Next } from 'hono'
import prisma from '../db/client'
import { modelRegistryService } from '../services/model-registry.service'
import { quotaService } from '../services/quota.service'
import { getCreditBalance } from '../core/middleware/credit.middleware'

/**
 * Deduct credit (PAYG) OR quota (Subscription) based on user type
 * Automatically detects user type and applies correct pricing
 */
export const deductModelUsage = (modelKey: string, action: string) => {
  return async (c: Context, next: Next) => {
    const userId = c.get('userId')

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Get user account type
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { accountType: true, subscriptionTier: true }
    })

    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }

    // Get request params (for dynamic cost calculation)
    let requestBody: any = {}
    try {
      const contentType = c.req.header('content-type')
      if (contentType?.includes('application/json')) {
        requestBody = await c.req.json()
      }
    } catch (e) {
      // If body already consumed, use empty object
      requestBody = {}
    }

    // Get model cost
    const cost = await modelRegistryService.getModelCost(modelKey, requestBody)

    if (user.accountType === 'subscription') {
      // Use QUOTA system
      const quotaCheck = await quotaService.checkQuota(userId, cost.quotaCost)

      if (!quotaCheck.allowed) {
        return c.json({
          error: 'Daily quota exceeded',
          usage: quotaCheck.current,
          limit: quotaCheck.limit,
          remaining: quotaCheck.remaining,
          resetAt: quotaCheck.resetAt
        }, 429) // Too Many Requests
      }

      c.set('usageType', 'quota')
      c.set('quotaCost', cost.quotaCost)

    } else {
      // Use CREDIT system (existing)
      const balance = await getCreditBalance(userId)

      if (balance < cost.creditCost) {
        return c.json({
          error: 'Insufficient credits',
          required: cost.creditCost,
          current: balance
        }, 402) // Payment Required
      }

      c.set('usageType', 'credit')
      c.set('creditCost', cost.creditCost)
    }

    // Store for post-processing
    c.set('modelUsageData', {
      modelKey,
      action,
      cost,
      requestBody
    })

    await next()
  }
}
