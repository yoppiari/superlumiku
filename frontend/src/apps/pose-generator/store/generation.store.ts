import { create } from 'zustand'
import type {
  PoseGeneration,
  GeneratedPose,
  GenerateFormData,
  LoadingState,
  ProgressUpdate,
} from '../types'
import { poseGeneratorApi } from '../utils/api'

interface GenerationState extends LoadingState {
  // Data
  currentGeneration: PoseGeneration | null
  generationResults: GeneratedPose[]
  progress: ProgressUpdate | null

  // Actions
  startGeneration: (data: GenerateFormData) => Promise<string>
  fetchGenerationStatus: (generationId: string) => Promise<void>
  fetchGenerationResults: (generationId: string) => Promise<void>
  updateProgress: (progress: ProgressUpdate) => void
  addCompletedPose: (pose: GeneratedPose) => void
  clearGeneration: () => void
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
  // Initial state
  currentGeneration: null,
  generationResults: [],
  progress: null,
  isLoading: false,
  error: null,

  // Start generation
  startGeneration: async (data: GenerateFormData) => {
    set({ isLoading: true, error: null })

    try {
      const response = await poseGeneratorApi.startGeneration(data)

      set({
        currentGeneration: {
          id: response.generationId,
          status: response.status,
          totalExpectedPoses: response.totalPosesExpected,
          creditCharged: response.creditCharged,
          progress: 0,
          posesCompleted: 0,
          posesFailed: 0,
        } as PoseGeneration,
        progress: {
          generationId: response.generationId,
          progress: 0,
          posesCompleted: 0,
          posesFailed: 0,
          totalPoses: response.totalPosesExpected,
          estimatedTimeRemaining: response.estimatedCompletionTime,
        },
        isLoading: false,
      })

      return response.generationId
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to start generation',
        isLoading: false,
      })
      throw error
    }
  },

  // Fetch generation status
  fetchGenerationStatus: async (generationId: string) => {
    try {
      const response = await poseGeneratorApi.getGenerationStatus(generationId)

      set({
        currentGeneration: response.generation,
        progress: {
          generationId,
          progress: response.progress.percentage,
          posesCompleted: response.progress.posesCompleted,
          posesFailed: response.progress.posesFailed,
          totalPoses: response.progress.posesTotal,
          estimatedTimeRemaining: response.progress.estimatedTimeRemaining ?? undefined,
        },
      })
    } catch (error: any) {
      console.error('Failed to fetch generation status:', error)
    }
  },

  // Fetch generation results
  fetchGenerationResults: async (generationId: string) => {
    set({ isLoading: true, error: null })

    try {
      const response = await poseGeneratorApi.getGenerationResults(generationId)

      set({
        generationResults: response.results,
        currentGeneration: {
          ...get().currentGeneration,
          ...response.generation,
        } as PoseGeneration,
        isLoading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load results',
        isLoading: false,
      })
    }
  },

  // Update progress (from WebSocket)
  updateProgress: (progress: ProgressUpdate) => {
    set({ progress })

    // Update current generation if it exists
    const currentGeneration = get().currentGeneration
    if (currentGeneration && currentGeneration.id === progress.generationId) {
      set({
        currentGeneration: {
          ...currentGeneration,
          progress: progress.progress,
          posesCompleted: progress.posesCompleted,
          posesFailed: progress.posesFailed,
        },
      })
    }
  },

  // Add completed pose (from WebSocket)
  addCompletedPose: (pose: GeneratedPose) => {
    set({
      generationResults: [...get().generationResults, pose],
    })
  },

  // Clear generation data
  clearGeneration: () => {
    set({
      currentGeneration: null,
      generationResults: [],
      progress: null,
      error: null,
    })
  },
}))
