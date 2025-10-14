/**
 * Structured logging utility
 * Provides consistent logging across the application with different log levels
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: any
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
}

/**
 * Format log entry as JSON for structured logging
 */
function formatLogEntry(level: LogLevel, message: string, context?: LogContext): string {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  }

  if (context && Object.keys(context).length > 0) {
    entry.context = context
  }

  return JSON.stringify(entry)
}

/**
 * Format log entry for console output (development)
 */
function formatConsoleLog(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString()
  const levelEmoji = {
    debug: '🔍',
    info: '📘',
    warn: '⚠️',
    error: '❌',
  }

  let log = `${levelEmoji[level]} [${timestamp}] [${level.toUpperCase()}] ${message}`

  if (context && Object.keys(context).length > 0) {
    log += `\n  Context: ${JSON.stringify(context, null, 2)}`
  }

  return log
}

/**
 * Logger configuration
 */
const config = {
  level: (process.env.LOG_LEVEL as LogLevel) || 'info',
  format: process.env.LOG_FORMAT || 'console', // 'json' or 'console'
}

/**
 * Log level priority
 */
const levelPriority: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

/**
 * Check if log level should be logged based on configuration
 */
function shouldLog(level: LogLevel): boolean {
  return levelPriority[level] >= levelPriority[config.level]
}

/**
 * Core logging function
 */
function log(level: LogLevel, message: string, context?: LogContext): void {
  if (!shouldLog(level)) {
    return
  }

  const formattedLog =
    config.format === 'json'
      ? formatLogEntry(level, message, context)
      : formatConsoleLog(level, message, context)

  // Use appropriate console method based on level
  switch (level) {
    case 'debug':
    case 'info':
      console.log(formattedLog)
      break
    case 'warn':
      console.warn(formattedLog)
      break
    case 'error':
      console.error(formattedLog)
      break
  }
}

/**
 * Structured logger
 */
export const logger = {
  /**
   * Log debug information (detailed diagnostic info)
   * @example logger.debug('Cache hit', { key: 'user:123', ttl: 3600 })
   */
  debug: (message: string, context?: LogContext) => {
    log('debug', message, context)
  },

  /**
   * Log informational messages (normal operations)
   * @example logger.info('User logged in', { userId: '123', email: 'user@example.com' })
   */
  info: (message: string, context?: LogContext) => {
    log('info', message, context)
  },

  /**
   * Log warning messages (potential issues)
   * @example logger.warn('High memory usage', { usage: '85%', threshold: '80%' })
   */
  warn: (message: string, context?: LogContext) => {
    log('warn', message, context)
  },

  /**
   * Log error messages (failures and exceptions)
   * @example logger.error('Payment processing failed', { orderId: '123', error: err.message })
   */
  error: (message: string, context?: LogContext) => {
    log('error', message, context)
  },

  /**
   * Log HTTP request
   * @example logger.request(c.req.method, c.req.path, { userId, duration: 123 })
   */
  request: (method: string, path: string, context?: LogContext) => {
    log('info', `${method} ${path}`, context)
  },

  /**
   * Log HTTP response
   * @example logger.response(c.req.method, c.req.path, 200, { duration: 123 })
   */
  response: (method: string, path: string, statusCode: number, context?: LogContext) => {
    const level = statusCode >= 400 ? 'warn' : 'info'
    log(level, `${method} ${path} ${statusCode}`, context)
  },
}

/**
 * Create a child logger with persistent context
 * Useful for adding context that should be included in all logs
 *
 * @example
 * const requestLogger = createLogger({ requestId: '123', userId: 'user-456' })
 * requestLogger.info('Processing request')
 * // Output includes requestId and userId in context
 */
export function createLogger(persistentContext: LogContext) {
  return {
    debug: (message: string, context?: LogContext) =>
      logger.debug(message, { ...persistentContext, ...context }),
    info: (message: string, context?: LogContext) =>
      logger.info(message, { ...persistentContext, ...context }),
    warn: (message: string, context?: LogContext) =>
      logger.warn(message, { ...persistentContext, ...context }),
    error: (message: string, context?: LogContext) =>
      logger.error(message, { ...persistentContext, ...context }),
  }
}
