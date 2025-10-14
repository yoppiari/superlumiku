/**
 * Rate Limiting Configuration
 *
 * Centralized configuration for rate limits across different endpoints.
 * These values can be overridden via environment variables for flexibility.
 */

import { RateLimitConfig } from '../middleware/rate-limiter.middleware'
import { env } from './env'

/**
 * Convert minutes to milliseconds
 */
const minutes = (m: number) => m * 60 * 1000

/**
 * Convert hours to milliseconds
 */
const hours = (h: number) => h * 60 * 60 * 1000

/**
 * Authentication rate limits
 *
 * These are strict limits to prevent brute force attacks
 */
export const authRateLimits = {
  /**
   * Login endpoint rate limit
   * Default: 5 attempts per 15 minutes
   *
   * Environment variables:
   * - LOGIN_RATE_LIMIT_WINDOW_MS: Window in milliseconds
   * - LOGIN_RATE_LIMIT_MAX: Maximum attempts
   */
  login: {
    windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || String(minutes(15))),
    max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '5'),
    keyPrefix: 'rl:auth:login',
    message: 'Too many login attempts. Please try again in 15 minutes.',
  } as RateLimitConfig,

  /**
   * Registration endpoint rate limit
   * Default: 3 attempts per hour
   *
   * Environment variables:
   * - REGISTER_RATE_LIMIT_WINDOW_MS: Window in milliseconds
   * - REGISTER_RATE_LIMIT_MAX: Maximum attempts
   */
  register: {
    windowMs: parseInt(process.env.REGISTER_RATE_LIMIT_WINDOW_MS || String(hours(1))),
    max: parseInt(process.env.REGISTER_RATE_LIMIT_MAX || '3'),
    keyPrefix: 'rl:auth:register',
    message: 'Too many registration attempts. Please try again in 1 hour.',
  } as RateLimitConfig,

  /**
   * Password reset request rate limit
   * Default: 3 attempts per hour
   */
  passwordReset: {
    windowMs: parseInt(process.env.PASSWORD_RESET_RATE_LIMIT_WINDOW_MS || String(hours(1))),
    max: parseInt(process.env.PASSWORD_RESET_RATE_LIMIT_MAX || '3'),
    keyPrefix: 'rl:auth:password-reset',
    message: 'Too many password reset attempts. Please try again in 1 hour.',
  } as RateLimitConfig,

  /**
   * Profile update rate limit
   * Default: 10 attempts per hour
   */
  profileUpdate: {
    windowMs: parseInt(process.env.PROFILE_UPDATE_RATE_LIMIT_WINDOW_MS || String(hours(1))),
    max: parseInt(process.env.PROFILE_UPDATE_RATE_LIMIT_MAX || '10'),
    keyPrefix: 'rl:auth:profile-update',
    message: 'Too many profile update attempts. Please try again later.',
  } as RateLimitConfig,

  /**
   * Global authentication rate limit
   * Default: 1000 requests per minute (system-wide protection)
   */
  global: {
    windowMs: parseInt(process.env.GLOBAL_AUTH_RATE_LIMIT_WINDOW_MS || String(minutes(1))),
    max: parseInt(process.env.GLOBAL_AUTH_RATE_LIMIT_MAX || '1000'),
    keyPrefix: 'rl:auth:global',
    message: 'Authentication system temporarily overloaded. Please try again shortly.',
    keyGenerator: () => 'global', // Single key for all auth requests
  } as RateLimitConfig,
}

/**
 * General API rate limits
 *
 * These are more lenient limits for general API usage
 */
export const apiRateLimits = {
  /**
   * General API rate limit
   * Default: 100 requests per 15 minutes
   */
  general: {
    windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || String(minutes(15))),
    max: parseInt(process.env.API_RATE_LIMIT_MAX || '100'),
    keyPrefix: 'rl:api:general',
    message: 'Too many requests. Please try again later.',
  } as RateLimitConfig,

  /**
   * Strict API rate limit for sensitive operations
   * Default: 20 requests per 15 minutes
   */
  strict: {
    windowMs: parseInt(process.env.API_STRICT_RATE_LIMIT_WINDOW_MS || String(minutes(15))),
    max: parseInt(process.env.API_STRICT_RATE_LIMIT_MAX || '20'),
    keyPrefix: 'rl:api:strict',
    message: 'Too many requests for this operation. Please try again later.',
  } as RateLimitConfig,
}

/**
 * Payment endpoint rate limits
 *
 * Protect payment endpoints from abuse
 */
export const paymentRateLimits = {
  /**
   * Payment initiation rate limit
   * Default: 5 attempts per hour
   */
  initiate: {
    windowMs: parseInt(process.env.PAYMENT_RATE_LIMIT_WINDOW_MS || String(hours(1))),
    max: parseInt(process.env.PAYMENT_RATE_LIMIT_MAX || '5'),
    keyPrefix: 'rl:payment:initiate',
    message: 'Too many payment attempts. Please try again later.',
  } as RateLimitConfig,
}

/**
 * Admin endpoint rate limits
 *
 * More lenient for admin operations but still protected
 */
export const adminRateLimits = {
  /**
   * General admin operations
   * Default: 200 requests per 15 minutes
   */
  general: {
    windowMs: parseInt(process.env.ADMIN_RATE_LIMIT_WINDOW_MS || String(minutes(15))),
    max: parseInt(process.env.ADMIN_RATE_LIMIT_MAX || '200'),
    keyPrefix: 'rl:admin:general',
    message: 'Too many admin requests. Please try again later.',
  } as RateLimitConfig,
}

/**
 * Export all rate limit configurations
 */
export const rateLimitConfig = {
  auth: authRateLimits,
  api: apiRateLimits,
  payment: paymentRateLimits,
  admin: adminRateLimits,
}

/**
 * Get a summary of all rate limit configurations
 * Useful for health checks and debugging
 */
export function getRateLimitSummary() {
  return {
    auth: {
      login: {
        windowMinutes: authRateLimits.login.windowMs / 60000,
        maxAttempts: authRateLimits.login.max,
      },
      register: {
        windowMinutes: authRateLimits.register.windowMs / 60000,
        maxAttempts: authRateLimits.register.max,
      },
    },
    api: {
      general: {
        windowMinutes: apiRateLimits.general.windowMs / 60000,
        maxAttempts: apiRateLimits.general.max,
      },
    },
  }
}
