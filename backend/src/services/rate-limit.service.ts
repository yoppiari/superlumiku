/**
 * Rate Limit Service
 *
 * Comprehensive rate limiting service with:
 * - Account-based rate limiting (failed login tracking)
 * - Account lockout after excessive failed attempts
 * - Progressive delays for security
 * - Redis-backed storage for distributed systems
 * - Security event logging
 */

import { redis, isRedisEnabled } from '../lib/redis'
import prisma from '../db/client'

export interface FailedAttempt {
  count: number
  firstAttempt: number
  lastAttempt: number
  locked: boolean
  lockUntil?: number
}

export interface RateLimitInfo {
  allowed: boolean
  remainingAttempts: number
  retryAfter?: number // seconds
  locked: boolean
  requiresDelay: number // milliseconds
}

/**
 * Rate Limit Service for account-based limiting
 */
export class RateLimitService {
  private memoryStore: Map<string, FailedAttempt> = new Map()

  /**
   * Track failed login attempt for an account
   * Uses hybrid IP+email rate limiting to prevent both brute force and DoS attacks
   */
  async trackFailedLogin(email: string, ip: string): Promise<RateLimitInfo> {
    const emailKey = `failed_login:email:${email}`
    const ipKey = `failed_login:ip:${ip}`

    const emailAttempt = await this.getFailedAttempts(emailKey)
    const ipAttempt = await this.getFailedAttempts(ipKey)

    const now = Date.now()
    const newEmailCount = emailAttempt.count + 1
    const newIpCount = ipAttempt.count + 1

    // Update email-based attempt record
    const updatedEmail: FailedAttempt = {
      count: newEmailCount,
      firstAttempt: emailAttempt.firstAttempt || now,
      lastAttempt: now,
      locked: false,
    }

    // Update IP-based attempt record
    const updatedIp: FailedAttempt = {
      count: newIpCount,
      firstAttempt: ipAttempt.firstAttempt || now,
      lastAttempt: now,
      locked: false,
    }

    // Check if account should be locked
    // Only lock if BOTH conditions are met:
    // 1. Email has 10+ failures in 1 hour
    // 2. IP has 5+ failures in 1 hour (prevents DoS via intentional lockouts)
    const oneHour = 60 * 60 * 1000
    if (
      newEmailCount >= 10 &&
      (now - updatedEmail.firstAttempt) < oneHour &&
      newIpCount >= 5 &&
      (now - updatedIp.firstAttempt) < oneHour
    ) {
      updatedEmail.locked = true
      updatedEmail.lockUntil = now + (30 * 60 * 1000) // Lock for 30 minutes
    }

    await this.saveFailedAttempts(emailKey, updatedEmail)
    await this.saveFailedAttempts(ipKey, updatedIp)

    // Log security event
    this.logSecurityEvent('failed_login', email, ip, newEmailCount, updatedEmail.locked)

    return this.calculateRateLimitInfo(updatedEmail)
  }

  /**
   * Check if account can attempt login
   */
  async checkLoginAllowed(email: string): Promise<RateLimitInfo> {
    const key = `failed_login:${email}`
    const attempt = await this.getFailedAttempts(key)

    return this.calculateRateLimitInfo(attempt)
  }

  /**
   * Reset failed attempts after successful login
   * Clears both email-based and IP-based tracking
   */
  async resetFailedLogins(email: string, ip?: string): Promise<void> {
    const emailKey = `failed_login:email:${email}`

    if (isRedisEnabled() && redis) {
      await redis.del(emailKey)
      // Also clear IP-based tracking if IP is provided
      if (ip) {
        const ipKey = `failed_login:ip:${ip}`
        await redis.del(ipKey)
      }
    } else {
      this.memoryStore.delete(emailKey)
      if (ip) {
        const ipKey = `failed_login:ip:${ip}`
        this.memoryStore.delete(ipKey)
      }
    }

    console.log(`[RATE_LIMIT] Reset failed attempts for: ${email}`)
  }

  /**
   * Calculate rate limit info from attempt data
   */
  private calculateRateLimitInfo(attempt: FailedAttempt): RateLimitInfo {
    const now = Date.now()
    const fifteenMinutes = 15 * 60 * 1000

    // Check if locked
    if (attempt.locked && attempt.lockUntil && attempt.lockUntil > now) {
      return {
        allowed: false,
        remainingAttempts: 0,
        retryAfter: Math.ceil((attempt.lockUntil - now) / 1000),
        locked: true,
        requiresDelay: 0,
      }
    }

    // Reset if outside 15-minute window
    if (attempt.lastAttempt && (now - attempt.lastAttempt) > fifteenMinutes) {
      return {
        allowed: true,
        remainingAttempts: 5,
        locked: false,
        requiresDelay: 0,
      }
    }

    // Calculate remaining attempts (5 per 15 minutes)
    const remaining = Math.max(0, 5 - attempt.count)

    // Progressive delays
    let delay = 0
    if (attempt.count >= 6) {
      delay = 5000 // 5 seconds after 6+ attempts
    } else if (attempt.count >= 4) {
      delay = 1000 // 1 second after 4-5 attempts
    }

    return {
      allowed: remaining > 0,
      remainingAttempts: remaining,
      retryAfter: remaining === 0 ? Math.ceil((fifteenMinutes - (now - attempt.firstAttempt)) / 1000) : undefined,
      locked: false,
      requiresDelay: delay,
    }
  }

