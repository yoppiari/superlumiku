import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth.middleware'
import { AuthVariables } from '../../types/hono'
import { avatarCreatorService } from './services/avatar-creator.service'
import type {
  CreateProjectRequest,
  UpdateProjectRequest,
  UploadAvatarRequest,
  UpdateAvatarRequest,
  GenerateAvatarRequest,
} from './types'

/**
 * Avatar Creator Routes
 *
 * Phase 2-3: Full implementation
 * - Projects CRUD
 * - Avatar Upload & Management
 * - Avatar AI Generation (FLUX)
 * - Usage tracking
 * - Stats
 */

const app = new Hono<{ Variables: AuthVariables }>()

// ========================================
// Projects Routes
// ========================================

/**
 * GET /api/apps/avatar-creator/projects
 * Get all projects for current user
 */
app.get('/projects', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')

    const projects = await avatarCreatorService.getProjects(userId)

    return c.json({
      projects,
    })
  } catch (error: any) {
    console.error('Error fetching projects:', error)
    return c.json({ error: error.message || 'Failed to fetch projects' }, 500)
  }
})

/**
 * POST /api/apps/avatar-creator/projects
 * Create new project
 */
app.post('/projects', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const body = await c.req.json<CreateProjectRequest>()

    // Validation
    if (!body.name || body.name.trim().length === 0) {
      return c.json({ error: 'Project name is required' }, 400)
    }

    const project = await avatarCreatorService.createProject(userId, body)

    return c.json({
      message: 'Project created successfully',
      project,
    })
  } catch (error: any) {
    console.error('Error creating project:', error)
    return c.json({ error: error.message || 'Failed to create project' }, 500)
  }
})

/**
 * GET /api/apps/avatar-creator/projects/:id
 * Get project by ID with all avatars
 */
app.get('/projects/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('id')

    const project = await avatarCreatorService.getProjectById(projectId, userId)

    return c.json({
      project,
    })
  } catch (error: any) {
    console.error('Error fetching project:', error)
    const statusCode = error.message === 'Project not found' ? 404 : 500
    return c.json({ error: error.message || 'Failed to fetch project' }, statusCode)
  }
})

/**
 * PUT /api/apps/avatar-creator/projects/:id
 * Update project
 */
app.put('/projects/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('id')
    const body = await c.req.json<UpdateProjectRequest>()

    const project = await avatarCreatorService.updateProject(projectId, userId, body)

    return c.json({
      message: 'Project updated successfully',
      project,
    })
  } catch (error: any) {
    console.error('Error updating project:', error)
    const statusCode = error.message === 'Project not found' ? 404 : 500
    return c.json({ error: error.message || 'Failed to update project' }, statusCode)
  }
})

/**
 * DELETE /api/apps/avatar-creator/projects/:id
 * Delete project (and all its avatars)
 */
app.delete('/projects/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('id')

    await avatarCreatorService.deleteProject(projectId, userId)

    return c.json({
      message: 'Project deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting project:', error)
    const statusCode = error.message === 'Project not found' ? 404 : 500
    return c.json({ error: error.message || 'Failed to delete project' }, statusCode)
  }
})

// ========================================
// Avatar Routes - Upload
// ========================================

/**
 * POST /api/apps/avatar-creator/projects/:projectId/avatars/upload
 * Upload avatar image with persona
 */
app.post('/projects/:projectId/avatars/upload', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('projectId')
    const body = await c.req.parseBody()

    // Get uploaded file
    const file = body.image as File
    if (!file) {
      return c.json({ error: 'Image file is required' }, 400)
    }

    // Get form data
    const name = body.name as string
    if (!name || name.trim().length === 0) {
      return c.json({ error: 'Avatar name is required' }, 400)
    }

    // Parse personality array if string
    let personaPersonality: string[] | undefined
    if (body.personaPersonality) {
      try {
        personaPersonality =
          typeof body.personaPersonality === 'string'
            ? JSON.parse(body.personaPersonality)
            : body.personaPersonality
      } catch {
        personaPersonality = undefined
      }
    }

    // Prepare upload data
    const uploadData: UploadAvatarRequest = {
      name,
      // Persona
      personaName: body.personaName as string | undefined,
      personaAge: body.personaAge ? parseInt(body.personaAge as string) : undefined,
      personaPersonality,
      personaBackground: body.personaBackground as string | undefined,
      // Visual attributes
      gender: body.gender as string | undefined,
      ageRange: body.ageRange as string | undefined,
      ethnicity: body.ethnicity as string | undefined,
      bodyType: body.bodyType as string | undefined,
      hairStyle: body.hairStyle as string | undefined,
      hairColor: body.hairColor as string | undefined,
      eyeColor: body.eyeColor as string | undefined,
      skinTone: body.skinTone as string | undefined,
      style: body.style as string | undefined,
    }

    const avatar = await avatarCreatorService.uploadAvatar(projectId, userId, file, uploadData)

    return c.json({
      message: 'Avatar uploaded successfully',
      avatar,
    })
  } catch (error: any) {
    console.error('Error uploading avatar:', error)
    return c.json({ error: error.message || 'Failed to upload avatar' }, 500)
  }
})

// ========================================
// Avatar Routes - AI Generation
// ========================================

/**
 * POST /api/apps/avatar-creator/projects/:projectId/avatars/generate
 * Generate avatar using FLUX AI (text-to-image)
 */
