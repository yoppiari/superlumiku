import { hfClient } from '../../../lib/huggingface-client'
import { createCanvas } from 'canvas'
import sharp from 'sharp'

/**
 * Profession Theme Processor
 * Phase 4: Apply profession themes (doctor, pilot, chef, etc.)
 */
export class ThemeProcessorService {
  /**
   * Apply profession theme to generated pose
   */
  async applyProfessionTheme(params: {
    generatedPoseBuffer: Buffer
    theme: string // 'doctor', 'pilot', 'chef', 'teacher', 'nurse', etc.
  }): Promise<Buffer> {
    try {
      console.log('Applying profession theme:', params.theme)

      const themeConfig = this.getThemeConfig(params.theme)

      if (!themeConfig) {
        console.warn(`Theme ${params.theme} not found, returning original`)
        return params.generatedPoseBuffer
      }

      let resultBuffer = params.generatedPoseBuffer

      // 1. Add profession clothing using inpainting
      if (themeConfig.clothing) {
        console.log('Adding profession clothing:', themeConfig.clothing)
        resultBuffer = await this.addProfessionClothing(
          resultBuffer,
          themeConfig.clothing
        )
      }

      // 2. Add profession props/accessories
      if (themeConfig.props && themeConfig.props.length > 0) {
        console.log('Adding props:', themeConfig.props)
        resultBuffer = await this.addProps(resultBuffer, themeConfig.props)
      }

      // 3. Adjust background to match profession
      if (themeConfig.background) {
        console.log('Adjusting background:', themeConfig.background)
        resultBuffer = await this.adjustBackgroundForTheme(
          resultBuffer,
          themeConfig.background
        )
      }

      return resultBuffer
    } catch (error: any) {
      console.error('Theme application failed:', error)
      return params.generatedPoseBuffer
    }
  }

  /**
   * Get theme configuration
   */
  private getThemeConfig(theme: string): {
    clothing: string
    props: string[]
    background: string
  } | null {
    const themes: Record<string, { clothing: string, props: string[], background: string }> = {
      'doctor': {
        clothing: 'white medical coat, doctor uniform, professional medical attire',
        props: ['stethoscope', 'medical clipboard'],
        background: 'modern hospital clinic, medical office, clean white environment'
      },
      'pilot': {
        clothing: 'pilot uniform, aviation captain attire, navy blue uniform with wings badge',
        props: ['aviation cap', 'pilot sunglasses'],
        background: 'airplane cockpit, aviation setting, professional aircraft interior'
      },
      'chef': {
        clothing: 'white chef coat, professional chef uniform, toque blanche',
        props: ['chef hat', 'cooking utensils'],
        background: 'professional restaurant kitchen, modern culinary workspace'
      },
      'teacher': {
        clothing: 'smart casual professional attire, business casual clothing',
        props: ['books', 'teaching materials'],
        background: 'modern classroom, educational setting, bright learning environment'
      },
      'nurse': {
        clothing: 'nurse scrubs, medical nursing uniform, professional healthcare attire',
        props: ['medical equipment', 'nursing supplies'],
        background: 'hospital ward, medical care setting, clean healthcare environment'
      },
      'engineer': {
        clothing: 'safety vest, hard hat, engineering workwear',
        props: ['safety helmet', 'blueprints'],
        background: 'construction site, engineering workshop, industrial setting'
      },
      'lawyer': {
        clothing: 'professional business suit, formal legal attire, black robe',
        props: ['legal documents', 'briefcase'],
        background: 'law office, courthouse, professional legal setting'
      },
      'scientist': {
        clothing: 'white lab coat, laboratory attire, research scientist outfit',
        props: ['laboratory equipment', 'test tubes'],
        background: 'modern research laboratory, scientific workspace'
      },
      'firefighter': {
        clothing: 'firefighter uniform, protective fire gear, rescue attire',
        props: ['fire helmet', 'fire axe'],
        background: 'fire station, emergency response setting'
      },
      'police': {
        clothing: 'police uniform, law enforcement attire, official police outfit',
        props: ['police badge', 'radio'],
        background: 'police station, law enforcement setting'
      },
      'architect': {
        clothing: 'smart business casual, professional design attire',
        props: ['architectural plans', 'drafting tools'],
        background: 'modern architecture office, design studio'
      },
      'photographer': {
        clothing: 'casual professional attire, photographer vest',
        props: ['professional camera', 'camera equipment'],
        background: 'photography studio, creative workspace'
      }
    }

    return themes[theme.toLowerCase()] || null
  }

