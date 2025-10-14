import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.middleware'
import { poseTemplateService } from '../services/pose-template.service'
import { AuthVariables } from '../types/hono'
import { sendSuccess, HttpStatus } from '../utils/api-response'
import { asyncHandler, NotFoundError, ValidationError } from '../utils/error-handler'
import { logger } from '../utils/logger'
import {
  AuthContext,
  PoseTemplateFilters,
  PoseTemplateListResponse,
  PoseTemplateResponse,
  PoseTemplateStats,
  parsePagination,
} from '../types/routes'

const poseTemplateRoutes = new Hono<{ Variables: AuthVariables }>()

/**
 * GET /api/poses/stats
 * Get pose template statistics
 * Note: This route must be defined before /:id to avoid route conflicts
 *
 * Returns:
 * - total: Total number of pose templates
 * - active: Number of active pose templates
 * - categories: Category distribution
 * - difficulties: Difficulty distribution
 * - genders: Gender distribution
 *
 * @returns {PoseTemplateStats} Pose template statistics
 */
poseTemplateRoutes.get(
  '/stats',
  authMiddleware,
  asyncHandler(async (c: AuthContext) => {
    const userId = c.get('userId')

    logger.info('Fetching pose template stats', { userId })

    const stats = await poseTemplateService.getPoseTemplateStats()

    logger.debug('Pose template stats retrieved', { total: stats.total, active: stats.active })

    return sendSuccess<PoseTemplateStats>(c, stats)
  }, 'Get Pose Template Stats')
)

/**
 * GET /api/poses/random
 * Get a random pose template with optional filters
 * Note: This route must be defined before /:id to avoid route conflicts
 *
 * Query parameters:
 * - category: Filter by category (optional)
 * - difficulty: Filter by difficulty (optional)
 * - gender: Filter by gender (optional)
 * - tags: Search in tags (optional)
 *
 * @returns {PoseTemplateResponse} Random pose template matching filters
 */
poseTemplateRoutes.get(
  '/random',
  authMiddleware,
  asyncHandler(async (c: AuthContext) => {
    const userId = c.get('userId')
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

    logger.info('Fetching random pose template', { userId, filters })

    const pose = await poseTemplateService.getRandomPoseTemplate(filters)

    if (!pose) {
      throw new NotFoundError('No pose templates found matching the criteria')
    }

    logger.debug('Random pose template retrieved', { userId, poseId: pose.id })

    return sendSuccess<PoseTemplateResponse>(c, { data: pose })
  }, 'Get Random Pose Template')
)

/**
 * GET /api/poses
 * Get all pose templates with filters and pagination
 *
 * Query parameters:
 * - category: Filter by category (optional)
 * - difficulty: Filter by difficulty (optional)
 * - gender: Filter by gender (optional)
 * - tags: Search in tags (optional)
 * - isActive: Filter by active status (default: true)
 * - limit: Items per page (default: 20, max: 100)
 * - offset: Pagination offset (default: 0)
 * - sort: Sort order - 'popular', 'quality', 'recent', or 'random' (default: 'recent')
 *
 * @returns {PoseTemplateListResponse} List of pose templates with pagination
 */
poseTemplateRoutes.get(
  '/',
  authMiddleware,
  asyncHandler(async (c: AuthContext) => {
    const userId = c.get('userId')
    const category = c.req.query('category')
    const difficulty = c.req.query('difficulty')
    const gender = c.req.query('gender')
    const tags = c.req.query('tags')
    const isActiveQuery = c.req.query('isActive')
    const limitQuery = c.req.query('limit')
    const offsetQuery = c.req.query('offset')
    const sort = c.req.query('sort')

    // Parse pagination parameters
    const { limit, offset } = parsePagination(limitQuery, offsetQuery, undefined, 20, 100)

    // Validate sort parameter
    const validSorts = ['popular', 'quality', 'recent', 'random']
    const sortValue = sort && validSorts.includes(sort)
      ? (sort as 'popular' | 'quality' | 'recent' | 'random')
      : 'recent'

    const filters: PoseTemplateFilters = {
      category,
      difficulty,
      gender,
      tags,
      isActive: isActiveQuery !== undefined ? isActiveQuery === 'true' : true,
      limit,
      offset,
      sort: sortValue,
    }

    logger.info('Fetching pose templates', { userId, filters })

    const result = await poseTemplateService.getAllPoseTemplates(filters)

    logger.debug('Pose templates retrieved', { userId, count: result.data?.length || 0 })

    // Maintain backward compatibility by returning raw result from service
    return c.json(result)
  }, 'Get All Pose Templates')
)

/**
 * GET /api/poses/:id
 * Get a single pose template by ID
 *
 * @param id - Pose template ID
 * @returns {PoseTemplateResponse} Pose template details
 */
poseTemplateRoutes.get(
  '/:id',
  authMiddleware,
  asyncHandler(async (c: AuthContext) => {
    const userId = c.get('userId')
    const id = c.req.param('id')

    if (!id) {
      throw new ValidationError('Pose template ID is required')
    }

    logger.info('Fetching pose template by ID', { userId, poseId: id })

    const pose = await poseTemplateService.getPoseTemplateById(id)

    if (!pose) {
      throw new NotFoundError('Pose template not found')
    }

    logger.debug('Pose template retrieved', { userId, poseId: id })

    return sendSuccess<PoseTemplateResponse>(c, { data: pose })
  }, 'Get Pose Template By ID')
)

export default poseTemplateRoutes