  /**
   * Get failed attempts from Redis or memory
   */
  private async getFailedAttempts(key: string): Promise<FailedAttempt> {
    try {
      if (isRedisEnabled() && redis) {
        const data = await redis.get(key)
        if (data) {
          return JSON.parse(data)
        }
      } else {
        const data = this.memoryStore.get(key)
        if (data) {
          return data
        }
      }
    } catch (error) {
      console.error('[RATE_LIMIT_SERVICE] Error getting attempts:', error)
    }

    return {
      count: 0,
      firstAttempt: Date.now(),
      lastAttempt: Date.now(),
      locked: false,
    }
  }

  /**
   * Save failed attempts to Redis or memory
   */
  private async saveFailedAttempts(key: string, attempt: FailedAttempt): Promise<void> {
    try {
      if (isRedisEnabled() && redis) {
        // Store in Redis with 1 hour expiry
        await redis.setex(key, 3600, JSON.stringify(attempt))
      } else {
        this.memoryStore.set(key, attempt)
      }
    } catch (error) {
      console.error('[RATE_LIMIT_SERVICE] Error saving attempts:', error)
    }
  }

  /**
   * Log security event
   */
  private logSecurityEvent(
    event: string,
    email: string,
    ip: string,
    attempts: number,
    locked: boolean
  ): void {
    const timestamp = new Date().toISOString()

    if (locked) {
      console.error(
        `[SECURITY_ALERT] ${timestamp} - ACCOUNT_LOCKED: ${email} from IP ${ip} after ${attempts} failed attempts`
      )
    } else if (attempts >= 5) {
      console.warn(
        `[SECURITY_WARNING] ${timestamp} - HIGH_FAILED_ATTEMPTS: ${email} from IP ${ip} - ${attempts} attempts`
      )
    } else {
      console.log(
        `[SECURITY_EVENT] ${timestamp} - ${event}: ${email} from IP ${ip} - attempt ${attempts}`
      )
    }
  }

  /**
   * Get account lockout status (for monitoring/admin)
   */
  async getAccountStatus(email: string): Promise<{
    isLocked: boolean
    failedAttempts: number
    lockUntil?: Date
  }> {
    const key = `failed_login:${email}`
    const attempt = await this.getFailedAttempts(key)

    return {
      isLocked: attempt.locked && attempt.lockUntil ? attempt.lockUntil > Date.now() : false,
      failedAttempts: attempt.count,
      lockUntil: attempt.lockUntil ? new Date(attempt.lockUntil) : undefined,
    }
  }

  /**
   * Manually unlock account (admin function)
   */
  async unlockAccount(email: string, adminId: string): Promise<void> {
    const key = `failed_login:${email}`

    if (isRedisEnabled() && redis) {
      await redis.del(key)
    } else {
      this.memoryStore.delete(key)
    }

    console.log(`[SECURITY_ADMIN] Account ${email} unlocked by admin ${adminId}`)
  }

  /**
   * Get rate limit statistics (for monitoring)
   */
  async getStatistics(): Promise<{
    totalLocked: number
    totalAttempts: number
    recentViolations: number
  }> {
    let totalLocked = 0
    let totalAttempts = 0
    let recentViolations = 0

    const now = Date.now()
    const fiveMinutesAgo = now - (5 * 60 * 1000)

    try {
      if (isRedisEnabled() && redis) {
        // Get all failed login keys
        const keys = await redis.keys('failed_login:*')

        for (const key of keys) {
          const data = await redis.get(key)
          if (data) {
            const attempt: FailedAttempt = JSON.parse(data)

            if (attempt.locked && attempt.lockUntil && attempt.lockUntil > now) {
              totalLocked++
            }

            totalAttempts += attempt.count

            if (attempt.lastAttempt > fiveMinutesAgo) {
              recentViolations++
            }
          }
        }
      } else {
        // Use memory store
        for (const [key, attempt] of this.memoryStore.entries()) {
          if (attempt.locked && attempt.lockUntil && attempt.lockUntil > now) {
            totalLocked++
          }

          totalAttempts += attempt.count

          if (attempt.lastAttempt > fiveMinutesAgo) {
            recentViolations++
          }
        }
      }
    } catch (error) {
      console.error('[RATE_LIMIT_SERVICE] Error getting statistics:', error)
    }

    return {
      totalLocked,
      totalAttempts,
      recentViolations,
    }
  }

  /**
   * Cleanup expired entries (for memory store)
   */
  cleanup(): void {
    const now = Date.now()
    const oneHour = 60 * 60 * 1000

    for (const [key, attempt] of this.memoryStore.entries()) {
      if (attempt.lastAttempt && (now - attempt.lastAttempt) > oneHour) {
        this.memoryStore.delete(key)
      }
    }
  }
}

// Singleton instance
export const rateLimitService = new RateLimitService()

// Cleanup interval (every 5 minutes)
setInterval(() => {
  rateLimitService.cleanup()
}, 5 * 60 * 1000)
