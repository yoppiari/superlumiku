/**
 * SAM Integration Service for Poster Editor
 * Handles Smart Detection mode with SAM segmentation
 */

import { getSAMClient } from '@/lib/sam'
import type { SAMSegmentResponse } from '@/lib/sam'
import { promises as fs } from 'fs'
import path from 'path'

export interface SAMAnnotation {
  id: string
  x: number
  y: number
  xPercent: number
  yPercent: number
  prompt: string
  segmentationMode: 'circular' | 'sam'
  samObjectPrompt?: string
  samMaskBase64?: string
  samConfidence?: number
  maskRadius?: number
}

export class SAMIntegrationService {
  private samClient = getSAMClient()

  /**
   * Generate mask using SAM for a single annotation
   */
  async generateSAMMask(
    imageBase64: string,
    annotation: SAMAnnotation
  ): Promise<{
    maskBase64: string
    confidence: number
  }> {
    try {
      console.log(`[SAM Integration] Generating mask for annotation ${annotation.id}`)
      console.log(`[SAM Integration] Point: (${annotation.x}, ${annotation.y})`)
      console.log(`[SAM Integration] Object prompt: ${annotation.samObjectPrompt || 'none'}`)

      // Call SAM service
      const result: SAMSegmentResponse = await this.samClient.segmentByPoint(
        imageBase64,
        [annotation.x, annotation.y],
        annotation.samObjectPrompt
      )

      if (!result.success || !result.maskBase64) {
        throw new Error('SAM segmentation failed')
      }

      console.log(`[SAM Integration] ✅ Mask generated with confidence: ${result.confidence}`)

      return {
        maskBase64: result.maskBase64,
        confidence: result.confidence || 0,
      }
    } catch (error) {
      console.error('[SAM Integration] Failed to generate mask:', error)
      throw new Error(
        `SAM mask generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Generate masks for multiple annotations
   */
  async generateMultipleMasks(
    imageBase64: string,
    annotations: SAMAnnotation[]
  ): Promise<
    Array<{
      id: string
      maskBase64: string
      confidence: number
    }>
  > {
    console.log(`[SAM Integration] Generating masks for ${annotations.length} annotations`)

    const results = []

    for (const annotation of annotations) {
      try {
        const mask = await this.generateSAMMask(imageBase64, annotation)
        results.push({
          id: annotation.id,
          ...mask,
        })
      } catch (error) {
        console.error(`[SAM Integration] Failed for annotation ${annotation.id}:`, error)
        // Continue with other annotations even if one fails
        results.push({
          id: annotation.id,
          maskBase64: '',
          confidence: 0,
        })
      }
    }

    return results
  }

  /**
   * Check if SAM service is available
   */
  async checkSAMHealth(): Promise<boolean> {
    try {
      await this.samClient.healthCheck()
      return true
    } catch (error) {
      console.warn('[SAM Integration] SAM service not available:', error)
      return false
    }
  }

  /**
   * Get SAM availability status
   */
  isSAMEnabled(): boolean {
    return this.samClient.isEnabled()
  }
}

// Singleton instance
let samIntegrationInstance: SAMIntegrationService | null = null

export function getSAMIntegrationService(): SAMIntegrationService {
  if (!samIntegrationInstance) {
    samIntegrationInstance = new SAMIntegrationService()
  }
  return samIntegrationInstance
}
