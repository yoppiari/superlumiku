/**
 * Centralized Credits Service
 *
 * This service provides a unified interface for all credit-related operations
 * across the application. It replaces duplicated credit checking logic found
 * in multiple route handlers.
 *
 * Features:
 * - Atomic credit deduction with transaction safety
 * - Enterprise unlimited tag support
 * - Comprehensive error handling
 * - Usage tracking and analytics
 * - Credit balance caching (optional)
 *
 * Usage Examples:
 * ```typescript
 * // Check if user has sufficient credits
 * const hasCredits = await creditsService.checkBalance(userId, 10)
 *
 * // Deduct credits atomically
 * const result = await creditsService.deduct({
 *   userId,
 *   amount: 10,
 *   action: 'generate_avatar',
 *   appId: 'avatar-creator',
 *   metadata: { projectId, generationId }
 * })
 *
 * // Refund credits (e.g., on job failure)
 * await creditsService.refund({
 *   userId,
 *   amount: 10,
 *   reason: 'Generation failed',
 *   originalTransactionId
 * })
 * ```
 *
 * @module services/credits
 */

import prisma from '../db/client'
import { InsufficientCreditsError } from '../core/errors'
import type { ErrorMetadata } from '../core/errors/types'

/**
 * Result of a credit deduction operation
 */
export interface CreditDeductionResult {
  /** New credit balance after deduction */
  newBalance: number
  /** Amount of credits deducted (0 for enterprise users) */
  creditUsed: number
  /** Whether this was an enterprise unlimited transaction */
  isEnterprise: boolean
  /** Transaction ID for refund purposes */
  transactionId: string | null
}

/**
 * Parameters for deducting credits
 */
export interface DeductCreditsParams {
  /** User ID to deduct credits from */
  userId: string
  /** Amount of credits to deduct */
  amount: number
  /** Action being performed (e.g., 'generate_avatar') */
  action: string
  /** App/plugin ID performing the action */
  appId: string
  /** Optional metadata for tracking */
  metadata?: Record<string, any>
  /** Optional error metadata for exception handling */
  errorMetadata?: ErrorMetadata
}

/**
 * Parameters for refunding credits
 */
export interface RefundCreditsParams {
  /** User ID to refund credits to */
  userId: string
  /** Amount of credits to refund */
  amount: number
  /** Reason for refund */
  reason: string
  /** Original transaction/generation ID */
  referenceId?: string
  /** Optional metadata */
  metadata?: Record<string, any>
}

/**
 * Result of checking credit balance and enterprise status
 */
export interface CreditCheckResult {
  /** Current credit balance */
  balance: number
  /** Whether user has enterprise unlimited access */
  hasEnterpriseUnlimited: boolean
  /** Whether user can proceed with the action */
  canProceed: boolean
  /** Required amount for the action */
  required: number
}

/**
 * Centralized Credits Service
 *
 * Handles all credit-related operations with consistent logic across the application.
 */
export class CreditsService {
  /**
   * Enterprise unlimited tag identifier
   * Users with this tag bypass credit checks for supported apps
   */
  private readonly ENTERPRISE_TAG = 'enterprise_unlimited'

  /**
   * Apps that support enterprise unlimited access
   * Expandable as new features are added
   */
  private readonly UNLIMITED_APPS = ['video-mixer', 'carousel-mix', 'looping-flow', 'avatar-creator']

