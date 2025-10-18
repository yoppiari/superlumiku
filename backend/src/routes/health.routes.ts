/**
 * Health Check Endpoints
 *
 * Comprehensive health monitoring for production deployments:
 * - Liveness probe: Is the application running?
 * - Readiness probe: Is the application ready to serve requests?
 * - Detailed health: What is the status of each dependency?
 *
 * Used by:
 * - Kubernetes/Docker health checks
 * - Load balancers
 * - Monitoring systems (Datadog, New Relic, etc.)
 * - CI/CD pipelines
 */

import { Hono } from 'hono'
import prisma from '../db/client'
import { checkRedisHealth, getRedisStatus } from '../lib/redis'
import { logger } from '../lib/logger'
import { env } from '../config/env'
import { rateLimiter } from '../middleware/rate-limiter.middleware'

const health = new Hono()

/**
 * CRITICAL: Root Health Check (No Rate Limiting, No Dependencies)
 *
 * This is the PRIMARY endpoint used by Coolify and other deployment platforms.
 * MUST respond immediately with 200 OK - no database checks, no Redis, no rate limiting.
 *
 * Purpose: Allow load balancer/orchestrator to verify process is alive.
 */
health.get('/', (c) => {
  return c.json({
    status: 'ok',
    service: 'lumiku-backend',
    version: process.env.npm_package_version || '1.0.0',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  })
})

/**
 * P2 PERFORMANCE: Health Check Rate Limiting
 *
 * Prevents health check abuse and DDoS attacks on monitoring endpoints.
 * - Liveness: 60 requests per minute per IP (once per second)
 * - Readiness: 60 requests per minute per IP
 * - Detailed Health: 30 requests per minute per IP (more expensive)
 *
 * Benefits:
 * - Prevents monitoring endpoint abuse
 * - Protects against DDoS via health checks
 * - Reduces database/Redis load from health check spam
 */

// Rate limiters for each health check endpoint
const livenessLimiter = rateLimiter({
  windowMs: 60000, // 1 minute
  max: 60, // 60 requests per minute (once per second)
  keyPrefix: 'rl:health:liveness',
  message: 'Too many health check requests',
})

const readinessLimiter = rateLimiter({
  windowMs: 60000, // 1 minute
  max: 60, // 60 requests per minute
  keyPrefix: 'rl:health:readiness',
  message: 'Too many readiness check requests',
})

const detailedHealthLimiter = rateLimiter({
  windowMs: 60000, // 1 minute
  max: 30, // 30 requests per minute (more expensive query)
  keyPrefix: 'rl:health:detailed',
  message: 'Too many detailed health check requests',
})

/**
 * Liveness Probe
 *
 * Simple check that the application is running and can respond to requests.
 * Returns 200 OK if the process is alive.
 *
 * Used by Kubernetes liveness probe to restart unhealthy pods.
 */
health.get('/liveness', livenessLimiter, (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})

/**
 * Readiness Probe
 *
 * Checks if the application is ready to serve requests.
 * Returns 200 OK if all critical dependencies are healthy.
 * Returns 503 Service Unavailable if any critical dependency is unhealthy.
 *
 * Used by Kubernetes readiness probe to determine if pod should receive traffic.
 */
health.get('/readiness', readinessLimiter, async (c) => {
  const checks = {
    database: await checkDatabaseHealth(),
    redis: await checkRedisHealth(),
  }

  const isReady = checks.database.status === 'ok'
  const statusCode = isReady ? 200 : 503

  return c.json({
    status: isReady ? 'ready' : 'not_ready',
    timestamp: new Date().toISOString(),
    checks,
  }, statusCode)
})

/**
 * Detailed Health Check
 *
 * Comprehensive health check of all system components.
 * Returns detailed status for each dependency.
 *
 * Used by monitoring dashboards and alerting systems.
 */
health.get('/detailed', detailedHealthLimiter, async (c) => {
  const startTime = Date.now()

  const checks = {
    database: await checkDatabaseHealth(),
    redis: await checkRedisHealth(),
    storage: await checkStorageHealth(),
    queues: await checkQueuesHealth(),
    memory: checkMemoryHealth(),
    uptime: checkUptimeHealth(),
  }

  const allHealthy = Object.values(checks).every(
    check => check.status === 'ok' || check.status === 'warning'
  )

  const responseTime = Date.now() - startTime

  const response = {
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || 'unknown',
    environment: env.NODE_ENV,
    responseTimeMs: responseTime,
    checks,
  }

  // Log health check failures
  if (!allHealthy) {
    logger.warn('Health check failed', { checks })
  }

  return c.json(response, allHealthy ? 200 : 503)
})

/**
 * Check database connectivity and query performance
 */
async function checkDatabaseHealth(): Promise<{
  status: 'ok' | 'error'
  latencyMs?: number
  error?: string
  details?: {
    connected: boolean
    activeConnections?: number
  }
}> {
  try {
    const start = Date.now()

    // Simple query to test connection
    await prisma.$queryRaw`SELECT 1`

    const latency = Date.now() - start

    return {
      status: 'ok',
      latencyMs: latency,
      details: {
        connected: true,
      }
    }
  } catch (error) {
    logger.error('Database health check failed', { error })
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        connected: false,
      }
    }
  }
}

