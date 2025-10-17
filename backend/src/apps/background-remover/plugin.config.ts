import { PluginConfig } from '../../plugins/types'

export const backgroundRemoverConfig: PluginConfig = {
  // Identity
  appId: 'background-remover',
  name: 'Background Remover Pro',
  description: 'AI-powered background removal with 4 quality tiers',
  icon: 'eraser',
  version: '1.0.0',

  // Routing
  routePrefix: '/api/background-remover',

  // Credits (per tier)
  credits: {
    // Tier pricing (all tiers use HuggingFace)
    basic: 3,           // RMBG-1.4
    standard: 8,        // RMBG-2.0
    professional: 15,   // RMBG-2.0 (priority processing)
    industry: 25,       // RMBG-2.0 (premium quality)

    // Subscription plans (monthly, Rupiah)
    subscriptionStarter: 99000,
    subscriptionPro: 299000,
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
    beta: false,
    comingSoon: false,
  },

  // Dashboard
  dashboard: {
    order: 15,
    color: 'purple',
    stats: {
      enabled: true,
      endpoint: '/api/background-remover/stats',
    },
  },

  // Tier Configuration
  tiers: {
    basic: {
      name: 'Basic',
      credits: 3,
      aiProvider: 'huggingface',
      modelName: 'briaai/RMBG-1.4',
      description: 'Fast background removal for simple images',
      processingTime: '2-5 seconds',
    },
    standard: {
      name: 'Standard',
      credits: 8,
      aiProvider: 'huggingface',
      modelName: 'briaai/RMBG-2.0',
      description: 'Enhanced quality for complex backgrounds',
      processingTime: '5-10 seconds',
    },
    professional: {
      name: 'Professional',
      credits: 15,
      aiProvider: 'huggingface',
      modelName: 'briaai/RMBG-2.0',
      description: 'High-precision removal with priority processing',
      processingTime: '5-10 seconds',
    },
    industry: {
      name: 'Industry',
      credits: 25,
      aiProvider: 'huggingface',
      modelName: 'briaai/RMBG-2.0',
      description: 'Premium quality with highest priority',
      processingTime: '5-10 seconds',
    },
  },

  // Volume Discounts
  discounts: {
    tier1: { min: 20, max: 50, percentage: 5 },
    tier2: { min: 51, max: 100, percentage: 10 },
    tier3: { min: 101, max: 200, percentage: 15 },
    tier4: { min: 201, max: 500, percentage: 20 },
  },

  // Subscription Plans
  subscriptionPlans: {
    starter: {
      name: 'Starter',
      price: 99000,
      dailyQuota: 50,
      professionalDailyQuota: 0,
      allowedTiers: ['basic', 'standard'],
      features: [
        'Up to 50 removals per day',
        'Basic & Standard quality',
        'Batch processing',
        'Download as ZIP',
      ],
    },
    pro: {
      name: 'Pro',
      price: 299000,
      dailyQuota: 200,
      professionalDailyQuota: 50,
      allowedTiers: ['basic', 'standard', 'professional', 'industry'],
      features: [
        'Up to 200 removals per day',
        'All quality tiers',
        'Professional tier limited to 50/day',
        'Priority processing',
        'Batch processing',
        'Download as ZIP',
      ],
    },
  },

  // Batch Processing
  batch: {
    maxFiles: 500,
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    concurrency: {
      min: 5,
      max: 20,
    },
  },

  // Queue Configuration
  queue: {
    name: 'background-remover-batch',
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // 5 seconds
    },
  },
}

export default backgroundRemoverConfig
