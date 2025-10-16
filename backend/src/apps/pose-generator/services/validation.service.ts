/**
 * Validation Service
 *
 * Handles input validation for pose generation:
 * - Text prompt validation (forbidden keywords, length limits)
 * - Request body validation
 * - Generation options validation
 *
 * Phase 1.4: Service Layer Implementation
 */

import { ValidationError } from '../../../core/errors/errors'
import type { GenerateRequest } from '../types'

export class ValidationService {
  // ============================================
  // FORBIDDEN KEYWORDS
  // ============================================

  private readonly FORBIDDEN_KEYWORDS = [
    // Explicit content
    'nude',
    'naked',
    'nsfw',
    'explicit',
    'porn',
    'pornographic',
    'sexual',
    'sex',
    'xxx',
    'erotic',
    'hentai',
    'lewd',

    // Copyrighted characters
    'mickey mouse',
    'minnie mouse',
    'donald duck',
    'spiderman',
    'spider-man',
    'superman',
    'batman',
    'wonder woman',
    'iron man',
    'captain america',
    'hulk',
    'thor',
    'pokemon',
    'pikachu',
    'naruto',
    'goku',
    'sonic',
    'mario',
    'luigi',
    'zelda',
    'hello kitty',
    'spongebob',

    // Inappropriate content
    'hitler',
    'nazi',
    'terrorist',
    'terrorism',
    'violence',
    'violent',
    'gore',
    'bloody',
    'murder',
    'kill',
    'suicide',
    'drug',
    'cocaine',
    'heroin',
    'meth',
  ]

  private readonly MAX_PROMPT_LENGTH = 500
  private readonly MIN_PROMPT_LENGTH = 3

  private readonly POSE_KEYWORDS = [
    // Body positions
    'pose',
    'posing',
    'position',
    'posture',
    'stance',
    'gesture',
    'body',

    // Standing poses
    'standing',
    'stand',
    'upright',

    // Sitting poses
    'sitting',
    'sit',
    'seated',
    'chair',

    // Action poses
    'walking',
    'walk',
    'running',
    'run',
    'jumping',
    'jump',
    'reaching',
    'reach',
    'stretching',
    'stretch',
    'leaning',
    'lean',

    // Hand/arm gestures
    'arms',
    'hands',
    'waving',
    'wave',
    'pointing',
    'point',
    'crossed arms',
    'hands on hips',

    // Professional poses
    'professional',
    'business',
    'formal',
    'confident',

    // Casual poses
    'casual',
    'relaxed',
    'natural',
    'comfortable',

    // Full body descriptors
    'full body',
    'full-body',
    'whole body',
    'upper body',
    'lower body',
  ]

  // ============================================
  // TEXT PROMPT VALIDATION
  // ============================================

  /**
   * Validate text prompt for pose generation
   *
   * @throws ValidationError if prompt is invalid
   */
  validateTextPrompt(prompt: string): void {
    // Check if prompt is provided
    if (!prompt || prompt.trim().length === 0) {
      throw new ValidationError('Prompt cannot be empty')
    }

    const trimmedPrompt = prompt.trim()

    // Check minimum length
    if (trimmedPrompt.length < this.MIN_PROMPT_LENGTH) {
      throw new ValidationError(
        `Prompt too short. Minimum ${this.MIN_PROMPT_LENGTH} characters required`
      )
    }

    // Check maximum length
    if (trimmedPrompt.length > this.MAX_PROMPT_LENGTH) {
      throw new ValidationError(
        `Prompt too long. Maximum ${this.MAX_PROMPT_LENGTH} characters allowed`
      )
    }

    // Check forbidden keywords
    const lowerPrompt = trimmedPrompt.toLowerCase()

    for (const keyword of this.FORBIDDEN_KEYWORDS) {
      if (lowerPrompt.includes(keyword.toLowerCase())) {
        // Don't reveal which keyword to prevent circumvention
        throw new ValidationError(
          'Your prompt contains inappropriate or restricted content. Please revise your prompt.'
        )
      }
    }

    // Ensure prompt is pose-related
    const hasPoseKeyword = this.POSE_KEYWORDS.some((keyword) =>
      lowerPrompt.includes(keyword.toLowerCase())
    )

    if (!hasPoseKeyword) {
      throw new ValidationError(
        'Please describe a pose or body position. Your prompt should include keywords like "pose", "standing", "sitting", "arms", "hands", etc.'
      )
    }
  }

