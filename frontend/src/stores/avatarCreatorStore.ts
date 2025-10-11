import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import api from '../lib/api'

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
  sourceType: string
  createdAt: string
}

export interface AvatarStats {
  totalAvatars: number
  recentUploads: number
  totalUsage: number
  averageUsage: number
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
  }) => Promise<Avatar>
  deleteAvatar: (avatarId: string) => Promise<void>

  // Actions - Utility
  reset: () => void
}

// ===== Store =====

export const useAvatarCreatorStore = create<AvatarCreatorState>()(
  immer((set, get) => ({
    // Initial State
    projects: [],
    currentProject: null,
    isLoadingProjects: false,
    isUploading: false,
    isGenerating: false,
    isSaving: false,
    lastSaved: null,

    // ===== Projects Actions =====

    loadProjects: async () => {
      set((state) => {
        state.isLoadingProjects = true
      })

      try {
        const res = await api.get('/api/apps/avatar-creator/projects')
        set((state) => {
          state.projects = res.data.projects
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

        set((state) => {
          state.currentProject = res.data.project
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
          `/api/apps/avatar-creator/projects/${projectId}/avatars`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        )

        const newAvatar = res.data.avatar

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

        const newAvatar = res.data.avatar

        set((state) => {
          if (state.currentProject?.id === projectId) {
            state.currentProject.avatars.unshift(newAvatar)
          }
          state.isGenerating = false
        })

        return newAvatar
      } catch (error) {
        set((state) => {
          state.isGenerating = false
        })
        console.error('Failed to generate avatar:', error)
        throw error
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

    // ===== Utility Actions =====

    reset: () => {
      set((state) => {
        state.projects = []
        state.currentProject = null
        state.isUploading = false
        state.isGenerating = false
      })
    },
  }))
)
