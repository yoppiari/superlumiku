import { Context, Next } from 'hono'
import { verifyToken } from '../lib/jwt'
import prisma from '../db/client'

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized - No token provided' }, 401)
  }

  const token = authHeader.substring(7)

  try {
    const payload = verifyToken(token)

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    if (!user) {
      return c.json({ error: 'Unauthorized - User not found' }, 401)
    }

    c.set('userId', payload.userId)
    c.set('userEmail', payload.email)
    c.set('user', user)
    await next()
  } catch (error) {
    return c.json({ error: 'Unauthorized - Invalid token' }, 401)
  }
}