/**
 * Centralized Validation Service
 *
 * This service consolidates common validation patterns used across the application.
 * It provides reusable validation functions for:
 * - File uploads (images, videos, audio)
 * - User input sanitization
 * - Business logic validation
 * - Rate limiting checks
 *
 * Benefits:
 * - DRY: Single source of truth for validation logic
 * - Consistency: Same validation rules across all endpoints
 * - Security: Centralized security checks (magic bytes, sanitization)
 * - Maintainability: Update validation in one place
 *
 * @module services/validation
 */

import path from 'path'
import { validateImageFile, sanitizeFilename, generateSecureFilename } from '../utils/file-validation'
import { ValidationError } from '../core/errors'
import type { ErrorMetadata } from '../core/errors/types'

/**
 * Validation result for file uploads
 */
export interface FileValidationResult {
  /** Validated file buffer */
  buffer: Buffer
  /** Actual MIME type (from magic bytes) */
  mimeType: string
  /** File extension */
  extension: string
  /** Sanitized filename (safe for filesystem) */
  sanitizedFilename: string
  /** Secure random filename for storage */
  secureFilename: string
  /** File metadata */
  metadata: {
    width?: number
    height?: number
    format?: string
    size: number
  }
}

/**
 * Options for image validation
 */
export interface ImageValidationOptions {
  maxSizeBytes?: number
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  allowedMimeTypes?: string[]
  allowedExtensions?: string[]
}

/**
 * Options for video validation
 */
export interface VideoValidationOptions {
  maxSizeBytes?: number
  maxDurationSeconds?: number
  allowedMimeTypes?: string[]
  allowedExtensions?: string[]
}

/**
 * Options for audio validation
 */
export interface AudioValidationOptions {
  maxSizeBytes?: number
  maxDurationSeconds?: number
  allowedMimeTypes?: string[]
  allowedExtensions?: string[]
}

/**
 * Default validation options
 */
const DEFAULT_IMAGE_OPTIONS: Required<ImageValidationOptions> = {
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  minWidth: 256,
  minHeight: 256,
  maxWidth: 4096,
  maxHeight: 4096,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
}

const DEFAULT_VIDEO_OPTIONS: Required<VideoValidationOptions> = {
  maxSizeBytes: 500 * 1024 * 1024, // 500MB
  maxDurationSeconds: 600, // 10 minutes
  allowedMimeTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
  allowedExtensions: ['.mp4', '.mov', '.avi'],
}

const DEFAULT_AUDIO_OPTIONS: Required<AudioValidationOptions> = {
  maxSizeBytes: 50 * 1024 * 1024, // 50MB
  maxDurationSeconds: 600, // 10 minutes
  allowedMimeTypes: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav'],
  allowedExtensions: ['.mp3', '.wav', '.m4a'],
}

/**
 * Centralized Validation Service
 */
export class ValidationService {
  /**
   * Validate image file with comprehensive security checks
   *
   * Performs:
   * - Size validation
   * - Magic byte validation (prevents MIME spoofing)
   * - Extension validation
   * - Dimension validation
   * - Decompression bomb detection
   * - Filename sanitization
   *
   * @param file - File to validate
   * @param options - Optional validation constraints
   * @returns Promise resolving to validation result
   * @throws ValidationError if file fails validation
   */
  async validateImage(
    file: File,
    options: ImageValidationOptions = {}
  ): Promise<FileValidationResult> {
    const opts = { ...DEFAULT_IMAGE_OPTIONS, ...options }

    // Validate with existing utility
    const validated = await validateImageFile(file, opts)

    // Generate secure filename for storage
    const secureFilename = generateSecureFilename(file.name)

    return {
      ...validated,
      secureFilename,
    }
  }

