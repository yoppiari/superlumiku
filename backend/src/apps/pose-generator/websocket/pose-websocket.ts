/**
 * Pose Generator WebSocket Handler
 *
 * Phase 3: Backend API & Workers Implementation
 *
 * This module provides real-time progress updates to connected clients via WebSocket.
 * It uses Redis Pub/Sub to receive progress events from workers and broadcasts them
 * to authenticated WebSocket connections.
 *
 * Architecture:
 * - Workers publish progress to Redis channel: `pose-generation:{userId}`
 * - WebSocket server subscribes to user-specific channels
 * - When worker publishes, WebSocket forwards message to connected client
 * - JWT authentication ensures only authorized users receive updates
 *
 * Message Types:
 * - started: Generation has started processing
 * - progress: Progress update (every 5 poses)
 * - completed: Generation finished successfully
 * - failed: Generation failed with error
 *
 * Reference: docs/POSE_GENERATOR_ARCHITECTURE.md Section 3.3
 */

import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import Redis from 'ioredis'
import { verify } from 'jsonwebtoken'

// ========================================
// Types
// ========================================

interface WebSocketMessage {
  type: 'started' | 'progress' | 'completed' | 'failed'
  generationId: string
  userId: string
  timestamp: string
  [key: string]: any
}

interface SocketData {
  userId: string
  subscriber: Redis
}

// ========================================
// Redis Connection for Pub/Sub
// ========================================

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
})

redis.on('connect', () => {
  console.log('[WebSocket] Connected to Redis for pub/sub')
})

redis.on('error', (error) => {
  console.error('[WebSocket] Redis connection error:', error)
})

// ========================================
// Memory Leak Fix: Track Redis Subscribers
// ========================================

/**
 * SECURITY FIX: WeakMap to track Redis subscribers for automatic cleanup
 * WeakMap allows garbage collection when socket is disconnected
 * This prevents memory leaks from orphaned Redis connections
 */
const socketSubscribers = new WeakMap<any, Redis>()

// ========================================
// WebSocket Setup
// ========================================

/**
 * Setup pose generator WebSocket server
 *
 * @param httpServer HTTP server instance
 * @returns Socket.IO server instance
 */
