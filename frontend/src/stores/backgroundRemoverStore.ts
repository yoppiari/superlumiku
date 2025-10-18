import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import api from '../lib/api'

// ===== Types =====

export type QualityTier = 'basic' | 'standard' | 'professional' | 'industry'

export interface BackgroundRemovalJob {
  id: string
  userId: string
  batchId: string | null
  originalImagePath: string
  originalImageUrl: string
  processedImagePath: string | null
  processedImageUrl: string | null
  qualityTier: QualityTier
  status: 'pending' | 'processing' | 'completed' | 'failed'
  errorMessage: string | null
  creditsUsed: number
  processingTime: number | null
  createdAt: string
  updatedAt: string
}

export interface BatchJob {
  id: string
  userId: string
  name: string
  qualityTier: QualityTier
  totalImages: number
  completedImages: number
  failedImages: number
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial'
  totalCreditsUsed: number
  createdAt: string
  updatedAt: string
  jobs: BackgroundRemovalJob[]
}

export interface Subscription {
  id: string
  userId: string
  plan: 'starter' | 'pro'
  status: 'active' | 'cancelled' | 'expired'
  dailyLimit: number
  remainingRemovals: number
  nextResetDate: string
  createdAt: string
  updatedAt: string
}

export interface Stats {
  totalJobs: number
  totalBatches: number
  creditsSpent: number
  hasActiveSubscription: boolean
}

// ===== Store State =====

interface BackgroundRemoverState {
  // State
  jobs: BackgroundRemovalJob[]
  batches: BatchJob[]
  currentBatch: BatchJob | null
  subscription: Subscription | null
  stats: Stats | null
  isLoading: boolean
  isUploading: boolean
  error: string | null

  // Polling
  batchPollingIntervals: Record<string, ReturnType<typeof setInterval>>

  // Actions - Jobs
  loadJobs: () => Promise<void>
  loadStats: () => Promise<void>

  // Actions - Single Upload
  uploadSingleImage: (file: File, tier: QualityTier) => Promise<BackgroundRemovalJob>

  // Actions - Batch Upload
  uploadBatch: (files: File[], tier: QualityTier, batchName?: string) => Promise<BatchJob>
  getBatchStatus: (batchId: string) => Promise<BatchJob>
  downloadBatch: (batchId: string) => Promise<void>
  startBatchPolling: (batchId: string) => void
  stopBatchPolling: (batchId: string) => void

  // Actions - Subscription
  loadSubscription: () => Promise<void>
  subscribe: (plan: 'starter' | 'pro') => Promise<void>
  cancelSubscription: () => Promise<void>

  // Utility
  reset: () => void
}

// ===== Store =====

