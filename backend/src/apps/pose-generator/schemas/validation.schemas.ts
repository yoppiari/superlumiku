/**
 * P1-3 FIX: Zod Validation Schemas
 *
 * Comprehensive input validation for all Pose Generator endpoints
 *
 * Benefits:
 * - Type-safe validation with automatic TypeScript inference
 * - User-friendly error messages
 * - Protection against invalid/malicious input
 * - Centralized validation logic
 */

import { z } from 'zod'

// ========================================
// HELPER SCHEMAS
// ========================================

const cuidSchema = z.string().cuid('Invalid ID format')

const avatarSourceSchema = z.enum(['AVATAR_CREATOR', 'UPLOAD'], {
  errorMap: () => ({ message: 'Avatar source must be AVATAR_CREATOR or UPLOAD' }),
})

const generationTypeSchema = z.enum(['GALLERY_REFERENCE', 'TEXT_DESCRIPTION'], {
  errorMap: () => ({ message: 'Generation type must be GALLERY_REFERENCE or TEXT_DESCRIPTION' }),
})

const backgroundModeSchema = z.enum(['ai_generate', 'solid_color', 'upload'], {
  errorMap: () => ({ message: 'Background mode must be ai_generate, solid_color, or upload' }),
})

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex code (e.g., #FF5733)')

// ========================================
// PROJECT SCHEMAS
// ========================================

export const CreateProjectSchema = z.object({
  projectName: z
    .string()
    .min(3, 'Project name must be at least 3 characters')
    .max(100, 'Project name must not exceed 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .trim()
    .optional(),
  avatarImageUrl: z.string().url('Avatar image URL must be valid'),
  avatarSource: avatarSourceSchema,
  avatarId: cuidSchema.optional(),
}).refine(
  (data) => {
    // If avatar source is AVATAR_CREATOR, avatarId is required
    if (data.avatarSource === 'AVATAR_CREATOR') {
      return !!data.avatarId
    }
    return true
  },
  {
    message: 'avatarId is required when avatarSource is AVATAR_CREATOR',
    path: ['avatarId'],
  }
)

export const UpdateProjectSchema = z.object({
  projectName: z
    .string()
    .min(3, 'Project name must be at least 3 characters')
    .max(100, 'Project name must not exceed 100 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .trim()
    .nullable()
    .optional(),
  status: z.enum(['active', 'archived']).optional(),
})

// ========================================
// GENERATION SCHEMAS
// ========================================

export const GenerateRequestSchema = z
  .object({
    projectId: cuidSchema,
    generationType: generationTypeSchema,

    // Gallery mode fields
    selectedPoseIds: z
      .array(cuidSchema)
      .min(1, 'At least 1 pose must be selected')
      .max(50, 'Maximum 50 poses allowed per generation')
      .optional(),
    batchSize: z
      .number()
      .int('Batch size must be an integer')
      .min(1, 'Batch size must be at least 1')
      .max(6, 'Batch size must not exceed 6')
      .default(4),

    // Text mode fields
    textPrompt: z
      .string()
      .min(10, 'Text prompt must be at least 10 characters')
      .max(500, 'Text prompt must not exceed 500 characters')
      .trim()
      .optional(),
    variationCount: z
      .number()
      .int('Variation count must be an integer')
      .min(1, 'At least 1 variation required')
      .max(10, 'Maximum 10 variations allowed')
      .optional(),

    // Background changer options
    useBackgroundChanger: z.boolean().default(false),
    backgroundMode: backgroundModeSchema.optional(),
    backgroundPrompt: z
      .string()
      .min(10, 'Background prompt must be at least 10 characters')
      .max(500, 'Background prompt must not exceed 500 characters')
      .trim()
      .optional(),
    backgroundColor: hexColorSchema.optional(),
    backgroundImageUrl: z.string().url('Background image URL must be valid').optional(),

    // Output options
    outputFormats: z
      .array(
        z.enum([
          'instagram_post',
          'instagram_story',
          'tiktok',
          'shopee_product',
          'tokopedia_product',
          'facebook_post',
        ])
      )
      .optional(),

    // Avatar context
    avatarId: cuidSchema.optional(),
  })
  .refine(
    (data) => {
      // Gallery mode validation
      if (data.generationType === 'GALLERY_REFERENCE') {
        return data.selectedPoseIds && data.selectedPoseIds.length > 0
      }
      // Text mode validation
      if (data.generationType === 'TEXT_DESCRIPTION') {
        return data.textPrompt && data.textPrompt.length >= 10
      }
      return false
    },
    {
      message:
        'Gallery mode requires selectedPoseIds, Text mode requires textPrompt (min 10 characters)',
      path: ['generationType'],
    }
  )
  .refine(
    (data) => {
      // Background mode validation
      if (data.useBackgroundChanger && data.backgroundMode) {
        if (data.backgroundMode === 'ai_generate' && !data.backgroundPrompt) {
          return false
        }
        if (data.backgroundMode === 'solid_color' && !data.backgroundColor) {
          return false
        }
        if (data.backgroundMode === 'upload' && !data.backgroundImageUrl) {
          return false
        }
      }
      return true
    },
    (data) => {
      const messages = {
        ai_generate: 'backgroundPrompt is required for ai_generate mode',
        solid_color: 'backgroundColor is required for solid_color mode',
        upload: 'backgroundImageUrl is required for upload mode',
      }
      return {
        message: data.backgroundMode ? messages[data.backgroundMode] : 'Invalid background mode',
        path: ['backgroundMode'],
      }
    }
  )

export const BackgroundChangeSchema = z
  .object({
    backgroundMode: backgroundModeSchema,
    backgroundPrompt: z
      .string()
      .min(10, 'Background prompt must be at least 10 characters')
      .max(500, 'Background prompt must not exceed 500 characters')
      .trim()
      .optional(),
    backgroundColor: hexColorSchema.optional(),
    backgroundImageUrl: z.string().url('Background image URL must be valid').optional(),
  })
  .refine(
    (data) => {
      if (data.backgroundMode === 'ai_generate' && !data.backgroundPrompt) {
        return false
      }
      if (data.backgroundMode === 'solid_color' && !data.backgroundColor) {
        return false
      }
      if (data.backgroundMode === 'upload' && !data.backgroundImageUrl) {
        return false
      }
      return true
    },
    (data) => {
      const messages = {
        ai_generate: 'backgroundPrompt is required for ai_generate mode',
        solid_color: 'backgroundColor is required for solid_color mode',
        upload: 'backgroundImageUrl is required for upload mode',
      }
      return {
        message: messages[data.backgroundMode],
        path: ['backgroundMode'],
      }
    }
  )

// ========================================
// LIBRARY & QUERY SCHEMAS
// ========================================

export const GetLibraryQuerySchema = z.object({
  category: z.string().optional(),
  page: z.string().regex(/^\d+$/, 'Page must be a number').optional(),
  limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
  search: z.string().max(100, 'Search query must not exceed 100 characters').optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  genderSuitability: z.enum(['male', 'female', 'unisex']).optional(),
  featured: z.enum(['true', 'false']).optional(),
})

export const PaginationQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, 'Page must be a number').optional(),
  limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
  status: z.enum(['active', 'archived']).optional(),
})

