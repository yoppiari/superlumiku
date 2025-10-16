import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth.middleware'
import { AuthVariables } from '../../types/hono'
import { poseGeneratorConfig } from './plugin.config'
import { asyncHandler } from '../../core/errors/ErrorHandler'
import { poseGeneratorService } from './services/pose-generator.service'
import { validationService } from './services/validation.service'
import {
  requireAdmin,
  validateLimit,
  validateExportFormats,
  isValidExportFormat,
  isValidPeriod,
  calculateDateRange,
  validationError,
  VALID_EXPORT_FORMATS,
  VALID_PERIODS,
} from './utils/validation.helpers'
import type {
  GetLibraryRequest,
  CreateProjectRequest,
  UpdateProjectRequest,
  GenerateRequest,
  ChangeBackgroundRequest,
  CreatePoseRequestRequest,
  PoseLibraryResponse,
  PoseCategoryResponse,
  ProjectListResponse,
  ProjectResponse,
  GenerationResponse,
  GenerationStatusResponse,
  GenerationResultsResponse,
  PoseStatsResponse,
  BackgroundChangeResponse,
  PoseRequestResponse,
} from './types'

/**
 * Pose Generator Routes
 *
 * Phase 1.3: Backend API Foundation (Stub Implementation)
 * - All routes defined with proper structure
 * - Authentication middleware applied
 * - TypeScript types enforced
 * - TODO comments for Phase 1.4 implementation
 *
 * Phase 1.4 will implement:
 * - Database queries (Prisma)
 * - Credit validation and deduction
 * - BullMQ job queueing
 * - WebSocket progress updates
 * - Error handling and validation
 *
 * Security Features:
 * - JWT authentication on all routes
 * - Rate limiting on expensive operations (Phase 1.4)
 * - Input validation with Zod schemas (Phase 1.4)
 * - Credit balance checks before generation
 * - Ownership verification on all resources
 */

const app = new Hono<{ Variables: AuthVariables }>()

// Mount admin routes with middleware protection
import adminRoutes from './routes-admin'
import { adminMiddleware } from '../../middleware/admin.middleware'
import { presetRateLimiters } from '../../middleware/rate-limiter.middleware'

// Apply auth + admin middleware to ALL admin routes at mount point
// This prevents authorization bypass by enforcing checks at route level
app.use('/admin/*', authMiddleware, adminMiddleware)
app.route('/admin', adminRoutes)

// ========================================
// POSE LIBRARY ENDPOINTS
// ========================================

/**
 * GET /api/apps/pose-generator/library
 * Browse pose library with pagination and filters
 *
 * Query Parameters:
 * - category: Filter by category ID or slug
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 24)
 * - search: Search by tags or name
 * - difficulty: beginner | intermediate | advanced
 * - genderSuitability: male | female | unisex
 * - featured: true | false
 *
 * Returns: Paginated list of poses with preview images
 */
app.get(
  '/library',
  authMiddleware,
  asyncHandler(async (c) => {
    const userId = c.get('userId')
    const query = c.req.query() as GetLibraryRequest

    const result = await poseGeneratorService.getPoseLibrary(query)

    return c.json<PoseLibraryResponse>(result)
  }, 'Get Pose Library')
)

/**
 * GET /api/apps/pose-generator/library/:poseId
 * Get single pose details by ID
 *
 * Returns: Full pose details including category and usage stats
 */
app.get(
  '/library/:poseId',
  authMiddleware,
  asyncHandler(async (c) => {
    const userId = c.get('userId')
    const { poseId } = c.req.param()

    const pose = await poseGeneratorService.getPoseById(poseId)

    return c.json({ pose })
  }, 'Get Pose Details')
)

/**
 * GET /api/apps/pose-generator/categories
 * Get all pose categories (hierarchical)
 *
 * Returns: Category tree with pose counts
 */
app.get(
  '/categories',
  authMiddleware,
  asyncHandler(async (c) => {
    const userId = c.get('userId')

    const categories = await poseGeneratorService.getCategories()

    return c.json<PoseCategoryResponse>({
      categories,
      totalCategories: categories.length,
    })
  }, 'Get Categories')
)

// ========================================
// PROJECT ENDPOINTS
// ========================================

