import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

/**
 * P1-2 FIX: React Error Boundary for Pose Generator
 *
 * Catches JavaScript errors anywhere in the component tree,
 * logs them, and displays a fallback UI instead of crashing the whole app.
 *
 * Features:
 * - Graceful error handling with user-friendly message
 * - Error details display (in development)
 * - Reload button to recover from errors
 * - Error logging for debugging
 */

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class PoseGeneratorErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details for debugging
    console.error('[Pose Generator Error Boundary] Error caught:', {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
    })

    // Store error info in state
    this.setState({
      errorInfo,
    })

    // TODO: Send error to monitoring service (e.g., Sentry)
    // Sentry.captureException(error, {
    //   contexts: {
    //     react: {
    //       componentStack: errorInfo.componentStack,
    //     },
    //   },
    // })
  }

  handleReload = (): void => {
    // Reset error state and reload the page
    window.location.reload()
  }

  handleGoBack = (): void => {
    // Navigate back to dashboard
    window.location.href = '/dashboard'
  }

  render(): ReactNode {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development'

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="max-w-2xl mx-auto p-8">
            <div className="bg-white rounded-xl shadow-xl p-8 border border-red-100">
              {/* Error Icon */}
              <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>

              {/* Error Title */}
              <h1 className="text-3xl font-bold text-center text-slate-900 mb-4">
                Something went wrong
              </h1>

              {/* Error Message */}
              <p className="text-center text-slate-600 mb-6 leading-relaxed">
                We encountered an unexpected error in the Pose Generator. Don't worry, your data is safe.
                Please try reloading the page or return to the dashboard.
              </p>

              {/* Development Error Details */}
              {isDevelopment && this.state.error && (
                <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
                  <h3 className="text-sm font-semibold text-red-900 mb-2">
                    Error Details (Development Only):
                  </h3>
                  <p className="text-xs font-mono text-red-800 mb-2">
                    {this.state.error.name}: {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <details className="text-xs font-mono text-red-700 mt-2">
                      <summary className="cursor-pointer hover:text-red-900 font-semibold">
                        Stack Trace
                      </summary>
                      <pre className="mt-2 whitespace-pre-wrap break-words overflow-auto max-h-48 p-2 bg-white rounded border border-red-200">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={this.handleReload}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </button>
                <button
                  onClick={this.handleGoBack}
                  className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                >
                  Back to Dashboard
                </button>
              </div>

              {/* Help Text */}
              <p className="text-center text-sm text-slate-500 mt-6">
                If this problem persists, please contact support with the error details.
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default PoseGeneratorErrorBoundary