  /**
   * Validate video file
   *
   * Performs basic validation:
   * - Size validation
   * - Extension validation
   * - MIME type validation
   * - Filename sanitization
   *
   * Note: Duration validation requires FFprobe and is done separately
   *
   * @param file - File to validate
   * @param options - Optional validation constraints
   * @returns Promise resolving to basic validation result
   * @throws ValidationError if file fails validation
   */
  async validateVideo(
    file: File,
    options: VideoValidationOptions = {}
  ): Promise<Pick<FileValidationResult, 'sanitizedFilename' | 'secureFilename' | 'metadata'>> {
    const opts = { ...DEFAULT_VIDEO_OPTIONS, ...options }

    // Size validation
    if (file.size === 0) {
      throw new ValidationError('Video file is empty', { field: 'file' })
    }

    if (file.size > opts.maxSizeBytes) {
      const maxMB = Math.round(opts.maxSizeBytes / 1024 / 1024)
      throw new ValidationError(`Video file too large. Maximum size is ${maxMB}MB`, {
        field: 'file',
        maxSize: opts.maxSizeBytes,
        actualSize: file.size,
      })
    }

    // Extension validation
    const sanitized = sanitizeFilename(file.name)
    const ext = path.extname(sanitized).toLowerCase()

    if (!ext || !opts.allowedExtensions.includes(ext)) {
      const allowed = opts.allowedExtensions.join(', ')
      throw new ValidationError(`Invalid video format. Only ${allowed} are allowed`, {
        field: 'file',
        allowedExtensions: opts.allowedExtensions,
        providedExtension: ext || 'none',
      })
    }

    // MIME type validation (basic - client-provided)
    if (!opts.allowedMimeTypes.includes(file.type)) {
      const allowed = opts.allowedMimeTypes.join(', ')
      throw new ValidationError(`Invalid video MIME type. Only ${allowed} are allowed`, {
        field: 'file',
        allowedTypes: opts.allowedMimeTypes,
        providedType: file.type,
      })
    }

    const secureFilename = generateSecureFilename(file.name)

    return {
      sanitizedFilename: sanitized,
      secureFilename,
      metadata: {
        size: file.size,
      },
    }
  }

  /**
   * Validate audio file
   *
   * Performs basic validation:
   * - Size validation
   * - Extension validation
   * - MIME type validation
   * - Filename sanitization
   *
   * @param file - File to validate
   * @param options - Optional validation constraints
   * @returns Promise resolving to basic validation result
   * @throws ValidationError if file fails validation
   */
  async validateAudio(
    file: File,
    options: AudioValidationOptions = {}
  ): Promise<Pick<FileValidationResult, 'sanitizedFilename' | 'secureFilename' | 'metadata'>> {
    const opts = { ...DEFAULT_AUDIO_OPTIONS, ...options }

    // Size validation
    if (file.size === 0) {
      throw new ValidationError('Audio file is empty', { field: 'file' })
    }

    if (file.size > opts.maxSizeBytes) {
      const maxMB = Math.round(opts.maxSizeBytes / 1024 / 1024)
      throw new ValidationError(`Audio file too large. Maximum size is ${maxMB}MB`, {
        field: 'file',
        maxSize: opts.maxSizeBytes,
        actualSize: file.size,
      })
    }

    // Extension validation
    const sanitized = sanitizeFilename(file.name)
    const ext = path.extname(sanitized).toLowerCase()

    if (!ext || !opts.allowedExtensions.includes(ext)) {
      const allowed = opts.allowedExtensions.join(', ')
      throw new ValidationError(`Invalid audio format. Only ${allowed} are allowed`, {
        field: 'file',
        allowedExtensions: opts.allowedExtensions,
        providedExtension: ext || 'none',
      })
    }

    // MIME type validation (basic - client-provided)
    if (!opts.allowedMimeTypes.includes(file.type)) {
      const allowed = opts.allowedMimeTypes.join(', ')
      throw new ValidationError(`Invalid audio MIME type. Only ${allowed} are allowed`, {
        field: 'file',
        allowedTypes: opts.allowedMimeTypes,
        providedType: file.type,
      })
    }

    const secureFilename = generateSecureFilename(file.name)

    return {
      sanitizedFilename: sanitized,
      secureFilename,
      metadata: {
        size: file.size,
      },
    }
  }

  /**
   * Validate file size within constraints
   *
   * @param file - File to validate
   * @param maxSizeBytes - Maximum allowed size in bytes
   * @param fieldName - Field name for error messages
   * @throws ValidationError if file exceeds size limit
   */
  validateFileSize(file: File, maxSizeBytes: number, fieldName: string = 'file'): void {
    if (file.size === 0) {
      throw new ValidationError('File is empty', { field: fieldName })
    }

    if (file.size > maxSizeBytes) {
      const maxMB = Math.round(maxSizeBytes / 1024 / 1024)
      throw new ValidationError(`File too large. Maximum size is ${maxMB}MB`, {
        field: fieldName,
        maxSize: maxSizeBytes,
        actualSize: file.size,
      })
    }
  }

  /**
   * Validate numeric range
   *
   * @param value - Value to validate
   * @param min - Minimum allowed value (inclusive)
   * @param max - Maximum allowed value (inclusive)
   * @param fieldName - Field name for error messages
   * @throws ValidationError if value is out of range
   */
  validateRange(value: number, min: number, max: number, fieldName: string): void {
    if (value < min || value > max) {
      throw new ValidationError(`${fieldName} must be between ${min} and ${max}`, {
        field: fieldName,
        min,
        max,
        provided: value,
      })
    }
  }

