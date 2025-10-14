/**
 * File Validation Utility
 *
 * Production-ready file validation with security hardening:
 * - Magic byte validation (not just MIME type from client)
 * - Filename sanitization (prevent path traversal)
 * - Size validation
 * - Image dimension validation
 * - Extension whitelist
 *
 * Protects against:
 * - MIME type spoofing
 * - Path traversal attacks
 * - Malicious file uploads
 * - Resource exhaustion (oversized files)
 */

import { fileTypeFromBuffer } from 'file-type'
import sharp from 'sharp'
import path from 'path'
import { ValidationError } from '../core/errors/errors'

/**
 * Result of file validation
 */
export interface FileValidationResult {
  buffer: Buffer
  mimeType: string
  extension: string
  sanitizedFilename: string
  metadata: {
    width?: number
    height?: number
    format?: string
    size: number
  }
}

/**
 * Image validation constraints
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
 * Default image validation options
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

/**
 * Sanitize filename to prevent path traversal and malicious names
 *
 * Security measures:
 * - Remove any path components (only basename)
 * - Replace unsafe characters with underscore
 * - Limit filename length
 * - Prevent hidden files (starting with dot)
 *
 * @param filename - Original filename from user
 * @returns Sanitized filename safe for filesystem
 */
export function sanitizeFilename(filename: string): string {
  // Extract basename only (removes any path components like ../../)
  let sanitized = path.basename(filename)

  // Remove or replace unsafe characters
  // Allow only: alphanumeric, dash, underscore, dot
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_')

  // Prevent hidden files
  if (sanitized.startsWith('.')) {
    sanitized = '_' + sanitized
  }

  // Limit length (filesystem limits)
  const maxLength = 255
  if (sanitized.length > maxLength) {
    const ext = path.extname(sanitized)
    const nameWithoutExt = path.basename(sanitized, ext)
    sanitized = nameWithoutExt.substring(0, maxLength - ext.length) + ext
  }

  // Ensure it's not empty after sanitization
  if (!sanitized || sanitized === '') {
    sanitized = 'unnamed_file'
  }

  return sanitized
}

/**
 * Validate image file with comprehensive security checks
 *
 * This function performs multiple layers of validation:
 * 1. Size validation (prevent resource exhaustion)
 * 2. Magic byte validation (prevent MIME spoofing)
 * 3. Extension validation (whitelist only)
 * 4. Image metadata validation (dimensions, format)
 * 5. Filename sanitization (prevent path traversal)
 *
 * @param file - File object from multipart form data
 * @param options - Optional validation constraints
 * @returns Validated file information
 * @throws ValidationError if file fails any validation check
 *
 * @example
 * ```typescript
 * try {
 *   const validated = await validateImageFile(file)
 *   // Safe to use validated.buffer, validated.sanitizedFilename
 * } catch (error) {
 *   // Handle validation error
 * }
 * ```
 */
