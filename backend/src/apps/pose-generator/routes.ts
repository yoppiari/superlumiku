import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth.middleware'
import { poseGenerationService } from './services/pose-generation.service'
import { poseGeneratorConfig } from './plugin.config'
import { z } from 'zod'

const routes = new Hono()

// Validation schemas
const startGenerationSchema = z.object({
  avatarId: z.string(),
  selectedPoseIds: z.array(z.string()).min(1).max(50),
  quality: z.enum(['sd', 'hd']).optional(),
  fashionSettings: z.object({
    hijab: z.object({
      style: z.string(),
      color: z.string()
    }).optional(),
    accessories: z.array(z.string()).optional(),
    outfit: z.string().optional()
  }).optional(),
  backgroundSettings: z.object({
    type: z.enum(['auto', 'custom', 'scene']),
    scene: z.string().optional(),
    customPrompt: z.string().optional()
  }).optional(),
  professionTheme: z.string().optional()
})

// GET all generations
routes.get('/generations', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const generations = await poseGenerationService.getUserGenerations(userId)

    return c.json({ success: true, generations })
  } catch (error: any) {
    console.error('Error fetching generations:', error)
    return c.json({ error: error.message }, 400)
  }
})

// START generation
routes.post('/generate', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const body = await c.req.json()

    const validated = startGenerationSchema.parse(body)

    const generation = await poseGenerationService.startGeneration(userId, validated)

    // TODO: Credit deduction when ready
    return c.json({
      success: true,
      generation,
      message: 'Generation started successfully'
    }, 201)
  } catch (error: any) {
    console.error('Error starting generation:', error)
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.errors }, 400)
    }
    return c.json({ error: error.message }, 400)
  }
})

// GET generation by ID
routes.get('/generations/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const id = c.req.param('id')

    const generation = await poseGenerationService.getGeneration(id, userId)

    if (!generation) {
      return c.json({ error: 'Generation not found' }, 404)
    }

    return c.json({ success: true, generation })
  } catch (error: any) {
    console.error('Error fetching generation:', error)
    return c.json({ error: error.message }, 400)
  }
})

// GET generated poses for a generation
routes.get('/generations/:id/poses', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const id = c.req.param('id')

    const poses = await poseGenerationService.getGeneratedPoses(id, userId)

    return c.json({ success: true, poses })
  } catch (error: any) {
    console.error('Error fetching poses:', error)
    return c.json({ error: error.message }, 400)
  }
})

// GET stats
routes.get('/stats', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const stats = await poseGenerationService.getStats(userId)

    return c.json({ success: true, stats })
  } catch (error: any) {
    console.error('Error fetching stats:', error)
    return c.json({ error: error.message }, 400)
  }
})

export default routes
