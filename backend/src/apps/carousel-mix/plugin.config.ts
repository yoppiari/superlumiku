import { PluginConfig } from '../../plugins/types'

export const carouselMixConfig: PluginConfig = {
  // Identity
  appId: 'carousel-mix',
  name: 'Carousel Mix',
  description: 'Generate carousel posts automatically with smart combinations',
  icon: 'layers',
  version: '1.0.0',

  // Routing
  routePrefix: '/api/apps/carousel-mix',

  // Credits per action (Updated pricing structure)
  credits: {
    baseGeneration: 5,         // Base cost per carousel
    perSlide: 2,               // Cost per slide in carousel
    perTextVariation: 1,       // Cost per unique text variation
    bulkMultiplier: 1.5,       // Multiplier for bulk generations (10+)
    highResolution: 5,         // For 1080p+ resolution (future)
    videoExport: 15,           // For MP4 export (future)
    pdfExport: 10,             // For PDF export (future)

    // Legacy pricing (deprecated - will be removed)
    generateCarousel2: 1,
    generateCarousel4: 2,
    generateCarousel6: 3,
    generateCarousel8: 4,
  },

  // Access control
  access: {
    requiresAuth: true,
    requiresSubscription: false,
    minSubscriptionTier: null,
    allowedRoles: ['user', 'admin'],
  },

  // Features
  features: {
    enabled: true,
    beta: false,
    comingSoon: false,
  },

  // Dashboard config
  dashboard: {
    order: 6,
    color: 'blue',
    stats: {
      enabled: true,
      endpoint: '/api/apps/carousel-mix/stats',
    },
  },
}

export default carouselMixConfig