// ========================================
// POSE REQUEST SCHEMAS
// ========================================

export const CreatePoseRequestSchema = z.object({
  poseName: z
    .string()
    .min(3, 'Pose name must be at least 3 characters')
    .max(100, 'Pose name must not exceed 100 characters')
    .trim(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must not exceed 1000 characters')
    .trim(),
  categoryId: cuidSchema.optional(),
  useCase: z
    .string()
    .max(200, 'Use case must not exceed 200 characters')
    .trim()
    .optional(),
  referenceImageUrl: z.string().url('Reference image URL must be valid').optional(),
})

// ========================================
// EXPORT FORMAT SCHEMAS
// ========================================

export const RegenerateExportSchema = z.object({
  format: z.enum([
    'instagram_post',
    'instagram_story',
    'tiktok',
    'shopee_product',
    'tokopedia_product',
    'facebook_post',
  ]),
})

export const ExportZipQuerySchema = z.object({
  formats: z
    .string()
    .refine(
      (val) => {
        const formats = val.split(',').map((f) => f.trim())
        return formats.every((f) =>
          [
            'instagram_post',
            'instagram_story',
            'tiktok',
            'shopee_product',
            'tokopedia_product',
            'facebook_post',
          ].includes(f)
        )
      },
      {
        message: 'Invalid format in list',
      }
    )
    .optional(),
})

// ========================================
// HELPER FUNCTION: Validate and throw
// ========================================

export function validateWithZod<T>(schema: z.Schema<T>, data: unknown): T {
  const result = schema.safeParse(data)

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }))

    throw new ValidationError(
      `Validation failed: ${errors.map((e) => `${e.field}: ${e.message}`).join(', ')}`,
      errors[0]?.field,
      'VALIDATION_ERROR'
    )
  }

  return result.data
}

// Custom error class
class ValidationError extends Error {
  public field?: string
  public code?: string

  constructor(message: string, field?: string, code?: string) {
    super(message)
    this.name = 'ValidationError'
    this.field = field
    this.code = code
  }
}
