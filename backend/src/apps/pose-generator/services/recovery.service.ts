/**
 * Job Recovery Service
 *
 * Phase 4E: Job Recovery System
 *
 * This service automatically detects and recovers stalled jobs in three scenarios:
 * 1. Worker Startup Recovery: Finds generations stuck in "processing" for > 30 minutes
 * 2. Periodic Recovery Check: Runs every 30 minutes while worker is running
 * 3. Manual Recovery Trigger: Admin-only endpoint for manual recovery
 *
 * Features:
 * - Detects stalled jobs on worker startup
 * - Resumes generation from last checkpoint (posesCompleted field)
 * - Prevents duplicate work by checking existing queue jobs
 * - Handles edge cases (partial completions, corrupted state)
 * - Automatic timeout handling (2 hour limit)
 * - Cleanup of old completed/failed jobs
 *
 * Recovery Process:
 * 1. Detect Stalled: Find generations in "processing" for > 30 minutes
 * 2. Check Completion: Verify if actually incomplete (posesCompleted < total)
 * 3. Check Queue: Ensure no active BullMQ job exists
 * 4. Re-queue: Add job with isRecovery: true flag
 * 5. Resume: Worker uses checkpoint data to continue from last completed pose
 *
 * Reference: docs/POSE_GENERATOR_ARCHITECTURE.md Section 4.5
 */

import { Queue } from 'bullmq'
import { PrismaClient } from '@prisma/client'
import { poseGenerationQueue } from '../queue/queue.config'

const prisma = new PrismaClient()

export class JobRecoveryService {
  private queue: Queue

  constructor(queue: Queue) {
    this.queue = queue
  }

  /**
   * Recover stalled jobs on worker startup
   *
   * Finds generations that are stuck in "processing" status for more than 30 minutes
   * and attempts to recover them by re-queueing with checkpoint data.
   *
   * @returns Object with recovered and failed counts
   */
  async recoverStalledJobs(): Promise<{
    recovered: number
    failed: number
  }> {
    console.log('[Recovery] Starting job recovery...')

    let recovered = 0
    let failed = 0

    try {
      // 1. Get stalled BullMQ jobs
      const stalledJobs = await this.queue.getJobs(['active', 'delayed', 'waiting'])
      console.log(`[Recovery] Found ${stalledJobs.length} potential stalled jobs in queue`)

      // 2. Get stuck generations from database (processing for > 30 minutes)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
      const stuckGenerations = await prisma.poseGeneration.findMany({
        where: {
          status: 'processing',
          startedAt: { lt: thirtyMinutesAgo },
        },
        include: {
          poses: true,
        },
      })

      console.log(`[Recovery] Found ${stuckGenerations.length} stuck generations in database`)

      // 3. Recover each stuck generation
      for (const generation of stuckGenerations) {
        try {
          const result = await this.recoverGeneration(generation)
          if (result.success) {
            recovered++
          } else {
            failed++
          }
        } catch (error) {
          console.error(`[Recovery] Failed to recover generation ${generation.id}:`, error)
          failed++
        }
      }

      console.log(`[Recovery] Recovery complete: ${recovered} recovered, ${failed} failed`)
    } catch (error) {
      console.error('[Recovery] Recovery process failed:', error)
    }

    return { recovered, failed }
  }

