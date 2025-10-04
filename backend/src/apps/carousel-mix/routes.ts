import { Hono } from 'hono'
import type { Context } from 'hono'
import { authMiddleware } from '../../middleware/auth.middleware'
import { deductCredits, recordCreditUsage } from '../../core/middleware/credit.middleware'
import { CarouselService } from './services/carousel.service'
import { CombinationService } from './services/combination.service'
import { carouselMixConfig } from './plugin.config'
import { saveFile, checkStorageQuota, updateUserStorage } from '../../lib/storage'
import { addCarouselMixJob } from '../../lib/queue'
import { generateCarousels } from './workers/carousel-generator.worker'
import { z } from 'zod'

// Type declarations for context variables
type Env = {
  Variables: {
    userId: string
    userEmail: string
    user: any
    generateBody: any
    creditDeduction: any
  }
}

const routes = new Hono<Env>()
const service = new CarouselService()
const combinationService = new CombinationService()

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
})

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  defaultNumSlides: z.number().min(2).max(8).optional(),
})

const createTextSchema = z.object({
  content: z.string().min(1, 'Text content is required'),
  slidePosition: z.number().min(1).max(8),
  order: z.number().min(0),
})

const updateTextSchema = z.object({
  content: z.string().min(1).optional(),
  order: z.number().min(0).optional(),
})

const positionSettingsSchema = z.object({
  fontFamily: z.string().optional(),
  fontSize: z.number().min(8).max(200).optional(),
  fontColor: z.string().optional(),
  fontWeight: z.number().min(300).max(900).optional(),
  backgroundColor: z.string().optional(),
  textPosition: z.string().optional(),
  textAlignment: z.enum(['left', 'center', 'right', 'justify']).optional(),
  positionX: z.number().min(0).max(100).optional(),
  positionY: z.number().min(0).max(100).optional(),
  textShadow: z.string().optional(),
  textOutline: z.string().optional(),
  paddingData: z.string().optional(),
})

const generateCarouselSchema = z.object({
  numSlides: z.number().min(2).max(8),
  numSets: z.number().min(1).max(100),
})

const textVariationSchema = z.object({
  algorithm: z.enum(['random', 'sequential', 'weighted']),
  texts: z.array(z.string()),
  count: z.number().min(1),
})

const estimateGenerationSchema = z.object({
  numSlides: z.number().min(2).max(8),
  numSets: z.number().min(1).max(100),
  textVariation: textVariationSchema.optional(),
})

// ========================================
// PROJECT ENDPOINTS
// ========================================