/**
 * GET /api/apps/pose-generator/projects
 * List user's projects with pagination
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 * - status: active | archived (optional filter)
 *
 * Returns: Paginated list of projects with generation counts
 */
app.get(
  '/projects',
  authMiddleware,
  asyncHandler(async (c) => {
    const userId = c.get('userId')
    const { page = '1', limit = '10', status } = c.req.query()

    const result = await poseGeneratorService.getProjects(
      userId,
      parseInt(page),
      parseInt(limit),
      status as any
    )

    return c.json<ProjectListResponse>(result)
  }, 'List Projects')
)

/**
 * POST /api/apps/pose-generator/projects
 * Create new project
 *
 * Request Body:
 * - projectName: string (required)
 * - description: string (optional)
 * - avatarImageUrl: string (required)
 * - avatarSource: 'AVATAR_CREATOR' | 'UPLOAD' (required)
 * - avatarId: string (optional, required if avatarSource=AVATAR_CREATOR)
 *
 * Returns: Created project details
 */
app.post(
  '/projects',
  authMiddleware,
  asyncHandler(async (c) => {
    const userId = c.get('userId')
    const body = await c.req.json<CreateProjectRequest>()

    const project = await poseGeneratorService.createProject(userId, body)

    return c.json<ProjectResponse>(
      { project: project as any },
      201
    )
  }, 'Create Project')
)

/**
 * GET /api/apps/pose-generator/projects/:projectId
 * Get project details with generations
 *
 * Returns: Full project details including recent generations
 */
app.get(
  '/projects/:projectId',
  authMiddleware,
  asyncHandler(async (c) => {
    const userId = c.get('userId')
    const { projectId } = c.req.param()

    const project = await poseGeneratorService.getProjectById(projectId, userId)

    return c.json<ProjectResponse>({
      project: project as any,
    })
  }, 'Get Project')
)

/**
 * PUT /api/apps/pose-generator/projects/:projectId
 * Update project details
 *
 * Request Body:
 * - projectName: string (optional)
 * - description: string (optional)
 * - status: 'active' | 'archived' (optional)
 *
 * Returns: Updated project details
 */
app.put(
  '/projects/:projectId',
  authMiddleware,
  asyncHandler(async (c) => {
    const userId = c.get('userId')
    const { projectId } = c.req.param()
    const body = await c.req.json<UpdateProjectRequest>()

    const project = await poseGeneratorService.updateProject(projectId, userId, body)

    return c.json<ProjectResponse>({
      project: project as any,
    })
  }, 'Update Project')
)

/**
 * DELETE /api/apps/pose-generator/projects/:projectId
 * Delete project and all associated data
 *
 * WARNING: This will cascade delete all generations and poses
 *
 * Returns: Success message
 */
app.delete(
  '/projects/:projectId',
  authMiddleware,
  asyncHandler(async (c) => {
    const userId = c.get('userId')
    const { projectId } = c.req.param()

    await poseGeneratorService.deleteProject(projectId, userId)

    return c.json({
      success: true,
      message: 'Project deleted successfully',
    })
  }, 'Delete Project')
)

// ========================================
// GENERATION ENDPOINTS
// ========================================

/**
 * POST /api/apps/pose-generator/generate
 * Start pose generation job (gallery or text mode)
 *
 * Request Body:
 * - projectId: string (required)
 * - generationType: 'GALLERY_REFERENCE' | 'TEXT_DESCRIPTION' (required)
 *
 * Gallery mode:
 * - selectedPoseIds: string[] (required)
 * - batchSize: number (optional, default: 4 variations per pose)
 *
 * Text mode:
 * - textPrompt: string (required)
 * - variationCount: number (optional, default: 4)
 *
 * Options (both modes):
 * - useBackgroundChanger: boolean (optional, default: false)
 * - backgroundMode: 'ai_generate' | 'solid_color' | 'upload'
 * - backgroundPrompt: string (for ai_generate)
 * - backgroundColor: string (for solid_color)
 * - backgroundImageUrl: string (for upload)
 * - outputFormats: string[] (optional, e.g., ['instagram_story', 'tiktok'])
 *
 * Returns: Generation ID and status (202 Accepted)
 *
 * CREDIT SYSTEM:
 * - Costs calculated server-side: poseCount × 30 credits
 * - Background changer: poseCount × 10 additional credits
 * - Credits deducted atomically BEFORE queueing job
 * - Refunded if generation fails
 */
