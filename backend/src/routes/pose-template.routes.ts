import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.middleware'
import { poseTemplateService } from '../services/pose-template.service'
import { AuthVariables } from '../types/hono'

const poseTemplateRoutes = new Hono<{ Variables: AuthVariables }>()

/**
 * GET /api/poses
 * Get all pose templates with filters and pagination
 *
 * Query parameters:
 * - category: string (optional) - Filter by category (e.g., "fashion", "lifestyle")
 * - difficulty: string (optional) - Filter by difficulty (e.g., "easy", "medium", "hard")
 * - gender: string (optional) - Filter by gender (e.g., "male", "female", "unisex")
 * - tags: string (optional) - Search in tags
 * - isActive: boolean (optional, default: true) - Filter by active status
 * - limit: number (optional, default: 20) - Items per page
 * - offset: number (optional, default: 0) - Pagination offset
 * - sort: string (optional, default: "recent") - Sort order: "popular", "quality", "recent", "random"
 */
poseTemplateRoutes.get('/', authMiddleware, async (c) => {
  try {
    const category = c.req.query('category')
    const difficulty = c.req.query('difficulty')
    const gender = c.req.query('gender')
    const tags = c.req.query('tags')
    const isActiveQuery = c.req.query('isActive')
    const limitQuery = c.req.query('limit')
    const offsetQuery = c.req.query('offset')
    const sort = c.req.query('sort') as 'popular' | 'quality' | 'recent' | 'random' | undefined

    const filters = {
      category,
      difficulty,
      gender,
      tags,
      isActive: isActiveQuery !== undefined ? isActiveQuery === 'true' : true,
      limit: limitQuery ? parseInt(limitQuery) : 20,
      offset: offsetQuery ? parseInt(offsetQuery) : 0,
      sort: sort || 'recent',
    }

    const result = await poseTemplateService.getAllPoseTemplates(filters)

    return c.json(result)
  } catch (error) {
    console.error('Error fetching pose templates:', error)
    return c.json({ error: 'Failed to fetch pose templates' }, 500)
  }
})

/**
 * GET /api/poses/stats
 * Get pose template statistics
 *
 * Returns:
 * - total: Total number of pose templates
 * - active: Number of active pose templates
 * - categories: Category distribution
 * - difficulties: Difficulty distribution
 * - genders: Gender distribution
 */
poseTemplateRoutes.get('/stats', authMiddleware, async (c) => {
  try {
    const stats = await poseTemplateService.getPoseTemplateStats()

    return c.json(stats)
  } catch (error) {
    console.error('Error fetching pose template stats:', error)
    return c.json({ error: 'Failed to fetch pose template stats' }, 500)
  }
})

/**
 * GET /api/poses/random
 * Get a random pose template with optional filters
 *
 * Query parameters:
 * - category: string (optional) - Filter by category
 * - difficulty: string (optional) - Filter by difficulty
 * - gender: string (optional) - Filter by gender
 * - tags: string (optional) - Search in tags
 */
poseTemplateRoutes.get('/random', authMiddleware, async (c) => {
  try {
    const category = c.req.query('category')
    const difficulty = c.req.query('difficulty')
    const gender = c.req.query('gender')
    const tags = c.req.query('tags')

    const filters = {
      category,
      difficulty,
      gender,
      tags,
    }

    const pose = await poseTemplateService.getRandomPoseTemplate(filters)

    if (!pose) {
      return c.json({ error: 'No pose templates found matching the criteria' }, 404)
    }

    return c.json({ data: pose })
  } catch (error) {
    console.error('Error fetching random pose template:', error)
    return c.json({ error: 'Failed to fetch random pose template' }, 500)
  }
})

/**
 * GET /api/poses/:id
 * Get a single pose template by ID
 *
 * Parameters:
 * - id: string - Pose template ID
 */
poseTemplateRoutes.get('/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id')

    const pose = await poseTemplateService.getPoseTemplateById(id)

    if (!pose) {
      return c.json({ error: 'Pose template not found' }, 404)
    }

    return c.json({ data: pose })
  } catch (error) {
    console.error('Error fetching pose template:', error)
    return c.json({ error: 'Failed to fetch pose template' }, 500)
  }
})

export default poseTemplateRoutes
