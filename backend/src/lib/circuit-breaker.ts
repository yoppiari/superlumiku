/**
 * P2 PERFORMANCE: Circuit Breaker Pattern
 *
 * Implements the Circuit Breaker pattern to prevent cascade failures
 * when external services are down or slow.
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Service is failing, requests fail fast without trying
 * - HALF_OPEN: Testing if service has recovered
 *
 * Benefits:
 * - Prevents cascade failures to dependent services
 * - Fails fast when service is down (no hanging requests)
 * - Automatic recovery detection
 * - Resource protection (don't waste time on failing services)
 *
 * Usage:
 * ```typescript
 * const breaker = new CircuitBreaker('openai-api', {
 *   failureThreshold: 5,
 *   resetTimeout: 60000,
 *   timeout: 30000
 * })
 *
 * const result = await breaker.execute(async () => {
 *   return await openaiClient.generate(...)
 * })
 * ```
 */

export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  failureThreshold?: number // Number of failures before opening circuit (default: 5)
  successThreshold?: number // Number of successes in HALF_OPEN to close circuit (default: 2)
  resetTimeout?: number // Time in ms before trying again (default: 60000ms = 1 minute)
  timeout?: number // Request timeout in ms (default: 30000ms = 30 seconds)
  name?: string // Circuit breaker name for logging
}

export interface CircuitBreakerStats {
  state: CircuitBreakerState
  failureCount: number
  successCount: number
  lastFailureTime: number | null
  totalRequests: number
  totalFailures: number
  totalSuccesses: number
  totalTimeouts: number
  nextAttemptTime: number | null
}

export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public readonly state: CircuitBreakerState
  ) {
    super(message)
    this.name = 'CircuitBreakerError'
  }
}

export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED
  private failureCount: number = 0
  private successCount: number = 0
  private lastFailureTime: number | null = null
  private nextAttemptTime: number | null = null

  // Stats
  private totalRequests: number = 0
  private totalFailures: number = 0
  private totalSuccesses: number = 0
  private totalTimeouts: number = 0

  private readonly failureThreshold: number
  private readonly successThreshold: number
  private readonly resetTimeout: number
  private readonly timeout: number
  private readonly name: string

  constructor(name: string, options: CircuitBreakerOptions = {}) {
    this.name = name
    this.failureThreshold = options.failureThreshold ?? 5
    this.successThreshold = options.successThreshold ?? 2
    this.resetTimeout = options.resetTimeout ?? 60000 // 1 minute
    this.timeout = options.timeout ?? 30000 // 30 seconds

    console.log(`[CircuitBreaker:${this.name}] Initialized`, {
      failureThreshold: this.failureThreshold,
      successThreshold: this.successThreshold,
      resetTimeout: this.resetTimeout,
      timeout: this.timeout,
    })
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalRequests++

    // Check if circuit is OPEN and if it's time to try again
    if (this.state === CircuitBreakerState.OPEN) {
      if (this.nextAttemptTime && Date.now() < this.nextAttemptTime) {
        throw new CircuitBreakerError(
          `[CircuitBreaker:${this.name}] Circuit is OPEN. Service is unavailable. Retry after ${new Date(this.nextAttemptTime).toISOString()}`,
          CircuitBreakerState.OPEN
        )
      }

      // Time to try again - move to HALF_OPEN
      this.transitionToHalfOpen()
    }

    try {
      // Execute with timeout
      const result = await this.executeWithTimeout(fn)

      // Success - handle based on state
      this.onSuccess()

      return result
    } catch (error) {
      // Failure - handle based on state
      this.onFailure(error)

      throw error
    }
  }

  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => {
          this.totalTimeouts++
          reject(new Error(`[CircuitBreaker:${this.name}] Request timeout after ${this.timeout}ms`))
        }, this.timeout)
      ),
    ])
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.totalSuccesses++
    this.failureCount = 0

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++

      if (this.successCount >= this.successThreshold) {
        this.transitionToClosed()
      }
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(error: unknown): void {
    this.totalFailures++
    this.failureCount++
    this.lastFailureTime = Date.now()

    console.error(`[CircuitBreaker:${this.name}] Request failed:`, error)

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      // Failure in HALF_OPEN - immediately go back to OPEN
      this.transitionToOpen()
    } else if (this.state === CircuitBreakerState.CLOSED) {
      // Check if we've hit failure threshold
      if (this.failureCount >= this.failureThreshold) {
        this.transitionToOpen()
      }
    }
  }

  /**
   * Transition to CLOSED state (normal operation)
   */
  private transitionToClosed(): void {
    console.log(`[CircuitBreaker:${this.name}] Transitioning to CLOSED (service recovered)`)
    this.state = CircuitBreakerState.CLOSED
    this.failureCount = 0
    this.successCount = 0
    this.nextAttemptTime = null
  }

  /**
   * Transition to OPEN state (service failing)
   */
  private transitionToOpen(): void {
    console.warn(`[CircuitBreaker:${this.name}] Transitioning to OPEN (service failing)`)
    this.state = CircuitBreakerState.OPEN
    this.successCount = 0
    this.nextAttemptTime = Date.now() + this.resetTimeout

    console.warn(`[CircuitBreaker:${this.name}] Will retry at ${new Date(this.nextAttemptTime).toISOString()}`)
  }

  /**
   * Transition to HALF_OPEN state (testing recovery)
   */
  private transitionToHalfOpen(): void {
    console.log(`[CircuitBreaker:${this.name}] Transitioning to HALF_OPEN (testing recovery)`)
    this.state = CircuitBreakerState.HALF_OPEN
    this.successCount = 0
    this.nextAttemptTime = null
  }

  /**
   * Get current circuit breaker stats
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
      totalTimeouts: this.totalTimeouts,
      nextAttemptTime: this.nextAttemptTime,
    }
  }

  /**
   * Manually reset circuit breaker to CLOSED state
   * (useful for admin operations or testing)
   */
  reset(): void {
    console.log(`[CircuitBreaker:${this.name}] Manual reset to CLOSED`)
    this.transitionToClosed()
  }

  /**
   * Check if circuit breaker is available
   */
  isAvailable(): boolean {
    if (this.state === CircuitBreakerState.CLOSED) {
      return true
    }

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      return true
    }

    // OPEN - check if it's time to try again
    if (this.nextAttemptTime && Date.now() >= this.nextAttemptTime) {
      return true
    }

    return false
  }
}

