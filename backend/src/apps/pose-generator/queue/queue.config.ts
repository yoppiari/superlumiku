/**
 * BullMQ Queue Configuration for Pose Generator
 *
 * Phase 3: Backend API & Workers Implementation
 *
 * This file configures the BullMQ queue system for async pose generation.
 * Jobs are persisted in Redis and can be recovered after server restarts.
 *
 * Features:
 * - Redis-backed job persistence
 * - Automatic retry with exponential backoff
 * - Job cleanup (completed after 24h, failed after 7 days)
 * - Type-safe job data definitions
 * - Priority queue support (pro users get priority)
 */

import { Queue, QueueOptions } from 'bullmq'
import Redis from 'ioredis'

// ========================================
// Redis Connection
// ========================================

/**
 * Create Redis connection for BullMQ with lazy loading
 *
 * CRITICAL FIX: Use lazyConnect to prevent connection at import time
 * This prevents module loading errors during server startup
 *
 * NOTE: maxRetriesPerRequest must be null for BullMQ
 * See: https://docs.bullmq.io/guide/connections
 */
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
  lazyConnect: true, // CRITICAL: Prevents connection at import time
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
})

// Handle connection events
connection.on('connect', () => {
  console.log('[Queue] Connected to Redis')
})

connection.on('error', (error) => {
  console.error('[Queue] Redis connection error:', error)
})

connection.on('ready', () => {
  console.log('[Queue] Redis connection ready')
})

// ========================================
// Queue Options
// ========================================

/**
 * Default queue options
 *
 * Job lifecycle:
 * - Attempts: 3 retries with exponential backoff
 * - Completed jobs: Kept for 24 hours (for status checking)
 * - Failed jobs: Kept for 7 days (for debugging)
 */
const queueOptions: QueueOptions = {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // 2s, 4s, 8s
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep for 24 hours
      count: 1000, // Keep max 1000 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep for 7 days
      count: 5000, // Keep max 5000 failed jobs
    },
  },
}

// ========================================
// Queue Instance
// ========================================

/**
 * Main pose generation queue
 *
 * Workers will listen to this queue and process jobs.
 * Each job represents a full generation request (1+ poses).
 */
export const poseGenerationQueue = new Queue('pose-generation', queueOptions)

// Handle queue events
poseGenerationQueue.on('error', (error) => {
  console.error('[Queue] Error:', error)
})

// ========================================
// Job Type Definitions
// ========================================

/**
 * Pose Generation Job Data
 *
 * This is the data structure enqueued when user starts a generation.
 * Worker receives this data and processes the generation.
 */
export interface PoseGenerationJob {
  // Identifiers
  generationId: string // PoseGeneration record ID
  userId: string // User ID (for WebSocket notifications)
  projectId: string // Project ID

  // Generation type
  generationType: 'GALLERY_REFERENCE' | 'TEXT_DESCRIPTION'

  // Gallery mode: Selected poses from library
  selectedPoseIds?: string[]

  // Text mode: User prompt
  textPrompt?: string

  // Settings
  batchSize: number // Variations per pose
  totalExpectedPoses: number // Total poses to generate

  // Background changer (optional)
  useBackgroundChanger: boolean
  backgroundMode?: 'ai_generate' | 'solid_color' | 'upload'
  backgroundPrompt?: string
  backgroundColor?: string
  backgroundImageUrl?: string

  // Export formats
  exportFormats?: string[] // ['instagram_story', 'tiktok', 'shopee']

  // Avatar context (optional)
  avatarId?: string
  avatarAttributes?: string // JSON string

  // Credit tracking
  creditCharged: number

  // Recovery flag
  isRecovery?: boolean // True if resuming from checkpoint
}

/**
 * Background Changer Job Data
 *
 * Separate queue for background changing operations.
 * This is a lighter operation than full pose generation.
 */
export interface BackgroundChangeJob {
  // Identifiers
  poseId: string // GeneratedPose record ID
  userId: string
  generationId: string

  // Background settings
  backgroundMode: 'ai_generate' | 'solid_color' | 'upload'
  backgroundPrompt?: string
  backgroundColor?: string
  backgroundImageUrl?: string

  // Original image
  originalImageUrl: string

  // Credit tracking
  creditCharged: number // Always 10 credits
}

// ========================================
// Queue Management Functions
// ========================================

/**
 * Add pose generation job to queue
 *
 * @param data Job data
 * @param priority Priority level (10 = high, 5 = normal, 1 = low)
 * @returns Job instance
 */
export async function enqueuePoseGeneration(
  data: PoseGenerationJob,
  priority: number = 5
) {
  const job = await poseGenerationQueue.add('generate-poses', data, {
    priority,
    jobId: `gen-${data.generationId}`, // Prevent duplicate jobs
  })

  console.log(`[Queue] Enqueued pose generation job: ${job.id}`)

  return job
}

/**
 * Get job status by generation ID
 *
 * @param generationId Generation ID
 * @returns Job instance or null
 */
export async function getGenerationJob(generationId: string) {
  const jobId = `gen-${generationId}`
  const job = await poseGenerationQueue.getJob(jobId)

  return job
}

/**
 * Get queue metrics for monitoring
 *
 * @returns Queue statistics
 */
export async function getQueueMetrics() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    poseGenerationQueue.getWaitingCount(),
    poseGenerationQueue.getActiveCount(),
    poseGenerationQueue.getCompletedCount(),
    poseGenerationQueue.getFailedCount(),
    poseGenerationQueue.getDelayedCount(),
  ])

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  }
}

/**
 * Clean old completed jobs (for maintenance)
 *
 * Call this periodically via cron job
 */
export async function cleanOldJobs() {
  const grace = 24 * 3600 * 1000 // 24 hours
  const failedGrace = 7 * 24 * 3600 * 1000 // 7 days

  await poseGenerationQueue.clean(grace, 100, 'completed')
  await poseGenerationQueue.clean(failedGrace, 100, 'failed')

  console.log('[Queue] Cleaned old jobs')
}

// ========================================
// Connection Management
// ========================================

/**
 * Initialize Redis connection with proper error handling
 *
 * This must be called before using the queue or Redis connection.
 * Uses exponential backoff retry mechanism.
 */
export async function initializeRedisConnection(): Promise<void> {
  try {
    if (connection.status === 'ready') {
      console.log('[Queue] Redis already connected')
      return
    }

    console.log('[Queue] Initializing Redis connection...')
    await connection.connect()
    console.log('[Queue] Redis connection initialized successfully')
  } catch (error) {
    console.error('[Queue] Failed to initialize Redis connection:', error)
    throw new Error(`Redis connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Gracefully close Redis connection
 */
export async function closeRedisConnection(): Promise<void> {
  try {
    if (connection.status !== 'end') {
      await connection.quit()
      console.log('[Queue] Redis connection closed')
    }
  } catch (error) {
    console.error('[Queue] Error closing Redis connection:', error)
    // Force disconnect if quit fails
    connection.disconnect()
  }
}

/**
 * Check if Redis connection is ready
 */
export function isRedisConnected(): boolean {
  return connection.status === 'ready'
}

// ========================================
// Export Redis Connection
// ========================================

/**
 * Export Redis connection for use in other modules
 * (e.g., WebSocket pub/sub, worker progress updates)
 *
 * IMPORTANT: Call initializeRedisConnection() before using this
 */
export { connection as redisConnection }
