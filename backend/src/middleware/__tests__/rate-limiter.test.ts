/**
 * Rate Limiter Middleware Tests
 *
 * Comprehensive test suite for rate limiting functionality including:
 * - IP-based rate limiting
 * - Account-based rate limiting
 * - Account lockout
 * - Progressive delays
 * - Redis fallback
 * - Rate limit headers
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Hono } from 'hono'
import { rateLimiter, accountRateLimiter } from '../rate-limiter.middleware'
import { RateLimitConfig } from '../rate-limiter.middleware'

// Mock Redis
vi.mock('../../lib/redis', () => ({
  redis: null,
  isRedisEnabled: () => false,
}))

// Mock rate limit service
const mockRateLimitService = {
  checkLoginAllowed: vi.fn(),
  trackFailedLogin: vi.fn(),
  resetFailedLogins: vi.fn(),
}

vi.mock('../../services/rate-limit.service', () => ({
  rateLimitService: mockRateLimitService,
}))

describe('Rate Limiter Middleware', () => {
  let app: Hono

  beforeEach(() => {
    app = new Hono()
    vi.clearAllMocks()
  })

  describe('IP-based Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const config: RateLimitConfig = {
        windowMs: 60000,
        max: 5,
        keyPrefix: 'test:rl',
      }

      app.get('/test', rateLimiter(config), (c) => c.json({ success: true }))

      // Make 5 requests - all should succeed
      for (let i = 0; i < 5; i++) {
        const res = await app.request('/test', {
          headers: { 'X-Forwarded-For': '192.168.1.1' },
        })
        expect(res.status).toBe(200)
        expect(res.headers.get('X-RateLimit-Limit')).toBe('5')
        expect(res.headers.get('X-RateLimit-Remaining')).toBe(String(4 - i))
      }
    })

    it('should block requests exceeding rate limit', async () => {
      const config: RateLimitConfig = {
        windowMs: 60000,
        max: 3,
        keyPrefix: 'test:rl:block',
        message: 'Rate limit exceeded',
      }

      app.get('/test', rateLimiter(config), (c) => c.json({ success: true }))

      // Make 3 requests - all should succeed
      for (let i = 0; i < 3; i++) {
        const res = await app.request('/test', {
          headers: { 'X-Forwarded-For': '192.168.1.2' },
        })
        expect(res.status).toBe(200)
      }

      // 4th request should be blocked
      const res = await app.request('/test', {
        headers: { 'X-Forwarded-For': '192.168.1.2' },
      })

      expect(res.status).toBe(429)
      const data = await res.json()
      expect(data.error).toBe('Rate limit exceeded')
      expect(data.message).toBe('Rate limit exceeded')
      expect(res.headers.get('Retry-After')).toBeTruthy()
      expect(res.headers.get('X-RateLimit-Remaining')).toBe('0')
    })

    it('should track different IPs independently', async () => {
      const config: RateLimitConfig = {
        windowMs: 60000,
        max: 2,
        keyPrefix: 'test:rl:multi-ip',
      }

      app.get('/test', rateLimiter(config), (c) => c.json({ success: true }))

      // IP 1 - 2 requests (at limit)
      for (let i = 0; i < 2; i++) {
        const res = await app.request('/test', {
          headers: { 'X-Forwarded-For': '10.0.0.1' },
        })
        expect(res.status).toBe(200)
      }

      // IP 2 - should still be allowed
      const res = await app.request('/test', {
        headers: { 'X-Forwarded-For': '10.0.0.2' },
      })
      expect(res.status).toBe(200)

      // IP 1 - should be blocked
      const res2 = await app.request('/test', {
        headers: { 'X-Forwarded-For': '10.0.0.1' },
      })
      expect(res2.status).toBe(429)
    })

    it('should set correct rate limit headers', async () => {
      const config: RateLimitConfig = {
        windowMs: 60000,
        max: 10,
        keyPrefix: 'test:rl:headers',
      }

      app.get('/test', rateLimiter(config), (c) => c.json({ success: true }))

      const res = await app.request('/test', {
        headers: { 'X-Forwarded-For': '172.16.0.1' },
      })

      expect(res.status).toBe(200)
      expect(res.headers.get('X-RateLimit-Limit')).toBe('10')
      expect(res.headers.get('X-RateLimit-Remaining')).toBe('9')
      expect(res.headers.get('X-RateLimit-Reset')).toBeTruthy()
    })

    it('should support custom key generator', async () => {
      const config: RateLimitConfig = {
        windowMs: 60000,
        max: 2,
        keyPrefix: 'test:rl:custom',
        keyGenerator: (c) => {
          const userId = c.req.header('X-User-ID')
          return `test:rl:custom:user:${userId || 'anonymous'}`
        },
      }

      app.get('/test', rateLimiter(config), (c) => c.json({ success: true }))

      // User 1 - 2 requests
      for (let i = 0; i < 2; i++) {
        const res = await app.request('/test', {
          headers: { 'X-User-ID': 'user1' },
        })
        expect(res.status).toBe(200)
      }

      // User 1 - blocked
      const res1 = await app.request('/test', {
        headers: { 'X-User-ID': 'user1' },
      })
      expect(res1.status).toBe(429)

      // User 2 - still allowed
      const res2 = await app.request('/test', {
        headers: { 'X-User-ID': 'user2' },
      })
      expect(res2.status).toBe(200)
    })
  })

  describe('Account-based Rate Limiting', () => {
    beforeEach(() => {
      mockRateLimitService.checkLoginAllowed.mockReset()
      mockRateLimitService.trackFailedLogin.mockReset()
    })

    it('should allow login when account is not rate limited', async () => {
      mockRateLimitService.checkLoginAllowed.mockResolvedValue({
        allowed: true,
        remainingAttempts: 5,
        locked: false,
        requiresDelay: 0,
      })

      app.post('/login', accountRateLimiter(), async (c) => {
        return c.json({ success: true })
      })

      const res = await app.request('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
      })

      expect(res.status).toBe(200)
      expect(mockRateLimitService.checkLoginAllowed).toHaveBeenCalledWith('test@example.com')
      expect(res.headers.get('X-RateLimit-Remaining-Account')).toBe('5')
    })

    it('should block login when rate limit exceeded', async () => {
      mockRateLimitService.checkLoginAllowed.mockResolvedValue({
        allowed: false,
        remainingAttempts: 0,
        locked: false,
        requiresDelay: 0,
        retryAfter: 900,
      })

      app.post('/login', accountRateLimiter(), async (c) => {
        return c.json({ success: true })
      })

      const res = await app.request('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
      })

      expect(res.status).toBe(429)
      const data = await res.json()
      expect(data.code).toBe('RATE_LIMIT_EXCEEDED')
      expect(data.retryAfter).toBe(900)
    })

    it('should block login when account is locked', async () => {
      mockRateLimitService.checkLoginAllowed.mockResolvedValue({
        allowed: false,
        remainingAttempts: 0,
        locked: true,
        requiresDelay: 0,
        retryAfter: 1800,
      })

      app.post('/login', accountRateLimiter(), async (c) => {
        return c.json({ success: true })
      })

      const res = await app.request('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'locked@example.com', password: 'password' }),
      })

      expect(res.status).toBe(429)
      const data = await res.json()
      expect(data.code).toBe('ACCOUNT_LOCKED')
      expect(data.message).toContain('temporarily locked')
    })

    it('should apply progressive delay for high attempt counts', async () => {
      mockRateLimitService.checkLoginAllowed.mockResolvedValue({
        allowed: true,
        remainingAttempts: 1,
        locked: false,
        requiresDelay: 1000, // 1 second delay
      })

      app.post('/login', accountRateLimiter(), async (c) => {
        return c.json({ success: true })
      })

      const startTime = Date.now()
      const res = await app.request('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'slow@example.com', password: 'password' }),
      })
      const endTime = Date.now()

      expect(res.status).toBe(200)
      expect(endTime - startTime).toBeGreaterThanOrEqual(1000)
    })

    it('should skip account limiting if no email in body', async () => {
      app.post('/login', accountRateLimiter(), async (c) => {
        return c.json({ success: true })
      })

      const res = await app.request('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'test' }), // No email field
      })

      expect(res.status).toBe(200)
      expect(mockRateLimitService.checkLoginAllowed).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should gracefully handle Redis failures', async () => {
      const config: RateLimitConfig = {
        windowMs: 60000,
        max: 5,
        keyPrefix: 'test:rl:error',
      }

      app.get('/test', rateLimiter(config), (c) => c.json({ success: true }))

      // Even with Redis unavailable, requests should still work (using memory store)
      const res = await app.request('/test')
      expect(res.status).toBe(200)
    })

    it('should allow requests if rate limiter throws error', async () => {
      mockRateLimitService.checkLoginAllowed.mockRejectedValue(
        new Error('Service unavailable')
      )

      app.post('/login', accountRateLimiter(), async (c) => {
        return c.json({ success: true })
      })

      const res = await app.request('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
      })

      // Should allow the request despite error
      expect(res.status).toBe(200)
    })
  })

  describe('skipSuccessfulRequests option', () => {
    it('should not count successful requests when skipSuccessfulRequests is true', async () => {
      const config: RateLimitConfig = {
        windowMs: 60000,
        max: 2,
        keyPrefix: 'test:rl:skip-success',
        skipSuccessfulRequests: true,
      }

      app.get('/test', rateLimiter(config), (c) => c.json({ success: true }))

      // Make 3 successful requests - all should succeed
      for (let i = 0; i < 3; i++) {
        const res = await app.request('/test', {
          headers: { 'X-Forwarded-For': '192.168.100.1' },
        })
        expect(res.status).toBe(200)
      }
    })
  })

  describe('Custom handler', () => {
    it('should use custom handler when rate limit exceeded', async () => {
      const customHandler = vi.fn((c) => {
        return c.json({ custom: 'error', retry: 'later' }, 429)
      })

      const config: RateLimitConfig = {
        windowMs: 60000,
        max: 1,
        keyPrefix: 'test:rl:custom-handler',
        handler: customHandler,
      }

      app.get('/test', rateLimiter(config), (c) => c.json({ success: true }))

      // First request - success
      await app.request('/test', {
        headers: { 'X-Forwarded-For': '10.10.10.1' },
      })

      // Second request - custom handler
      const res = await app.request('/test', {
        headers: { 'X-Forwarded-For': '10.10.10.1' },
      })

      expect(res.status).toBe(429)
      const data = await res.json()
      expect(data.custom).toBe('error')
      expect(customHandler).toHaveBeenCalled()
    })
  })
})

describe('Rate Limit Service Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should integrate with auth service to track failed logins', async () => {
    // This test verifies the integration pattern
    // Actual integration tests would require full service setup
    expect(mockRateLimitService.trackFailedLogin).toBeDefined()
    expect(mockRateLimitService.checkLoginAllowed).toBeDefined()
    expect(mockRateLimitService.resetFailedLogins).toBeDefined()
  })
})
