import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth.middleware'
import { deductCredits, recordCreditUsage, getCreditBalance } from '../../core/middleware/credit.middleware'
import { presetRateLimiters } from '../../middleware/rate-limiter.middleware'
import { validateBody, validateQuery, validateFormData } from '../../middleware/validation.middleware'
import { AuthVariables } from '../../types/hono'
import { avatarCreatorService } from './services/avatar-creator.service'
import { avatarCreatorConfig } from './plugin.config'
import * as schemas from './validation/schemas'
import type {
  CreateProjectRequest,
  UpdateProjectRequest,
  UploadAvatarRequest,
  UpdateAvatarRequest,
  GenerateAvatarRequest,
} from './types'
import { asyncHandler, handleError } from '../../core/errors/ErrorHandler'
import {
  ValidationError,
  InsufficientCreditsError,
  NotFoundError,
} from '../../core/errors'
import prisma from '../../db/client'

/**
 * Avatar Creator Routes
 *
 * Phase 2-3: Full implementation
 * - Projects CRUD
 * - Avatar Upload & Management
 * - Avatar AI Generation (FLUX)
 * - Usage tracking
 * - Stats
 *
 * Security Features:
 * - Rate limiting on expensive operations (AI generation, file uploads)
 * - File upload validation with magic byte checking
 * - Path traversal protection
 * - MIME type spoofing prevention
 */

const app = new Hono<{ Variables: AuthVariables }>()

// ========================================
// Debug Middleware - Log All Requests
// ========================================

app.use('*', async (c, next) => {
  const path = c.req.path
  const method = c.req.method

  // Log all requests to avatar-creator to help debug hardcoded IDs
  console.log(`[Avatar Creator] ${method} ${path}`)

  // Check for suspicious patterns
  if (path.includes('_') || path.match(/[a-z0-9]{20,}/)) {
    console.warn(`[Avatar Creator] SUSPICIOUS REQUEST: ${method} ${path}`)
    console.warn(`[Avatar Creator] Headers:`, c.req.header())
    console.warn(`[Avatar Creator] Query:`, c.req.query())
  }

  await next()
})

// ========================================
// Rate Limiter Definitions
// ========================================

/**
 * Rate limiter for avatar generation (FLUX AI)
 * 5 requests per minute per user - prevents excessive API costs
 */
const avatarGenerationLimiter = presetRateLimiters.expensiveAI(
  'rl:avatar-creator:generate',
  'Too many avatar generation requests. Please wait 1 minute before generating more avatars.'
)

/**
 * Rate limiter for file uploads
 * 10 requests per minute per user - prevents abuse and resource exhaustion
 */
const avatarUploadLimiter = presetRateLimiters.fileUpload(
  'rl:avatar-creator:upload',
  'Too many upload requests. Please wait before uploading more images.'
)

/**
 * Rate limiter for preset-based avatar creation
 * 8 requests per minute per user - slightly more restrictive than upload
 */
const presetAvatarLimiter = presetRateLimiters.presetUsage(
  'rl:avatar-creator:preset',
  'Too many preset avatar requests. Please wait before creating more avatars from presets.'
)

/**
 * Rate limiter for project creation
 * 20 requests per hour per user - prevents resource exhaustion
 */
const projectCreationLimiter = presetRateLimiters.resourceCreation(
  'rl:avatar-creator:projects',
  'Too many project creation requests. Please try again later.'
)

// ========================================
// Projects Routes
// ========================================

/**
 * GET /api/apps/avatar-creator/projects
 * Get all projects for current user
 */
app.get('/projects',
  authMiddleware,
  asyncHandler(async (c) => {
    const userId = c.get('userId')
    const projects = await avatarCreatorService.getProjects(userId)

    return c.json({ projects })
  }, 'Get Projects')
)

/**
 * POST /api/apps/avatar-creator/projects
 * Create new project
 *
 * SECURITY:
 * - Rate limited to 20 requests per hour per user
 * - Input validated with Zod schema
 */
app.post('/projects',
  authMiddleware,
  projectCreationLimiter,
  validateBody(schemas.createProjectSchema),
  asyncHandler(async (c) => {
    const userId = c.get('userId')
    const body = c.get('validatedBody') as schemas.CreateProjectInput

    const project = await avatarCreatorService.createProject(userId, body)

    return c.json({
      message: 'Project created successfully',
      project,
    })
  }, 'Create Project')
)

/**
 * GET /api/apps/avatar-creator/projects/:id
 * Get project by ID with all avatars
 */
app.get('/projects/:id',
  authMiddleware,
  asyncHandler(async (c) => {
    const userId = c.get('userId')
    const projectId = c.req.param('id')

    const project = await avatarCreatorService.getProjectById(projectId, userId)

    return c.json({ project })
  }, 'Get Project')
)

