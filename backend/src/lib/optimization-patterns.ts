/**
 * P2 PERFORMANCE: Optimization Patterns Guide
 *
 * This file provides examples and utilities for common performance optimizations.
 * Use these patterns throughout the codebase to ensure consistent performance.
 *
 * Topics Covered:
 * 1. N+1 Query Prevention
 * 2. Promise.all Parallelization
 * 3. File Operation Optimization
 * 4. Batch Operations
 * 5. Query Optimization
 */

import { Prisma, PrismaClient } from '@prisma/client'
import pMap from 'p-map'

/**
 * ============================================
 * 1. N+1 QUERY PREVENTION
 * ============================================
 */

/**
 * BAD: N+1 Query Pattern (Sequential queries in loop)
 *
 * This causes N+1 queries: 1 to fetch projects, N to fetch users
 */
export async function BAD_getProjectsWithUsers_N_PLUS_1(prisma: PrismaClient) {
  const projects = await prisma.videoMixerProject.findMany({
    take: 10,
  })

  // N queries - one for each project
  const projectsWithUsers = []
  for (const project of projects) {
    const user = await prisma.user.findUnique({
      where: { id: project.userId },
    })
    projectsWithUsers.push({ ...project, user })
  }

  return projectsWithUsers
}

/**
 * GOOD: Using Prisma Include (Single Query with JOIN)
 *
 * This causes only 1 query with a JOIN
 */
export async function GOOD_getProjectsWithUsers_INCLUDE(prisma: PrismaClient) {
  return await prisma.videoMixerProject.findMany({
    take: 10,
    include: {
      user: true, // Prisma does a JOIN automatically
    },
  })
}

/**
 * GOOD: Using Prisma Select (Optimized columns)
 *
 * Only fetch the columns you need
 */
export async function GOOD_getProjectsWithUsers_SELECT(prisma: PrismaClient) {
  return await prisma.videoMixerProject.findMany({
    take: 10,
    select: {
      id: true,
      name: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          // Don't fetch password or other sensitive/large fields
        },
      },
    },
  })
}

/**
 * GOOD: Manual Batch Loading (When include isn't available)
 *
 * Fetch all users in one query instead of N queries
 */
export async function GOOD_getProjectsWithUsers_BATCH(prisma: PrismaClient) {
  const projects = await prisma.videoMixerProject.findMany({
    take: 10,
  })

  // Get unique user IDs
  const userIds = [...new Set(projects.map((p) => p.userId))]

  // Fetch all users in ONE query
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
  })

  // Create a Map for O(1) lookup
  const userMap = new Map(users.map((u) => [u.id, u]))

  // Merge data
  return projects.map((project) => ({
    ...project,
    user: userMap.get(project.userId),
  }))
}

/**
 * ============================================
 * 2. PROMISE.ALL PARALLELIZATION
 * ============================================
 */

/**
 * BAD: Sequential Async Operations
 *
 * These operations don't depend on each other but run sequentially
 * Total time: 300ms + 200ms + 150ms = 650ms
 */
export async function BAD_sequentialOperations(prisma: PrismaClient, userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } }) // 300ms
  const credits = await prisma.credit.findMany({ where: { userId } }) // 200ms
  const projects = await prisma.videoMixerProject.findMany({ where: { userId } }) // 150ms

  return { user, credits, projects }
}

/**
 * GOOD: Parallel Async Operations
 *
 * These operations run in parallel
 * Total time: max(300ms, 200ms, 150ms) = 300ms (2.2x faster!)
 */
export async function GOOD_parallelOperations(prisma: PrismaClient, userId: string) {
  const [user, credits, projects] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.credit.findMany({ where: { userId } }),
    prisma.videoMixerProject.findMany({ where: { userId } }),
  ])

  return { user, credits, projects }
}

/**
 * GOOD: Parallel with Error Handling
 *
 * Handle errors gracefully without failing entire operation
 */
export async function GOOD_parallelWithErrorHandling(
  prisma: PrismaClient,
  userId: string
) {
  const [userResult, creditsResult, projectsResult] = await Promise.allSettled([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.credit.findMany({ where: { userId } }),
    prisma.videoMixerProject.findMany({ where: { userId } }),
  ])

  return {
    user: userResult.status === 'fulfilled' ? userResult.value : null,
    credits: creditsResult.status === 'fulfilled' ? creditsResult.value : [],
    projects: projectsResult.status === 'fulfilled' ? projectsResult.value : [],
    errors: {
      user: userResult.status === 'rejected' ? userResult.reason : null,
      credits: creditsResult.status === 'rejected' ? creditsResult.reason : null,
      projects: projectsResult.status === 'rejected' ? projectsResult.reason : null,
    },
  }
}

/**
 * ============================================
 * 3. FILE OPERATION OPTIMIZATION
 * ============================================
 */

/**
 * BAD: Sequential File Operations
 *
 * Files are processed one at a time
 */
export async function BAD_sequentialFileWrites(files: Array<{ path: string; content: Buffer }>) {
  const fs = await import('fs/promises')

  for (const file of files) {
    await fs.writeFile(file.path, file.content)
  }
}

/**
 * RISKY: Unlimited Parallel File Operations
 *
 * All files processed at once - can cause memory issues or file descriptor exhaustion
 */
export async function RISKY_unlimitedParallelFileWrites(
  files: Array<{ path: string; content: Buffer }>
) {
  const fs = await import('fs/promises')

  await Promise.all(files.map((file) => fs.writeFile(file.path, file.content)))
}

/**
 * GOOD: Controlled Concurrency File Operations
 *
 * Process files in parallel with concurrency limit
 */
