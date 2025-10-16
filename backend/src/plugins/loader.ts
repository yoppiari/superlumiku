import { pluginRegistry } from './registry'

// Import plugins
import videoMixerConfig from '../apps/video-mixer/plugin.config'
import videoMixerRoutes from '../apps/video-mixer/routes'

import carouselMixConfig from '../apps/carousel-mix/plugin.config'
import carouselMixRoutes from '../apps/carousel-mix/routes'

import loopingFlowConfig from '../apps/looping-flow/plugin.config'
import loopingFlowRoutes from '../apps/looping-flow/routes'

import avatarCreatorConfig from '../apps/avatar-creator/plugin.config'
import avatarCreatorRoutes from '../apps/avatar-creator/routes'

// TEMPORARILY DISABLED: Pose Generator has Redis connection at import time
// This breaks module loading during startup. Need to refactor queue initialization
// to be lazy-loaded instead of executed at import time.
// TODO: Fix pose-generator queue initialization to not connect on import
// import poseGeneratorConfig from '../apps/pose-generator/plugin.config'
// import poseGeneratorRoutes from '../apps/pose-generator/routes'

/**
 * Load all plugins into registry
 */
export function loadPlugins() {
  // Register each plugin
  pluginRegistry.register(videoMixerConfig, videoMixerRoutes)
  pluginRegistry.register(carouselMixConfig, carouselMixRoutes)
  pluginRegistry.register(loopingFlowConfig, loopingFlowRoutes)
  pluginRegistry.register(avatarCreatorConfig, avatarCreatorRoutes)
  // pluginRegistry.register(poseGeneratorConfig, poseGeneratorRoutes) // DISABLED - see comment above

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