/**
 * Circuit Breaker Manager
 *
 * Manages multiple circuit breakers for different services.
 * Provides centralized access and stats.
 */
export class CircuitBreakerManager {
  private breakers: Map<string, CircuitBreaker> = new Map()

  /**
   * Get or create circuit breaker for service
   */
  getBreaker(name: string, options?: CircuitBreakerOptions): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, options))
    }
    return this.breakers.get(name)!
  }

  /**
   * Get all circuit breaker stats
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {}
    this.breakers.forEach((breaker, name) => {
      stats[name] = breaker.getStats()
    })
    return stats
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.breakers.forEach((breaker) => breaker.reset())
  }

  /**
   * Get circuit breaker by name
   */
  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name)
  }
}

// Singleton instance
export const circuitBreakerManager = new CircuitBreakerManager()

// Pre-configured circuit breakers for common services
export const circuitBreakers = {
  openai: circuitBreakerManager.getBreaker('openai-api', {
    failureThreshold: 5,
    resetTimeout: 60000,
    timeout: 30000,
  }),
  comfyui: circuitBreakerManager.getBreaker('comfyui-api', {
    failureThreshold: 3,
    resetTimeout: 30000,
    timeout: 60000, // ComfyUI can be slow
  }),
  fal: circuitBreakerManager.getBreaker('fal-api', {
    failureThreshold: 5,
    resetTimeout: 60000,
    timeout: 120000, // FAL can be very slow for image generation
  }),
  duitku: circuitBreakerManager.getBreaker('duitku-api', {
    failureThreshold: 3,
    resetTimeout: 120000, // 2 minutes for payment service
    timeout: 15000,
  }),
  huggingface: circuitBreakerManager.getBreaker('huggingface-api', {
    failureThreshold: 5,
    resetTimeout: 60000,
    timeout: 60000,
  }),
}