app.post('/projects/:projectId/avatars/generate', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('projectId')
    const body = await c.req.json<GenerateAvatarRequest>()

    // Validation
    if (!body.name || body.name.trim().length === 0) {
      return c.json({ error: 'Avatar name is required' }, 400)
    }

    if (!body.prompt || body.prompt.trim().length === 0) {
      return c.json({ error: 'Prompt is required for generation' }, 400)
    }

    // Start generation (queues job)
    const generation = await avatarCreatorService.generateAvatar(projectId, userId, body)

    return c.json({
      message: 'Avatar generation started',
      generation,
      note: 'Generation is processing in background. Check status using generation ID.',
    })
  } catch (error: any) {
    console.error('Error generating avatar:', error)
    return c.json({ error: error.message || 'Failed to generate avatar' }, 500)
  }
})

/**
 * GET /api/apps/avatar-creator/generations/:id
 * Get generation status and result
 */
app.get('/generations/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const generationId = c.req.param('id')

    const generation = await avatarCreatorService.getGeneration(generationId, userId)

    if (!generation) {
      return c.json({ error: 'Generation not found' }, 404)
    }

    return c.json({
      generation,
    })
  } catch (error: any) {
    console.error('Error fetching generation:', error)
    return c.json({ error: error.message || 'Failed to fetch generation' }, 500)
  }
})

// ========================================
// Avatar Routes - Management
// ========================================

/**
 * GET /api/apps/avatar-creator/avatars/:id
 * Get avatar by ID
 */
app.get('/avatars/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const avatarId = c.req.param('id')

    const avatar = await avatarCreatorService.getAvatar(avatarId, userId)

    return c.json({
      avatar,
    })
  } catch (error: any) {
    console.error('Error fetching avatar:', error)
    const statusCode = error.message === 'Avatar not found' ? 404 : 500
    return c.json({ error: error.message || 'Failed to fetch avatar' }, statusCode)
  }
})

/**
 * PUT /api/apps/avatar-creator/avatars/:id
 * Update avatar metadata (persona, attributes)
 */
app.put('/avatars/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const avatarId = c.req.param('id')
    const body = await c.req.json<UpdateAvatarRequest>()

    const avatar = await avatarCreatorService.updateAvatar(avatarId, userId, body)

    return c.json({
      message: 'Avatar updated successfully',
      avatar,
    })
  } catch (error: any) {
    console.error('Error updating avatar:', error)
    const statusCode = error.message === 'Avatar not found' ? 404 : 500
    return c.json({ error: error.message || 'Failed to update avatar' }, statusCode)
  }
})

/**
 * DELETE /api/apps/avatar-creator/avatars/:id
 * Delete avatar (and its files)
 */
app.delete('/avatars/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const avatarId = c.req.param('id')

    await avatarCreatorService.deleteAvatar(avatarId, userId)

    return c.json({
      message: 'Avatar deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting avatar:', error)
    const statusCode = error.message === 'Avatar not found' ? 404 : 500
    return c.json({ error: error.message || 'Failed to delete avatar' }, statusCode)
  }
})

// ========================================
// Usage Tracking Routes
// ========================================

/**
 * GET /api/apps/avatar-creator/avatars/:id/usage-history
 * Get usage history for avatar
 */
app.get('/avatars/:id/usage-history', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const avatarId = c.req.param('id')

    const result = await avatarCreatorService.getUsageHistory(avatarId, userId)

    return c.json({
      history: result.history,
      summary: result.summary,
    })
  } catch (error: any) {
    console.error('Error fetching usage history:', error)
    const statusCode = error.message === 'Avatar not found' ? 404 : 500
    return c.json({ error: error.message || 'Failed to fetch usage history' }, statusCode)
  }
})

// ========================================
// Preset Routes
// ========================================

/**
 * GET /api/apps/avatar-creator/presets
 * Get all preset avatars (optionally filter by category)
 */
app.get('/presets', async (c) => {
  try {
    const category = c.req.query('category')

    const presets = await avatarCreatorService.getPresets(category)

    return c.json({
      presets,
    })
  } catch (error: any) {
    console.error('Error fetching presets:', error)
    return c.json({ error: error.message || 'Failed to fetch presets' }, 500)
  }
})

/**
 * GET /api/apps/avatar-creator/presets/:id
 * Get preset by ID
 */
app.get('/presets/:id', async (c) => {
  try {
    const presetId = c.req.param('id')

    const preset = await avatarCreatorService.getPresetById(presetId)

    return c.json({
      preset,
    })
  } catch (error: any) {
    console.error('Error fetching preset:', error)
    const statusCode = error.message === 'Preset not found' ? 404 : 500
    return c.json({ error: error.message || 'Failed to fetch preset' }, statusCode)
  }
})

/**
 * POST /api/apps/avatar-creator/projects/:projectId/avatars/from-preset
 * Create avatar from preset (queues AI generation with preset attributes)
 */
app.post('/projects/:projectId/avatars/from-preset', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('projectId')
    const body = await c.req.json<{ presetId: string; customName?: string }>()

    // Validation
    if (!body.presetId) {
      return c.json({ error: 'Preset ID is required' }, 400)
    }

    // Create avatar from preset (queues generation)
    const generation = await avatarCreatorService.createAvatarFromPreset(
      projectId,
      userId,
      body.presetId,
      body.customName
    )

    return c.json({
      message: 'Avatar generation from preset started',
      generation,
      note: 'Generation is processing in background. Check status using generation ID.',
    })
  } catch (error: any) {
    console.error('Error creating avatar from preset:', error)
    return c.json({ error: error.message || 'Failed to create avatar from preset' }, 500)
  }
})

// ========================================
// Stats Routes
// ========================================

/**
 * GET /api/apps/avatar-creator/stats
 * Get user statistics
 */
app.get('/stats', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')

    const stats = await avatarCreatorService.getUserStats(userId)

    return c.json({
      stats,
    })
  } catch (error: any) {
    console.error('Error fetching stats:', error)
    return c.json({ error: error.message || 'Failed to fetch stats' }, 500)
  }
})

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
