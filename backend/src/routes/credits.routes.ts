import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.middleware'
import { PaymentService } from '../services/payment.service'
import { AuthVariables } from '../types/hono'
import { sendSuccess } from '../utils/api-response'
import { asyncHandler } from '../utils/error-handler'
import { logger } from '../utils/logger'
import { AuthContext, CreditBalanceResponse } from '../types/routes'

const creditsRoutes = new Hono<{ Variables: AuthVariables }>()
const paymentService = new PaymentService()

/**
 * GET /api/credits/balance
 * Get credit balance from payment service for authenticated user
 *
 * @returns {CreditBalanceResponse} Current credit balance
 */
creditsRoutes.get(
  '/balance',
  authMiddleware,
  asyncHandler(async (c: AuthContext) => {
    const userId = c.get('userId')

    logger.info('Fetching credit balance from payment service', { userId })

    const balance = await paymentService.getCreditBalance(userId)

    logger.debug('Credit balance retrieved from payment service', { userId, balance })

    return sendSuccess<CreditBalanceResponse>(c, { balance })
  }, 'Get Credit Balance (Payment Service)')
)

/**
 * GET /api/credits/history
 * Get credit transaction history from payment service for authenticated user
 *
 * @returns Credit transaction history (structure depends on payment service)
 */
creditsRoutes.get(
  '/history',
  authMiddleware,
  asyncHandler(async (c: AuthContext) => {
    const userId = c.get('userId')

    logger.info('Fetching credit history from payment service', { userId })

    const history = await paymentService.getCreditHistory(userId)

    logger.debug('Credit history retrieved from payment service', { userId })

    // Note: Returning raw history data as payment service may have different structure
    // Maintaining backward compatibility with existing response format
    return c.json(history)
  }, 'Get Credit History (Payment Service)')
)

export default creditsRoutes
