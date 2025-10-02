import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth.middleware'
import { deductCredits, recordCreditUsage } from '../../core/middleware/credit.middleware'
import { VideoMixerService } from './services/video-mixer.service'
import { videoMixerConfig } from './plugin.config'
import { saveFile } from '../../lib/storage'
import { getVideoDuration } from '../../lib/video-utils'
import { z } from 'zod'

const routes = new Hono()
const service = new VideoMixerService()

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})

const createGroupSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1),
  order: z.number().optional(),
})

const generationSettingsSchema = z.object({
  // Mixing Options
  enableOrderMixing: z.boolean(),
  enableDifferentStart: z.boolean(),
  fixedStartVideoId: z.string().optional(),
  enableGroupMixing: z.boolean(),
  groupMixingMode: z.enum(['sequential', 'random']),
  enableSpeedVariations: z.boolean(),
  speedMin: z.number().min(0.5).max(2.0),
  speedMax: z.number().min(0.5).max(2.0),

  // Quality Settings
  metadataSource: z.enum(['capcut', 'tiktok', 'instagram', 'youtube']),
  videoBitrate: z.enum(['low', 'medium', 'high']),
  videoResolution: z.enum(['480p', '720p', '1080p', '4k']),
  frameRate: z.union([z.literal(24), z.literal(30), z.literal(60)]),
  aspectRatio: z.enum(['9:16', '16:9', '1:1', '4:5']),

  // Duration Settings
  durationType: z.enum(['original', 'fixed']),
  fixedDuration: z.number().optional(),
  smartDistribution: z.boolean(),
  distributionMode: z.enum(['proportional', 'equal', 'weighted']),

  // Audio
  audioOption: z.enum(['keep', 'mute']),
})

const estimateGenerationSchema = z.object({
  projectId: z.string(),
  totalVideos: z.number().min(1),
  settings: generationSettingsSchema,
})

const createGenerationSchema = z.object({
  projectId: z.string(),
  totalVideos: z.number().min(1),
  settings: generationSettingsSchema,
})

// ===== Projects =====
routes.get('/projects', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projects = await service.getProjects(userId)
    return c.json({ success: true, projects })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.post('/projects', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const body = createProjectSchema.parse(await c.req.json())
    const project = await service.createProject(userId, body.name, body.description)
    return c.json({ success: true, project })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.get('/projects/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('id')
    const project = await service.getProject(projectId, userId)
    return c.json({ success: true, project })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.put('/projects/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('id')
    const body = await c.req.json()
    await service.updateProject(projectId, userId, body.name, body.description)
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.delete('/projects/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('id')
    await service.deleteProject(projectId, userId)
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// ===== Groups =====
routes.post('/groups', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const body = createGroupSchema.parse(await c.req.json())
    const group = await service.createGroup(body.projectId, userId, body.name, body.order)
    return c.json({ success: true, group })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.get('/projects/:projectId/groups', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('projectId')
    const groups = await service.getGroups(projectId, userId)
    return c.json({ success: true, groups })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.delete('/groups/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const groupId = c.req.param('id')
    await service.deleteGroup(groupId, userId)
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// ===== Videos =====
routes.post('/videos/upload', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const formData = await c.req.formData()

    const projectId = formData.get('projectId') as string
    const groupId = formData.get('groupId') as string | null
    const file = formData.get('file') as File

    if (!file) {
      return c.json({ error: 'No file provided' }, 400)
    }

    // Save file to storage
    const { filePath, fileName } = await saveFile(file, 'videos')

    // Extract video duration
    const fullPath = `./uploads${filePath}`
    const duration = await getVideoDuration(fullPath)

    // Create video record
    const video = await service.createVideo({
      projectId,
      userId,
      groupId: groupId || undefined,
      fileName,
      filePath,
      fileSize: file.size,
      duration,
      mimeType: file.type,
      order: 0,
    })

    return c.json({ success: true, video })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.get('/projects/:projectId/videos', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('projectId')
    const videos = await service.getVideos(projectId, userId)
    return c.json({ success: true, videos })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.delete('/videos/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const videoId = c.req.param('id')
    await service.deleteVideo(videoId, userId)
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// ===== Generation =====
routes.post('/estimate', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const body = estimateGenerationSchema.parse(await c.req.json())

    const estimate = await service.estimateGeneration(
      body.projectId,
      userId,
      body.settings,
      body.totalVideos
    )

    return c.json({ success: true, estimate })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.post(
  '/generate',
  authMiddleware,
  async (c, next) => {
    try {
      const userId = c.get('userId')
      const body = createGenerationSchema.parse(await c.req.json())

      // Calculate credit cost dynamically
      const creditCost = service.calculateCreditCost(body.settings, body.totalVideos)

      // Set up credit deduction
      return deductCredits(creditCost, 'generate_videos', videoMixerConfig.appId)(c, next)
    } catch (error: any) {
      return c.json({ error: error.message }, 400)
    }
  },
  async (c) => {
    try {
      const userId = c.get('userId')
      const body = createGenerationSchema.parse(await c.req.json())

      const result = await service.createGeneration(
        body.projectId,
        userId,
        body.totalVideos,
        body.settings
      )

      // Record credit usage
      const deduction = c.get('creditDeduction')
      const { newBalance, creditUsed } = await recordCreditUsage(
        userId,
        deduction.appId,
        deduction.action,
        deduction.amount
      )

      return c.json({
        success: true,
        generation: result.generation,
        creditUsed,
        creditBalance: newBalance,
      })
    } catch (error: any) {
      return c.json({ error: error.message }, 400)
    }
  }
)

routes.get('/projects/:projectId/generations', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('projectId')
    const generations = await service.getGenerations(projectId, userId)
    return c.json({ success: true, generations })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// Stats endpoint
routes.get('/stats', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const stats = await service.getStats(userId)
    return c.json({ success: true, stats })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

export default routes