  /**
   * Validate enum value
   *
   * @param value - Value to validate
   * @param allowedValues - Array of allowed values
   * @param fieldName - Field name for error messages
   * @throws ValidationError if value is not in allowed values
   */
  validateEnum<T extends string>(value: T, allowedValues: T[], fieldName: string): void {
    if (!allowedValues.includes(value)) {
      throw new ValidationError(
        `Invalid ${fieldName}. Must be one of: ${allowedValues.join(', ')}`,
        {
          field: fieldName,
          allowedValues,
          provided: value,
        }
      )
    }
  }

  /**
   * Validate string length
   *
   * @param value - String to validate
   * @param minLength - Minimum length (inclusive)
   * @param maxLength - Maximum length (inclusive)
   * @param fieldName - Field name for error messages
   * @throws ValidationError if string length is invalid
   */
  validateStringLength(
    value: string,
    minLength: number,
    maxLength: number,
    fieldName: string
  ): void {
    if (value.length < minLength) {
      throw new ValidationError(`${fieldName} must be at least ${minLength} characters`, {
        field: fieldName,
        minLength,
        actualLength: value.length,
      })
    }

    if (value.length > maxLength) {
      throw new ValidationError(`${fieldName} must not exceed ${maxLength} characters`, {
        field: fieldName,
        maxLength,
        actualLength: value.length,
      })
    }
  }

  /**
   * Validate required field
   *
   * @param value - Value to validate
   * @param fieldName - Field name for error messages
   * @throws ValidationError if value is null, undefined, or empty string
   */
  validateRequired(value: any, fieldName: string): void {
    if (value === null || value === undefined || value === '') {
      throw new ValidationError(`${fieldName} is required`, {
        field: fieldName,
      })
    }
  }

  /**
   * Sanitize user input string
   *
   * Removes potentially dangerous characters and trims whitespace
   *
   * @param input - Input string to sanitize
   * @param allowNewlines - Whether to allow newline characters
   * @returns Sanitized string
   */
  sanitizeInput(input: string, allowNewlines: boolean = false): string {
    let sanitized = input.trim()

    // Remove control characters (except newlines if allowed)
    if (allowNewlines) {
      sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
    } else {
      sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '')
    }

    return sanitized
  }

  /**
   * Validate and sanitize filename
   *
   * @param filename - Filename to validate
   * @param allowedExtensions - Optional array of allowed extensions
   * @returns Sanitized filename
   * @throws ValidationError if filename is invalid
   */
  validateFilename(filename: string, allowedExtensions?: string[]): string {
    if (!filename || filename.trim() === '') {
      throw new ValidationError('Filename is required', { field: 'filename' })
    }

    const sanitized = sanitizeFilename(filename)

    if (allowedExtensions) {
      const ext = path.extname(sanitized).toLowerCase()
      if (!allowedExtensions.includes(ext)) {
        throw new ValidationError(
          `Invalid file extension. Allowed: ${allowedExtensions.join(', ')}`,
          {
            field: 'filename',
            allowedExtensions,
            providedExtension: ext,
          }
        )
      }
    }

    return sanitized
  }

  /**
   * Validate UUID format
   *
   * @param value - Value to validate
   * @param fieldName - Field name for error messages
   * @throws ValidationError if value is not a valid UUID
   */
  validateUUID(value: string, fieldName: string): void {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

    if (!uuidRegex.test(value)) {
      throw new ValidationError(`Invalid ${fieldName} format`, {
        field: fieldName,
        expectedFormat: 'UUID v4',
        provided: value,
      })
    }
  }

  /**
   * Validate array length
   *
   * @param array - Array to validate
   * @param minLength - Minimum length
   * @param maxLength - Maximum length
   * @param fieldName - Field name for error messages
   * @throws ValidationError if array length is invalid
   */
  validateArrayLength(
    array: any[],
    minLength: number,
    maxLength: number,
    fieldName: string
  ): void {
    if (array.length < minLength) {
      throw new ValidationError(`${fieldName} must have at least ${minLength} items`, {
        field: fieldName,
        minLength,
        actualLength: array.length,
      })
    }

    if (array.length > maxLength) {
      throw new ValidationError(`${fieldName} must not exceed ${maxLength} items`, {
        field: fieldName,
        maxLength,
        actualLength: array.length,
      })
    }
  }
}

/**
 * Singleton instance of ValidationService
 */
export const validationService = new ValidationService()
