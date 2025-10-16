import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name?: string
  creditBalance: number
  storageQuota?: number
  storageUsed?: number
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
  updateCreditBalance: (balance: number) => void
  updateStorageUsed: (storageUsed: number) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        // Set token in localStorage first (synchronous)
        localStorage.setItem('token', token)

        // Then update Zustand state
        set({ user, token, isAuthenticated: true })

        // Verify token was actually saved
        const savedToken = localStorage.getItem('token')
        if (savedToken !== token) {
          console.error('[AUTH] Token storage verification failed')
        }
      },

      logout: () => {
        localStorage.removeItem('token')
        set({ user: null, token: null, isAuthenticated: false })
      },

      updateCreditBalance: (balance) =>
        set((state) => ({
          user: state.user ? { ...state.user, creditBalance: balance } : null,
        })),

      updateStorageUsed: (storageUsed: number) =>
        set((state) => ({
          user: state.user ? { ...state.user, storageUsed } : null,
        })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)