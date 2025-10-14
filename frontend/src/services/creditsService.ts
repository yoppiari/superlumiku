import { api } from '../lib/api'

export interface CreditBalance {
  balance: number
}

export interface CreditTransaction {
  id: string
  amount: number
  type: 'purchase' | 'usage' | 'refund'
  description?: string
  createdAt: string
}

export interface PaymentRequest {
  packageId: string
  credits: number
  amount: number
  productName: string
  type: 'subscription' | 'topup'
}

export interface PaymentResponse {
  paymentUrl: string
  reference: string
}

/**
 * Credits Service
 * Handles all credit-related API calls including balance, history, and payments
 */
export const creditsService = {
  /**
   * Get current credit balance
   */
  async getBalance(): Promise<CreditBalance> {
    const response = await api.get<CreditBalance>('/api/credits/balance')
    return response.data
  },

  /**
   * Get credit transaction history
   */
  async getHistory(): Promise<CreditTransaction[]> {
    const response = await api.get<CreditTransaction[]>('/api/credits/history')
    return response.data
  },

  /**
   * Create payment for credit purchase
   */
  async createPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    const response = await api.post<PaymentResponse>('/api/payment/duitku/create', paymentData)
    return response.data
  },
}