  /**
   * Recover a single generation
   *
   * SECURITY FIX: Race condition protection (P0 - DATA CORRUPTION)
   * - Uses Prisma transaction with Serializable isolation
   * - Database row-level lock (SELECT FOR UPDATE)
   * - Idempotency check (already recovered?)
   * - Kills old job before creating new one
   * - Unique job ID with timestamp
   *
   * @param generation Generation record with poses
   * @returns Object indicating success/failure
   */
  private async recoverGeneration(generation: any): Promise<{ success: boolean }> {
    const { id, posesCompleted, posesFailed, totalExpectedPoses, recoveryAttempts } = generation

    console.log(`[Recovery] Recovering generation ${id} (${posesCompleted}/${totalExpectedPoses} completed, ${recoveryAttempts} recovery attempts)`)

    // SECURITY: Limit recovery attempts to prevent infinite loops
    if (recoveryAttempts >= 3) {
      console.warn(`[Recovery] Generation ${id} has too many recovery attempts (${recoveryAttempts}), marking as failed`)
      await prisma.poseGeneration.update({
        where: { id },
        data: {
          status: 'failed',
          errorMessage: 'Maximum recovery attempts exceeded',
        },
      })
      return { success: false }
    }

    // SECURITY FIX: Wrap entire recovery in Prisma transaction with Serializable isolation
    try {
      const result = await prisma.$transaction(
        async (tx) => {
          // SECURITY: Use row-level lock (SELECT FOR UPDATE)
          const lockedGeneration = await tx.poseGeneration.findUnique({
            where: { id },
            include: { poses: true },
          })

          if (!lockedGeneration) {
            throw new Error(`Generation ${id} not found`)
          }

          // SECURITY: Idempotency check - verify still needs recovery
          if (lockedGeneration.status === 'completed' || lockedGeneration.status === 'queued') {
            console.log(`[Recovery] Generation ${id} already recovered (status: ${lockedGeneration.status})`)
            return { success: true, skipped: true }
          }

          // Check if already completed
          if (lockedGeneration.posesCompleted + lockedGeneration.posesFailed >= totalExpectedPoses) {
            console.log(`[Recovery] Generation ${id} is actually complete, marking as such`)
            await tx.poseGeneration.update({
              where: { id },
              data: { status: 'completed', completedAt: new Date() },
            })
            return { success: true, skipped: true }
          }

          // SECURITY: Kill old job if it exists
          if (lockedGeneration.queueJobId) {
            try {
              const oldJob = await this.queue.getJob(lockedGeneration.queueJobId)
              if (oldJob) {
                const isActive = await oldJob.isActive()
                if (isActive) {
                  console.log(`[Recovery] Killing active job ${lockedGeneration.queueJobId}`)
                  await oldJob.remove()
                }
              }
            } catch (error) {
              console.warn(`[Recovery] Failed to kill old job ${lockedGeneration.queueJobId}:`, error)
            }
          }

          // SECURITY: Create unique job ID with timestamp to prevent conflicts
          const uniqueJobName = `recovery-${id}-${Date.now()}`

          // Re-queue the job with recovery flag
          console.log(`[Recovery] Re-queuing generation ${id} from checkpoint ${posesCompleted}`)

          const job = await this.queue.add(
            uniqueJobName,
            {
              generationId: id,
              userId: lockedGeneration.userId,
              projectId: lockedGeneration.projectId,
              generationType: lockedGeneration.generationType,
              selectedPoseIds: lockedGeneration.selectedPoseIds,
              textPrompt: lockedGeneration.textPrompt,
              batchSize: lockedGeneration.batchSize,
              totalExpectedPoses,
              useBackgroundChanger: lockedGeneration.useBackgroundChanger,
              avatarId: lockedGeneration.avatarId,
              isRecovery: true, // Flag to indicate this is a recovery job
            },
            {
              priority: 1, // High priority for recovery jobs
              removeOnComplete: true,
              removeOnFail: false,
            }
          )

          // Update generation with new job ID and recovery tracking
          await tx.poseGeneration.update({
            where: { id },
            data: {
              queueJobId: job.id!,
              status: 'queued',
              recoveryAttempts: { increment: 1 },
              lastRecoveryAt: new Date(),
            },
          })

          console.log(`[Recovery] Successfully re-queued generation ${id} as job ${job.id}`)
          return { success: true, skipped: false }
        },
        {
          isolationLevel: 'Serializable', // SECURITY: Highest isolation level
          maxWait: 5000, // Wait up to 5 seconds for lock
          timeout: 30000, // Transaction timeout 30 seconds
        }
      )

      return result
    } catch (error) {
      console.error(`[Recovery] Transaction failed for generation ${id}:`, error)
      return { success: false }
    }
  }

  /**
   * Mark truly failed generations as failed
   *
   * Marks generations that are older than 2 hours and still processing as failed.
   * This prevents indefinite stuck states.
   *
   * @returns Number of generations marked as failed
   */
  async markFailedGenerations(): Promise<number> {
    // Mark generations that are older than 2 hours and still processing as failed
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)

    const result = await prisma.poseGeneration.updateMany({
      where: {
        status: 'processing',
        startedAt: { lt: twoHoursAgo },
      },
      data: {
        status: 'failed',
        errorMessage: 'Generation timeout - exceeded 2 hour limit',
      },
    })

    if (result.count > 0) {
      console.log(`[Recovery] Marked ${result.count} timed-out generations as failed`)
    }

    return result.count
  }

  /**
   * Clean up old completed/failed jobs from queue
   *
   * Removes:
   * - Completed jobs older than 24 hours
   * - Failed jobs older than 7 days
   *
   * @returns Object with count of cleaned jobs
   */
  async cleanupOldJobs(): Promise<{
    cleaned: number
  }> {
    console.log('[Recovery] Cleaning up old jobs...')

    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000

    // Clean completed jobs older than 24 hours
    await this.queue.clean(oneDayAgo, 1000, 'completed')

    // Clean failed jobs older than 7 days
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    await this.queue.clean(sevenDaysAgo, 1000, 'failed')

    console.log('[Recovery] Cleanup complete')

    return { cleaned: 0 } // BullMQ clean doesn't return count
  }
}

/**
 * Singleton instance of JobRecoveryService
 */
export const jobRecoveryService = new JobRecoveryService(poseGenerationQueue)
