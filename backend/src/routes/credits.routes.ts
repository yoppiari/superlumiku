import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.middleware'
import { PaymentService } from '../services/payment.service'

const creditsRoutes = new Hono()
const paymentService = new PaymentService()

// Get credit balance
creditsRoutes.get('/balance', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')

    const balance = await paymentService.getCreditBalance(userId)

    return c.json({ balance })
  } catch (error: any) {
    console.error('Get credit balance error:', error)
    return c.json({ error: error.message || 'Failed to get credit balance' }, 400)
  }
})

// Get credit transaction history
creditsRoutes.get('/history', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')

    const history = await paymentService.getCreditHistory(userId)

    return c.json(history)
  } catch (error: any) {
    console.error('Get credit history error:', error)
    return c.json({ error: error.message || 'Failed to get credit history' }, 400)
  }
})

export default creditsRoutes