export async function validateImageFile(
  file: File,
  options: ImageValidationOptions = {}
): Promise<FileValidationResult> {
  const opts = { ...DEFAULT_IMAGE_OPTIONS, ...options }

  // ============================================================================
  // STEP 1: Size validation (prevent resource exhaustion)
  // ============================================================================

  if (file.size === 0) {
    throw new ValidationError('File is empty')
  }

  if (file.size > opts.maxSizeBytes) {
    const maxMB = Math.round(opts.maxSizeBytes / 1024 / 1024)
    throw new ValidationError(`File too large. Maximum size is ${maxMB}MB`, {
      field: 'image',
      maxSize: opts.maxSizeBytes,
      actualSize: file.size,
    })
  }

  // ============================================================================
  // STEP 2: Convert file to buffer for magic byte validation
  // ============================================================================

  let buffer: Buffer
  try {
    buffer = Buffer.from(await file.arrayBuffer())
  } catch (error: unknown) {
    throw new ValidationError('Failed to read file data', {
      field: 'image',
      cause: error instanceof Error ? error : new Error(String(error)),
    })
  }

  // ============================================================================
  // STEP 3: Magic byte validation (CRITICAL SECURITY CHECK)
  // ============================================================================
  // This prevents attackers from uploading PHP/executable files
  // disguised as images by just changing the extension

  let detectedType
  try {
    detectedType = await fileTypeFromBuffer(buffer)
  } catch (error: unknown) {
    throw new ValidationError('Failed to detect file type', {
      field: 'image',
      cause: error instanceof Error ? error : new Error(String(error)),
    })
  }

  if (!detectedType) {
    throw new ValidationError(
      'Could not determine file type. The file may be corrupted or not a valid image',
      {
        field: 'image',
      }
    )
  }

  // Validate MIME type using ACTUAL file content, not client-provided file.type
  if (!opts.allowedMimeTypes.includes(detectedType.mime)) {
    const allowed = opts.allowedMimeTypes.join(', ')
    throw new ValidationError(
      `Invalid image format. Only ${allowed} are allowed. Detected: ${detectedType.mime}`,
      {
        field: 'image',
        allowedTypes: opts.allowedMimeTypes,
        detectedType: detectedType.mime,
      }
    )
  }

  // ============================================================================
  // STEP 4: Extension validation
  // ============================================================================

  const sanitized = sanitizeFilename(file.name)
  const ext = path.extname(sanitized).toLowerCase()

  if (!ext || !opts.allowedExtensions.includes(ext)) {
    const allowed = opts.allowedExtensions.join(', ')
    throw new ValidationError(`Invalid file extension. Only ${allowed} are allowed`, {
      field: 'image',
      allowedExtensions: opts.allowedExtensions,
      providedExtension: ext || 'none',
    })
  }

  // Cross-validate extension matches detected type
  const extensionMimeMap: Record<string, string[]> = {
    '.jpg': ['image/jpeg'],
    '.jpeg': ['image/jpeg'],
    '.png': ['image/png'],
    '.webp': ['image/webp'],
  }

  const expectedMimes = extensionMimeMap[ext]
  if (expectedMimes && !expectedMimes.includes(detectedType.mime)) {
    throw new ValidationError(
      `File extension ${ext} does not match actual file type ${detectedType.mime}. This may indicate a spoofed file.`,
      {
        field: 'image',
        extension: ext,
        detectedMime: detectedType.mime,
        security: 'MIME_EXTENSION_MISMATCH',
      }
    )
  }

  // ============================================================================
  // STEP 5: Image metadata validation (dimensions, format)
  // ============================================================================

  let metadata: sharp.Metadata
  try {
    metadata = await sharp(buffer).metadata()
  } catch (error: unknown) {
    throw new ValidationError('Invalid image file. Unable to read image metadata', {
      field: 'image',
      cause: error instanceof Error ? error : new Error(String(error)),
    })
  }

  // Validate image has dimensions
  if (!metadata.width || !metadata.height) {
    throw new ValidationError('Invalid image file. Missing width or height information', {
      field: 'image',
    })
  }

  // Validate minimum dimensions
  if (metadata.width < opts.minWidth || metadata.height < opts.minHeight) {
    throw new ValidationError(
      `Image too small. Minimum dimensions are ${opts.minWidth}x${opts.minHeight} pixels`,
      {
        field: 'image',
        minWidth: opts.minWidth,
        minHeight: opts.minHeight,
        actualWidth: metadata.width,
        actualHeight: metadata.height,
      }
    )
  }

  // Validate maximum dimensions (prevent decompression bombs)
  if (metadata.width > opts.maxWidth || metadata.height > opts.maxHeight) {
    throw new ValidationError(
      `Image too large. Maximum dimensions are ${opts.maxWidth}x${opts.maxHeight} pixels`,
      {
        field: 'image',
        maxWidth: opts.maxWidth,
        maxHeight: opts.maxHeight,
        actualWidth: metadata.width,
        actualHeight: metadata.height,
      }
    )
  }

  // Additional security: Check for decompression bombs
  // If uncompressed size would be > 100MB, reject
  const uncompressedSize = metadata.width * metadata.height * 4 // RGBA = 4 bytes per pixel
  const maxUncompressedSize = 100 * 1024 * 1024 // 100MB
  if (uncompressedSize > maxUncompressedSize) {
    throw new ValidationError(
      'Image would require too much memory to process. Please use a smaller image.',
      {
        field: 'image',
        security: 'DECOMPRESSION_BOMB_DETECTED',
        dimensions: `${metadata.width}x${metadata.height}`,
      }
    )
  }

  // ============================================================================
  // STEP 6: Return validated file information
  // ============================================================================

  return {
    buffer,
    mimeType: detectedType.mime,
    extension: detectedType.ext,
    sanitizedFilename: sanitized,
    metadata: {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: file.size,
    },
  }
}

/**
 * Validate file extension is allowed
 *
 * @param filename - Filename to check
 * @param allowedExtensions - Array of allowed extensions (with dot)
 * @returns true if valid, false otherwise
 */
export function isValidExtension(filename: string, allowedExtensions: string[]): boolean {
  const ext = path.extname(filename).toLowerCase()
  return allowedExtensions.includes(ext)
}

/**
 * Generate secure random filename while preserving extension
 *
 * @param originalFilename - Original filename
 * @param prefix - Optional prefix for the filename
 * @returns Random filename with original extension
 *
 * @example
 * ```typescript
 * generateSecureFilename('photo.jpg') // => '1234567890abcdef.jpg'
 * generateSecureFilename('photo.jpg', 'avatar') // => 'avatar_1234567890abcdef.jpg'
 * ```
 */
export function generateSecureFilename(originalFilename: string, prefix?: string): string {
  const ext = path.extname(sanitizeFilename(originalFilename))
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)

  if (prefix) {
    return `${prefix}_${timestamp}_${random}${ext}`
  }

  return `${timestamp}_${random}${ext}`
}

/**
 * Log security violation for monitoring
 *
 * @param violation - Type of violation
 * @param details - Additional details
 */
export function logSecurityViolation(violation: string, details: Record<string, any>): void {
  const timestamp = new Date().toISOString()
  console.warn(
    `[FILE_SECURITY_VIOLATION] ${timestamp} - ${violation}`,
    JSON.stringify(details, null, 2)
  )
}
