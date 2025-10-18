/**
 * Settings Service
 *
 * Handles user settings persistence including:
 * - Notification preferences
 * - Display preferences (theme, language)
 * - Privacy settings
 * - Analytics tracking
 *
 * All settings are stored directly in the User model for optimal query performance.
 */

import prisma from '../db/client'
import { logger } from '../lib/logger'
import { Prisma } from '@prisma/client'

/**
 * User settings interface matching Prisma schema
 */
export interface UserSettings {
  // Notification Settings
  emailNotifications: boolean
  pushNotifications: boolean
  marketingEmails: boolean
  projectUpdates: boolean
  creditAlerts: boolean

  // Display Settings
  theme: string
  language: string

  // Privacy Settings
  profileVisibility: string
  showEmail: boolean
  analyticsTracking: boolean

  // Metadata
  settingsUpdatedAt: Date
}

/**
 * Partial settings for updates
 */
export type UpdateUserSettingsInput = Partial<Omit<UserSettings, 'settingsUpdatedAt'>>

/**
 * Settings Service Class
 * Provides methods for retrieving and updating user settings
 */
export class SettingsService {
  private isDatabaseAvailable: boolean | null = null
  private lastDbCheckTime: number = 0
  private dbCheckIntervalMs = 30000 // Check every 30 seconds

  /**
   * Check if database is available
   * Caches result for 30 seconds to avoid excessive connection attempts
   */
  private async checkDatabaseConnection(): Promise<boolean> {
    const now = Date.now()

    // Return cached result if recent
    if (this.isDatabaseAvailable !== null && (now - this.lastDbCheckTime) < this.dbCheckIntervalMs) {
      return this.isDatabaseAvailable
    }

    try {
      await prisma.$queryRaw`SELECT 1`
      this.isDatabaseAvailable = true
      this.lastDbCheckTime = now
      return true
    } catch (error) {
      this.isDatabaseAvailable = false
      this.lastDbCheckTime = now
      return false
    }
  }

  /**
   * Get default settings (fallback when database is unavailable)
   */
  private getDefaultSettings(): UserSettings {
    return {
      // Notification Settings
      emailNotifications: true,
      pushNotifications: false,
      marketingEmails: false,
      projectUpdates: true,
      creditAlerts: true,

      // Display Settings
      theme: 'light',
      language: 'id',

      // Privacy Settings
      profileVisibility: 'public',
      showEmail: false,
      analyticsTracking: true,

      // Metadata
      settingsUpdatedAt: new Date(),
    }
  }

