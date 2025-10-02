import { Hono } from 'hono'
import { AuthService } from '../services/auth.service'
import { authMiddleware } from '../middleware/auth.middleware'
import { z } from 'zod'

const authRoutes = new Hono()
const authService = new AuthService()

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

const updateProfileSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
})

// Register
authRoutes.post('/register', async (c) => {
  try {
    const body = await c.req.json()
    const validated = registerSchema.parse(body)

    const userAgent = c.req.header('User-Agent') || ''
    const ipAddress = c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP') || ''

    const result = await authService.register(validated, userAgent, ipAddress)

    return c.json({
      message: 'Registration successful',
      ...result,
    }, 201)
  } catch (error: any) {
    return c.json({ error: error.message || 'Registration failed' }, 400)
  }
})

// Login
authRoutes.post('/login', async (c) => {
  try {
    const body = await c.req.json()
    const validated = loginSchema.parse(body)

    const userAgent = c.req.header('User-Agent') || ''
    const ipAddress = c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP') || ''

    const result = await authService.login(validated, userAgent, ipAddress)

    return c.json({
      message: 'Login successful',
      ...result,
    })
  } catch (error: any) {
    return c.json({ error: error.message || 'Login failed' }, 401)
  }
})

// Get profile (protected)
authRoutes.get('/profile', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const profile = await authService.getProfile(userId)

    return c.json(profile)
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to get profile' }, 400)
  }
})

// Update profile (protected)
authRoutes.put('/profile', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const body = await c.req.json()
    const validated = updateProfileSchema.parse(body)

    const result = await authService.updateProfile(userId, validated)

    return c.json({
      message: 'Profile updated successfully',
      ...result,
    })
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to update profile' }, 400)
  }
})

export default authRoutes