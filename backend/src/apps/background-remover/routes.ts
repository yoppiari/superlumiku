import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth.middleware'
import { AuthVariables } from '../../types/hono'
import { prisma } from '../../db/client'
import { backgroundRemoverService } from './services/background-remover.service'
import { pricingService } from './services/pricing.service'
import { subscriptionService } from './services/subscription.service'

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
    const jobs = await backgroundRemoverService.getUserJobs(userId)

    return c.json({ jobs })
  } catch (error: any) {
    console.error('Error fetching jobs:', error)
    return c.json({ error: error.message }, 500)
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
    const subscription = await subscriptionService.getUserSubscription(userId)

    return c.json({ subscription })
  } catch (error: any) {
    console.error('Error fetching subscription:', error)
    return c.json({ error: error.message }, 500)
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

    const [jobsCount, batchesCount, subscription] = await Promise.all([
      prisma.backgroundRemovalJob.count({ where: { userId, batchId: null } }),
      prisma.backgroundRemovalBatch.count({ where: { userId } }),
      subscriptionService.getUserSubscription(userId),
    ])

    return c.json({
      stats: {
        totalSingleRemovals: jobsCount,
        totalBatches: batchesCount,
        hasSubscription: !!subscription,
        plan: subscription?.plan,
      },
    })
  } catch (error: any) {
    console.error('Error fetching stats:', error)
    return c.json({ error: error.message }, 500)
  }
})

export default app
