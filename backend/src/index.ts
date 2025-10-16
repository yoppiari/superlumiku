/**
 * Lumiku Backend - Main Entry Point
 *
 * Production-grade server initialization with:
 * - Structured logging
 * - Graceful shutdown
 * - Health monitoring
 * - Error handling
 * - Resource cleanup
 */

import app from './app'
import prisma from './db/client'
import { initStorage } from './lib/storage'
import { initializeScheduler } from './jobs/scheduler'
import { redis, isRedisEnabled, disconnectRedis } from './lib/redis'
import { logger } from './lib/logger'
import { createServer } from 'http'

// Import environment config (validation happens on import)
import { env } from './config/env'

// CRITICAL FIX: Re-enabled after implementing lazyConnect in queue.config.ts
import { setupPoseWebSocket, shutdownWebSocket } from './apps/pose-generator/websocket/pose-websocket'
import { initializeRedisConnection } from './apps/pose-generator/queue/queue.config'

// Log successful environment validation
logger.info('Environment variables validated successfully', {
  nodeEnv: env.NODE_ENV,
  port: env.PORT
})

// Import workers only if Redis is enabled
if (process.env.REDIS_ENABLED !== 'false') {
  import('./workers/video-mixer.worker')
  import('./workers/carousel-mix.worker')
  import('./workers/looping-flow.worker')
  logger.info('Workers initialized', { redisEnabled: true })
} else {
  logger.warn('Workers DISABLED', { redisEnabled: false })
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<void> {
  const isProduction = env.NODE_ENV === 'production'

  try {
    await prisma.$connect()
    logger.info('Database connected successfully')
  } catch (error) {
    logger.error('Database connection failed', { error })

    if (isProduction) {
      logger.error('FATAL: Database is required for production deployment')
      process.exit(1)
    } else {
      logger.warn('Running without database connection', {
        notice: 'Application will start but features requiring DB will fail',
        solution: 'Start local PostgreSQL or fix DATABASE_URL in .env'
      })
    }
  }
}

/**
 * Check Redis connectivity and enforce production requirements
 * SECURITY: Rate limiting requires Redis in production to work correctly across multiple instances
 */
async function checkRedis(): Promise<void> {
  const isProduction = env.NODE_ENV === 'production'

  if (!isRedisEnabled()) {
    if (isProduction) {
      logger.error('FATAL: Redis is required for production deployment', {
        reason: 'Rate limiting will NOT work correctly across multiple instances',
        action: 'Set REDIS_HOST and REDIS_PASSWORD in environment variables'
      })
      process.exit(1)
    } else {
      logger.warn('Running without Redis', {
        rateLimiting: 'in-memory store',
        notice: 'NOT suitable for production or multi-instance deployments'
      })
    }
    return
  }

  // Test Redis connection
  try {
    await redis?.ping()
    logger.info('Redis connected successfully', {
      host: process.env.REDIS_HOST,
      rateLimiting: 'Distributed (Redis-backed)'
    })
  } catch (error) {
    if (isProduction) {
      logger.error('FATAL: Redis connection failed in production', {
        error,
        impact: 'Rate limiting will NOT function properly'
      })
      process.exit(1)
    } else {
      logger.warn('Redis connection failed', {
        error,
        fallback: 'in-memory rate limiting'
      })
    }
  }
}

/**
 * Start server with all initialization
 */
async function start() {
  logger.info('Starting Lumiku backend server...')

  await checkDatabase()
  await checkRedis()
  await initStorage()

  // CRITICAL FIX: Re-enabled Pose Generator storage and Redis initialization
  try {
    // Initialize Redis connection for Pose Generator queue
    if (isRedisEnabled()) {
      await initializeRedisConnection()
      logger.info('Pose Generator queue initialized')
    } else {
      logger.warn('Pose Generator queue disabled', { reason: 'Redis not configured' })
    }

    // Initialize Pose Generator storage
    const { poseStorageService } = await import('./apps/pose-generator/services/storage.service')
    await poseStorageService.initializeLocalStorage()
    logger.info('Pose Generator storage initialized')
  } catch (error) {
    logger.error('Failed to initialize Pose Generator', { error })
    if (env.NODE_ENV === 'production') {
      logger.error('FATAL: Pose Generator initialization failed in production')
      process.exit(1)
    }
  }

  // Initialize cron jobs for subscription & quota management
  initializeScheduler()
  logger.info('Scheduler initialized')

  // Create HTTP server for both Hono and Socket.IO
  const httpServer = createServer(async (req, res) => {
    const response = await app.fetch(
      new Request(`http://${req.headers.host}${req.url}`, {
        method: req.method,
        headers: req.headers as Record<string, string>,
        body: req.method !== 'GET' && req.method !== 'HEAD' ? req : undefined,
      })
    )

    res.statusCode = response.status
    response.headers.forEach((value, key) => {
      res.setHeader(key, value)
    })

    if (response.body) {
      const reader = response.body.getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        res.write(value)
      }
    }
    res.end()
  })

  // CRITICAL FIX: Re-enabled WebSocket for Pose Generator
  if (isRedisEnabled()) {
    const io = setupPoseWebSocket(httpServer)
    logger.info('WebSocket server initialized for Pose Generator')
  } else {
    logger.warn('Pose Generator WebSocket disabled', { reason: 'Redis not configured' })
  }

  // Start HTTP server
  httpServer.listen(env.PORT, () => {
    logger.info('Server started successfully', {
      port: env.PORT,
      environment: env.NODE_ENV,
      corsOrigin: env.CORS_ORIGIN,
      websocket: isRedisEnabled() ? `ws://localhost:${env.PORT}/pose-generator` : 'disabled'
    })
  })

  return httpServer
}

