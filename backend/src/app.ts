import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { corsMiddleware } from './middleware/cors.middleware'
import authRoutes from './routes/auth.routes'
import creditRoutes from './routes/credit.routes'
import paymentRoutes from './routes/payment.routes'
import creditsRoutes from './routes/credits.routes'
import deviceRoutes from './routes/device.routes'

// Plugin System
import { loadPlugins } from './plugins/loader'
import { pluginRegistry } from './plugins/registry'

const app = new Hono()

// Load all plugins
loadPlugins()

// Middleware
app.use('*', logger())
app.use('*', corsMiddleware)

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Core API Routes
app.route('/api/auth', authRoutes)
app.route('/api/credits', creditsRoutes)
app.route('/api/payment', paymentRoutes)
app.route('/api/devices', deviceRoutes)

// Get all apps for dashboard
app.get('/api/apps', (c) => {
  const dashboardApps = pluginRegistry.getDashboardApps()
  console.log(`📱 Dashboard Apps Request:`)
  console.log(`  - Total plugins: ${pluginRegistry.getAll().length}`)
  console.log(`  - Enabled: ${pluginRegistry.getEnabled().length}`)
  console.log(`  - Dashboard apps: ${dashboardApps.length}`)

  const apps = dashboardApps.map(plugin => ({
    appId: plugin.appId,
    name: plugin.name,
    description: plugin.description,
    icon: plugin.icon,
    color: plugin.dashboard.color,
    order: plugin.dashboard.order,
    beta: plugin.features.beta,
    comingSoon: plugin.features.comingSoon,
    requiresSubscription: plugin.access.requiresSubscription,
    minSubscriptionTier: plugin.access.minSubscriptionTier,
  }))

  console.log(`  - Returning ${apps.length} apps:`, apps.map(a => a.name).join(', '))
  return c.json({ apps })
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