import type { FastifyRequest, FastifyReply } from 'fastify'
import { formatConverterService } from '../services/resize/format-converter.service'
import { fileManagerService } from '../services/storage/file-manager.service'
import prisma from '../../../db/client'
import type { ResizeParams, BatchExportParams } from '../types'
import { PRESET_PACKS } from '../services/resize/format-presets'

export class ResizeController {
  /**
   * Resize poster to specific format
   * POST /api/apps/poster-editor/resize
   */
  async resize(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = req.body as ResizeParams

      if (!params.posterId || !params.format || !params.resizeMethod) {
        return reply.status(400).send({
          success: false,
          error: 'posterId, format, and resizeMethod are required',
        })
      }

      // Get poster
      const poster = await prisma.posterEdit.findUnique({
        where: { id: params.posterId },
      })

      if (!poster) {
        return reply.status(404).send({
          success: false,
          error: 'Poster not found',
        })
      }

      // Use enhanced version if available, otherwise edited, otherwise original
      const sourceUrl = poster.enhancedUrl || poster.editedUrl || poster.originalUrl
      const sourcePath = fileManagerService.urlToPath(sourceUrl)
      const sourceBuffer = await fileManagerService.readFile(sourcePath)

      // Resize
      const result = await formatConverterService.resizeToFormat(
        sourceBuffer,
        params
      )

      // Save resized image
      const filename = `${params.format.toLowerCase()}_${Date.now()}.png`
      const resizedPath = await fileManagerService.saveUploadedFile(
        poster.userId,
        params.posterId,
        result.buffer,
        filename
      )

      const resizedUrl = fileManagerService.getPublicUrl(resizedPath)

      // Create export record
      const exportRecord = await prisma.posterExport.create({
        data: {
          posterEditId: params.posterId,
          formatName: params.format,
          width: result.width,
          height: result.height,
          fileUrl: resizedUrl,
          fileSize: result.buffer.length,
          resizeMethod: params.resizeMethod,
          wasUpscaled: result.wasUpscaled,
          upscaleRatio: result.upscaleRatio,
        },
      })

      return reply.send({
        success: true,
        data: {
          exportId: exportRecord.id,
          posterId: params.posterId,
          formatName: params.format,
          fileUrl: resizedUrl,
          width: result.width,
          height: result.height,
          fileSize: result.buffer.length,
          wasUpscaled: result.wasUpscaled,
          upscaleRatio: result.upscaleRatio,
        },
      })
    } catch (error: any) {
      console.error('Resize error:', error)
      return reply.status(500).send({
        success: false,
        error: error.message || 'Resize failed',
      })
    }
  }

  /**
   * Batch export to multiple formats
   * POST /api/apps/poster-editor/batch-export
   */
  async batchExport(req: FastifyRequest, reply: FastifyReply) {
    try {
      const params = req.body as BatchExportParams

      if (!params.posterId) {
        return reply.status(400).send({
          success: false,
          error: 'posterId is required',
        })
      }

      // Determine formats
      let formats: string[] = []

      if (params.packName && PRESET_PACKS[params.packName]) {
        formats = PRESET_PACKS[params.packName].formats
      } else if (params.formats && params.formats.length > 0) {
        formats = params.formats
      } else {
        return reply.status(400).send({
          success: false,
          error: 'Either packName or formats array is required',
        })
      }

      // Get poster
      const poster = await prisma.posterEdit.findUnique({
        where: { id: params.posterId },
      })

      if (!poster) {
        return reply.status(404).send({
          success: false,
          error: 'Poster not found',
        })
      }

      // Use enhanced version if available
      const sourceUrl = poster.enhancedUrl || poster.editedUrl || poster.originalUrl
      const sourcePath = fileManagerService.urlToPath(sourceUrl)
      const sourceBuffer = await fileManagerService.readFile(sourcePath)

      // Batch resize
      const results = await formatConverterService.batchResize(sourceBuffer, formats, {
        autoUpscale: params.autoUpscale || false,
        quality: params.quality || 'high',
        resizeMethod: 'smart_crop', // Default to smart crop
      })

      // Save all exports
      const exports = []

      for (const result of results) {
        const filename = `${result.formatName.toLowerCase()}_${Date.now()}.png`
        const exportPath = await fileManagerService.saveUploadedFile(
          poster.userId,
          params.posterId,
          result.buffer,
          filename
        )

        const exportUrl = fileManagerService.getPublicUrl(exportPath)

        // Create export record
        const exportRecord = await prisma.posterExport.create({
          data: {
            posterEditId: params.posterId,
            formatName: result.formatName,
            width: result.width,
            height: result.height,
            fileUrl: exportUrl,
            fileSize: result.fileSize,
            resizeMethod: 'smart_crop',
            wasUpscaled: result.wasUpscaled,
            upscaleRatio: result.upscaleRatio,
          },
        })

        exports.push({
          exportId: exportRecord.id,
          formatName: result.formatName,
          fileUrl: exportUrl,
          width: result.width,
          height: result.height,
          fileSize: result.fileSize,
          wasUpscaled: result.wasUpscaled,
        })
      }

      return reply.send({
        success: true,
        data: {
          posterId: params.posterId,
          totalExports: exports.length,
          exports,
        },
      })
    } catch (error: any) {
      console.error('Batch export error:', error)
      return reply.status(500).send({
        success: false,
        error: error.message || 'Batch export failed',
      })
    }
  }

  /**
   * Get available formats
   * GET /api/apps/poster-editor/formats
   */
  async getFormats(req: FastifyRequest, reply: FastifyReply) {
    try {
      const formats = formatConverterService.getAllFormats()

      return reply.send({
        success: true,
        data: formats,
      })
    } catch (error: any) {
      console.error('Get formats error:', error)
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get formats',
      })
    }
  }

  /**
   * Get available preset packs
   * GET /api/apps/poster-editor/preset-packs
   */
  async getPresetPacks(req: FastifyRequest, reply: FastifyReply) {
    try {
      return reply.send({
        success: true,
        data: PRESET_PACKS,
      })
    } catch (error: any) {
      console.error('Get preset packs error:', error)
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get preset packs',
      })
    }
  }

  /**
   * Get export history for poster
   * GET /api/apps/poster-editor/exports/:posterId
   */
  async getExports(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { posterId } = req.params as { posterId: string }

      const exports = await prisma.posterExport.findMany({
        where: { posterEditId: posterId },
        orderBy: { createdAt: 'desc' },
      })

      return reply.send({
        success: true,
        data: exports,
      })
    } catch (error: any) {
      console.error('Get exports error:', error)
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get exports',
      })
    }
  }

  /**
   * Suggest optimal formats based on image dimensions
   * POST /api/apps/poster-editor/suggest-formats
   */
  async suggestFormats(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { posterId } = req.body as { posterId: string }

      if (!posterId) {
        return reply.status(400).send({
          success: false,
          error: 'posterId is required',
        })
      }

      const poster = await prisma.posterEdit.findUnique({
        where: { id: posterId },
      })

      if (!poster) {
        return reply.status(404).send({
          success: false,
          error: 'Poster not found',
        })
      }

      const sourceUrl = poster.enhancedUrl || poster.editedUrl || poster.originalUrl
      const sourcePath = fileManagerService.urlToPath(sourceUrl)
      const sourceBuffer = await fileManagerService.readFile(sourcePath)

      const suggestions = await formatConverterService.suggestFormat(sourceBuffer)

      return reply.send({
        success: true,
        data: {
          posterId,
          suggestedFormats: suggestions,
        },
      })
    } catch (error: any) {
      console.error('Suggest formats error:', error)
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to suggest formats',
      })
    }
  }
}

export const resizeController = new ResizeController()
