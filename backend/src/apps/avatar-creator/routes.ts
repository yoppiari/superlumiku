import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth.middleware'
import { avatarService } from './services/avatar.service'
import { avatarAIService } from './services/avatar-ai.service'
import { avatarProjectService } from './services/avatar-project.service'
import { avatarCreatorConfig } from './plugin.config'
import { z } from 'zod'
import path from 'path'
import fs from 'fs/promises'
import { existsSync } from 'fs'

const routes = new Hono()

// ========================================
// VALIDATION SCHEMAS
// ========================================

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
})

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
})

const createAvatarSchema = z.object({
  name: z.string().min(1).max(100),
  gender: z.enum(['male', 'female', 'unisex']).optional(),
  ageRange: z.enum(['young', 'adult', 'mature']).optional(),
  style: z.enum(['casual', 'formal', 'sporty']).optional(),
  ethnicity: z.string().optional(),
})

const updateAvatarSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  gender: z.enum(['male', 'female', 'unisex']).optional(),
  ageRange: z.enum(['young', 'adult', 'mature']).optional(),
  style: z.enum(['casual', 'formal', 'sporty']).optional(),
  ethnicity: z.string().optional(),
})

const generateAvatarSchema = z.object({
  prompt: z.string().min(10).max(500),
  name: z.string().min(1).max(100),
  gender: z.enum(['male', 'female', 'unisex']).optional(),
  ageRange: z.enum(['young', 'adult', 'mature']).optional(),
  style: z.enum(['casual', 'formal', 'sporty', 'professional', 'traditional']).optional(),
  ethnicity: z.string().optional(),
  bodyType: z.enum(['half_body', 'full_body']).optional(),
  count: z.number().min(1).max(5).optional(),
})

const generatePreviewSchema = z.object({
  prompt: z.string().min(10).max(500),
  gender: z.enum(['male', 'female', 'unisex']).optional(),
  ageRange: z.enum(['young', 'adult', 'mature']).optional(),
  style: z.enum(['casual', 'formal', 'sporty', 'professional', 'traditional']).optional(),
  ethnicity: z.string().optional(),
  bodyType: z.enum(['half_body', 'full_body']).optional(),
})

const savePreviewSchema = z.object({
  name: z.string().min(1).max(100),
  imageBase64: z.string().min(100), // Base64 encoded image
  thumbnailBase64: z.string().min(100), // Base64 encoded thumbnail
  gender: z.enum(['male', 'female', 'unisex']).optional(),
  ageRange: z.enum(['young', 'adult', 'mature']).optional(),
  style: z.enum(['casual', 'formal', 'sporty', 'professional', 'traditional']).optional(),
  ethnicity: z.string().optional(),
  bodyType: z.enum(['half_body', 'full_body']).optional(),
  generationPrompt: z.string(), // The enhanced prompt that was used
})

// ========================================
// PROJECT ROUTES
// ========================================

// GET ALL PROJECTS
routes.get('/projects', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projects = await avatarProjectService.getUserProjects(userId)

    return c.json({
      success: true,
      projects,
    })
  } catch (error: any) {
    console.error('Error fetching projects:', error)
    return c.json({ error: error.message }, 400)
  }
})

// CREATE PROJECT
routes.post('/projects', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const body = await c.req.json()

    const validated = createProjectSchema.parse(body)

    const project = await avatarProjectService.createProject(userId, validated)

    return c.json({
      success: true,
      project,
      message: 'Project created successfully',
    }, 201)
  } catch (error: any) {
    console.error('Error creating project:', error)
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.errors }, 400)
    }
    return c.json({ error: error.message }, 400)
  }
})

// GET PROJECT BY ID
routes.get('/projects/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('id')

    const project = await avatarProjectService.getProject(projectId, userId)

    if (!project) {
      return c.json({ error: 'Project not found' }, 404)
    }

    return c.json({
      success: true,
      project,
    })
  } catch (error: any) {
    console.error('Error fetching project:', error)
    return c.json({ error: error.message }, 400)
  }
})

// UPDATE PROJECT
routes.put('/projects/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('id')
    const body = await c.req.json()

    const validated = updateProjectSchema.parse(body)

    const project = await avatarProjectService.updateProject(projectId, userId, validated)

    return c.json({
      success: true,
      project,
      message: 'Project updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating project:', error)
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.errors }, 400)
    }
    return c.json({ error: error.message }, 400)
  }
})

