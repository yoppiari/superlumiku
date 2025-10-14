import { Hono } from 'hono'
import { AuthService } from '../services/auth.service'
import { authMiddleware } from '../middleware/auth.middleware'
import { AuthVariables } from '../types/hono'
import { rateLimiter, accountRateLimiter } from '../middleware/rate-limiter.middleware'
import { authRateLimits } from '../config/rate-limit.config'
import { sendSuccess, HttpStatus } from '../utils/api-response'
import { asyncHandler } from '../utils/error-handler'
import { logger } from '../utils/logger'
import { AuthContext } from '../types/routes'
import { z } from 'zod'

const authRoutes = new Hono<{ Variables: AuthVariables }>()
const authService = new AuthService()

// Create rate limiters for authentication endpoints
// Multi-tiered approach: IP-based + Account-based + Global
const globalAuthLimiter = rateLimiter(authRateLimits.global)
const loginIpLimiter = rateLimiter(authRateLimits.login)
const loginAccountLimiter = accountRateLimiter('Too many failed login attempts for this account. Please try again later.')
const registerLimiter = rateLimiter(authRateLimits.register)
const profileUpdateLimiter = rateLimiter(authRateLimits.profileUpdate)

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

const updateProfileSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Invalid email address').optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').optional(),
})

/**
 * POST /api/auth/register
 * Register a new user account
 * SECURITY: IP-based rate limiting (3 per hour)
 *
 * @body email, password, name (optional)
 * @returns User details and session token
 */
authRoutes.post(
  '/register',
  globalAuthLimiter,
  registerLimiter,
  asyncHandler(async (c) => {
    const body = await c.req.json()
    const validated = registerSchema.parse(body)

    const userAgent = c.req.header('User-Agent') || ''
    const ipAddress = c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP') || ''

    logger.info('User registration attempt', { email: validated.email, ipAddress })

    const result = await authService.register(validated, userAgent, ipAddress)

    logger.info('User registered successfully', { userId: result.user.id, email: validated.email })

    return sendSuccess(c, result, 'Registration successful', HttpStatus.CREATED)
  }, 'Register User')
)

/**
 * POST /api/auth/login
 * Authenticate user and create session
 * SECURITY: Multi-tiered rate limiting
 * 1. Global auth rate limit (prevents system DoS)
 * 2. IP-based rate limit (5 per 15 min per IP)
 * 3. Account-based rate limit (5 per 15 min per email, lockout after 10 in 1 hour)
 *
 * @body email, password
 * @returns User details and session token
 */
authRoutes.post(
  '/login',
  globalAuthLimiter,
  loginIpLimiter,
  loginAccountLimiter,
  asyncHandler(async (c) => {
    const body = await c.req.json()
    const validated = loginSchema.parse(body)

    const userAgent = c.req.header('User-Agent') || ''
    const ipAddress = c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP') || ''

    logger.info('User login attempt', { email: validated.email, ipAddress })

    const result = await authService.login(validated, userAgent, ipAddress)

    logger.info('User logged in successfully', { userId: result.user.id, email: validated.email })

    return sendSuccess(c, result, 'Login successful')
  }, 'Login User')
)

/**
 * GET /api/auth/profile
 * Get current user profile (protected)
 *
 * @returns User profile information
 */
authRoutes.get(
  '/profile',
  authMiddleware,
  asyncHandler(async (c: AuthContext) => {
    const userId = c.get('userId')

    logger.info('Fetching user profile', { userId })

    const profile = await authService.getProfile(userId)

    logger.debug('User profile retrieved', { userId })

    // Maintain backward compatibility by returning raw profile data
    return c.json(profile)
  }, 'Get User Profile')
)

/**
 * PUT /api/auth/profile
 * Update user profile (protected)
 * SECURITY: Rate limited to prevent abuse
 *
 * @body name, email, currentPassword, newPassword (all optional)
 * @returns Updated user profile
 */
authRoutes.put(
  '/profile',
  authMiddleware,
  profileUpdateLimiter,
  asyncHandler(async (c: AuthContext) => {
    const userId = c.get('userId')
    const body = await c.req.json()
    const validated = updateProfileSchema.parse(body)

    logger.info('Updating user profile', { userId, updates: Object.keys(validated) })

    const result = await authService.updateProfile(userId, validated)

    logger.info('User profile updated successfully', { userId })

    return sendSuccess(c, result, 'Profile updated successfully')
  }, 'Update User Profile')
)

export default authRoutes