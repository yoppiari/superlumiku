import { VideoProvider, VideoModel } from './base.provider'

/**
 * Video Provider Registry
 *
 * Central registry for all video generation providers.
 * Allows easy lookup and management of providers and models.
 */

export class ProviderRegistry {
  private providers: Map<string, VideoProvider> = new Map()

  /**
   * Register a new provider
   */
  register(provider: VideoProvider) {
    if (this.providers.has(provider.name)) {
      console.warn(`⚠️  Provider ${provider.name} is already registered`)
      return
    }

    this.providers.set(provider.name, provider)
    console.log(`✅ Video Provider registered: ${provider.displayName} (${provider.models.length} models)`)
  }

  /**
   * Get provider by name
   */
  getProvider(name: string): VideoProvider | undefined {
    return this.providers.get(name)
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): VideoProvider[] {
    return Array.from(this.providers.values())
  }

  /**
   * Get all available models from all providers
   */
  getAllModels(): VideoModel[] {
    const models: VideoModel[] = []
    for (const provider of this.providers.values()) {
      models.push(...provider.models)
    }
    return models
  }

  /**
   * Get model by ID (searches across all providers)
   */
  getModelById(modelId: string): { provider: VideoProvider; model: VideoModel } | null {
    for (const provider of this.providers.values()) {
      const model = provider.getModel(modelId)
      if (model) {
        return { provider, model }
      }
    }
    return null
  }

  /**
   * Get models by provider name
   */
  getModelsByProvider(providerName: string): VideoModel[] {
    const provider = this.providers.get(providerName)
    return provider ? provider.models : []
  }

  /**
   * Check if a model exists
   */
  hasModel(modelId: string): boolean {
    return this.getModelById(modelId) !== null
  }

  /**
   * Get total number of providers
   */
  getProviderCount(): number {
    return this.providers.size
  }

  /**
   * Get total number of models
   */
  getModelCount(): number {
    return this.getAllModels().length
  }

  /**
   * Get registry statistics
   */
  getStats() {
    const providers = this.getAllProviders()
    const models = this.getAllModels()

    return {
      totalProviders: providers.length,
      totalModels: models.length,
      providers: providers.map(p => ({
        name: p.name,
        displayName: p.displayName,
        modelCount: p.models.length,
        models: p.models.map(m => m.id),
      })),
    }
  }
}

// Singleton instance
export const videoProviderRegistry = new ProviderRegistry()
