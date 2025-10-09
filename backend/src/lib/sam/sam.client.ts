/**
 * SAM Service HTTP Client
 * Provides interface to communicate with SAM Python service
 */

import type {
  SAMSegmentPointRequest,
  SAMSegmentPointsRequest,
  SAMSegmentBoxRequest,
  SAMSegmentResponse,
  SAMHealthResponse,
  SAMError,
} from './sam.types'
import { SAM_CONFIG } from './sam.config'

export class SAMClient {
  private baseUrl: string
  private timeout: number
  private retryAttempts: number
  private retryDelay: number

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || SAM_CONFIG.baseUrl
    this.timeout = SAM_CONFIG.timeout
    this.retryAttempts = SAM_CONFIG.retryAttempts
    this.retryDelay = SAM_CONFIG.retryDelay
  }

  /**
   * Check if SAM service is healthy
   */
  async healthCheck(): Promise<SAMHealthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout for health check
      })

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('[SAM] Health check failed:', error)
      throw new Error('SAM service unavailable')
    }
  }

  /**
   * Segment object by single point click
   */
  async segmentByPoint(
    imageBase64: string,
    point: [number, number],
    objectPrompt?: string
  ): Promise<SAMSegmentResponse> {
    const request: SAMSegmentPointRequest = {
      image: imageBase64,
      point,
      objectPrompt,
    }

    return this._makeRequest('/segment/point', request)
  }

  /**
   * Segment object by multiple points
   */
  async segmentByPoints(
    imageBase64: string,
    points: number[][],
    objectPrompt?: string
  ): Promise<SAMSegmentResponse> {
    const request: SAMSegmentPointsRequest = {
      image: imageBase64,
      points,
      objectPrompt,
    }

    return this._makeRequest('/segment/points', request)
  }

  /**
   * Segment object by bounding box
   */
  async segmentByBox(
    imageBase64: string,
    box: [number, number, number, number]
  ): Promise<SAMSegmentResponse> {
    const request: SAMSegmentBoxRequest = {
      image: imageBase64,
      box,
    }

    return this._makeRequest('/segment/box', request)
  }

  /**
   * Make HTTP request to SAM service with retry logic
   */
  private async _makeRequest(
    endpoint: string,
    payload: any,
    attempt: number = 1
  ): Promise<SAMSegmentResponse> {
    try {
      console.log(`[SAM] Request to ${endpoint} (attempt ${attempt}/${this.retryAttempts})`)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error: SAMError = await response.json().catch(() => ({
          detail: response.statusText,
        }))
        const errorMsg = typeof error.detail === 'object' ? JSON.stringify(error.detail) : error.detail
        throw new Error(`SAM request failed: ${errorMsg}`)
      }

      const result: SAMSegmentResponse = await response.json()
      console.log(`[SAM] Success: confidence=${result.confidence}`)

      return result

    } catch (error) {
      console.error(`[SAM] Request failed (attempt ${attempt}):`, error)

      // Retry if attempts remaining
      if (attempt < this.retryAttempts) {
        console.log(`[SAM] Retrying in ${this.retryDelay}ms...`)
        await this._sleep(this.retryDelay)
        return this._makeRequest(endpoint, payload, attempt + 1)
      }

      // Max retries exceeded
      throw new Error(
        `SAM request failed after ${this.retryAttempts} attempts: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  /**
   * Sleep utility for retry delay
   */
  private _sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Check if SAM service is enabled
   */
  isEnabled(): boolean {
    return SAM_CONFIG.enabled
  }
}

// Singleton instance
let samClientInstance: SAMClient | null = null

/**
 * Get global SAM client instance
 */
export function getSAMClient(): SAMClient {
  if (!samClientInstance) {
    samClientInstance = new SAMClient()
  }
  return samClientInstance
}
