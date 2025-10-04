import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.middleware'
import prisma from '../db/client'

const statsRoutes = new Hono()

// Get dashboard stats for current user
statsRoutes.get('/dashboard', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')

    // Get current month start and end dates
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    // Get total spending this month (credits used)
    const monthlySpending = await prisma.credit.aggregate({
      where: {
        userId,
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
        amount: {
          lt: 0, // Only count credit deductions
        },
      },
      _sum: {
        amount: true,
      },
    })

    // Get total works (generations) this month
    const [videoMixerCount, carouselCount] = await Promise.all([
      prisma.videoMixerGeneration.count({
        where: {
          userId,
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
          status: 'completed',
        },
      }),
      prisma.carouselGeneration.count({
        where: {
          userId,
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
          status: 'completed',
        },
      }),
    ])
    const totalWorks = videoMixerCount + carouselCount

    // Get total projects this month
    const [videoProjectCount, carouselProjectCount] = await Promise.all([
      prisma.videoMixerProject.count({
        where: {
          userId,
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      }),
      prisma.carouselProject.count({
        where: {
          userId,
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      }),
    ])
    const totalProjects = videoProjectCount + carouselProjectCount

    // Get last login from session table
    const lastSession = await prisma.session.findFirst({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        createdAt: true,
      },
    })

    return c.json({
      totalSpending: Math.abs(monthlySpending._sum.amount || 0),
      totalWorks,
      totalProjects,
      lastLogin: lastSession?.createdAt || new Date(),
      periodStart: monthStart,
      periodEnd: monthEnd,
    })
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error)
    return c.json({ error: 'Failed to fetch stats' }, 500)
  }
})

export default statsRoutes
