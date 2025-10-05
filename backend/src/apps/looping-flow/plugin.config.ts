import { PluginConfig } from '../../plugins/types'
import { env } from '../../config/env'

/**
 * Check if running in local environment
 * Looping Flow is DISABLED in production due to large file outputs
 * waiting for cloud storage integration
 */
const isLocalEnvironment = (): boolean => {
  const origin = env.CORS_ORIGIN.toLowerCase()
  return origin.includes('localhost') || origin.includes('127.0.0.1')
}

export const loopingFlowConfig: PluginConfig = {
  appId: 'looping-flow',
  name: 'Looping Flow',
  description: 'Loop short videos into longer seamless videos',
  icon: 'film',
  version: '1.0.0',
  routePrefix: '/api/apps/looping-flow',
  credits: {
    createProject: 0,      // Free
    uploadVideo: 0,        // Free
    perThirtySeconds: 2,   // 2 credits per 30 seconds of output
  },
  access: {
    requiresAuth: true,
    requiresSubscription: false,
    minSubscriptionTier: null,
    allowedRoles: ['user', 'admin'],
  },
  features: {
    enabled: isLocalEnvironment(), // Only enabled in localhost
    beta: true,
    comingSoon: false,
  },
  dashboard: {
    order: 7,
    color: 'blue',
    stats: {
      enabled: true,
      endpoint: '/api/apps/looping-flow/stats',
    },
  },
}

export default loopingFlowConfig
