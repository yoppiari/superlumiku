import { create } from 'zustand'
import { creditsService } from '../services/creditsService'
import { useEffect } from 'react'

interface CreditState {
  balance: number | null
  isLoading: boolean
  error: string | null
  lastFetched: number | null
  fetchBalance: () => Promise<void>
  updateBalance: (balance: number) => void
  invalidate: () => void
}

// Cache duration: 30 seconds
const CACHE_DURATION = 30000

/**
 * Zustand store for credit balance with intelligent caching
 * Single source of truth for all credit balance displays
 */
export const useCreditStore = create<CreditState>((set, get) => ({
  balance: null,
  isLoading: false,
  error: null,
  lastFetched: null,

  /**
   * Fetch credit balance from API with caching
   * Prevents redundant API calls within 30 seconds
   */
  fetchBalance: async () => {
    const now = Date.now()
    const { lastFetched, isLoading } = get()

    // Return cached value if still fresh
    if (lastFetched && (now - lastFetched) < CACHE_DURATION) {
      console.log('[useCredits] Using cached balance, age:', (now - lastFetched) / 1000, 'seconds')
      return
    }

    // Prevent concurrent requests
    if (isLoading) {
      console.log('[useCredits] Fetch already in progress, skipping')
      return
    }

    console.log('[useCredits] Fetching fresh credit balance from API')
    set({ isLoading: true, error: null })

    try {
      const data = await creditsService.getBalance()
      console.log('[useCredits] Balance fetched successfully:', data.balance)

      set({
        balance: data.balance,
        isLoading: false,
        lastFetched: now,
        error: null
      })
    } catch (error: any) {
      console.error('[useCredits] Failed to fetch balance:', error)
      set({
        isLoading: false,
        error: error.message || 'Failed to fetch credit balance'
      })
    }
  },

  /**
   * Update balance immediately without API call
   * Use after successful transactions
   */
  updateBalance: (balance) => {
    console.log('[useCredits] Balance updated to:', balance)
    set({ balance, lastFetched: Date.now(), error: null })
  },

  /**
   * Invalidate cache to force next fetch
   * Use when you need guaranteed fresh data
   */
  invalidate: () => {
    console.log('[useCredits] Cache invalidated')
    set({ lastFetched: null })
  },
}))

/**
 * React hook to fetch and display credit balance
 * Automatically fetches on mount with intelligent caching
 *
 * @example
 * const { balance, isLoading, error, refetch } = useCredits()
 *
 * return (
 *   <span>{isLoading ? '...' : balance?.toLocaleString()}</span>
 * )
 */
export const useCredits = () => {
  const { balance, isLoading, error, fetchBalance } = useCreditStore()

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  return {
    balance,
    isLoading,
    error,
    refetch: fetchBalance
  }
}

/**
 * Update credit balance after transaction
 * Call this after successful payment or credit deduction
 *
 * @example
 * import { updateCreditBalance } from '../hooks/useCredits'
 *
 * // After successful payment
 * updateCreditBalance(newBalance)
 */
export const updateCreditBalance = (balance: number) => {
  useCreditStore.getState().updateBalance(balance)
}

/**
 * Force refresh credit balance (invalidates cache)
 * Use when you need guaranteed fresh data from API
 *
 * @example
 * import { refreshCreditBalance } from '../hooks/useCredits'
 *
 * await refreshCreditBalance()
 */
export const refreshCreditBalance = async () => {
  useCreditStore.getState().invalidate()
  await useCreditStore.getState().fetchBalance()
}
