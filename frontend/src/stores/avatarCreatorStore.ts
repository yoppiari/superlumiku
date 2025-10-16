import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import api, { getAbsoluteImageUrl } from '../lib/api'
import { extractErrorMessage, logError } from '../utils/errorHandler'

// ===== Types =====

export interface AvatarProject {
  id: string
  userId: string
  name: string
  description: string | null
  avatars: Avatar[]
  createdAt: string
  updatedAt: string
}

export interface Avatar {
  id: string
  userId: string
  projectId: string
  name: string
  baseImageUrl: string
  thumbnailUrl: string | null
  gender: string | null
  ageRange: string | null
  style: string | null
  ethnicity: string | null
  usageCount: number
  lastUsedAt: string | null
  sourceType: string
  createdAt: string
  updatedAt: string
}

export interface AvatarUsageHistory {
  id: string
  avatarId: string
  userId: string
  appId: string
  appName: string
  action: string
  referenceId: string | null
  referenceType: string | null
  metadata: string | null
  createdAt: string
}

export interface AvatarUsageSummary {
  appId: string
  appName: string
  count: number
  lastUsed: string
}

export interface AvatarStats {
  totalAvatars: number
  recentUploads: number
  totalUsage: number
  averageUsage: number
}

export interface AvatarGeneration {
  id: string
  userId: string
  projectId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  prompt: string
  options: string
  avatarId: string | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

export interface AvatarPreset {
  id: string
  name: string
  description: string
  category: string
  imageUrl: string
  thumbnailUrl: string | null
  generationPrompt: string
  personaName: string | null
  personaAge: number | null
  personaPersonality: string | null
  personaBackground: string | null
  gender: string | null
  ageRange: string | null
  ethnicity: string | null
  bodyType: string | null
  hairStyle: string | null
  hairColor: string | null
  eyeColor: string | null
  skinTone: string | null
  style: string | null
  popularity: number
  createdAt: string
  updatedAt: string
}

// ===== Store State =====

interface AvatarCreatorState {
  // Projects
  projects: AvatarProject[]
  currentProject: AvatarProject | null
  isLoadingProjects: boolean

  // UI State
  isUploading: boolean
  isGenerating: boolean
  isSaving: boolean
  lastSaved: Date | null

  // Generation tracking
  activeGenerations: Map<string, AvatarGeneration>
  generationPollingIntervals: Map<string, ReturnType<typeof setInterval>>

  // Presets
  presets: AvatarPreset[]
  isLoadingPresets: boolean

  // Actions - Projects
  loadProjects: () => Promise<void>
  createProject: (name: string, description?: string) => Promise<AvatarProject>
  selectProject: (projectId: string) => Promise<void>
  updateProject: (projectId: string, data: { name?: string; description?: string }) => Promise<void>
  deleteProject: (projectId: string) => Promise<void>
  clearCurrentProject: () => void

  // Actions - Avatars
  uploadAvatar: (projectId: string, file: File, metadata: {
    name: string
    gender?: string
    ageRange?: string
    style?: string
    ethnicity?: string
  }) => Promise<Avatar>
  generateAvatar: (projectId: string, prompt: string, metadata: {
    name: string
    gender?: string
    ageRange?: string
    style?: string
  }) => Promise<AvatarGeneration>
  checkGenerationStatus: (generationId: string) => Promise<void>
  startGenerationPolling: (generationId: string) => void
  stopGenerationPolling: (generationId: string) => void
  deleteAvatar: (avatarId: string) => Promise<void>

  // Actions - Presets
  loadPresets: (category?: string) => Promise<void>
  createAvatarFromPreset: (projectId: string, presetId: string, customName?: string) => Promise<AvatarGeneration>

