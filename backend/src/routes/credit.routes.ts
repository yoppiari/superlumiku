import { Hono } from 'hono'
import { CreditService } from '../services/credit.service'
import { authMiddleware } from '../middleware/auth.middleware'
import { AuthVariables } from '../types/hono'

const creditRoutes = new Hono<{ Variables: AuthVariables }>()
const creditService = new CreditService()

// Get current balance
creditRoutes.get('/balance', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const balance = await creditService.getBalance(userId)

    return c.json({ balance })
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to get balance' }, 400)
  }
})

// Get credit history
creditRoutes.get('/history', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const limit = parseInt(c.req.query('limit') || '50')

    const history = await creditService.getHistory(userId, limit)

    return c.json({ history })
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to get history' }, 400)
  }
})

export default creditRoutes