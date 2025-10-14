/**
 * Security Logger Utility
 *
 * Specialized logger for security-related events, especially payment fraud detection.
 * All security events are logged with structured data for monitoring and alerting.
 */

export enum SecurityEventType {
  // Payment security events
  PAYMENT_CALLBACK_SUCCESS = 'PAYMENT_CALLBACK_SUCCESS',
  PAYMENT_CALLBACK_FAILED = 'PAYMENT_CALLBACK_FAILED',
  PAYMENT_SIGNATURE_INVALID = 'PAYMENT_SIGNATURE_INVALID',
  PAYMENT_IP_UNAUTHORIZED = 'PAYMENT_IP_UNAUTHORIZED',
  PAYMENT_CALLBACK_EXPIRED = 'PAYMENT_CALLBACK_EXPIRED',
  PAYMENT_DUPLICATE_CALLBACK = 'PAYMENT_DUPLICATE_CALLBACK',
  PAYMENT_NOT_FOUND = 'PAYMENT_NOT_FOUND',

  // General security events
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  AUTHORIZATION_FAILED = 'AUTHORIZATION_FAILED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

export enum SecuritySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface SecurityLogEntry {
  event: SecurityEventType
  severity: SecuritySeverity
  message: string
  timestamp: string
  ip?: string
  userId?: string
  merchantOrderId?: string
  amount?: number
  metadata?: Record<string, any>
}

/**
 * Security Logger Class
 *
 * Provides structured logging for security events.
 * In production, this should integrate with your monitoring system
 * (e.g., Sentry, Datadog, CloudWatch, etc.)
 */
class SecurityLogger {
  /**
   * Log a security event
   */
  log(entry: Omit<SecurityLogEntry, 'timestamp'>): void {
    const logEntry: SecurityLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    }

    // Format log message
    const logMessage = this.formatLogMessage(logEntry)

    // Log based on severity
    switch (entry.severity) {
      case SecuritySeverity.CRITICAL:
      case SecuritySeverity.HIGH:
        console.error(logMessage)
        break
      case SecuritySeverity.MEDIUM:
        console.warn(logMessage)
        break
      case SecuritySeverity.LOW:
        console.info(logMessage)
        break
    }

    // In production, send to monitoring service
    this.sendToMonitoring(logEntry)
  }

  /**
   * Log successful payment callback
   */
  logPaymentSuccess(data: {
    merchantOrderId: string
    amount: number
    ip?: string
    userId?: string
  }): void {
    this.log({
      event: SecurityEventType.PAYMENT_CALLBACK_SUCCESS,
      severity: SecuritySeverity.LOW,
      message: `Payment callback verified successfully: ${data.merchantOrderId}`,
      ip: data.ip,
      userId: data.userId,
      merchantOrderId: data.merchantOrderId,
      amount: data.amount,
    })
  }

  /**
   * Log failed payment callback (CRITICAL - potential fraud)
   */
  logPaymentFailure(data: {
    reason: string
    merchantOrderId?: string
    amount?: number
    ip?: string
    metadata?: Record<string, any>
  }): void {
    this.log({
      event: SecurityEventType.PAYMENT_CALLBACK_FAILED,
      severity: SecuritySeverity.CRITICAL,
      message: `Payment callback verification failed: ${data.reason}`,
      ip: data.ip,
      merchantOrderId: data.merchantOrderId,
      amount: data.amount,
      metadata: data.metadata,
    })
  }

  /**
   * Log invalid signature (CRITICAL - fraud attempt)
   */
  logInvalidSignature(data: {
    merchantOrderId?: string
    amount?: number
    ip?: string
    receivedSignature: string
  }): void {
    this.log({
      event: SecurityEventType.PAYMENT_SIGNATURE_INVALID,
      severity: SecuritySeverity.CRITICAL,
      message: 'Invalid payment signature detected - possible fraud attempt',
      ip: data.ip,
      merchantOrderId: data.merchantOrderId,
      amount: data.amount,
      metadata: {
        // Only log first 8 chars of signature for privacy
        receivedSignaturePreview: data.receivedSignature.substring(0, 8) + '...',
      },
    })
  }

