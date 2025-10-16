/**
 * P2 PERFORMANCE: Feature Flags System
 *
 * Replace commented/disabled code with feature flags for:
 * - Gradual feature rollouts
 * - A/B testing
 * - Emergency feature disabling
 * - Environment-specific features
 *
 * Benefits:
 * - Deploy code without enabling features
 * - Disable problematic features without redeployment
 * - Test features with subset of users
 * - Reduce risk of new features
 *
 * Usage:
 * ```typescript
 * if (featureFlags.POSE_GENERATOR_ENABLED) {
 *   // Load pose generator
 * }
 *
 * if (featureFlags.isEnabled('NEW_DASHBOARD', user)) {
 *   // Show new dashboard
 * }
 * ```
 */

/**
 * Parse boolean environment variable with default
 */
function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key]
  if (value === undefined || value === null || value === '') {
    return defaultValue
  }
  return value.toLowerCase() === 'true' || value === '1'
}

/**
 * Parse number environment variable with default
 */
function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key]
  if (value === undefined || value === null || value === '') {
    return defaultValue
  }
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? defaultValue : parsed
}

/**
 * Parse string array environment variable with default
 */
function getEnvArray(key: string, defaultValue: string[]): string[] {
  const value = process.env[key]
  if (value === undefined || value === null || value === '') {
    return defaultValue
  }
  return value.split(',').map((s) => s.trim()).filter(Boolean)
}

/**
 * Feature Flag Configuration
 */
export interface FeatureFlagConfig {
  // Core Features
  POSE_GENERATOR_ENABLED: boolean
  AVATAR_CREATOR_ENABLED: boolean
  VIDEO_MIXER_ENABLED: boolean
  CAROUSEL_MIX_ENABLED: boolean
  LOOPING_FLOW_ENABLED: boolean

  // Infrastructure Features
  WEBSOCKET_ENABLED: boolean
  REDIS_CACHE_ENABLED: boolean
  CIRCUIT_BREAKER_ENABLED: boolean
  RATE_LIMITING_ENABLED: boolean

  // UI Features
  NEW_DASHBOARD_ENABLED: boolean
  ADVANCED_ANALYTICS_ENABLED: boolean
  DARK_MODE_ENABLED: boolean

  // AI Features
  BACKGROUND_CHANGER_ENABLED: boolean
  CONTROLNET_ENABLED: boolean
  TEXT_TO_POSE_ENABLED: boolean

  // Experimental Features
  EXPERIMENTAL_FEATURES_ENABLED: boolean
  DEBUG_MODE_ENABLED: boolean

  // Feature Rollout Percentages (0-100)
  NEW_DASHBOARD_ROLLOUT_PERCENTAGE: number
  BACKGROUND_CHANGER_ROLLOUT_PERCENTAGE: number

  // Beta User Access
  BETA_USER_IDS: string[]
  BETA_USER_TAGS: string[]
}

/**
 * Feature Flags Service
 */
export class FeatureFlags {
  private config: FeatureFlagConfig

  constructor() {
    // Load configuration from environment variables
    this.config = {
      // Core Features (default: enabled in production)
      POSE_GENERATOR_ENABLED: getEnvBoolean('FEATURE_POSE_GENERATOR', true),
      AVATAR_CREATOR_ENABLED: getEnvBoolean('FEATURE_AVATAR_CREATOR', true),
      VIDEO_MIXER_ENABLED: getEnvBoolean('FEATURE_VIDEO_MIXER', true),
      CAROUSEL_MIX_ENABLED: getEnvBoolean('FEATURE_CAROUSEL_MIX', true),
      LOOPING_FLOW_ENABLED: getEnvBoolean('FEATURE_LOOPING_FLOW', true),

      // Infrastructure Features (default: enabled)
      WEBSOCKET_ENABLED: getEnvBoolean('FEATURE_WEBSOCKET', true),
      REDIS_CACHE_ENABLED: getEnvBoolean('FEATURE_REDIS_CACHE', true),
      CIRCUIT_BREAKER_ENABLED: getEnvBoolean('FEATURE_CIRCUIT_BREAKER', true),
      RATE_LIMITING_ENABLED: getEnvBoolean('FEATURE_RATE_LIMITING', true),

      // UI Features (default: disabled for gradual rollout)
      NEW_DASHBOARD_ENABLED: getEnvBoolean('FEATURE_NEW_DASHBOARD', false),
      ADVANCED_ANALYTICS_ENABLED: getEnvBoolean('FEATURE_ADVANCED_ANALYTICS', false),
      DARK_MODE_ENABLED: getEnvBoolean('FEATURE_DARK_MODE', true),

      // AI Features (default: enabled)
      BACKGROUND_CHANGER_ENABLED: getEnvBoolean('FEATURE_BACKGROUND_CHANGER', true),
      CONTROLNET_ENABLED: getEnvBoolean('FEATURE_CONTROLNET', true),
      TEXT_TO_POSE_ENABLED: getEnvBoolean('FEATURE_TEXT_TO_POSE', true),

      // Experimental Features (default: disabled)
      EXPERIMENTAL_FEATURES_ENABLED: getEnvBoolean('FEATURE_EXPERIMENTAL', false),
      DEBUG_MODE_ENABLED: getEnvBoolean('FEATURE_DEBUG_MODE', process.env.NODE_ENV === 'development'),

      // Feature Rollout Percentages
      NEW_DASHBOARD_ROLLOUT_PERCENTAGE: getEnvNumber('ROLLOUT_NEW_DASHBOARD', 0),
      BACKGROUND_CHANGER_ROLLOUT_PERCENTAGE: getEnvNumber('ROLLOUT_BACKGROUND_CHANGER', 100),

      // Beta User Access
      BETA_USER_IDS: getEnvArray('BETA_USER_IDS', []),
      BETA_USER_TAGS: getEnvArray('BETA_USER_TAGS', ['beta_tester', 'early_access']),
    }

    console.log('[FeatureFlags] Initialized with configuration:')
    console.log(`  - Pose Generator: ${this.config.POSE_GENERATOR_ENABLED}`)
    console.log(`  - WebSocket: ${this.config.WEBSOCKET_ENABLED}`)
    console.log(`  - Redis Cache: ${this.config.REDIS_CACHE_ENABLED}`)
    console.log(`  - Circuit Breaker: ${this.config.CIRCUIT_BREAKER_ENABLED}`)
    console.log(`  - New Dashboard: ${this.config.NEW_DASHBOARD_ENABLED} (${this.config.NEW_DASHBOARD_ROLLOUT_PERCENTAGE}% rollout)`)
    console.log(`  - Experimental: ${this.config.EXPERIMENTAL_FEATURES_ENABLED}`)
  }

