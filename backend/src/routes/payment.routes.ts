import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.middleware'
import { PaymentService } from '../services/payment.service'
import { z } from 'zod'

const paymentRoutes = new Hono()
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
paymentRoutes.post('/duitku/callback', async (c) => {
  try {
    const callbackData = await c.req.json()

    console.log('Duitku callback received:', callbackData)

    const result = await paymentService.handleCallback(callbackData)

    return c.json(result)
  } catch (error: any) {
    console.error('Payment callback error:', error)
    return c.json({ error: error.message || 'Failed to process callback' }, 400)
  }
})

// Get payment status
paymentRoutes.get('/status/:merchantOrderId', authMiddleware, async (c) => {
  try {
    const merchantOrderId = c.param('merchantOrderId')

    const payment = await paymentService.getPaymentStatus(merchantOrderId)

    return c.json(payment)
  } catch (error: any) {
    console.error('Get payment status error:', error)
    return c.json({ error: error.message || 'Failed to get payment status' }, 400)
  }
})

export default paymentRoutes