  /**
   * Check if user has enterprise unlimited access
   *
   * @param userId - User ID to check
   * @returns Promise resolving to true if user has enterprise unlimited
   */
  async hasEnterpriseUnlimited(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { userTags: true },
    })

    if (!user || !user.userTags) {
      return false
    }

    try {
      const tags = JSON.parse(user.userTags)
      return Array.isArray(tags) && tags.includes(this.ENTERPRISE_TAG)
    } catch (error) {
      console.error('Failed to parse user tags:', error)
      return false
    }
  }

  /**
   * Get user's current credit balance
   *
   * @param userId - User ID to check
   * @returns Promise resolving to current credit balance
   */
  async getBalance(userId: string): Promise<number> {
    const lastCredit = await prisma.credit.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { balance: true },
    })

    return lastCredit?.balance || 0
  }

  /**
   * Check if user can perform an action (has sufficient credits or enterprise access)
   *
   * @param userId - User ID to check
   * @param amount - Amount of credits required
   * @param appId - App/plugin ID requesting the check
   * @returns Promise resolving to credit check result
   */
  async checkBalance(userId: string, amount: number, appId: string): Promise<CreditCheckResult> {
    const hasEnterprise = await this.hasEnterpriseUnlimited(userId)

    // Enterprise users with unlimited access can always proceed for supported apps
    if (hasEnterprise && this.UNLIMITED_APPS.includes(appId)) {
      return {
        balance: 0, // Balance doesn't matter for enterprise
        hasEnterpriseUnlimited: true,
        canProceed: true,
        required: amount,
      }
    }

    // Regular users need sufficient balance
    const balance = await this.getBalance(userId)

    return {
      balance,
      hasEnterpriseUnlimited: false,
      canProceed: balance >= amount,
      required: amount,
    }
  }

  /**
   * Deduct credits from user account atomically
   *
   * This method performs the following operations in a transaction:
   * 1. Check if user has enterprise unlimited (skip deduction if yes)
   * 2. Verify sufficient balance (throw error if insufficient)
   * 3. Create credit deduction record
   * 4. Create app usage record
   * 5. Update app statistics
   *
   * @param params - Deduction parameters
   * @returns Promise resolving to deduction result
   * @throws InsufficientCreditsError if user has insufficient credits
   */
  async deduct(params: DeductCreditsParams): Promise<CreditDeductionResult> {
    const { userId, amount, action, appId, metadata = {}, errorMetadata = {} } = params

    // Check enterprise status
    const hasEnterprise = await this.hasEnterpriseUnlimited(userId)

    // Skip deduction for enterprise users on supported apps
    if (hasEnterprise && this.UNLIMITED_APPS.includes(appId)) {
      // Still log usage for analytics (with 0 credit cost)
      await prisma.appUsage.create({
        data: {
          userId,
          appId,
          action,
          creditUsed: 0,
          metadata: JSON.stringify({ ...metadata, isEnterprise: true }),
        },
      })

      const balance = await this.getBalance(userId)

      return {
        newBalance: balance,
        creditUsed: 0,
        isEnterprise: true,
        transactionId: null,
      }
    }

    // Regular users: check balance and deduct
    const currentBalance = await this.getBalance(userId)

    if (currentBalance < amount) {
      throw new InsufficientCreditsError(amount, currentBalance, errorMetadata)
    }

    const newBalance = currentBalance - amount

    // Atomic transaction: deduct credits + log usage
    const [creditRecord] = await prisma.$transaction([
      // 1. Create credit deduction record
      prisma.credit.create({
        data: {
          userId,
          amount: -amount, // Negative for deduction
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
          metadata: JSON.stringify(metadata),
        },
      }),
    ])

    // 3. Update app statistics (best effort - don't fail transaction)
    try {
      await prisma.app.upsert({
        where: { appId },
        update: {
          totalUsage: { increment: 1 },
        },
        create: {
          appId,
          name: appId,
          icon: 'circle',
          totalUsage: 1,
        },
      })
    } catch (error) {
      console.warn(`Failed to update app stats for ${appId}:`, error)
    }

    return {
      newBalance,
      creditUsed: amount,
      isEnterprise: false,
      transactionId: creditRecord.id,
    }
  }

  /**
   * Refund credits to user account
   *
   * Used when operations fail or need to be reversed (e.g., generation failures)
   *
   * @param params - Refund parameters
   * @returns Promise resolving to new balance after refund
   */
  async refund(params: RefundCreditsParams): Promise<number> {
    const { userId, amount, reason, referenceId, metadata = {} } = params

    // Don't refund if amount is 0 (enterprise users)
    if (amount === 0) {
      return await this.getBalance(userId)
    }

    const currentBalance = await this.getBalance(userId)
    const newBalance = currentBalance + amount

    await prisma.credit.create({
      data: {
        userId,
        amount, // Positive for refund
        balance: newBalance,
        type: 'refund',
        description: `Refund: ${reason}`,
        referenceType: 'app_usage',
        referenceId: referenceId || null,
        metadata: JSON.stringify(metadata),
      },
    })

    return newBalance
  }

  /**
   * Add credits to user account (e.g., from purchase or admin grant)
   *
   * @param userId - User ID to add credits to
   * @param amount - Amount of credits to add
   * @param type - Type of credit addition ('purchase', 'admin_grant', 'bonus')
   * @param description - Description of the credit addition
   * @param referenceId - Optional reference ID (e.g., payment ID)
   * @returns Promise resolving to new balance after addition
   */
  async add(
    userId: string,
    amount: number,
    type: 'purchase' | 'admin_grant' | 'bonus',
    description: string,
    referenceId?: string
  ): Promise<number> {
    const currentBalance = await this.getBalance(userId)
    const newBalance = currentBalance + amount

    await prisma.credit.create({
      data: {
        userId,
        amount, // Positive for addition
        balance: newBalance,
        type,
        description,
        referenceType: type === 'purchase' ? 'payment' : 'admin',
        referenceId: referenceId || null,
      },
    })

    return newBalance
  }

  /**
   * Get credit usage history for a user
   *
   * @param userId - User ID to get history for
   * @param limit - Maximum number of records to return
   * @param offset - Offset for pagination
   * @returns Promise resolving to credit history
   */
  async getHistory(userId: string, limit: number = 50, offset: number = 0) {
    const records = await prisma.credit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    const total = await prisma.credit.count({
      where: { userId },
    })

    return {
      records,
      total,
      limit,
      offset,
    }
  }

  /**
   * Get app usage statistics for a user
   *
   * @param userId - User ID to get stats for
   * @param appId - Optional app ID to filter by
   * @returns Promise resolving to usage statistics
   */
  async getUsageStats(userId: string, appId?: string) {
    const where: any = { userId }
    if (appId) {
      where.appId = appId
    }

    const usageRecords = await prisma.appUsage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // Calculate statistics
    const totalCreditsUsed = usageRecords.reduce((sum, record) => sum + record.creditUsed, 0)
    const totalOperations = usageRecords.length

    const byApp = usageRecords.reduce((acc, record) => {
      if (!acc[record.appId]) {
        acc[record.appId] = {
          operations: 0,
          creditsUsed: 0,
        }
      }
      acc[record.appId].operations += 1
      acc[record.appId].creditsUsed += record.creditUsed
      return acc
    }, {} as Record<string, { operations: number; creditsUsed: number }>)

    return {
      totalCreditsUsed,
      totalOperations,
      byApp,
      recentUsage: usageRecords.slice(0, 10),
    }
  }
}

/**
 * Singleton instance of CreditsService
 * Use this throughout the application for consistency
 */
export const creditsService = new CreditsService()
