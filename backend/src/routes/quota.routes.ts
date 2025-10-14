import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.middleware'
import { AuthVariables } from '../types/hono'
import { quotaService } from '../services/quota.service'
import prisma from '../db/client'
import { sendSuccess } from '../utils/api-response'
import { asyncHandler } from '../utils/error-handler'
import { logger } from '../utils/logger'
import { AuthContext, QuotaStatusResponse, QuotaHistoryResponse } from '../types/routes'

const router = new Hono<{ Variables: AuthVariables }>()

/**
 * GET /api/quota/status
 * Get remaining quota and breakdown by app for authenticated user
 *
 * @returns {QuotaStatusResponse} Quota status including remaining, used, limit, reset time, and breakdown
 */
router.get(
  '/status',
  authMiddleware,
  asyncHandler(async (c: AuthContext) => {
    const userId = c.get('userId')

    logger.info('Fetching quota status', { userId })

    const quotaCheck = await quotaService.checkQuota(userId)
    const breakdown = await quotaService.getQuotaBreakdown(userId)

    const status: QuotaStatusResponse = {
      remaining: quotaCheck.remaining,
      used: quotaCheck.current,
      limit: quotaCheck.limit,
      resetAt: quotaCheck.resetAt,
      breakdown,
    }

    logger.debug('Quota status retrieved', { userId, remaining: status.remaining, used: status.used })

    return sendSuccess<QuotaStatusResponse>(c, status)
  }, 'Get Quota Status')
)

/**
 * GET /api/quota/history
 * Get quota usage history for authenticated user
 * Returns last 30 days of usage
 *
 * @returns {QuotaHistoryResponse} Quota usage history
 */
router.get(
  '/history',
  authMiddleware,
  asyncHandler(async (c: AuthContext) => {
    const userId = c.get('userId')

    logger.info('Fetching quota history', { userId })

    const history = await prisma.quotaUsage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30, // Last 30 days
    })

    logger.debug('Quota history retrieved', { userId, count: history.length })

    return sendSuccess<QuotaHistoryResponse>(c, { history })
  }, 'Get Quota History')
)

export default router
