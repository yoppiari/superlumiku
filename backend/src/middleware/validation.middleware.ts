/**
 * Validation Middleware
 *
 * Provides Zod schema validation for request bodies and query parameters.
 * Integrates with Lumiku's error handling system.
 *
 * Features:
 * - Type-safe validation using Zod schemas
 * - Clear, user-friendly error messages
 * - Automatic validation error aggregation
 * - Integration with existing error handling
 * - Sets validated data on context for type safety
 *
 * Usage:
 * ```typescript
 * import { validateBody, validateQuery } from '../../middleware/validation.middleware'
 * import { createProjectSchema } from './validation/schemas'
 *
 * app.post('/projects',
 *   authMiddleware,
 *   validateBody(createProjectSchema),
 *   async (c) => {
 *     const body = c.get('validatedBody') // Fully typed and validated!
 *     // ...
 *   }
 * )
 * ```
 */

import { Context, MiddlewareHandler } from 'hono'
import { z, ZodSchema, ZodError } from 'zod'
import { ValidationError } from '../core/errors/errors'

/**
 * Validates request body against a Zod schema
 *
 * @param schema - Zod schema to validate against
 * @returns Hono middleware handler
 *
 * @throws ValidationError - If validation fails with detailed error messages
 *
 * @example
 * ```typescript
 * app.post('/projects', validateBody(createProjectSchema), async (c) => {
 *   const body = c.get('validatedBody')
 *   // body is now typed and validated
 * })
 * ```
 */
export function validateBody<T extends ZodSchema>(schema: T): MiddlewareHandler {
  return async (c: Context, next) => {
    try {
      // Parse request body
      const body = await c.req.json()

      // Validate against schema
      const validated = schema.parse(body)

      // Store validated data on context for route handler
      c.set('validatedBody', validated)

      await next()
    } catch (error) {
      if (error instanceof ZodError) {
        // Transform Zod errors into user-friendly format
        const errorMessages = formatZodErrors(error)

        throw new ValidationError(errorMessages.summary, {
          validationErrors: errorMessages.details,
          fields: errorMessages.fields,
        })
      }

      // Re-throw non-validation errors
      throw error
    }
  }
}

/**
 * Validates query parameters against a Zod schema
 *
 * @param schema - Zod schema to validate against
 * @returns Hono middleware handler
 *
 * @throws ValidationError - If validation fails with detailed error messages
 *
 * @example
 * ```typescript
 * app.get('/presets', validateQuery(queryPresetsSchema), async (c) => {
 *   const query = c.get('validatedQuery')
 *   // query is now typed and validated
 * })
 * ```
 */
export function validateQuery<T extends ZodSchema>(schema: T): MiddlewareHandler {
  return async (c: Context, next) => {
    try {
      // Get query parameters
      const query = c.req.query()

      // Convert string values to appropriate types for validation
      const processedQuery = preprocessQueryParams(query)

      // Validate against schema
      const validated = schema.parse(processedQuery)

      // Store validated data on context for route handler
      c.set('validatedQuery', validated)

      await next()
    } catch (error) {
      if (error instanceof ZodError) {
        // Transform Zod errors into user-friendly format
        const errorMessages = formatZodErrors(error)

        throw new ValidationError(`Query validation failed: ${errorMessages.summary}`, {
          validationErrors: errorMessages.details,
          fields: errorMessages.fields,
        })
      }

      // Re-throw non-validation errors
      throw error
    }
  }
}

/**
 * Validates form data (multipart) against a Zod schema
 *
 * Useful for file upload endpoints that receive both files and metadata.
 * Note: Files must be validated separately in the service layer.
 *
 * @param schema - Zod schema to validate against
 * @returns Hono middleware handler
 *
 * @throws ValidationError - If validation fails with detailed error messages
 *
 * @example
 * ```typescript
 * app.post('/upload', validateFormData(uploadMetadataSchema), async (c) => {
 *   const formData = c.get('validatedFormData')
 *   // formData is now typed and validated (excluding files)
 * })
 * ```
 */
