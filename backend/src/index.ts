import app from './app'
import prisma from './db/client'
import { initStorage } from './lib/storage'
import { initializeScheduler } from './jobs/scheduler'
import { redis, isRedisEnabled } from './lib/redis'
import { createServer } from 'http'
import { setupPoseWebSocket, shutdownWebSocket } from './apps/pose-generator/websocket/pose-websocket'

// Import workers
import './workers/video-mixer.worker'
import './workers/carousel-mix.worker'
import './workers/looping-flow.worker'

/**
 * Import environment config (validation happens on import)
 *
 * SECURITY: Environment variables are validated using Zod on import.
 * If any required variables are missing or invalid, the application
 * will fail immediately with clear error messages.
 *
 * This prevents the application from starting with invalid configuration,
 * eliminating runtime errors caused by missing or misconfigured environment variables.
 */
import { env } from './config/env'

// Log successful environment validation
console.log('✅ Environment variables validated successfully')

// Test database connection
async function checkDatabase() {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    process.exit(1)
  }
}

/**
 * Check Redis connectivity and enforce production requirements
 * SECURITY: Rate limiting requires Redis in production to work correctly across multiple instances
 */
async function checkRedis() {
  const isProduction = env.NODE_ENV === 'production'

  if (!isRedisEnabled()) {
    if (isProduction) {
      console.error('❌ FATAL: Redis is required for production deployment!')
      console.error('❌ Rate limiting will NOT work correctly across multiple instances')
      console.error('❌ Set REDIS_HOST and REDIS_PASSWORD in environment variables')
      console.error('❌ Exiting to prevent security vulnerabilities...')
      process.exit(1)
    } else {
      console.warn('⚠️  WARNING: Running without Redis')
      console.warn('⚠️  Rate limiting uses in-memory store')
      console.warn('⚠️  NOT suitable for production or multi-instance deployments')
    }
    return
  }

  // Test Redis connection
  try {
    await redis?.ping()
    console.log('✅ Redis connected successfully')

    // Log Redis configuration (without exposing credentials)
    console.log(`📦 Redis host: ${process.env.REDIS_HOST}`)
    console.log(`🔒 Rate limiting: Distributed (Redis-backed)`)
  } catch (error: any) {
    if (isProduction) {
      console.error('❌ FATAL: Redis connection failed in production!', error.message)
      console.error('❌ Rate limiting will NOT function properly')
      process.exit(1)
    } else {
      console.warn('⚠️  WARNING: Redis connection failed:', error.message)
      console.warn('⚠️  Falling back to in-memory rate limiting')
    }
  }
}

// Start server
async function start() {
  await checkDatabase()
  await checkRedis()
  await initStorage()

  // Initialize pose storage (Phase 4A)
  try {
    const { poseStorageService } = await import('./apps/pose-generator/services/storage.service')
    await poseStorageService.initializeLocalStorage()
  } catch (error) {
    console.error('Failed to initialize pose storage:', error)
  }

  // Initialize cron jobs for subscription & quota management
  initializeScheduler()

  // Create HTTP server for both Hono and Socket.IO
  // We need to create a Node HTTP server that can handle both
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

  // Setup WebSocket server for Pose Generator
  const io = setupPoseWebSocket(httpServer)
  console.log('✅ WebSocket server initialized for Pose Generator')

  // Start HTTP server
  httpServer.listen(env.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${env.PORT}`)
    console.log(`📝 Environment: ${env.NODE_ENV}`)
    console.log(`🔗 CORS Origin: ${env.CORS_ORIGIN}`)
    console.log(`🔌 WebSocket available at ws://localhost:${env.PORT}/pose-generator`)
  })

  return httpServer
}

// Store server instance for graceful shutdown
let serverInstance: ReturnType<typeof createServer> | null = null

start().then((server) => {
  serverInstance = server
})

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down gracefully...')

  // Shutdown WebSocket connections
  await shutdownWebSocket()

  // Close HTTP server
  if (serverInstance) {
    serverInstance.close(() => {
      console.log('✅ HTTP server closed')
    })
  }

  // Disconnect from database
  await prisma.$disconnect()

  console.log('✅ Graceful shutdown complete')
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n👋 Shutting down gracefully...')

  // Shutdown WebSocket connections
  await shutdownWebSocket()

  // Close HTTP server
  if (serverInstance) {
    serverInstance.close(() => {
      console.log('✅ HTTP server closed')
    })
  }

  // Disconnect from database
  await prisma.$disconnect()

  console.log('✅ Graceful shutdown complete')
  process.exit(0)
})
