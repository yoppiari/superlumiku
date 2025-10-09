import { PluginConfig } from '../../plugins/types'

/**
 * Video Generator Plugin Configuration
 *
 * Pricing Strategy:
 * - 1 Credit = Rp 50
 * - Markup: 2.5x - 3x dari biaya provider
 * - Base pricing per model (dalam credits)
 * - Modifiers untuk resolution, duration, dan image inputs
 */

export const videoGeneratorConfig: PluginConfig = {
  // Identity
  appId: 'video-generator',
  name: 'AI Video Generator',
  description: 'Generate videos from text and images using AI models',
  icon: 'video',
  version: '1.0.0',

  // Routing
  routePrefix: '/api/apps/video-generator',

  // Credits per action
  credits: {
    // Project Management (Free)
    createProject: 0,
    uploadImage: 0,

    // ========================================
    // ModelsLab Models (Base Credits)
    // ========================================
    // 🧪 TRIAL MODE - Credits set to 0 for testing
    // Updated pricing based on ModelsLab official pricing (2025)
    // Exchange rate: $1 = Rp 15,800
    // Markup: 2.5x - 3x dari biaya provider

    // Google Veo 3 (8s, 720p base)
    // Production: 2,500 credits | Trial: 0 credits
    'veo3': 0,

    // Google Veo 2 (8s, 720p base)
    // Production: 2,200 credits | Trial: 0 credits
    'veo2': 0,

    // Text-to-Video Ultra (5s, 720p base) - PREMIUM MODEL
    // Production: 4,000 credits | Trial: 0 credits
    'text-to-video-ultra': 0,

    // Wan 2.2 T2V (5s, 720p base)
    // Production: 350 credits | Trial: 0 credits
    'wan-2.2-t2v': 0,

    // Seedance T2V (5s, 720p base)
    // Production: 650 credits | Trial: 0 credits
    'seedance-t2v': 0,

    // ========================================
    // EdenAI Models (Base Credits)
    // ========================================
    // 🧪 TRIAL MODE - Credits set to 0 for testing

    // Runway Gen-3 (10s, 720p base)
    // Production: 750 credits | Trial: 0 credits
    'runway-gen-3': 0,

    // Kling 2.5 (5s, 720p base)
    // Production: 500 credits | Trial: 0 credits
    'kling-2.5': 0,

    // Amazon Nova Reel (6s, 720p base)
    // Production: 400 credits | Trial: 0 credits
    'amazon-nova-reel': 0,

    // ========================================
    // Resolution Modifiers (% increase)
    // ========================================

    resolution1080p: 30,  // +30% credits
    resolution4k: 100,    // +100% credits (2x)

    // ========================================
    // Duration Modifiers
    // ========================================

    // Per 5 seconds additional: +50% of base credits
    durationPer5Seconds: 50,

    // ========================================
    // Image Input Modifiers (% increase)
    // ========================================

    startImage: 20,       // +20% for image-to-video
    endImage: 30,         // +30% for video continuation
    bothImages: 40,       // +40% for both start and end images

    // ========================================
    // Provider-specific features
    // ========================================

    enhancedPrompt: 5,    // +5 credits for AI prompt enhancement (if supported)
    audioGeneration: 10,  // +10 credits for audio generation (if supported)
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
    enabled: true,        // Enabled in both dev and production
    beta: false,          // Stable feature
    comingSoon: false,
  },

  // Dashboard config
  dashboard: {
    order: 4,             // Display order in dashboard
    color: 'blue',        // Blue theme for video generation
    stats: {
      enabled: true,
      endpoint: '/api/apps/video-generator/stats',
    },
  },
}

export default videoGeneratorConfig
