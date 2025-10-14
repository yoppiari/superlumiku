import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import { timingSafeEqual } from 'crypto'
import { securityLogger, getClientIP } from '../lib/security-logger'
import {
  PaymentVerificationError,
  InvalidSignatureError,
  PaymentNotFoundError,
  PaymentCreationError,
} from '../errors/PaymentError'
import { env } from '../config/env'

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

interface DuitkuCallbackData {
  merchantOrderId: string
  reference: string
  amount: number | string
  merchantCode: string
  signature: string
  resultCode: string
  statusCode?: string
  statusMessage?: string
  paymentMethod?: string
  [key: string]: any
}

// In-memory storage for idempotency tracking (replace with Redis in production)
// Maps merchantOrderId to signature hash for detecting duplicate callbacks
const callbackIdempotencyStore = new Map<string, string>()

export class PaymentService {
  private merchantCode: string
  private apiKey: string
  private baseUrl: string
  private callbackUrl: string
  private returnUrl: string

  constructor() {
    // Use centralized env config (validated at startup)
    // No more direct process.env access - all values validated by Zod!
    this.merchantCode = env.DUITKU_MERCHANT_CODE
    this.apiKey = env.DUITKU_API_KEY
    this.callbackUrl = env.DUITKU_CALLBACK_URL
    this.returnUrl = env.DUITKU_RETURN_URL

    // Use validated base URL, with sandbox fallback based on DUITKU_ENV
    this.baseUrl = env.DUITKU_ENV === 'production'
      ? env.DUITKU_BASE_URL
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
   * Verify callback signature using timing-safe comparison
   *
   * SECURITY CRITICAL:
   * - Uses correct Duitku signature formula: MD5(merchantCode + amount + merchantOrderId + apiKey)
   * - Uses timing-safe comparison to prevent timing attacks
   * - Logs all verification failures for fraud detection
   *
   * @throws {InvalidSignatureError} if signature doesn't match
   */
  private verifyCallbackSignature(callbackData: DuitkuCallbackData): void {
    const { merchantOrderId, amount, merchantCode, signature: callbackSignature } = callbackData

    // Normalize amount to number
    const normalizedAmount = typeof amount === 'string' ? parseFloat(amount) : amount

    // CRITICAL FIX: Use correct Duitku signature formula
    // OLD (WRONG): MD5(merchantCode + amount + merchantCode + reference)
    // NEW (CORRECT): MD5(merchantCode + amount + merchantOrderId + apiKey)
    const signatureString = `${merchantCode}${normalizedAmount}${merchantOrderId}${this.apiKey}`

    const expectedSignature = crypto
      .createHash('md5')
      .update(signatureString)
      .digest('hex')

    // Convert signatures to buffers for timing-safe comparison
    const expectedBuffer = Buffer.from(expectedSignature, 'hex')
    const receivedBuffer = Buffer.from(callbackSignature, 'hex')

    // Length check first (fast fail for obviously wrong signatures)
    if (expectedBuffer.length !== receivedBuffer.length) {
      securityLogger.logInvalidSignature({
        merchantOrderId,
        amount: normalizedAmount,
        receivedSignature: callbackSignature,
      })
      throw new InvalidSignatureError({
        merchantOrderId,
        amount: normalizedAmount,
      })
    }

    // Timing-safe comparison (constant-time to prevent timing attacks)
    if (!timingSafeEqual(expectedBuffer, receivedBuffer)) {
      securityLogger.logInvalidSignature({
        merchantOrderId,
        amount: normalizedAmount,
        receivedSignature: callbackSignature,
      })
      throw new InvalidSignatureError({
        merchantOrderId,
        amount: normalizedAmount,
      })
    }

    // Signature verified successfully
  }

  /**
   * Check for duplicate callbacks (idempotency)
   *
   * Prevents replay attacks by ensuring each callback is processed only once.
   * Uses in-memory storage (replace with Redis in production for multi-instance deployments).
   *
   * @throws {DuplicateCallbackError} if callback already processed
   */
  private checkIdempotency(callbackData: DuitkuCallbackData): void {
    const { merchantOrderId, signature } = callbackData

    // Check if we've seen this callback before
    const existingSignature = callbackIdempotencyStore.get(merchantOrderId)

    if (existingSignature === signature) {
      securityLogger.logDuplicateCallback({ merchantOrderId })
      throw new PaymentVerificationError('Duplicate callback detected', {
        merchantOrderId,
      })
    }

    // Store this callback signature (expires in 24 hours in production with Redis)
    callbackIdempotencyStore.set(merchantOrderId, signature)

    // Clean up old entries to prevent memory leak (basic implementation)
    // In production, use Redis with TTL instead
    if (callbackIdempotencyStore.size > 10000) {
      const keysToDelete = Array.from(callbackIdempotencyStore.keys()).slice(0, 1000)
      keysToDelete.forEach((key) => callbackIdempotencyStore.delete(key))
    }
  }

  /**
   * Handle payment callback from Duitku
   *
   * SECURITY LAYERS:
   * 1. IP whitelist (middleware)
   * 2. Rate limiting (middleware)
   * 3. Signature verification (timing-safe)
   * 4. Idempotency check (replay attack prevention)
   * 5. Audit logging (all events logged)
   */
  async handleCallback(callbackData: DuitkuCallbackData, clientIP?: string) {
    try {
      const {
        merchantOrderId,
        reference,
        amount,
        statusCode,
        statusMessage,
        signature: callbackSignature,
      } = callbackData

      // SECURITY LAYER 3: Verify signature (timing-safe)
      this.verifyCallbackSignature(callbackData)

      // SECURITY LAYER 4: Check for duplicate callbacks (replay attack prevention)
      this.checkIdempotency(callbackData)

      // Find payment record
      const payment = await prisma.payment.findUnique({
        where: { merchantOrderId },
      })

      if (!payment) {
        securityLogger.logPaymentNotFound({ merchantOrderId, ip: clientIP })
        throw new PaymentNotFoundError(merchantOrderId)
      }

      // Normalize amount for comparison
      const normalizedAmount = typeof amount === 'string' ? parseFloat(amount) : amount

      // Verify amount matches (prevent amount tampering)
      if (Math.abs(payment.amount - normalizedAmount) > 0.01) {
        securityLogger.logPaymentFailure({
          reason: 'Amount mismatch',
          merchantOrderId,
          amount: normalizedAmount,
          ip: clientIP,
          metadata: {
            expectedAmount: payment.amount,
            receivedAmount: normalizedAmount,
          },
        })
        throw new PaymentVerificationError('Amount mismatch', {
          merchantOrderId,
          expectedAmount: payment.amount,
          receivedAmount: normalizedAmount,
        })
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

      // Update payment record with callback data
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: newStatus,
          paymentMethod: callbackData.paymentMethod || payment.paymentMethod,
          duitkuData: JSON.stringify({
            ...JSON.parse(payment.duitkuData || '{}'),
            callback: {
              ...callbackData,
              receivedAt: new Date().toISOString(),
              clientIP,
            },
          }),
        },
      })

      // If payment successful, add credits to user
      if (newStatus === 'success') {
        await this.addCreditsToUser(payment.userId, payment.creditAmount, payment.id)

        // Log successful payment
        securityLogger.logPaymentSuccess({
          merchantOrderId,
          amount: normalizedAmount,
          ip: clientIP,
          userId: payment.userId,
        })
      }

      return {
        success: true,
        status: newStatus,
        merchantOrderId,
        amount: normalizedAmount,
      }
    } catch (error: any) {
      // Re-throw payment errors (already logged)
      if (
        error instanceof PaymentVerificationError ||
        error instanceof PaymentNotFoundError
      ) {
        throw error
      }

      // Log unexpected errors
      console.error('[PAYMENT] Unexpected callback handling error:', error)
      securityLogger.logPaymentFailure({
        reason: 'Unexpected error',
        metadata: { error: error.message, stack: error.stack },
        ip: clientIP,
      })

      throw new PaymentVerificationError(
        'Failed to process payment callback',
        { originalError: error.message }
      )
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
