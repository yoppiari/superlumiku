import { videoProviderRegistry } from './registry'
import { ModelsLabProvider } from './modelslab.provider'
import { EdenAIProvider } from './edenai.provider'

/**
 * Load and register all video generation providers
 *
 * To add a new provider:
 * 1. Create provider class (e.g., replicate.provider.ts)
 * 2. Import it here
 * 3. Add one line: videoProviderRegistry.register(new YourProvider())
 * 4. Done! Provider is automatically available everywhere
 */

export function loadVideoProviders() {
  console.log('\n📦 Loading Video Generation Providers...')

  // Register ModelsLab (1 model: Wan 2.2)
  videoProviderRegistry.register(new ModelsLabProvider())

  // EdenAI temporarily disabled - using only ModelsLab for now
  // videoProviderRegistry.register(new EdenAIProvider())

  // ========================================
  // Add more providers here (super easy!)
  // ========================================
  //
  // Example:
  // import { ReplicateProvider } from './replicate.provider'
  // videoProviderRegistry.register(new ReplicateProvider())
  //

  // Print summary
  const stats = videoProviderRegistry.getStats()
  console.log(`\n✅ Loaded ${stats.totalProviders} video providers with ${stats.totalModels} total models:`)

  for (const provider of stats.providers) {
    console.log(`   - ${provider.displayName}: ${provider.modelCount} models (${provider.models.join(', ')})`)
  }

  console.log('')
}

// Export registry for use in services
export { videoProviderRegistry }