// DELETE PROJECT
routes.delete('/projects/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('id')

    await avatarProjectService.deleteProject(projectId, userId)

    return c.json({
      success: true,
      message: 'Project deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting project:', error)
    return c.json({ error: error.message }, 400)
  }
})

// GET PROJECT STATS
routes.get('/projects/:id/stats', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('id')

    const stats = await avatarService.getProjectStats(projectId, userId)

    return c.json({
      success: true,
      stats,
    })
  } catch (error: any) {
    console.error('Error fetching project stats:', error)
    return c.json({ error: error.message }, 400)
  }
})

// ========================================
// AVATAR ROUTES (PROJECT-SCOPED)
// ========================================

// UPLOAD AVATAR TO PROJECT
routes.post('/projects/:projectId/avatars', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('projectId')

    // Get form data
    const formData = await c.req.formData()
    const imageFile = formData.get('image') as File | null
    const name = formData.get('name') as string
    // Convert empty strings to undefined for optional enum fields
    const genderRaw = formData.get('gender') as string | null
    const ageRangeRaw = formData.get('ageRange') as string | null
    const styleRaw = formData.get('style') as string | null
    const ethnicityRaw = formData.get('ethnicity') as string | null

    const gender = genderRaw && genderRaw.trim() !== '' ? genderRaw : undefined
    const ageRange = ageRangeRaw && ageRangeRaw.trim() !== '' ? ageRangeRaw : undefined
    const style = styleRaw && styleRaw.trim() !== '' ? styleRaw : undefined
    const ethnicity = ethnicityRaw && ethnicityRaw.trim() !== '' ? ethnicityRaw : undefined

    if (!imageFile) {
      return c.json({ error: 'Image file is required' }, 400)
    }

    if (!name) {
      return c.json({ error: 'Avatar name is required' }, 400)
    }

    // Validate data
    const validated = createAvatarSchema.parse({
      name,
      gender,
      ageRange,
      style,
      ethnicity,
    })

    // Save uploaded file
    const uploadsDir = path.join(process.cwd(), 'uploads', 'avatar-creator', userId)
    if (!existsSync(uploadsDir)) {
      await fs.mkdir(uploadsDir, { recursive: true })
    }

    const fileExtension = path.extname(imageFile.name)
    const filename = `avatar_${Date.now()}${fileExtension}`
    const filepath = path.join(uploadsDir, filename)

    // Write file
    const arrayBuffer = await imageFile.arrayBuffer()
    await fs.writeFile(filepath, Buffer.from(arrayBuffer))

    // Store relative path
    const relativePath = `/uploads/avatar-creator/${userId}/${filename}`

    // Create avatar in database
    const avatar = await avatarService.createAvatar(userId, projectId, validated, relativePath)

    return c.json({
      success: true,
      avatar,
      message: 'Avatar created successfully',
    }, 201)
  } catch (error: any) {
    console.error('Error creating avatar:', error)
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.errors }, 400)
    }
    return c.json({ error: error.message }, 400)
  }
})

// GENERATE AI AVATAR IN PROJECT
routes.post('/projects/:projectId/avatars/generate', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('projectId')
    const body = await c.req.json()

    // Validate
    const validated = generateAvatarSchema.parse(body)

    console.log('Generating AI avatar for user:', userId, 'project:', projectId)

    // Generate avatar(s)
    if (validated.count && validated.count > 1) {
      // Generate multiple variations
      const avatars = await avatarAIService.generateVariations({
        userId,
        projectId,
        basePrompt: validated.prompt,
        name: validated.name,
        count: validated.count,
        gender: validated.gender,
        ageRange: validated.ageRange,
        style: validated.style,
      })

      return c.json({
        success: true,
        avatars,
        message: `Generated ${avatars.length} avatar variations`,
      }, 201)
    } else {
      // Generate single avatar
      const avatar = await avatarAIService.generateFromText({
        userId,
        projectId,
        prompt: validated.prompt,
        name: validated.name,
        gender: validated.gender,
        ageRange: validated.ageRange,
        style: validated.style,
        ethnicity: validated.ethnicity,
      })

      return c.json({
        success: true,
        avatar,
        message: 'Avatar generated successfully',
      }, 201)
    }
  } catch (error: any) {
    console.error('Error generating avatar:', error)
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.errors }, 400)
    }
    return c.json({ error: error.message }, 500)
  }
})

