export interface PluginConfig {
  // App Identity
  appId: string                       // 'project-manager', 'invoice-generator'
  name: string                        // 'Project Manager'
  description: string                 // 'Kelola proyek dan tim dengan mudah'
  icon: string                        // Lucide icon name: 'target', 'file-text'
  version: string                     // '1.0.0'

  // Routing
  routePrefix: string                 // '/api/apps/project-manager'

  // Credits Configuration
  credits: Record<string, number>     // { createProject: 5, updateProject: 2 }

  // Access Control
  access: {
    requiresAuth: boolean             // Requires login?
    requiresSubscription: boolean     // Subscription only?
    minSubscriptionTier: string | null // 'basic' | 'pro' | 'enterprise'
    allowedRoles: string[]            // ['user', 'admin']
  }

  // Features
  features: {
    enabled: boolean                  // Is app active?
    beta: boolean                     // Show beta badge?
    comingSoon: boolean               // Show coming soon?
  }

  // Dashboard
  dashboard: {
    order: number                     // Display order
    color: string                     // Card color
    stats: {
      enabled: boolean                // Show usage stats?
      endpoint: string                // '/api/apps/project-manager/stats'
    }
  }
}
