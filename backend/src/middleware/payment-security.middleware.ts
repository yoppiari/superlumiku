/**
 * Payment Security Middleware
 *
 * Multi-layer security for payment callbacks:
 * 1. IP Whitelist - Only accept callbacks from Duitku servers
 * 2. Rate Limiting - Prevent DDoS on callback endpoint
 * 3. Request validation - Ensure all required fields present
 */

import { Context, Next } from 'hono'
import { securityLogger, getClientIP } from '../lib/security-logger'
import { InvalidIPError } from '../errors/PaymentError'

/**
 * Duitku IP Whitelist
 *
 * Source: https://docs.duitku.com/api/en/
 * Last updated: 2025
 */
const DUITKU_PRODUCTION_IPS = [
  '182.23.85.8',
  '182.23.85.9',
  '182.23.85.10',
  '182.23.85.13',
  '182.23.85.14',
  '103.177.101.184',
  '103.177.101.185',
  '103.177.101.186',
  '103.177.101.189',
  '103.177.101.190',
]

const DUITKU_SANDBOX_IPS = [
  '182.23.85.11',
  '182.23.85.12',
  '103.177.101.187',
  '103.177.101.188',
]

/**
 * Get allowed IPs based on environment
 */
function getAllowedIPs(): string[] {
  const env = process.env.DUITKU_ENV || 'sandbox'

  if (env === 'production') {
    return DUITKU_PRODUCTION_IPS
  } else {
    return DUITKU_SANDBOX_IPS
  }
}

/**
 * Payment IP Whitelist Middleware
 *
 * Verifies that the callback request originates from a Duitku server.
 * This is the first line of defense against forged callbacks.
 *
 * SECURITY NOTE:
 * - In development/testing, IP whitelist can be disabled via env var
 * - In production, this MUST be enabled for PCI compliance
 * - Always verify signature even if IP whitelist passes
 */
export const paymentIPWhitelist = async (c: Context, next: Next) => {
  // Check if IP whitelist is enabled
  const ipWhitelistEnabled = process.env.PAYMENT_IP_WHITELIST_ENABLED !== 'false'

  if (!ipWhitelistEnabled) {
    console.warn(
      '[SECURITY WARNING] Payment IP whitelist is DISABLED. Enable in production!'
    )
    await next()
    return
  }

  // Extract client IP
  const clientIP = getClientIP(c.req.raw)

  if (!clientIP) {
    console.error('[SECURITY] Unable to determine client IP')
    securityLogger.logPaymentFailure({
      reason: 'Unable to determine client IP',
      metadata: { headers: Object.fromEntries(c.req.raw.headers.entries()) },
    })
    return c.json({ error: 'Unable to verify request source' }, 403)
  }

  // Check if IP is whitelisted
  const allowedIPs = getAllowedIPs()

  if (!allowedIPs.includes(clientIP)) {
    // Log security event
    securityLogger.logUnauthorizedIP({
      ip: clientIP,
    })

    // Return generic error (don't reveal IP whitelist details)
    return c.json({ error: 'Unauthorized request source' }, 403)
  }

  // IP is whitelisted, proceed
  await next()
}

/**
 * Payment Request Validator Middleware
 *
 * Validates that all required callback fields are present.
 * This prevents errors during signature verification.
 */
export const validatePaymentCallback = async (c: Context, next: Next) => {
  try {
    const body = await c.req.json()

    // Required fields from Duitku callback
    const requiredFields = [
      'merchantOrderId',
      'amount',
      'merchantCode',
      'signature',
      'resultCode',
    ]

    const missingFields = requiredFields.filter((field) => !(field in body))

    if (missingFields.length > 0) {
      console.error('[PAYMENT] Missing required callback fields:', missingFields)
      securityLogger.logPaymentFailure({
        reason: 'Missing required fields',
        metadata: { missingFields, receivedFields: Object.keys(body) },
        ip: getClientIP(c.req.raw),
      })

      return c.json(
        {
          error: 'Invalid callback data',
        },
        400
      )
    }

    // Validate data types
    if (typeof body.amount !== 'number' && isNaN(Number(body.amount))) {
      console.error('[PAYMENT] Invalid amount format:', body.amount)
      securityLogger.logPaymentFailure({
        reason: 'Invalid amount format',
        metadata: { amount: body.amount },
        ip: getClientIP(c.req.raw),
      })

      return c.json(
        {
          error: 'Invalid callback data',
        },
        400
      )
    }

    // Store validated body in context for downstream handlers
    c.set('validatedCallbackData', body)

    await next()
  } catch (error) {
    console.error('[PAYMENT] Error parsing callback data:', error)
    securityLogger.logPaymentFailure({
      reason: 'Invalid JSON payload',
      ip: getClientIP(c.req.raw),
    })

    return c.json(
      {
        error: 'Invalid request format',
      },
      400
    )
  }
}

/**
 * Rate Limiter Configuration for Payment Callbacks
 *
 * Prevents DDoS attacks on payment callback endpoint.
 * Limits are generous to accommodate legitimate retries but prevent abuse.
 *
 * Configuration:
 * - Window: 15 minutes
 * - Max requests: 100 per IP
 * - This allows Duitku's retry mechanism (max 5 attempts) plus margin
 */
export const paymentCallbackRateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Max 100 requests per window per IP
  standardHeaders: 'draft-7',
  keyGenerator: (c: Context) => {
    return getClientIP(c.req.raw) || 'unknown'
  },
  handler: (c: Context) => {
    const clientIP = getClientIP(c.req.raw)
    console.error(`[SECURITY] Rate limit exceeded for IP: ${clientIP}`)
    securityLogger.log({
      event: 'RATE_LIMIT_EXCEEDED' as any,
      severity: 'HIGH' as any,
      message: 'Payment callback rate limit exceeded',
      ip: clientIP,
    })
    return c.json({ error: 'Too many requests' }, 429)
  },
}

/**
 * Combined Payment Security Middleware
 *
 * Applies all security layers in sequence:
 * 1. IP whitelist
 * 2. Request validation
 * 3. Rate limiting (configured separately in route)
 *
 * Usage in routes:
 * ```typescript
 * paymentRoutes.post('/callback',
 *   rateLimiter(paymentCallbackRateLimitConfig),
 *   paymentSecurityMiddleware,
 *   async (c) => { ... }
 * )
 * ```
 */
export const paymentSecurityMiddleware = [
  paymentIPWhitelist,
  validatePaymentCallback,
]

/**
 * Development/Testing Helper
 *
 * For local development and testing, you may need to disable IP whitelist.
 * Add this to your .env:
 *
 * PAYMENT_IP_WHITELIST_ENABLED=false
 *
 * WARNING: NEVER disable this in production!
 */
export function isPaymentSecurityEnabled(): boolean {
  return process.env.PAYMENT_IP_WHITELIST_ENABLED !== 'false'
}

/**
 * Get current security configuration (for monitoring)
 */
export function getPaymentSecurityConfig() {
  const env = process.env.DUITKU_ENV || 'sandbox'
  const ipWhitelistEnabled = isPaymentSecurityEnabled()
  const allowedIPs = getAllowedIPs()

  return {
    environment: env,
    ipWhitelistEnabled,
    allowedIPCount: allowedIPs.length,
    allowedIPs: ipWhitelistEnabled ? allowedIPs : ['DISABLED'],
  }
}
