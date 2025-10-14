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

  // Credits Configuration - ENABLED
  // Credit costs reflect the computational expense of each operation
  credits: {
    // Text-to-image generation (FLUX.1-dev + LoRA)
    // High cost due to expensive FLUX API call (~$0.05 per generation)
    generateAvatar: 10,

    // Upload avatar + processing
    // File storage + thumbnail generation + image processing
    uploadAvatar: 2,

    // From preset (generation)
    // Slightly cheaper as prompt is pre-optimized
    fromPreset: 8,

    // From reference (img2img)
    // Most expensive due to img2img processing
    fromReference: 12,

    // Edit persona (free)
    // Metadata-only operation, no computation
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
