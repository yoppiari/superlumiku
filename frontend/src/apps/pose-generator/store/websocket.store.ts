import { create } from 'zustand'
import type { WebSocketMessage, ProgressUpdate, PoseCompletedUpdate } from '../types'
import { createWebSocketClient } from '../utils/websocket'
import { useGenerationStore } from './generation.store'

interface WebSocketState {
  // Connection state
  isConnected: boolean
  error: string | null

  // WebSocket client
  ws: WebSocket | null

  // Actions
  connect: (generationId: string) => void
  disconnect: () => void
  handleMessage: (message: WebSocketMessage) => void
}

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  // Initial state
  isConnected: false,
  error: null,
  ws: null,

  // Connect to WebSocket
  connect: (generationId: string) => {
    const { ws } = get()

    // Close existing connection
    if (ws) {
      ws.close()
    }

    try {
      const wsClient = createWebSocketClient(generationId, {
        onOpen: () => {
          console.log('[WebSocket] Connected for generation:', generationId)
          set({ isConnected: true, error: null })
        },
        onClose: () => {
          console.log('[WebSocket] Disconnected')
          set({ isConnected: false, ws: null })
        },
        onError: (error) => {
          console.error('[WebSocket] Error:', error)
          set({ error: 'WebSocket connection error', isConnected: false })
        },
        onMessage: (message) => {
          get().handleMessage(message)
        },
      })

      set({ ws: wsClient })
    } catch (error: any) {
      console.error('[WebSocket] Failed to connect:', error)
      set({ error: error.message, isConnected: false })
    }
  },

  // Disconnect from WebSocket
  disconnect: () => {
    const { ws } = get()
    if (ws) {
      ws.close()
      set({ ws: null, isConnected: false })
    }
  },

  // Handle incoming WebSocket messages
  handleMessage: (message: WebSocketMessage) => {
    console.log('[WebSocket] Message received:', message.type)

    const generationStore = useGenerationStore.getState()

    switch (message.type) {
      case 'progress':
        const progressData: ProgressUpdate = message.data
        generationStore.updateProgress(progressData)
        break

      case 'pose_completed':
        const poseData: PoseCompletedUpdate = message.data
        if (poseData.status === 'completed') {
          generationStore.addCompletedPose({
            id: poseData.poseId,
            generationId: poseData.generationId,
            poseLibraryId: poseData.poseLibraryId || null,
            outputImageUrl: poseData.outputImageUrl,
            thumbnailUrl: poseData.thumbnailUrl,
            status: 'completed',
          } as any)
        }
        break

      case 'generation_completed':
        console.log('[WebSocket] Generation completed')
        generationStore.fetchGenerationResults(message.generationId)
        get().disconnect()
        break

      case 'error':
        console.error('[WebSocket] Generation error:', message.data)
        generationStore.fetchGenerationStatus(message.generationId)
        break

      default:
        console.warn('[WebSocket] Unknown message type:', message.type)
    }
  },
}))
