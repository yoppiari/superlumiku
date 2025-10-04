import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.middleware'
import { GenerationService } from '../services/generation.service'
import { AuthVariables } from '../types/hono'

const generationRoutes = new Hono<{ Variables: AuthVariables }>()
const generationService = new GenerationService()

/**
 * GET /api/generations
 * Get all generations for authenticated user with filters
 */
generationRoutes.get('/', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const app = c.req.query('app')
    const status = c.req.query('status')
    const limit = c.req.query('limit')
    const offset = c.req.query('offset')
    const sort = c.req.query('sort')

    const filters = {
      appId: app,
      status,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      sort: (sort as 'latest' | 'oldest' | 'name') || 'latest',
    }

    const result = await generationService.getAllGenerations(userId, filters)

    return c.json(result)
  } catch (error) {
    console.error('Error fetching generations:', error)
    return c.json({ error: 'Failed to fetch generations' }, 500)
  }
})

/**
 * GET /api/generations/recent
 * Get recent generations (latest 5)
 */
generationRoutes.get('/recent', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : 5

    const generations = await generationService.getRecentGenerations(userId, limit)

    return c.json({ generations })
  } catch (error) {
    console.error('Error fetching recent generations:', error)
    return c.json({ error: 'Failed to fetch recent generations' }, 500)
  }
})

/**
 * DELETE /api/generations/:id
 * Delete a generation and cleanup files
 */
generationRoutes.delete('/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const id = c.req.param('id')
    const appId = c.req.query('appId')

    if (!appId) {
      return c.json({ error: 'appId query parameter is required' }, 400)
    }

    await generationService.deleteGeneration(id, appId, userId)

    return c.json({ message: 'Generation deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting generation:', error)
    return c.json({ error: error.message || 'Failed to delete generation' }, 500)
  }
})

export default generationRoutes
