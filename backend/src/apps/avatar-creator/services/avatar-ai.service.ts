import { hfClient } from '../../../lib/huggingface-client'
import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'
import prisma from '../../../db/client'

/**
 * AI Avatar Generation Service
 * Phase 2: Text-to-Avatar Generation
 */
export class AvatarAIService {
  /**
   * Generate avatar from text prompt using SDXL
   */
  async generateFromText(params: {
    userId: string
    prompt: string
    name: string
    gender?: string
    ageRange?: string
    style?: string
    ethnicity?: string
  }): Promise<{ id: string, imageUrl: string, thumbnailUrl: string }> {
    try {
      // 1. Build enhanced prompt
      const enhancedPrompt = this.buildAvatarPrompt(params)

      console.log('Generating avatar with prompt:', enhancedPrompt)

      // 2. Generate image with SDXL using retry wrapper
      const imageBuffer = await hfClient.withRetry(async () => {
        return await hfClient.textToImage({
          prompt: enhancedPrompt,
          negativePrompt: this.getNegativePrompt(),
          width: 1024,
          height: 1024,
          numInferenceSteps: 50,
          guidanceScale: 7.5,
        })
      })

      // 3. Save to storage
      const avatarDir = path.join(process.cwd(), 'uploads', 'avatars', params.userId)
      await fs.mkdir(avatarDir, { recursive: true })

      const timestamp = Date.now()
      const baseFilename = `avatar_${timestamp}.jpg`
      const thumbnailFilename = `avatar_${timestamp}_thumb.jpg`

      const basePath = path.join(avatarDir, baseFilename)
      const thumbnailPath = path.join(avatarDir, thumbnailFilename)

      // Save base image
      await fs.writeFile(basePath, imageBuffer)

      // Generate thumbnail
      const thumbnailBuffer = await sharp(imageBuffer)
        .resize(300, 300, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 85 })
        .toBuffer()

      await fs.writeFile(thumbnailPath, thumbnailBuffer)

      const baseImageUrl = `/uploads/avatars/${params.userId}/${baseFilename}`
      const thumbnailUrl = `/uploads/avatars/${params.userId}/${thumbnailFilename}`

      // 4. Extract face embedding for consistency (optional - can implement later)
      // const faceEmbedding = await this.extractFaceEmbedding(imageBuffer)

      // 5. Create database record
      const avatar = await prisma.avatar.create({
        data: {
          userId: params.userId,
          name: params.name,
          baseImageUrl,
          thumbnailUrl,
          gender: params.gender || null,
          ageRange: params.ageRange || null,
          style: params.style || null,
          ethnicity: params.ethnicity || null,
          sourceType: 'ai_generated',
          generationPrompt: enhancedPrompt,
          faceEmbedding: null, // TODO: Implement face embedding extraction
          usageCount: 0,
        }
      })

      console.log('✓ Avatar generated successfully:', avatar.id)

      return {
        id: avatar.id,
        imageUrl: baseImageUrl,
        thumbnailUrl
      }
    } catch (error: any) {
      console.error('Avatar generation failed:', error)
      throw new Error(`Failed to generate avatar: ${error.message}`)
    }
  }

  /**
   * Build optimized prompt for avatar generation
   */
  private buildAvatarPrompt(params: {
    prompt: string
    gender?: string
    ageRange?: string
    style?: string
    ethnicity?: string
  }): string {
    const parts: string[] = [
      'professional portrait photo',
      params.prompt
    ]

    // Add gender
    if (params.gender && params.gender !== 'unisex') {
      parts.push(`${params.gender} person`)
    }

    // Add age range
    if (params.ageRange) {
      const ageMap: Record<string, string> = {
        'young': 'young adult, age 20-25',
        'adult': 'adult, age 30-40',
        'mature': 'mature, age 45-55'
      }
      parts.push(ageMap[params.ageRange] || '')
    }

    // Add ethnicity
    if (params.ethnicity) {
      parts.push(`${params.ethnicity} ethnicity`)
    }

    // Add style
    if (params.style) {
      const styleMap: Record<string, string> = {
        'casual': 'casual clothing, relaxed',
        'formal': 'formal attire, business professional',
        'sporty': 'athletic wear, active',
        'traditional': 'traditional clothing',
        'professional': 'professional business attire'
      }
      parts.push(styleMap[params.style] || params.style)
    }

    // Quality enhancers
    parts.push(
      'high quality',
      'detailed face',
      '8k',
      'sharp focus',
      'professional photography',
      'studio lighting',
      'neutral background',
      'front facing',
      'looking at camera',
      'photorealistic'
    )

    return parts.filter(Boolean).join(', ')
  }

  /**
   * Negative prompt to avoid common issues
   */
  private getNegativePrompt(): string {
    return [
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
      'extra fingers',
      'malformed limbs',
      'fused fingers',
      'too many fingers',
      'long neck',
      'cross-eyed',
      'text',
      'watermark',
      'logo',
      'signature'
    ].join(', ')
  }

  /**
   * Generate multiple avatar variations from one prompt
   */
  async generateVariations(params: {
    userId: string
    basePrompt: string
    name: string
    count: number
    gender?: string
    ageRange?: string
    style?: string
  }): Promise<Array<{ id: string, imageUrl: string }>> {
    const results: Array<{ id: string, imageUrl: string }> = []

    for (let i = 0; i < params.count; i++) {
      try {
        const avatar = await this.generateFromText({
          userId: params.userId,
          prompt: params.basePrompt,
          name: `${params.name} - Variation ${i + 1}`,
          gender: params.gender,
          ageRange: params.ageRange,
          style: params.style
        })

        results.push(avatar)

        console.log(`✓ Generated variation ${i + 1}/${params.count}`)

        // Small delay to avoid rate limiting
        if (i < params.count - 1) {
          await this.sleep(2000) // 2 seconds
        }
      } catch (error: any) {
        console.error(`Failed to generate variation ${i + 1}:`, error)
      }
    }

    return results
  }

  /**
   * Enhance existing avatar using AI
   * (Optional - can be used to improve uploaded avatars)
   */
  async enhanceAvatar(params: {
    avatarId: string
    userId: string
    enhancementType: 'upscale' | 'face-fix' | 'color-correct'
  }): Promise<string> {
    const avatar = await prisma.avatar.findFirst({
      where: { id: params.avatarId, userId: params.userId }
    })

    if (!avatar) {
      throw new Error('Avatar not found')
    }

    // Load image
    const imageBuffer = await fs.readFile(avatar.baseImageUrl)

    let enhancedBuffer: Buffer

    switch (params.enhancementType) {
      case 'upscale':
        // Simple upscaling with sharp
        enhancedBuffer = await sharp(imageBuffer)
          .resize(2048, 2048, {
            kernel: sharp.kernel.lanczos3,
            fit: 'inside'
          })
          .sharpen()
          .toBuffer()
        break

      case 'face-fix':
        // TODO: Implement face restoration AI (GFPGAN, CodeFormer)
        enhancedBuffer = imageBuffer
        break

      case 'color-correct':
        // Color correction using sharp
        enhancedBuffer = await sharp(imageBuffer)
          .normalize()
          .modulate({
            brightness: 1.1,
            saturation: 1.05
          })
          .toBuffer()
        break

      default:
        enhancedBuffer = imageBuffer
    }

    // Save enhanced version
    const enhancedPath = avatar.baseImageUrl.replace('.jpg', '_enhanced.jpg')
    await fs.writeFile(enhancedPath, enhancedBuffer)

    // Update database
    await prisma.avatar.update({
      where: { id: params.avatarId },
      data: { baseImageUrl: enhancedPath }
    })

    return enhancedPath
  }

  /**
   * Extract face embedding for consistency across generations
   * TODO: Implement using face recognition model
   */
  private async extractFaceEmbedding(imageBuffer: Buffer): Promise<string | null> {
    // Placeholder - implement with face-api.js or similar
    // This will help maintain face consistency in pose generation
    return null
  }

  /**
   * Estimate generation time
   */
  estimateGenerationTime(count: number = 1): number {
    return count * 15 // 15 seconds per avatar (SDXL)
  }

  /**
   * Helper: Sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Singleton instance
export const avatarAIService = new AvatarAIService()

// Export class
export default AvatarAIService
