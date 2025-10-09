import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.middleware'
import { subscriptionService } from '../services/subscription.service'
import prisma from '../db/client'

const router = new Hono()

// GET /api/subscription/plans - List all available plans
router.get('/plans', async (c) => {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' }
  })

  return c.json({ plans })
})

// GET /api/subscription/status - Get current user subscription
router.get('/status', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const subscription = await subscriptionService.getUserSubscription(userId)

  if (!subscription) {
    return c.json({ subscription: null, tier: 'free' })
  }

  return c.json({
    subscription,
    tier: subscription.plan.tier,
    isActive: await subscriptionService.isSubscriptionActive(userId)
  })
})

// POST /api/subscription/subscribe - Create subscription
router.post('/subscribe', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const { planId } = await c.req.json()

  // Check if user already has subscription
  const existing = await subscriptionService.getUserSubscription(userId)
  if (existing && existing.status === 'active') {
    return c.json({ error: 'User already has active subscription' }, 400)
  }

  const subscription = await subscriptionService.createSubscription(userId, planId)

  return c.json({
    success: true,
    subscription
  })
})

// POST /api/subscription/cancel - Cancel subscription
router.post('/cancel', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const { reason } = await c.req.json()

  await subscriptionService.cancelSubscription(userId, reason)

  return c.json({
    success: true,
    message: 'Subscription will remain active until end of billing period'
  })
})

// POST /api/subscription/change-plan - Upgrade/downgrade plan
router.post('/change-plan', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const { newPlanId } = await c.req.json()

  await subscriptionService.changePlan(userId, newPlanId)

  return c.json({
    success: true,
    message: 'Plan changed successfully'
  })
})

export default router
