import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.middleware'
import { AuthVariables } from '../types/hono'
import { subscriptionService } from '../services/subscription.service'
import prisma from '../db/client'
import { sendSuccess, HttpStatus } from '../utils/api-response'
import { asyncHandler, ConflictError, ValidationError } from '../utils/error-handler'
import { logger } from '../utils/logger'
import { z } from 'zod'
import {
  AuthContext,
  SubscriptionPlansResponse,
  SubscriptionStatusResponse,
  SubscribeRequest,
  CancelSubscriptionRequest,
  ChangePlanRequest,
} from '../types/routes'

const router = new Hono<{ Variables: AuthVariables }>()

// Validation schemas
const subscribeSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
})

const cancelSubscriptionSchema = z.object({
  reason: z.string().optional(),
})

const changePlanSchema = z.object({
  newPlanId: z.string().min(1, 'New plan ID is required'),
})

/**
 * GET /api/subscription/plans
 * List all available subscription plans (public endpoint)
 *
 * @returns {SubscriptionPlansResponse} List of active subscription plans
 */
router.get(
  '/plans',
  asyncHandler(async (c) => {
    logger.info('Fetching subscription plans')

    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    })

    logger.debug('Subscription plans retrieved', { count: plans.length })

    return sendSuccess<SubscriptionPlansResponse>(c, { plans })
  }, 'Get Subscription Plans')
)

/**
 * GET /api/subscription/status
 * Get current user's subscription status
 *
 * @returns {SubscriptionStatusResponse} User subscription details or free tier info
 */
router.get(
  '/status',
  authMiddleware,
  asyncHandler(async (c: AuthContext) => {
    const userId = c.get('userId')

    logger.info('Fetching subscription status', { userId })

    const subscription = await subscriptionService.getUserSubscription(userId)

    if (!subscription) {
      logger.debug('No subscription found, returning free tier', { userId })
      return sendSuccess<SubscriptionStatusResponse>(c, { subscription: null, tier: 'free' })
    }

    const isActive = await subscriptionService.isSubscriptionActive(userId)

    logger.debug('Subscription status retrieved', { userId, tier: subscription.plan.tier, isActive })

    return sendSuccess<SubscriptionStatusResponse>(c, {
      subscription,
      tier: subscription.plan.tier,
      isActive,
    })
  }, 'Get Subscription Status')
)

/**
 * POST /api/subscription/subscribe
 * Create a new subscription for the user
 *
 * @body {SubscribeRequest} Subscription details including planId
 * @returns Created subscription details
 */
router.post(
  '/subscribe',
  authMiddleware,
  asyncHandler(async (c: AuthContext) => {
    const userId = c.get('userId')
    const body = await c.req.json()
    const validated = subscribeSchema.parse(body)

    logger.info('Creating subscription', { userId, planId: validated.planId })

    // Check if user already has an active subscription
    const existing = await subscriptionService.getUserSubscription(userId)
    if (existing && existing.status === 'active') {
      throw new ConflictError('User already has active subscription')
    }

    const subscription = await subscriptionService.createSubscription(userId, validated.planId)

    logger.info('Subscription created successfully', { userId, subscriptionId: subscription.id })

    return sendSuccess(c, { subscription }, 'Subscription created successfully', HttpStatus.CREATED)
  }, 'Create Subscription')
)

/**
 * POST /api/subscription/cancel
 * Cancel the user's current subscription
 * Note: Subscription remains active until end of billing period
 *
 * @body {CancelSubscriptionRequest} Optional cancellation reason
 * @returns Success message
 */
router.post(
  '/cancel',
  authMiddleware,
  asyncHandler(async (c: AuthContext) => {
    const userId = c.get('userId')
    const body = await c.req.json()
    const validated = cancelSubscriptionSchema.parse(body)

    logger.info('Canceling subscription', { userId, reason: validated.reason })

    await subscriptionService.cancelSubscription(userId, validated.reason)

    logger.info('Subscription canceled successfully', { userId })

    return sendSuccess(c, undefined, 'Subscription will remain active until end of billing period')
  }, 'Cancel Subscription')
)

/**
 * POST /api/subscription/change-plan
 * Upgrade or downgrade the user's subscription plan
 *
 * @body {ChangePlanRequest} New plan details including newPlanId
 * @returns Success message
 */
router.post(
  '/change-plan',
  authMiddleware,
  asyncHandler(async (c: AuthContext) => {
    const userId = c.get('userId')
    const body = await c.req.json()
    const validated = changePlanSchema.parse(body)

    logger.info('Changing subscription plan', { userId, newPlanId: validated.newPlanId })

    await subscriptionService.changePlan(userId, validated.newPlanId)

    logger.info('Subscription plan changed successfully', { userId, newPlanId: validated.newPlanId })

    return sendSuccess(c, undefined, 'Plan changed successfully')
  }, 'Change Subscription Plan')
)

export default router
