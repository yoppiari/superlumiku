/**
 * Settings Routes
 *
 * API endpoints for user settings management:
 * - GET /api/settings - Get current user settings
 * - PUT /api/settings - Update user settings
 * - POST /api/settings/reset - Reset to default settings
 *
 * All endpoints are protected with authentication middleware.
 */

import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.middleware'
import { settingsService, UpdateUserSettingsInput } from '../services/settings.service'
import { AuthVariables } from '../types/hono'
import { sendSuccess, HttpStatus } from '../utils/api-response'
import { asyncHandler } from '../utils/error-handler'
import { logger } from '../utils/logger'
import { AuthContext } from '../types/routes'
import { z } from 'zod'

const settingsRoutes = new Hono<{ Variables: AuthVariables }>()

/**
 * Validation schema for settings update
 */
const updateSettingsSchema = z.object({
  // Notification Settings
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  projectUpdates: z.boolean().optional(),
  creditAlerts: z.boolean().optional(),

  // Display Settings
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.enum(['id', 'en']).optional(),

  // Privacy Settings
  profileVisibility: z.enum(['public', 'private', 'friends']).optional(),
  showEmail: z.boolean().optional(),
  analyticsTracking: z.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one setting must be provided' }
)

/**
 * GET /api/settings
 * Get current user settings
 *
 * @returns User settings object with all preferences
 */
settingsRoutes.get(
  '/',
  authMiddleware,
  asyncHandler(async (c: AuthContext) => {
    const userId = c.get('userId')

    console.log('[SETTINGS] GET /api/settings - Route handler called')
    console.log('[SETTINGS] User ID:', userId)
    logger.info('Fetching user settings', { userId })

    const settings = await settingsService.getUserSettings(userId)

    console.log('[SETTINGS] Settings retrieved:', JSON.stringify(settings, null, 2))
    logger.debug('User settings retrieved', { userId, settings })

    return sendSuccess(c, settings, 'Settings retrieved successfully')
  }, 'Get User Settings')
)

/**
 * PUT /api/settings
 * Update user settings
 *
 * Accepts partial settings object. Only provided fields will be updated.
 *
 * @body Partial settings object
 * @returns Updated user settings
 */
settingsRoutes.put(
  '/',
  authMiddleware,
  asyncHandler(async (c: AuthContext) => {
    const userId = c.get('userId')
    const body = await c.req.json()

    console.log('[SETTINGS] PUT /api/settings - Route handler called')
    console.log('[SETTINGS] User ID:', userId)
    console.log('[SETTINGS] Request body:', JSON.stringify(body, null, 2))
    logger.info('Updating user settings', {
      userId,
      fields: Object.keys(body)
    })

    // Validate input
    console.log('[SETTINGS] Validating request body...')
    const validated = updateSettingsSchema.parse(body)
    console.log('[SETTINGS] Validation passed:', JSON.stringify(validated, null, 2))

    // Update settings
    console.log('[SETTINGS] Calling settingsService.updateUserSettings...')
    const updatedSettings = await settingsService.updateUserSettings(
      userId,
      validated as UpdateUserSettingsInput
    )

    console.log('[SETTINGS] Settings updated successfully:', JSON.stringify(updatedSettings, null, 2))
    logger.info('User settings updated successfully', {
      userId,
      updatedFields: Object.keys(validated)
    })

    return sendSuccess(c, updatedSettings, 'Settings updated successfully')
  }, 'Update User Settings')
)

/**
 * POST /api/settings/reset
 * Reset user settings to default values
 *
 * Useful for troubleshooting or when user wants to start fresh.
 *
 * @returns Default user settings
 */
settingsRoutes.post(
  '/reset',
  authMiddleware,
  asyncHandler(async (c: AuthContext) => {
    const userId = c.get('userId')

    logger.info('Resetting user settings to defaults', { userId })

    const defaultSettings = await settingsService.resetToDefaults(userId)

    logger.info('User settings reset to defaults successfully', { userId })

    return sendSuccess(c, defaultSettings, 'Settings reset to defaults successfully')
  }, 'Reset User Settings')
)

/**
 * PATCH /api/settings/notifications
 * Quick update for notification settings only
 *
 * Convenience endpoint for updating notification preferences.
 *
 * @body Notification settings object
 * @returns Updated user settings
 */
settingsRoutes.patch(
  '/notifications',
  authMiddleware,
  asyncHandler(async (c: AuthContext) => {
    const userId = c.get('userId')
    const body = await c.req.json()

    logger.info('Updating notification settings', { userId })

    // Validate notification settings
    const notificationSchema = z.object({
      emailNotifications: z.boolean().optional(),
      pushNotifications: z.boolean().optional(),
      marketingEmails: z.boolean().optional(),
      projectUpdates: z.boolean().optional(),
      creditAlerts: z.boolean().optional(),
    }).refine(
      (data) => Object.keys(data).length > 0,
      { message: 'At least one notification setting must be provided' }
    )

    const validated = notificationSchema.parse(body)

    // Update settings
    const updatedSettings = await settingsService.updateUserSettings(
      userId,
      validated as UpdateUserSettingsInput
    )

    logger.info('Notification settings updated successfully', { userId })

    return sendSuccess(c, updatedSettings, 'Notification settings updated successfully')
  }, 'Update Notification Settings')
)

/**
 * PATCH /api/settings/display
 * Quick update for display settings only
 *
 * Convenience endpoint for updating theme and language.
 *
 * @body Display settings object
 * @returns Updated user settings
 */
settingsRoutes.patch(
  '/display',
  authMiddleware,
  asyncHandler(async (c: AuthContext) => {
    const userId = c.get('userId')
    const body = await c.req.json()

    logger.info('Updating display settings', { userId })

    // Validate display settings
    const displaySchema = z.object({
      theme: z.enum(['light', 'dark', 'system']).optional(),
      language: z.enum(['id', 'en']).optional(),
    }).refine(
      (data) => Object.keys(data).length > 0,
      { message: 'At least one display setting must be provided' }
    )

    const validated = displaySchema.parse(body)

    // Update settings
    const updatedSettings = await settingsService.updateUserSettings(
      userId,
      validated as UpdateUserSettingsInput
    )

    logger.info('Display settings updated successfully', { userId })

    return sendSuccess(c, updatedSettings, 'Display settings updated successfully')
  }, 'Update Display Settings')
)

/**
 * PATCH /api/settings/privacy
 * Quick update for privacy settings only
 *
 * Convenience endpoint for updating privacy preferences.
 *
 * @body Privacy settings object
 * @returns Updated user settings
 */
settingsRoutes.patch(
  '/privacy',
  authMiddleware,
  asyncHandler(async (c: AuthContext) => {
    const userId = c.get('userId')
    const body = await c.req.json()

    logger.info('Updating privacy settings', { userId })

    // Validate privacy settings
    const privacySchema = z.object({
      profileVisibility: z.enum(['public', 'private', 'friends']).optional(),
      showEmail: z.boolean().optional(),
      analyticsTracking: z.boolean().optional(),
    }).refine(
      (data) => Object.keys(data).length > 0,
      { message: 'At least one privacy setting must be provided' }
    )

    const validated = privacySchema.parse(body)

    // Update settings
    const updatedSettings = await settingsService.updateUserSettings(
      userId,
      validated as UpdateUserSettingsInput
    )

    logger.info('Privacy settings updated successfully', { userId })

    return sendSuccess(c, updatedSettings, 'Privacy settings updated successfully')
  }, 'Update Privacy Settings')
)

export default settingsRoutes