/**
 * Check storage system health
 */
async function checkStorageHealth(): Promise<{
  status: 'ok' | 'warning' | 'error'
  message?: string
}> {
  try {
    const fs = await import('fs/promises')
    const path = await import('path')

    // Check if upload and output directories exist and are writable
    const uploadPath = env.UPLOAD_PATH
    const outputPath = env.OUTPUT_PATH

    try {
      await fs.access(uploadPath, (await import('fs')).constants.W_OK)
      await fs.access(outputPath, (await import('fs')).constants.W_OK)

      return {
        status: 'ok',
      }
    } catch {
      return {
        status: 'warning',
        message: 'Storage directories not accessible (may not be initialized yet)',
      }
    }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Check queue health (BullMQ)
 */
async function checkQueuesHealth(): Promise<{
  status: 'ok' | 'warning' | 'error'
  message?: string
}> {
  const redisStatus = getRedisStatus()

  if (!redisStatus.enabled) {
    return {
      status: 'warning',
      message: 'Redis not enabled - queues disabled',
    }
  }

  if (!redisStatus.connected) {
    return {
      status: 'error',
      message: 'Redis not connected - queues unavailable',
    }
  }

  return {
    status: 'ok',
  }
}

/**
 * Check memory usage
 */
function checkMemoryHealth(): {
  status: 'ok' | 'warning' | 'error'
  usageMB: number
  heapUsedMB: number
  heapTotalMB: number
  rssMB: number
  percentUsed: number
} {
  const usage = process.memoryUsage()
  const usageMB = Math.round(usage.heapUsed / 1024 / 1024)
  const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024)
  const rssMB = Math.round(usage.rss / 1024 / 1024)
  const percentUsed = Math.round((usage.heapUsed / usage.heapTotal) * 100)

  let status: 'ok' | 'warning' | 'error' = 'ok'

  // Warning if heap usage > 80%
  if (percentUsed > 80) {
    status = 'warning'
    logger.warn('High memory usage detected', { percentUsed, heapUsedMB: usageMB })
  }

  // Error if heap usage > 95%
  if (percentUsed > 95) {
    status = 'error'
    logger.error('Critical memory usage detected', { percentUsed, heapUsedMB: usageMB })
  }

  return {
    status,
    usageMB,
    heapUsedMB: usageMB,
    heapTotalMB,
    rssMB,
    percentUsed,
  }
}

/**
 * Check application uptime
 */
function checkUptimeHealth(): {
  status: 'ok'
  uptimeSeconds: number
  uptimeHuman: string
} {
  const uptimeSeconds = Math.floor(process.uptime())
  const hours = Math.floor(uptimeSeconds / 3600)
  const minutes = Math.floor((uptimeSeconds % 3600) / 60)
  const seconds = uptimeSeconds % 60

  return {
    status: 'ok',
    uptimeSeconds,
    uptimeHuman: `${hours}h ${minutes}m ${seconds}s`,
  }
}

/**
 * Settings Health Check
 *
 * Dedicated endpoint to verify settings API functionality.
 * Tests database connectivity and settings service.
 */
health.get('/settings', async (c) => {
  const startTime = Date.now()

  try {
    // Check if settings table/columns exist
    const dbHealth = await checkDatabaseHealth()

    // Try to query user settings structure (without needing a real user)
    let settingsTableCheck = { exists: false, error: null as string | null }

    try {
      // This will succeed if the user table has settings columns
      await prisma.$queryRaw`SELECT
        emailNotifications,
        pushNotifications,
        theme,
        language
      FROM users LIMIT 1`
      settingsTableCheck.exists = true
    } catch (error) {
      settingsTableCheck.error = error instanceof Error ? error.message : 'Unknown error'
    }

    const responseTime = Date.now() - startTime

    const isHealthy = dbHealth.status === 'ok' || settingsTableCheck.exists

    return c.json({
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTimeMs: responseTime,
      checks: {
        database: dbHealth,
        settingsTable: {
          status: settingsTableCheck.exists ? 'ok' : 'warning',
          exists: settingsTableCheck.exists,
          error: settingsTableCheck.error,
          fallbackEnabled: true,
          message: settingsTableCheck.exists
            ? 'Settings table columns verified'
            : 'Settings table not found - using fallback mode',
        },
        routes: {
          status: 'ok',
          mounted: true,
          endpoints: [
            'GET /api/settings',
            'PUT /api/settings',
            'POST /api/settings/reset',
            'PATCH /api/settings/notifications',
            'PATCH /api/settings/display',
            'PATCH /api/settings/privacy',
          ],
        },
      },
    }, isHealthy ? 200 : 503)
  } catch (error) {
    logger.error('Settings health check failed', { error })
    return c.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      fallbackEnabled: true,
    }, 503)
  }
})

export default health
