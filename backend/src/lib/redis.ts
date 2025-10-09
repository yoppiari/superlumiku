import Redis from 'ioredis'

// Check if Redis is configured
// For development: Allow localhost without password
// For production: Require proper host or password
const REDIS_ENABLED = true // Always try to connect in development

let redis: Redis | null = null

if (REDIS_ENABLED) {
  // Redis connection
  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    username: process.env.REDIS_USERNAME || 'default',
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false,
    retryStrategy: (times) => {
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
  console.log('⚠️  Redis NOT configured - Video processing disabled')
  console.log('   See TODO_REDIS_SETUP.md for setup instructions')
}

export { redis }
export const isRedisEnabled = () => redis !== null
