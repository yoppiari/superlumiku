import axios from 'axios'

// Use root path in production (Nginx will proxy /api/...), localhost in development
// Function to get API base URL
const getApiBaseUrl = () => {
  if (import.meta.env['VITE_API_URL']) {
    return import.meta.env['VITE_API_URL']
  }

  // Server-side rendering check
  if (typeof window === 'undefined') {
    return ''
  }

  // Check if running on localhost
  const hostname = window.location.hostname
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001'
  }

  // Production: use empty string for relative URLs
  return ''
}

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Helper function to convert relative image URLs to absolute
export const getAbsoluteImageUrl = (relativePath: string | null | undefined): string | null => {
  if (!relativePath) return null
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath // Already absolute
  }
  const baseURL = getApiBaseUrl()
  return `${baseURL}${relativePath}`
}

export default api