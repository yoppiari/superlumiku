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

const paymentRoutes = new Hono<{ Variables: AuthVariables }>()
const paymentService = new PaymentService()

// Validation schemas
const createPaymentSchema = z.object({
  packageId: z.string(),
  credits: z.number().int().positive(),
  amount: z.number().positive(),
  productName: z.string(),
})

// Create payment request
paymentRoutes.post('/duitku/create', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const user = c.get('user')
    const body = await c.req.json()
    const validated = createPaymentSchema.parse(body)

    const result = await paymentService.createPayment({
      userId,
      packageId: validated.packageId,
      credits: validated.credits,
      amount: validated.amount,
      productName: validated.productName,
      userEmail: user.email,
      userName: user.name || user.email,
    })

    return c.json({
      message: 'Payment created successfully',
      ...result,
    })
  } catch (error: any) {
    console.error('Create payment error:', error)
    return c.json({ error: error.message || 'Failed to create payment' }, 400)
  }
})

// Payment callback from Duitku
// SECURITY LAYERS:
// 1. Rate limiting (prevent DDoS)
// 2. IP whitelist (only Duitku IPs)
// 3. Request validation (required fields)
// 4. Signature verification (in service)
// 5. Idempotency check (in service)
// 6. Audit logging (in service)
paymentRoutes.post(
  '/duitku/callback',
  rateLimiter(paymentCallbackRateLimitConfig),
  ...paymentSecurityMiddleware,
  async (c) => {
    try {
      // Get validated callback data from middleware
      const callbackData = c.get('validatedCallbackData')
      const clientIP = getClientIP(c.req.raw)

      console.log('[PAYMENT] Duitku callback received:', {
        merchantOrderId: callbackData.merchantOrderId,
        amount: callbackData.amount,
        resultCode: callbackData.resultCode,
        ip: clientIP,
      })

      // Process callback with all security checks
      const result = await paymentService.handleCallback(callbackData, clientIP)

      // Return success response (Duitku expects 200 OK)
      return c.json(result, 200)
    } catch (error: any) {
      // Use centralized error handler
      if (isPaymentError(error)) {
        return handlePaymentError(c, error)
      }

      // Unexpected error
      console.error('[PAYMENT] Unexpected callback error:', error)
      return c.json({ error: 'Failed to process callback' }, 400)
    }
  }
)

// Get payment status
paymentRoutes.get('/status/:merchantOrderId', authMiddleware, async (c) => {
  try {
    const merchantOrderId = c.req.param('merchantOrderId')

    const payment = await paymentService.getPaymentStatus(merchantOrderId)

    return c.json(payment)
  } catch (error: any) {
    console.error('Get payment status error:', error)
    return c.json({ error: error.message || 'Failed to get payment status' }, 400)
  }
})

export default paymentRoutes
