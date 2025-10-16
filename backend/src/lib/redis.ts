import Redis from 'ioredis'

// Check if Redis is configured
// For development: Allow disabling Redis for auth-only testing
const REDIS_ENABLED = process.env.REDIS_ENABLED !== 'false'

let redis: Redis | null = null

if (REDIS_ENABLED) {
  // Redis connection with MAX_RETRIES limit
  const MAX_RETRIES = 3  // Stop after 3 attempts

  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    username: process.env.REDIS_USERNAME || 'default',
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false,
    lazyConnect: true, // Don't connect immediately
    retryStrategy: (times) => {
      if (times > MAX_RETRIES) {
        console.error(`❌ Redis connection failed after ${MAX_RETRIES} attempts - giving up`)
        return null  // Stop retrying
      }
      const delay = Math.min(times * 50, 2000)
      return delay
    },
  })

  redis.on('connect', () => {
    console.log('✅ Redis connected')
  })

  redis.on('ready', () => {
    console.log('✅ Redis ready')
  })

  redis.on('error', (err) => {
    console.error('❌ Redis error:', err.message)
  })

  redis.on('close', () => {
    console.log('⚠️  Redis connection closed')
  })

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Closing Redis connection...')
    await redis?.quit()
  })
} else {
  console.log('⚠️  Redis DISABLED - Background jobs will not work')
  console.log('   Auth and core features still available')
}

export { redis }
export const isRedisEnabled = () => redis !== null
