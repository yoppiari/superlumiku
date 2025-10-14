/**
 * Enhanced Error Boundary Component
 *
 * Provides comprehensive error handling for React components with:
 * - Multiple error boundary levels (app, page, component)
 * - Custom fallback UI for each level
 * - Error recovery strategies
 * - Automatic error logging
 * - Reset and retry functionality
 */

import { Component, ReactNode, ErrorInfo } from 'react'
import { AppError } from './AppError'
import { errorLogger } from './ErrorLogger'
import { ErrorCode, ErrorCategory, ErrorSeverity } from './types'

/**
 * Error boundary props
 */
export interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode | ((error: AppError, reset: () => void) => ReactNode)
  level?: 'app' | 'page' | 'component'
  onError?: (error: AppError, errorInfo: ErrorInfo) => void
  onReset?: () => void
  resetKeys?: any[]
  isolate?: boolean
}

/**
 * Error boundary state
 */
interface ErrorBoundaryState {
  hasError: boolean
  error: AppError | null
  errorInfo: ErrorInfo | null
  errorCount: number
}

/**
 * Enhanced Error Boundary
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeout?: number

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error: AppError.fromRenderError(error),
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Convert to AppError
    const appError = AppError.fromRenderError(error, this.getComponentName())

    // Update state
    this.setState((prevState) => ({
      error: appError,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }))

    // Log error
    errorLogger.logError(appError, {
      componentStack: errorInfo.componentStack,
      level: this.props.level || 'component',
    })

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(appError, errorInfo)
    }

    // Auto-reset for transient errors after a delay
    if (this.shouldAutoReset(appError)) {
      this.scheduleReset()
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset on resetKeys change
    if (this.props.resetKeys && prevProps.resetKeys) {
      const hasChanged = this.props.resetKeys.some(
        (key, index) => key !== prevProps.resetKeys![index]
      )

      if (hasChanged && this.state.hasError) {
        this.reset()
      }
    }
  }

  componentWillUnmount(): void {
    if (this.resetTimeout !== undefined) {
      window.clearTimeout(this.resetTimeout)
    }
  }

  /**
   * Reset error boundary
   */
  private reset = (): void => {
    if (this.resetTimeout !== undefined) {
      window.clearTimeout(this.resetTimeout)
      this.resetTimeout = undefined
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })

    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  /**
   * Get component name from error info
   */
  private getComponentName(): string {
    const { errorInfo } = this.state
    if (!errorInfo?.componentStack) return 'Unknown Component'

    const match = errorInfo.componentStack.match(/at (\w+)/)
    return match ? match[1] : 'Unknown Component'
  }

  /**
   * Check if error should trigger auto-reset
   */
  private shouldAutoReset(error: AppError): boolean {
    // Don't auto-reset critical errors
    if (error.severity === ErrorSeverity.CRITICAL) {
      return false
    }

    // Don't auto-reset if error count is too high (prevent infinite loop)
    if (this.state.errorCount >= 3) {
      return false
    }

    // Auto-reset for transient errors
    return error.category === ErrorCategory.NETWORK || error.isRetryable()
  }

  /**
   * Schedule auto-reset
   */
  private scheduleReset(): void {
    const delay = this.state.error?.getRetryDelay() || 3000

    this.resetTimeout = window.setTimeout(() => {
      this.reset()
    }, delay)
  }

  /**
   * Reload page
   */
  private handleReload = (): void => {
    window.location.reload()
  }

  /**
   * Navigate to home
   */
  private handleGoHome = (): void => {
    window.location.href = '/dashboard'
  }

  /**
   * Render error fallback
   */
  private renderFallback(): ReactNode {
    const { fallback, level = 'component' } = this.props
    const { error, errorInfo } = this.state

    if (!error) return null

    // Custom fallback
    if (fallback) {
      if (typeof fallback === 'function') {
        return fallback(error, this.reset)
      }
      return fallback
    }

    // Default fallbacks by level
    switch (level) {
      case 'app':
        return this.renderAppLevelError()
      case 'page':
        return this.renderPageLevelError()
      case 'component':
        return this.renderComponentLevelError()
      default:
        return this.renderComponentLevelError()
    }
  }

  /**
   * Render app-level error (full screen)
   */
  private renderAppLevelError(): ReactNode {
    const { error, errorInfo } = this.state

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-slate-600 mb-6">
              {error?.message || 'The application encountered an unexpected error.'}
            </p>

            {import.meta.env.DEV && error && (
              <details className="mb-4 text-left">
                <summary className="cursor-pointer text-sm text-slate-500 hover:text-slate-700 mb-2">
                  Error Details (dev only)
                </summary>
                <div className="mt-2 p-3 bg-slate-100 rounded text-xs overflow-auto max-h-40">
                  <div className="font-semibold text-red-600 mb-2">
                    [{error.code}] {error.message}
                  </div>
                  <div className="text-slate-600 mb-2">
                    Category: {error.category} | Severity: {error.severity}
                  </div>
                  {error.stack && (
                    <pre className="whitespace-pre-wrap text-slate-700 text-xs">
                      {error.stack}
                    </pre>
                  )}
                  {errorInfo?.componentStack && (
                    <>
                      <div className="font-semibold text-red-600 mt-3 mb-2">
                        Component Stack:
                      </div>
                      <pre className="whitespace-pre-wrap text-slate-700 text-xs">
                        {errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.reset}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /**
   * Render page-level error (inline banner)
   */
  private renderPageLevelError(): ReactNode {
    const { error, errorInfo } = this.state

    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg m-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🔴</div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-red-900 mb-2">
              Page Error
            </h2>
            <p className="text-red-700 mb-4">
              {error?.message || 'This page encountered an error.'}
            </p>

            {import.meta.env.DEV && error && (
              <details className="mb-4">
                <summary className="cursor-pointer text-sm text-red-600 hover:text-red-800 mb-2">
                  Error Details (dev only)
                </summary>
                <div className="mt-2 p-3 bg-red-100 rounded text-xs overflow-auto max-h-32">
                  <div className="font-semibold mb-1">
                    [{error.code}] {error.message}
                  </div>
                  {error.stack && (
                    <pre className="whitespace-pre-wrap text-red-900 text-xs">
                      {error.stack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <div className="flex gap-2">
              <button
                onClick={this.reset}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
              >
                Retry
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-3 py-1.5 bg-slate-200 text-slate-700 text-sm rounded hover:bg-slate-300 transition"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /**
   * Render component-level error (minimal inline)
   */
  private renderComponentLevelError(): ReactNode {
    const { error } = this.state

    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-yellow-800 text-sm">
          {error?.message || 'This component failed to load.'}{' '}
          <button
            onClick={this.reset}
            className="underline hover:text-yellow-900 font-medium"
          >
            Try again
          </button>
        </p>
        {import.meta.env.DEV && error && (
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-yellow-600 hover:text-yellow-800">
              Error Details (dev only)
            </summary>
            <pre className="mt-1 text-xs text-yellow-900 overflow-auto max-h-20">
              [{error.code}] {error.message}
            </pre>
          </details>
        )}
      </div>
    )
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.renderFallback()
    }

    return this.props.children
  }
}

/**
 * Error boundary HOC
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.ComponentType<P> {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}
