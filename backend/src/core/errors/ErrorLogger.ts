/**
 * Centralized Error Logger
 *
 * Provides structured logging for all errors with support for:
 * - Multiple log levels and formats
 * - Context enrichment
 * - External monitoring integration (Sentry, DataDog, LogRocket, etc.)
 * - Environment-specific behavior
 * - Performance monitoring
 */

import { BaseAppError } from './BaseAppError'
import { ErrorSeverity, ErrorCategory, ErrorLogEntry, ErrorMetadata } from './types'

/**
 * External monitoring service interface
 */
export interface IMonitoringService {
  captureError(error: Error | BaseAppError, context?: ErrorMetadata): void
  captureMessage(message: string, level: string, context?: ErrorMetadata): void
  setUser(userId: string, email?: string, username?: string): void
  addBreadcrumb(message: string, category: string, data?: any): void
}

/**
 * Error logger configuration
 */
interface ErrorLoggerConfig {
  logLevel: ErrorSeverity
  logFormat: 'json' | 'console'
  includeStackTrace: boolean
  redactSensitiveData: boolean
  monitoringServices: IMonitoringService[]
}

/**
 * Centralized Error Logger
 */
export class ErrorLogger {
  private config: ErrorLoggerConfig
  private static instance: ErrorLogger

  private constructor(config: Partial<ErrorLoggerConfig> = {}) {
    this.config = {
      logLevel: this.getLogLevelFromEnv(),
      logFormat: (process.env.LOG_FORMAT as 'json' | 'console') || 'console',
      includeStackTrace: process.env.NODE_ENV !== 'production',
      redactSensitiveData: process.env.NODE_ENV === 'production',
      monitoringServices: [],
      ...config,
    }
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
   * Add monitoring service (Sentry, DataDog, etc.)
   */
  addMonitoringService(service: IMonitoringService): void {
    this.config.monitoringServices.push(service)
  }

  /**
   * Log error with full context
   */
  logError(error: Error | BaseAppError, additionalContext?: ErrorMetadata): void {
    const logEntry = this.createLogEntry(error, additionalContext)

    // Only log if severity meets threshold
    if (!this.shouldLog(logEntry.severity)) {
      return
    }

    // Console logging
    this.logToConsole(logEntry)

    // Send to monitoring services
    this.sendToMonitoring(error, logEntry)
  }

  /**
   * Log error with custom message
   */
  logMessage(
    message: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    category: ErrorCategory = ErrorCategory.INTERNAL,
    metadata: ErrorMetadata = {}
  ): void {
    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      severity,
      category,
      code: metadata.code as any,
      message,
      httpStatus: 500,
      metadata,
      environment: process.env.NODE_ENV || 'development',
    }

    if (this.shouldLog(severity)) {
      this.logToConsole(logEntry)
    }
  }

  /**
   * Log security event (always logged, regardless of level)
   */
  logSecurityEvent(
    message: string,
    severity: ErrorSeverity,
    metadata: ErrorMetadata
  ): void {
    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      severity,
      category: ErrorCategory.AUTHENTICATION,
      code: metadata.code as any,
      message: `[SECURITY] ${message}`,
      httpStatus: 403,
      metadata: {
        ...metadata,
        security: true,
      },
      environment: process.env.NODE_ENV || 'development',
    }

    // Always log security events
    this.logToConsole(logEntry)

