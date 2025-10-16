import type { WebSocketMessage } from '../types'

/**
 * WebSocket Client for Real-time Pose Generation Updates
 *
 * SECURITY NOTE: The backend uses Socket.io which requires authentication via socket.auth.token
 * This implementation needs to be migrated to use socket.io-client library instead of native WebSocket
 * to properly support authentication headers and prevent CSRF vulnerabilities.
 *
 * TODO: Install socket.io-client and update this file to use io() with auth token:
 * ```
 * import { io } from 'socket.io-client'
 * const socket = io('/pose-generator', {
 *   auth: { token: getAuthToken() }
 * })
 * ```
 */

interface WebSocketOptions {
  onOpen?: () => void
  onClose?: () => void
  onError?: (error: Event) => void
  onMessage?: (message: WebSocketMessage) => void
}

const getWebSocketUrl = (generationId: string): string => {
  const hostname = window.location.hostname
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1'

  // Use ws:// for localhost, wss:// for production
  const protocol = isLocal ? 'ws:' : 'wss:'
  const port = isLocal ? ':3001' : ''
  const host = isLocal ? hostname : window.location.host

  return `${protocol}//${host}${port}/api/apps/pose-generator/ws/${generationId}`
}

export const createWebSocketClient = (
  generationId: string,
  options: WebSocketOptions = {}
): WebSocket => {
  const url = getWebSocketUrl(generationId)
  console.log('[WebSocket] Connecting to:', url)

  const ws = new WebSocket(url)

  ws.onopen = () => {
    console.log('[WebSocket] Connected successfully')
    options.onOpen?.()
  }

  ws.onclose = () => {
    console.log('[WebSocket] Connection closed')
    options.onClose?.()
  }

  ws.onerror = (error) => {
    console.error('[WebSocket] Error:', error)
    options.onError?.(error)
  }

  ws.onmessage = (event) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)
      console.log('[WebSocket] Message:', message.type)
      options.onMessage?.(message)
    } catch (error) {
      console.error('[WebSocket] Failed to parse message:', error)
    }
  }

  return ws
}

/**
 * Helper to trigger download from URL
 */
export const triggerDownload = (url: string, filename: string) => {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Helper to download ZIP file
 */
export const downloadZip = async (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob)
  triggerDownload(url, filename)
  window.URL.revokeObjectURL(url)
}

/**
 * Format time remaining
 */
export const formatTimeRemaining = (seconds: number | undefined): string => {
  if (!seconds || seconds < 0) return 'Calculating...'

  if (seconds < 60) return `${Math.ceil(seconds)}s`

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.ceil(seconds % 60)

  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  return `${hours}h ${remainingMinutes}m`
}