  /**
   * Add profession clothing using inpainting
   */
  private async addProfessionClothing(imageBuffer: Buffer, clothingDescription: string): Promise<Buffer> {
    try {
      // Create mask for torso/body region
      const maskBuffer = await this.createTorsoMask(imageBuffer)

      const prompt = `wearing ${clothingDescription}, professional photo, high quality, realistic fabric, well-fitted, clean and neat, professional appearance`

      const result = await hfClient.withRetry(async () => {
        return await hfClient.inpaintImage({
          inputImage: imageBuffer,
          maskImage: maskBuffer,
          prompt,
          negativePrompt: 'ugly, low quality, poorly fitted, messy, unprofessional',
          numInferenceSteps: 30,
          guidanceScale: 7.5
        })
      })

      return result
    } catch (error: any) {
      console.error('Profession clothing addition failed:', error)
      return imageBuffer
    }
  }

  /**
   * Create mask for torso region
   */
  private async createTorsoMask(imageBuffer: Buffer): Promise<Buffer> {
    const metadata = await sharp(imageBuffer).metadata()
    const width = metadata.width || 512
    const height = metadata.height || 512

    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')

    // Black background
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, width, height)

    // White region for torso (30%-70% height, 35%-65% width)
    ctx.fillStyle = '#FFFFFF'
    const torsoWidth = width * 0.5
    const torsoHeight = height * 0.4
    const torsoX = (width - torsoWidth) / 2
    const torsoY = height * 0.25

    ctx.fillRect(torsoX, torsoY, torsoWidth, torsoHeight)

