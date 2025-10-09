import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.middleware'
import { quotaService } from '../services/quota.service'
import prisma from '../db/client'

const router = new Hono()

// GET /api/quota/status - Get remaining quota
router.get('/status', authMiddleware, async (c) => {
  const userId = c.get('userId')

  const quotaCheck = await quotaService.checkQuota(userId)
  const breakdown = await quotaService.getQuotaBreakdown(userId)

  return c.json({
    remaining: quotaCheck.remaining,
    used: quotaCheck.current,
    limit: quotaCheck.limit,
    resetAt: quotaCheck.resetAt,
    breakdown
  })
})

// GET /api/quota/history - Get quota usage history
router.get('/history', authMiddleware, async (c) => {
  const userId = c.get('userId')

  const history = await prisma.quotaUsage.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 30 // Last 30 days
  })

  return c.json({ history })
})

export default router
