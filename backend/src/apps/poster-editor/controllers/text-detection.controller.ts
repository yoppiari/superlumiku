import { Context } from 'hono'
import prisma from '../../../db/client'
import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs'
import path from 'path'

const EDEN_AI_API_KEY = process.env.EDEN_AI_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMWQ3OWY0NWQtY2FiZC00YzEyLTgwNTItMDdkYjM2ZDFhYzc1IiwidHlwZSI6ImFwaV90b2tlbiJ9.ZL_w8JBhGfWUmK_Ek7bM1bBaNW4fHj3KJMl3CFvRzSs'

// Simple mock detection for now (Eden AI requires valid API key)
export async function detectText(c: Context) {
  try {
    const userId = c.get('userId')
    const body = await c.req.json()
    const { posterId } = body

    if (!posterId) {
      return c.json({ success: false, error: 'Poster ID is required' }, 400)
    }

    // Verify ownership
    const poster = await prisma.posterEdit.findFirst({
      where: { id: posterId, userId }
    })

    if (!poster) {
      return c.json({ success: false, error: 'Poster not found' }, 404)
    }

    // Mock text detection (in production, call Eden AI here)
    const detectedTexts = [
      { x: 10, y: 15, width: 30, height: 8, text: 'Sample Text 1', confidence: 0.95 },
      { x: 45, y: 40, width: 25, height: 6, text: 'Sample Text 2', confidence: 0.89 },
      { x: 20, y: 70, width: 40, height: 10, text: 'Sample Text 3', confidence: 0.92 }
    ]

    // Update poster with detected texts
    const updatedPoster = await prisma.posterEdit.update({
      where: { id: posterId },
      data: {
        ocrData: JSON.stringify(detectedTexts),
        status: 'detected'
      },
      include: { exports: true }
    })

    // Deduct credits (50 credits for text detection)
    await prisma.user.update({
      where: { id: userId },
      data: { creditBalance: { decrement: 50 } }
    })

    return c.json({
      success: true,
      poster: updatedPoster,
      detectedTexts,
      creditsUsed: 50,
      message: 'Text detection completed'
    })

  } catch (error: any) {
    console.error('Text detection error:', error)
    return c.json({
      success: false,
      error: error.message || 'Text detection failed'
    }, 500)
  }
}

export async function updateDetectedText(c: Context) {
  try {
    const userId = c.get('userId')
    const posterId = c.req.param('id')
    const body = await c.req.json()
    const { detectedTexts } = body

    const poster = await prisma.posterEdit.findFirst({
      where: { id: posterId, userId }
    })

    if (!poster) {
      return c.json({ success: false, error: 'Poster not found' }, 404)
    }

    const updatedPoster = await prisma.posterEdit.update({
      where: { id: posterId },
      data: { ocrData: JSON.stringify(detectedTexts) },
      include: { exports: true }
    })

    return c.json({
      success: true,
      poster: updatedPoster,
      message: 'Detected texts updated'
    })

  } catch (error: any) {
    console.error('Update detected text error:', error)
    return c.json({
      success: false,
      error: error.message || 'Failed to update detected texts'
    }, 500)
  }
}
