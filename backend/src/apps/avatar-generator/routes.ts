import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth.middleware'
import { AuthVariables } from '../../types/hono'
import { avatarService } from './services/avatar.service'
import path from 'path'
import fs from 'fs/promises'

const app = new Hono<{ Variables: AuthVariables }>()

/**
 * POST /api/apps/avatar-generator/generate
 * Create new avatar generation
 */
app.post('/generate', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const body = await c.req.parseBody()

    // Get uploaded file
    const file = body.image as File
    if (!file) {
      return c.json({ error: 'Image file is required' }, 400)
    }

    const poseTemplateId = body.poseTemplateId as string
    if (!poseTemplateId) {
      return c.json({ error: 'poseTemplateId is required' }, 400)
    }

    const quality = (body.quality as 'sd' | 'hd') || 'sd'
    const priority = body.priority === 'true'

    // Save uploaded file
    const uploadDir = path.join(process.cwd(), 'uploads', 'avatar-generator', userId)
    await fs.mkdir(uploadDir, { recursive: true })

    const filename = `${Date.now()}-${file.name}`
    const filepath = path.join(uploadDir, filename)
    const relativePath = `/uploads/avatar-generator/${userId}/${filename}`

    const arrayBuffer = await file.arrayBuffer()
    await fs.writeFile(filepath, Buffer.from(arrayBuffer))

    // Create generation
    const generation = await avatarService.createGeneration(userId, relativePath, {
      poseTemplateId,
      quality,
      priority,
    })

    // Start processing in background
    avatarService.processGeneration(generation.id).catch((error) => {
      console.error('Error processing avatar generation:', error)
    })

    return c.json({
      message: 'Avatar generation started',
      data: generation,
    })
  } catch (error: any) {
    console.error('Error creating avatar generation:', error)
    return c.json({ error: error.message || 'Failed to create avatar generation' }, 500)
  }
})

/**
 * GET /api/apps/avatar-generator/generations
 * Get all generations for user
 */
app.get('/generations', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : 20
    const offset = c.req.query('offset') ? parseInt(c.req.query('offset')!) : 0

    const result = await avatarService.getUserGenerations(userId, limit, offset)

    return c.json({
      data: result.data,
      meta: {
        total: result.total,
        limit,
        offset,
        hasMore: offset + limit < result.total,
      },
    })
  } catch (error: any) {
    console.error('Error fetching generations:', error)
    return c.json({ error: error.message || 'Failed to fetch generations' }, 500)
  }
})

/**
 * GET /api/apps/avatar-generator/generations/:id
 * Get single generation
 */
app.get('/generations/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const id = c.req.param('id')

    const generation = await avatarService.getGeneration(id, userId)

    if (!generation) {
      return c.json({ error: 'Generation not found' }, 404)
    }

    return c.json({ data: generation })
  } catch (error: any) {
    console.error('Error fetching generation:', error)
    return c.json({ error: error.message || 'Failed to fetch generation' }, 500)
  }
})

/**
 * DELETE /api/apps/avatar-generator/generations/:id
 * Delete generation
 */
app.delete('/generations/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const id = c.req.param('id')

    await avatarService.deleteGeneration(id, userId)

    return c.json({ message: 'Generation deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting generation:', error)
    return c.json({ error: error.message || 'Failed to delete generation' }, 500)
  }
})

/**
 * GET /api/apps/avatar-generator/stats
 * Get user statistics
 */
app.get('/stats', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')

    const stats = await avatarService.getStats(userId)

    return c.json({ data: stats })
  } catch (error: any) {
    console.error('Error fetching stats:', error)
    return c.json({ error: error.message || 'Failed to fetch stats' }, 500)
  }
})

export default app
