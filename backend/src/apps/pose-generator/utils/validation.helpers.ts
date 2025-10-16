/**
 * Validation Helper Functions for Pose Generator API
 *
 * Provides reusable validation utilities for:
 * - Admin authorization checks
 * - Parameter bounds validation
 * - Format validation
 * - Period validation
 */

import type { Context } from 'hono'
import type { AuthVariables } from '../../../types/hono'

/**
 * Valid export format names
 */
export const VALID_EXPORT_FORMATS = [
  'instagram_post',
  'instagram_story',
  'instagram_reel',
  'tiktok',
  'shopee_product',
  'tokopedia_product',
  'lazada_product',
  'facebook_post',
  'twitter_post',
  'linkedin_post',
  'print_standard',
  'print_large',
] as const

export type ExportFormat = typeof VALID_EXPORT_FORMATS[number]

/**
 * Valid time period values
 */
export const VALID_PERIODS = ['day', 'week', 'month', 'year', 'all'] as const
export type TimePeriod = typeof VALID_PERIODS[number]

/**
 * Check if user is admin using context (efficient - no DB query)
 *
 * @param c - Hono context with user data
 * @returns true if user is admin, false otherwise
 */
export function isAdmin(c: Context<{ Variables: AuthVariables }>): boolean {
  const user = c.get('user')
  return user?.role === 'ADMIN'
}

/**
 * Validate and enforce admin authorization
 * Throws 403 error if user is not admin
 *
 * @param c - Hono context with user data
 * @throws 403 Forbidden if user is not admin
 */
export function requireAdmin(c: Context<{ Variables: AuthVariables }>): void {
  const user = c.get('user')
  if (!user || user.role !== 'ADMIN') {
    throw c.json(
      {
        error: 'Forbidden',
        message: 'Admin access required',
      },
      403
    )
  }
}

/**
 * Validate and sanitize limit parameter
 * Ensures limit is within acceptable bounds
 *
 * @param limit - Raw limit string from query params
 * @param defaultLimit - Default value if not provided (default: 10)
 * @param maxLimit - Maximum allowed value (default: 100)
 * @returns Validated limit number
 */
export function validateLimit(
  limit: string | undefined,
  defaultLimit: number = 10,
  maxLimit: number = 100
): number {
  if (!limit) {
    return defaultLimit
  }

  const parsed = parseInt(limit, 10)

  // Invalid or negative numbers default to defaultLimit
  if (isNaN(parsed) || parsed < 1) {
    return defaultLimit
  }

  // Enforce maximum bound
  return Math.min(parsed, maxLimit)
}

/**
 * Validate export format name
 *
 * @param format - Format name to validate
 * @returns true if valid, false otherwise
 */
export function isValidExportFormat(format: string): format is ExportFormat {
  return VALID_EXPORT_FORMATS.includes(format as ExportFormat)
}

/**
 * Validate and filter export formats from comma-separated string
 *
 * @param formatsParam - Comma-separated format string
 * @param defaultFormats - Default formats if none provided
 * @returns Array of valid format names
 */
export function validateExportFormats(
  formatsParam: string | undefined,
  defaultFormats: ExportFormat[] = ['instagram_post', 'tiktok']
): ExportFormat[] {
  if (!formatsParam) {
    return defaultFormats
  }

  const requestedFormats = formatsParam.split(',').map(f => f.trim())
  const validFormats = requestedFormats.filter(isValidExportFormat)

  // If no valid formats after filtering, return defaults
  if (validFormats.length === 0) {
    return defaultFormats
  }

  return validFormats
}

/**
 * Validate time period parameter
 *
 * @param period - Period string to validate
 * @returns true if valid, false otherwise
 */
export function isValidPeriod(period: string): period is TimePeriod {
  return VALID_PERIODS.includes(period as TimePeriod)
}

/**
 * Calculate date range from period
 *
 * @param period - Time period (day, week, month, year, all)
 * @returns Object with start and end dates, or undefined for 'all'
 */
export function calculateDateRange(period: TimePeriod): {
  start: Date | undefined
  end: Date | undefined
} {
  const now = new Date()

  if (period === 'all') {
    return { start: undefined, end: undefined }
  }

  const start = new Date(now)
  const end = now

  switch (period) {
    case 'day':
      start.setDate(start.getDate() - 1)
      break
    case 'week':
      start.setDate(start.getDate() - 7)
      break
    case 'month':
      start.setDate(start.getDate() - 30)
      break
    case 'year':
      start.setDate(start.getDate() - 365)
      break
  }

  return { start, end }
}

/**
 * Sanitize string input to prevent injection attacks
 * Removes special characters and limits length
 *
 * @param input - Raw string input
 * @param maxLength - Maximum allowed length (default: 200)
 * @returns Sanitized string
 */
export function sanitizeString(input: string, maxLength: number = 200): string {
  return input
    .trim()
    .substring(0, maxLength)
    .replace(/[<>]/g, '') // Remove potential XSS characters
}

/**
 * Validation error response helper
 *
 * @param message - Error message
 * @param validValues - Optional array of valid values to return
 * @returns Standard error response object
 */
export function validationError(
  message: string,
  validValues?: readonly string[]
): {
  error: string
  message: string
  validValues?: readonly string[]
} {
  const response: any = {
    error: 'Bad Request',
    message,
  }

  if (validValues) {
    response.validValues = validValues
  }

  return response
}