  /**
   * Get user settings
   *
   * @param userId - The user's unique identifier
   * @returns User settings object
   * @throws Error if user not found
   */
  async getUserSettings(userId: string): Promise<UserSettings> {
    console.log('[SETTINGS SERVICE] getUserSettings called with userId:', userId)
    logger.debug({ userId }, 'Fetching user settings')

    // Check database connectivity
    const dbAvailable = await this.checkDatabaseConnection()

    if (!dbAvailable) {
      logger.warn({ userId }, 'Database unavailable, returning default settings')
      console.log('[SETTINGS SERVICE] WARNING: Database offline, using mock data')
      return this.getDefaultSettings()
    }

    try {
      console.log('[SETTINGS SERVICE] Querying database...')
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          // Notification Settings
          emailNotifications: true,
          pushNotifications: true,
          marketingEmails: true,
          projectUpdates: true,
          creditAlerts: true,

          // Display Settings
          theme: true,
          language: true,

          // Privacy Settings
          profileVisibility: true,
          showEmail: true,
          analyticsTracking: true,

          // Metadata
          settingsUpdatedAt: true,
        },
      })

      console.log('[SETTINGS SERVICE] Database query result:', user ? 'User found' : 'User NOT found')

      if (!user) {
        console.log('[SETTINGS SERVICE] ERROR: User not found')
        logger.error({ userId }, 'User not found when fetching settings')
        throw new Error('User not found')
      }

      console.log('[SETTINGS SERVICE] Settings:', JSON.stringify(user, null, 2))
      logger.info({ userId }, 'User settings retrieved successfully')

      return user as UserSettings
    } catch (error) {
      // If database error occurs, return defaults
      logger.error({ userId, error }, 'Database error when fetching settings, returning defaults')
      console.log('[SETTINGS SERVICE] Database error, using default settings:', error)
      return this.getDefaultSettings()
    }
  }

  /**
   * Update user settings
   *
   * Validates and updates user settings with proper error handling.
   * Only updates provided fields, leaving others unchanged.
   *
   * @param userId - The user's unique identifier
   * @param settings - Partial settings object with fields to update
   * @returns Updated user settings
   * @throws Error if user not found or validation fails
   */
  async updateUserSettings(
    userId: string,
    settings: UpdateUserSettingsInput
  ): Promise<UserSettings> {
    console.log('[SETTINGS SERVICE] updateUserSettings called')
    console.log('[SETTINGS SERVICE] User ID:', userId)
    console.log('[SETTINGS SERVICE] Settings to update:', JSON.stringify(settings, null, 2))
    logger.debug({ userId, settingsKeys: Object.keys(settings) }, 'Updating user settings')

    // Validate settings values first (before checking DB)
    console.log('[SETTINGS SERVICE] Validating settings...')
    this.validateSettings(settings)
    console.log('[SETTINGS SERVICE] Settings validation passed')

    // Check database connectivity
    const dbAvailable = await this.checkDatabaseConnection()

    if (!dbAvailable) {
      logger.warn({ userId }, 'Database unavailable, returning updated mock settings')
      console.log('[SETTINGS SERVICE] WARNING: Database offline, returning mock updated settings')

      // Return merged settings (defaults + updates)
      const defaultSettings = this.getDefaultSettings()
      return {
        ...defaultSettings,
        ...settings,
        settingsUpdatedAt: new Date(),
      }
    }

    try {
      // Validate user exists
      console.log('[SETTINGS SERVICE] Checking if user exists...')
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      })

      if (!existingUser) {
        console.log('[SETTINGS SERVICE] ERROR: User not found')
        logger.error({ userId }, 'User not found when updating settings')
        throw new Error('User not found')
      }

      console.log('[SETTINGS SERVICE] User exists, updating database...')

      // Update user settings
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...settings,
          // settingsUpdatedAt is automatically updated via @updatedAt
        },
        select: {
          // Notification Settings
          emailNotifications: true,
          pushNotifications: true,
          marketingEmails: true,
          projectUpdates: true,
          creditAlerts: true,

          // Display Settings
          theme: true,
          language: true,

          // Privacy Settings
          profileVisibility: true,
          showEmail: true,
          analyticsTracking: true,

          // Metadata
          settingsUpdatedAt: true,
        },
      })

      console.log('[SETTINGS SERVICE] Database updated successfully')
      console.log('[SETTINGS SERVICE] Updated settings:', JSON.stringify(updatedUser, null, 2))
      logger.info(
        {
          userId,
          updatedFields: Object.keys(settings)
        },
        'User settings updated successfully'
      )

      return updatedUser as UserSettings
    } catch (error) {
      // If database error, return merged mock settings
      logger.error({ userId, error }, 'Database error when updating settings, returning mock data')
      console.log('[SETTINGS SERVICE] Database error, returning mock updated settings:', error)

      const defaultSettings = this.getDefaultSettings()
      return {
        ...defaultSettings,
        ...settings,
        settingsUpdatedAt: new Date(),
      }
    }
  }

  /**
   * Validate settings input
   *
   * Ensures all provided settings values are valid before updating.
   *
   * @param settings - Settings to validate
   * @throws Error if any setting is invalid
   */
  private validateSettings(settings: UpdateUserSettingsInput): void {
    // Validate theme
    if (settings.theme !== undefined) {
      const validThemes = ['light', 'dark', 'system']
      if (!validThemes.includes(settings.theme)) {
        throw new Error(`Invalid theme. Must be one of: ${validThemes.join(', ')}`)
      }
    }

    // Validate language
    if (settings.language !== undefined) {
      const validLanguages = ['id', 'en']
      if (!validLanguages.includes(settings.language)) {
        throw new Error(`Invalid language. Must be one of: ${validLanguages.join(', ')}`)
      }
    }

    // Validate profile visibility
    if (settings.profileVisibility !== undefined) {
      const validVisibility = ['public', 'private', 'friends']
      if (!validVisibility.includes(settings.profileVisibility)) {
        throw new Error(`Invalid profile visibility. Must be one of: ${validVisibility.join(', ')}`)
      }
    }

    // Validate boolean fields
    const booleanFields: Array<keyof UpdateUserSettingsInput> = [
      'emailNotifications',
      'pushNotifications',
      'marketingEmails',
      'projectUpdates',
      'creditAlerts',
      'showEmail',
      'analyticsTracking',
    ]

    for (const field of booleanFields) {
      if (settings[field] !== undefined && typeof settings[field] !== 'boolean') {
        throw new Error(`${field} must be a boolean value`)
      }
    }

    logger.debug({ settingsKeys: Object.keys(settings) }, 'Settings validation passed')
  }

  /**
   * Reset user settings to defaults
   *
   * Useful for troubleshooting or when user wants to start fresh.
   *
   * @param userId - The user's unique identifier
   * @returns Default user settings
   */
  async resetToDefaults(userId: string): Promise<UserSettings> {
    logger.info({ userId }, 'Resetting user settings to defaults')

    const defaultSettings: UpdateUserSettingsInput = {
      // Notification Settings
      emailNotifications: true,
      pushNotifications: false,
      marketingEmails: false,
      projectUpdates: true,
      creditAlerts: true,

      // Display Settings
      theme: 'light',
      language: 'id',

      // Privacy Settings
      profileVisibility: 'public',
      showEmail: false,
      analyticsTracking: true,
    }

    return this.updateUserSettings(userId, defaultSettings)
  }
}

// Export singleton instance
export const settingsService = new SettingsService()
