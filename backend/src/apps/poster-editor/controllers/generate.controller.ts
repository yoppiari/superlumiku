import type { FastifyRequest, FastifyReply } from 'fastify'
import { inpaintingService } from '../services/modelslab/inpainting.service'
import { maskGeneratorService } from '../services/image/mask-generator.service'
import { textRendererService } from '../services/image/text-renderer.service'
import { compositeService } from '../services/image/composite.service'
import { fileManagerService } from '../services/storage/file-manager.service'
import prisma from '../../../db/client'
import type { GeneratePosterParams, TextEdit } from '../types'
import path from 'path'

export class GenerateController {
  /**
   * Generate edited poster (inpainting + new text)
   * POST /api/apps/poster-editor/generate
   */
  async generate(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { posterId, edits, options } = req.body as GeneratePosterParams

      if (!posterId || !edits || !Array.isArray(edits)) {
        return reply.status(400).send({
          success: false,
          error: 'posterId and edits array are required',
        })
      }

      // Get poster
      const poster = await prisma.posterEdit.findUnique({
        where: { id: posterId },
      })

      if (!poster) {
        return reply.status(404).send({
          success: false,
          error: 'Poster not found',
        })
      }

      // Update status
      await prisma.posterEdit.update({
        where: { id: posterId },
        data: { status: 'GENERATING' },
      })

      const startTime = Date.now()

      // Step 1: Generate mask from OCR data
      const ocrData = poster.ocrData ? JSON.parse(poster.ocrData) : null
      if (!ocrData || !ocrData.textBoxes) {
        return reply.status(400).send({
          success: false,
          error: 'No OCR data found. Please detect text first.',
        })
      }

      const originalPath = fileManagerService.urlToPath(poster.originalUrl)
      const maskBuffer = await maskGeneratorService.generateMask(
        originalPath,
        ocrData.textBoxes,
        {
          padding: 5,
          blur: 2,
        }
      )

      // Save mask
      const maskPath = await fileManagerService.saveUploadedFile(
        poster.userId,
        posterId,
        maskBuffer,
        'mask.png'
      )

      const maskUrl = fileManagerService.getPublicUrl(maskPath)

      // Update poster with mask
      await prisma.posterEdit.update({
        where: { id: posterId },
        data: { maskUrl },
      })

      // Step 2: Inpaint to remove text
      const inpaintResult = await inpaintingService.removeText({
        initImageUrl: poster.originalUrl,
        maskImageUrl: maskUrl,
        prompt: options?.preserveEffects
          ? 'preserve original style, colors, effects, gradients, shadows, textures'
          : 'clean background, seamless, high quality, professional',
        negativePrompt: 'text, letters, words, watermark, logo, writing',
        strength: options?.inpaintingStrength || 0.9,
      })

      // Wait for inpainting to complete
      let inpaintedImageUrl: string | null = null

      if (inpaintResult.status === 'success' && inpaintResult.output?.[0]) {
        inpaintedImageUrl = inpaintResult.output[0]
      } else if (inpaintResult.fetch_result) {
        // Poll for result
        let attempts = 0
        const maxAttempts = 60 // 2 minutes

        while (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 2000)) // Wait 2 seconds
          const statusResult = await inpaintingService.checkStatus(
            inpaintResult.fetch_result
          )

          if (statusResult.status === 'success' && statusResult.output?.[0]) {
            inpaintedImageUrl = statusResult.output[0]
            break
          } else if (statusResult.status === 'error') {
            throw new Error(
              statusResult.message || 'Inpainting failed'
            )
          }

          attempts++
        }

        if (!inpaintedImageUrl) {
          throw new Error('Inpainting timed out')
        }
      } else {
        throw new Error('Inpainting failed')
      }

      // Download inpainted image
      const inpaintedBuffer = await inpaintingService.downloadImage(
        inpaintedImageUrl
      )

      // Save inpainted base
      const inpaintedPath = await fileManagerService.saveUploadedFile(
        poster.userId,
        posterId,
        inpaintedBuffer,
        'inpainted.png'
      )

      // Step 3: Render new text
      const originalSize = JSON.parse(poster.originalSize)
      const textLayerBuffer = await textRendererService.renderTextLayer(
        originalSize.width,
        originalSize.height,
        edits
      )

      // Step 4: Composite text onto inpainted base
      const finalBuffer = await compositeService.compositeTextOnBase(
        inpaintedPath,
        textLayerBuffer
      )

      // Save final edited poster
      const editedPath = await fileManagerService.saveUploadedFile(
        poster.userId,
        posterId,
        finalBuffer,
        'edited.png'
      )

      const editedUrl = fileManagerService.getPublicUrl(editedPath)

      // Get file info
      const editedInfo = await fileManagerService.getFileInfo(editedPath)

      const processingTime = Date.now() - startTime

      // Update poster record
      await prisma.posterEdit.update({
        where: { id: posterId },
        data: {
          editedUrl,
          userEdits: JSON.stringify(edits),
          status: 'COMPLETED',
          processingTime,
          creditsUsed: 0, // FREE with Enterprise plan
        },
      })

      return reply.send({
        success: true,
        data: {
          posterId,
          editedUrl,
          width: editedInfo.width,
          height: editedInfo.height,
          processingTime,
          creditsUsed: 0,
        },
      })
    } catch (error: any) {
      console.error('Generate error:', error)

      // Update status to failed
      if ((req.body as GeneratePosterParams).posterId) {
        await prisma.posterEdit.update({
          where: { id: (req.body as GeneratePosterParams).posterId },
          data: {
            status: 'FAILED',
            errorMessage: error.message,
          },
        })
      }

      return reply.status(500).send({
        success: false,
        error: error.message || 'Generation failed',
      })
    }
  }

  /**
   * Preview text edits (without inpainting)
   * POST /api/apps/poster-editor/preview
   */
  async preview(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { posterId, edits } = req.body as {
        posterId: string
        edits: TextEdit[]
      }

      if (!posterId || !edits) {
        return reply.status(400).send({
          success: false,
          error: 'posterId and edits are required',
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

      // Render text layer
      const originalSize = JSON.parse(poster.originalSize)
      const textLayerBuffer = await textRendererService.renderTextLayer(
        originalSize.width,
        originalSize.height,
        edits
      )

      // Composite on original (not inpainted)
      const originalPath = fileManagerService.urlToPath(poster.originalUrl)
      const previewBuffer = await compositeService.compositeTextOnBase(
        originalPath,
        textLayerBuffer
      )

      // Save preview
      const previewPath = await fileManagerService.saveUploadedFile(
        poster.userId,
        posterId,
        previewBuffer,
        'preview.png'
      )

      const previewUrl = fileManagerService.getPublicUrl(previewPath)

      return reply.send({
        success: true,
        data: {
          posterId,
          previewUrl,
        },
      })
    } catch (error: any) {
      console.error('Preview error:', error)
      return reply.status(500).send({
        success: false,
        error: error.message || 'Preview failed',
      })
    }
  }
}

export const generateController = new GenerateController()
