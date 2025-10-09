import { Hono } from 'hono'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/auth.middleware'
import { deductCredits } from '../../core/middleware/credit.middleware'
import { VideoGenService } from './services/video-gen.service'
import { videoProviderRegistry } from './providers/loader'
import { saveFile, checkStorageQuota } from '../../lib/storage'
import { addVideoGenJob } from '../../lib/queue'

type Env = {
  Variables: {
    userId: string
    userEmail: string
    user: any
  }
}

const routes = new Hono<Env>()
const service = new VideoGenService()

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().optional(),
})

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
})

const estimateCreditsSchema = z.object({
  modelId: z.string(),
  resolution: z.enum(['720p', '1080p', '4k']),
  duration: z.number().min(1).max(60),
  startImagePath: z.string().optional(),
  endImagePath: z.string().optional(),
  generateAudio: z.boolean().optional(),
  enhancePrompt: z.boolean().optional(),
})

const generateVideoSchema = z.object({
  projectId: z.string(),
  modelId: z.string(),
  prompt: z.string().min(3, 'Prompt is too short').max(2000, 'Prompt is too long'),
  negativePrompt: z.string().max(1000).optional(),
  resolution: z.enum(['720p', '1080p', '4k']),
  duration: z.number().min(1).max(60),
  aspectRatio: z.enum(['16:9', '9:16', '1:1', '4:5']),
  startImagePath: z.string().optional(),
  endImagePath: z.string().optional(),
  generateAudio: z.boolean().optional(),
  enhancePrompt: z.boolean().optional(),
})

// ========================================
// PROJECT ENDPOINTS
// ========================================

routes.get('/projects', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projects = await service.getProjects(userId)
    return c.json({ success: true, projects })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.get('/projects/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('id')
    const project = await service.getProjectById(projectId, userId)

    if (!project) {
      return c.json({ error: 'Project not found' }, 404)
    }

    return c.json({ success: true, project })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.post('/projects', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const body = createProjectSchema.parse(await c.req.json())

    const project = await service.createProject(userId, body.name, body.description)
    return c.json({ success: true, project }, 201)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return c.json({ error: 'Validation error', details: error.errors }, 400)
    }
    return c.json({ error: error.message }, 400)
  }
})

routes.put('/projects/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('id')
    const body = updateProjectSchema.parse(await c.req.json())

    await service.updateProject(projectId, userId, body)
    return c.json({ success: true })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return c.json({ error: 'Validation error', details: error.errors }, 400)
    }
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

// ========================================
// GENERATION ENDPOINTS
// ========================================

routes.get('/projects/:id/generations', authMiddleware, async (c) => {
  try {
    const projectId = c.req.param('id')
    const generations = await service.getGenerations(projectId)
    return c.json({ success: true, generations })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.get('/generations/:id', authMiddleware, async (c) => {
  try {
    const generationId = c.req.param('id')
    const generation = await service.getGenerationById(generationId)

    if (!generation) {
      return c.json({ error: 'Generation not found' }, 404)
    }

    return c.json({ success: true, generation })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// ========================================
// MODELS & PROVIDERS
// ========================================

routes.get('/models', authMiddleware, async (c) => {
  try {
    const models = videoProviderRegistry.getAllModels()
    const providers = videoProviderRegistry.getAllProviders()

    return c.json({
      success: true,
      models: models.map(m => ({
        id: m.id,
        name: m.name,
        provider: m.provider,
        maxDuration: m.maxDuration,
        defaultDuration: m.defaultDuration,
        resolutions: m.resolutions,
        aspectRatios: m.aspectRatios,
        supportsTextToVideo: m.supportsTextToVideo,
        supportsImageToVideo: m.supportsImageToVideo,
        supportsVideoToVideo: m.supportsVideoToVideo,
        supportsNegativePrompt: m.supportsNegativePrompt,
        supportsAudioGeneration: m.supportsAudioGeneration,
        description: m.description,
      })),
      providers: providers.map(p => ({
        name: p.name,
        displayName: p.displayName,
        modelCount: p.models.length,
      })),
    })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// ========================================
// CREDIT ESTIMATION
// ========================================

routes.post('/estimate-credits', authMiddleware, async (c) => {
  try {
    const body = estimateCreditsSchema.parse(await c.req.json())
    const estimate = await service.estimateCredits(body)
    return c.json({ success: true, estimate })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return c.json({ error: 'Validation error', details: error.errors }, 400)
    }
    return c.json({ error: error.message }, 400)
  }
})

// ========================================
// VIDEO GENERATION
// ========================================

routes.post('/generate', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const body = generateVideoSchema.parse(await c.req.json())

    // Calculate credits
    const { total: creditUsed } = service.calculateCredits(body)

    // Create generation (this will be picked up by worker)
    const generation = await service.createGeneration({
      ...body,
      userId,
    })

    // Add to queue for background processing
    await addVideoGenJob({
      generationId: generation.id,
      creditUsed,
    })

    return c.json({
      success: true,
      generation: {
        id: generation.id,
        status: generation.status,
        creditUsed,
      },
      message: 'Video generation started. Check status for progress.',
    }, 202)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return c.json({ error: 'Validation error', details: error.errors }, 400)
    }
    return c.json({ error: error.message }, 400)
  }
})

// ========================================
// STATUS & DOWNLOAD
// ========================================

routes.get('/generations/:id/status', authMiddleware, async (c) => {
  try {
    const generationId = c.req.param('id')
    const status = await service.checkGenerationStatus(generationId)
    return c.json({ success: true, status })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.get('/download/:id', authMiddleware, async (c) => {
  try {
    const generationId = c.req.param('id')
    const buffer = await service.downloadVideo(generationId)

    return new Response(buffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="generated_video_${generationId}.mp4"`,
      },
    })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// ========================================
// IMAGE UPLOAD
// ========================================

routes.post('/upload-image', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const formData = await c.req.formData()
    const file = formData.get('file') as File
    const imageType = formData.get('type') as string // 'start' or 'end'

    if (!file) {
      return c.json({ error: 'No file provided' }, 400)
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return c.json({ error: 'File must be an image' }, 400)
    }

    // Check storage quota
    const buffer = Buffer.from(await file.arrayBuffer())
    await checkStorageQuota(userId, buffer.length)

    // Save file
    const filePath = await saveFile(
      buffer,
      `video-generator/${userId}/${imageType}_${Date.now()}_${file.name}`,
      file.type
    )

    return c.json({
      success: true,
      filePath,
      fileName: file.name,
      fileSize: buffer.length,
    })
  } catch (error: any) {
    if (error.message.includes('quota')) {
      return c.json({ error: error.message }, 413)
    }
    return c.json({ error: error.message }, 400)
  }
})

// ========================================
// STATISTICS
// ========================================

routes.get('/stats', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const stats = await service.getUserStats(userId)
    return c.json({ success: true, stats })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

export default routes
