import { PluginConfig } from '../../plugins/types'

/**
 * Avatar Creator Plugin Configuration
 *
 * Create realistic AI avatars with full persona system
 * for use across Lumiku apps (pose generator, video, etc)
 *
 * CREDIT SYSTEM: DISABLED for now - will be added after full implementation
 */
export const avatarCreatorConfig: PluginConfig = {
  // Identity
  appId: 'avatar-creator',
  name: 'Avatar Creator',
  description: 'Create realistic AI avatars with persona for pose generation',
  icon: 'user-circle',
  version: '1.0.0',

  // Routing
  routePrefix: '/api/apps/avatar-creator',

  // Credits Configuration (DISABLED - no validation yet)
  // TODO: Enable after app is fully functional
  credits: {
    // Text-to-image generation (FLUX.1-dev + LoRA)
    generateAvatar: 0, // Was: 10 credits

    // Upload avatar + processing
    uploadAvatar: 0, // Was: 2 credits

    // From preset (generation)
    fromPreset: 0, // Was: 8 credits

    // From reference (img2img)
    fromReference: 0, // Was: 12 credits

    // Edit persona (free)
    editPersona: 0,
  },

  // Access Control
  access: {
    requiresAuth: true,
    requiresSubscription: false,
    minSubscriptionTier: null,
    allowedRoles: ['user', 'admin'],
  },

  // Features
  features: {
    enabled: true,
    beta: false, // Mature feature
    comingSoon: false,
  },

  // Dashboard
  dashboard: {
    order: 1, // High priority - show first
    color: 'purple', // Purple theme for avatar
    stats: {
      enabled: true,
      endpoint: '/api/apps/avatar-creator/stats',
    },
  },
}

export default avatarCreatorConfig
