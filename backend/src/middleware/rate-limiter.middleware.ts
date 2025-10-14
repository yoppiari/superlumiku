/**
 * Rate Limiter Middleware
 *
 * Production-ready rate limiting for authentication endpoints with:
 * - Redis-based distributed rate limiting
 * - IP-based tracking with proxy support
 * - Configurable limits per endpoint
 * - Security monitoring and logging
 * - Proper HTTP 429 responses with retry-after headers
 */

import { Context, MiddlewareHandler } from 'hono'
import { redis, isRedisEnabled } from '../lib/redis'
import { env } from '../config/env'
import { getClientIp as getSecureClientIp, parseTrustedProxies } from '../utils/ip-utils'

// Parse trusted proxies once at module load
const trustedProxies = parseTrustedProxies(env.TRUSTED_PROXY_IPS)

/**
 * Rate limit configuration options
 */
export interface RateLimitConfig {
  /**
   * Time window in milliseconds
   */
  windowMs: number

  /**
   * Maximum number of requests per window
   */
  max: number

  /**
   * Unique identifier for this rate limiter (used in Redis keys)
   */
  keyPrefix: string

  /**
   * Message to return when rate limit is exceeded
   */
  message?: string

  /**
   * Whether to skip failed requests (errors) in the rate limit count
   */
  skipFailedRequests?: boolean

  /**
   * Whether to skip successful requests in the rate limit count
   */
  skipSuccessfulRequests?: boolean

  /**
   * Custom function to generate the rate limit key
   */
  keyGenerator?: (c: Context) => string

  /**
   * Custom handler for rate limit exceeded
   */
  handler?: (c: Context) => Response | Promise<Response>
}

/**
 * In-memory store for rate limiting (fallback when Redis is unavailable)
 */
class MemoryStore {
  private hits: Map<string, { count: number; resetTime: number }> = new Map()
  private cleanupInterval: Timer | null = null

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      const entries = Array.from(this.hits.entries())
      for (const [key, value] of entries) {
        if (value.resetTime <= now) {
          this.hits.delete(key)
        }
      }
    }, 60000)
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now()
    const existing = this.hits.get(key)

    if (existing && existing.resetTime > now) {
      existing.count++
      return existing
    }

    const newEntry = {
      count: 1,
      resetTime: now + windowMs,
    }
    this.hits.set(key, newEntry)
    return newEntry
  }

  async decrement(key: string): Promise<void> {
    const existing = this.hits.get(key)
    if (existing && existing.count > 0) {
      existing.count--
    }
  }

  async reset(key: string): Promise<void> {
    this.hits.delete(key)
  }

  cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.hits.clear()
  }
}

/**
 * Redis store for distributed rate limiting
 */
class RedisStore {
  /**
   * Atomically increment counter with TTL using Lua script
   * This prevents race conditions where multiple concurrent requests
   * could bypass the rate limit before the counter is updated
   */
  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    if (!redis) {
      throw new Error('Redis is not available')
    }

    const now = Date.now()
    const resetTime = now + windowMs

    // Lua script for atomic increment with TTL
    // This ensures the increment and expire operations are atomic
    const luaScript = `
      local key = KEYS[1]
      local ttl_ms = tonumber(ARGV[1])
      local current = redis.call('incr', key)
      if current == 1 then
        redis.call('pexpire', key, ttl_ms)
      else
        -- Ensure TTL is set even if previous pexpire failed
        local existing_ttl = redis.call('pttl', key)
        if existing_ttl == -1 then
          redis.call('pexpire', key, ttl_ms)
        end
      end
      return current
    `

    const count = (await redis.eval(luaScript, 1, key, windowMs)) as number

    return { count, resetTime }
  }

  /**
   * Atomically decrement counter (for skipFailedRequests)
   */
  async decrement(key: string): Promise<void> {
    if (!redis) {
      throw new Error('Redis is not available')
    }

    // Only decrement if key exists and count > 0
    const luaScript = `
      local key = KEYS[1]
      local current = redis.call('get', key)
      if current and tonumber(current) > 0 then
        return redis.call('decr', key)
      end
      return 0
    `

    await redis.eval(luaScript, 1, key)
  }

  async reset(key: string): Promise<void> {
    if (!redis) {
      throw new Error('Redis is not available')
    }
    await redis.del(key)
  }
}

// Initialize stores
const memoryStore = new MemoryStore()
const redisStore = new RedisStore()

/**
 * Extract client IP address from request with security validation
 * Uses the secure IP extraction utility to prevent spoofing attacks
 */
function getClientIp(c: Context): string {
  return getSecureClientIp(c, trustedProxies)
}

/**
 * Default key generator - uses IP address
 */
function defaultKeyGenerator(c: Context, keyPrefix: string): string {
  const ip = getClientIp(c)
  return `${keyPrefix}:${ip}`
}

/**
 * Log rate limit violation for security monitoring
 */
function logRateLimitViolation(ip: string, endpoint: string, count: number, max: number): void {
  const timestamp = new Date().toISOString()
  console.warn(
    `[RATE_LIMIT_VIOLATION] ${timestamp} - IP: ${ip}, Endpoint: ${endpoint}, Attempts: ${count}/${max}`
  )
}

