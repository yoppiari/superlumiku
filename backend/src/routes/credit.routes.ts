import { Hono } from 'hono'
import { CreditService } from '../services/credit.service'
import { authMiddleware } from '../middleware/auth.middleware'
import { AuthVariables } from '../types/hono'
import { sendSuccess, sendError, HttpStatus } from '../utils/api-response'
import { asyncHandler, ValidationError } from '../utils/error-handler'
import { logger } from '../utils/logger'
import { AuthContext, CreditBalanceResponse, CreditHistoryResponse, parsePagination } from '../types/routes'

const creditRoutes = new Hono<{ Variables: AuthVariables }>()
const creditService = new CreditService()

/**
 * GET /api/credit/balance
 * Get current credit balance for authenticated user
 *
 * @returns {CreditBalanceResponse} Current credit balance
 */
creditRoutes.get(
  '/balance',
  authMiddleware,
  asyncHandler(async (c: AuthContext) => {
    const userId = c.get('userId')

    logger.info('Fetching credit balance', { userId })

    const balance = await creditService.getBalance(userId)

    logger.debug('Credit balance retrieved', { userId, balance })

    return sendSuccess<CreditBalanceResponse>(c, { balance })
  }, 'Get Credit Balance')
)

/**
 * GET /api/credit/history
 * Get credit transaction history for authenticated user
 *
 * Query parameters:
 * - limit: Number of records to return (default: 50, max: 200)
 *
 * @returns {CreditHistoryResponse} Credit transaction history
 */
creditRoutes.get(
  '/history',
  authMiddleware,
  asyncHandler(async (c: AuthContext) => {
    const userId = c.get('userId')
    const limitQuery = c.req.query('limit')

    // Parse and validate limit parameter
    const { limit } = parsePagination(limitQuery, undefined, undefined, 50, 200)

    logger.info('Fetching credit history', { userId, limit })

    const history = await creditService.getHistory(userId, limit)

    logger.debug('Credit history retrieved', { userId, count: history.length })

    return sendSuccess<CreditHistoryResponse>(c, { history })
  }, 'Get Credit History')
)

export default creditRoutes