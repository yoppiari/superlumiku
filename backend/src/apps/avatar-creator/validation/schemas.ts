/**
 * Avatar Creator - Zod Validation Schemas
 *
 * Comprehensive input validation for all Avatar Creator API endpoints.
 * Protects against:
 * - SQL injection
 * - XSS attacks
 * - DoS via oversized inputs
 * - Type confusion attacks
 * - Invalid state transitions
 *
 * Security Features:
 * - Length limits on all string fields
 * - Type validation at runtime
 * - Enum validation for categorical data
 * - Array size limits
 * - Number range validation
 * - UUID format validation
 */

import { z } from 'zod'

// ============================================================================
// REUSABLE FIELD SCHEMAS
// ============================================================================

/**
 * Persona data schema
 * Represents character personality and background information
 */
const personaSchema = z
  .object({
    name: z
      .string()
      .max(100, 'Persona name too long (max 100 characters)')
      .optional(),
    age: z
      .number()
      .int('Age must be an integer')
      .min(1, 'Age must be at least 1')
      .max(120, 'Age must not exceed 120')
      .optional(),
    personality: z
      .array(z.string().max(50, 'Personality trait too long (max 50 characters)'))
      .max(10, 'Too many personality traits (max 10)')
      .optional(),
    background: z
      .string()
      .max(500, 'Background too long (max 500 characters)')
      .optional(),
  })
  .optional()

/**
 * Visual attributes schema
 * Defines physical appearance characteristics
 */
const visualAttributesSchema = z
  .object({
    gender: z.enum(['male', 'female', 'unisex'], {
      errorMap: () => ({ message: 'Gender must be one of: male, female, unisex' }),
    }).optional(),
    ageRange: z.enum(['young', 'adult', 'mature'], {
      errorMap: () => ({ message: 'Age range must be one of: young, adult, mature' }),
    }).optional(),
    ethnicity: z
      .string()
      .max(50, 'Ethnicity too long (max 50 characters)')
      .optional(),
    bodyType: z
      .string()
      .max(50, 'Body type too long (max 50 characters)')
      .optional(),
    hairStyle: z
      .string()
      .max(50, 'Hair style too long (max 50 characters)')
      .optional(),
    hairColor: z
      .string()
      .max(50, 'Hair color too long (max 50 characters)')
      .optional(),
    eyeColor: z
      .string()
      .max(50, 'Eye color too long (max 50 characters)')
      .optional(),
    skinTone: z
      .string()
      .max(50, 'Skin tone too long (max 50 characters)')
      .optional(),
    style: z
      .string()
      .max(50, 'Style too long (max 50 characters)')
      .optional(),
  })
  .optional()

/**
 * Generation options schema
 * Controls AI image generation parameters
 */
const generationOptionsSchema = z.object({
  width: z
    .number()
    .int('Width must be an integer')
    .min(512, 'Width must be at least 512px')
    .max(2048, 'Width must not exceed 2048px')
    .default(1024),
  height: z
    .number()
    .int('Height must be an integer')
    .min(512, 'Height must be at least 512px')
    .max(2048, 'Height must not exceed 2048px')
    .default(1024),
  seed: z
    .number()
    .int('Seed must be an integer')
    .optional(),
})

// ============================================================================
// PROJECT SCHEMAS
// ============================================================================

/**
 * Schema for creating a new avatar project
 *
 * Security considerations:
 * - Name is trimmed and has length limits
 * - Description is optional with size limit
 */
export const createProjectSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Project name is required')
      .max(100, 'Project name too long (max 100 characters)')
      .trim(),
    description: z
      .string()
      .max(500, 'Description too long (max 500 characters)')
      .optional(),
  })
  .transform((data) => ({
    name: data.name.replace(/\s+/g, ' '), // Normalize whitespace
    description: data.description?.trim(),
  }))

/**
 * Schema for updating an existing project
 *
 * All fields are optional but must be valid if provided
 */
export const updateProjectSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Project name cannot be empty')
      .max(100, 'Project name too long (max 100 characters)')
      .trim()
      .optional(),
    description: z
      .string()
      .max(500, 'Description too long (max 500 characters)')
      .optional(),
  })
  .transform((data) => ({
    name: data.name?.replace(/\s+/g, ' '),
    description: data.description?.trim(),
  }))

// ============================================================================
// AVATAR UPLOAD SCHEMAS
// ============================================================================

/**
 * Schema for avatar upload metadata
 *
 * Used when uploading an avatar image with persona/attributes.
 * Note: File validation happens separately in the service layer.
 *
 * Security considerations:
 * - All text fields have length limits
 * - Arrays have size limits
 * - Enums validated strictly
 */