export async function GOOD_controlledConcurrencyFileWrites(
  files: Array<{ path: string; content: Buffer }>,
  concurrency: number = 5
) {
  const fs = await import('fs/promises')

  await pMap(
    files,
    async (file) => {
      await fs.writeFile(file.path, file.content)
    },
    { concurrency }
  )
}

/**
 * GOOD: Batch File Operations with Progress Tracking
 */
export async function GOOD_batchFileOperationsWithProgress(
  files: Array<{ path: string; content: Buffer }>,
  onProgress?: (completed: number, total: number) => void
) {
  const fs = await import('fs/promises')
  let completed = 0

  await pMap(
    files,
    async (file) => {
      await fs.writeFile(file.path, file.content)
      completed++
      if (onProgress) {
        onProgress(completed, files.length)
      }
    },
    { concurrency: 5 }
  )
}

/**
 * ============================================
 * 4. BATCH OPERATIONS
 * ============================================
 */

/**
 * BAD: Insert records one by one
 */
export async function BAD_individualInserts(
  prisma: PrismaClient,
  records: Array<{ name: string; description: string }>
) {
  for (const record of records) {
    await prisma.avatarPreset.create({
      data: record,
    })
  }
}

/**
 * GOOD: Batch insert with createMany
 */
export async function GOOD_batchInsert(
  prisma: PrismaClient,
  records: Array<{ name: string; description: string }>
) {
  await prisma.avatarPreset.createMany({
    data: records,
    skipDuplicates: true, // Optional: skip if unique constraint violation
  })
}

/**
 * GOOD: Batch update with updateMany
 */
export async function GOOD_batchUpdate(
  prisma: PrismaClient,
  userIds: string[],
  updates: Partial<{ storageUsed: number }>
) {
  await prisma.user.updateMany({
    where: { id: { in: userIds } },
    data: updates,
  })
}

/**
 * ============================================
 * 5. QUERY OPTIMIZATION
 * ============================================
 */

/**
 * GOOD: Pagination with Cursor (Better than offset)
 *
 * Cursor-based pagination is more efficient than offset for large datasets
 */
export async function GOOD_cursorPagination(
  prisma: PrismaClient,
  cursor?: string,
  limit: number = 20
) {
  return await prisma.poseGeneration.findMany({
    take: limit,
    skip: cursor ? 1 : 0, // Skip the cursor
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      status: true,
      progress: true,
      createdAt: true,
      project: {
        select: {
          id: true,
          projectName: true,
        },
      },
    },
  })
}

/**
 * GOOD: Selective Field Loading
 *
 * Only load the fields you need, especially for text/blob fields
 */
export async function GOOD_selectiveFields(prisma: PrismaClient, generationId: string) {
  // BAD: Loads all fields including large text fields
  // const generation = await prisma.poseGeneration.findUnique({
  //   where: { id: generationId }
  // })

  // GOOD: Only load fields needed for display
  return await prisma.poseGeneration.findUnique({
    where: { id: generationId },
    select: {
      id: true,
      status: true,
      progress: true,
      createdAt: true,
      // Don't load textPrompt, generatedPoseStructure, errorMessage unless needed
    },
  })
}

/**
 * GOOD: Count with exists check (Faster for boolean checks)
 */
export async function GOOD_existsCheck(prisma: PrismaClient, userId: string) {
  // BAD: Loads all records just to check existence
  // const projects = await prisma.videoMixerProject.findMany({ where: { userId } })
  // const hasProjects = projects.length > 0

  // BETTER: Use count
  // const count = await prisma.videoMixerProject.count({ where: { userId } })
  // const hasProjects = count > 0

  // BEST: Use findFirst (stops after finding one)
  const project = await prisma.videoMixerProject.findFirst({
    where: { userId },
    select: { id: true }, // Only need ID
  })
  return project !== null
}

/**
 * ============================================
 * 6. CACHING PATTERNS
 * ============================================
 */

/**
 * GOOD: Cache expensive operations
 */
export async function GOOD_cachedOperation(prisma: PrismaClient, userId: string) {
  const { cacheService, CacheKeys, CacheTTL } = await import('./cache.service')

  // Try cache first
  return await cacheService.getCached(
    CacheKeys.userProfile(userId),
    CacheTTL.MEDIUM, // 5 minutes
    async () => {
      // Expensive operation only runs on cache miss
      return await prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscription: true,
          credits: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
        },
      })
    }
  )
}

/**
 * ============================================
 * UTILITY FUNCTIONS
 * ============================================
 */

/**
 * Chunk array into smaller batches
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

/**
 * Process array in batches with concurrency control
 */
export async function processBatches<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: {
    batchSize?: number
    concurrency?: number
    onProgress?: (completed: number, total: number) => void
  } = {}
): Promise<R[]> {
  const { batchSize = 100, concurrency = 5, onProgress } = options

  const results: R[] = []
  let completed = 0

  const batches = chunkArray(items, batchSize)

  for (const batch of batches) {
    const batchResults = await pMap(batch, processor, { concurrency })
    results.push(...batchResults)
    completed += batch.length

    if (onProgress) {
      onProgress(completed, items.length)
    }
  }

  return results
}

/**
 * Retry operation with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number
    initialDelay?: number
    maxDelay?: number
    onRetry?: (attempt: number, error: Error) => void
  } = {}
): Promise<T> {
  const { maxRetries = 3, initialDelay = 1000, maxDelay = 10000, onRetry } = options

  let lastError: Error | undefined

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt < maxRetries - 1) {
        const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay)

        if (onRetry) {
          onRetry(attempt + 1, lastError)
        }

        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new Error('Operation failed after retries')
}
