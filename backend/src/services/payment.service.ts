import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

interface DuitkuCreatePaymentRequest {
  merchantOrderId: string
  paymentAmount: number
  productDetails: string
  email: string
  customerVaName: string
  callbackUrl: string
  returnUrl: string
  expiryPeriod?: number
}

interface DuitkuCreatePaymentResponse {
  statusCode: string
  statusMessage: string
  reference: string
  paymentUrl: string
  vaNumber?: string
  qrString?: string
}

export class PaymentService {
  private merchantCode: string
  private apiKey: string
  private baseUrl: string
  private callbackUrl: string
  private returnUrl: string

  constructor() {
    this.merchantCode = process.env.DUITKU_MERCHANT_CODE || ''
    this.apiKey = process.env.DUITKU_API_KEY || ''
    this.callbackUrl = process.env.DUITKU_CALLBACK_URL || ''
    this.returnUrl = process.env.DUITKU_RETURN_URL || ''

    // Use sandbox or production based on environment
    this.baseUrl = process.env.DUITKU_ENV === 'production'
      ? 'https://passport.duitku.com'
      : 'https://sandbox.duitku.com'
  }

  /**
   * Generate MD5 signature for Duitku API authentication
   */
  private generateSignature(merchantOrderId: string, amount: number): string {
    const signatureString = `${this.merchantCode}${merchantOrderId}${amount}${this.apiKey}`
    return crypto.createHash('md5').update(signatureString).digest('hex')
  }

  /**
   * Create a payment request with Duitku
   */
  async createPayment(input: {
    userId: string
    packageId: string
    credits: number
    amount: number
    productName: string
    userEmail: string
    userName: string
  }) {
    try {
      // Generate unique merchant order ID
      const merchantOrderId = `LUMIKU-${Date.now()}-${input.userId.slice(0, 8)}`

      // Generate signature
      const signature = this.generateSignature(merchantOrderId, input.amount)

      // Create payment record in database (pending status)
      const payment = await prisma.payment.create({
        data: {
          userId: input.userId,
          merchantOrderId,
          reference: '', // Will be updated after Duitku response
          amount: input.amount,
          creditAmount: input.credits,
          status: 'pending',
          duitkuData: JSON.stringify({ packageId: input.packageId }),
        },
      })

      // Prepare request payload
      const requestPayload = {
        merchantCode: this.merchantCode,
        paymentAmount: input.amount,
        paymentMethod: 'VC', // Virtual Account (can be changed based on user selection)
        merchantOrderId,
        productDetails: input.productName,
        merchantUserInfo: input.userName,
        customerVaName: input.userName,
        email: input.userEmail,
        phoneNumber: '', // Optional
        callbackUrl: this.callbackUrl,
        returnUrl: this.returnUrl,
        signature,
        expiryPeriod: 1440, // 24 hours in minutes
      }

      // Call Duitku API
      const response = await fetch(`${this.baseUrl}/webapi/api/merchant/v2/inquiry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      })

      const duitkuResponse = await response.json() as DuitkuCreatePaymentResponse

      if (duitkuResponse.statusCode !== '00') {
        throw new Error(duitkuResponse.statusMessage || 'Failed to create payment')
      }

      // Update payment record with Duitku reference and payment URL
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          reference: duitkuResponse.reference,
          paymentUrl: duitkuResponse.paymentUrl,
          duitkuData: JSON.stringify({
            ...JSON.parse(payment.duitkuData || '{}'),
            duitkuResponse,
          }),
        },
      })

      return {
        paymentId: payment.id,
        merchantOrderId,
        reference: duitkuResponse.reference,
        paymentUrl: duitkuResponse.paymentUrl,
        amount: input.amount,
        credits: input.credits,
      }
    } catch (error: any) {
      console.error('Payment creation error:', error)
      throw new Error(error.message || 'Failed to create payment')
    }
  }

  /**
   * Handle payment callback from Duitku
   */
  async handleCallback(callbackData: any) {
    try {
      const {
        merchantOrderId,
        reference,
        amount,
        statusCode,
        statusMessage,
        signature: callbackSignature,
      } = callbackData

      // Verify signature
      const expectedSignature = crypto
        .createHash('md5')
        .update(`${this.merchantCode}${amount}${this.merchantCode}${reference}`)
        .digest('hex')

      if (callbackSignature !== expectedSignature) {
        throw new Error('Invalid callback signature')
      }

      // Find payment record
      const payment = await prisma.payment.findUnique({
        where: { merchantOrderId },
      })

      if (!payment) {
        throw new Error('Payment not found')
      }

      // Update payment status based on callback
      let newStatus = 'pending'
      if (statusCode === '00') {
        newStatus = 'success'
      } else if (statusCode === '01') {
        newStatus = 'pending'
      } else {
        newStatus = 'failed'
      }

      // Update payment record
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: newStatus,
          paymentMethod: callbackData.paymentMethod || payment.paymentMethod,
          duitkuData: JSON.stringify({
            ...JSON.parse(payment.duitkuData || '{}'),
            callback: callbackData,
          }),
        },
      })

      // If payment successful, add credits to user
      if (newStatus === 'success') {
        await this.addCreditsToUser(payment.userId, payment.creditAmount, payment.id)
      }

      return { success: true, status: newStatus }
    } catch (error: any) {
      console.error('Callback handling error:', error)
      throw new Error(error.message || 'Failed to handle callback')
    }
  }

  /**
   * Add credits to user balance
   */
  private async addCreditsToUser(userId: string, credits: number, paymentId: string) {
    try {
      // Get current balance
      const lastCredit = await prisma.credit.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })

      const currentBalance = lastCredit?.balance || 0
      const newBalance = currentBalance + credits

      // Create credit transaction
      await prisma.credit.create({
        data: {
          userId,
          amount: credits,
          balance: newBalance,
          type: 'purchase',
          description: `Credit purchase via Duitku payment`,
          paymentId,
        },
      })

      console.log(`Added ${credits} credits to user ${userId}. New balance: ${newBalance}`)
    } catch (error: any) {
      console.error('Error adding credits:', error)
      throw error
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(merchantOrderId: string) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { merchantOrderId },
        select: {
          id: true,
          merchantOrderId: true,
          reference: true,
          amount: true,
          creditAmount: true,
          status: true,
          paymentMethod: true,
          paymentUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      if (!payment) {
        throw new Error('Payment not found')
      }

      return payment
    } catch (error: any) {
      console.error('Get payment status error:', error)
      throw new Error(error.message || 'Failed to get payment status')
    }
  }

  /**
   * Get user's credit balance
   */
  async getCreditBalance(userId: string): Promise<number> {
    try {
      const lastCredit = await prisma.credit.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })

      return lastCredit?.balance || 0
    } catch (error) {
      console.error('Error getting credit balance:', error)
      return 0
    }
  }

  /**
   * Get user's credit transaction history
   */
  async getCreditHistory(userId: string) {
    try {
      const credits = await prisma.credit.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50, // Limit to last 50 transactions
      })

      return credits
    } catch (error: any) {
      console.error('Error getting credit history:', error)
      throw new Error('Failed to get credit history')
    }
  }
}