export function setupPoseWebSocket(httpServer: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    },
    path: '/pose-generator-ws',
    transports: ['websocket', 'polling'],
  })

  // Create namespace for pose generator
  const poseNamespace = io.of('/pose-generator')

  console.log('[WebSocket] Pose Generator namespace created at /pose-generator')

  // ========================================
  // Connection Handler
  // ========================================

  poseNamespace.on('connection', async (socket) => {
    console.log('[WebSocket] Client attempting connection:', socket.id)

    try {
      // 1. Authenticate via JWT token
      // SECURITY FIX: Only accept token from auth header, NOT query params
      // Query params are visible in URLs and logs (CSRF vulnerability)
      const token = socket.handshake.auth.token

      if (!token) {
        console.warn('[WebSocket] Connection rejected: No token provided (must use auth.token, not query param)')
        socket.emit('error', {
          message: 'Authentication required. Please provide token via socket.auth.token'
        })
        socket.disconnect()
        return
      }

      const jwtSecret = process.env.JWT_SECRET
      if (!jwtSecret) {
        console.error(
          '[WebSocket] JWT_SECRET not configured'
        )
        socket.disconnect()
        return
      }

      let decoded: any
      try {
        decoded = verify(token, jwtSecret) as { userId: string }
      } catch (error) {
        console.warn(
          '[WebSocket] Connection rejected: Invalid token',
          error instanceof Error ? error.message : 'Unknown error'
        )
        socket.disconnect()
        return
      }

      const userId = decoded.userId || decoded.id

      if (!userId) {
        console.warn(
          '[WebSocket] Connection rejected: No userId in token'
        )
        socket.disconnect()
        return
      }

      console.log(`[WebSocket] User ${userId} authenticated successfully`)

      // 2. Join user-specific room
      socket.join(`user-${userId}`)
      console.log(`[WebSocket] User ${userId} joined room user-${userId}`)

      // 3. Create dedicated Redis subscriber for this user
      const subscriber = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      })

      // Subscribe to user's generation events
      const channel = `pose-generation:${userId}`
      await subscriber.subscribe(channel)

      console.log(
        `[WebSocket] Subscribed to Redis channel: ${channel}`
      )

      // 4. Handle messages from Redis
      subscriber.on('message', (ch, message) => {
        if (ch === channel) {
          try {
            const event: WebSocketMessage = JSON.parse(message)

            // Emit to specific user room
            socket.emit('pose-generation-update', event)

            console.log(
              `[WebSocket] Sent update to user ${userId}:`,
              event.type,
              event.generationId
            )
          } catch (error) {
            console.error('[WebSocket] Failed to parse message:', error)
          }
        }
      })

      // Store subscriber reference for cleanup using WeakMap
      const socketData: SocketData = {
        userId,
        subscriber,
      }
      socket.data = socketData

      // Track subscriber in WeakMap for automatic GC
      socketSubscribers.set(socket, subscriber)

      // 5. Send connection success message
      socket.emit('connected', {
        message: 'Connected to Pose Generator updates',
        userId,
      })

      // ========================================
      // Disconnect Handler (with Memory Leak Fix)
      // ========================================

      socket.on('disconnect', async (reason) => {
        console.log(
          `[WebSocket] User ${userId} disconnected: ${reason}`
        )

        // SECURITY FIX: Proper cleanup to prevent memory leak
        const subscriber = socketSubscribers.get(socket)
        if (subscriber) {
          try {
            await subscriber.unsubscribe(channel)
            await subscriber.quit()
            socketSubscribers.delete(socket)
            console.log(
              `[WebSocket] Cleaned up Redis subscriber for user ${userId}`
            )
          } catch (error) {
            console.error(
              `[WebSocket] Error cleaning up subscriber for user ${userId}:`,
              error
            )
            // Force disconnect on error
            subscriber.disconnect()
          }
        }
      })

      // ========================================
      // Error Handler (with Cleanup)
      // ========================================

      socket.on('error', (error) => {
        console.error(
          `[WebSocket] Socket error for user ${userId}:`,
          error
        )

        // Clean up subscriber on error to prevent leak
        const subscriber = socketSubscribers.get(socket)
        if (subscriber) {
          subscriber.unsubscribe(channel).catch(() => {})
          subscriber.quit().catch(() => {})
          socketSubscribers.delete(socket)
        }
      })

      // ========================================
      // Ping-Pong for Connection Health
      // ========================================

      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date().toISOString() })
      })
    } catch (error) {
      console.error('[WebSocket] Connection setup error:', error)
      socket.disconnect()
    }
  })

  return io
}

/**
 * Publish progress update to Redis (called by workers)
 *
 * This is exported for use in worker files. Workers call this function
 * to publish progress updates that WebSocket clients will receive.
 *
 * @param userId User ID
 * @param message Progress message
 */
export async function publishPoseProgress(
  userId: string,
  message: Omit<WebSocketMessage, 'userId' | 'timestamp'>
): Promise<void> {
  const fullMessage: WebSocketMessage = {
    type: message.type,
    generationId: message.generationId,
    ...message,
    userId,
    timestamp: new Date().toISOString(),
  }

  const channel = `pose-generation:${userId}`

  try {
    await redis.publish(channel, JSON.stringify(fullMessage))

    console.log(
      `[WebSocket] Published to ${channel}:`,
      message.type,
      message.generationId
    )
  } catch (error) {
    console.error('[WebSocket] Failed to publish message:', error)
  }
}

/**
 * Graceful shutdown
 */
export async function shutdownWebSocket(): Promise<void> {
  console.log('[WebSocket] Shutting down...')
  await redis.quit()
  console.log('[WebSocket] Shutdown complete')
}
