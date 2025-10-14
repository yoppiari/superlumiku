import { api } from '../lib/api'

export interface AppData {
  appId: string
  name: string
  description: string
  icon: string
  color: string
  order: number
  beta: boolean
  comingSoon: boolean
}

export interface AppsResponse {
  apps: AppData[]
}

export interface DashboardStats {
  totalSpending: number
  totalWorks: number
  totalProjects: number
  lastLogin: string
}

/**
 * Dashboard Service
 * Handles dashboard-related API calls
 */
export const dashboardService = {
  /**
   * Get all available apps
   */
  async getApps(): Promise<AppsResponse> {
    const response = await api.get<AppsResponse>('/api/apps')
    return response.data
  },

  /**
   * Get dashboard statistics
   */
  async getStats(): Promise<DashboardStats> {
    const response = await api.get<DashboardStats>('/api/stats/dashboard')
    return response.data
  },
}
