/**
 * Structured Logging with Pino
 *
 * Production-grade structured logging system with:
 * - JSON structured logs for easy parsing
 * - Log levels (trace, debug, info, warn, error, fatal)
 * - Pretty printing in development
 * - Performance optimized
 * - Request ID tracking support
 * - Child logger support for context
 */

import pino from 'pino'
import { env } from '../config/env'

/**
 * Configure Pino based on environment
 */
const pinoConfig: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || (env.NODE_ENV === 'production' ? 'info' : 'debug'),

  // Format timestamps
  timestamp: pino.stdTimeFunctions.isoTime,

  // Add basic context to all logs
  base: {
    env: env.NODE_ENV,
    pid: process.pid,
  },

  // Serialize errors properly
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },

  // Redact sensitive information
  redact: {
    paths: [
      'password',
      'token',
      'authorization',
      'cookie',
      'JWT_SECRET',
      'DUITKU_API_KEY',
      'DUITKU_MERCHANT_CODE',
      'REDIS_PASSWORD',
      'ANTHROPIC_API_KEY',
      'OPENAI_API_KEY',
      'FLUX_API_KEY',
      '*.password',
      '*.token',
      '*.authorization',
      'req.headers.authorization',
      'req.headers.cookie',
    ],
    remove: true,
  },
}

/**
 * Add pretty printing in development
 */
const logger = env.NODE_ENV === 'production'
  ? pino(pinoConfig)
  : pino({
      ...pinoConfig,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname',
          singleLine: false,
          levelFirst: true,
          messageFormat: '{msg}',
        },
      },
    })

/**
 * Create child logger with context
 *
 * @example
 * const userLogger = createLogger({ userId: '123' })
 * userLogger.info('User action')
 */
export function createLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings)
}

/**
 * Log levels:
 * - trace: Very detailed logs, typically disabled
 * - debug: Debug information, development only
 * - info: General informational messages
 * - warn: Warning messages, should be investigated
 * - error: Error messages, requires attention
 * - fatal: Fatal errors, application cannot continue
 */
export { logger }

/**
 * Export default for common usage
 */
export default logger
