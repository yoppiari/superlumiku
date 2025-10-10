import { PluginConfig } from '../../plugins/types'

export const avatarGeneratorConfig: PluginConfig = {
  appId: 'avatar-generator',
  name: 'Avatar & Pose Generator',
  description: 'Generate avatars with custom poses using AI',
  icon: 'user-circle',
  version: '1.0.0',
  routePrefix: '/api/apps/avatar-generator',
  credits: {
    // Generation credits
    generateAvatar: 5,              // Base cost per avatar generation
    hdQuality: 2,                   // +2 for HD quality
    fastGeneration: 3,              // +3 for priority processing

    // Pose features
    customPose: 0,                  // FREE - Select from 800+ poses
    randomPose: 0,                  // FREE - Get random pose
  },
  access: {
    requiresAuth: true,
    requiresSubscription: false,
    minSubscriptionTier: null,
    allowedRoles: ['user', 'admin'],
  },
  features: {
    enabled: true,
    beta: true,                     // Mark as beta during development
    comingSoon: false,
  },
  dashboard: {
    order: 2,                       // Show near top of dashboard
    color: 'purple',                // Purple theme
    stats: {
      enabled: true,
      endpoint: '/api/apps/avatar-generator/stats',
    },
  },
}

export default avatarGeneratorConfig