    // Always send security events to monitoring
    this.config.monitoringServices.forEach((service) => {
      service.captureMessage(message, 'error', logEntry.metadata)
    })
  }

  /**
   * Log performance issue
   */
  logPerformance(
    operation: string,
    duration: number,
    threshold: number,
    metadata: ErrorMetadata = {}
  ): void {
    if (duration > threshold) {
      this.logMessage(
        `Performance warning: ${operation} took ${duration}ms (threshold: ${threshold}ms)`,
        ErrorSeverity.LOW,
        ErrorCategory.INTERNAL,
        { ...metadata, operation, duration, threshold }
      )
    }
  }

  /**
   * Create structured log entry from error
   */
  private createLogEntry(
    error: Error | BaseAppError,
    additionalContext?: ErrorMetadata
  ): ErrorLogEntry {
    if (error instanceof BaseAppError) {
      const entry = error.toLogEntry()
      if (additionalContext) {
        entry.metadata = { ...entry.metadata, ...additionalContext }
      }
      return entry
    }

    // Handle standard Error
    return {
      timestamp: new Date().toISOString(),
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.UNKNOWN,
      code: 'UNHANDLED_ERROR' as any,
      message: error.message || 'Unknown error',
      httpStatus: 500,
      metadata: {
        ...(additionalContext || {}),
        stackTrace: error.stack,
      },
      environment: process.env.NODE_ENV || 'development',
      stackTrace: error.stack,
    }
  }

  /**
   * Log to console with appropriate formatting
   */
  private logToConsole(entry: ErrorLogEntry): void {
    const formattedLog =
      this.config.logFormat === 'json'
        ? this.formatAsJSON(entry)
        : this.formatForConsole(entry)

    // Use appropriate console method based on severity
    switch (entry.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        console.error(formattedLog)
        break
      case ErrorSeverity.MEDIUM:
        console.warn(formattedLog)
        break
      case ErrorSeverity.LOW:
        console.log(formattedLog)
        break
    }
  }

  /**
   * Format log entry as JSON (for production)
   */
  private formatAsJSON(entry: ErrorLogEntry): string {
    const redacted = this.config.redactSensitiveData
      ? this.redactSensitiveData(entry)
      : entry

    if (!this.config.includeStackTrace) {
      delete redacted.stackTrace
      delete redacted.metadata.stackTrace
    }

    return JSON.stringify(redacted)
  }

  /**
   * Format log entry for console (for development)
   */
  private formatForConsole(entry: ErrorLogEntry): string {
    const severityEmoji = {
      [ErrorSeverity.LOW]: '📘',
      [ErrorSeverity.MEDIUM]: '⚠️',
      [ErrorSeverity.HIGH]: '🔴',
      [ErrorSeverity.CRITICAL]: '🚨',
    }

    let log = `${severityEmoji[entry.severity]} [${entry.timestamp}] [${entry.severity}] [${entry.category}] ${entry.message}`

    // Add metadata
    const relevantMetadata = this.getRelevantMetadata(entry.metadata)
    if (Object.keys(relevantMetadata).length > 0) {
      log += `\n  Metadata: ${JSON.stringify(relevantMetadata, null, 2)}`
    }

    // Add stack trace in development
    if (this.config.includeStackTrace && entry.stackTrace) {
      log += `\n  Stack: ${entry.stackTrace}`
    }

    return log
  }

  /**
   * Send error to monitoring services
   */
  private sendToMonitoring(error: Error | BaseAppError, logEntry: ErrorLogEntry): void {
    this.config.monitoringServices.forEach((service) => {
      try {
        // Set user context if available
        if (logEntry.metadata.userId) {
          service.setUser(logEntry.metadata.userId)
        }

        // Add breadcrumb for context
        service.addBreadcrumb(
          logEntry.message,
          logEntry.category,
          this.getRelevantMetadata(logEntry.metadata)
        )

        // Capture error
        service.captureError(error, logEntry.metadata)
      } catch (monitoringError) {
        console.error('Failed to send error to monitoring service:', monitoringError)
      }
    })
  }

  /**
   * Check if error should be logged based on severity
   */
  private shouldLog(severity: ErrorSeverity): boolean {
    const severityOrder = {
      [ErrorSeverity.LOW]: 0,
      [ErrorSeverity.MEDIUM]: 1,
      [ErrorSeverity.HIGH]: 2,
      [ErrorSeverity.CRITICAL]: 3,
    }

    return severityOrder[severity] >= severityOrder[this.config.logLevel]
  }

  /**
   * Get log level from environment
   */
  private getLogLevelFromEnv(): ErrorSeverity {
    const level = process.env.ERROR_LOG_LEVEL?.toUpperCase()
    if (level && level in ErrorSeverity) {
      return ErrorSeverity[level as keyof typeof ErrorSeverity]
    }
    return process.env.NODE_ENV === 'production' ? ErrorSeverity.MEDIUM : ErrorSeverity.LOW
  }

  /**
   * Redact sensitive data from log entry
   */
  private redactSensitiveData(entry: ErrorLogEntry): ErrorLogEntry {
    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'apiKey',
      'authorization',
      'cookie',
      'creditCard',
      'ssn',
    ]

    const redacted = { ...entry }
    const redactedMetadata = { ...entry.metadata }

    // Redact sensitive keys
    Object.keys(redactedMetadata).forEach((key) => {
      if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
        redactedMetadata[key] = '[REDACTED]'
      }
    })

    redacted.metadata = redactedMetadata
    return redacted
  }

  /**
   * Get relevant metadata (exclude stack traces and internal fields)
   */
  private getRelevantMetadata(metadata: ErrorMetadata): Record<string, any> {
    const { stackTrace, cause, ...relevant } = metadata
    return relevant
  }
}

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance()
