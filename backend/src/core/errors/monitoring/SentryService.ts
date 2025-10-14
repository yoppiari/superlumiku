/**
 * Sentry Monitoring Service Integration
 *
 * Integrates with Sentry for error tracking and performance monitoring.
 * This is a reference implementation - uncomment and configure when ready to use.
 */

import { IMonitoringService } from '../ErrorLogger'
import { ErrorMetadata } from '../types'

/**
 * Sentry monitoring service implementation
 *
 * To use:
 * 1. Install: npm install @sentry/node @sentry/tracing
 * 2. Set SENTRY_DSN environment variable
 * 3. Initialize in your app startup
 */
export class SentryService implements IMonitoringService {
  private initialized = false

  constructor() {
    this.initialize()
  }

  private initialize(): void {
    const dsn = process.env.SENTRY_DSN

    if (!dsn) {
      console.warn('[SentryService] SENTRY_DSN not configured. Sentry integration disabled.')
      return
    }

    try {
      // Uncomment when Sentry is installed
      /*
      const Sentry = require('@sentry/node')
      const Tracing = require('@sentry/tracing')

      Sentry.init({
        dsn,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        integrations: [
          new Tracing.Integrations.Prisma({ client: prisma }),
          new Tracing.Integrations.Http({ tracing: true }),
        ],
        beforeSend(event, hint) {
          // Filter out operational errors in production
          const error = hint.originalException
          if (error && typeof error === 'object' && 'isOperational' in error) {
            if (error.isOperational && process.env.NODE_ENV === 'production') {
              return null // Don't send operational errors to Sentry in production
            }
          }
          return event
        },
      })

      this.initialized = true
      console.log('[SentryService] Initialized successfully')
      */
    } catch (error) {
      console.error('[SentryService] Failed to initialize:', error)
    }
  }

  captureError(error: Error, context?: ErrorMetadata): void {
    if (!this.initialized) return

    /*
    const Sentry = require('@sentry/node')

    Sentry.withScope((scope: any) => {
      // Add context
      if (context) {
        if (context.userId) {
          scope.setUser({ id: context.userId })
        }

        if (context.requestId) {
          scope.setTag('requestId', context.requestId)
        }

        if (context.resourceType) {
          scope.setTag('resourceType', context.resourceType)
        }

        // Add all metadata as extra
        scope.setExtras(context)
      }

      Sentry.captureException(error)
    })
    */
  }

  captureMessage(message: string, level: string, context?: ErrorMetadata): void {
    if (!this.initialized) return

    /*
    const Sentry = require('@sentry/node')

    Sentry.withScope((scope: any) => {
      if (context) {
        scope.setExtras(context)
      }

      Sentry.captureMessage(message, level as any)
    })
    */
  }

  setUser(userId: string, email?: string, username?: string): void {
    if (!this.initialized) return

    /*
    const Sentry = require('@sentry/node')

    Sentry.setUser({
      id: userId,
      email,
      username,
    })
    */
  }

  addBreadcrumb(message: string, category: string, data?: any): void {
    if (!this.initialized) return

    /*
    const Sentry = require('@sentry/node')

    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info' as any,
    })
    */
  }
}

/**
 * Export singleton instance
 */
export const sentryService = new SentryService()
