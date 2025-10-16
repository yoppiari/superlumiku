/**
 * P1-6 FIX: Request Logger Middleware
 *
 * Logs all incoming requests with timing, status codes, and user context
 *
 * Features:
 * - Request/response logging with duration
 * - User ID tracking (if authenticated)
 * - Performance metrics via response headers
 * - Structured logging format
 */

import { Context, Next } from 'hono'

export async function requestLogger(c: Context, next: Next): Promise<void> {
  const start = Date.now()
  const method = c.req.method
  const path = c.req.path
  const userId = c.get('userId') || 'anonymous'
  const correlationId = c.req.header('X-Correlation-ID') || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Add correlation ID to context for request tracking
  c.set('correlationId', correlationId)

  // Log incoming request
  console.log(`[${new Date().toISOString()}] --> ${method} ${path} - User: ${userId} - Correlation: ${correlationId}`)

  // Execute request
  await next()

  // Calculate duration
  const duration = Date.now() - start
  const status = c.res.status

  // Log response with status and duration
  const logLevel = status >= 500 ? 'ERROR' : status >= 400 ? 'WARN' : 'INFO'
  console.log(
    `[${new Date().toISOString()}] <-- ${method} ${path} - ` +
    `Status: ${status} - Duration: ${duration}ms - User: ${userId} - Level: ${logLevel}`
  )

  // Add performance headers
  c.header('X-Response-Time', `${duration}ms`)
  c.header('X-Correlation-ID', correlationId)

  // Log slow requests (> 3 seconds)
  if (duration > 3000) {
    console.warn(
      `[SLOW REQUEST] ${method} ${path} took ${duration}ms - User: ${userId} - Status: ${status}`
    )
  }

  // Log errors with additional context
  if (status >= 500) {
    console.error(
      `[SERVER ERROR] ${method} ${path} - Status: ${status} - Duration: ${duration}ms - User: ${userId}`
    )
  }
}
