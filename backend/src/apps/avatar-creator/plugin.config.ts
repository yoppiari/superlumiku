import { PluginConfig } from '../../plugins/types'

export const avatarCreatorConfig: PluginConfig = {
  appId: 'avatar-creator',
  name: 'Avatar Creator',
  description: 'Create and manage AI avatars for pose generation',
  icon: 'user-circle',
  version: '1.0.0',
  routePrefix: '/api/apps/avatar-creator',

  credits: {
    createAvatar: 10,      // Upload + process avatar
    enhanceAvatar: 5,      // Face enhancement
    deleteAvatar: 0,       // Free to delete
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
    order: 2,              // After Video Mixer
    color: 'purple',
    stats: {
      enabled: true,
      endpoint: '/api/apps/avatar-creator/stats',
    },
  },
}

export default avatarCreatorConfig
