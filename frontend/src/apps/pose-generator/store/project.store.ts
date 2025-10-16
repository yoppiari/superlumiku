import { create } from 'zustand'
import type { PoseGeneratorProject, ProjectFilters, CreateProjectFormData, LoadingState } from '../types'
import { poseGeneratorApi } from '../utils/api'

interface ProjectState extends LoadingState {
  // Data
  projects: PoseGeneratorProject[]
  currentProject: PoseGeneratorProject | null

  // Pagination
  currentPage: number
  totalPages: number
  hasMore: boolean

  // Filters
  filters: ProjectFilters

  // Actions
  fetchProjects: (filters?: ProjectFilters) => Promise<void>
  fetchProjectById: (projectId: string) => Promise<void>
  createProject: (data: CreateProjectFormData) => Promise<PoseGeneratorProject>
  updateProject: (projectId: string, data: Partial<CreateProjectFormData>) => Promise<void>
  deleteProject: (projectId: string) => Promise<void>
  setCurrentProject: (project: PoseGeneratorProject | null) => void
  setFilters: (filters: Partial<ProjectFilters>) => void
  setPage: (page: number) => void
}

const DEFAULT_FILTERS: ProjectFilters = {
  page: 1,
  limit: 10,
  status: 'active',
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  // Initial state
  projects: [],
  currentProject: null,
  currentPage: 1,
  totalPages: 1,
  hasMore: false,
  isLoading: false,
  error: null,
  filters: DEFAULT_FILTERS,

  // Fetch projects
  fetchProjects: async (filters?: ProjectFilters) => {
    set({ isLoading: true, error: null })

    try {
      const currentFilters = filters || get().filters
      const response = await poseGeneratorApi.getProjects(currentFilters)

      set({
        projects: response.projects,
        currentPage: response.pagination.page,
        totalPages: response.pagination.totalPages,
        hasMore: response.pagination.hasMore,
        isLoading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load projects',
        isLoading: false,
      })
    }
  },

  // Fetch single project
  fetchProjectById: async (projectId: string) => {
    set({ isLoading: true, error: null })

    try {
      const response = await poseGeneratorApi.getProjectById(projectId)
      set({ currentProject: response.project, isLoading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to load project',
        isLoading: false,
      })
    }
  },

  // Create project
  createProject: async (data: CreateProjectFormData) => {
    set({ isLoading: true, error: null })

    try {
      const response = await poseGeneratorApi.createProject(data)
      set({ currentProject: response.project, isLoading: false })

      // Refresh projects list
      get().fetchProjects()

      return response.project
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to create project',
        isLoading: false,
      })
      throw error
    }
  },

  // Update project
  updateProject: async (projectId: string, data: Partial<CreateProjectFormData>) => {
    set({ isLoading: true, error: null })

    try {
      const response = await poseGeneratorApi.updateProject(projectId, data)
      set({ currentProject: response.project, isLoading: false })

      // Update in projects list
      set({
        projects: get().projects.map(p => p.id === projectId ? response.project : p),
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update project',
        isLoading: false,
      })
      throw error
    }
  },

  // Delete project
  deleteProject: async (projectId: string) => {
    set({ isLoading: true, error: null })

    try {
      await poseGeneratorApi.deleteProject(projectId)

      // Remove from projects list
      set({
        projects: get().projects.filter(p => p.id !== projectId),
        isLoading: false,
      })

      // Clear current project if it was deleted
      if (get().currentProject?.id === projectId) {
        set({ currentProject: null })
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to delete project',
        isLoading: false,
      })
      throw error
    }
  },

  // Set current project
  setCurrentProject: (project: PoseGeneratorProject | null) => {
    set({ currentProject: project })
  },

  // Set filters
  setFilters: (newFilters: Partial<ProjectFilters>) => {
    const updatedFilters = { ...get().filters, ...newFilters, page: 1 }
    set({ filters: updatedFilters })
    get().fetchProjects(updatedFilters)
  },

  // Pagination
  setPage: (page: number) => {
    const updatedFilters = { ...get().filters, page }
    set({ filters: updatedFilters })
    get().fetchProjects(updatedFilters)
  },
}))
