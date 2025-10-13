import { pluginRegistry } from './registry'

// Import plugins
import videoMixerConfig from '../apps/video-mixer/plugin.config'
import videoMixerRoutes from '../apps/video-mixer/routes'

import carouselMixConfig from '../apps/carousel-mix/plugin.config'
import carouselMixRoutes from '../apps/carousel-mix/routes'

import loopingFlowConfig from '../apps/looping-flow/plugin.config'
import loopingFlowRoutes from '../apps/looping-flow/routes'

import videoGeneratorConfig from '../apps/video-generator/plugin.config'
import videoGeneratorRoutes from '../apps/video-generator/routes'

import { posterEditorConfig } from '../apps/poster-editor/plugin.config'
import posterEditorRoutes from '../apps/poster-editor/routes'

// NEW: Avatar & Pose Generator (Split Apps) - Replaced old avatar-generator
import avatarCreatorConfig from '../apps/avatar-creator/plugin.config'
import avatarCreatorRoutes from '../apps/avatar-creator/routes'

import poseGeneratorConfig from '../apps/pose-generator/plugin.config'
import poseGeneratorRoutes from '../apps/pose-generator/routes'

/**
 * Load all plugins into registry
 */
export function loadPlugins() {
  // Register each plugin
  pluginRegistry.register(videoMixerConfig, videoMixerRoutes)
  pluginRegistry.register(carouselMixConfig, carouselMixRoutes)
  pluginRegistry.register(loopingFlowConfig, loopingFlowRoutes)
  pluginRegistry.register(videoGeneratorConfig, videoGeneratorRoutes)
  pluginRegistry.register(posterEditorConfig, posterEditorRoutes)

  // Avatar & Pose Generator (Split into 2 separate apps)
  pluginRegistry.register(avatarCreatorConfig, avatarCreatorRoutes)
  pluginRegistry.register(poseGeneratorConfig, poseGeneratorRoutes)

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