/**
 * PUT /api/apps/avatar-creator/projects/:id
 * Update project
 *
 * SECURITY: Input validated with Zod schema
 */
app.put('/projects/:id',
  authMiddleware,
  validateBody(schemas.updateProjectSchema),
  asyncHandler(async (c) => {
    const userId = c.get('userId')
    const projectId = c.req.param('id')
    const body = c.get('validatedBody') as schemas.UpdateProjectInput

    const project = await avatarCreatorService.updateProject(projectId, userId, body)

    return c.json({
      message: 'Project updated successfully',
      project,
    })
  }, 'Update Project')
)

/**
 * DELETE /api/apps/avatar-creator/projects/:id
 * Delete project (and all its avatars)
 */
app.delete('/projects/:id',
  authMiddleware,
  asyncHandler(async (c) => {
    const userId = c.get('userId')
    const projectId = c.req.param('id')

    await avatarCreatorService.deleteProject(projectId, userId)

    return c.json({
      message: 'Project deleted successfully',
    })
  }, 'Delete Project')
)

// ========================================
// Avatar Routes - Upload
// ========================================

/**
 * POST /api/apps/avatar-creator/projects/:projectId/avatars/upload
 * Upload avatar image with persona
 *
 * SECURITY:
 * - Rate limited to 10 requests per minute per user
 * - Input validated with Zod schema
 * - File validation with magic byte checking
 * - Path traversal protection
 * - MIME type spoofing prevention
 *
 * CREDITS:
 * - Costs 2 credits (file storage + thumbnail generation + image processing)
 * - Credits checked and deducted by middleware before processing
 * - Enterprise users with 'enterprise_unlimited' tag bypass credit check
 */
app.post(
  '/projects/:projectId/avatars/upload',
  authMiddleware,
  avatarUploadLimiter,
  deductCredits(avatarCreatorConfig.credits.uploadAvatar, 'upload_avatar', avatarCreatorConfig.appId),
  validateFormData(schemas.uploadAvatarMetadataSchema),
  asyncHandler(async (c) => {
    const userId = c.get('userId')
    const projectId = c.req.param('projectId')
    const body = await c.req.parseBody()

    // Get uploaded file
    const file = body['image'] as File
    if (!file) {
      throw new ValidationError('Image file is required')
    }

    // Get validated form data (already processed by middleware)
    const uploadData = c.get('validatedFormData') as UploadAvatarRequest

    const avatar = await avatarCreatorService.uploadAvatar(projectId, userId, file, uploadData)

    // Record credit usage after successful operation
    const deduction = c.get('creditDeduction')
    const { newBalance, creditUsed } = await recordCreditUsage(
      userId,
      deduction.appId,
      deduction.action,
      deduction.amount,
      { avatarId: avatar.id, projectId }
    )

    return c.json({
      message: 'Avatar uploaded successfully',
      avatar,
      creditUsed,
      creditBalance: newBalance,
    })
  }, 'Upload Avatar')
)

// ========================================
// Avatar Routes - AI Generation
// ========================================

/**
 * POST /api/apps/avatar-creator/projects/:projectId/avatars/generate
 * Generate avatar using FLUX AI (text-to-image)
 *
 * SECURITY:
 * - Rate limited to 5 requests per minute per user (expensive AI operation)
 * - Input validated with Zod schema
 *
 * CREDITS:
 * - Costs 10 credits (expensive FLUX.1-dev API call)
 * - Credits checked by middleware, then manually deducted after successful queuing
 * - Credits refunded by worker if generation fails
 * - Enterprise users with 'enterprise_unlimited' tag bypass credit check
 */