app.post(
  '/generate',
  authMiddleware,
  presetRateLimiters.expensiveAI('rl:pose-gen', 'Pose generation rate limit exceeded. Please wait before generating more poses.'),
  asyncHandler(async (c) => {
    const userId = c.get('userId')
    const body = await c.req.json<GenerateRequest>()

    // Validate request
    validationService.validateGenerateRequest(body)

    // Start generation (handles credit deduction and record creation)
    const generation = await poseGeneratorService.startGeneration(userId, body)

    // Calculate estimated completion time (30 seconds per pose)
    const estimatedTime = generation.totalExpectedPoses * 30

    return c.json<GenerationResponse>(
      {
        generationId: generation.id,
        status: generation.status as any,
        totalPosesExpected: generation.totalExpectedPoses,
        creditCharged: generation.creditCharged,
        estimatedCompletionTime: estimatedTime,
        message: 'Generation queued successfully. Processing will begin shortly.',
      },
      202
    )
  }, 'Start Generation')
)

/**
 * GET /api/apps/pose-generator/generations/:generationId
 * Get generation status and progress
 *
 * Returns: Current generation status with progress details
 */
app.get(
  '/generations/:generationId',
  authMiddleware,
  asyncHandler(async (c) => {
    const userId = c.get('userId')
    const { generationId } = c.req.param()

    const generation = await poseGeneratorService.getGenerationStatus(generationId, userId)

    // Calculate progress
    const percentage = generation.totalExpectedPoses > 0
      ? Math.round((generation.posesCompleted / generation.totalExpectedPoses) * 100)
      : 0

    // Estimate time remaining
    let estimatedTimeRemaining: number | null = null
    if (generation.status === 'processing' && generation.posesCompleted > 0) {
      const posesRemaining = generation.totalExpectedPoses - generation.posesCompleted
      estimatedTimeRemaining = posesRemaining * 30 // 30 seconds per pose estimate
    }

    return c.json<GenerationStatusResponse>({
      generation: generation as any,
      progress: {
        percentage,
        posesCompleted: generation.posesCompleted,
        posesFailed: generation.posesFailed,
        posesTotal: generation.totalExpectedPoses,
        currentStatus: generation.status,
        estimatedTimeRemaining,
      },
    })
  }, 'Get Generation Status')
)

/**
 * GET /api/apps/pose-generator/generations/:generationId/results
 * Get completed generation results
 *
 * Returns: Array of generated poses with download URLs
 */
app.get(
  '/generations/:generationId/results',
  authMiddleware,
  asyncHandler(async (c) => {
    const userId = c.get('userId')
    const { generationId } = c.req.param()

    const result = await poseGeneratorService.getGenerationResults(generationId, userId)

    return c.json<GenerationResultsResponse>(result)
  }, 'Get Generation Results')
)

// ========================================
// BACKGROUND CHANGER ENDPOINT
// ========================================

/**
 * POST /api/apps/pose-generator/poses/:poseId/background
 * Change background on existing pose
 *
 * Request Body:
 * - backgroundMode: 'ai_generate' | 'solid_color' | 'upload' (required)
 * - backgroundPrompt: string (for ai_generate)
 * - backgroundColor: string (for solid_color, hex format)
 * - backgroundImageUrl: string (for upload)
 *
 * CREDIT COST: 10 credits per pose
 *
 * Returns: Updated pose with new background
 */