  /**
   * Validate entire generation request
   *
   * @throws ValidationError if request is invalid
   */
  validateGenerateRequest(data: GenerateRequest): void {
    // Validate generation type
    if (!['GALLERY_REFERENCE', 'TEXT_DESCRIPTION'].includes(data.generationType)) {
      throw new ValidationError(
        'Invalid generation type. Must be GALLERY_REFERENCE or TEXT_DESCRIPTION'
      )
    }

    // Validate project ID
    if (!data.projectId || data.projectId.trim().length === 0) {
      throw new ValidationError('Project ID is required')
    }

    // Mode-specific validation
    if (data.generationType === 'GALLERY_REFERENCE') {
      this.validateGalleryMode(data)
    } else if (data.generationType === 'TEXT_DESCRIPTION') {
      this.validateTextMode(data)
    }

    // Validate background options
    if (data.useBackgroundChanger) {
      this.validateBackgroundOptions(data)
    }

    // Validate export formats
    if (data.outputFormats && data.outputFormats.length > 0) {
      this.validateExportFormats(data.outputFormats)
    }
  }

  /**
   * Validate gallery reference mode
   */
  private validateGalleryMode(data: GenerateRequest): void {
    if (!data.selectedPoseIds || data.selectedPoseIds.length === 0) {
      throw new ValidationError('No poses selected for gallery mode')
    }

    // Check maximum poses
    if (data.selectedPoseIds.length > 200) {
      throw new ValidationError(
        'Too many poses selected. Maximum 200 poses allowed per generation'
      )
    }

    // Validate batch size
    if (data.batchSize !== undefined) {
      if (data.batchSize < 1 || data.batchSize > 10) {
        throw new ValidationError('Batch size must be between 1 and 10')
      }
    }

    // Calculate total poses
    const batchSize = data.batchSize || 4
    const totalPoses = data.selectedPoseIds.length * batchSize

    if (totalPoses > 500) {
      throw new ValidationError(
        `Total poses would be ${totalPoses}. Maximum 500 poses allowed per generation. Please reduce selected poses or batch size.`
      )
    }
  }

  /**
   * Validate text description mode
   */
  private validateTextMode(data: GenerateRequest): void {
    if (!data.textPrompt || data.textPrompt.trim().length === 0) {
      throw new ValidationError('Text prompt is required for text mode')
    }

    // Validate text prompt content
    this.validateTextPrompt(data.textPrompt)

    // Validate variation count
    if (data.variationCount !== undefined) {
      if (data.variationCount < 1 || data.variationCount > 20) {
        throw new ValidationError('Variation count must be between 1 and 20')
      }
    }
  }

  /**
   * Validate background options
   */
  private validateBackgroundOptions(data: GenerateRequest): void {
    if (!data.backgroundMode) {
      throw new ValidationError(
        'Background mode is required when background changer is enabled'
      )
    }

    const validModes = ['ai_generate', 'solid_color', 'upload']
    if (!validModes.includes(data.backgroundMode)) {
      throw new ValidationError(
        `Invalid background mode. Must be one of: ${validModes.join(', ')}`
      )
    }

    // Mode-specific validation
    if (data.backgroundMode === 'ai_generate') {
      if (!data.backgroundPrompt || data.backgroundPrompt.trim().length === 0) {
        throw new ValidationError(
          'Background prompt is required for AI generate mode'
        )
      }

      if (data.backgroundPrompt.length > 300) {
        throw new ValidationError(
          'Background prompt too long. Maximum 300 characters allowed'
        )
      }
    }

    if (data.backgroundMode === 'solid_color') {
      if (!data.backgroundColor) {
        throw new ValidationError('Background color is required for solid color mode')
      }

      // Validate hex color format
      if (!/^#[0-9A-Fa-f]{6}$/.test(data.backgroundColor)) {
        throw new ValidationError(
          'Invalid color format. Use hex format (e.g., #FF5733)'
        )
      }
    }

    if (data.backgroundMode === 'upload') {
      if (!data.backgroundImageUrl || data.backgroundImageUrl.trim().length === 0) {
        throw new ValidationError(
          'Background image URL is required for upload mode'
        )
      }
    }
  }