/**
 * Create a rate limiter middleware
 *
 * @param config - Rate limit configuration
 * @returns Hono middleware handler
 *
 * @example
 * ```typescript
 * // Limit login attempts to 5 per 15 minutes
 * const loginLimiter = rateLimiter({
 *   windowMs: 15 * 60 * 1000,
 *   max: 5,
 *   keyPrefix: 'rl:login',
 *   message: 'Too many login attempts, please try again later'
 * })
 *
 * authRoutes.post('/login', loginLimiter, async (c) => {
 *   // ... login handler
 * })
 * ```
 */
export function rateLimiter(config: RateLimitConfig): MiddlewareHandler {
  const {
    windowMs,
    max,
    keyPrefix,
    message = 'Too many requests, please try again later',
    skipFailedRequests = false,
    skipSuccessfulRequests = false,
    keyGenerator = (c) => defaultKeyGenerator(c, keyPrefix),
    handler,
  } = config

  return async (c: Context, next) => {
    try {
      // Generate unique key for this client
      const key = keyGenerator(c)

      // Use Redis if available, otherwise fallback to memory store
      const store = isRedisEnabled() ? redisStore : memoryStore

      // Increment counter
      const { count, resetTime } = await store.increment(key, windowMs)

      // Calculate remaining requests and reset time
      const remaining = Math.max(0, max - count)
      const resetTimeSeconds = Math.ceil(resetTime / 1000)

      // Set rate limit headers
      c.header('X-RateLimit-Limit', max.toString())
      c.header('X-RateLimit-Remaining', remaining.toString())
      c.header('X-RateLimit-Reset', resetTimeSeconds.toString())

      // Check if rate limit exceeded
      if (count > max) {
        const retryAfterSeconds = Math.ceil((resetTime - Date.now()) / 1000)
        c.header('Retry-After', retryAfterSeconds.toString())

        // Log violation for security monitoring
        const ip = getClientIp(c)
        const endpoint = c.req.path
        logRateLimitViolation(ip, endpoint, count, max)

        // Use custom handler if provided
        if (handler) {
          return handler(c)
        }

        // Default response
        return c.json(
          {
            error: 'Rate limit exceeded',
            message,
            retryAfter: retryAfterSeconds,
          },
          429
        )
      }

      // Continue to next middleware
      await next()

      // Handle skip options
      const statusCode = c.res.status
      const shouldSkip =
        (skipFailedRequests && statusCode >= 400) ||
        (skipSuccessfulRequests && statusCode < 400)

      if (shouldSkip) {
        // Decrement counter if we should skip this request
        await store.decrement(key)
      }
    } catch (error) {
      // Log error but don't block the request
      console.error('[RATE_LIMITER_ERROR]', error)

      // If rate limiting fails, allow the request but log the error
      // This ensures availability even if Redis is down
      await next()
    }
  }
}

/**
 * Create a stricter rate limiter that blocks on errors
 * Use this for critical endpoints where rate limiting must be enforced
 */
export function strictRateLimiter(config: RateLimitConfig): MiddlewareHandler {
  const middleware = rateLimiter(config)

  return async (c: Context, next) => {
    try {
      return await middleware(c, next)
    } catch (error) {
      console.error('[STRICT_RATE_LIMITER_ERROR]', error)

      // Return error response instead of allowing request
      return c.json(
        {
          error: 'Rate limiting service unavailable',
          message: 'Please try again in a moment',
        },
        503
      )
    }
  }
}

/**
 * Account-based rate limiter for login attempts
 * Tracks failed login attempts per email address
 */
export function accountRateLimiter(message?: string): MiddlewareHandler {
  return async (c: Context, next) => {
    try {
      // Import rate limit service (dynamic to avoid circular dependencies)
      const { rateLimitService } = await import('../services/rate-limit.service')

      // Get email from request body
      let email: string | undefined
      try {
        const body = await c.req.json()
        email = body.email
      } catch {
        // If we can't parse body, skip account-based limiting
        await next()
        return
      }

      if (!email) {
        await next()
        return
      }

      // Check if account is allowed to attempt login
      const rateLimitInfo = await rateLimitService.checkLoginAllowed(email)

      if (!rateLimitInfo.allowed) {
        const ip = getClientIp(c)
        console.warn(
          `[RATE_LIMIT_ACCOUNT] Login blocked for ${email} from IP ${ip} - ` +
            `${rateLimitInfo.locked ? 'ACCOUNT LOCKED' : 'Rate limit exceeded'}`
        )

        return c.json(
          {
            error: 'Rate limit exceeded',
            code: rateLimitInfo.locked ? 'ACCOUNT_LOCKED' : 'RATE_LIMIT_EXCEEDED',
            message:
              message ||
              (rateLimitInfo.locked
                ? 'Account temporarily locked due to too many failed login attempts. Please try again later or reset your password.'
                : 'Too many login attempts. Please try again later.'),
            retryAfter: rateLimitInfo.retryAfter,
            remainingAttempts: 0,
          },
          429
        )
      }

      // Apply progressive delay if needed
      if (rateLimitInfo.requiresDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, rateLimitInfo.requiresDelay))
      }

      // Set remaining attempts header
      c.header('X-RateLimit-Remaining-Account', rateLimitInfo.remainingAttempts.toString())

      // Continue to next middleware
      await next()
    } catch (error) {
      // Log error but don't block the request
      console.error('[ACCOUNT_RATE_LIMITER_ERROR]', error)
      await next()
    }
  }
}

/**
 * Cleanup resources on shutdown
 */
export function cleanup(): void {
  memoryStore.cleanup()
}

// Register cleanup on process termination
process.on('SIGTERM', cleanup)
process.on('SIGINT', cleanup)
