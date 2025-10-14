import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.middleware'
import { AuthVariables } from '../types/hono'
import prisma from '../db/client'
import { sendSuccess } from '../utils/api-response'
import { asyncHandler } from '../utils/error-handler'
import { logger } from '../utils/logger'
import { AuthContext, ModelUsageResponse, PopularModelsResponse } from '../types/routes'

const router = new Hono<{ Variables: AuthVariables }>()

/**
 * GET /api/models/usage
 * Get model usage statistics for authenticated user
 * Returns last 100 usage records with model details
 *
 * @returns {ModelUsageResponse} List of model usage entries
 */
router.get(
  '/usage',
  authMiddleware,
  asyncHandler(async (c: AuthContext) => {
    const userId = c.get('userId')

    logger.info('Fetching model usage stats', { userId })

    const usages = await prisma.modelUsage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        model: {
          select: {
            name: true,
            provider: true,
            tier: true,
          },
        },
      },
    })

    logger.debug('Model usage stats retrieved', { userId, count: usages.length })

    return sendSuccess<ModelUsageResponse>(c, { usages })
  }, 'Get Model Usage Stats')
)

/**
 * GET /api/models/popular
 * Get most popular models globally (public endpoint)
 * Returns top 10 enabled models by total usage
 *
 * @returns {PopularModelsResponse} List of popular models
 */
router.get(
  '/popular',
  asyncHandler(async (c) => {
    logger.info('Fetching popular models')

    const popularModels = await prisma.aIModel.findMany({
      where: { enabled: true },
      orderBy: { totalUsage: 'desc' },
      take: 10,
      select: {
        modelKey: true,
        name: true,
        provider: true,
        tier: true,
        totalUsage: true,
      },
    })

    logger.debug('Popular models retrieved', { count: popularModels.length })

    return sendSuccess<PopularModelsResponse>(c, { models: popularModels })
  }, 'Get Popular Models')
)

export default router