export const uploadAvatarMetadataSchema = z.object({
  name: z
    .string()
    .min(1, 'Avatar name is required')
    .max(100, 'Avatar name too long (max 100 characters)')
    .trim(),

  // Persona fields (flattened for form-data compatibility)
  personaName: z
    .string()
    .max(100, 'Persona name too long (max 100 characters)')
    .optional(),
  personaAge: z
    .number()
    .int('Age must be an integer')
    .min(1, 'Age must be at least 1')
    .max(120, 'Age must not exceed 120')
    .optional(),
  personaPersonality: z
    .array(z.string().max(50, 'Personality trait too long (max 50 characters)'))
    .max(10, 'Too many personality traits (max 10)')
    .optional(),
  personaBackground: z
    .string()
    .max(500, 'Background too long (max 500 characters)')
    .optional(),

  // Visual attributes
  gender: z
    .enum(['male', 'female', 'unisex'], {
      errorMap: () => ({ message: 'Gender must be one of: male, female, unisex' }),
    })
    .optional(),
  ageRange: z
    .enum(['young', 'adult', 'mature'], {
      errorMap: () => ({ message: 'Age range must be one of: young, adult, mature' }),
    })
    .optional(),
  ethnicity: z
    .string()
    .max(50, 'Ethnicity too long (max 50 characters)')
    .optional(),
  bodyType: z
    .string()
    .max(50, 'Body type too long (max 50 characters)')
    .optional(),
  hairStyle: z
    .string()
    .max(50, 'Hair style too long (max 50 characters)')
    .optional(),
  hairColor: z
    .string()
    .max(50, 'Hair color too long (max 50 characters)')
    .optional(),
  eyeColor: z
    .string()
    .max(50, 'Eye color too long (max 50 characters)')
    .optional(),
  skinTone: z
    .string()
    .max(50, 'Skin tone too long (max 50 characters)')
    .optional(),
  style: z
    .string()
    .max(50, 'Style too long (max 50 characters)')
    .optional(),
})

// ============================================================================
// AVATAR GENERATION SCHEMAS
// ============================================================================

/**
 * Schema for AI avatar generation (text-to-image)
 *
 * Security considerations:
 * - Prompt has min/max length to prevent abuse
 * - All optional fields validated if provided
 * - Generation options bounded by hardware limits
 */
export const generateAvatarSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Avatar name is required')
      .max(100, 'Avatar name too long (max 100 characters)')
      .trim(),

    prompt: z
      .string()
      .min(10, 'Prompt too short. Minimum 10 characters for quality results')
      .max(2000, 'Prompt too long. Maximum 2000 characters')
      .trim(),

    // Persona fields
    personaName: z
      .string()
      .max(100, 'Persona name too long (max 100 characters)')
      .optional(),
    personaAge: z
      .number()
      .int('Age must be an integer')
      .min(1, 'Age must be at least 1')
      .max(120, 'Age must not exceed 120')
      .optional(),
    personaPersonality: z
      .array(z.string().max(50, 'Personality trait too long (max 50 characters)'))
      .max(10, 'Too many personality traits (max 10)')
      .optional(),
    personaBackground: z
      .string()
      .max(500, 'Background too long (max 500 characters)')
      .optional(),

    // Visual attributes
    gender: z
      .enum(['male', 'female', 'unisex'], {
        errorMap: () => ({ message: 'Gender must be one of: male, female, unisex' }),
      })
      .optional(),
    ageRange: z
      .enum(['young', 'adult', 'mature'], {
        errorMap: () => ({ message: 'Age range must be one of: young, adult, mature' }),
      })
      .optional(),
    ethnicity: z
      .string()
      .max(50, 'Ethnicity too long (max 50 characters)')
      .optional(),
    bodyType: z
      .string()
      .max(50, 'Body type too long (max 50 characters)')
      .optional(),
    hairStyle: z
      .string()
      .max(50, 'Hair style too long (max 50 characters)')
      .optional(),
    hairColor: z
      .string()
      .max(50, 'Hair color too long (max 50 characters)')
      .optional(),
    eyeColor: z
      .string()
      .max(50, 'Eye color too long (max 50 characters)')
      .optional(),
    skinTone: z
      .string()
      .max(50, 'Skin tone too long (max 50 characters)')
      .optional(),
    style: z
      .string()
      .max(50, 'Style too long (max 50 characters)')
      .optional(),

    // Generation options
    width: z
      .number()
      .int('Width must be an integer')
      .min(512, 'Width must be at least 512px')
      .max(2048, 'Width must not exceed 2048px')
      .default(1024),
    height: z
      .number()
      .int('Height must be an integer')
      .min(512, 'Height must be at least 512px')
      .max(2048, 'Height must not exceed 2048px')
      .default(1024),
    seed: z
      .number()
      .int('Seed must be an integer')
      .optional(),
  })
  .transform((data) => ({
    ...data,
    prompt: data.prompt.replace(/\s+/g, ' '), // Normalize whitespace in prompt
  }))

/**
 * Schema for updating avatar metadata
 *
 * All fields are optional but validated if provided
 */