app.post(
  '/poses/:poseId/background',
  authMiddleware,
  asyncHandler(async (c) => {
    const userId = c.get('userId')
    const { poseId } = c.req.param()
    const body = await c.req.json<ChangeBackgroundRequest>()

    // Step 1: Validate request body
    validationService.validateBackgroundChangeRequest(body)

    // Step 2: Query pose from database
    const prisma = (await import('../../db/client')).default
    const pose = await prisma.generatedPose.findUnique({
      where: { id: poseId },
      include: {
        generation: {
          include: {
            project: true,
          },
        },
      },
    })

    if (!pose) {
      return c.json(
        {
          error: 'Not Found',
          message: `Pose ${poseId} not found`,
        },
        404
      )
    }

    // Step 3: Verify user owns the generation/project
    if (pose.generation.project.userId !== userId) {
      return c.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to modify this pose',
        },
        403
      )
    }

    // Step 4: Check credit balance (10 credits)
    const { creditsService } = await import('../../services/credits.service')
    const creditCheck = await creditsService.checkBalance(userId, 10, 'pose-generator')

    if (!creditCheck.canProceed) {
      return c.json(
        {
          error: 'Insufficient Credits',
          message: `Background change requires 10 credits. Your balance: ${creditCheck.balance}`,
          required: 10,
          balance: creditCheck.balance,
        },
        403
      )
    }

    // Step 5: Deduct credits atomically
    const creditResult = await creditsService.deduct({
      userId,
      amount: 10,
      action: 'change_background',
      appId: 'pose-generator',
      metadata: {
        poseId,
        generationId: pose.generationId,
        backgroundMode: body.backgroundMode,
      },
    })

    // Step 6: Queue background change job (BullMQ)
    const { enqueueBackgroundChange } = await import('./queue/queue.config')

    try {
      const job = await enqueueBackgroundChange({
        poseId,
        userId,
        generationId: pose.generationId,
        backgroundMode: body.backgroundMode,
        backgroundPrompt: body.backgroundPrompt,
        backgroundColor: body.backgroundColor,
        backgroundImageUrl: body.backgroundImageUrl,
        originalImageUrl: pose.outputImageUrl,
        creditCharged: creditResult.creditUsed,
      })

      console.log(`[Background Change] Queued job ${job.id} for pose ${poseId}`)

      // Step 7: Return success response
      return c.json<BackgroundChangeResponse>(
        {
          poseId,
          outputImageUrl: pose.outputImageUrl, // Will be updated when job completes
          creditCharged: creditResult.creditUsed,
          creditBalance: creditResult.newBalance,
        },
        202 // Accepted - processing in background
      )
    } catch (error) {
      // If queueing fails, refund credits
      if (creditResult.creditUsed > 0) {
        await creditsService.refund({
          userId,
          amount: creditResult.creditUsed,
          reason: `Background change job failed to queue for pose ${poseId}`,
          referenceId: poseId,
        })
      }

      console.error('[Background Change] Failed to queue job:', error)

      return c.json(
        {
          error: 'Internal Server Error',
          message: `Failed to queue background change: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
        500
      )
    }
  }, 'Change Background')
)

// ========================================
// STATS ENDPOINT
// ========================================

/**
 * GET /api/apps/pose-generator/stats
 * Get user statistics for dashboard
 *
 * Returns: User's pose generation statistics
 */
app.get(
  '/stats',
  authMiddleware,
  asyncHandler(async (c) => {
    const userId = c.get('userId')

    const stats = await poseGeneratorService.getUserStats(userId)

    return c.json<PoseStatsResponse>(stats)
  }, 'Get Stats')
)

// ========================================
// COMMUNITY FEATURES
// ========================================

/**
 * POST /api/apps/pose-generator/requests
 * Request new pose to be added to library
 *
 * Request Body:
 * - poseName: string (required)
 * - description: string (required)
 * - categoryId: string (optional)
 * - useCase: string (optional)
 * - referenceImageUrl: string (optional)
 *
 * Returns: Created pose request
 */
app.post(
  '/requests',
  authMiddleware,
  asyncHandler(async (c) => {
    const userId = c.get('userId')
    const body = await c.req.json<CreatePoseRequestRequest>()

    // Create pose request using service
    const { poseRequestService } = await import('./services/pose-request.service')

    const request = await poseRequestService.createPoseRequest(userId, body)

    return c.json<PoseRequestResponse>(
      {
        request: request as any,
        message: 'Pose request submitted successfully. Our team will review it soon!',
      },
      201
    )
  }, 'Create Pose Request')
)

/**
 * GET /api/apps/pose-generator/requests
 * Get user's pose requests
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 * - status: pending | approved | in_progress | completed | rejected
 *
 * Returns: Paginated list of pose requests
 */
app.get(
  '/requests',
  authMiddleware,
  asyncHandler(async (c) => {
    const userId = c.get('userId')
    const { page = '1', limit = '10', status } = c.req.query()

    // Get user's pose requests using service
    const { poseRequestService } = await import('./services/pose-request.service')

    const result = await poseRequestService.getUserPoseRequests(
      userId,
      {
        page: parseInt(page),
        limit: parseInt(limit),
      },
      status ? { status: status as any } : undefined
    )

    return c.json({
      requests: result.requests,
      pagination: result.pagination,
    })
  }, 'List Pose Requests')
)

// ========================================
// EXPORT ENDPOINTS (Phase 4D)
// ========================================

/**
 * GET /api/apps/pose-generator/generations/:id/export-zip
 * Download all exports as ZIP file
 *
 * Query Parameters:
 * - formats: Comma-separated list of formats (optional, defaults to all generated formats)
 *   Example: ?formats=instagram_post,instagram_story,shopee_product
 *
 * Returns: ZIP file download
 */
app.get(
  '/generations/:id/export-zip',
  authMiddleware,
  asyncHandler(async (c) => {
    const userId = c.get('userId')
    const { id: generationId } = c.req.param()

    const prisma = (await import('../../db/client')).default

    // Get generation with poses
    const generation = await prisma.poseGeneration.findUnique({
      where: { id: generationId },
      include: {
        project: true,
        poses: {
          where: { status: 'completed' },
        },
      },
    })

    if (!generation) {
      return c.json(
        {
          error: 'Not Found',
          message: `Generation ${generationId} not found`,
        },
        404
      )
    }

    // Verify ownership
    if (generation.project.userId !== userId) {
      return c.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to access this generation',
        },
        403
      )
    }

    // Get requested formats (default to all if not specified)
    const formatQuery = c.req.query('formats')
    let formats: string[]

    if (formatQuery) {
      const requestedFormats = formatQuery.split(',').map((f) => f.trim())

      // Validate each format
      const validFormats = requestedFormats.filter(isValidExportFormat)

      if (validFormats.length === 0) {
        return c.json(
          validationError('Invalid export formats', VALID_EXPORT_FORMATS),
          400
        )
      }

      formats = validFormats
    } else {
      // Get all unique formats from completed poses
      const allFormats = new Set<string>()
      for (const pose of generation.poses) {
        if (pose.exportFormats && typeof pose.exportFormats === 'object') {
          Object.keys(pose.exportFormats).forEach((format) => allFormats.add(format))
        }
      }
      formats = Array.from(allFormats)

      // If no exports exist, default to common formats
      if (formats.length === 0) {
        formats = ['instagram_post', 'instagram_story', 'tiktok', 'shopee_product']
      }
    }

    console.log(`[Export ZIP] Creating ZIP for ${generation.poses.length} poses, ${formats.length} formats`)

    try {
      // Create ZIP archive
      const { exportService } = await import('./services/export.service')
      const zipBuffer = await exportService.createExportZip({
        generationId,
        poseIds: generation.poses.map((p) => p.id),
        formats,
      })

      // Return ZIP file
      return new Response(zipBuffer, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="poses-${generationId}.zip"`,
          'Content-Length': zipBuffer.length.toString(),
        },
      })
    } catch (error) {
      console.error(`[Export ZIP] Failed to create ZIP:`, error)

      return c.json(
        {
          error: 'Internal Server Error',
          message: `Failed to create ZIP archive: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
        500
      )
    }
  }, 'Export ZIP Download')
)

/**
 * POST /api/apps/pose-generator/poses/:id/regenerate-export
 * Re-generate exports for a specific format
 *
 * Request Body:
 * - format: string (required) - Format name to regenerate
 *
 * Returns: Updated pose with new export URL
 */
app.post(
  '/poses/:id/regenerate-export',
  authMiddleware,
  asyncHandler(async (c) => {
    const userId = c.get('userId')
    const { id: poseId } = c.req.param()
    const { format } = await c.req.json()

    // Validate format parameter
    if (!format || typeof format !== 'string') {
      return c.json(
        {
          error: 'Bad Request',
          message: 'format is required and must be a string',
        },
        400
      )
    }

    // Validate format is a valid export format
    if (!isValidExportFormat(format)) {
      return c.json(
        validationError('Invalid format name', VALID_EXPORT_FORMATS),
        400
      )
    }

    const prisma = (await import('../../db/client')).default

    // Get pose with generation
    const pose = await prisma.generatedPose.findUnique({
      where: { id: poseId },
      include: {
        generation: {
          include: { project: true },
        },
      },
    })

    if (!pose) {
      return c.json(
        {
          error: 'Not Found',
          message: `Pose ${poseId} not found`,
        },
        404
      )
    }

    // Verify ownership
    if (pose.generation.project.userId !== userId) {
      return c.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to access this pose',
        },
        403
      )
    }

    try {
      // Re-generate export
      const { exportService } = await import('./services/export.service')
      const exportUrl = await exportService.regenerateExport({
        sourceImagePath: pose.outputImageUrl,
        generationId: pose.generationId,
        poseId: pose.id,
        formatName: format,
      })

      // Update database
      const currentExports = (pose.exportFormats as Record<string, string>) || {}
      const updatedExports = { ...currentExports, [format]: exportUrl }

      await prisma.generatedPose.update({
        where: { id: poseId },
        data: { exportFormats: updatedExports },
      })

      return c.json({
        success: true,
        exportUrl,
        format,
      })
    } catch (error) {
      console.error(`[Regenerate Export] Failed:`, error)

      return c.json(
        {
          error: 'Internal Server Error',
          message: `Failed to regenerate export: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
        500
      )
    }
  }, 'Regenerate Export')
)

