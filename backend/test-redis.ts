import { redis } from './src/lib/redis'

async function testRedis() {
  try {
    if (!redis) {
      console.error('❌ Redis not configured')
      console.log('   Update .env with Redis credentials and restart')
      process.exit(1)
    }

    console.log('Testing Redis connection...\n')

    // Test SET
    await redis.set('test-key', 'Hello Redis!')
    console.log('✅ SET operation successful')

    // Test GET
    const value = await redis.get('test-key')
    console.log('✅ GET operation successful:', value)

    // Test DELETE
    await redis.del('test-key')
    console.log('✅ DEL operation successful')

    console.log('\n🎉 Redis connection is working perfectly!')
    console.log('\nNext steps:')
    console.log('1. Restart your backend server')
    console.log('2. Start the worker: bun src/workers/video-mixer.worker.ts')
    console.log('3. Try generating videos!')

    process.exit(0)
  } catch (error: any) {
    console.error('❌ Redis connection failed:', error.message)
    console.log('\nTroubleshooting:')
    console.log('1. Is Redis/Memurai running? (sc query Memurai)')
    console.log('2. Check .env file has correct REDIS_HOST, REDIS_PORT, REDIS_PASSWORD')
    console.log('3. Try: net start Memurai')
    process.exit(1)
  }
}

testRedis()
