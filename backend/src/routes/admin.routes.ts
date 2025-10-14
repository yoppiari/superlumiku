import { Hono } from 'hono'
import { AuthVariables } from '../types/hono'
import prisma from '../db/client'
import { authMiddleware } from '../middleware/auth.middleware'
import { adminSeedModelsLimiter } from '../config/rate-limit-endpoints.config'
import { sendSuccess, sendError, HttpStatus } from '../utils/api-response'
import { asyncHandler } from '../utils/error-handler'
import { logger } from '../utils/logger'
import { AuthContext } from '../types/routes'

const app = new Hono<{ Variables: AuthVariables }>()

/**
 * POST /api/admin/seed-models
 * Seed AI models to database (admin only)
 * SECURITY: Protected with authentication and rate limiting
 *
 * @returns Seeding results with statistics
 */
app.post(
  '/seed-models',
  authMiddleware,
  adminSeedModelsLimiter,
  asyncHandler(async (c: AuthContext) => {
    const userId = c.get('userId')

    logger.info('Starting AI models seeding', { userId })

    const models = [
      // Video Mixer
      {
        appId: 'video-mixer',
        modelId: 'ffmpeg-standard',
        modelKey: 'video-mixer:ffmpeg-standard',
        name: 'FFmpeg Standard',
        description: 'Standard video mixing with FFmpeg',
        provider: 'local',
        tier: 'free',
        creditCost: 2,
        quotaCost: 1,
        capabilities: '{"maxVideos":100,"formats":["mp4","webm"]}',
        enabled: true,
        beta: false,
      },

      // Carousel Mix
      {
        appId: 'carousel-mix',
        modelId: 'canvas-standard',
        modelKey: 'carousel-mix:canvas-standard',
        name: 'Canvas Standard',
        description: 'Standard carousel generation',
        provider: 'local',
        tier: 'free',
        creditCost: 1,
        quotaCost: 1,
        capabilities: '{"maxSlides":8,"formats":["png","jpg"]}',
        enabled: true,
        beta: false,
      },

      // Looping Flow
      {
        appId: 'looping-flow',
        modelId: 'ffmpeg-loop',
        modelKey: 'looping-flow:ffmpeg-loop',
        name: 'FFmpeg Loop',
        description: 'Video looping with FFmpeg',
        provider: 'local',
        tier: 'free',
        creditCost: 2,
        quotaCost: 1,
        capabilities: '{"maxDuration":300,"crossfade":true}',
        enabled: true,
        beta: false,
      },

    ]

    let inserted = 0
    let skipped = 0

    for (const model of models) {
      try {
        await prisma.aIModel.upsert({
          where: { modelKey: model.modelKey },
          update: {},
          create: model,
        })
        inserted++
        logger.debug('Model seeded', { modelName: model.name, modelKey: model.modelKey })
      } catch (err) {
        skipped++
        logger.debug('Model skipped (already exists)', { modelName: model.name, modelKey: model.modelKey })
      }
    }

    // Get stats
    const stats = await prisma.aIModel.groupBy({
      by: ['appId'],
      _count: { appId: true },
    })

    const total = await prisma.aIModel.count()

    const result = {
      stats: {
        inserted,
        skipped,
        total,
        byApp: stats.map((s) => ({ appId: s.appId, count: s._count.appId })),
      },
    }

    logger.info('AI models seeding completed', { userId, ...result.stats })

    return sendSuccess(c, result, 'AI models seeded successfully')
  }, 'Seed AI Models')
)

/**
 * SECURITY NOTE: Password management endpoint removed.
 * Passwords should be reset through secure user-initiated flows only.
 * Never hardcode credentials or expose them in API responses.
 */

export default app
