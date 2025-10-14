/**
 * Frontend Error Logger
 *
 * Provides centralized error logging for the frontend with support for:
 * - Console logging with appropriate levels
 * - Sending errors to backend
 * - Integration with monitoring services (Sentry, LogRocket, etc.)
 * - Environment-specific behavior
 */

import { AppError } from './AppError'
import { ErrorSeverity, ErrorLogEntry } from './types'

/**
 * Error logger configuration
 */
interface ErrorLoggerConfig {
  logToConsole: boolean
  logToBackend: boolean
  backendEndpoint: string
  includeStackTrace: boolean
  batchErrors: boolean
  batchSize: number
  batchInterval: number
}

/**
 * Frontend error logger
 */
export class ErrorLogger {
  private config: ErrorLoggerConfig
  private errorQueue: ErrorLogEntry[] = []
  private batchTimer?: number
  private static instance: ErrorLogger

  private constructor(config: Partial<ErrorLoggerConfig> = {}) {
    this.config = {
      logToConsole: true,
      logToBackend: import.meta.env.PROD,
      backendEndpoint: '/api/logs/frontend-error',
      includeStackTrace: import.meta.env.DEV,
      batchErrors: import.meta.env.PROD,
      batchSize: 10,
      batchInterval: 5000, // 5 seconds
      ...config,
    }

    // Start batch timer if batching is enabled
    if (this.config.batchErrors) {
      this.startBatchTimer()
    }

    // Send any remaining errors before page unload
    window.addEventListener('beforeunload', () => {
      this.flush()
    })
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<ErrorLoggerConfig>): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger(config)
    }
    return ErrorLogger.instance
  }

  /**
   * Log error
   */
  async logError(error: Error | AppError, context?: Record<string, any>): Promise<void> {
    // Convert to AppError if needed
    const appError = error instanceof AppError ? error : AppError.fromUnknownError(error)

    // Add context to metadata
    if (context) {
      Object.assign(appError.metadata, context)
    }

    // Log to console
    if (this.config.logToConsole) {
      this.logToConsole(appError)
    }

    // Log to backend
    if (this.config.logToBackend) {
      const logEntry = this.createLogEntry(appError)

      if (this.config.batchErrors) {
        this.addToQueue(logEntry)
      } else {
        await this.sendToBackend([logEntry])
      }
    }
  }

  /**
   * Log message with severity
   */
  logMessage(message: string, severity: ErrorSeverity = ErrorSeverity.MEDIUM): void {
    if (this.config.logToConsole) {
      this.logMessageToConsole(message, severity)
    }
  }

  /**
   * Flush error queue immediately
   */
  flush(): void {
    if (this.errorQueue.length > 0) {
      this.sendToBackend([...this.errorQueue])
      this.errorQueue = []
    }
  }

  /**
   * Log to console with appropriate level
   */
  private logToConsole(error: AppError): void {
    const severityEmoji = {
      [ErrorSeverity.LOW]: '📘',
      [ErrorSeverity.MEDIUM]: '⚠️',
      [ErrorSeverity.HIGH]: '🔴',
      [ErrorSeverity.CRITICAL]: '🚨',
    }

    const prefix = `${severityEmoji[error.severity]} [${error.category}] [${error.code}]`
    const message = `${prefix} ${error.message}`

    // Log based on severity
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        console.error(message, error)
        if (this.config.includeStackTrace && error.stack) {
          console.error('Stack:', error.stack)
        }
        break

      case ErrorSeverity.MEDIUM:
        console.warn(message, error)
        break

      case ErrorSeverity.LOW:
        console.log(message, error)
        break
    }

    // Log metadata if present
    if (Object.keys(error.metadata).length > 0) {
      console.log('Metadata:', error.metadata)
    }
  }

  /**
   * Log message to console
   */
  private logMessageToConsole(message: string, severity: ErrorSeverity): void {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        console.error(message)
        break
      case ErrorSeverity.MEDIUM:
        console.warn(message)
        break
      case ErrorSeverity.LOW:
        console.log(message)
        break
    }
  }

  /**
   * Create log entry from error
   */
  private createLogEntry(error: AppError): ErrorLogEntry {
    const entry = error.toLogEntry()

    // Remove stack trace in production if configured
    if (!this.config.includeStackTrace) {
      delete entry.error.stack
    }

    return entry
  }

  /**
   * Add error to batch queue
   */
  private addToQueue(entry: ErrorLogEntry): void {
    this.errorQueue.push(entry)

    // Send immediately if batch size reached
    if (this.errorQueue.length >= this.config.batchSize) {
      this.flush()
    }
  }

  /**
   * Start batch timer
   */
  private startBatchTimer(): void {
    this.batchTimer = window.setInterval(() => {
      this.flush()
    }, this.config.batchInterval)
  }

  /**
   * Send errors to backend
   */
  private async sendToBackend(entries: ErrorLogEntry[]): Promise<void> {
    if (entries.length === 0) return

    try {
      const response = await fetch(this.config.backendEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          errors: entries,
          batch: entries.length > 1,
        }),
      })

      if (!response.ok) {
        console.warn('Failed to send errors to backend:', response.statusText)
      }
    } catch (error) {
      // Don't log to backend to avoid infinite loop
      console.error('Failed to send errors to backend:', error)
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.batchTimer !== undefined) {
      window.clearInterval(this.batchTimer)
    }
    this.flush()
  }
}

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance()

/**
 * Initialize error logger with custom config
 */
export function initializeErrorLogger(config?: Partial<ErrorLoggerConfig>): void {
  ErrorLogger.getInstance(config)
}