app.post(
  '/projects/:projectId/avatars/generate',
  authMiddleware,
  avatarGenerationLimiter,
  validateBody(schemas.generateAvatarSchema),
  // Check credits first, store in context for manual deduction
  async (c, next) => {
    try {
      const userId = c.get('userId')
      const creditCost = avatarCreatorConfig.credits.generateAvatar

      // Check if user has enterprise unlimited access
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { userTags: true },
      })

      const tags = user?.userTags ? JSON.parse(user.userTags) : []
      const hasEnterpriseUnlimited = tags.includes('enterprise_unlimited')

      if (!hasEnterpriseUnlimited) {
        // Check credit balance for non-enterprise users
        const balance = await getCreditBalance(userId)

        if (balance < creditCost) {
          throw new InsufficientCreditsError(creditCost, balance)
        }
      }

      // Store credit info for later deduction
      c.set('creditDeduction', {
        amount: hasEnterpriseUnlimited ? 0 : creditCost,
        action: 'generate_avatar',
        appId: avatarCreatorConfig.appId,
        isEnterprise: hasEnterpriseUnlimited,
      })

      await next()
    } catch (error) {
      return handleError(c, error, 'Check Credits for Generation')
    }
  },
  asyncHandler(async (c) => {
    const userId = c.get('userId')
    const projectId = c.req.param('projectId')
    const body = c.get('validatedBody') as GenerateAvatarRequest

    // Get credit deduction info from context
    const deduction = c.get('creditDeduction')

    // Start generation (queues job) - pass credit cost for accurate refunds
    const generation = await avatarCreatorService.generateAvatar(
      projectId,
      userId,
      body,
      deduction.amount // Pass actual cost (0 for enterprise, 10 for regular users)
    )

    // Deduct credits after successful queuing (so we don't charge if queuing fails)
    const { newBalance, creditUsed } = await recordCreditUsage(
      userId,
      deduction.appId,
      deduction.action,
      deduction.amount,
      {
        generationId: generation.id,
        projectId,
        prompt: body.prompt,
        type: 'text_to_image',
      }
    )

    return c.json({
      message: 'Avatar generation started',
      generation,
      creditUsed,
      creditBalance: newBalance,
      note: 'Generation is processing in background. Check status using generation ID. Credits will be refunded if generation fails.',
    })
  }, 'Generate Avatar')
)

/**
 * GET /api/apps/avatar-creator/generations/:id
 * Get generation status and result
 */
app.get('/generations/:id',
  authMiddleware,
  asyncHandler(async (c) => {
    const userId = c.get('userId')
    const generationId = c.req.param('id')

    const generation = await avatarCreatorService.getGeneration(generationId, userId)

    return c.json({ generation })
  }, 'Get Generation Status')
)

// ========================================
// Avatar Routes - Management
// ========================================

/**
 * GET /api/apps/avatar-creator/avatars/:id
 * Get avatar by ID
 */
app.get('/avatars/:id',
  authMiddleware,
  asyncHandler(async (c) => {
    const userId = c.get('userId')
    const avatarId = c.req.param('id')

    const avatar = await avatarCreatorService.getAvatar(avatarId, userId)

    return c.json({ avatar })
  }, 'Get Avatar')
)

/**
 * PUT /api/apps/avatar-creator/avatars/:id
 * Update avatar metadata (persona, attributes)
 *
 * SECURITY: Input validated with Zod schema
 */
app.put('/avatars/:id',
  authMiddleware,
  validateBody(schemas.updateAvatarSchema),
  asyncHandler(async (c) => {
    const userId = c.get('userId')
    const avatarId = c.req.param('id')
    const body = c.get('validatedBody') as schemas.UpdateAvatarInput

    const avatar = await avatarCreatorService.updateAvatar(avatarId, userId, body)

    return c.json({
      message: 'Avatar updated successfully',
      avatar,
    })
  }, 'Update Avatar')
)

/**
 * DELETE /api/apps/avatar-creator/avatars/:id
 * Delete avatar (and its files)
 */
app.delete('/avatars/:id',
  authMiddleware,
  asyncHandler(async (c) => {
    const userId = c.get('userId')
    const avatarId = c.req.param('id')

    await avatarCreatorService.deleteAvatar(avatarId, userId)

    return c.json({
      message: 'Avatar deleted successfully',
    })
  }, 'Delete Avatar')
)

// ========================================
// Usage Tracking Routes
// ========================================

/**
 * GET /api/apps/avatar-creator/avatars/:id/usage-history
 * Get usage history for avatar
 */
app.get('/avatars/:id/usage-history',
  authMiddleware,
  asyncHandler(async (c) => {
    const userId = c.get('userId')
    const avatarId = c.req.param('id')

    const result = await avatarCreatorService.getUsageHistory(avatarId, userId)

    return c.json({
      history: result.history,
      summary: result.summary,
    })
  }, 'Get Usage History')
)

// ========================================
// Preset Routes
// ========================================

/**
 * GET /api/apps/avatar-creator/presets
 * Get all preset avatars (optionally filter by category)
 *
 * SECURITY: Query parameters validated with Zod schema
 */
app.get('/presets',
  validateQuery(schemas.queryPresetsSchema),
  asyncHandler(async (c) => {
    const query = c.get('validatedQuery') as schemas.QueryPresetsInput
    const category = query.category

    const presets = await avatarCreatorService.getPresets(category)

    return c.json({ presets })
  }, 'Get Presets')
)

/**
 * GET /api/apps/avatar-creator/presets/:id
 * Get preset by ID
 */
app.get('/presets/:id',
  asyncHandler(async (c) => {
    const presetId = c.req.param('id')

    const preset = await avatarCreatorService.getPresetById(presetId)

    return c.json({ preset })
  }, 'Get Preset')
)