  /**
   * Log unauthorized IP (HIGH - potential attack)
   */
  logUnauthorizedIP(data: { ip: string; merchantOrderId?: string }): void {
    this.log({
      event: SecurityEventType.PAYMENT_IP_UNAUTHORIZED,
      severity: SecuritySeverity.HIGH,
      message: `Payment callback from unauthorized IP: ${data.ip}`,
      ip: data.ip,
      merchantOrderId: data.merchantOrderId,
    })
  }

  /**
   * Log expired callback (MEDIUM - potential replay attack)
   */
  logExpiredCallback(data: {
    merchantOrderId: string
    timestamp: string
    ip?: string
  }): void {
    this.log({
      event: SecurityEventType.PAYMENT_CALLBACK_EXPIRED,
      severity: SecuritySeverity.MEDIUM,
      message: `Expired payment callback: ${data.merchantOrderId}`,
      ip: data.ip,
      merchantOrderId: data.merchantOrderId,
      metadata: { callbackTimestamp: data.timestamp },
    })
  }

  /**
   * Log duplicate callback (HIGH - replay attack)
   */
  logDuplicateCallback(data: {
    merchantOrderId: string
    ip?: string
  }): void {
    this.log({
      event: SecurityEventType.PAYMENT_DUPLICATE_CALLBACK,
      severity: SecuritySeverity.HIGH,
      message: `Duplicate payment callback detected: ${data.merchantOrderId}`,
      ip: data.ip,
      merchantOrderId: data.merchantOrderId,
    })
  }

  /**
   * Log payment not found (MEDIUM - data integrity issue)
   */
  logPaymentNotFound(data: {
    merchantOrderId: string
    ip?: string
  }): void {
    this.log({
      event: SecurityEventType.PAYMENT_NOT_FOUND,
      severity: SecuritySeverity.MEDIUM,
      message: `Payment not found for callback: ${data.merchantOrderId}`,
      ip: data.ip,
      merchantOrderId: data.merchantOrderId,
    })
  }

  /**
   * Format log message for console output
   */
  private formatLogMessage(entry: SecurityLogEntry): string {
    const parts = [
      `[SECURITY]`,
      `[${entry.severity}]`,
      `[${entry.event}]`,
      entry.message,
    ]

    if (entry.ip) {
      parts.push(`| IP: ${entry.ip}`)
    }

    if (entry.merchantOrderId) {
      parts.push(`| Order: ${entry.merchantOrderId}`)
    }

    if (entry.amount !== undefined) {
      parts.push(`| Amount: ${entry.amount}`)
    }

    if (entry.metadata) {
      parts.push(`| Metadata: ${JSON.stringify(entry.metadata)}`)
    }

    return parts.join(' ')
  }

  /**
   * Send to monitoring service
   *
   * In production, integrate with:
   * - Sentry for error tracking
   * - Datadog for metrics
   * - CloudWatch for AWS
   * - Custom webhook for Slack/Discord alerts
   */
  private sendToMonitoring(entry: SecurityLogEntry): void {
    // TODO: Integrate with monitoring service
    // Example integrations:

    // 1. Sentry
    // if (entry.severity === SecuritySeverity.CRITICAL || entry.severity === SecuritySeverity.HIGH) {
    //   Sentry.captureMessage(entry.message, {
    //     level: 'error',
    //     tags: {
    //       event: entry.event,
    //       severity: entry.severity,
    //     },
    //     extra: entry,
    //   })
    // }

    // 2. Datadog
    // datadogLogger.log(entry.message, {
    //   level: entry.severity.toLowerCase(),
    //   tags: [`event:${entry.event}`, `severity:${entry.severity}`],
    //   ...entry,
    // })

    // 3. Custom webhook for critical alerts
    // if (entry.severity === SecuritySeverity.CRITICAL) {
    //   fetch(process.env.SLACK_WEBHOOK_URL, {
    //     method: 'POST',
    //     body: JSON.stringify({
    //       text: `🚨 CRITICAL SECURITY EVENT: ${entry.message}`,
    //       attachments: [{ text: JSON.stringify(entry, null, 2) }],
    //     }),
    //   })
    // }
  }
}

// Export singleton instance
export const securityLogger = new SecurityLogger()

/**
 * Helper function to extract client IP from request
 */
export function getClientIP(request: any): string | undefined {
  return (
    request.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
    request.headers?.['x-real-ip'] ||
    request.socket?.remoteAddress ||
    undefined
  )
}
