import { Hono } from 'hono'
import { logger as honoLogger } from 'hono/logger'
import { serveStatic } from 'hono/bun'
import { corsMiddleware } from './middleware/cors.middleware'
import { authMiddleware } from './middleware/auth.middleware'
import authRoutes from './routes/auth.routes'
import paymentRoutes from './routes/payment.routes'
import creditsRoutes from './routes/credits.routes'
import deviceRoutes from './routes/device.routes'
import generationRoutes from './routes/generation.routes'
import statsRoutes from './routes/stats.routes'
import subscriptionRoutes from './routes/subscription.routes'
import quotaRoutes from './routes/quota.routes'
import modelStatsRoutes from './routes/model-stats.routes'
import adminRoutes from './routes/admin.routes'
import healthRoutes from './routes/health.routes'
import settingsRoutes from './routes/settings.routes'

// Plugin System
import { loadPlugins } from './plugins/loader'
import { pluginRegistry } from './plugins/registry'

// Services
import { accessControlService } from './services/access-control.service'
import { modelRegistryService } from './services/model-registry.service'

// Structured logger
import { logger } from './lib/logger'

const app = new Hono()

// Load all plugins
loadPlugins()

// Middleware
app.use('*', honoLogger())
app.use('*', corsMiddleware)

// Cache control middleware - prevent stale API responses
app.use('/api/*', async (c, next) => {
  await next()
  c.header('Cache-Control', 'no-cache, no-store, must-revalidate')
  c.header('Pragma', 'no-cache')
  c.header('Expires', '0')
})

// Serve static files from uploads directory
app.use('/uploads/*', serveStatic({ root: './' }))

// Serve static files from storage directory (background-remover outputs)
app.use('/storage/*', serveStatic({ root: './' }))

// Health check routes (comprehensive)
app.route('/health', healthRoutes)
app.route('/api/health', healthRoutes)

// Core API Routes
app.route('/api/auth', authRoutes)
app.route('/api/credits', creditsRoutes)
app.route('/api/payment', paymentRoutes)
app.route('/api/devices', deviceRoutes)
app.route('/api/generations', generationRoutes)
app.route('/api/stats', statsRoutes)
app.route('/api/settings', settingsRoutes)

// NEW: Subscription & Quota Routes
app.route('/api/subscription', subscriptionRoutes)
app.route('/api/quota', quotaRoutes)
app.route('/api/models', modelStatsRoutes)


// Admin Routes (no auth for seeding)
app.route('/api/admin', adminRoutes)

// Get all apps for dashboard (filtered by user access)
app.get('/api/apps', authMiddleware, async (c) => {
  const userId = c.get('userId')

  // Get only apps user can access
  const apps = await accessControlService.getUserAccessibleApps(userId)

  logger.debug({
    userId,
    accessibleAppsCount: apps.length,
    apps: apps.map(a => a.name).join(', ')
  }, 'Dashboard apps retrieved')

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
    logger.info({
      plugin: plugin.name,
      route: plugin.routePrefix
    }, 'Plugin mounted')
  }
}

// 404 handler with detailed logging
app.notFound((c) => {
  const path = c.req.path
  const method = c.req.method

  // Log suspicious requests with hardcoded IDs or malformed URLs
  if (path.includes('_') && path.includes('/api/apps/')) {
    logger.warn({
      path,
      method,
      headers: Object.fromEntries(c.req.header() as any),
      query: c.req.query(),
      issue: 'Malformed URL with underscore detected'
    }, 'SUSPICIOUS 404: Underscore in API path')
  } else if (path.startsWith('/uploads/')) {
    // Log missing static files separately for easier debugging
    logger.warn({
      path,
      method,
      type: 'static_file_not_found'
    }, 'Static file not found')
  } else if (path.startsWith('/api/')) {
    // Log missing API endpoints
    logger.warn({
      path,
      method,
      type: 'api_endpoint_not_found'
    }, 'API endpoint not found')
  } else {
    logger.debug({
      path,
      method
    }, 'Route not found')
  }

  return c.json({ error: 'Not Found' }, 404)
})

// Error handler
app.onError((err, c) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    path: c.req.path,
    method: c.req.method
  }, 'Unhandled error in route')
  return c.json(
    {
      error: err.message || 'Internal Server Error',
    },
    500
  )
})

export default app