// ========================================
// RECOVERY ENDPOINTS (ADMIN ONLY)
// ========================================

/**
 * GET /api/apps/pose-generator/recovery/status
 * Get recovery status and stats (admin only)
 *
 * Returns:
 * - Stalled generations count
 * - Queued generations count
 * - Processing generations count
 */
app.get(
  '/recovery/status',
  authMiddleware,
  asyncHandler(async (c) => {
    // Check admin authorization (efficient - uses context)
    const user = c.get('user')
    if (!user || user.role !== 'ADMIN') {
      return c.json(
        {
          error: 'Forbidden',
          message: 'Recovery status is only accessible to admin users',
        },
        403
      )
    }

    const prisma = (await import('../../db/client')).default

    // Get stats
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
    const stalledCount = await prisma.poseGeneration.count({
      where: {
        status: 'processing',
        startedAt: { lt: thirtyMinutesAgo },
      },
    })

    const queuedCount = await prisma.poseGeneration.count({
      where: { status: 'queued' },
    })

    const processingCount = await prisma.poseGeneration.count({
      where: { status: 'processing' },
    })

    return c.json({
      stalledGenerations: stalledCount,
      queuedGenerations: queuedCount,
      processingGenerations: processingCount,
      lastRecoveryRun: new Date().toISOString(), // TODO: Track this properly
    })
  }, 'Get Recovery Status')
)