  // Actions - Utility
  reset: () => void
}

// ===== Store =====

export const useAvatarCreatorStore = create<AvatarCreatorState>()(
  immer((set) => ({
    // Initial State
    projects: [],
    currentProject: null,
    isLoadingProjects: false,
    isUploading: false,
    isGenerating: false,
    isSaving: false,
    lastSaved: null,
    activeGenerations: new Map(),
    generationPollingIntervals: new Map(),
    presets: [],
    isLoadingPresets: false,

    // ===== Projects Actions =====

    loadProjects: async () => {
      set((state) => {
        state.isLoadingProjects = true
      })

      try {
        const res = await api.get('/api/apps/avatar-creator/projects')

        // Transform image URLs to absolute
        const projects = res.data.projects.map((project: AvatarProject) => ({
          ...project,
          avatars: project.avatars.map((avatar) => ({
            ...avatar,
            baseImageUrl: getAbsoluteImageUrl(avatar.baseImageUrl) || avatar.baseImageUrl,
            thumbnailUrl: getAbsoluteImageUrl(avatar.thumbnailUrl) || avatar.thumbnailUrl,
          }))
        }))

        set((state) => {
          state.projects = projects
          state.isLoadingProjects = false
        })
      } catch (error) {
        console.error('Failed to load projects:', error)
        set((state) => {
          state.isLoadingProjects = false
        })
        throw error
      }
    },

    createProject: async (name: string, description?: string) => {
      try {
        const res = await api.post('/api/apps/avatar-creator/projects', {
          name,
          description,
        })

        const newProject = res.data.project

        set((state) => {
          state.projects.unshift(newProject)
          state.currentProject = newProject
        })

        return newProject
      } catch (error) {
        console.error('Failed to create project:', error)
        throw error
      }
    },

    selectProject: async (projectId: string) => {
      try {
        const res = await api.get(`/api/apps/avatar-creator/projects/${projectId}`)

        // Transform image URLs to absolute
        const project = {
          ...res.data.project,
          avatars: res.data.project.avatars.map((avatar: Avatar) => ({
            ...avatar,
            baseImageUrl: getAbsoluteImageUrl(avatar.baseImageUrl) || avatar.baseImageUrl,
            thumbnailUrl: getAbsoluteImageUrl(avatar.thumbnailUrl) || avatar.thumbnailUrl,
          }))
        }

        set((state) => {
          state.currentProject = project
        })
      } catch (error) {
        console.error('Failed to load project:', error)
        throw error
      }
    },

    updateProject: async (projectId: string, data: { name?: string; description?: string }) => {
      set((state) => {
        state.isSaving = true
      })

      try {
        await api.put(`/api/apps/avatar-creator/projects/${projectId}`, data)

        set((state) => {
          const projectIndex = state.projects.findIndex((p) => p.id === projectId)
          if (projectIndex !== -1) {
            if (data.name !== undefined) state.projects[projectIndex].name = data.name
            if (data.description !== undefined) state.projects[projectIndex].description = data.description
          }

          if (state.currentProject?.id === projectId) {
            if (data.name !== undefined) state.currentProject.name = data.name
            if (data.description !== undefined) state.currentProject.description = data.description
          }

          state.isSaving = false
          state.lastSaved = new Date()
        })
      } catch (error) {
        set((state) => {
          state.isSaving = false
        })
        console.error('Failed to update project:', error)
        throw error
      }
    },

    deleteProject: async (projectId: string) => {
      try {
        await api.delete(`/api/apps/avatar-creator/projects/${projectId}`)

        set((state) => {
          state.projects = state.projects.filter((p) => p.id !== projectId)
          if (state.currentProject?.id === projectId) {
            state.currentProject = null
          }
        })
      } catch (error) {
        console.error('Failed to delete project:', error)
        throw error
      }
    },

    clearCurrentProject: () => {
      set((state) => {
        state.currentProject = null
      })
    },

    // ===== Avatars Actions =====

    uploadAvatar: async (projectId: string, file: File, metadata: {
      name: string
      gender?: string
      ageRange?: string
      style?: string
      ethnicity?: string
    }) => {
      set((state) => {
        state.isUploading = true
        state.isSaving = true
      })

      try {
        const formData = new FormData()
        formData.append('image', file)
        formData.append('name', metadata.name)
        if (metadata.gender) formData.append('gender', metadata.gender)
        if (metadata.ageRange) formData.append('ageRange', metadata.ageRange)
        if (metadata.style) formData.append('style', metadata.style)
        if (metadata.ethnicity) formData.append('ethnicity', metadata.ethnicity)

        const res = await api.post(
          `/api/apps/avatar-creator/projects/${projectId}/avatars/upload`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        )

        // Transform image URLs to absolute
        const newAvatar = {
          ...res.data.avatar,
          baseImageUrl: getAbsoluteImageUrl(res.data.avatar.baseImageUrl) || res.data.avatar.baseImageUrl,
          thumbnailUrl: getAbsoluteImageUrl(res.data.avatar.thumbnailUrl) || res.data.avatar.thumbnailUrl,
        }

        set((state) => {
          if (state.currentProject?.id === projectId) {
            state.currentProject.avatars.unshift(newAvatar)
          }
          state.isUploading = false
          state.isSaving = false
          state.lastSaved = new Date()
        })

        return newAvatar
      } catch (error) {
        set((state) => {
          state.isUploading = false
          state.isSaving = false
        })
        console.error('Failed to upload avatar:', error)
        throw error
      }
    },

    generateAvatar: async (projectId: string, prompt: string, metadata: {
      name: string
      gender?: string
      ageRange?: string
      style?: string
    }) => {
      set((state) => {
        state.isGenerating = true
      })

      try {
        const res = await api.post(
          `/api/apps/avatar-creator/projects/${projectId}/avatars/generate`,
          {
            prompt,
            name: metadata.name,
            gender: metadata.gender,
            ageRange: metadata.ageRange,
            style: metadata.style,
          }
        )

        const generation: AvatarGeneration = res.data.generation

        set((state) => {
          state.activeGenerations.set(generation.id, generation)
          state.isGenerating = false
        })

        // Start polling for status
        useAvatarCreatorStore.getState().startGenerationPolling(generation.id)

        return generation
      } catch (error: any) {
        set((state) => {
          state.isGenerating = false
        })

        // Extract and log proper error message
        const errorMessage = extractErrorMessage(error, 'Failed to generate avatar')
        logError('Avatar Generation (Store)', error)

        // Create user-friendly error to throw
        const userError = new Error(errorMessage)
        ;(userError as any).cause = error
        throw userError
      }
    },

    checkGenerationStatus: async (generationId: string) => {
      try {
        const res = await api.get(`/api/apps/avatar-creator/generations/${generationId}`)
        const generation: AvatarGeneration = res.data.generation

        set((state) => {
          state.activeGenerations.set(generationId, generation)

          // If completed, fetch avatar and add to project
          if (generation.status === 'completed' && generation.avatarId) {
            useAvatarCreatorStore.getState().stopGenerationPolling(generationId)

            // Fetch the completed avatar
            api.get(`/api/apps/avatar-creator/avatars/${generation.avatarId}`)
              .then((avatarRes) => {
                // Transform image URLs to absolute
                const avatar = {
                  ...avatarRes.data.avatar,
                  baseImageUrl: getAbsoluteImageUrl(avatarRes.data.avatar.baseImageUrl) || avatarRes.data.avatar.baseImageUrl,
                  thumbnailUrl: getAbsoluteImageUrl(avatarRes.data.avatar.thumbnailUrl) || avatarRes.data.avatar.thumbnailUrl,
                }

                set((innerState) => {
                  if (innerState.currentProject?.id === generation.projectId) {
                    // Check for duplicates before adding
                    const exists = innerState.currentProject.avatars.some(a => a.id === avatar.id)
                    if (!exists) {
                      innerState.currentProject.avatars.unshift(avatar)
                    }
                  }
                  innerState.activeGenerations.delete(generationId)
                })
              })
              .catch((err) => {
                console.error('Failed to fetch completed avatar:', err)

                // Update generation with error so UI shows it
                set((innerState) => {
                  const gen = innerState.activeGenerations.get(generationId)
                  if (gen) {
                    gen.status = 'failed'
                    gen.errorMessage = 'Generated but failed to load. Please refresh the page.'
                    innerState.activeGenerations.set(generationId, gen)
                  }
                })
              })
          }

          // If failed, stop polling
          if (generation.status === 'failed') {
            useAvatarCreatorStore.getState().stopGenerationPolling(generationId)
          }
        })
      } catch (error) {
        console.error('Failed to check generation status:', error)
      }
    },

    startGenerationPolling: (generationId: string) => {
      const { generationPollingIntervals, checkGenerationStatus } = useAvatarCreatorStore.getState()

      // Don't start if already polling
      if (generationPollingIntervals.has(generationId)) {
        return
      }

      // Poll every 5 seconds
      const interval = setInterval(() => {
        checkGenerationStatus(generationId)
      }, 5000)

      set((state) => {
        state.generationPollingIntervals.set(generationId, interval)
      })

      // Do initial check immediately
      checkGenerationStatus(generationId)
    },

    stopGenerationPolling: (generationId: string) => {
      const { generationPollingIntervals } = useAvatarCreatorStore.getState()
      const interval = generationPollingIntervals.get(generationId)

      if (interval) {
        clearInterval(interval)
        set((state) => {
          state.generationPollingIntervals.delete(generationId)
        })
      }
    },

    deleteAvatar: async (avatarId: string) => {
      set((state) => {
        state.isSaving = true
      })

      try {
        await api.delete(`/api/apps/avatar-creator/avatars/${avatarId}`)

        set((state) => {
          if (state.currentProject) {
            state.currentProject.avatars = state.currentProject.avatars.filter(
              (a) => a.id !== avatarId
            )
          }
          state.isSaving = false
          state.lastSaved = new Date()
        })
      } catch (error) {
        set((state) => {
          state.isSaving = false
        })
        console.error('Failed to delete avatar:', error)
        throw error
      }
    },

    // ===== Presets Actions =====

    loadPresets: async (category?: string) => {
      set((state) => {
        state.isLoadingPresets = true
      })

      try {
        const url = category
          ? `/api/apps/avatar-creator/presets?category=${category}`
          : '/api/apps/avatar-creator/presets'

        const res = await api.get(url)
        set((state) => {
          state.presets = res.data.presets
          state.isLoadingPresets = false
        })
      } catch (error) {
        console.error('Failed to load presets:', error)
        set((state) => {
          state.isLoadingPresets = false
        })
        throw error
      }
    },

    createAvatarFromPreset: async (projectId: string, presetId: string, customName?: string) => {
      set((state) => {
        state.isGenerating = true
      })

      try {
        const res = await api.post(
          `/api/apps/avatar-creator/projects/${projectId}/avatars/from-preset`,
          {
            presetId,
            customName,
          }
        )

        const generation: AvatarGeneration = res.data.generation

        set((state) => {
          state.activeGenerations.set(generation.id, generation)
          state.isGenerating = false
        })

        // Start polling for status
        useAvatarCreatorStore.getState().startGenerationPolling(generation.id)

        return generation
      } catch (error) {
        set((state) => {
          state.isGenerating = false
        })
        console.error('Failed to create avatar from preset:', error)
        throw error
      }
    },

    // ===== Utility Actions =====

    reset: () => {
      // Clear all polling intervals
      const { generationPollingIntervals } = useAvatarCreatorStore.getState()
      generationPollingIntervals.forEach((interval) => clearInterval(interval))

      set((state) => {
        state.projects = []
        state.currentProject = null
        state.isUploading = false
        state.isGenerating = false
        state.activeGenerations = new Map()
        state.generationPollingIntervals = new Map()
      })
    },
  }))
)