export function validateFormData<T extends ZodSchema>(schema: T): MiddlewareHandler {
  return async (c: Context, next) => {
    try {
      // Parse form data
      const formData = await c.req.parseBody()

      // Extract non-file fields
      const fields: Record<string, any> = {}
      for (const [key, value] of Object.entries(formData)) {
        // Skip File objects - they should be validated separately
        if (value instanceof File) {
          continue
        }

        // Handle JSON strings
        if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
          try {
            fields[key] = JSON.parse(value)
          } catch {
            fields[key] = value
          }
        } else {
          fields[key] = value
        }
      }

      // Convert numeric strings to numbers
      const processedFields = preprocessFormFields(fields)

      // Validate against schema
      const validated = schema.parse(processedFields)

      // Store validated data on context
      c.set('validatedFormData', validated)

      await next()
    } catch (error) {
      if (error instanceof ZodError) {
        // Transform Zod errors into user-friendly format
        const errorMessages = formatZodErrors(error)

        throw new ValidationError(`Form validation failed: ${errorMessages.summary}`, {
          validationErrors: errorMessages.details,
          fields: errorMessages.fields,
        })
      }

      // Re-throw non-validation errors
      throw error
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format Zod validation errors into user-friendly messages
 *
 * @param error - ZodError from failed validation
 * @returns Formatted error information
 */
function formatZodErrors(error: ZodError): {
  summary: string
  details: Record<string, string[]>
  fields: string[]
} {
  const details: Record<string, string[]> = {}
  const fields: string[] = []

  for (const issue of error.errors) {
    const field = issue.path.join('.') || 'root'
    const message = issue.message

    if (!details[field]) {
      details[field] = []
      fields.push(field)
    }

    details[field].push(message)
  }

  // Create summary message
  let summary: string
  if (fields.length === 1) {
    summary = `${fields[0]}: ${details[fields[0]][0]}`
  } else if (fields.length === 2) {
    summary = `Invalid ${fields.join(' and ')}`
  } else {
    summary = `Invalid ${fields.slice(0, 2).join(', ')} and ${fields.length - 2} more field(s)`
  }

  return {
    summary,
    details,
    fields,
  }
}

/**
 * Preprocess query parameters for validation
 *
 * Query parameters are always strings, so we need to convert them
 * to appropriate types for Zod validation.
 *
 * @param query - Raw query parameters
 * @returns Processed query parameters
 */
function preprocessQueryParams(query: Record<string, string>): Record<string, any> {
  const processed: Record<string, any> = {}

  for (const [key, value] of Object.entries(query)) {
    // Skip empty strings
    if (value === '') {
      continue
    }

    // Try to parse as number
    if (/^-?\d+\.?\d*$/.test(value)) {
      const num = Number(value)
      if (!isNaN(num)) {
        processed[key] = num
        continue
      }
    }

    // Try to parse as boolean
    if (value === 'true' || value === 'false') {
      processed[key] = value === 'true'
      continue
    }

    // Keep as string
    processed[key] = value
  }

  return processed
}

/**
 * Preprocess form fields for validation
 *
 * Form data may contain numeric strings that need to be converted
 * to numbers for validation.
 *
 * @param fields - Raw form fields
 * @returns Processed form fields
 */
function preprocessFormFields(fields: Record<string, any>): Record<string, any> {
  const processed: Record<string, any> = {}

  for (const [key, value] of Object.entries(fields)) {
    // Skip non-string values
    if (typeof value !== 'string') {
      processed[key] = value
      continue
    }

    // Skip empty strings
    if (value === '') {
      continue
    }

    // Convert numeric strings to numbers (for age, width, height, etc.)
    if (/^-?\d+\.?\d*$/.test(value)) {
      const num = Number(value)
      if (!isNaN(num)) {
        processed[key] = num
        continue
      }
    }

    // Keep as string
    processed[key] = value
  }

  return processed
}

// ============================================================================
// TYPE AUGMENTATION FOR HONO CONTEXT
// ============================================================================

/**
 * Augment Hono context with validation types
 *
 * This allows TypeScript to know about our validated data fields
 */
declare module 'hono' {
  interface ContextVariableMap {
    validatedBody?: any
    validatedQuery?: any
    validatedFormData?: any
  }
}