/**
 * POST /api/apps/pose-generator/recovery/trigger
 * Manually trigger recovery (admin only)
 *
 * Returns:
 * - Number of jobs recovered
 * - Number of jobs that failed to recover
 */
app.post(
  '/recovery/trigger',
  authMiddleware,
  asyncHandler(async (c) => {
    // Check admin authorization (efficient - uses context)
    const user = c.get('user')
    if (!user || user.role !== 'ADMIN') {
      return c.json(
        {
          error: 'Forbidden',
          message: 'Recovery trigger is only accessible to admin users',
        },
        403
      )
    }

    // Trigger recovery
    const { jobRecoveryService } = await import('./services/recovery.service')
    const result = await jobRecoveryService.recoverStalledJobs()

    return c.json({
      success: true,
      recovered: result.recovered,
      failed: result.failed,
    })
  }, 'Trigger Recovery')
)

// ========================================
// MONITORING ENDPOINTS (Phase 4F)
// ========================================

/**
 * GET /api/apps/pose-generator/metrics
 * Get system metrics (admin only)
 *
 * Query Parameters:
 * - period: 1h | 24h | 7d | 30d (default: 24h)
 *
 * Returns: Comprehensive system metrics including generation stats, performance, queue status
 */
app.get(
  '/metrics',
  authMiddleware,
  asyncHandler(async (c) => {
    // Check admin authorization (efficient - uses context)
    const user = c.get('user')
    if (!user || user.role !== 'ADMIN') {
      return c.json(
        {
          error: 'Forbidden',
          message: 'Metrics are only accessible to admin users',
        },
        403
      )
    }

    // Get and validate period parameter
    const periodQuery = c.req.query('period')
    const startDateQuery = c.req.query('startDate')
    const endDateQuery = c.req.query('endDate')

    let startDate: Date | undefined
    let endDate: Date | undefined

    if (periodQuery) {
      // Validate period value
      if (!isValidPeriod(periodQuery)) {
        return c.json(
          validationError('Invalid period', VALID_PERIODS),
          400
        )
      }

      // Calculate date range from period
      const dateRange = calculateDateRange(periodQuery)
      startDate = dateRange.start
      endDate = dateRange.end
    } else if (startDateQuery || endDateQuery) {
      // Custom date range
      startDate = startDateQuery ? new Date(startDateQuery) : undefined
      endDate = endDateQuery ? new Date(endDateQuery) : undefined

      // Validate dates
      if (startDate && isNaN(startDate.getTime())) {
        return c.json(
          validationError('Invalid startDate format'),
          400
        )
      }
      if (endDate && isNaN(endDate.getTime())) {
        return c.json(
          validationError('Invalid endDate format'),
          400
        )
      }
    }

    const { metricsService } = await import('./services/metrics.service')
    const metrics = await metricsService.getSystemMetrics({
      startDate,
      endDate,
    })

    return c.json(metrics)
  }, 'Get System Metrics')
)

