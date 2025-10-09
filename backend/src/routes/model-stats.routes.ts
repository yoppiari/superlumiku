import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.middleware'
import prisma from '../db/client'

const router = new Hono()

// GET /api/models/usage - Get user's model usage stats
router.get('/usage', authMiddleware, async (c) => {
  const userId = c.get('userId')

  const usages = await prisma.modelUsage.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      model: {
        select: {
          name: true,
          provider: true,
          tier: true
        }
      }
    }
  })

  return c.json({ usages })
})

// GET /api/models/popular - Get most used models (global stats)
router.get('/popular', async (c) => {
  const popularModels = await prisma.aIModel.findMany({
    where: { enabled: true },
    orderBy: { totalUsage: 'desc' },
    take: 10,
    select: {
      modelKey: true,
      name: true,
      provider: true,
      tier: true,
      totalUsage: true
    }
  })

  return c.json({ models: popularModels })
})

export default router
