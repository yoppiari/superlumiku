import prisma from '../db/client'
import { hashPassword, comparePassword } from '../lib/bcrypt'
import { signToken } from '../lib/jwt'
import { DeviceService } from './device.service'
import { rateLimitService } from './rate-limit.service'

const deviceService = new DeviceService()

export interface RegisterInput {
  email: string
  password: string
  name?: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface UpdateProfileInput {
  name?: string
  email?: string
  currentPassword?: string
  newPassword?: string
}

export class AuthService {
  async register(input: RegisterInput, userAgent?: string, ipAddress?: string) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    })

    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    // Hash password
    const hashedPassword = await hashPassword(input.password)

    // Create user with initial welcome bonus
    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        name: input.name,
        credits: {
          create: {
            amount: 100,
            balance: 100,
            type: 'bonus',
            description: 'Welcome bonus - 100 free credits',
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    })

    // Generate token
    const token = signToken({
      userId: user.id,
      email: user.email,
    })

    // Track device if userAgent provided
    if (userAgent) {
      await deviceService.trackDevice(user.id, { userAgent, ipAddress })
    }

    return { user, token }
  }

  async login(input: LoginInput, userAgent?: string, ipAddress?: string) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    })

    // Use constant-time password comparison to prevent timing attacks
    // Always perform password hashing even for non-existent users
    const dummyHash = '$2a$10$' + 'X'.repeat(53) // Valid bcrypt hash format
    const passwordHash = user?.password || dummyHash
    const isValidPassword = await comparePassword(input.password, passwordHash)

    // Check both user existence AND password validity
    if (!user || !isValidPassword) {
      // Track failed attempt (works for both non-existent users and wrong passwords)
      await rateLimitService.trackFailedLogin(input.email, ipAddress || 'unknown')
      throw new Error('Invalid email or password')
    }

    // Successful login - reset failed attempts
    await rateLimitService.resetFailedLogins(input.email, ipAddress)

    // Get current credit balance
    const lastCredit = await prisma.credit.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    // Generate token
    const token = signToken({
      userId: user.id,
      email: user.email,
    })

    // Track device if userAgent provided
    if (userAgent) {
      await deviceService.trackDevice(user.id, { userAgent, ipAddress })
    }

    // Log successful login
    console.log(`[AUTH] Successful login: ${user.email} from IP ${ipAddress}`)

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        creditBalance: lastCredit?.balance || 0,
      },
      token,
    }
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Get credit balance
    const lastCredit = await prisma.credit.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return {
      ...user,
      creditBalance: lastCredit?.balance || 0,
    }
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // If changing password, verify current password
    if (input.newPassword) {
      if (!input.currentPassword) {
        throw new Error('Current password is required to change password')
      }

      const isValidPassword = await comparePassword(input.currentPassword, user.password)
      if (!isValidPassword) {
        throw new Error('Current password is incorrect')
      }

      if (input.newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters')
      }
    }

    // If changing email, check if new email is available
    if (input.email && input.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
      })

      if (existingUser) {
        throw new Error('Email is already in use')
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (input.name !== undefined) updateData.name = input.name
    if (input.email !== undefined) updateData.email = input.email
    if (input.newPassword) {
      updateData.password = await hashPassword(input.newPassword)
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    // Get credit balance
    const lastCredit = await prisma.credit.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    // Generate new token if email changed
    const token = input.email && input.email !== user.email
      ? signToken({ userId: updatedUser.id, email: updatedUser.email })
      : undefined

    return {
      user: {
        ...updatedUser,
        creditBalance: lastCredit?.balance || 0,
      },
      token,
    }
  }
}