/**
 * GET /api/apps/pose-generator/metrics/top-users
 * Get top users by generation count (admin only)
 *
 * Query Parameters:
 * - limit: Number of users to return (default: 10)
 *
 * Returns: Top users with generation stats
 */
app.get(
  '/metrics/top-users',
  authMiddleware,
  asyncHandler(async (c) => {
    // Check admin authorization (efficient - uses context)
    const user = c.get('user')
    if (!user || user.role !== 'ADMIN') {
      return c.json(
        {
          error: 'Forbidden',
          message: 'User metrics are only accessible to admin users',
        },
        403
      )
    }

    // Validate and sanitize limit parameter
    const limitQuery = c.req.query('limit')
    const limit = validateLimit(limitQuery, 10, 100)

    const { metricsService } = await import('./services/metrics.service')
    const topUsers = await metricsService.getTopUsers(limit)

    return c.json({ users: topUsers })
  }, 'Get Top Users')
)

/**
 * GET /api/apps/pose-generator/metrics/popular-poses
 * Get most popular poses from library
 *
 * Query Parameters:
 * - limit: Number of poses to return (default: 20)
 *
 * Returns: Popular poses with usage counts
 */
app.get(
  '/metrics/popular-poses',
  authMiddleware,
  asyncHandler(async (c) => {
    // Check admin authorization (efficient - uses context)
    const user = c.get('user')
    if (!user || user.role !== 'ADMIN') {
      return c.json(
        {
          error: 'Forbidden',
          message: 'Pose metrics are only accessible to admin users',
        },
        403
      )
    }

    // Validate and sanitize limit parameter
    const limitQuery = c.req.query('limit')
    const limit = validateLimit(limitQuery, 20, 100)

    const { metricsService } = await import('./services/metrics.service')
    const popularPoses = await metricsService.getPopularPoses(limit)

    return c.json({ poses: popularPoses })
  }, 'Get Popular Poses')
)

/**
 * GET /api/apps/pose-generator/metrics/errors
 * Get error analysis (admin only)
 *
 * Returns: Error types with counts and last occurrence
 */
app.get(
  '/metrics/errors',
  authMiddleware,
  asyncHandler(async (c) => {
    // Check admin authorization (efficient - uses context)
    const user = c.get('user')
    if (!user || user.role !== 'ADMIN') {
      return c.json(
        {
          error: 'Forbidden',
          message: 'Error metrics are only accessible to admin users',
        },
        403
      )
    }

    const { metricsService } = await import('./services/metrics.service')
    const errors = await metricsService.getErrorAnalysis()

    return c.json({ errors })
  }, 'Get Error Analysis')
)

