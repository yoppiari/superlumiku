import { PluginConfig } from '../../plugins/types'

/**
 * Pose Generator Plugin Configuration
 *
 * Generate studio-quality avatar poses for UMKM marketing campaigns.
 * Supports both gallery-based pose selection and text-to-pose AI generation.
 *
 * CREDIT SYSTEM:
 * - Base cost: 30 credits per pose
 * - Background changer: Additional 10 credits per pose
 * - Batch generation: Cost scales linearly with pose count
 *
 * FAIR USE POLICY:
 * - PAYG users: Pay per pose (30 credits = Rp 3,000)
 * - Unlimited tier: 100 poses/day limit
 */
export const poseGeneratorConfig: PluginConfig = {
  // Identity
  appId: 'pose-generator',
  name: 'Pose Generator',
  description: 'Generate studio-quality avatar poses for UMKM marketing',
  icon: 'user-square',
  version: '1.0.0',

  // Routing
  routePrefix: '/api/apps/pose-generator',

  // Credits Configuration
  // Reflects high computational cost of FLUX.1-dev + ControlNet generation
  credits: {
    // Gallery mode: Select poses from library
    // Cost: 30 credits per pose (includes FLUX generation + ControlNet guidance)
    generateFromGallery: 30,

    // Text mode: AI generates pose structure from description
    // Cost: 30 credits per pose (includes GPT pose analysis + FLUX generation)
    generateFromText: 30,

    // Background changer: Optional add-on feature
    // Cost: 10 credits per pose (includes SAM segmentation + inpainting/compositing)
    backgroundChanger: 10,

    // Upload custom background: Free (storage only)
    uploadBackground: 0,
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
    beta: false, // Production-ready feature
    comingSoon: false,
  },

  // Dashboard
  dashboard: {
    order: 3, // After Avatar Creator (1) and other core apps
    color: 'indigo', // Indigo theme for pose generator
    stats: {
      enabled: true,
      endpoint: '/api/apps/pose-generator/stats',
    },
  },
}

export default poseGeneratorConfig
