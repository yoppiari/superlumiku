import { api } from '../lib/api'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData extends LoginCredentials {
  name: string
}

export interface AuthResponse {
  user: {
    id: string
    name: string
    email: string
    creditBalance: number
  }
  token: string
}

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */
export const authService = {
  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<{ success: boolean; data: AuthResponse }>('/api/auth/login', credentials)
    // Backend returns { success: true, data: { user, token } }
    // Extract the nested data object
    return response.data.data
  },

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<{ success: boolean; data: AuthResponse }>('/api/auth/register', data)
    // Backend returns { success: true, data: { user, token } }
    // Extract the nested data object
    return response.data.data
  },

  /**
   * Logout user (client-side cleanup)
   */
  logout(): void {
    localStorage.removeItem('token')
  },
}
