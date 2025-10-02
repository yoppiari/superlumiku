import prisma from '../db/client'

export interface DeductCreditsInput {
  userId: string
  amount: number
  description: string
  referenceId?: string
  referenceType?: string
}

export interface AddCreditsInput {
  userId: string
  amount: number
  type: 'purchase' | 'bonus' | 'refund'
  description: string
  paymentId?: string
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
   */
  async deductCredits(input: DeductCreditsInput) {
    const currentBalance = await this.getBalance(input.userId)

    if (currentBalance < input.amount) {
      throw new Error('Insufficient credits')
    }

    const newBalance = currentBalance - input.amount

    const credit = await prisma.credit.create({
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
  }

  /**
   * Add credits to user (for purchase, bonus, refund)
   */
  async addCredits(input: AddCreditsInput) {
    const currentBalance = await this.getBalance(input.userId)
    const newBalance = currentBalance + input.amount

    const credit = await prisma.credit.create({
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
    const hasEnough = await this.hasEnoughCredits(input.userId, input.amount)

    if (!hasEnough) {
      throw new Error('Insufficient credits')
    }

    return this.deductCredits(input)
  }
}