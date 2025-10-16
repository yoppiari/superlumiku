import { create } from 'zustand'
import type { PoseLibraryItem, PoseCategory, PoseLibraryFilters, LoadingState } from '../types'
import { poseGeneratorApi } from '../utils/api'

interface PoseLibraryState extends LoadingState {
  // Data
  poses: PoseLibraryItem[]
  categories: PoseCategory[]
  selectedPoses: string[]

  // Pagination
  currentPage: number
  totalPages: number
  hasMore: boolean

  // Filters
  filters: PoseLibraryFilters

  // Actions
  fetchPoses: (filters?: PoseLibraryFilters) => Promise<void>
  fetchCategories: () => Promise<void>
  setFilters: (filters: Partial<PoseLibraryFilters>) => void
  clearFilters: () => void
  selectPose: (poseId: string) => void
  unselectPose: (poseId: string) => void
  clearSelection: () => void
  togglePose: (poseId: string) => void
  setPage: (page: number) => void
}

const DEFAULT_FILTERS: PoseLibraryFilters = {
  page: 1,
  limit: 24,
}

export const usePoseLibraryStore = create<PoseLibraryState>((set, get) => ({
  // Initial state
  poses: [],
  categories: [],
  selectedPoses: [],
  currentPage: 1,
  totalPages: 1,
  hasMore: false,
  isLoading: false,
  error: null,
  filters: DEFAULT_FILTERS,

  // Fetch poses with filters
  fetchPoses: async (filters?: PoseLibraryFilters) => {
    set({ isLoading: true, error: null })

    try {
      const currentFilters = filters || get().filters
      const response = await poseGeneratorApi.getPoseLibrary(currentFilters)

      set({
        poses: response.poses,
        currentPage: response.pagination.page,
        totalPages: response.pagination.totalPages,
        hasMore: response.pagination.hasMore,
        isLoading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load poses',
        isLoading: false,
      })
    }
  },

  // Fetch categories
  fetchCategories: async () => {
    try {
      const response = await poseGeneratorApi.getCategories()
      set({ categories: response.categories })
    } catch (error: any) {
      console.error('Failed to load categories:', error)
    }
  },

  // Set filters and refetch
  setFilters: (newFilters: Partial<PoseLibraryFilters>) => {
    const updatedFilters = { ...get().filters, ...newFilters, page: 1 }
    set({ filters: updatedFilters })
    get().fetchPoses(updatedFilters)
  },

  // Clear filters
  clearFilters: () => {
    set({ filters: DEFAULT_FILTERS })
    get().fetchPoses(DEFAULT_FILTERS)
  },

  // Pose selection
  selectPose: (poseId: string) => {
    const { selectedPoses } = get()
    if (!selectedPoses.includes(poseId)) {
      set({ selectedPoses: [...selectedPoses, poseId] })
    }
  },

  unselectPose: (poseId: string) => {
    set({ selectedPoses: get().selectedPoses.filter(id => id !== poseId) })
  },

  clearSelection: () => {
    set({ selectedPoses: [] })
  },

  togglePose: (poseId: string) => {
    const { selectedPoses } = get()
    if (selectedPoses.includes(poseId)) {
      get().unselectPose(poseId)
    } else {
      get().selectPose(poseId)
    }
  },

  // Pagination
  setPage: (page: number) => {
    const updatedFilters = { ...get().filters, page }
    set({ filters: updatedFilters })
    get().fetchPoses(updatedFilters)
  },
}))