// GENERATE AVATAR PREVIEW (NEW - TWO-PHASE FLOW)
routes.post('/projects/:projectId/avatars/generate-preview', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('projectId')
    const body = await c.req.json()

    // Validate
    const validated = generatePreviewSchema.parse(body)

    console.log('Generating avatar preview for user:', userId, 'project:', projectId)

    // Generate preview (no DB save, no credit deduction yet)
    const preview = await avatarAIService.generatePreview({
      prompt: validated.prompt,
      gender: validated.gender,
      ageRange: validated.ageRange,
      style: validated.style,
      ethnicity: validated.ethnicity,
      bodyType: validated.bodyType,
    })

    return c.json({
      success: true,
      preview,
      message: 'Preview generated successfully. Review and save if you like it.',
    }, 200)
  } catch (error: any) {
    console.error('Error generating preview:', error)
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.errors }, 400)
    }
    return c.json({ error: error.message }, 500)
  }
})

// SAVE AVATAR PREVIEW (NEW - TWO-PHASE FLOW)
routes.post('/projects/:projectId/avatars/save-preview', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('projectId')
    const body = await c.req.json()

    // Validate
    const validated = savePreviewSchema.parse(body)

    console.log('Saving avatar preview for user:', userId, 'project:', projectId)

    // TODO: Check user credits here before saving
    // TODO: Deduct credits after successful save

    // Save preview to DB and storage
    const avatar = await avatarAIService.savePreview({
      userId,
      projectId,
      name: validated.name,
      imageBase64: validated.imageBase64,
      thumbnailBase64: validated.thumbnailBase64,
      gender: validated.gender,
      ageRange: validated.ageRange,
      style: validated.style,
      ethnicity: validated.ethnicity,
      bodyType: validated.bodyType,
      generationPrompt: validated.generationPrompt,
    })

    return c.json({
      success: true,
      avatar,
      message: 'Avatar saved successfully',
    }, 201)
  } catch (error: any) {
    console.error('Error saving preview:', error)
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.errors }, 400)
    }
    return c.json({ error: error.message }, 500)
  }
})

// ========================================
// AVATAR ROUTES (INDIVIDUAL - Keep for backward compatibility)
// ========================================

// GET AVATAR BY ID
routes.get('/avatars/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const id = c.req.param('id')

    const avatar = await avatarService.getAvatar(id, userId)

    if (!avatar) {
      return c.json({ error: 'Avatar not found' }, 404)
    }

    return c.json({
      success: true,
      avatar,
    })
  } catch (error: any) {
    console.error('Error fetching avatar:', error)
    return c.json({ error: error.message }, 400)
  }
})

// UPDATE AVATAR
routes.put('/avatars/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const id = c.req.param('id')
    const body = await c.req.json()

    const validated = updateAvatarSchema.parse(body)

    const avatar = await avatarService.updateAvatar(id, userId, validated)

    return c.json({
      success: true,
      avatar,
      message: 'Avatar updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating avatar:', error)
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.errors }, 400)
    }
    return c.json({ error: error.message }, 400)
  }
})

// DELETE AVATAR
routes.delete('/avatars/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const id = c.req.param('id')

    await avatarService.deleteAvatar(id, userId)

    return c.json({
      success: true,
      message: 'Avatar deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting avatar:', error)
    return c.json({ error: error.message }, 400)
  }
})

// GET AVATAR USAGE HISTORY
routes.get('/avatars/:id/usage-history', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const avatarId = c.req.param('id')

    const history = await avatarService.getAvatarUsageHistory(avatarId, userId)
    const summary = await avatarService.getAvatarUsageSummary(avatarId, userId)

    return c.json({
      success: true,
      history,
      summary,
    })
  } catch (error: any) {
    console.error('Error fetching avatar usage history:', error)
    return c.json({ error: error.message }, 400)
  }
})

// ========================================
// LEGACY ROUTES (Deprecated - kept for backward compatibility)
// ========================================

// GET ALL AVATARS (all projects)
routes.get('/avatars', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const avatars = await avatarService.getUserAvatars(userId)

    return c.json({
      success: true,
      avatars,
    })
  } catch (error: any) {
    console.error('Error fetching avatars:', error)
    return c.json({ error: error.message }, 400)
  }
})

// GET STATS (all projects)
routes.get('/stats', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const stats = await avatarService.getStats(userId)

    return c.json({
      success: true,
      stats,
    })
  } catch (error: any) {
    console.error('Error fetching stats:', error)
    return c.json({ error: error.message }, 400)
  }
})

export default routes
