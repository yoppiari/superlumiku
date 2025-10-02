import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.middleware'
import { DeviceService } from '../services/device.service'

const deviceRoutes = new Hono()
const deviceService = new DeviceService()

// Get all devices for current user
deviceRoutes.get('/', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const devices = await deviceService.getUserDevices(userId)

    return c.json({ devices })
  } catch (error: any) {
    console.error('Get devices error:', error)
    return c.json({ error: error.message || 'Failed to get devices' }, 400)
  }
})

// Remove a device
deviceRoutes.delete('/:deviceId', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const deviceId = c.param('deviceId')

    const result = await deviceService.removeDevice(userId, deviceId)

    return c.json(result)
  } catch (error: any) {
    console.error('Remove device error:', error)
    return c.json({ error: error.message || 'Failed to remove device' }, 400)
  }
})

// Get device count
deviceRoutes.get('/count', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const count = await deviceService.getDeviceCount(userId)
    const canAdd = await deviceService.canAddDevice(userId)

    return c.json({ count, canAdd, maxDevices: 3 })
  } catch (error: any) {
    console.error('Get device count error:', error)
    return c.json({ error: error.message || 'Failed to get device count' }, 400)
  }
})

export default deviceRoutes
