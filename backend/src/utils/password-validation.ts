import zxcvbn from 'zxcvbn'

// List of commonly breached passwords
const COMMON_PASSWORDS = new Set([
  'password', 'password123', '12345678', 'qwerty', 'abc123', 'password1',
  '1234567890', 'admin', 'letmein', 'welcome', 'monkey', '1234567',
  'password!', 'qwerty123', 'welcome123', 'admin123', 'root', 'toor',
  'pass', 'test', 'guest', 'master', 'super', 'administrator'
])

export interface PasswordValidationResult {
  valid: boolean
  errors: string[]
  strength: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong'
  score: number // 0-4
  crackTime: string
}

/**
 * Comprehensive password validation with multiple security checks
 * Requirements:
 * - Minimum 12 characters
 * - Maximum 128 characters
 * - At least 3 of: lowercase, uppercase, digit, special character
 * - Not a common/breached password
 * - No excessive repeating characters
 * - Minimum strength score of 3/4
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []

  // Check minimum length
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long')
  }

  // Check maximum length
  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters')
  }

  // Check for common passwords
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('This password is too common and has been breached. Please choose a different password.')
  }

  // Check complexity (at least 3 of: lowercase, uppercase, digit, special)
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasDigit = /[0-9]/.test(password)
  const hasSpecial = /[^a-zA-Z0-9]/.test(password)

  const complexityScore = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length

  if (complexityScore < 3) {
    errors.push('Password must include at least 3 of: lowercase letters, uppercase letters, digits, special characters')
  }

  // Check for repeating characters (no more than 2 consecutive repeats)
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password contains too many repeating characters')
  }

  // Check password strength using zxcvbn
  const strengthResult = zxcvbn(password)

  if (strengthResult.score < 3) {
    errors.push('Password is too weak. Please add more variety or length.')
  }

  // Add specific feedback from zxcvbn
  if (strengthResult.feedback.warning) {
    errors.push(strengthResult.feedback.warning)
  }

  if (strengthResult.feedback.suggestions.length > 0) {
    errors.push(...strengthResult.feedback.suggestions)
  }

  // Determine strength label
  const strengthLabels: Array<'weak' | 'fair' | 'good' | 'strong' | 'very-strong'> = [
    'weak', 'fair', 'good', 'strong', 'very-strong'
  ]

  return {
    valid: errors.length === 0,
    errors,
    strength: strengthLabels[strengthResult.score],
    score: strengthResult.score,
    crackTime: strengthResult.crack_times_display.offline_slow_hashing_1e4_per_second,
  }
}

/**
 * Check password strength without full validation (for real-time feedback)
 */
export function checkPasswordStrength(password: string): {
  score: number
  strength: string
  feedback: {
    warning?: string
    suggestions: string[]
  }
  crackTime: string
  isCommon: boolean
} {
  const result = zxcvbn(password)
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong']

  return {
    score: result.score,
    strength: strengthLabels[result.score],
    feedback: {
      warning: result.feedback.warning,
      suggestions: result.feedback.suggestions
    },
    crackTime: result.crack_times_display.offline_slow_hashing_1e4_per_second,
    isCommon: COMMON_PASSWORDS.has(password.toLowerCase())
  }
}
