import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Button } from './ui'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  level?: 'app' | 'page' | 'component'
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log to backend
    this.logErrorToBackend(error, errorInfo)
  }

  private async logErrorToBackend(error: Error, errorInfo: ErrorInfo) {
    try {
      await fetch('/api/logs/frontend-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          level: this.props.level || 'app',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      })
    } catch (loggingError) {
      console.error('[ErrorBoundary] Failed to log error to backend:', loggingError)
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/dashboard'
  }

  override render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { level = 'app' } = this.props

      // App-level error (full screen)
      if (level === 'app') {
        return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
              <div className="text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  Something went wrong
                </h1>
                <p className="text-slate-600 mb-6">
                  We're sorry for the inconvenience. The application encountered an unexpected error.
                </p>

                {import.meta.env.DEV && this.state.error && (
                  <details className="mb-4 text-left">
                    <summary className="cursor-pointer text-sm text-slate-500 hover:text-slate-700 mb-2">
                      Error Details (dev only)
                    </summary>
                    <div className="mt-2 p-3 bg-slate-100 rounded text-xs overflow-auto max-h-40 text-left">
                      <div className="font-semibold text-red-600 mb-2">
                        {this.state.error.toString()}
                      </div>
                      <pre className="whitespace-pre-wrap text-slate-700">
                        {this.state.error.stack}
                      </pre>
                      {this.state.errorInfo?.componentStack && (
                        <>
                          <div className="font-semibold text-red-600 mt-3 mb-2">
                            Component Stack:
                          </div>
                          <pre className="whitespace-pre-wrap text-slate-700">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </>
                      )}
                    </div>
                  </details>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={this.handleReset} className="flex-1 sm:flex-initial">
                    Try Again
                  </Button>
                  <Button
                    onClick={this.handleReload}
                    variant="outline"
                    className="flex-1 sm:flex-initial"
                  >
                    Reload Page
                  </Button>
                  <Button
                    onClick={this.handleGoHome}
                    variant="outline"
                    className="flex-1 sm:flex-initial"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      // Page-level error (inline banner)
      if (level === 'page') {
        return (
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg m-4">
            <h2 className="text-lg font-semibold text-red-900 mb-2">
              Page Error
            </h2>
            <p className="text-red-700 mb-4">
              This page encountered an error. Please try refreshing or return to the dashboard.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <details className="mb-4">
                <summary className="cursor-pointer text-sm text-red-600 hover:text-red-800">
                  Error Details (dev only)
                </summary>
                <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto max-h-32">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <div className="flex gap-2">
              <Button onClick={this.handleReset} size="sm">
                Retry
              </Button>
              <Button onClick={this.handleGoHome} variant="outline" size="sm">
                Go to Dashboard
              </Button>
            </div>
          </div>
        )
      }

      // Component-level error (minimal inline)
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800 text-sm">
            This component failed to load.{' '}
            <button
              onClick={this.handleReset}
              className="underline hover:text-yellow-900 font-medium"
            >
              Try again
            </button>
          </p>
          {import.meta.env.DEV && this.state.error && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-yellow-600 hover:text-yellow-800">
                Error Details (dev only)
              </summary>
              <pre className="mt-1 text-xs text-yellow-900 overflow-auto max-h-20">
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
