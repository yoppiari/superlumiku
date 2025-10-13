import { hfClient } from '../../../lib/huggingface-client'
import type { PersonaData, VisualAttributes, PromptBuildResult } from '../types'

/**
 * FLUX Avatar Generator Provider
 *
 * Uses FLUX.1-dev + Realism LoRA for photo-realistic avatar generation
 * Builds prompts from persona and visual attributes
 */

export class FluxAvatarGenerator {
  /**
   * Generate avatar from text prompt
   */
  async generateAvatar(params: {
    prompt: string
    persona?: PersonaData
    attributes?: VisualAttributes
    seed?: number
    width?: number
    height?: number
  }): Promise<Buffer> {
    // Build enhanced prompt
    const promptResult = this.buildPrompt(params.prompt, params.persona, params.attributes)

    console.log('🎨 Generating avatar with FLUX.1-dev + Realism LoRA')
    console.log('📝 Prompt:', promptResult.fullPrompt)
    console.log('🚫 Negative:', promptResult.negativePrompt)

    // Generate with FLUX
    const imageBuffer = await hfClient.withRetry(
      () =>
        hfClient.fluxTextToImage({
          prompt: promptResult.enhancedPrompt,
          negativePrompt: promptResult.negativePrompt,
          width: params.width || 1024,
          height: params.height || 1024,
          numInferenceSteps: 30,
          guidanceScale: 3.5, // FLUX works better with lower guidance
          useLoRA: true,
          loraScale: 0.9,
          seed: params.seed,
        }),
      3, // max retries
      5000 // base delay
    )

    console.log('✅ Avatar generated successfully')
    return imageBuffer
  }

  /**
   * Build realistic prompt from persona and attributes
   */
  buildPrompt(
    basePrompt: string,
    persona?: PersonaData,
    attributes?: VisualAttributes
  ): PromptBuildResult {
    // Start with base prompt
    let prompt = basePrompt

    // Add persona details if provided
    if (persona) {
      const personaParts: string[] = []

      if (persona.name) {
        personaParts.push(`${persona.name}`)
      }

      if (persona.age) {
        personaParts.push(`${persona.age} years old`)
      }

      if (persona.personality && persona.personality.length > 0) {
        const personalityStr = persona.personality.join(', ')
        personaParts.push(`${personalityStr} personality`)
      }

      if (personaParts.length > 0) {
        prompt = `${personaParts.join(', ')}, ${prompt}`
      }
    }

    // Add visual attributes
    if (attributes) {
      const attrParts: string[] = []

      // Gender and age range
      if (attributes.gender) {
        attrParts.push(attributes.gender)
      }

      if (attributes.ageRange) {
        attrParts.push(this.mapAgeRange(attributes.ageRange))
      }

      // Ethnicity
      if (attributes.ethnicity) {
        attrParts.push(`${attributes.ethnicity} ethnicity`)
      }

      // Body type
      if (attributes.bodyType) {
        attrParts.push(`${attributes.bodyType} body type`)
      }

      // Hair
      if (attributes.hairStyle || attributes.hairColor) {
        const hairParts: string[] = []
        if (attributes.hairStyle) hairParts.push(attributes.hairStyle)
        if (attributes.hairColor) hairParts.push(attributes.hairColor)
        attrParts.push(`${hairParts.join(' ')} hair`)
      }

      // Eyes
      if (attributes.eyeColor) {
        attrParts.push(`${attributes.eyeColor} eyes`)
      }

      // Skin tone
      if (attributes.skinTone) {
        attrParts.push(`${attributes.skinTone} skin tone`)
      }

      // Style/clothing
      if (attributes.style) {
        attrParts.push(`wearing ${attributes.style} attire`)
      }

      // Combine attributes with prompt
      if (attrParts.length > 0) {
        prompt = `${attrParts.join(', ')}, ${prompt}`
      }
    }

    // Add realism and quality enhancers
    const enhancedPrompt = this.enhancePromptForRealism(prompt)

    // Build negative prompt
    const negativePrompt = this.buildNegativePrompt()

    return {
      fullPrompt: prompt,
      negativePrompt,
      enhancedPrompt,
    }
  }

  /**
   * Enhance prompt for photo-realistic results
   */
  private enhancePromptForRealism(prompt: string): string {
    const qualityTerms = [
      'professional photo studio portrait',
      'ultra realistic',
      'high detail',
      'professional photography',
      'DSLR camera',
      '85mm portrait lens',
      'f/1.8 aperture',
      'studio lighting',
      'bokeh background',
      'photorealistic',
      'high resolution',
      '8k quality',
    ]

    return `${prompt}, ${qualityTerms.join(', ')}`
  }

  /**
   * Build comprehensive negative prompt
   */
  private buildNegativePrompt(): string {
    const negativeTerms = [
      'ugly',
      'blurry',
      'low quality',
      'distorted',
      'deformed',
      'bad anatomy',
      'disfigured',
      'poorly drawn face',
      'mutation',
      'mutated',
      'extra limbs',
      'bad proportions',
      'cartoon',
      'anime',
      '3d render',
      'painting',
      'illustration',
      'drawing',
      'sketch',
      'unrealistic',
      'artificial',
      'plastic',
      'wax figure',
      'mannequin',
    ]

    return negativeTerms.join(', ')
  }

  /**
   * Map age range to descriptive text
   */
  private mapAgeRange(ageRange: string): string {
    const mapping: Record<string, string> = {
      young: 'young adult (20-30 years old)',
      adult: 'middle-aged adult (30-50 years old)',
      mature: 'mature adult (50+ years old)',
    }

    return mapping[ageRange] || ageRange
  }

  /**
   * Generate prompt from persona examples (for preset generation)
   */
  generatePromptFromPersona(persona: PersonaData, attributes: VisualAttributes): string {
    let prompt = 'Professional portrait of'

    // Add persona name
    if (persona.name) {
      prompt += ` ${persona.name},`
    }

    // Add visual description
    const visualParts: string[] = []

    if (attributes.gender) {
      visualParts.push(attributes.gender)
    }

    if (attributes.ageRange) {
      visualParts.push(this.mapAgeRange(attributes.ageRange))
    }

    if (attributes.ethnicity) {
      visualParts.push(`${attributes.ethnicity} ethnicity`)
    }

    if (visualParts.length > 0) {
      prompt += ` ${visualParts.join(', ')},`
    }

    // Add personality expression
    if (persona.personality && persona.personality.length > 0) {
      const mainPersonality = persona.personality[0]
      prompt += ` with ${mainPersonality} expression,`
    }

    // Add hair and style
    if (attributes.hairStyle && attributes.hairColor) {
      prompt += ` ${attributes.hairStyle} ${attributes.hairColor} hair,`
    }

    if (attributes.style) {
      prompt += ` wearing ${attributes.style} attire,`
    }

    // Add setting
    prompt += ' professional photo studio setting'

    return prompt
  }

  /**
   * Test FLUX connectivity and model availability
   */
  async healthCheck(): Promise<boolean> {
    try {
      return await hfClient.healthCheck()
    } catch (error) {
      console.error('FLUX health check failed:', error)
      return false
    }
  }
}

// Singleton export
export const fluxGenerator = new FluxAvatarGenerator()
export default fluxGenerator
