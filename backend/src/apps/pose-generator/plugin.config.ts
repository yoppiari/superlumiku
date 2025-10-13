import { PluginConfig } from '../../plugins/types'

export const poseGeneratorConfig: PluginConfig = {
  appId: 'pose-generator',
  name: 'Pose Generator',
  description: 'Generate professional poses with AI using your avatars',
  icon: 'sparkles',
  version: '1.0.0',
  routePrefix: '/api/apps/pose-generator',

  credits: {
    generatePose: 5,           // Per pose (SD quality)
    generatePoseHD: 8,         // HD quality
    batchGeneration: 3,        // Per pose in batch (discount)
    fashionEnhancement: 2,     // Add fashion items
    backgroundReplacement: 3,  // Custom background
    professionTheme: 2,        // Add profession theme
  },

  access: {
    requiresAuth: true,
    requiresSubscription: false,
    minSubscriptionTier: null,
    allowedRoles: ['user', 'admin'],
  },

  features: {
    enabled: true,
    beta: false,
    comingSoon: false,
  },

  dashboard: {
    order: 3,              // After Avatar Creator
    color: 'blue',
    stats: {
      enabled: true,
      endpoint: '/api/apps/pose-generator/stats',
    },
  },
}

export default poseGeneratorConfig
