import { api } from '../lib/api'

export interface VideoProject {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  generations: VideoGeneration[]
}

export interface VideoGeneration {
  id: string
  projectId: string
  provider: string
  modelId: string
  modelName: string
  prompt: string
  negativePrompt?: string
  resolution: string
  duration: number
  aspectRatio: string
  creditUsed: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  outputPath?: string
  thumbnailPath?: string
  errorMessage?: string
  createdAt: string
  completedAt?: string
}

export interface VideoModel {
  id: string
  name: string
  provider: string
  maxDuration: number
  defaultDuration: number
  resolutions: string[]
  aspectRatios: string[]
  supportsImageToVideo: boolean
  supportsNegativePrompt: boolean
  description?: string
}

export interface CreateProjectRequest {
  name: string
  description?: string
}

export interface GenerateVideoRequest {
  projectId: string
  modelId: string
  prompt: string
  resolution: string
  duration: number
  aspectRatio: string
}

/**
 * Video Generator Service
 * Handles all video generation-related API calls
 */
export const videoGeneratorService = {
  /**
   * Get all video projects
   */
  async getProjects(): Promise<{ projects: VideoProject[] }> {
    const response = await api.get<{ projects: VideoProject[] }>('/api/apps/video-generator/projects')
    return response.data
  },

  /**
   * Get a specific video project
   */
  async getProject(projectId: string): Promise<{ project: VideoProject }> {
    const response = await api.get<{ project: VideoProject }>(
      `/api/apps/video-generator/projects/${projectId}`
    )
    return response.data
  },

  /**
   * Create a new video project
   */
  async createProject(data: CreateProjectRequest): Promise<{ project: VideoProject }> {
    const response = await api.post<{ project: VideoProject }>(
      '/api/apps/video-generator/projects',
      data
    )
    return response.data
  },

  /**
   * Delete a video project
   */
  async deleteProject(projectId: string): Promise<void> {
    await api.delete(`/api/apps/video-generator/projects/${projectId}`)
  },

  /**
   * Get available video models
   */
  async getModels(): Promise<{ models: VideoModel[] }> {
    const response = await api.get<{ models: VideoModel[] }>('/api/apps/video-generator/models')
    return response.data
  },

  /**
   * Generate a new video
   */
  async generateVideo(data: GenerateVideoRequest): Promise<void> {
    await api.post('/api/apps/video-generator/generate', data)
  },
}
