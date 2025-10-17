import prisma from '../db/client'
import { InsufficientCreditsError } from '../core/errors/errors'

export interface DeductCreditsInput {
  userId: string
  amount: number
  description: string
  referenceId?: string
  referenceType?: string
  metadata?: Record<string, any>
}

export interface AddCreditsInput {
  userId: string
  amount: number
  type: 'purchase' | 'bonus' | 'refund'
  description: string
  paymentId?: string
}

export interface RefundCreditsInput {
  userId: string
  amount: number
  description: string
  referenceId?: string
  referenceType?: string
}

export class CreditService {
  /**
   * Get current credit balance for user
   */
  async getBalance(userId: string): Promise<number> {
    const lastCredit = await prisma.credit.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return lastCredit?.balance || 0
  }

  /**
   * Check if user has enough credits
   */
  async hasEnoughCredits(userId: string, amount: number): Promise<boolean> {
    const balance = await this.getBalance(userId)
    return balance >= amount
  }

  /**
   * Deduct credits from user (for tool usage)
   * Uses database transaction with serializable isolation to prevent race conditions
   */
  async deductCredits(input: DeductCreditsInput) {
    return await prisma.$transaction(async (tx) => {
      // Get latest balance with row lock (SELECT FOR UPDATE equivalent)
      const latestCredit = await tx.credit.findFirst({
        where: { userId: input.userId },
        orderBy: { createdAt: 'desc' },
        select: { balance: true, id: true }
      })

      const currentBalance = latestCredit?.balance || 0

      if (currentBalance < input.amount) {
        throw new InsufficientCreditsError(input.amount, currentBalance)
      }

      const newBalance = currentBalance - input.amount

      // Create new credit record atomically within transaction
      const credit = await tx.credit.create({
        data: {
          userId: input.userId,
          amount: -input.amount, // Negative for deduction
          balance: newBalance,
          type: 'usage',
          description: input.description,
          referenceId: input.referenceId,
          referenceType: input.referenceType,
        },
      })

      return {
        credit,
        previousBalance: currentBalance,
        newBalance,
      }
    }, {
      isolationLevel: 'Serializable', // Highest isolation level to prevent race conditions
      maxWait: 5000, // Wait up to 5 seconds for transaction lock
      timeout: 10000, // Transaction timeout after 10 seconds
    })
  }

  /**
   * Add credits to user (for purchase, bonus, refund)
   * Uses database transaction to ensure atomic operations
   */
  async addCredits(input: AddCreditsInput) {
    return await prisma.$transaction(async (tx) => {
      // Get latest balance with row lock
      const latestCredit = await tx.credit.findFirst({
        where: { userId: input.userId },
        orderBy: { createdAt: 'desc' },
        select: { balance: true, id: true }
      })

      const currentBalance = latestCredit?.balance || 0
      const newBalance = currentBalance + input.amount

      const credit = await tx.credit.create({
        data: {
          userId: input.userId,
          amount: input.amount,
          balance: newBalance,
          type: input.type,
          description: input.description,
          paymentId: input.paymentId,
        },
      })

      return {
        credit,
        previousBalance: currentBalance,
        newBalance,
      }
    }, {
      isolationLevel: 'Serializable',
      maxWait: 5000,
      timeout: 10000,
    })
  }

  /**
   * Get credit history for user
   */
  async getHistory(userId: string, limit = 50) {
    return prisma.credit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  /**
   * Check and deduct credits atomically
   */
  async checkAndDeduct(input: DeductCreditsInput) {
    const currentBalance = await this.getBalance(input.userId)

    if (currentBalance < input.amount) {
      throw new InsufficientCreditsError(input.amount, currentBalance)
    }

    return this.deductCredits(input)
  }

  /**
   * Refund credits to user with idempotency protection
   * Prevents double refunds for the same generation/reference
   *
   * CRITICAL FIX: This method now checks for existing refunds before creating a new one
   * This prevents credits from increasing when the same failure is refunded multiple times
   */
  async refundCredits(input: RefundCreditsInput) {
    // IDEMPOTENCY CHECK: Prevent double refunds for same reference
    if (input.referenceId) {
      const existingRefund = await prisma.credit.findFirst({
        where: {
          userId: input.userId,
          type: 'refund',
          paymentId: input.referenceId, // Use paymentId to track refund reference
          // Check within last 24 hours to avoid old refunds blocking new ones
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        select: { id: true, amount: true, createdAt: true }
      })

      if (existingRefund) {
        console.log(`⚠️  Duplicate refund prevented for reference ${input.referenceId}`, {
          userId: input.userId,
          amount: input.amount,
          existingRefundId: existingRefund.id,
          existingAmount: existingRefund.amount,
          existingCreatedAt: existingRefund.createdAt
        })

        // Return existing refund result instead of creating duplicate
        const currentBalance = await this.getBalance(input.userId)
        return {
          credit: existingRefund,
          previousBalance: currentBalance,
          newBalance: currentBalance,
          isDuplicate: true as const // Flag to indicate this was a duplicate refund attempt
        }
      }
    }

    // No duplicate found - proceed with refund
    const result = await this.addCredits({
      userId: input.userId,
      amount: input.amount,
      type: 'refund',
      description: input.description,
      paymentId: input.referenceId, // Store reference ID for idempotency check
    })

    return {
      ...result,
      isDuplicate: false as const
    }
  }
}

export const creditService = new CreditService()