// Store server instance for graceful shutdown
let serverInstance: ReturnType<typeof createServer> | null = null
let isShuttingDown = false

start().then((server) => {
  serverInstance = server
}).catch((error) => {
  logger.error('Failed to start server', { error })
  process.exit(1)
})

/**
 * Graceful Shutdown Handler
 *
 * Production-grade shutdown sequence:
 * 1. Stop accepting new requests
 * 2. Close WebSocket connections
 * 3. Drain queue workers (wait for current jobs)
 * 4. Close database connections
 * 5. Disconnect from Redis
 * 6. Exit process
 */
async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    logger.warn('Shutdown already in progress, forcing exit...')
    process.exit(1)
  }

  isShuttingDown = true
  logger.info('Graceful shutdown initiated', { signal })

  const shutdownTimeout = setTimeout(() => {
    logger.error('Graceful shutdown timeout exceeded, forcing exit')
    process.exit(1)
  }, 30000) // 30 second timeout

  try {
    // 1. Close WebSocket connections
    if (isRedisEnabled()) {
      logger.info('Closing WebSocket connections...')
      await shutdownWebSocket()
      logger.info('WebSocket connections closed')
    }

    // 2. Stop accepting new HTTP requests
    if (serverInstance) {
      logger.info('Closing HTTP server...')
      await new Promise<void>((resolve) => {
        serverInstance?.close(() => {
          logger.info('HTTP server closed')
          resolve()
        })
      })
    }

    // 3. Drain queue workers (workers will complete current jobs)
    // Workers have their own shutdown handlers, so we just give them time
    if (isRedisEnabled()) {
      logger.info('Waiting for queue workers to complete...')
      await new Promise(resolve => setTimeout(resolve, 2000)) // 2 second grace period
      logger.info('Queue workers shutdown complete')
    }

    // 4. Disconnect from database
    logger.info('Closing database connection...')
    await prisma.$disconnect()
    logger.info('Database connection closed')

    // 5. Disconnect from Redis
    if (isRedisEnabled()) {
      logger.info('Closing Redis connection...')
      await disconnectRedis()
      logger.info('Redis connection closed')
    }

    clearTimeout(shutdownTimeout)
    logger.info('Graceful shutdown complete')
    process.exit(0)
  } catch (error) {
    logger.error('Error during graceful shutdown', { error })
    clearTimeout(shutdownTimeout)
    process.exit(1)
  }
}

// Signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Unhandled rejection handler
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  logger.error('Unhandled Promise Rejection', {
    reason,
    promise: promise.toString()
  })
  // In production, we should exit to allow process manager to restart
  if (env.NODE_ENV === 'production') {
    gracefulShutdown('unhandledRejection')
  }
})

// Uncaught exception handler
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  })
  // In production, we should exit to allow process manager to restart
  if (env.NODE_ENV === 'production') {
    gracefulShutdown('uncaughtException')
  }
})
