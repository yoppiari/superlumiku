import { pluginRegistry } from './registry'

// Import plugins
import videoMixerConfig from '../apps/video-mixer/plugin.config'
import videoMixerRoutes from '../apps/video-mixer/routes'

import carouselMixConfig from '../apps/carousel-mix/plugin.config'
import carouselMixRoutes from '../apps/carousel-mix/routes'

import loopingFlowConfig from '../apps/looping-flow/plugin.config'
import loopingFlowRoutes from '../apps/looping-flow/routes'

/**
 * Load all plugins into registry
 */
export function loadPlugins() {
  // Register each plugin
  pluginRegistry.register(videoMixerConfig, videoMixerRoutes)
  pluginRegistry.register(carouselMixConfig, carouselMixRoutes)
  pluginRegistry.register(loopingFlowConfig, loopingFlowRoutes)

  console.log(`\n📦 Loaded ${pluginRegistry.getAll().length} plugins`)
  console.log(`✅ Enabled: ${pluginRegistry.getEnabled().length}`)
  console.log(`🚀 Dashboard apps: ${pluginRegistry.getDashboardApps().length}`)

  // Warning for disabled Looping Flow in production
  if (!loopingFlowConfig.features.enabled) {
    console.log(`⚠️  Looping Flow: DISABLED (Production mode)`)
    console.log(`   Reason: Large file outputs - localhost only until cloud storage ready\n`)
  } else {
    console.log('')
  }
}
