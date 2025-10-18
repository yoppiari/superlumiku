import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth.middleware'
import { AuthVariables } from '../../types/hono'
import { prisma } from '../../db/client'
import { backgroundRemoverService } from './services/background-remover.service'
import { pricingService } from './services/pricing.service'
import { subscriptionService } from './services/subscription.service'
import { logger } from '../../lib/logger'

const app = new Hono<{ Variables: AuthVariables }>()

// ========================================
// Single Image Removal
// ========================================

app.post('/remove', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const formData = await c.req.formData()

    const file = formData.get('image') as File
    const tier = formData.get('tier') as string

    if (!file) {
      return c.json({ error: 'No image file provided' }, 400)
    }

    if (!['basic', 'standard', 'professional', 'industry'].includes(tier)) {
      return c.json({ error: 'Invalid tier' }, 400)
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const job = await backgroundRemoverService.processSingleImage(userId, buffer, tier as any)

    return c.json({
      message: 'Background removed successfully',
      job,
    })
  } catch (error: any) {
    console.error('Error removing background:', error)
    return c.json({ error: error.message }, 500)
  }
})

// ========================================
// Batch Processing
// ========================================

app.post('/batch', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const formData = await c.req.formData()

    const tier = formData.get('tier') as string
    const files: Array<{ buffer: Buffer; name: string }> = []

    // Extract all files
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('images[')) {
        const file = value as File
        files.push({
          buffer: Buffer.from(await file.arrayBuffer()),
          name: file.name,
        })
      }
    }

    const batch = await backgroundRemoverService.startBatchProcessing(userId, files, tier as any)

    return c.json({
      message: 'Batch processing started',
      batch: {
        id: batch.batchId,
        totalImages: batch.totalImages,
        status: batch.status,
      },
    })
  } catch (error: any) {
    console.error('Error starting batch:', error)
    return c.json({ error: error.message }, 500)
  }
})

app.get('/batch/:batchId', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const batchId = c.req.param('batchId')

    const batch = await backgroundRemoverService.getBatchStatus(batchId, userId)

    return c.json({ batch })
  } catch (error: any) {
    console.error('Error fetching batch:', error)
    const status = error.message === 'Batch not found' ? 404 : 500
    return c.json({ error: error.message }, status)
  }
})

app.get('/batch/:batchId/download', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const batchId = c.req.param('batchId')

    const batch = await backgroundRemoverService.getBatchStatus(batchId, userId)

    if (!batch.zipUrl) {
      return c.json({ error: 'ZIP file not yet generated' }, 404)
    }

    return c.json({
      zipUrl: batch.zipUrl,
      zipSize: batch.zipSize,
    })
  } catch (error: any) {
    console.error('Error downloading batch:', error)
    return c.json({ error: error.message }, 500)
  }
})

// ========================================
// Jobs
// ========================================

app.get('/jobs', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')

    logger.debug({ userId, action: 'fetch_jobs' }, 'Fetching user jobs')

    // Fetch user's jobs - will return empty array if none exist
    const jobs = await backgroundRemoverService.getUserJobs(userId)

    logger.info({
      userId,
      jobCount: jobs?.length || 0
    }, 'Jobs fetched successfully')

    return c.json({ jobs: jobs || [] })
  } catch (error: any) {
    logger.error({
      userId: c.get('userId'),
      error: error.message,
      stack: error.stack
    }, 'Error fetching jobs')

    // Return detailed error for debugging
    return c.json({
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, 500)
  }
})

app.get('/jobs/:jobId', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const jobId = c.req.param('jobId')

    const job = await prisma.backgroundRemovalJob.findFirst({
      where: { id: jobId, userId },
    })

    if (!job) {
      return c.json({ error: 'Job not found' }, 404)
    }

    return c.json({ job })
  } catch (error: any) {
    console.error('Error fetching job:', error)
    return c.json({ error: error.message }, 500)
  }
})

// ========================================
// Subscription
// ========================================

app.get('/subscription', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')

    logger.debug({ userId, action: 'fetch_subscription' }, 'Fetching user subscription')

    // Handle cases where user doesn't have a subscription yet
    const subscription = await subscriptionService.getUserSubscription(userId)

    logger.info({
      userId,
      hasSubscription: !!subscription,
      plan: subscription?.plan
    }, 'Subscription fetched successfully')

    // Return null subscription gracefully - this is not an error
    return c.json({ subscription: subscription || null })
  } catch (error: any) {
    logger.error({
      userId: c.get('userId'),
      error: error.message,
      stack: error.stack
    }, 'Error fetching subscription')

    // Return detailed error for debugging
    return c.json({
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, 500)
  }
})

app.post('/subscription', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const { plan, paymentId } = await c.req.json()

    if (!['starter', 'pro'].includes(plan)) {
      return c.json({ error: 'Invalid plan' }, 400)
    }

    const subscription = await subscriptionService.createSubscription(
      userId,
      plan,
      paymentId
    )

    return c.json({
      message: 'Subscription created successfully',
      subscription,
    })
  } catch (error: any) {
    console.error('Error creating subscription:', error)
    return c.json({ error: error.message }, 500)
  }
})

app.delete('/subscription', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const { reason } = await c.req.json()

    await subscriptionService.cancelSubscription(userId, reason)

    return c.json({ message: 'Subscription cancelled successfully' })
  } catch (error: any) {
    console.error('Error cancelling subscription:', error)
    return c.json({ error: error.message }, 500)
  }
})

// ========================================
// Pricing Calculator
// ========================================

app.post('/pricing/calculate', authMiddleware, async (c) => {
  try {
    const { totalImages, tier } = await c.req.json()

    if (!tier || !totalImages) {
      return c.json({ error: 'Missing required fields' }, 400)
    }

    const pricing = pricingService.calculateBatchPricing(totalImages, tier)

    return c.json({ pricing })
  } catch (error: any) {
    console.error('Error calculating pricing:', error)
    return c.json({ error: error.message }, 500)
  }
})

// ========================================
// Stats
// ========================================

app.get('/stats', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')

    logger.debug({ userId, action: 'fetch_stats' }, 'Fetching background remover stats')

    // Fetch stats with proper error handling
    const [jobsCount, batchesCount, subscription] = await Promise.all([
      prisma.backgroundRemovalJob.count({ where: { userId, batchId: null } }).catch((err) => {
        logger.warn({ userId, error: err.message }, 'Failed to count jobs')
        return 0
      }),
      prisma.backgroundRemovalBatch.count({ where: { userId } }).catch((err) => {
        logger.warn({ userId, error: err.message }, 'Failed to count batches')
        return 0
      }),
      subscriptionService.getUserSubscription(userId).catch((err) => {
        logger.warn({ userId, error: err.message }, 'Failed to fetch subscription')
        return null
      }),
    ])

    const stats = {
      totalSingleRemovals: jobsCount,
      totalBatches: batchesCount,
      hasSubscription: !!subscription,
      plan: subscription?.plan || null,
    }

    logger.info({
      userId,
      stats
    }, 'Stats fetched successfully')

    return c.json({ stats })
  } catch (error: any) {
    logger.error({
      userId: c.get('userId'),
      error: error.message,
      stack: error.stack
    }, 'Error fetching stats')

    // Return detailed error for debugging
    return c.json({
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, 500)
  }
})

export default app