    return canvas.toBuffer('image/png')
  }

  /**
   * Add profession props/accessories
   * Using inpainting for specific props
   */
  private async addProps(imageBuffer: Buffer, props: string[]): Promise<Buffer> {
    let resultBuffer = imageBuffer

    for (const prop of props) {
      try {
        // Create mask for prop placement (hands/chest area)
        const maskBuffer = await this.createPropMask(imageBuffer, prop)

        const prompt = `holding ${prop}, professional photo, realistic, natural placement, high quality`

        resultBuffer = await hfClient.withRetry(async () => {
          return await hfClient.inpaintImage({
            inputImage: resultBuffer,
            maskImage: maskBuffer,
            prompt,
            negativePrompt: 'unnatural, floating, poorly placed, low quality',
            numInferenceSteps: 25,
            guidanceScale: 7.0
          })
        })

        // Small delay between props
        await this.sleep(500)
      } catch (error: any) {
        console.error(`Failed to add prop ${prop}:`, error)
        // Continue with other props
      }
    }

    return resultBuffer
  }

  /**
   * Create mask for prop placement
   */
  private async createPropMask(imageBuffer: Buffer, prop: string): Promise<Buffer> {
    const metadata = await sharp(imageBuffer).metadata()
    const width = metadata.width || 512
    const height = metadata.height || 512

    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')

    // Black background
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, width, height)

    // White region based on prop type
    ctx.fillStyle = '#FFFFFF'

    // Different placement for different props
    if (prop.includes('stethoscope') || prop.includes('badge')) {
      // Chest area
      ctx.fillRect(width * 0.4, height * 0.35, width * 0.2, height * 0.15)
    } else if (prop.includes('hat') || prop.includes('helmet')) {
      // Head area
      ctx.fillRect(width * 0.3, 0, width * 0.4, height * 0.2)
    } else {
      // Hand area (default)
      ctx.fillRect(width * 0.6, height * 0.5, width * 0.25, height * 0.2)
    }

    return canvas.toBuffer('image/png')
  }

  /**
   * Adjust background to match profession theme
   * Using background replacement with theme-specific scene
   */
  private async adjustBackgroundForTheme(imageBuffer: Buffer, backgroundDescription: string): Promise<Buffer> {
    try {
      // Generate profession-specific background
      const backgroundBuffer = await hfClient.withRetry(async () => {
        return await hfClient.textToImage({
          prompt: `${backgroundDescription}, professional photography, high quality, soft focus, blurred background, 8k`,
          negativePrompt: 'people, faces, text, watermark, low quality, cluttered',
          width: 1024,
          height: 1024,
          numInferenceSteps: 30,
          guidanceScale: 7.0
        })
      })

      // Simple composition (in production, use proper background removal)
      const metadata = await sharp(imageBuffer).metadata()
      const resizedBg = await sharp(backgroundBuffer)
        .resize(metadata.width!, metadata.height!, { fit: 'cover' })
        .blur(3) // Blur background slightly
        .toBuffer()

      // Composite original over blurred background
      const result = await sharp(resizedBg)
        .composite([{
          input: imageBuffer,
          blend: 'over'
        }])
        .toBuffer()

      return result
    } catch (error: any) {
      console.error('Background adjustment failed:', error)
      return imageBuffer
    }
  }

  /**
   * Batch apply themes
   */
  async batchApplyThemes(params: {
    poses: Array<{ id: string, buffer: Buffer }>
    theme: string
    onProgress?: (current: number, total: number) => void
  }): Promise<Array<{ id: string, buffer: Buffer, success: boolean }>> {
    const results: Array<{ id: string, buffer: Buffer, success: boolean }> = []

    for (let i = 0; i < params.poses.length; i++) {
      const pose = params.poses[i]

      try {
        const themed = await this.applyProfessionTheme({
          generatedPoseBuffer: pose.buffer,
          theme: params.theme
        })

        results.push({
          id: pose.id,
          buffer: themed,
          success: true
        })

        if (params.onProgress) {
          params.onProgress(i + 1, params.poses.length)
        }
      } catch (error: any) {
        console.error(`Failed to apply theme to pose ${pose.id}:`, error)
        results.push({
          id: pose.id,
          buffer: pose.buffer,
          success: false
        })
      }

      // Delay between poses
      if (i < params.poses.length - 1) {
        await this.sleep(1000)
      }
    }

    return results
  }

  /**
   * Get available profession themes
   */
  getAvailableThemes(): Array<{ id: string, name: string, description: string }> {
    return [
      { id: 'doctor', name: 'Doctor', description: 'Medical professional with white coat and stethoscope' },
      { id: 'pilot', name: 'Pilot', description: 'Aviation pilot with uniform and cap' },
      { id: 'chef', name: 'Chef', description: 'Professional chef with white coat and hat' },
      { id: 'teacher', name: 'Teacher', description: 'Professional educator in classroom setting' },
      { id: 'nurse', name: 'Nurse', description: 'Healthcare nurse in medical scrubs' },
      { id: 'engineer', name: 'Engineer', description: 'Engineer with safety gear and hard hat' },
      { id: 'lawyer', name: 'Lawyer', description: 'Legal professional in business suit' },
      { id: 'scientist', name: 'Scientist', description: 'Research scientist in lab coat' },
      { id: 'firefighter', name: 'Firefighter', description: 'Firefighter in protective gear' },
      { id: 'police', name: 'Police Officer', description: 'Law enforcement officer in uniform' },
      { id: 'architect', name: 'Architect', description: 'Architect with plans and designs' },
      { id: 'photographer', name: 'Photographer', description: 'Professional photographer with camera' }
    ]
  }

  /**
   * Estimate theme application time
   */
  estimateThemeTime(poseCount: number): number {
    return poseCount * 30 // 30 seconds per pose (clothing + props + background)
  }

  /**
   * Helper: Sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Singleton instance
export const themeProcessorService = new ThemeProcessorService()

// Export class
export default ThemeProcessorService