// ========================================
// HEALTH CHECK
// ========================================

/**
 * GET /api/apps/pose-generator/health
 * Comprehensive health check endpoint for monitoring
 *
 * Checks:
 * - Database connectivity (Prisma)
 * - Redis connectivity (for queue and pub/sub)
 * - BullMQ queue health and job statistics
 * - Overall service status
 *
 * Returns:
 * - 200: All systems healthy
 * - 503: One or more systems unhealthy
 */
app.get('/health', asyncHandler(async (c) => {
  const healthStatus: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    timestamp: string
    app: string
    version: string
    checks: {
      database: { status: string; message?: string }
      redis: { status: string; message?: string }
      queue: {
        status: string
        counts?: {
          waiting: number
          active: number
          completed: number
          failed: number
          delayed: number
        }
        message?: string
      }
      controlNet: { status: string; cacheDir?: string; message?: string }
    }
    phase: string
  } = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    app: 'pose-generator',
    version: poseGeneratorConfig.version,
    checks: {
      database: { status: 'unknown' },
      redis: { status: 'unknown' },
      queue: { status: 'unknown' },
      controlNet: { status: 'unknown' },
    },
    phase: 'Production Ready',
  }

  let hasError = false

  // Check 1: Database Connection
  try {
    const prisma = (await import('../../db/client')).default
    await prisma.$queryRaw`SELECT 1 as test`
    healthStatus.checks.database = {
      status: 'connected',
    }
  } catch (error: any) {
    hasError = true
    healthStatus.checks.database = {
      status: 'disconnected',
      message: error.message || 'Database connection failed',
    }
  }

  // Check 2: Redis Connection
  try {
    const { redis, isRedisEnabled } = await import('../../lib/redis')

    if (!isRedisEnabled()) {
      healthStatus.checks.redis = {
        status: 'disabled',
        message: 'Redis not configured (in-memory mode)',
      }
    } else {
      await redis?.ping()
      healthStatus.checks.redis = {
        status: 'connected',
      }
    }
  } catch (error: any) {
    hasError = true
    healthStatus.checks.redis = {
      status: 'disconnected',
      message: error.message || 'Redis connection failed',
    }
  }

  // Check 3: BullMQ Queue Health
  try {
    const { poseGenerationQueue } = await import('./queue/queue.config')

    const counts = await poseGenerationQueue.getJobCounts(
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed'
    )

    healthStatus.checks.queue = {
      status: 'operational',
      counts: {
        waiting: counts.waiting,
        active: counts.active,
        completed: counts.completed,
        failed: counts.failed,
        delayed: counts.delayed,
      },
    }

    // Flag as degraded if too many failed jobs
    if (counts.failed > 100) {
      healthStatus.status = 'degraded'
      healthStatus.checks.queue.message = 'High number of failed jobs detected'
    }
  } catch (error: any) {
    hasError = true
    healthStatus.checks.queue = {
      status: 'error',
      message: error.message || 'Queue health check failed',
    }
  }

  // Check 4: ControlNet Service
  try {
    const fs = await import('fs')
    const cacheDir = '/app/backend/uploads/controlnet-cache'
    const cacheExists = fs.existsSync(cacheDir)

    healthStatus.checks.controlNet = {
      status: cacheExists ? 'available' : 'cache_not_initialized',
      cacheDir,
      message: cacheExists
        ? 'ControlNet map caching ready'
        : 'Cache directory will be created on first use',
    }
  } catch (error: any) {
    // ControlNet is not critical, so don't mark as error
    healthStatus.checks.controlNet = {
      status: 'warning',
      message: error.message || 'ControlNet check failed',
    }
  }

  // Overall health status
  if (hasError) {
    healthStatus.status = 'unhealthy'
  } else if (healthStatus.status !== 'degraded') {
    healthStatus.status = 'healthy'
  }

  const statusCode = healthStatus.status === 'healthy' ? 200 : 503

  return c.json(healthStatus, statusCode)
}, 'Health Check'))

export default app