routes.get('/projects', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projects = await service.getProjects(userId)
    return c.json({ success: true, projects })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.post('/projects', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const body = createProjectSchema.parse(await c.req.json())
    const project = await service.createProject(userId, body)
    return c.json({ success: true, project }, 201)
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.get('/projects/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('id')
    const project = await service.getProjectById(projectId, userId)
    return c.json({ success: true, project })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.put('/projects/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('id')
    const body = updateProjectSchema.parse(await c.req.json())
    const project = await service.updateProject(projectId, userId, body)
    return c.json({ success: true, project })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.delete('/projects/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('id')
    await service.deleteProject(projectId, userId)
    return c.json({ success: true, message: 'Project deleted' })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// ========================================
// SLIDE ENDPOINTS
// ========================================

routes.post('/projects/:projectId/slides/upload', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('projectId')

    // Verify project ownership
    await service.getProjectById(projectId, userId)

    // Get uploaded file
    const body = await c.req.parseBody()
    const file = body.file as File

    if (!file) {
      return c.json({ error: 'No file uploaded' }, 400)
    }

    // Get slidePosition from body (default to 1 for backward compatibility)
    const slidePosition = parseInt(body.slidePosition as string) || 1

    // Validate slidePosition
    if (slidePosition < 1 || slidePosition > 8) {
      return c.json({ error: 'slidePosition must be between 1 and 8' }, 400)
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'video/mp4']
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: 'Invalid file type. Only JPG, PNG, and MP4 are allowed' }, 400)
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return c.json({ error: 'File too large. Maximum size is 50MB' }, 413)
    }

    // Check storage quota
    const quotaCheck = await checkStorageQuota(userId, file.size)
    if (!quotaCheck.allowed) {
      return c.json({ error: 'Storage quota exceeded' }, 413)
    }

    // Save file
    const { filePath, fileName } = await saveFile(file, 'carousel-slides')

    // Update user storage
    await updateUserStorage(userId, file.size)

    // Determine file type
    const fileType = file.type.startsWith('image/') ? 'image' : 'video'

    // Add slide to project
    const slide = await service.addSlide(projectId, userId, {
      fileName,
      filePath,
      fileType,
      fileSize: file.size,
      slidePosition, // NEW: Pass slidePosition from request
    })

    return c.json({
      success: true,
      slide,
      message: 'Slide uploaded successfully',
    }, 201)
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.delete('/slides/:slideId', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const slideId = c.req.param('slideId')

    // TODO: Add proper authorization check
    await service.deleteSlide(slideId, userId)

    return c.json({ success: true, message: 'Slide deleted' })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// ========================================
// TEXT ENDPOINTS
// ========================================

routes.post('/projects/:projectId/texts', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('projectId')
    const rawBody = await c.req.json()

    // DEBUG: Log incoming request
    console.log('=== ADD TEXT REQUEST ===')
    console.log('Project ID:', projectId)
    console.log('User ID:', userId)
    console.log('Request Body:', JSON.stringify(rawBody, null, 2))

    // Validate with Zod
    const body = createTextSchema.parse(rawBody)

    const text = await service.addText(projectId, userId, body)

    console.log('✓ Text added successfully:', text.id)

    return c.json({ success: true, text }, 201)
  } catch (error: any) {
    console.error('=== ADD TEXT ERROR ===')
    console.error('Error type:', error.constructor.name)

    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      console.error('Validation failed:')
      error.errors.forEach((err: any) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
      return c.json({
        error: 'Validation failed',
        details: error.errors
      }, 400)
    }

    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    return c.json({ error: error.message }, 400)
  }
})

routes.put('/texts/:textId', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const textId = c.req.param('textId')
    const body = updateTextSchema.parse(await c.req.json())

    const text = await service.updateText(textId, userId, body)

    return c.json({ success: true, text })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.delete('/texts/:textId', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const textId = c.req.param('textId')

    await service.deleteText(textId, userId)

    return c.json({ success: true, message: 'Text deleted' })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// ========================================
// ESTIMATION & COMBINATION CALCULATION
// ========================================

// New estimation endpoint with text variation support
routes.post('/projects/:projectId/estimate', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('projectId')
    const body = estimateGenerationSchema.parse(await c.req.json())

    const estimate = await service.estimateGeneration(projectId, userId, body)

    return c.json({
      success: true,
      estimate,
    })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// Legacy combinations endpoint (kept for backward compatibility)
routes.get('/projects/:projectId/combinations', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('projectId')

    // Get project with slides and texts
    const project = await service.getProjectById(projectId, userId)

    const numSlides = parseInt(c.req.query('numSlides') || project.slides.length.toString())
    const numSets = parseInt(c.req.query('numSets') || '10')

    if (numSlides < 2 || numSlides > 8) {
      return c.json({ error: 'Number of slides must be between 2 and 8' }, 400)
    }

    // Calculate possible combinations
    const totalCombinations = combinationService.calculateCombinations(
      project.slides.length,
      numSlides,
      project.texts.length
    )

    // Check if feasible
    const feasibility = combinationService.isFeasible(
      project.slides.length,
      numSlides,
      project.texts.length,
      numSets
    )

    // Calculate credits required
    const creditPerSet = await service.calculateCredits(numSlides)
    const totalCredits = creditPerSet * numSets

    return c.json({
      success: true,
      data: {
        totalCombinations,
        requestedSets: numSets,
        feasibility,
        credits: {
          perSet: creditPerSet,
          total: totalCredits,
        },
      },
    })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// ========================================
// GENERATION ENDPOINTS
// ========================================

routes.post(
  '/projects/:projectId/generate',
  authMiddleware,
  async (c, next) => {
    const body = generateCarouselSchema.parse(await c.req.json())
    const creditCost = Math.ceil(body.numSlides / 2) * body.numSets

    // Store body in context for later use
    c.set('generateBody', body)

    // Use deductCredits middleware
    return deductCredits(creditCost, 'generate_carousel', carouselMixConfig.appId)(c, next)
  },
  async (c) => {
    try {
      const userId = c.get('userId')
      const projectId = c.req.param('projectId')
      const body = c.get('generateBody')

      // Create generation record
      const generation = await service.createGeneration(
        projectId,
        userId,
        body.numSlides,
        body.numSets
      )

      // Record credit usage
      const deduction = c.get('creditDeduction')
      const { newBalance, creditUsed } = await recordCreditUsage(
        userId,
        deduction.appId,
        deduction.action,
        deduction.amount,
        { generationId: generation.id, projectId, numSlides: body.numSlides, numSets: body.numSets }
      )

      // Add to background queue for actual generation
      const job = await addCarouselMixJob({
        generationId: generation.id,
        userId,
        projectId,
      })

      // If Redis is not configured, run synchronously (for development)
      if (!job) {
        console.log('🔧 Running carousel generation synchronously (Redis not configured)')
        // Run in background without blocking response
        generateCarousels(generation.id).catch((error) => {
          console.error('Error in background generation:', error)
        })
      }

      return c.json({
        success: true,
        generation,
        creditUsed,
        creditBalance: newBalance,
        message: 'Generation started. Check back soon for results.',
      }, 201)
    } catch (error: any) {
      return c.json({ error: error.message }, 400)
    }
  }
)

routes.get('/projects/:projectId/generations', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('projectId')

    const generations = await service.getGenerations(projectId, userId)

    return c.json({ success: true, generations })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.get('/generations/:generationId', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const generationId = c.req.param('generationId')

    const generation = await service.getGenerationById(generationId, userId)

    return c.json({ success: true, generation })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.get('/generations/:generationId/download', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const generationId = c.req.param('generationId')

    const generation = await service.getGenerationById(generationId, userId)

    if (generation.status !== 'completed') {
      return c.json({ error: 'Generation is not completed yet' }, 400)
    }

    if (!generation.outputPath) {
      return c.json({ error: 'No output file available' }, 404)
    }

    // Construct absolute path to ZIP file
    const filePath = `${process.cwd()}/uploads/${generation.outputPath}`

    // Check if file exists
    const file = Bun.file(filePath)
    const exists = await file.exists()

    if (!exists) {
      console.error(`ZIP file not found: ${filePath}`)
      return c.json({ error: 'Output file not found on server' }, 404)
    }

    // Get filename from path
    const fileName = generation.outputPath.split('/').pop() || 'carousel.zip'

    // Serve the file
    return c.body(file.stream(), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': file.size.toString(),
      },
    })
  } catch (error: any) {
    console.error('Download error:', error)
    return c.json({ error: error.message }, 400)
  }
})

// ========================================
// POSITION SETTINGS ENDPOINTS
// ========================================

routes.get('/projects/:projectId/positions/:position/settings', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('projectId')
    const position = parseInt(c.req.param('position'))

    const positionSettings = await service.getPositionSettings(projectId, userId, position)

    return c.json({ success: true, positionSettings })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.put('/projects/:projectId/positions/:position/settings', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('projectId')
    const position = parseInt(c.req.param('position'))
    const body = positionSettingsSchema.parse(await c.req.json())

    const positionSettings = await service.updatePositionSettings(projectId, userId, position, body)

    return c.json({ success: true, positionSettings })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.get('/projects/:projectId/positions/settings', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('projectId')

    const positionSettings = await service.getAllPositionSettings(projectId, userId)

    return c.json({ success: true, positionSettings })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// ========================================
// STATISTICS
// ========================================

routes.get('/stats', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const stats = await service.getStats(userId)

    return c.json({ success: true, stats })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

export default routes
