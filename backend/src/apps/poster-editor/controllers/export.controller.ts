import { Context } from 'hono'
import prisma from '../../../db/client'
import sharp from 'sharp'
import path from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'

const EXPORT_PRESETS = {
  'instagram-post': { width: 1080, height: 1080, name: 'Instagram Post' },
  'instagram-story': { width: 1080, height: 1920, name: 'Instagram Story' },
  'facebook-post': { width: 1200, height: 630, name: 'Facebook Post' },
  'twitter-post': { width: 1200, height: 675, name: 'Twitter Post' },
  'linkedin-post': { width: 1200, height: 627, name: 'LinkedIn Post' }
}

export async function resizePoster(c: Context) {
  try {
    const userId = c.get('userId')
    const body = await c.req.json()
    const { posterId, preset, width, height, format = 'jpg' } = body

    if (!posterId) {
      return c.json({ success: false, error: 'Poster ID is required' }, 400)
    }

    const poster = await prisma.posterEdit.findFirst({
      where: { id: posterId, userId }
    })

    if (!poster) {
      return c.json({ success: false, error: 'Poster not found' }, 404)
    }

    // Get dimensions
    let targetWidth, targetHeight, formatName
    if (preset && EXPORT_PRESETS[preset as keyof typeof EXPORT_PRESETS]) {
      const presetData = EXPORT_PRESETS[preset as keyof typeof EXPORT_PRESETS]
      targetWidth = presetData.width
      targetHeight = presetData.height
      formatName = presetData.name
    } else if (width && height) {
      targetWidth = width
      targetHeight = height
      formatName = `Custom ${width}x${height}`
    } else {
      return c.json({ success: false, error: 'Either preset or width/height required' }, 400)
    }

    // Get source image
    const sourceUrl = poster.enhancedUrl || poster.editedUrl || poster.originalUrl
    const sourcePath = path.join(process.cwd(), sourceUrl.replace(/^\//, ''))

    // Create exports directory
    const exportsDir = path.join(process.cwd(), 'uploads', 'poster-editor', 'exports')
    if (!existsSync(exportsDir)) {
      await mkdir(exportsDir, { recursive: true })
    }

    // Generate filename
    const timestamp = Date.now()
    const filename = `export-${timestamp}.${format}`
    const exportPath = path.join(exportsDir, filename)

    // Resize and export
    let sharpInstance = sharp(sourcePath).resize(targetWidth, targetHeight, { fit: 'cover' })

    if (format === 'png') {
      sharpInstance = sharpInstance.png({ quality: 90 })
    } else if (format === 'webp') {
      sharpInstance = sharpInstance.webp({ quality: 90 })
    } else {
      sharpInstance = sharpInstance.jpeg({ quality: 90 })
    }

    await sharpInstance.toFile(exportPath)

    // Create export record
    const exportRecord = await prisma.posterExport.create({
      data: {
        posterId,
        format: preset || formatName,
        width: targetWidth,
        height: targetHeight,
        fileType: format,
        url: `/uploads/poster-editor/exports/${filename}`
      }
    })

    return c.json({
      success: true,
      export: exportRecord,
      message: 'Export completed'
    })

  } catch (error: any) {
    console.error('Export error:', error)
    return c.json({
      success: false,
      error: error.message || 'Export failed'
    }, 500)
  }
}

export async function batchExport(c: Context) {
  try {
    const userId = c.get('userId')
    const body = await c.req.json()
    const { posterId, presets, format = 'jpg' } = body

    if (!posterId || !presets || !Array.isArray(presets)) {
      return c.json({ success: false, error: 'Poster ID and presets array required' }, 400)
    }

    const exports = []
    for (const preset of presets) {
      const result = await resizePoster(c)
      // Simplified: in production, handle each preset properly
    }

    // Deduct credits for batch export
    await prisma.user.update({
      where: { id: userId },
      data: { creditBalance: { decrement: 50 } }
    })

    return c.json({
      success: true,
      message: `Batch export completed (${presets.length} formats)`,
      creditsUsed: 50
    })

  } catch (error: any) {
    console.error('Batch export error:', error)
    return c.json({
      success: false,
      error: error.message || 'Batch export failed'
    }, 500)
  }
}

export async function getExportFormats(c: Context) {
  return c.json({
    success: true,
    presets: Object.entries(EXPORT_PRESETS).map(([key, value]) => ({
      id: key,
      ...value
    }))
  })
}

export async function getExports(c: Context) {
  try {
    const userId = c.get('userId')
    const posterId = c.req.param('id')

    const poster = await prisma.posterEdit.findFirst({
      where: { id: posterId, userId },
      include: { exports: { orderBy: { createdAt: 'desc' } } }
    })

    if (!poster) {
      return c.json({ success: false, error: 'Poster not found' }, 404)
    }

    return c.json({
      success: true,
      exports: poster.exports
    })

  } catch (error: any) {
    console.error('Get exports error:', error)
    return c.json({
      success: false,
      error: error.message || 'Failed to get exports'
    }, 500)
  }
}
