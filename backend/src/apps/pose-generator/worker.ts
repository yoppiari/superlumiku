/**
 * Pose Generator Worker Entry Point
 *
 * Phase 3: Backend API & Workers Implementation
 * Phase 4E: Job Recovery System
 *
 * This file starts the BullMQ worker process for pose generation.
 * It should be run as a separate process from the main API server.
 *
 * Usage:
 *   bun src/apps/pose-generator/worker.ts
 *
 * Environment Variables Required:
 *   - REDIS_HOST: Redis server hostname
 *   - REDIS_PORT: Redis server port
 *   - REDIS_PASSWORD: Redis password (optional)
 *   - HUGGINGFACE_API_KEY: Hugging Face API key for FLUX
 *   - DATABASE_URL: PostgreSQL connection string
 *   - WORKER_CONCURRENCY: Number of parallel jobs (default: 5)
 *
 * Features:
 *   - Processes pose generation jobs from BullMQ queue
 *   - Publishes progress updates to Redis Pub/Sub
 *   - Handles graceful shutdown on SIGTERM/SIGINT
 *   - Automatic job recovery on restart
 *   - Comprehensive error handling
 *   - Periodic recovery checks every 30 minutes
 *
 * Architecture:
 *   - Worker polls Redis queue for pending jobs
 *   - Each job represents one generation request (1-N poses)
 *   - Worker updates database and publishes WebSocket events
 *   - On crash, jobs are automatically retried (max 3 attempts)
 *   - Recovery service resumes from last checkpoint
 *
 * Deployment:
 *   - Run multiple worker instances for horizontal scaling
 *   - Use PM2, Docker, or Kubernetes for process management
 *   - Monitor worker health via queue metrics
 */

import './workers/pose-generation.worker'
import { jobRecoveryService } from './services/recovery.service'

/**
 * Run startup recovery
 *
 * This function runs on worker startup to recover any stalled jobs.
 * It's safe to run on multiple worker instances - recovery is idempotent.
 */
async function runStartupRecovery() {
  console.log('='.repeat(50))
  console.log('🔄 Running startup recovery...')
  console.log('='.repeat(50))

  try {
    // Recover stalled jobs
    const recoveryResult = await jobRecoveryService.recoverStalledJobs()
    console.log(`✅ Recovery complete: ${recoveryResult.recovered} recovered, ${recoveryResult.failed} failed`)

    // Mark truly failed generations
    const failedCount = await jobRecoveryService.markFailedGenerations()
    if (failedCount > 0) {
      console.log(`⚠️  Marked ${failedCount} timed-out generations as failed`)
    }

    // Cleanup old jobs
    await jobRecoveryService.cleanupOldJobs()
    console.log('✅ Cleanup complete')
  } catch (error) {
    console.error('❌ Startup recovery failed:', error)
    // Don't fail worker startup on recovery error
  }

  console.log('='.repeat(50))
}

// Run recovery before starting worker
runStartupRecovery().then(() => {
  console.log('====================================')
  console.log('Pose Generator Worker')
  console.log('====================================')
  console.log('')
  console.log('Environment:')
  console.log(`  Redis: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`)
  console.log(`  Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`)
  console.log(`  FLUX API: ${process.env.HUGGINGFACE_API_KEY ? 'Configured' : 'Not configured'}`)
  console.log(`  Concurrency: ${process.env.WORKER_CONCURRENCY || '5'} jobs`)
  console.log('')
  console.log('Worker is now listening for jobs...')
  console.log('Press Ctrl+C to gracefully shutdown')
  console.log('====================================')
})

// Run periodic recovery check every 30 minutes
setInterval(async () => {
  console.log('[Worker] Running periodic recovery check...')
  try {
    const result = await jobRecoveryService.recoverStalledJobs()
    if (result.recovered > 0) {
      console.log(`[Worker] Periodic recovery: ${result.recovered} jobs recovered`)
    }
  } catch (error) {
    console.error('[Worker] Periodic recovery check failed:', error)
  }
}, 30 * 60 * 1000) // 30 minutes

// Keep process alive
process.stdin.resume()
