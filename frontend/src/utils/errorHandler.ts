/**
 * Centralized Error Handler Utility
 *
 * Provides consistent error message extraction and logging across the frontend
 */

/**
 * Extracts user-friendly error message from various error formats
 *
 * @param error - Error object (can be from axios, fetch, or standard Error)
 * @param defaultMessage - Fallback message if extraction fails
 * @returns User-friendly error message string
 */
export function extractErrorMessage(
  error: any,
  defaultMessage: string = 'An error occurred'
): string {
  // Check for API error response with nested error object (backend standard format)
  if (error?.response?.data?.error?.message) {
    return error.response.data.error.message
  }

  // Check for API error response with direct message
  if (error?.response?.data?.message) {
    return error.response.data.message
  }

  // Check for API error response with error string
  if (typeof error?.response?.data?.error === 'string') {
    return error.response.data.error
  }

  // Check for API error response with direct error string
  if (typeof error?.response?.data === 'string') {
    return error.response.data
  }

  // Check for standard error message
  if (error?.message) {
    return error.message
  }

  // Return default message
  return defaultMessage
}

/**
 * Logs error details for debugging with consistent format
 *
 * @param context - Context identifier (e.g., 'Avatar Generation', 'File Upload')
 * @param error - Error object to log
 */
export function logError(context: string, error: any): void {
  const errorMessage = extractErrorMessage(error)

  console.error(`[${context}] Error:`, {
    message: errorMessage,
    status: error?.response?.status,
    statusText: error?.response?.statusText,
    code: error?.response?.data?.error?.code,
    data: error?.response?.data,
    stack: error?.stack,
    fullError: error,
  })
}

/**
 * Shows user-friendly alert with error message
 *
 * @param error - Error object
 * @param defaultMessage - Fallback message if extraction fails
 */
export function showErrorAlert(error: any, defaultMessage: string): void {
  const message = extractErrorMessage(error, defaultMessage)
  alert(message)
}

/**
 * Combined error handling: log + alert
 *
 * @param context - Context identifier for logging
 * @param error - Error object
 * @param defaultMessage - Fallback message for alert
 */
export function handleError(
  context: string,
  error: any,
  defaultMessage: string
): void {
  logError(context, error)
  showErrorAlert(error, defaultMessage)
}
