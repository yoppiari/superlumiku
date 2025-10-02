import { pluginRegistry } from './registry'

// Import plugins
import videoMixerConfig from '../apps/video-mixer/plugin.config'
import videoMixerRoutes from '../apps/video-mixer/routes'

/**
 * Load all plugins into registry
 */
export function loadPlugins() {
  // Register each plugin
  pluginRegistry.register(videoMixerConfig, videoMixerRoutes)

  console.log(`\n📦 Loaded ${pluginRegistry.getAll().length} plugins`)
  console.log(`✅ Enabled: ${pluginRegistry.getEnabled().length}`)
  console.log(`🚀 Dashboard apps: ${pluginRegistry.getDashboardApps().length}\n`)
}
