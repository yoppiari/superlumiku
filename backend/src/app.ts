import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { serveStatic } from 'hono/bun'
import { corsMiddleware } from './middleware/cors.middleware'
import { authMiddleware } from './middleware/auth.middleware'
import authRoutes from './routes/auth.routes'
import creditRoutes from './routes/credit.routes'
import paymentRoutes from './routes/payment.routes'
import creditsRoutes from './routes/credits.routes'
import deviceRoutes from './routes/device.routes'
import generationRoutes from './routes/generation.routes'
import statsRoutes from './routes/stats.routes'
import subscriptionRoutes from './routes/subscription.routes'
import quotaRoutes from './routes/quota.routes'
import modelStatsRoutes from './routes/model-stats.routes'
import poseTemplateRoutes from './routes/pose-template.routes'
import adminRoutes from './routes/admin.routes'

// Plugin System
import { loadPlugins } from './plugins/loader'
import { pluginRegistry } from './plugins/registry'

// Services
import { accessControlService } from './services/access-control.service'
import { modelRegistryService } from './services/model-registry.service'

const app = new Hono()

// Load all plugins
loadPlugins()

// Middleware
app.use('*', logger())
app.use('*', corsMiddleware)

// Serve static files from uploads directory
app.use('/uploads/*', serveStatic({ root: './' }))

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Core API Routes
app.route('/api/auth', authRoutes)
app.route('/api/credits', creditsRoutes)
app.route('/api/payment', paymentRoutes)
app.route('/api/devices', deviceRoutes)
app.route('/api/generations', generationRoutes)
app.route('/api/stats', statsRoutes)

// NEW: Subscription & Quota Routes
app.route('/api/subscription', subscriptionRoutes)
app.route('/api/quota', quotaRoutes)
app.route('/api/models', modelStatsRoutes)

// Pose Template Routes
app.route('/api/poses', poseTemplateRoutes)

// Admin Routes (no auth for seeding)
app.route('/api/admin', adminRoutes)

// Get all apps for dashboard (filtered by user access)
app.get('/api/apps', authMiddleware, async (c) => {
  const userId = c.get('userId')

  // Get only apps user can access
  const apps = await accessControlService.getUserAccessibleApps(userId)

  console.log(`📱 Dashboard Apps for user ${userId}:`)
  console.log(`  - Accessible apps: ${apps.length}`)
  console.log(`  - Apps:`, apps.map(a => a.name).join(', '))

  return c.json({ apps })
})

// Get models for specific app (filtered by user tier)
app.get('/api/apps/:appId/models', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const appId = c.req.param('appId')

  const models = await modelRegistryService.getUserAccessibleModels(userId, appId)

  return c.json({ models })
})

// Mount all enabled plugin routes
for (const plugin of pluginRegistry.getEnabled()) {
  const routes = pluginRegistry.getRoutes(plugin.appId)
  if (routes) {
    app.route(plugin.routePrefix, routes)
    console.log(`🔌 Mounted: ${plugin.name} at ${plugin.routePrefix}`)
  }
}

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404)
})

// Error handler
app.onError((err, c) => {
  console.error('Error:', err)
  return c.json(
    {
      error: err.message || 'Internal Server Error',
    },
    500
  )
})

export default app