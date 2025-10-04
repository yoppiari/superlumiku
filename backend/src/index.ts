import app from './app'
import { env } from './config/env'
import prisma from './db/client'
import { initStorage } from './lib/storage'

// Import workers
import './workers/video-mixer.worker'
import './workers/carousel-mix.worker'
import './workers/looping-flow.worker'

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

// Start server
async function start() {
  await checkDatabase()
  await initStorage()

  // Use Bun's built-in server
  Bun.serve({
    fetch: app.fetch,
    port: env.PORT,
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
