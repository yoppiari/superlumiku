import { PluginConfig } from '../../plugins/types'

export const videoMixerConfig: PluginConfig = {
  appId: 'video-mixer',
  name: 'Video Mixer',
  description: 'Mix multiple short videos into longer videos automatically',
  icon: 'video',
  version: '1.0.0',
  routePrefix: '/api/apps/video-mixer',
  credits: {
    // Project management
    createProject: 0,
    uploadVideo: 0,
    createGroup: 0,

    // Generation settings (per video generated)
    baseGeneration: 1,           // Base cost per video

    // Mixing options (Anti-Fingerprinting)
    orderMixing: 1,              // +1 if enabled
    differentStart: 0,           // FREE - Each variant starts uniquely
    groupMixingRandom: 2,        // +2 if random mode
    speedVariations: 1,          // +1 if enabled

    // Quality upgrades (per video generated)
    hdResolution: 2,             // 720p +2
    fullHdResolution: 5,         // 1080p +5
    fourKResolution: 10,         // 4K +10
    highBitrate: 2,              // High quality +2
    highFrameRate: 3,            // 60 FPS +3
    aspectRatioConversion: 1,    // If different from source +1

    // Duration features
    smartDistribution: 1,        // +1 if enabled
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
    order: 5,
    color: 'blue',
    stats: {
      enabled: true,
      endpoint: '/api/apps/video-mixer/stats',
    },
  },
}

export default videoMixerConfig
