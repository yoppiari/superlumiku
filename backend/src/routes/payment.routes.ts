import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.middleware'
import { PaymentService } from '../services/payment.service'
import { z } from 'zod'
import { AuthVariables } from '../types/hono'
import {
  paymentSecurityMiddleware,
  paymentCallbackRateLimitConfig,
} from '../middleware/payment-security.middleware'
import { rateLimiter } from 'hono-rate-limiter'
import { handlePaymentError, isPaymentError } from '../errors/PaymentError'
import { getClientIP } from '../lib/security-logger'
import { sendSuccess, HttpStatus } from '../utils/api-response'
import { asyncHandler, ValidationError } from '../utils/error-handler'
import { logger } from '../utils/logger'
import { AuthContext, CreatePaymentRequest, PaymentResponse, PaymentStatusResponse } from '../types/routes'

const paymentRoutes = new Hono<{ Variables: AuthVariables }>()
const paymentService = new PaymentService()

// Validation schemas
const createPaymentSchema = z.object({
  packageId: z.string().min(1, 'Package ID is required'),
  credits: z.number().int().positive('Credits must be a positive integer'),
  amount: z.number().positive('Amount must be positive'),
  productName: z.string().min(1, 'Product name is required'),
})

/**
 * POST /api/payment/duitku/create
 * Create a new payment request via Duitku payment gateway
 *
 * @body {CreatePaymentRequest} Payment details (packageId, credits, amount, productName)
 * @returns {PaymentResponse} Payment creation result with payment URL
 */
paymentRoutes.post(
  '/duitku/create',
  authMiddleware,
  asyncHandler(async (c: AuthContext) => {
    const userId = c.get('userId')
    const user = c.get('user')
    const body = await c.req.json()
    const validated = createPaymentSchema.parse(body)

    logger.info('Creating payment request', {
      userId,
      packageId: validated.packageId,
      credits: validated.credits,
      amount: validated.amount,
    })

    const result = await paymentService.createPayment({
      userId,
      packageId: validated.packageId,
      credits: validated.credits,
      amount: validated.amount,
      productName: validated.productName,
      userEmail: user.email,
      userName: user.name || user.email,
    })

    logger.info('Payment request created successfully', {
      userId,
      merchantOrderId: result.merchantOrderId,
    })

    return sendSuccess(c, result, 'Payment created successfully')
  }, 'Create Payment')
)

/**
 * POST /api/payment/duitku/callback
 * Payment callback webhook from Duitku payment gateway
 *
 * SECURITY LAYERS:
 * 1. Rate limiting (prevent DDoS)
 * 2. IP whitelist (only Duitku IPs)
 * 3. Request validation (required fields)
 * 4. Signature verification (in service)
 * 5. Idempotency check (in service)
 * 6. Audit logging (in service)
 *
 * @returns Success response (Duitku expects 200 OK)
 */
paymentRoutes.post(
  '/duitku/callback',
  rateLimiter(paymentCallbackRateLimitConfig),
  ...paymentSecurityMiddleware,
  async (c) => {
    try {
      // Get validated callback data from middleware
      const callbackData = c.get('validatedCallbackData')
      const clientIP = getClientIP(c.req.raw)

      logger.info('Duitku callback received', {
        merchantOrderId: callbackData.merchantOrderId,
        amount: callbackData.amount,
        resultCode: callbackData.resultCode,
        ip: clientIP,
      })

      // Process callback with all security checks
      const result = await paymentService.handleCallback(callbackData, clientIP)

      logger.info('Payment callback processed successfully', {
        merchantOrderId: callbackData.merchantOrderId,
        resultCode: callbackData.resultCode,
      })

      // Return success response (Duitku expects 200 OK)
      return c.json(result, 200)
    } catch (error: any) {
      // Use centralized error handler for payment errors
      if (isPaymentError(error)) {
        return handlePaymentError(c, error)
      }

      // Unexpected error
      logger.error('Unexpected payment callback error', {
        error: error.message,
        stack: error.stack,
      })
      return c.json({ error: 'Failed to process callback' }, 400)
    }
  }
)

/**
 * GET /api/payment/status/:merchantOrderId
 * Get payment status by merchant order ID
 *
 * @param merchantOrderId - Merchant order ID from payment creation
 * @returns {PaymentStatusResponse} Payment status details
 */
paymentRoutes.get(
  '/status/:merchantOrderId',
  authMiddleware,
  asyncHandler(async (c: AuthContext) => {
    const userId = c.get('userId')
    const merchantOrderId = c.req.param('merchantOrderId')

    if (!merchantOrderId) {
      throw new ValidationError('Merchant order ID is required')
    }

    logger.info('Fetching payment status', { userId, merchantOrderId })

    const payment = await paymentService.getPaymentStatus(merchantOrderId)

    logger.debug('Payment status retrieved', { userId, merchantOrderId, status: payment.status })

    // Maintain backward compatibility by returning raw payment data
    return c.json(payment)
  }, 'Get Payment Status')
)

export default paymentRoutes
