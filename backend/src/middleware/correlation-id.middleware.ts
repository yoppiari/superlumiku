/**
 * P2 PERFORMANCE: Request Correlation ID Middleware
 *
 * Adds unique correlation IDs to every request for distributed tracing.
 *
 * Benefits:
 * - Track requests across services and logs
 * - Debug issues by following correlation ID through system
 * - Correlate frontend and backend logs
 * - Essential for microservices architecture
 *
 * Usage:
 * - Automatically adds x-correlation-id header to all responses
 * - Accepts x-correlation-id from client for end-to-end tracing
 * - Stores correlation ID in context for logging
 *
 * Integration with logging:
 * ```typescript
 * const correlationId = c.get('correlationId')
 * logger.info({ correlationId }, 'Processing request')
 * ```
 */

import { Context, Next } from 'hono'
import { randomUUID } from 'crypto'

/**
 * Correlation ID Middleware
 *
 * Adds correlation ID to every request for distributed tracing.
 * Uses existing correlation ID from header if present (for end-to-end tracing).
 */
export const correlationIdMiddleware = async (c: Context, next: Next) => {
  // Get correlation ID from header or generate new one
  const correlationId =
    c.req.header('x-correlation-id') ||
    c.req.header('x-request-id') ||
    randomUUID()

  // Store in context for use in handlers
  c.set('correlationId', correlationId)

  // Add to response headers
  c.res.headers.set('x-correlation-id', correlationId)

  // Log request with correlation ID
  const startTime = Date.now()
  const method = c.req.method
  const path = c.req.path

  console.log(`[Request] ${method} ${path} | CorrelationID: ${correlationId}`)

  try {
    await next()

    // Log response
    const duration = Date.now() - startTime
    const status = c.res.status

    console.log(
      `[Response] ${method} ${path} | ${status} | ${duration}ms | CorrelationID: ${correlationId}`
    )
  } catch (error) {
    // Log error with correlation ID
    const duration = Date.now() - startTime
    console.error(
      `[Error] ${method} ${path} | ${duration}ms | CorrelationID: ${correlationId}`,
      error
    )
    throw error
  }
}

/**
 * Enhanced Logger with Correlation ID
 *
 * Wrapper around console logging that automatically includes correlation ID.
 *
 * Usage:
 * ```typescript
 * const logger = createLogger(c)
 * logger.info('User logged in', { userId: '123' })
 * logger.error('Failed to process payment', { orderId: '456', error })
 * ```
 */
export interface Logger {
  info: (message: string, data?: Record<string, any>) => void
  warn: (message: string, data?: Record<string, any>) => void
  error: (message: string, data?: Record<string, any>) => void
  debug: (message: string, data?: Record<string, any>) => void
}

export function createLogger(c: Context): Logger {
  const correlationId = c.get('correlationId') || 'unknown'

  const formatLog = (level: string, message: string, data?: Record<string, any>) => {
    const timestamp = new Date().toISOString()
    const logData = data ? JSON.stringify(data) : ''
    return `[${timestamp}] [${level}] [${correlationId}] ${message}${logData ? ` | ${logData}` : ''}`
  }

  return {
    info: (message: string, data?: Record<string, any>) => {
      console.log(formatLog('INFO', message, data))
    },
    warn: (message: string, data?: Record<string, any>) => {
      console.warn(formatLog('WARN', message, data))
    },
    error: (message: string, data?: Record<string, any>) => {
      console.error(formatLog('ERROR', message, data))
    },
    debug: (message: string, data?: Record<string, any>) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug(formatLog('DEBUG', message, data))
      }
    },
  }
}

/**
 * Get correlation ID from context
 */
export function getCorrelationId(c: Context): string {
  return c.get('correlationId') || 'unknown'
}

/**
 * Extend Hono Context with correlation ID type
 */
declare module 'hono' {
  interface ContextVariableMap {
    correlationId: string
  }
}
