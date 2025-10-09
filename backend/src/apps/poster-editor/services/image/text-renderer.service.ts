import { createCanvas, loadImage, registerFont } from 'canvas'
import type { TextEdit } from '../../types'
import path from 'path'

const FONTS_DIR = process.env.FONTS_DIR || './fonts'

export class TextRendererService {
  /**
   * Register custom fonts
   */
  async registerFonts(): Promise<void> {
    // Register common fonts (you'll need to add font files to fonts/ directory)
    try {
      registerFont(path.join(FONTS_DIR, 'Arial.ttf'), { family: 'Arial' })
      registerFont(path.join(FONTS_DIR, 'Arial-Bold.ttf'), {
        family: 'Arial',
        weight: 'bold',
      })
      // Add more fonts as needed
    } catch (error) {
      console.warn('Some fonts could not be loaded, using system defaults')
    }
  }

  /**
   * Render text edits onto transparent canvas
   */
  async renderTextLayer(
    width: number,
    height: number,
    edits: TextEdit[]
  ): Promise<Buffer> {
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')

    // Transparent background
    ctx.clearRect(0, 0, width, height)

    for (const edit of edits) {
      const { text, position, font } = edit

      // Set font properties
      ctx.font = `${font.weight} ${font.size}px ${font.family}`
      ctx.fillStyle = font.color
      ctx.textBaseline = 'top'

      // Draw stroke if specified
      if (font.stroke && font.strokeWidth) {
        ctx.strokeStyle = font.stroke
        ctx.lineWidth = font.strokeWidth
        ctx.strokeText(text, position.x, position.y)
      }

      // Draw text
      ctx.fillText(text, position.x, position.y)
    }

    return canvas.toBuffer('image/png')
  }

  /**
   * Render single text with auto-sizing
   */
  async renderAutoSizedText(
    text: string,
    bbox: { width: number; height: number },
    options: {
      fontFamily?: string
      color?: string
      maxFontSize?: number
      minFontSize?: number
    } = {}
  ): Promise<{ buffer: Buffer; fontSize: number }> {
    const fontFamily = options.fontFamily || 'Arial'
    const color = options.color || '#000000'
    const maxFontSize = options.maxFontSize || 100
    const minFontSize = options.minFontSize || 12

    // Binary search for optimal font size
    let fontSize = maxFontSize
    const canvas = createCanvas(bbox.width, bbox.height)
    const ctx = canvas.getContext('2d')

    while (fontSize > minFontSize) {
      ctx.font = `${fontSize}px ${fontFamily}`
      const metrics = ctx.measureText(text)

      if (metrics.width <= bbox.width && fontSize <= bbox.height) {
        break
      }

      fontSize -= 2
    }

    // Clear and render with final size
    ctx.clearRect(0, 0, bbox.width, bbox.height)
    ctx.font = `${fontSize}px ${fontFamily}`
    ctx.fillStyle = color
    ctx.textBaseline = 'top'
    ctx.fillText(text, 0, 0)

    return {
      buffer: canvas.toBuffer('image/png'),
      fontSize,
    }
  }

  /**
   * Measure text dimensions
   */
  measureText(
    text: string,
    fontFamily: string,
    fontSize: number
  ): {
    width: number
    height: number
  } {
    const canvas = createCanvas(1, 1)
    const ctx = canvas.getContext('2d')
    ctx.font = `${fontSize}px ${fontFamily}`
    const metrics = ctx.measureText(text)

    return {
      width: metrics.width,
      height: fontSize, // Approximation
    }
  }

  /**
   * Wrap text to fit width
   */
  wrapText(
    text: string,
    maxWidth: number,
    fontFamily: string,
    fontSize: number
  ): string[] {
    const canvas = createCanvas(1, 1)
    const ctx = canvas.getContext('2d')
    ctx.font = `${fontSize}px ${fontFamily}`

    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const metrics = ctx.measureText(testLine)

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }

    if (currentLine) {
      lines.push(currentLine)
    }

    return lines
  }

  /**
   * Get available fonts
   */
  getAvailableFonts(): string[] {
    return [
      'Arial',
      'Arial Black',
      'Impact',
      'Times New Roman',
      'Courier New',
      'Verdana',
      'Georgia',
      'Comic Sans MS',
      'Trebuchet MS',
    ]
  }
}

export const textRendererService = new TextRendererService()
