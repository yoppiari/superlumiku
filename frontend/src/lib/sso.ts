/**
 * SSO Utility for Cross-App Authentication
 *
 * This module provides utilities for sharing authentication state
 * between Lumiku Dashboard and other tools (e.g., VideoMix Pro)
 */

export interface SSOToken {
  token: string
  user: {
    id: string
    email: string
    name?: string
    creditBalance: number
  }
  expiresAt: number
}

/**
 * Get current auth token from localStorage
 */
export const getSSOToken = (): SSOToken | null => {
  try {
    const token = localStorage.getItem('token')
    const authStorage = localStorage.getItem('auth-storage')

    if (!token || !authStorage) {
      return null
    }

    const authData = JSON.parse(authStorage)

    return {
      token,
      user: authData.state?.user || null,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
    }
  } catch (error) {
    console.error('Error getting SSO token:', error)
    return null
  }
}

/**
 * Set SSO token (used when logging in)
 */
export const setSSOToken = (token: string, user: any): void => {
  try {
    localStorage.setItem('token', token)

    // Update auth-storage for Zustand persist
    const authStorage = {
      state: {
        user,
        token,
        isAuthenticated: true,
      },
      version: 0,
    }

    localStorage.setItem('auth-storage', JSON.stringify(authStorage))
  } catch (error) {
    console.error('Error setting SSO token:', error)
  }
}

/**
 * Clear SSO token (logout)
 */
export const clearSSOToken = (): void => {
  try {
    localStorage.removeItem('token')
    localStorage.removeItem('auth-storage')

    // Broadcast logout event to other tabs/apps
    window.dispatchEvent(new CustomEvent('sso-logout'))
  } catch (error) {
    console.error('Error clearing SSO token:', error)
  }
}

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const ssoToken = getSSOToken()

  if (!ssoToken) {
    return false
  }

  // Check if token is expired
  if (ssoToken.expiresAt < Date.now()) {
    clearSSOToken()
    return false
  }

  return true
}

/**
 * Get auth headers for API requests
 */
export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token')

  if (!token) {
    return {}
  }

  return {
    'Authorization': `Bearer ${token}`,
  }
}

/**
 * Navigate to another app with SSO token
 *
 * @param appUrl - URL of the target app (e.g., http://localhost:8001)
 * @param path - Path within the app (e.g., /projects)
 */
export const navigateWithSSO = (appUrl: string, path: string = '/'): void => {
  const ssoToken = getSSOToken()

  if (!ssoToken) {
    console.warn('No SSO token available for navigation')
    return
  }

  // Encode SSO data as URL parameter
  const ssoData = btoa(JSON.stringify({
    token: ssoToken.token,
    user: ssoToken.user,
  }))

  // Navigate with SSO data
  const targetUrl = `${appUrl}${path}?sso=${ssoData}`
  window.location.href = targetUrl
}

/**
 * Extract SSO data from URL (for receiving apps)
 */
export const extractSSOFromURL = (): SSOToken | null => {
  try {
    const params = new URLSearchParams(window.location.search)
    const ssoData = params.get('sso')

    if (!ssoData) {
      return null
    }

    const decoded = JSON.parse(atob(ssoData))

    // Set token in localStorage
    setSSOToken(decoded.token, decoded.user)

    // Remove SSO parameter from URL
    params.delete('sso')
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`
    window.history.replaceState({}, '', newUrl)

    return {
      token: decoded.token,
      user: decoded.user,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000),
    }
  } catch (error) {
    console.error('Error extracting SSO from URL:', error)
    return null
  }
}

/**
 * Setup SSO event listeners (call this in App.tsx)
 */
export const setupSSOListeners = (onLogout?: () => void): void => {
  // Listen for logout events from other tabs
  window.addEventListener('storage', (event) => {
    if (event.key === 'token' && event.newValue === null) {
      onLogout?.()
    }
  })

  // Listen for custom logout events
  window.addEventListener('sso-logout', () => {
    onLogout?.()
  })
}
