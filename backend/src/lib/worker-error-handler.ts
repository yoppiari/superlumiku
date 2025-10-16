/**
 * Worker Error Handler Utility
 *
 * Centralized error handling for BullMQ workers with:
 * - Structured logging
 * - Error classification
 * - Retry strategy
 * - Dead letter queue support
 * - Alert integration
 */

import { Worker, Job, Queue } from 'bullmq'
import { logger } from './logger'

/**
 * Error types for classification
 */
export enum WorkerErrorType {
  TRANSIENT = 'transient', // Temporary errors that should retry
  PERMANENT = 'permanent', // Permanent errors that should not retry
  RATE_LIMIT = 'rate_limit', // Rate limiting errors
  TIMEOUT = 'timeout', // Timeout errors
  UNKNOWN = 'unknown', // Unknown errors
}

/**
 * Classify error for retry strategy
 */
export function classifyError(error: Error): WorkerErrorType {
  const message = error.message.toLowerCase()

  // Network/connection errors - retry
  if (
    message.includes('econnrefused') ||
    message.includes('econnreset') ||
    message.includes('etimedout') ||
    message.includes('network') ||
    message.includes('connection')
  ) {
    return WorkerErrorType.TRANSIENT
  }

  // Rate limiting - retry with backoff
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return WorkerErrorType.RATE_LIMIT
  }

  // Timeout errors - retry
  if (message.includes('timeout')) {
    return WorkerErrorType.TIMEOUT
  }

  // File not found, invalid input - don't retry
  if (
    message.includes('not found') ||
    message.includes('invalid') ||
    message.includes('missing') ||
    message.includes('required')
  ) {
    return WorkerErrorType.PERMANENT
  }

  return WorkerErrorType.UNKNOWN
}

/**
 * Setup worker error handlers
 */
export function setupWorkerErrorHandlers<T>(
  worker: Worker<T>,
  workerName: string
): void {
  const workerLogger = logger.child({ worker: workerName })

  // Job completed successfully
  worker.on('completed', (job: Job) => {
    workerLogger.info('Job completed successfully', {
      jobId: job.id,
      duration: job.finishedOn ? job.finishedOn - (job.processedOn || 0) : 0,
    })
  })

  // Job failed
  worker.on('failed', async (job: Job | undefined, error: Error) => {
    const errorType = classifyError(error)
    const shouldRetry = errorType === WorkerErrorType.TRANSIENT || errorType === WorkerErrorType.RATE_LIMIT

    workerLogger.error('Job failed', {
      jobId: job?.id,
      attemptsMade: job?.attemptsMade,
      errorType,
      shouldRetry,
      error: error.message,
      stack: error.stack,
    })

    // If this is the final attempt, log as critical
    if (job && job.attemptsMade >= (job.opts.attempts || 3)) {
      workerLogger.error('Job exhausted all retry attempts', {
        jobId: job.id,
        data: job.data,
        error: error.message,
      })
      // TODO: Send to dead letter queue or alerting system
    }
  })

  // Worker error (not job-specific)
  worker.on('error', (error: Error) => {
    workerLogger.error('Worker error', {
      error: error.message,
      stack: error.stack,
    })
  })

  // Worker ready
  worker.on('ready', () => {
    workerLogger.info('Worker ready and listening for jobs')
  })

  // Worker closing
  worker.on('closing', () => {
    workerLogger.info('Worker closing...')
  })

  // Worker closed
  worker.on('closed', () => {
    workerLogger.info('Worker closed')
  })
}

/**
 * Setup queue error handlers
 */
export function setupQueueErrorHandlers<T>(
  queue: Queue<T>,
  queueName: string
): void {
  const queueLogger = logger.child({ queue: queueName })

  // Queue error
  queue.on('error', (error: Error) => {
    queueLogger.error('Queue error', {
      error: error.message,
      stack: error.stack,
    })
  })

  // Job waiting
  queue.on('waiting', (job: { jobId: string }) => {
    queueLogger.debug('Job waiting', {
      jobId: job.jobId,
    })
  })

  // Job added
  queue.on('added', (job: Job) => {
    queueLogger.info('Job added to queue', {
      jobId: job.id,
      data: job.data,
    })
  })

  // Job removed
  queue.on('removed', (job: Job) => {
    queueLogger.info('Job removed from queue', {
      jobId: job.id,
    })
  })
}

/**
 * Graceful worker shutdown
 */
export async function gracefulWorkerShutdown(
  worker: Worker,
  workerName: string,
  ffmpegService?: { cleanupAll: () => Promise<void> }
): Promise<void> {
  const workerLogger = logger.child({ worker: workerName })

  try {
    workerLogger.info('Starting graceful shutdown...')

    // Stop accepting new jobs
    workerLogger.info('Closing worker...')
    await worker.close()

    // Cleanup FFmpeg processes if provided
    if (ffmpegService) {
      workerLogger.info('Cleaning up FFmpeg processes...')
      await ffmpegService.cleanupAll()
    }

    // Disconnect from database
    const prisma = (await import('../db/client')).default
    workerLogger.info('Disconnecting from database...')
    await prisma.$disconnect()

    // Disconnect from Redis (if using separate connection)
    const { redis } = await import('./redis')
    if (redis) {
      workerLogger.info('Disconnecting from Redis...')
      await redis.quit()
    }

    workerLogger.info('Graceful shutdown complete')
    process.exit(0)
  } catch (error) {
    workerLogger.error('Error during shutdown', { error })
    process.exit(1)
  }
}

/**
 * Setup process-level error handlers for workers
 */
export function setupWorkerProcessHandlers(
  worker: Worker,
  workerName: string,
  ffmpegService?: { cleanupAll: () => Promise<void> }
): void {
  const workerLogger = logger.child({ worker: workerName })

  // Graceful shutdown on SIGTERM/SIGINT
  const shutdownHandler = (signal: string) => {
    workerLogger.info('Received shutdown signal', { signal })
    gracefulWorkerShutdown(worker, workerName, ffmpegService)
  }

  process.on('SIGTERM', () => shutdownHandler('SIGTERM'))
  process.on('SIGINT', () => shutdownHandler('SIGINT'))

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
    workerLogger.error('Unhandled Promise Rejection', {
      reason,
      promise: promise.toString(),
    })
    // Exit to trigger restart by process manager
    process.exit(1)
  })

  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    workerLogger.error('Uncaught Exception', {
      error: error.message,
      stack: error.stack,
    })
    // Exit to trigger restart by process manager
    process.exit(1)
  })
}
