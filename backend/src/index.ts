import app from './app'
import prisma from './db/client'
import { initStorage } from './lib/storage'
import { initializeScheduler } from './jobs/scheduler'
import { redis, isRedisEnabled } from './lib/redis'

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

  // Initialize cron jobs for subscription & quota management
  initializeScheduler()

  // Use Bun's built-in server
  Bun.serve({
    fetch: app.fetch,
    port: env.PORT,
    idleTimeout: 255, // Maximum 255 seconds for Bun
  })

  console.log(`🚀 Server running on http://localhost:${env.PORT}`)
  console.log(`📝 Environment: ${env.NODE_ENV}`)
  console.log(`🔗 CORS Origin: ${env.CORS_ORIGIN}`)
}

start()

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n👋 Shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})