  /**
   * Check if feature is enabled globally
   */
  isEnabled(featureName: keyof FeatureFlagConfig): boolean {
    const value = this.config[featureName]
    return typeof value === 'boolean' ? value : false
  }

  /**
   * Check if feature is enabled for specific user
   * Supports percentage rollout and beta user access
   */
  isEnabledForUser(
    featureName: keyof FeatureFlagConfig,
    userId?: string,
    userTags?: string[]
  ): boolean {
    // Check global flag first
    if (!this.isEnabled(featureName)) {
      return false
    }

    // Check if user is beta user
    if (userId && this.isBetaUser(userId, userTags)) {
      return true
    }

    // Check percentage rollout
    const rolloutKey = `${featureName}_ROLLOUT_PERCENTAGE` as keyof FeatureFlagConfig
    const rolloutPercentage = this.config[rolloutKey]

    if (typeof rolloutPercentage === 'number' && userId) {
      const userHash = this.hashUserId(userId)
      const userPercentage = userHash % 100
      return userPercentage < rolloutPercentage
    }

    return true
  }

  /**
   * Check if user is beta user
   */
  isBetaUser(userId: string, userTags?: string[]): boolean {
    // Check if user ID is in beta list
    if (this.config.BETA_USER_IDS.includes(userId)) {
      return true
    }

    // Check if user has beta tags
    if (userTags && userTags.length > 0) {
      return this.config.BETA_USER_TAGS.some((tag) => userTags.includes(tag))
    }

    return false
  }

  /**
   * Simple hash function for user ID
   * Used for consistent percentage rollout
   */
  private hashUserId(userId: string): number {
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  /**
   * Get all feature flags
   */
  getAll(): FeatureFlagConfig {
    return { ...this.config }
  }

  /**
   * Get feature flag value
   */
  get<K extends keyof FeatureFlagConfig>(key: K): FeatureFlagConfig[K] {
    return this.config[key]
  }

  /**
   * Dynamically enable/disable feature (runtime)
   * Useful for emergency feature disabling
   */
  setFlag(featureName: keyof FeatureFlagConfig, value: boolean): void {
    if (typeof this.config[featureName] === 'boolean') {
      ;(this.config[featureName] as any) = value
      console.log(`[FeatureFlags] ${featureName} set to ${value}`)
    }
  }

  /**
   * Check multiple features at once
   */
  areEnabled(...features: Array<keyof FeatureFlagConfig>): boolean {
    return features.every((feature) => this.isEnabled(feature))
  }

  /**
   * Check if any of the features is enabled
   */
  isAnyEnabled(...features: Array<keyof FeatureFlagConfig>): boolean {
    return features.some((feature) => this.isEnabled(feature))
  }
}

// Singleton instance
export const featureFlags = new FeatureFlags()

/**
 * Feature flag middleware for Hono
 */
export function requireFeature(...features: Array<keyof FeatureFlagConfig>) {
  return async (c: any, next: any) => {
    const allEnabled = features.every((feature) => featureFlags.isEnabled(feature))

    if (!allEnabled) {
      const disabled = features.filter((feature) => !featureFlags.isEnabled(feature))
      return c.json(
        {
          error: 'Feature not available',
          message: `The following features are disabled: ${disabled.join(', ')}`,
        },
        503
      )
    }

    await next()
  }
}

/**
 * Feature flag middleware for user-specific features
 */
export function requireFeatureForUser(...features: Array<keyof FeatureFlagConfig>) {
  return async (c: any, next: any) => {
    const userId = c.get('userId') // Assumes auth middleware sets userId
    const user = c.get('user') // Assumes auth middleware sets user object

    const userTags = user?.userTags ? JSON.parse(user.userTags) : []

    const allEnabled = features.every((feature) =>
      featureFlags.isEnabledForUser(feature, userId, userTags)
    )

    if (!allEnabled) {
      const disabled = features.filter(
        (feature) => !featureFlags.isEnabledForUser(feature, userId, userTags)
      )
      return c.json(
        {
          error: 'Feature not available',
          message: `The following features are not available for your account: ${disabled.join(', ')}`,
        },
        403
      )
    }

    await next()
  }
}

// Export for easy access
export default featureFlags
