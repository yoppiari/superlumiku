/**
 * Payment Security Error Classes
 *
 * Custom error classes for payment-related security issues.
 * These errors provide structured error handling and audit logging.
 */

/**
 * Base Payment Error
 *
 * Base class for all payment-related errors.
 */
export class PaymentError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly context?: Record<string, any>

  constructor(message: string, code: string, statusCode: number = 400, context?: Record<string, any>) {
    super(message)
    this.name = 'PaymentError'
    this.code = code
    this.statusCode = statusCode
    this.context = context

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PaymentError)
    }
  }

  toJSON() {
    return {
      error: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
    }
  }
}

/**
 * Payment Verification Error
 *
 * Thrown when payment callback signature verification fails.
 * CRITICAL: Always log these errors for fraud detection.
 */
export class PaymentVerificationError extends PaymentError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'PAYMENT_VERIFICATION_FAILED', 400, context)
    this.name = 'PaymentVerificationError'
  }
}

/**
 * Invalid Signature Error
 *
 * Thrown specifically when the callback signature doesn't match.
 * This indicates a potential fraud attempt.
 */
export class InvalidSignatureError extends PaymentVerificationError {
  constructor(context?: Record<string, any>) {
    super('Invalid payment signature', context)
    this.name = 'InvalidSignatureError'
    this.code = 'INVALID_SIGNATURE'
  }
}

/**
 * Invalid IP Error
 *
 * Thrown when callback originates from unauthorized IP address.
 */
export class InvalidIPError extends PaymentVerificationError {
  constructor(ip: string) {
    super('Unauthorized callback source', { clientIP: ip })
    this.name = 'InvalidIPError'
    this.code = 'INVALID_IP'
  }
}

/**
 * Expired Callback Error
 *
 * Thrown when callback timestamp is too old.
 * Prevents replay attacks with expired callbacks.
 */
export class ExpiredCallbackError extends PaymentVerificationError {
  constructor(timestamp: string) {
    super('Callback has expired', { timestamp })
    this.name = 'ExpiredCallbackError'
    this.code = 'CALLBACK_EXPIRED'
  }
}

/**
 * Duplicate Callback Error
 *
 * Thrown when the same callback is received multiple times.
 * Prevents replay attacks.
 */
export class DuplicateCallbackError extends PaymentVerificationError {
  constructor(merchantOrderId: string) {
    super('Duplicate callback detected', { merchantOrderId })
    this.name = 'DuplicateCallbackError'
    this.code = 'DUPLICATE_CALLBACK'
  }
}

/**
 * Payment Not Found Error
 *
 * Thrown when referenced payment doesn't exist.
 */
export class PaymentNotFoundError extends PaymentError {
  constructor(merchantOrderId: string) {
    super('Payment not found', 'PAYMENT_NOT_FOUND', 404, { merchantOrderId })
    this.name = 'PaymentNotFoundError'
  }
}

/**
 * Payment Creation Error
 *
 * Thrown when payment creation with Duitku fails.
 */
export class PaymentCreationError extends PaymentError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'PAYMENT_CREATION_FAILED', 400, context)
    this.name = 'PaymentCreationError'
  }
}

/**
 * Error Handler Helper
 *
 * Converts payment errors to appropriate HTTP responses.
 * Use this in route handlers to ensure consistent error responses.
 *
 * @example
 * ```typescript
 * try {
 *   await paymentService.handleCallback(data)
 * } catch (error) {
 *   return handlePaymentError(c, error)
 * }
 * ```
 */
export function handlePaymentError(c: any, error: any): Response {
  // Payment verification errors (security-related)
  if (error instanceof PaymentVerificationError) {
    // Log security event but don't expose details to client
    console.error('[SECURITY] Payment verification failed:', {
      error: error.name,
      code: error.code,
      context: error.context,
      timestamp: new Date().toISOString(),
    })

    // Return generic error (don't leak security details)
    return c.json(
      {
        error: 'Payment verification failed',
      },
      400
    )
  }

  // Payment not found
  if (error instanceof PaymentNotFoundError) {
    return c.json(
      {
        error: error.message,
      },
      404
    )
  }

  // Other payment errors
  if (error instanceof PaymentError) {
    return c.json(
      {
        error: error.message,
        code: error.code,
      },
      error.statusCode
    )
  }

  // Unknown error - log and return generic 500
  console.error('Unexpected payment error:', error)
  return c.json(
    {
      error: 'An unexpected error occurred',
    },
    500
  )
}

/**
 * Check if error is payment-related
 */
export function isPaymentError(error: any): boolean {
  return error instanceof PaymentError
}

/**
 * Check if error is security-related (needs audit logging)
 */
export function isSecurityError(error: any): boolean {
  return error instanceof PaymentVerificationError
}