  /**
   * Validate export formats
   */
  private validateExportFormats(formats: string[]): void {
    const validFormats = [
      'instagram_story',
      'instagram_feed',
      'tiktok',
      'shopee_product',
      'tokopedia_product',
      'print_a4',
      'original',
    ]

    for (const format of formats) {
      if (!validFormats.includes(format)) {
        throw new ValidationError(
          `Invalid export format: ${format}. Valid formats: ${validFormats.join(', ')}`
        )
      }
    }

    // Check maximum formats
    if (formats.length > 10) {
      throw new ValidationError('Maximum 10 export formats allowed')
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Sanitize text prompt (remove extra spaces, trim)
   */
  sanitizePrompt(prompt: string): string {
    return prompt
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[^\w\s\-,.!?]/g, '') // Remove special characters except basic punctuation
  }

  /**
   * Check if prompt contains pose keywords
   */
  isPoseRelated(prompt: string): boolean {
    const lowerPrompt = prompt.toLowerCase()
    return this.POSE_KEYWORDS.some((keyword) =>
      lowerPrompt.includes(keyword.toLowerCase())
    )
  }

  /**
   * Get suggested pose keywords (for UI hints)
   */
  getSuggestedPoseKeywords(): string[] {
    return [
      'standing confidently',
      'sitting casually',
      'professional business pose',
      'arms crossed',
      'hands on hips',
      'walking forward',
      'reaching upward',
      'relaxed natural pose',
      'formal presentation stance',
      'casual leaning pose',
    ]
  }

  /**
   * Validate background change request
   *
   * @throws ValidationError if request is invalid
   */
  validateBackgroundChangeRequest(data: any): void {
    if (!data.backgroundMode) {
      throw new ValidationError('Background mode is required')
    }

    const validModes = ['ai_generate', 'solid_color', 'upload']
    if (!validModes.includes(data.backgroundMode)) {
      throw new ValidationError(
        `Invalid background mode. Must be one of: ${validModes.join(', ')}`
      )
    }

    // Mode-specific validation
    if (data.backgroundMode === 'ai_generate') {
      if (!data.backgroundPrompt || data.backgroundPrompt.trim().length === 0) {
        throw new ValidationError('Background prompt is required for AI generate mode')
      }

      if (data.backgroundPrompt.length > 300) {
        throw new ValidationError(
          'Background prompt too long. Maximum 300 characters allowed'
        )
      }

      // Check for forbidden keywords in background prompt
      const lowerPrompt = data.backgroundPrompt.toLowerCase()
      for (const keyword of this.FORBIDDEN_KEYWORDS) {
        if (lowerPrompt.includes(keyword.toLowerCase())) {
          throw new ValidationError(
            'Background prompt contains inappropriate or restricted content'
          )
        }
      }
    }

    if (data.backgroundMode === 'solid_color') {
      if (!data.backgroundColor) {
        throw new ValidationError('Background color is required for solid color mode')
      }

      // Validate hex color format
      if (!/^#[0-9A-Fa-f]{6}$/.test(data.backgroundColor)) {
        throw new ValidationError('Invalid color format. Use hex format (e.g., #FF5733)')
      }
    }

    if (data.backgroundMode === 'upload') {
      if (!data.backgroundImageUrl || data.backgroundImageUrl.trim().length === 0) {
        throw new ValidationError('Background image URL is required for upload mode')
      }

      // Basic URL validation
      try {
        new URL(data.backgroundImageUrl)
      } catch {
        // If not a full URL, check if it's a relative path
        if (!data.backgroundImageUrl.startsWith('/uploads/')) {
          throw new ValidationError('Invalid background image URL')
        }
      }
    }
  }
}

export const validationService = new ValidationService()