export const useBackgroundRemoverStore = create<BackgroundRemoverState>()(
  immer((set) => ({
    // Initial State
    jobs: [],
    batches: [],
    currentBatch: null,
    subscription: null,
    stats: null,
    isLoading: false,
    isUploading: false,
    error: null,
    batchPollingIntervals: {},

    // ===== Jobs Actions =====

    loadJobs: async () => {
      set((state) => {
        state.isLoading = true
        state.error = null
      })

      try {
        const res = await api.get('/api/background-remover/jobs')
        set((state) => {
          state.jobs = res.data.jobs || []
          state.isLoading = false
        })
      } catch (error: any) {
        console.error('Failed to load jobs:', error)
        set((state) => {
          state.error = error.response?.data?.error || 'Failed to load jobs'
          state.isLoading = false
        })
      }
    },

    loadStats: async () => {
      try {
        const res = await api.get('/api/background-remover/stats')
        set((state) => {
          state.stats = res.data.stats
        })
      } catch (error: any) {
        console.error('Failed to load stats:', error)
      }
    },

    // ===== Single Upload =====

    uploadSingleImage: async (file: File, tier: QualityTier) => {
      set((state) => {
        state.isUploading = true
        state.error = null
      })

      try {
        const formData = new FormData()
        formData.append('image', file)
        formData.append('qualityTier', tier)

        const res = await api.post('/api/background-remover/remove-single', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })

        const job = res.data.job

        set((state) => {
          state.jobs.unshift(job)
          state.isUploading = false
        })

        return job
      } catch (error: any) {
        console.error('Failed to upload image:', error)
        set((state) => {
          state.error = error.response?.data?.error || 'Failed to upload image'
          state.isUploading = false
        })
        throw error
      }
    },

    // ===== Batch Upload =====

    uploadBatch: async (files: File[], tier: QualityTier, batchName?: string) => {
      set((state) => {
        state.isUploading = true
        state.error = null
      })

      try {
        const formData = new FormData()
        files.forEach((file) => {
          formData.append('images', file)
        })
        formData.append('qualityTier', tier)
        if (batchName) {
          formData.append('batchName', batchName)
        }

        const res = await api.post('/api/background-remover/remove-batch', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })

        const batch = res.data.batch

        set((state) => {
          state.batches.unshift(batch)
          state.currentBatch = batch
          state.isUploading = false
        })

        // Start polling for batch status
        useBackgroundRemoverStore.getState().startBatchPolling(batch.id)

        return batch
      } catch (error: any) {
        console.error('Failed to upload batch:', error)
        set((state) => {
          state.error = error.response?.data?.error || 'Failed to upload batch'
          state.isUploading = false
        })
        throw error
      }
    },

    getBatchStatus: async (batchId: string) => {
      try {
        const res = await api.get(`/api/background-remover/batches/${batchId}`)
        const batch = res.data.batch

        set((state) => {
          // Update in batches array
          const index = state.batches.findIndex((b) => b.id === batchId)
          if (index !== -1) {
            state.batches[index] = batch
          }

          // Update currentBatch if it's the same
          if (state.currentBatch?.id === batchId) {
            state.currentBatch = batch
          }

          // Stop polling if completed or failed
          if (batch.status === 'completed' || batch.status === 'failed' || batch.status === 'partial') {
            useBackgroundRemoverStore.getState().stopBatchPolling(batchId)
          }
        })

        return batch
      } catch (error: any) {
        console.error('Failed to get batch status:', error)
        throw error
      }
    },

    downloadBatch: async (batchId: string) => {
      try {
        const res = await api.get(`/api/background-remover/batches/${batchId}/download`, {
          responseType: 'blob',
        })

        // Create download link
        const url = window.URL.createObjectURL(new Blob([res.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `batch-${batchId}.zip`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      } catch (error: any) {
        console.error('Failed to download batch:', error)
        throw error
      }
    },

    startBatchPolling: (batchId: string) => {
      const { batchPollingIntervals, getBatchStatus } = useBackgroundRemoverStore.getState()

      // Don't start if already polling
      if (batchId in batchPollingIntervals) {
        return
      }

      // Poll every 5 seconds
      const interval = setInterval(() => {
        getBatchStatus(batchId)
      }, 5000)

      set((state) => {
        state.batchPollingIntervals[batchId] = interval
      })

      // Do initial check immediately
      getBatchStatus(batchId)
    },

    stopBatchPolling: (batchId: string) => {
      const { batchPollingIntervals } = useBackgroundRemoverStore.getState()
      const interval = batchPollingIntervals[batchId]

      if (interval) {
        clearInterval(interval)
        set((state) => {
          delete state.batchPollingIntervals[batchId]
        })
      }
    },

    // ===== Subscription Actions =====

    loadSubscription: async () => {
      try {
        const res = await api.get('/api/background-remover/subscription')
        set((state) => {
          state.subscription = res.data.subscription
        })
      } catch (error: any) {
        console.error('Failed to load subscription:', error)
        set((state) => {
          state.subscription = null
        })
      }
    },

    subscribe: async (plan: 'starter' | 'pro') => {
      try {
        const res = await api.post('/api/background-remover/subscription/subscribe', { plan })
        set((state) => {
          state.subscription = res.data.subscription
        })
      } catch (error: any) {
        console.error('Failed to subscribe:', error)
        throw error
      }
    },

    cancelSubscription: async () => {
      try {
        await api.post('/api/background-remover/subscription/cancel')
        set((state) => {
          if (state.subscription) {
            state.subscription.status = 'cancelled'
          }
        })
      } catch (error: any) {
        console.error('Failed to cancel subscription:', error)
        throw error
      }
    },

    // ===== Utility =====

    reset: () => {
      // Clear all polling intervals
      const { batchPollingIntervals } = useBackgroundRemoverStore.getState()
      Object.values(batchPollingIntervals).forEach((interval) => clearInterval(interval))

      set((state) => {
        state.jobs = []
        state.batches = []
        state.currentBatch = null
        state.subscription = null
        state.stats = null
        state.batchPollingIntervals = {}
      })
    },
  }))
)
