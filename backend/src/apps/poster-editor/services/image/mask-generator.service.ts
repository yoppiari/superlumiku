import sharp from 'sharp'
import type { TextBox } from '../../types'

export class MaskGeneratorService {
  /**
   * Generate mask image for inpainting
   * White areas = areas to inpaint, Black areas = areas to preserve
   */
  async generateMask(
    originalImagePath: string,
    textBoxes: TextBox[],
    options?: {
      padding?: number
      blur?: number
    }
  ): Promise<Buffer> {
    const padding = options?.padding || 5
    const blur = options?.blur || 2

    // Get original image dimensions
    const metadata = await sharp(originalImagePath).metadata()
    const width = metadata.width || 0
    const height = metadata.height || 0

    // Create black canvas
    const canvas = await sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 0, g: 0, b: 0 },
      },
    }).png()

    // Generate SVG with white rectangles for text areas
    const rectangles = textBoxes
      .map((box) => {
        const x = Math.max(0, box.bbox.x - padding)
        const y = Math.max(0, box.bbox.y - padding)
        const w = box.bbox.width + padding * 2
        const h = box.bbox.height + padding * 2

        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="white"/>`
      })
      .join('\n')

    const svg = `
      <svg width="${width}" height="${height}">
        ${rectangles}
      </svg>
    `

    // Composite white rectangles onto black canvas
    const maskBuffer = await canvas
      .composite([
        {
          input: Buffer.from(svg),
          top: 0,
          left: 0,
        },
      ])
      .blur(blur) // Slight blur for smoother inpainting
      .png()
      .toBuffer()

    return maskBuffer
  }

  /**
   * Generate mask for specific text boxes (selective removal)
   */
  async generateSelectiveMask(
    originalImagePath: string,
    textBoxIds: string[],
    allTextBoxes: TextBox[],
    options?: {
      padding?: number
      blur?: number
    }
  ): Promise<Buffer> {
    const selectedBoxes = allTextBoxes.filter((box) => textBoxIds.includes(box.id))
    return this.generateMask(originalImagePath, selectedBoxes, options)
  }

  /**
   * Expand mask to cover connected regions (for better inpainting)
   */
  async expandMask(maskBuffer: Buffer, iterations: number = 2): Promise<Buffer> {
    let result = maskBuffer

    for (let i = 0; i < iterations; i++) {
      result = await sharp(result)
        .convolve({
          width: 3,
          height: 3,
          kernel: [0, 1, 0, 1, 1, 1, 0, 1, 0],
        })
        .threshold(128) // Convert to binary
        .toBuffer()
    }

    return result
  }
}

export const maskGeneratorService = new MaskGeneratorService()
