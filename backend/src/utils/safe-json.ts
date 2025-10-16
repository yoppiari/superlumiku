import { z, ZodSchema } from 'zod'

/**
 * Safe JSON parsing utilities
 *
 * CRITICAL FIX: All JSON.parse calls in the application should use these
 * utilities to prevent runtime errors from malformed JSON data.
 *
 * This prevents:
 * - Uncaught exceptions from invalid JSON
 * - Type mismatches from unexpected data structures
 * - Security issues from malicious JSON payloads
 */

/**
 * Parse JSON string with error handling
 * Returns parsed value or null on error
 *
 * @param data - JSON string to parse
 * @param defaultValue - Value to return if parsing fails (default: null)
 * @returns Parsed value or default value
 */
export function safeJsonParse<T = unknown>(
  data: string | null | undefined,
  defaultValue: T | null = null
): T | null {
  if (!data || typeof data !== 'string') {
    return defaultValue
  }

  try {
    return JSON.parse(data) as T
  } catch (error) {
    console.error('[SafeJSON] Failed to parse JSON:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      dataPreview: data.substring(0, 100),
    })
    return defaultValue
  }
}

/**
 * Parse JSON string with Zod schema validation
 * Returns parsed and validated value or null on error
 *
 * This is the RECOMMENDED approach for all JSON parsing
 * as it ensures type safety and data integrity
 *
 * @param data - JSON string to parse
 * @param schema - Zod schema to validate against
 * @param defaultValue - Value to return if parsing/validation fails
 * @returns Validated parsed value or default value
 *
 * @example
 * const userSchema = z.object({
 *   name: z.string(),
 *   age: z.number(),
 * })
 *
 * const user = safeJsonParseWithSchema(jsonString, userSchema)
 * if (user) {
 *   // user is type-safe: { name: string, age: number }
 *   console.log(user.name)
 * }
 */
export function safeJsonParseWithSchema<T>(
  data: string | null | undefined,
  schema: ZodSchema<T>,
  defaultValue: T | null = null
): T | null {
  if (!data || typeof data !== 'string') {
    return defaultValue
  }

  try {
    const parsed = JSON.parse(data)
    const validated = schema.parse(parsed)
    return validated
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[SafeJSON] Schema validation failed:', {
        errors: error.errors,
        dataPreview: data.substring(0, 100),
      })
    } else {
      console.error('[SafeJSON] Failed to parse JSON:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        dataPreview: data.substring(0, 100),
      })
    }
    return defaultValue
  }
}

/**
 * Parse JSON string and throw error with context if parsing fails
 * Use this when JSON parsing failure should be a hard error
 *
 * @param data - JSON string to parse
 * @param context - Context for error message (e.g., 'user settings', 'API response')
 * @returns Parsed value
 * @throws Error with context if parsing fails
 */
export function parseJsonOrThrow<T = unknown>(
  data: string,
  context: string = 'JSON data'
): T {
  try {
    return JSON.parse(data) as T
  } catch (error) {
    throw new Error(
      `Failed to parse ${context}: ${error instanceof Error ? error.message : 'Invalid JSON'}`
    )
  }
}

/**
 * Parse JSON string with schema validation and throw error if validation fails
 * Use this when JSON parsing failure should be a hard error
 *
 * @param data - JSON string to parse
 * @param schema - Zod schema to validate against
 * @param context - Context for error message
 * @returns Validated parsed value
 * @throws Error with context if parsing or validation fails
 */
export function parseJsonWithSchemaOrThrow<T>(
  data: string,
  schema: ZodSchema<T>,
  context: string = 'JSON data'
): T {
  try {
    const parsed = JSON.parse(data)
    return schema.parse(parsed)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Failed to validate ${context}: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      )
    }
    throw new Error(
      `Failed to parse ${context}: ${error instanceof Error ? error.message : 'Invalid JSON'}`
    )
  }
}

/**
 * Safely stringify value to JSON
 * Returns JSON string or null on error
 *
 * @param value - Value to stringify
 * @param defaultValue - Value to return if stringification fails (default: null)
 * @returns JSON string or default value
 */
export function safeJsonStringify<T>(
  value: T,
  defaultValue: string | null = null
): string | null {
  try {
    return JSON.stringify(value)
  } catch (error) {
    console.error('[SafeJSON] Failed to stringify value:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      valueType: typeof value,
    })
    return defaultValue
  }
}

/**
 * Parse JSON array with validation
 * Returns array of validated items or empty array on error
 *
 * @param data - JSON string to parse
 * @param itemSchema - Zod schema for array items
 * @returns Array of validated items or empty array
 */
export function safeJsonParseArray<T>(
  data: string | null | undefined,
  itemSchema: ZodSchema<T>
): T[] {
  if (!data || typeof data !== 'string') {
    return []
  }

  try {
    const parsed = JSON.parse(data)
    if (!Array.isArray(parsed)) {
      console.error('[SafeJSON] Expected array but got:', typeof parsed)
      return []
    }

    // Validate each item
    const validated: T[] = []
    for (let i = 0; i < parsed.length; i++) {
      try {
        validated.push(itemSchema.parse(parsed[i]))
      } catch (error) {
        console.error(`[SafeJSON] Item ${i} failed validation:`, {
          error: error instanceof z.ZodError ? error.errors : error,
        })
        // Skip invalid items
      }
    }
    return validated
  } catch (error) {
    console.error('[SafeJSON] Failed to parse array:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      dataPreview: data.substring(0, 100),
    })
    return []
  }
}
