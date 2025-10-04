import { PluginConfig } from '../../plugins/types'

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
    enabled: true,
    beta: false,
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
