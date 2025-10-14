import { api } from '../lib/api'
import type { GenerationItem } from '../types/generation'

export interface GenerationsQueryParams {
  app?: string
  sort?: 'latest' | 'oldest' | 'name'
  limit?: number
}

export interface GenerationsResponse {
  generations: GenerationItem[]
}

export interface RecentGenerationsResponse {
  generations: GenerationItem[]
}

/**
 * Generation Service
 * Handles all generation-related API calls
 */
export const generationService = {
  /**
   * Get all generations with optional filters
   */
  async getGenerations(params?: GenerationsQueryParams): Promise<GenerationsResponse> {
    const queryParams = new URLSearchParams()

    if (params?.app) queryParams.append('app', params.app)
    if (params?.sort) queryParams.append('sort', params.sort)
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const url = queryParams.toString()
      ? `/api/generations?${queryParams.toString()}`
      : '/api/generations'

    const response = await api.get<GenerationsResponse>(url)
    return response.data
  },

  /**
   * Get recent generations
   */
  async getRecentGenerations(limit: number = 5): Promise<RecentGenerationsResponse> {
    const response = await api.get<RecentGenerationsResponse>(
      `/api/generations/recent?limit=${limit}`
    )
    return response.data
  },

  /**
   * Delete a generation
   */
  async deleteGeneration(id: string, appId: string): Promise<void> {
    await api.delete(`/api/generations/${id}?appId=${appId}`)
  },
}
