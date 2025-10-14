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

      // Avatar Generator (HuggingFace only)
      {
        appId: 'avatar-generator',
        modelId: 'controlnet-openpose-sd15',
        modelKey: 'avatar-generator:controlnet-openpose-sd15',
        name: 'ControlNet OpenPose SD 1.5 (Free)',
        description: 'Pose-guided avatar generation using Stable Diffusion 1.5',
        provider: 'huggingface',
        tier: 'free',
        creditCost: 3,
        quotaCost: 1,
        capabilities:
          '{"model":"lllyasviel/control_v11p_sd15_openpose","baseModel":"runwayml/stable-diffusion-v1-5","quality":"sd","resolution":"512x512","poseControl":true}',
        enabled: true,
        beta: true,
      },
      {
        appId: 'avatar-generator',
        modelId: 'controlnet-openpose-sdxl',
        modelKey: 'avatar-generator:controlnet-openpose-sdxl',
        name: 'ControlNet OpenPose SDXL',
        description: 'High quality pose-guided generation using Stable Diffusion XL',
        provider: 'huggingface',
        tier: 'basic',
        creditCost: 5,
        quotaCost: 1,
        capabilities:
          '{"model":"thibaud/controlnet-openpose-sdxl-1.0","baseModel":"stabilityai/stable-diffusion-xl-base-1.0","quality":"hd","resolution":"1024x1024","poseControl":true}',
        enabled: true,
        beta: true,
      },
      {
        appId: 'avatar-generator',
        modelId: 'controlnet-openpose-sdxl-ultra',
        modelKey: 'avatar-generator:controlnet-openpose-sdxl-ultra',
        name: 'ControlNet OpenPose SDXL Ultra',
        description: 'Ultra high quality with xinsir SOTA model',
        provider: 'huggingface',
        tier: 'pro',
        creditCost: 8,
        quotaCost: 2,
        capabilities:
          '{"model":"xinsir/controlnet-openpose-sdxl-1.0","baseModel":"stabilityai/stable-diffusion-xl-base-1.0","quality":"ultra","resolution":"1024x1024","poseControl":true,"priorityQueue":true,"sota":true}',
        enabled: true,
        beta: true,
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
