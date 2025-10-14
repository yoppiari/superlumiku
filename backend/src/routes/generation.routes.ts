import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.middleware'
import { GenerationService } from '../services/generation.service'
import { AuthVariables } from '../types/hono'
import { sendSuccess, HttpStatus } from '../utils/api-response'
import { asyncHandler, ValidationError } from '../utils/error-handler'
import { logger } from '../utils/logger'
import { AuthContext, GenerationFilters, RecentGenerationsResponse, parsePagination } from '../types/routes'

const generationRoutes = new Hono<{ Variables: AuthVariables }>()
const generationService = new GenerationService()

/**
 * GET /api/generations/recent
 * Get recent generations (latest 5 by default)
 * Note: This route must be defined before /:id to avoid route conflicts
 *
 * Query parameters:
 * - limit: Number of recent generations to return (default: 5, max: 50)
 *
 * @returns {RecentGenerationsResponse} Recent generations
 */
generationRoutes.get(
  '/recent',
  authMiddleware,
  asyncHandler(async (c: AuthContext) => {
    const userId = c.get('userId')
    const limitQuery = c.req.query('limit')

    const { limit } = parsePagination(limitQuery, undefined, undefined, 5, 50)

    logger.info('Fetching recent generations', { userId, limit })

    const generations = await generationService.getRecentGenerations(userId, limit)

    logger.debug('Recent generations retrieved', { userId, count: generations.length })

    return sendSuccess<RecentGenerationsResponse>(c, { generations })
  }, 'Get Recent Generations')
)

/**
 * GET /api/generations
 * Get all generations for authenticated user with filters and pagination
 *
 * Query parameters:
 * - app: Filter by app ID (optional)
 * - status: Filter by generation status (optional)
 * - limit: Number of records to return (default: 20, max: 100)
 * - offset: Pagination offset (default: 0)
 * - sort: Sort order - 'latest', 'oldest', or 'name' (default: 'latest')
 *
 * @returns Generation list with optional pagination metadata
 */
generationRoutes.get(
  '/',
  authMiddleware,
  asyncHandler(async (c: AuthContext) => {
    const userId = c.get('userId')
    const app = c.req.query('app')
    const status = c.req.query('status')
    const limitQuery = c.req.query('limit')
    const offsetQuery = c.req.query('offset')
    const sort = c.req.query('sort')

    // Parse pagination with defaults
    const { limit, offset } = parsePagination(limitQuery, offsetQuery, undefined, 20, 100)

    // Validate sort parameter
    const validSorts = ['latest', 'oldest', 'name']
    const sortValue = sort && validSorts.includes(sort) ? (sort as 'latest' | 'oldest' | 'name') : 'latest'

    const filters: GenerationFilters = {
      appId: app,
      status: status as any,
      limit,
      offset,
      sort: sortValue,
    }

    logger.info('Fetching generations with filters', { userId, filters })

    const result = await generationService.getAllGenerations(userId, filters)

    logger.debug('Generations retrieved', { userId, count: result.generations?.length || 0 })

    // Maintain backward compatibility by returning raw result from service
    return c.json(result)
  }, 'Get All Generations')
)

/**
 * DELETE /api/generations/:id
 * Delete a generation and cleanup associated files
 *
 * Query parameters:
 * - appId: App ID (required) - needed to determine which app's generation to delete
 *
 * @param id - Generation ID to delete
 * @returns Success message
 */
generationRoutes.delete(
  '/:id',
  authMiddleware,
  asyncHandler(async (c: AuthContext) => {
    const userId = c.get('userId')
    const id = c.req.param('id')
    const appId = c.req.query('appId')

    if (!id) {
      throw new ValidationError('Generation ID is required')
    }

    if (!appId) {
      throw new ValidationError('appId query parameter is required')
    }

    logger.info('Deleting generation', { userId, generationId: id, appId })

    await generationService.deleteGeneration(id, appId, userId)

    logger.info('Generation deleted successfully', { userId, generationId: id, appId })

    return sendSuccess(c, undefined, 'Generation deleted successfully')
  }, 'Delete Generation')
)

export default generationRoutes