/**
 * POST /api/apps/avatar-creator/projects/:projectId/avatars/from-preset
 * Create avatar from preset (queues AI generation with preset attributes)
 *
 * SECURITY:
 * - Rate limited to 8 requests per minute per user
 * - Input validated with Zod schema
 *
 * CREDITS:
 * - Costs 8 credits (preset generation with optimized prompt)
 * - Credits checked by middleware, then manually deducted after successful queuing
 * - Credits refunded by worker if generation fails
 * - Enterprise users with 'enterprise_unlimited' tag bypass credit check
 */
app.post(
  '/projects/:projectId/avatars/from-preset',
  authMiddleware,
  presetAvatarLimiter,
  validateBody(schemas.createFromPresetSchema),
  // Check credits first, store in context for manual deduction
  async (c, next) => {
    try {
      const userId = c.get('userId')
      const creditCost = avatarCreatorConfig.credits.fromPreset

      // Check if user has enterprise unlimited access
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { userTags: true },
      })

      const tags = user?.userTags ? JSON.parse(user.userTags) : []
      const hasEnterpriseUnlimited = tags.includes('enterprise_unlimited')

      if (!hasEnterpriseUnlimited) {
        // Check credit balance for non-enterprise users
        const balance = await getCreditBalance(userId)

        if (balance < creditCost) {
          throw new InsufficientCreditsError(creditCost, balance)
        }
      }

      // Store credit info for later deduction
      c.set('creditDeduction', {
        amount: hasEnterpriseUnlimited ? 0 : creditCost,
        action: 'from_preset',
        appId: avatarCreatorConfig.appId,
        isEnterprise: hasEnterpriseUnlimited,
      })

      await next()
    } catch (error) {
      return handleError(c, error, 'Check Credits for Preset')
    }
  },
  asyncHandler(async (c) => {
    const userId = c.get('userId')
    const projectId = c.req.param('projectId')
    const body = c.get('validatedBody') as schemas.CreateFromPresetInput

    // Get credit deduction info from context
    const deduction = c.get('creditDeduction')

    // Create avatar from preset (queues generation) - pass credit cost for accurate refunds
    const generation = await avatarCreatorService.createAvatarFromPreset(
      projectId,
      userId,
      body.presetId,
      body.customName,
      deduction.amount // Pass actual cost (0 for enterprise, 8 for regular users)
    )

    // Deduct credits after successful queuing
    const { newBalance, creditUsed } = await recordCreditUsage(
      userId,
      deduction.appId,
      deduction.action,
      deduction.amount,
      {
        generationId: generation.id,
        projectId,
        presetId: body.presetId,
        type: 'from_preset',
      }
    )

    return c.json({
      message: 'Avatar generation from preset started',
      generation,
      creditUsed,
      creditBalance: newBalance,
      note: 'Generation is processing in background. Check status using generation ID. Credits will be refunded if generation fails.',
    })
  }, 'Create Avatar from Preset')
)

// ========================================
// Stats Routes
// ========================================

/**
 * GET /api/apps/avatar-creator/stats
 * Get user statistics including credit balance and costs
 */
app.get('/stats',
  authMiddleware,
  asyncHandler(async (c) => {
    const userId = c.get('userId')

    // Get user stats
    const stats = await avatarCreatorService.getUserStats(userId)

    // Get credit balance
    const creditBalance = await getCreditBalance(userId)

    // Check if user has enterprise unlimited access
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { userTags: true },
    })

    const tags = user?.userTags ? JSON.parse(user.userTags) : []
    const hasEnterpriseUnlimited = tags.includes('enterprise_unlimited')

    return c.json({
      stats,
      creditBalance,
      hasEnterpriseUnlimited,
      costs: {
        generateAvatar: avatarCreatorConfig.credits.generateAvatar,
        uploadAvatar: avatarCreatorConfig.credits.uploadAvatar,
        fromPreset: avatarCreatorConfig.credits.fromPreset,
        fromReference: avatarCreatorConfig.credits.fromReference,
        editPersona: avatarCreatorConfig.credits.editPersona,
      },
    })
  }, 'Get Stats')
)

// ========================================
// Health Check
// ========================================

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    app: 'avatar-creator',
    message: 'Avatar Creator API is running (Phase 2-5 - Full Implementation + Presets)',
    endpoints: {
      projects: 'GET, POST /projects',
      project: 'GET, PUT, DELETE /projects/:id',
      upload: 'POST /projects/:projectId/avatars/upload',
      generate: 'POST /projects/:projectId/avatars/generate',
      fromPreset: 'POST /projects/:projectId/avatars/from-preset',
      generation: 'GET /generations/:id',
      avatar: 'GET, PUT, DELETE /avatars/:id',
      presets: 'GET /presets (optional ?category=)',
      preset: 'GET /presets/:id',
      usage: 'GET /avatars/:id/usage-history',
      stats: 'GET /stats',
    },
  })
})

export default app
