import api from '../../../lib/api'
import type {
  PoseLibraryResponse,
  PoseCategoryResponse,
  ProjectListResponse,
  ProjectResponse,
  GenerationResponse,
  GenerationStatusResponse,
  GenerationResultsResponse,
  PoseStatsResponse,
  PoseLibraryFilters,
  ProjectFilters,
  CreateProjectFormData,
  GenerateFormData,
} from '../types'

/**
 * Pose Generator API Client
 *
 * Centralized API calls for all Pose Generator features
 */
export const poseGeneratorApi = {
  // ========================================
  // Pose Library
  // ========================================

  /**
   * Get pose library with filters
   */
  getPoseLibrary: async (filters: PoseLibraryFilters = {}): Promise<PoseLibraryResponse> => {
    const params = new URLSearchParams()

    if (filters.category) params.append('category', filters.category)
    if (filters.difficulty) params.append('difficulty', filters.difficulty)
    if (filters.genderSuitability) params.append('genderSuitability', filters.genderSuitability)
    if (filters.search) params.append('search', filters.search)
    if (filters.featured !== undefined) params.append('featured', String(filters.featured))
    if (filters.page) params.append('page', String(filters.page))
    if (filters.limit) params.append('limit', String(filters.limit))

    const response = await api.get(`/api/apps/pose-generator/library?${params.toString()}`)
    return response.data
  },

  /**
   * Get single pose by ID
   */
  getPoseById: async (poseId: string) => {
    const response = await api.get(`/api/apps/pose-generator/library/${poseId}`)
    return response.data
  },

  /**
   * Get all categories
   */
  getCategories: async (): Promise<PoseCategoryResponse> => {
    const response = await api.get('/api/apps/pose-generator/categories')
    return response.data
  },

  // ========================================
  // Projects
  // ========================================

  /**
   * Get user's projects
   */
  getProjects: async (filters: ProjectFilters = {}): Promise<ProjectListResponse> => {
    const params = new URLSearchParams()

    if (filters.status) params.append('status', filters.status)
    if (filters.page) params.append('page', String(filters.page))
    if (filters.limit) params.append('limit', String(filters.limit))

    const response = await api.get(`/api/apps/pose-generator/projects?${params.toString()}`)
    return response.data
  },

  /**
   * Get project by ID
   */
  getProjectById: async (projectId: string): Promise<ProjectResponse> => {
    const response = await api.get(`/api/apps/pose-generator/projects/${projectId}`)
    return response.data
  },

  /**
   * Create new project
   */
  createProject: async (data: CreateProjectFormData): Promise<ProjectResponse> => {
    const response = await api.post('/api/apps/pose-generator/projects', data)
    return response.data
  },

  /**
   * Update project
   */
  updateProject: async (
    projectId: string,
    data: Partial<CreateProjectFormData>
  ): Promise<ProjectResponse> => {
    const response = await api.put(`/api/apps/pose-generator/projects/${projectId}`, data)
    return response.data
  },

  /**
   * Delete project
   */
  deleteProject: async (projectId: string): Promise<void> => {
    await api.delete(`/api/apps/pose-generator/projects/${projectId}`)
  },

  // ========================================
  // Generation
  // ========================================

  /**
   * Start pose generation
   */
  startGeneration: async (data: GenerateFormData): Promise<GenerationResponse> => {
    const response = await api.post('/api/apps/pose-generator/generate', data)
    return response.data
  },

  /**
   * Get generation status
   */
  getGenerationStatus: async (generationId: string): Promise<GenerationStatusResponse> => {
    const response = await api.get(`/api/apps/pose-generator/generations/${generationId}`)
    return response.data
  },

  /**
   * Get generation results
   */
  getGenerationResults: async (generationId: string): Promise<GenerationResultsResponse> => {
    const response = await api.get(`/api/apps/pose-generator/generations/${generationId}/results`)
    return response.data
  },

  // ========================================
  // Stats
  // ========================================

  /**
   * Get user statistics
   */
  getUserStats: async (): Promise<PoseStatsResponse> => {
    const response = await api.get('/api/apps/pose-generator/stats')
    return response.data
  },

  // ========================================
  // Export
  // ========================================

  /**
   * Download all exports as ZIP
   */
  downloadExportZip: async (generationId: string, formats?: string[]): Promise<Blob> => {
    const params = formats ? `?formats=${formats.join(',')}` : ''
    const response = await api.get(
      `/api/apps/pose-generator/generations/${generationId}/export-zip${params}`,
      { responseType: 'blob' }
    )
    return response.data
  },

  /**
   * Regenerate export for specific format
   */
  regenerateExport: async (poseId: string, format: string) => {
    const response = await api.post(`/api/apps/pose-generator/poses/${poseId}/regenerate-export`, {
      format,
    })
    return response.data
  },
}
