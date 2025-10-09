import { Context } from 'hono'
import prisma from '../../../db/client'
import sharp from 'sharp'
import path from 'path'
import { mkdir } from 'fs/promises'
import { existsSync } from 'fs'

export async function enhancePoster(c: Context) {
  try {
    const userId = c.get('userId')
    const body = await c.req.json()
    const { posterId, model = 'esrgan' } = body

    if (!posterId) {
      return c.json({ success: false, error: 'Poster ID is required' }, 400)
    }

    const poster = await prisma.posterEdit.findFirst({
      where: { id: posterId, userId }
    })

    if (!poster) {
      return c.json({ success: false, error: 'Poster not found' }, 404)
    }

    const sourceUrl = poster.editedUrl || poster.originalUrl
    const sourcePath = path.join(process.cwd(), sourceUrl.replace(/^\//, ''))

    const enhancedDir = path.join(process.cwd(), 'uploads', 'poster-editor', 'enhanced')
    if (!existsSync(enhancedDir)) {
      await mkdir(enhancedDir, { recursive: true })
    }

    const timestamp = Date.now()
    const filename = `enhanced-${timestamp}.jpg`
    const enhancedPath = path.join(enhancedDir, filename)

    await sharp(sourcePath)
      .sharpen()
      .jpeg({ quality: 95 })
      .toFile(enhancedPath)

    const updatedPoster = await prisma.posterEdit.update({
      where: { id: posterId },
      data: {
        enhancedUrl: `/uploads/poster-editor/enhanced/${filename}`,
        status: 'enhanced'
      },
      include: { exports: true }
    })

    await prisma.user.update({
      where: { id: userId },
      data: { creditBalance: { decrement: 150 } }
    })

    return c.json({
      success: true,
      poster: updatedPoster,
      creditsUsed: 150,
      message: 'Enhancement completed'
    })

  } catch (error: any) {
    console.error('Enhancement error:', error)
    return c.json({
      success: false,
      error: error.message || 'Enhancement failed'
    }, 500)
  }
}

export async function getEnhancementModels(c: Context) {
  return c.json({
    success: true,
    models: [
      { id: 'esrgan', name: 'Real-ESRGAN', description: 'General purpose upscaling' },
      { id: 'esrgan-anime', name: 'Real-ESRGAN Anime', description: 'Optimized for anime/illustrations' }
    ]
  })
}
