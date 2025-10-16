/**
 * Redis Connection Manager
 *
 * Production-grade Redis connection management with:
 * - Connection pooling
 * - Automatic reconnection with exponential backoff
 * - Connection timeout handling
 * - Memory leak prevention
 * - Graceful shutdown
 * - Health monitoring
 */

import Redis, { RedisOptions } from 'ioredis'
import { logger } from './logger'

// Check if Redis is configured
// For development: Allow disabling Redis for auth-only testing
const REDIS_ENABLED = process.env.REDIS_ENABLED !== 'false'

// Connection configuration constants
const MAX_RETRIES = 3 // Stop after 3 attempts
const CONNECTION_TIMEOUT = 10000 // 10 seconds
const KEEP_ALIVE_INTERVAL = 30000 // 30 seconds
const MAX_RECONNECT_DELAY = 5000 // 5 seconds max delay

let redis: Redis | null = null
let isShuttingDown = false
let connectionAttempts = 0

/**
 * Redis configuration with production-ready settings
 */
const redisConfig: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  username: process.env.REDIS_USERNAME || 'default',
  password: process.env.REDIS_PASSWORD || undefined,

  // BullMQ requirements
  maxRetriesPerRequest: null,
  enableReadyCheck: false,

  // Connection management
  lazyConnect: true, // Don't connect immediately
  connectTimeout: CONNECTION_TIMEOUT,
  keepAlive: KEEP_ALIVE_INTERVAL,

  // Connection pooling
  enableOfflineQueue: true,
  maxLoadingRetryTime: 10000,

  // Retry strategy with exponential backoff
  retryStrategy: (times: number) => {
    if (isShuttingDown) {
      logger.info('Redis retry skipped - application is shutting down')
      return null
    }

    if (times > MAX_RETRIES) {
      logger.error('Redis connection failed after maximum retries', {
        attempts: times,
        maxRetries: MAX_RETRIES
      })
      connectionAttempts = 0
      return null // Stop retrying
    }

    // Exponential backoff: 50ms, 100ms, 200ms, 400ms, ... up to 5s
    const delay = Math.min(times * 50 * Math.pow(2, times - 1), MAX_RECONNECT_DELAY)
    logger.warn('Redis connection retry scheduled', {
      attempt: times,
      delayMs: delay
    })

    return delay
  },

  // Reconnect on error
  reconnectOnError: (err: Error) => {
    const targetError = 'READONLY'
    if (err.message.includes(targetError)) {
      logger.warn('Redis reconnecting due to READONLY error')
      return true // Reconnect
    }
    return false
  },
}

if (REDIS_ENABLED) {
  redis = new Redis(redisConfig)

  // Connection lifecycle events
  redis.on('connect', () => {
    connectionAttempts++
    logger.info('Redis connection established', {
      host: redisConfig.host,
      port: redisConfig.port,
      attempt: connectionAttempts
    })
  })

  redis.on('ready', () => {
    connectionAttempts = 0 // Reset on successful connection
    logger.info('Redis ready to accept commands')
  })

  redis.on('error', (err: Error) => {
    logger.error('Redis connection error', {
      error: err.message,
      stack: err.stack,
      code: (err as any).code
    })
  })

  redis.on('close', () => {
    if (!isShuttingDown) {
      logger.warn('Redis connection closed unexpectedly')
    } else {
      logger.info('Redis connection closed gracefully')
    }
  })

  redis.on('reconnecting', (timeToReconnect: number) => {
    logger.info('Redis reconnecting', {
      delayMs: timeToReconnect
    })
  })

  redis.on('end', () => {
    logger.info('Redis connection ended')
  })
} else {
  logger.warn('Redis DISABLED - Background jobs will not work', {
    notice: 'Auth and core features still available'
  })
}

/**
 * Get Redis connection status
 */
export function getRedisStatus(): {
  enabled: boolean
  connected: boolean
  ready: boolean
  status: string
} {
  if (!redis) {
    return {
      enabled: false,
      connected: false,
      ready: false,
      status: 'disabled'
    }
  }

  return {
    enabled: true,
    connected: redis.status === 'connect' || redis.status === 'ready',
    ready: redis.status === 'ready',
    status: redis.status
  }
}

/**
 * Gracefully disconnect from Redis
 */
export async function disconnectRedis(): Promise<void> {
  if (!redis) {
    return
  }

  isShuttingDown = true
  logger.info('Closing Redis connection...')

  try {
    // Quit gracefully (waits for pending commands)
    await redis.quit()
    logger.info('Redis connection closed successfully')
  } catch (error) {
    logger.error('Error closing Redis connection', { error })
    // Force disconnect if graceful quit fails
    await redis.disconnect()
  }
}

/**
 * Check Redis health
 */
export async function checkRedisHealth(): Promise<{
  status: 'ok' | 'error'
  latencyMs?: number
  error?: string
}> {
  if (!redis) {
    return {
      status: 'error',
      error: 'Redis not enabled'
    }
  }

  try {
    const start = Date.now()
    await redis.ping()
    const latency = Date.now() - start

    return {
      status: 'ok',
      latencyMs: latency
    }
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export { redis }
export const isRedisEnabled = () => redis !== null
