import { Hono } from 'hono'
import { PluginConfig } from './types'

export class PluginRegistry {
  private plugins: Map<string, PluginConfig> = new Map()
  private routes: Map<string, Hono<any>> = new Map()

  /**
   * Register a new plugin app
   */
  register(config: PluginConfig, routes: Hono<any>) {
    if (this.plugins.has(config.appId)) {
      throw new Error(`Plugin ${config.appId} is already registered`)
    }

    this.plugins.set(config.appId, config)
    this.routes.set(config.appId, routes)

    console.log(`✅ Plugin registered: ${config.name} (${config.appId})`)
  }

  /**
   * Get all registered plugins
   */
  getAll(): PluginConfig[] {
    return Array.from(this.plugins.values())
  }

  /**
   * Get plugin by appId
   */
  get(appId: string): PluginConfig | undefined {
    return this.plugins.get(appId)
  }

  /**
   * Get routes for a plugin
   */
  getRoutes(appId: string): Hono<any> | undefined {
    return this.routes.get(appId)
  }

  /**
   * Get enabled plugins only
   */
  getEnabled(): PluginConfig[] {
    return this.getAll().filter(p => p.features.enabled)
  }

  /**
   * Get plugins for dashboard (enabled, not coming soon)
   */
  getDashboardApps(): PluginConfig[] {
    return this.getAll()
      .filter(p => p.features.enabled && !p.features.comingSoon)
      .sort((a, b) => a.dashboard.order - b.dashboard.order)
  }
}

// Singleton instance
export const pluginRegistry = new PluginRegistry()