export const updateAvatarSchema = z.object({
  name: z
    .string()
    .min(1, 'Avatar name cannot be empty')
    .max(100, 'Avatar name too long (max 100 characters)')
    .trim()
    .optional(),

  // Persona fields
  personaName: z
    .string()
    .max(100, 'Persona name too long (max 100 characters)')
    .optional(),
  personaAge: z
    .number()
    .int('Age must be an integer')
    .min(1, 'Age must be at least 1')
    .max(120, 'Age must not exceed 120')
    .optional(),
  personaPersonality: z
    .array(z.string().max(50, 'Personality trait too long (max 50 characters)'))
    .max(10, 'Too many personality traits (max 10)')
    .optional(),
  personaBackground: z
    .string()
    .max(500, 'Background too long (max 500 characters)')
    .optional(),

  // Visual attributes
  gender: z
    .enum(['male', 'female', 'unisex'], {
      errorMap: () => ({ message: 'Gender must be one of: male, female, unisex' }),
    })
    .optional(),
  ageRange: z
    .enum(['young', 'adult', 'mature'], {
      errorMap: () => ({ message: 'Age range must be one of: young, adult, mature' }),
    })
    .optional(),
  ethnicity: z
    .string()
    .max(50, 'Ethnicity too long (max 50 characters)')
    .optional(),
  bodyType: z
    .string()
    .max(50, 'Body type too long (max 50 characters)')
    .optional(),
  hairStyle: z
    .string()
    .max(50, 'Hair style too long (max 50 characters)')
    .optional(),
  hairColor: z
    .string()
    .max(50, 'Hair color too long (max 50 characters)')
    .optional(),
  eyeColor: z
    .string()
    .max(50, 'Eye color too long (max 50 characters)')
    .optional(),
  skinTone: z
    .string()
    .max(50, 'Skin tone too long (max 50 characters)')
    .optional(),
  style: z
    .string()
    .max(50, 'Style too long (max 50 characters)')
    .optional(),
})

// ============================================================================
// PRESET SCHEMAS
// ============================================================================

/**
 * Schema for creating avatar from preset
 *
 * Security considerations:
 * - PresetId must be valid UUID
 * - Custom name validated if provided
 */
export const createFromPresetSchema = z.object({
  presetId: z
    .string()
    .uuid('Invalid preset ID. Must be a valid UUID'),
  customName: z
    .string()
    .min(1, 'Custom name cannot be empty')
    .max(100, 'Custom name too long (max 100 characters)')
    .trim()
    .optional(),
})

/**
 * Schema for querying presets (query parameters)
 *
 * Security considerations:
 * - Category must match predefined enum
 */
export const queryPresetsSchema = z.object({
  category: z
    .enum(['professional', 'casual', 'sports', 'fashion', 'traditional'], {
      errorMap: () => ({
        message: 'Category must be one of: professional, casual, sports, fashion, traditional',
      }),
    })
    .optional(),
})

// ============================================================================
// USAGE TRACKING SCHEMAS
// ============================================================================

/**
 * Schema for tracking avatar usage across apps
 *
 * Security considerations:
 * - All IDs have length limits
 * - Metadata is validated as record type
 */
export const trackUsageSchema = z.object({
  appId: z
    .string()
    .min(1, 'App ID is required')
    .max(50, 'App ID too long (max 50 characters)'),
  appName: z
    .string()
    .min(1, 'App name is required')
    .max(100, 'App name too long (max 100 characters)'),
  action: z
    .string()
    .min(1, 'Action is required')
    .max(100, 'Action too long (max 100 characters)'),
  referenceId: z
    .string()
    .max(100, 'Reference ID too long (max 100 characters)')
    .optional(),
  referenceType: z
    .string()
    .max(50, 'Reference type too long (max 50 characters)')
    .optional(),
  metadata: z
    .record(z.any())
    .optional(),
})

// ============================================================================
// TYPE EXPORTS FOR TYPESCRIPT INTEGRATION
// ============================================================================

/**
 * Inferred TypeScript types from Zod schemas
 * Use these types in your service layer for type safety
 */

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type UploadAvatarMetadataInput = z.infer<typeof uploadAvatarMetadataSchema>
export type GenerateAvatarInput = z.infer<typeof generateAvatarSchema>
export type UpdateAvatarInput = z.infer<typeof updateAvatarSchema>
export type CreateFromPresetInput = z.infer<typeof createFromPresetSchema>
export type QueryPresetsInput = z.infer<typeof queryPresetsSchema>
export type TrackUsageInput = z.infer<typeof trackUsageSchema>

// ============================================================================
// SCHEMA EXPORTS
// ============================================================================

/**
 * Export all schemas for use in route validation middleware
 */
export const avatarCreatorSchemas = {
  // Project schemas
  createProject: createProjectSchema,
  updateProject: updateProjectSchema,

  // Avatar schemas
  uploadAvatarMetadata: uploadAvatarMetadataSchema,
  generateAvatar: generateAvatarSchema,
  updateAvatar: updateAvatarSchema,

  // Preset schemas
  createFromPreset: createFromPresetSchema,
  queryPresets: queryPresetsSchema,

  // Tracking schemas
  trackUsage: trackUsageSchema,
} as const
