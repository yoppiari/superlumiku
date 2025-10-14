import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.middleware'
import { AuthVariables } from '../types/hono'
import prisma from '../db/client'
import { sendSuccess } from '../utils/api-response'
import { asyncHandler } from '../utils/error-handler'
import { logger } from '../utils/logger'
import { AuthContext, DashboardStatsResponse } from '../types/routes'

const statsRoutes = new Hono<{ Variables: AuthVariables }>()

/**
 * GET /api/stats/dashboard
 * Get dashboard statistics for authenticated user
 * Includes monthly spending, works, projects, and last login
 *
 * @returns {DashboardStatsResponse} Dashboard statistics for current month
 */
statsRoutes.get(
  '/dashboard',
  authMiddleware,
  asyncHandler(async (c: AuthContext) => {
    const userId = c.get('userId')

    logger.info('Fetching dashboard stats', { userId })

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

    const stats: DashboardStatsResponse = {
      totalSpending: Math.abs(monthlySpending._sum.amount || 0),
      totalWorks,
      totalProjects,
      lastLogin: lastSession?.createdAt || new Date(),
      periodStart: monthStart,
      periodEnd: monthEnd,
    }

    logger.debug('Dashboard stats retrieved', { userId, stats })

    return sendSuccess<DashboardStatsResponse>(c, stats)
  }, 'Get Dashboard Stats')
)

export default statsRoutes
