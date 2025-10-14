import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.middleware'
import { DeviceService } from '../services/device.service'
import { AuthVariables } from '../types/hono'
import { sendSuccess } from '../utils/api-response'
import { asyncHandler, ValidationError } from '../utils/error-handler'
import { logger } from '../utils/logger'
import { AuthContext, DeviceListResponse, DeviceCountResponse } from '../types/routes'

const deviceRoutes = new Hono<{ Variables: AuthVariables }>()
const deviceService = new DeviceService()

/**
 * GET /api/devices
 * Get all devices for authenticated user
 *
 * @returns {DeviceListResponse} List of user's devices
 */
deviceRoutes.get(
  '/',
  authMiddleware,
  asyncHandler(async (c: AuthContext) => {
    const userId = c.get('userId')

    logger.info('Fetching user devices', { userId })

    const devices = await deviceService.getUserDevices(userId)

    logger.debug('Devices retrieved', { userId, count: devices.length })

    return sendSuccess<DeviceListResponse>(c, { devices })
  }, 'Get User Devices')
)

/**
 * GET /api/devices/count
 * Get device count and availability status for authenticated user
 * Note: This route must be defined before /:deviceId to avoid route conflicts
 *
 * @returns {DeviceCountResponse} Device count, max devices, and whether user can add more
 */
deviceRoutes.get(
  '/count',
  authMiddleware,
  asyncHandler(async (c: AuthContext) => {
    const userId = c.get('userId')

    logger.info('Fetching device count', { userId })

    const count = await deviceService.getDeviceCount(userId)
    const canAdd = await deviceService.canAddDevice(userId)

    logger.debug('Device count retrieved', { userId, count, canAdd })

    return sendSuccess<DeviceCountResponse>(c, { count, canAdd, maxDevices: 3 })
  }, 'Get Device Count')
)

/**
 * DELETE /api/devices/:deviceId
 * Remove a device for authenticated user
 *
 * @param deviceId - Device ID to remove
 * @returns Success message
 */
deviceRoutes.delete(
  '/:deviceId',
  authMiddleware,
  asyncHandler(async (c: AuthContext) => {
    const userId = c.get('userId')
    const deviceId = c.req.param('deviceId')

    if (!deviceId) {
      throw new ValidationError('Device ID is required')
    }

    logger.info('Removing device', { userId, deviceId })

    const result = await deviceService.removeDevice(userId, deviceId)

    logger.info('Device removed successfully', { userId, deviceId })

    // Maintain backward compatibility by returning the raw result from service
    return c.json(result)
  }, 'Remove Device')
)

export default deviceRoutes
