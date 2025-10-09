import { Hono } from 'hono'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/auth.middleware'
import { posterEditorService } from './services/poster-editor.service'
import { uploadPoster, deletePoster, getPoster } from './controllers/upload.controller'
import { detectText, updateDetectedText } from './controllers/text-detection.controller'
import { enhancePoster, getEnhancementModels } from './controllers/enhance.controller'
import { resizePoster, batchExport, getExportFormats, getExports } from './controllers/export.controller'
import { startInpaint, checkInpaintStatus, saveInpaintResult } from './controllers/inpaint.controller'
import { startBatchInpaint, getBatchStatus, cleanupBatch } from './controllers/inpaint-batch.controller'

type Env = {
  Variables: {
    userId: string
    userEmail: string
    user: any
  }
}

const routes = new Hono<Env>()

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().optional(),
})

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
})

// ========================================
// PROJECT ENDPOINTS
// ========================================

routes.get('/projects', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projects = await posterEditorService.getProjects(userId)
    return c.json({ success: true, projects })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.get('/projects/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('id')
    const project = await posterEditorService.getProjectById(projectId, userId)

    if (!project) {
      return c.json({ error: 'Project not found' }, 404)
    }

    return c.json({ success: true, project })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.post('/projects', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const body = createProjectSchema.parse(await c.req.json())

    const project = await posterEditorService.createProject(userId, body.name, body.description)
    return c.json({ success: true, project }, 201)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return c.json({ error: 'Validation error', details: error.errors }, 400)
    }
    return c.json({ error: error.message }, 400)
  }
})

routes.put('/projects/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('id')
    const body = updateProjectSchema.parse(await c.req.json())

    await posterEditorService.updateProject(projectId, userId, body)
    return c.json({ success: true })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return c.json({ error: 'Validation error', details: error.errors }, 400)
    }
    return c.json({ error: error.message }, 400)
  }
})

routes.delete('/projects/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('id')

    await posterEditorService.deleteProject(projectId, userId)
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// ========================================
// POSTER ENDPOINTS
// ========================================

routes.get('/projects/:id/posters', authMiddleware, async (c) => {
  try {
    const projectId = c.req.param('id')
    const posters = await posterEditorService.getPosters(projectId)
    return c.json({ success: true, posters })
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
    const stats = await posterEditorService.getUserStats(userId)
    return c.json({ success: true, stats })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// Health check
routes.get('/health', (c) => {
  return c.json({ success: true, message: 'Poster Editor is available' })
})

// ========================================
// UPLOAD ENDPOINTS
// ========================================

routes.post('/upload', authMiddleware, uploadPoster)
routes.get('/posters/:id', authMiddleware, getPoster)
routes.delete('/posters/:id', authMiddleware, deletePoster)

// ========================================
// TEXT DETECTION ENDPOINTS
// ========================================

routes.post('/detect-text', authMiddleware, detectText)
routes.put('/posters/:id/detected-text', authMiddleware, updateDetectedText)

// ========================================
// ENHANCEMENT ENDPOINTS
// ========================================

routes.post('/enhance', authMiddleware, enhancePoster)
routes.get('/enhance/models', getEnhancementModels)

// ========================================
// EXPORT ENDPOINTS
// ========================================

routes.post('/resize', authMiddleware, resizePoster)
routes.post('/batch-export', authMiddleware, batchExport)
routes.get('/formats', getExportFormats)
routes.get('/posters/:id/exports', authMiddleware, getExports)

// ========================================
// AI INPAINTING ENDPOINTS
// ========================================

// Single inpaint (brush mode)
routes.post('/inpaint', authMiddleware, startInpaint)
routes.get('/inpaint/:jobId/status', authMiddleware, checkInpaintStatus)
routes.post('/inpaint/:jobId/save', authMiddleware, saveInpaintResult)

// Batch inpaint (annotate mode)
routes.post('/inpaint-batch', authMiddleware, startBatchInpaint)
routes.get('/inpaint-batch/:batchId/status', authMiddleware, getBatchStatus)
routes.post('/inpaint-batch/:batchId/cleanup', authMiddleware, cleanupBatch)

export default routes

// Legacy export for compatibility
export async function registerPosterEditorRoutes(app: any) {
  console.warn('registerPosterEditorRoutes is deprecated. Use default export instead.')
}
