import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

const MAX_DEVICES = 3

interface DeviceInfo {
  userAgent: string
  ipAddress?: string
}

export class DeviceService {
  /**
   * Generate device ID from user agent and other identifiers
   */
  private generateDeviceId(userAgent: string, userId: string): string {
    return crypto
      .createHash('sha256')
      .update(`${userAgent}-${userId}`)
      .digest('hex')
      .slice(0, 32)
  }

  /**
   * Parse user agent to get device info
   */
  private parseUserAgent(userAgent: string) {
    const ua = userAgent.toLowerCase()

    // Detect browser
    let browser = 'Unknown'
    if (ua.includes('chrome')) browser = 'Chrome'
    else if (ua.includes('firefox')) browser = 'Firefox'
    else if (ua.includes('safari')) browser = 'Safari'
    else if (ua.includes('edge')) browser = 'Edge'
    else if (ua.includes('opera')) browser = 'Opera'

    // Detect OS
    let os = 'Unknown'
    if (ua.includes('windows')) os = 'Windows'
    else if (ua.includes('mac')) os = 'macOS'
    else if (ua.includes('linux')) os = 'Linux'
    else if (ua.includes('android')) os = 'Android'
    else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS'

    // Detect device type
    let deviceType = 'desktop'
    if (ua.includes('mobile')) deviceType = 'mobile'
    else if (ua.includes('tablet') || ua.includes('ipad')) deviceType = 'tablet'

    // Generate device name
    const deviceName = `${browser} on ${os}`

    return { browser, os, deviceType, deviceName }
  }

  /**
   * Track or update device activity
   */
  async trackDevice(userId: string, deviceInfo: DeviceInfo) {
    try {
      const { userAgent, ipAddress } = deviceInfo
      const deviceId = this.generateDeviceId(userAgent, userId)
      const { browser, os, deviceType, deviceName } = this.parseUserAgent(userAgent)

      // Check if device already exists
      const existingDevice = await prisma.device.findUnique({
        where: {
          userId_deviceId: {
            userId,
            deviceId,
          },
        },
      })

      if (existingDevice) {
        // Update last active time
        await prisma.device.update({
          where: { id: existingDevice.id },
          data: {
            lastActive: new Date(),
            ipAddress,
          },
        })
        return { device: existingDevice, isNew: false }
      }

      // Check device limit
      const deviceCount = await prisma.device.count({
        where: { userId },
      })

      if (deviceCount >= MAX_DEVICES) {
        // Remove oldest inactive device
        const oldestDevice = await prisma.device.findFirst({
          where: { userId },
          orderBy: { lastActive: 'asc' },
        })

        if (oldestDevice) {
          await prisma.device.delete({
            where: { id: oldestDevice.id },
          })
        }
      }

      // Create new device
      const newDevice = await prisma.device.create({
        data: {
          userId,
          deviceId,
          deviceName,
          deviceType,
          browser,
          os,
          ipAddress,
          userAgent,
          lastActive: new Date(),
        },
      })

      return { device: newDevice, isNew: true }
    } catch (error: any) {
      console.error('Track device error:', error)
      throw new Error('Failed to track device')
    }
  }

  /**
   * Get all devices for a user
   */
  async getUserDevices(userId: string) {
    try {
      const devices = await prisma.device.findMany({
        where: { userId },
        orderBy: { lastActive: 'desc' },
        select: {
          id: true,
          deviceId: true,
          deviceName: true,
          deviceType: true,
          browser: true,
          os: true,
          ipAddress: true,
          lastActive: true,
          createdAt: true,
        },
      })

      return devices
    } catch (error: any) {
      console.error('Get user devices error:', error)
      throw new Error('Failed to get devices')
    }
  }

  /**
   * Remove a specific device
   */
  async removeDevice(userId: string, deviceId: string) {
    try {
      const device = await prisma.device.findFirst({
        where: {
          userId,
          id: deviceId,
        },
      })

      if (!device) {
        throw new Error('Device not found')
      }

      await prisma.device.delete({
        where: { id: deviceId },
      })

      return { success: true, message: 'Device removed successfully' }
    } catch (error: any) {
      console.error('Remove device error:', error)
      throw new Error(error.message || 'Failed to remove device')
    }
  }

  /**
   * Check if user has reached device limit
   */
  async canAddDevice(userId: string): Promise<boolean> {
    try {
      const deviceCount = await prisma.device.count({
        where: { userId },
      })

      return deviceCount < MAX_DEVICES
    } catch (error) {
      console.error('Check device limit error:', error)
      return false
    }
  }

  /**
   * Get device count for user
   */
  async getDeviceCount(userId: string): Promise<number> {
    try {
      return await prisma.device.count({
        where: { userId },
      })
    } catch (error) {
      console.error('Get device count error:', error)
      return 0
    }
  }
}
