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
    const response = await api.post<AuthResponse>('/api/auth/login', credentials)
    return response.data
  },

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/register', data)
    return response.data
  },

  /**
   * Logout user (client-side cleanup)
   */
  logout(): void {
    localStorage.removeItem('token')
  },
}
