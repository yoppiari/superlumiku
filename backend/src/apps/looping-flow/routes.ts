import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth.middleware'
import { AuthVariables } from '../../types/hono'
import { deductCredits, recordCreditUsage } from '../../core/middleware/credit.middleware'
import { LoopingFlowService } from './services/looping-flow.service'
import { loopingFlowConfig } from './plugin.config'
import { saveFile, checkStorageQuota, updateUserStorage, deleteFile } from '../../lib/storage'
import { getVideoDuration } from '../../lib/video-utils'
import { addLoopingFlowJob, getLoopingFlowJobStatus } from '../../lib/queue'
import { z } from 'zod'

const routes = new Hono<{ Variables: AuthVariables }>()
const service = new LoopingFlowService()

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})

const estimateSchema = z.object({
  targetDuration: z.number().min(1),
})

const generateSchema = z.object({
  projectId: z.string(),
  videoId: z.string(),
  targetDuration: z.number().min(1),
  // Package 1: Loop settings
  loopStyle: z.enum(['simple', 'crossfade', 'boomerang']).optional(),
  crossfadeDuration: z.number().min(0.5).max(2.0).optional(),
  videoCrossfade: z.boolean().optional(),
  audioCrossfade: z.boolean().optional(),
  // Package 2: Audio settings
  masterVolume: z.number().min(0).max(100).optional(),
  audioFadeIn: z.number().min(0).max(10).optional(),
  audioFadeOut: z.number().min(0).max(10).optional(),
  muteOriginal: z.boolean().optional(),
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

// ===== Videos =====
routes.post('/videos/upload', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const formData = await c.req.formData()

    const projectId = formData.get('projectId') as string
    const file = formData.get('file') as File

    if (!file) {
      return c.json({ error: 'No file provided' }, 400)
    }

    // Check storage quota
    const quotaCheck = await checkStorageQuota(userId, file.size)
    if (!quotaCheck.allowed) {
      return c.json({
        error: 'Storage quota exceeded',
        used: quotaCheck.used,
        quota: quotaCheck.quota,
        fileSize: file.size,
        available: quotaCheck.available,
      }, 413)
    }

    // Save file
    const { filePath, fileName } = await saveFile(file, 'videos')
    const fullPath = `./uploads${filePath}`
    const duration = await getVideoDuration(fullPath)

    // Create video record
    const video = await service.createVideo({
      projectId,
      fileName,
      filePath,
      fileSize: file.size,
      duration,
      mimeType: file.type,
    })

    // Update storage
    await updateUserStorage(userId, file.size)

    return c.json({ success: true, video, storageUsed: quotaCheck.used + file.size })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.delete('/videos/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const videoId = c.req.param('id')

    const video = await service.getVideoById(videoId, userId)
    await deleteFile(video.filePath)
    await service.deleteVideo(videoId, userId)
    await updateUserStorage(userId, -video.fileSize)

    return c.json({ success: true, freedSpace: video.fileSize })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// ===== Generation =====
routes.post('/estimate', authMiddleware, async (c) => {
  try {
    const body = estimateSchema.parse(await c.req.json())
    const creditCost = service.calculateCreditCost(body.targetDuration)
    return c.json({ success: true, creditCost })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.post(
  '/generate',
  authMiddleware,
  async (c, next) => {
    try {
      const body = generateSchema.parse(await c.req.json())
      const creditCost = service.calculateCreditCost(body.targetDuration)
      return deductCredits(creditCost, 'generate_loop', loopingFlowConfig.appId)(c, next)
    } catch (error: any) {
      return c.json({ error: error.message }, 400)
    }
  },
  async (c) => {
    try {
      const userId = c.get('userId')
      const body = generateSchema.parse(await c.req.json())

      // Get video info
      const video = await service.getVideoById(body.videoId, userId)

      // Get audio layers if any
      const audioLayers = await service.getAudioLayers(body.generationId || '')

      const generation = await service.createGeneration(
        body.projectId,
        userId,
        body.videoId,
        body.targetDuration,
        {
          loopStyle: body.loopStyle,
          crossfadeDuration: body.crossfadeDuration,
          videoCrossfade: body.videoCrossfade,
          audioCrossfade: body.audioCrossfade,
          masterVolume: body.masterVolume,
          audioFadeIn: body.audioFadeIn,
          audioFadeOut: body.audioFadeOut,
          muteOriginal: body.muteOriginal,
        }
      )

      // Add job to queue
      await addLoopingFlowJob({
        generationId: generation.id,
        userId,
        projectId: body.projectId,
        videoId: body.videoId,
        videoPath: video.filePath,
        targetDuration: body.targetDuration,
        loopStyle: body.loopStyle || 'crossfade',
        crossfadeDuration: body.crossfadeDuration,
        videoCrossfade: body.videoCrossfade,
        audioCrossfade: body.audioCrossfade,
        masterVolume: body.masterVolume,
        audioFadeIn: body.audioFadeIn,
        audioFadeOut: body.audioFadeOut,
        muteOriginal: body.muteOriginal,
        audioLayers: audioLayers.map(layer => ({
          id: layer.id,
          filePath: layer.filePath,
          volume: layer.volume,
          muted: layer.muted,
          fadeIn: layer.fadeIn,
          fadeOut: layer.fadeOut,
        })),
      })

      const deduction = c.get('creditDeduction')
      const { newBalance, creditUsed } = await recordCreditUsage(
        userId,
        deduction?.appId || 'looping-flow',
        deduction?.action || 'generate',
        deduction?.amount || 0
      )

      return c.json({
        success: true,
        generation,
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

routes.get('/download/:generationId', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const generationId = c.req.param('generationId')

    const generation = await service.getGenerationById(generationId, userId)

    if (generation.status !== 'completed' || !generation.outputPath) {
      return c.json({ error: 'Generation not completed yet' }, 400)
    }

    const filePath = `./uploads${generation.outputPath}`
    const { promises: fs } = await import('fs')
    const path = await import('path')

    const fileExists = await fs.access(filePath).then(() => true).catch(() => false)
    if (!fileExists) {
      return c.json({ error: 'File not found' }, 404)
    }

    const fileBuffer = await fs.readFile(filePath)
    const filename = path.basename(filePath)

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.get('/stats', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const stats = await service.getStats(userId)
    return c.json({ success: true, stats })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.post('/generations/:id/cancel', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const generationId = c.req.param('id')
    const generation = await service.cancelGeneration(generationId, userId)
    return c.json({ success: true, generation })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// ===== Audio Layers (Package 2) =====
routes.post('/generations/:generationId/audio-layers', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const generationId = c.req.param('generationId')
    const formData = await c.req.formData()

    const file = formData.get('file') as File
    const layerIndex = parseInt(formData.get('layerIndex') as string)
    const volume = parseFloat(formData.get('volume') as string) || 100
    const fadeIn = parseFloat(formData.get('fadeIn') as string) || 0
    const fadeOut = parseFloat(formData.get('fadeOut') as string) || 0

    if (!file) {
      return c.json({ error: 'No file provided' }, 400)
    }

    // Verify generation belongs to user
    await service.getGenerationById(generationId, userId)

    // Check storage quota
    const quotaCheck = await checkStorageQuota(userId, file.size)
    if (!quotaCheck.allowed) {
      return c.json({
        error: 'Storage quota exceeded',
        used: quotaCheck.used,
        quota: quotaCheck.quota,
      }, 413)
    }

    // Save audio file
    const { filePath, fileName } = await saveFile(file, 'audio-layers')
    const fullPath = `./uploads${filePath}`

    // Get audio duration
    const duration = await getVideoDuration(fullPath) // Can use same util for audio

    // Create audio layer record
    const audioLayer = await service.createAudioLayer({
      generationId,
      layerIndex,
      fileName,
      filePath,
      fileSize: file.size,
      duration,
      volume,
      fadeIn,
      fadeOut,
    })

    // Update storage
    await updateUserStorage(userId, file.size)

    return c.json({ success: true, audioLayer })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.get('/generations/:generationId/audio-layers', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const generationId = c.req.param('generationId')

    // Verify generation belongs to user
    await service.getGenerationById(generationId, userId)

    const audioLayers = await service.getAudioLayers(generationId)
    return c.json({ success: true, audioLayers })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.patch('/audio-layers/:layerId', authMiddleware, async (c) => {
  try {
    const layerId = c.req.param('layerId')
    const body = await c.req.json()

    const audioLayer = await service.updateAudioLayer(layerId, {
      volume: body.volume,
      muted: body.muted,
      fadeIn: body.fadeIn,
      fadeOut: body.fadeOut,
    })

    return c.json({ success: true, audioLayer })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.delete('/audio-layers/:layerId', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const layerId = c.req.param('layerId')

    const audioLayer = await service.deleteAudioLayer(layerId, userId)
    await deleteFile(audioLayer.filePath)
    await updateUserStorage(userId, -audioLayer.fileSize)

    return c.json({ success: true, freedSpace: audioLayer.fileSize })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

export default routes
