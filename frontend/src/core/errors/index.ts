/**
 * Frontend Error Handling System - Main Export
 *
 * Centralized exports for all frontend error handling functionality.
 */

// Core error class
export { AppError } from './AppError'

// Types
export {
  ErrorSeverity,
  ErrorCategory,
  ErrorCode,
  type ErrorMetadata,
  type AppError as IAppError,
  type ErrorRecoveryStrategy,
  type ErrorLogEntry,
} from './types'

// Error boundary
export { ErrorBoundary, withErrorBoundary, type ErrorBoundaryProps } from './ErrorBoundary'

// Error logger
export { ErrorLogger, errorLogger, initializeErrorLogger } from './ErrorLogger'

// Error messages
export {
  getErrorMessage,
  formatErrorMessage,
  getErrorAction,
  ERROR_MESSAGES,
  type ErrorMessage,
} from './errorMessages'

// Utility functions
export {
  extractErrorMessage,
  parseError,
  logError,
  handleApiError,
  isAuthError,
  isNetworkError,
} from './utils'
