import { Context } from 'hono'
import prisma from '../../../db/client'
import { modelsLabInpaintService } from '../services/modelslab-inpaint.service'
import fs from 'fs/promises'
import path from 'path'
import Sharp from 'sharp'

const INPAINT_COST = 400 // credits

/**
 * Start AI inpainting job
 * POST /api/apps/poster-editor/inpaint
 */
export async function startInpaint(c: Context) {
  try {
    const userId = c.get('userId')
    const body = await c.req.json()
    const { posterId, prompt, maskDataUrl } = body

    if (!posterId || !prompt || !maskDataUrl) {
      return c.json({
        success: false,
        error: 'Missing required fields: posterId, prompt, maskDataUrl'
      }, 400)
    }

    // Verify ownership and get poster
    const poster = await prisma.posterEdit.findFirst({
      where: { id: posterId, userId }
    })

    if (!poster) {
      return c.json({ success: false, error: 'Poster not found' }, 404)
    }

    // Check credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true }
    })

    if (!user || user.creditBalance < INPAINT_COST) {
      return c.json({
        success: false,
        error: `Insufficient credits. Required: ${INPAINT_COST}, Available: ${user?.creditBalance || 0}`
      }, 400)
    }

    // Extract base64 from data URL
    const base64Data = maskDataUrl.replace(/^data:image\/\w+;base64,/, '')
    const maskBuffer = Buffer.from(base64Data, 'base64')

    // Save mask temporarily
    const tempMaskPath = path.join(process.cwd(), 'uploads', 'poster-editor', 'temp', `mask-${Date.now()}.png`)
    await fs.mkdir(path.dirname(tempMaskPath), { recursive: true })
    await fs.writeFile(tempMaskPath, maskBuffer)

    // Get original image path
    const originalImagePath = path.join(process.cwd(), poster.originalUrl)

    // Get image dimensions
    const metadata = await Sharp(originalImagePath).metadata()
    const width = metadata.width || 1024
    const height = metadata.height || 1024

    // Start inpaint job with ModelsLab
    const jobId = await modelsLabInpaintService.startInpaint({
      prompt,
      initImagePath: originalImagePath,
      maskImageBase64: maskDataUrl,
      width,
      height
    })

    // Deduct credits immediately
    await prisma.user.update({
      where: { id: userId },
      data: { creditBalance: { decrement: INPAINT_COST } }
    })

    // Clean up temp mask
    try {
      await fs.unlink(tempMaskPath)
    } catch (err) {
      console.warn('Failed to delete temp mask:', err)
    }

    console.log(`✅ Inpaint job ${jobId} started for poster ${posterId}`)

    return c.json({
      success: true,
      jobId,
      creditsUsed: INPAINT_COST,
      message: 'Inpainting job started'
    })

  } catch (error: any) {
    console.error('Inpaint start error:', error)
    return c.json({
      success: false,
      error: error.message || 'Failed to start inpainting'
    }, 500)
  }
}

/**
 * Check inpainting job status
 * GET /api/apps/poster-editor/inpaint/:jobId/status
 */
export async function checkInpaintStatus(c: Context) {
  try {
    const userId = c.get('userId')
    const jobId = c.req.param('jobId')

    if (!jobId) {
      return c.json({ success: false, error: 'Job ID is required' }, 400)
    }

    // Check job status from ModelsLab
    const job = await modelsLabInpaintService.checkStatus(jobId)

    // If completed, download and save the result
    if (job.status === 'completed' && job.output && job.output.length > 0) {
      const outputUrl = job.output[0]

      // Extract posterId from job (we need to store this somewhere)
      // For now, we'll return the URL and let the frontend handle it
      // In production, associate jobId with posterId in database

      return c.json({
        success: true,
        status: 'completed',
        outputUrl,
        message: 'Inpainting completed successfully'
      })
    }

    if (job.status === 'failed') {
      return c.json({
        success: true,
        status: 'failed',
        error: job.error || 'Inpainting failed'
      })
    }

    // Still processing
    return c.json({
      success: true,
      status: 'processing',
      eta: job.eta,
      message: 'Inpainting in progress'
    })

  } catch (error: any) {
    console.error('Status check error:', error)
    return c.json({
      success: false,
      error: error.message || 'Failed to check status'
    }, 500)
  }
}

/**
 * Download and save inpainted result
 * POST /api/apps/poster-editor/inpaint/:jobId/save
 */
export async function saveInpaintResult(c: Context) {
  try {
    const userId = c.get('userId')
    const jobId = c.req.param('jobId')
    const body = await c.req.json()
    const { posterId, outputUrl } = body

    if (!posterId || !outputUrl) {
      return c.json({
        success: false,
        error: 'Missing required fields: posterId, outputUrl'
      }, 400)
    }

    // Verify ownership
    const poster = await prisma.posterEdit.findFirst({
      where: { id: posterId, userId }
    })

    if (!poster) {
      return c.json({ success: false, error: 'Poster not found' }, 404)
    }

    // Download inpainted image
    const inpaintedDir = path.join(process.cwd(), 'uploads', 'poster-editor', 'inpainted')
    await fs.mkdir(inpaintedDir, { recursive: true })

    const filename = `inpainted-${Date.now()}-${path.basename(poster.originalUrl)}`
    const inpaintedPath = path.join(inpaintedDir, filename)

    await modelsLabInpaintService.downloadImage(outputUrl, inpaintedPath)

    // Update poster with inpainted URL
    const relativePath = `/uploads/poster-editor/inpainted/${filename}`

    const updatedPoster = await prisma.posterEdit.update({
      where: { id: posterId },
      data: {
        editedUrl: relativePath,
        status: 'edited'
      },
      include: { exports: true }
    })

    console.log(`✅ Inpaint result saved for poster ${posterId}`)

    return c.json({
      success: true,
      poster: updatedPoster,
      message: 'Inpainted image saved successfully'
    })

  } catch (error: any) {
    console.error('Save inpaint result error:', error)
    return c.json({
      success: false,
      error: error.message || 'Failed to save inpaint result'
    }, 500)
  }
}
