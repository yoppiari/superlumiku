import { Context, Next } from 'hono'
import prisma from '../../db/client'

/**
 * Middleware: Deduct credits before action
 * Usage: deductCredits(5, 'create_project', 'project-manager')
 */
export const deductCredits = (amount: number, action: string, appId: string) => {
  return async (c: Context, next: Next) => {
    const userId = c.get('userId')

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Check if user has enterprise unlimited access
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { userTags: true },
    })

    const tags = user?.userTags ? JSON.parse(user.userTags) : []
    const hasEnterpriseUnlimited = tags.includes('enterprise_unlimited')

    // Skip credit check for enterprise users on specific apps
    const unlimitedApps = ['video-mixer', 'carousel-mix']
    if (hasEnterpriseUnlimited && unlimitedApps.includes(appId)) {
      // Store deduction info with 0 cost for enterprise users
      c.set('creditDeduction', {
        amount: 0,
        action,
        appId,
        isEnterprise: true,
      })
      await next()
      return
    }

    // Check credit balance for non-enterprise users
    const balance = await getCreditBalance(userId)

    if (balance < amount) {
      return c.json({
        error: 'Insufficient credits',
        required: amount,
        current: balance,
      }, 402) // 402 Payment Required
    }

    // Store deduction info in context for later recording
    c.set('creditDeduction', {
      amount,
      action,
      appId,
    })

    await next()
  }
}

/**
 * Record credit usage after successful operation
 * Call this AFTER the operation succeeds
 */
export const recordCreditUsage = async (
  userId: string,
  appId: string,
  action: string,
  amount: number,
  metadata?: any
) => {
  // Skip credit deduction if amount is 0 (enterprise users)
  if (amount === 0) {
    // Still log usage for analytics
    await prisma.appUsage.create({
      data: {
        userId,
        appId,
        action,
        creditUsed: 0,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    })

    return { newBalance: await getCreditBalance(userId), creditUsed: 0 }
  }

  // Get current balance
  const currentBalance = await getCreditBalance(userId)
  const newBalance = currentBalance - amount

  // Atomic transaction: deduct credits + log usage
  await prisma.$transaction([
    // 1. Create credit deduction record
    prisma.credit.create({
      data: {
        userId,
        amount: -amount,          // Negative for deduction
        balance: newBalance,
        type: 'usage',
        description: `${appId}: ${action}`,
        referenceType: 'app_usage',
      },
    }),

    // 2. Create app usage record
    prisma.appUsage.create({
      data: {
        userId,
        appId,
        action,
        creditUsed: amount,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    }),
  ])

  // 3. Update app statistics (upsert - create if not exists)
  // Note: App model is optional, plugins are registered in-memory
  try {
    await prisma.app.upsert({
      where: { appId },
      update: {
        totalUsage: { increment: 1 },
      },
      create: {
        appId,
        name: appId, // Placeholder - will use plugin name if needed
        icon: 'circle',
        totalUsage: 1,
      },
    })
  } catch (error) {
    // Ignore app stats error - it's optional
    console.warn(`⚠️  Could not update app stats for ${appId}:`, error)
  }

  return { newBalance, creditUsed: amount }
}

/**
 * Get user's current credit balance
 */
export const getCreditBalance = async (userId: string): Promise<number> => {
  const lastCredit = await prisma.credit.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { balance: true },
  })

  return lastCredit?.balance || 0
}

/**
 * Middleware: Automatically record usage after success
 * Place this AFTER your route handler
 */
export const autoRecordUsage = async (c: Context) => {
  const deduction = c.get('creditDeduction')

  if (deduction) {
    const userId = c.get('userId')
    await recordCreditUsage(
      userId,
      deduction.appId,
      deduction.action,
      deduction.amount
    )
  }
}
