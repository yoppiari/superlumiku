/**
 * CORS Middleware
 *
 * Production-grade CORS configuration with:
 * - Multiple origin support
 * - Wildcard subdomain support
 * - Credentials handling
 * - Preflight caching
 * - Security headers
 */

import { cors } from 'hono/cors'
import { env } from '../config/env'
import { logger } from '../lib/logger'

/**
 * Parse allowed origins from environment
 * Supports comma-separated list of origins
 *
 * Examples:
 * - Single: https://app.lumiku.com
 * - Multiple: https://app.lumiku.com,https://admin.lumiku.com
 * - Wildcard subdomain: https://*.lumiku.com
 */
function getAllowedOrigins(): string[] {
  const origins = env.CORS_ORIGIN.split(',').map(o => o.trim()).filter(Boolean)

  if (origins.length === 0) {
    logger.warn('No CORS origins configured, using default')
    return ['http://localhost:5173']
  }

  return origins
}

const allowedOrigins = getAllowedOrigins()

logger.info('CORS configured', {
  origins: allowedOrigins,
  credentials: true
})

/**
 * CORS origin validator
 * Supports exact match and wildcard subdomains
 */
function isOriginAllowed(origin: string): boolean {
  // Check for exact match
  if (allowedOrigins.includes(origin)) {
    return true
  }

  // Check for wildcard subdomain match (e.g., https://*.lumiku.com)
  for (const allowedOrigin of allowedOrigins) {
    if (allowedOrigin.includes('*')) {
      // Convert wildcard pattern to regex
      // https://*.lumiku.com -> ^https://[^/]+\.lumiku\.com$
      const pattern = allowedOrigin
        .replace(/[.]/g, '\\.')
        .replace(/\*/g, '[^/]+')

      const regex = new RegExp(`^${pattern}$`)

      if (regex.test(origin)) {
        return true
      }
    }
  }

  return false
}

export const corsMiddleware = cors({
  // Dynamic origin validation
  origin: (origin) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return null
    }

    // Check if origin is allowed
    if (isOriginAllowed(origin)) {
      return origin
    }

    // In development, log rejected origins for debugging
    if (env.NODE_ENV === 'development') {
      logger.warn('CORS origin rejected', {
        origin,
        allowedOrigins
      })
    }

    // Reject origin
    return null
  },

  // Allow credentials (cookies, authorization headers)
  credentials: true,

  // Allow common headers
  allowHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],

  // Expose headers that frontend can read
  exposeHeaders: [
    'Content-Length',
    'X-Request-Id',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],

  // Cache preflight requests for 24 hours
  maxAge: 86400,

  // Allow all methods
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
})