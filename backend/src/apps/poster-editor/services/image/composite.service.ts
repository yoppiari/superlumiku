import sharp from 'sharp'

export class CompositeService {
  /**
   * Composite inpainted base with new text layer
   */
  async compositeTextOnBase(
    baseImagePath: string,
    textLayerBuffer: Buffer
  ): Promise<Buffer> {
    const result = await sharp(baseImagePath)
      .composite([
        {
          input: textLayerBuffer,
          top: 0,
          left: 0,
          blend: 'over',
        },
      ])
      .png()
      .toBuffer()

    return result
  }

  /**
   * Composite multiple layers
   */
  async compositeLayers(
    baseImagePath: string,
    layers: Array<{
      buffer: Buffer
      position?: { x: number; y: number }
      blend?: 'over' | 'multiply' | 'screen' | 'overlay'
      opacity?: number
    }>
  ): Promise<Buffer> {
    const composites = layers.map((layer) => ({
      input: layer.buffer,
      top: layer.position?.y || 0,
      left: layer.position?.x || 0,
      blend: layer.blend || 'over',
    }))

    const result = await sharp(baseImagePath)
      .composite(composites as any)
      .png()
      .toBuffer()

    return result
  }

  /**
   * Add watermark
   */
  async addWatermark(
    imageBuffer: Buffer,
    watermarkBuffer: Buffer,
    options?: {
      position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
      opacity?: number
      scale?: number
    }
  ): Promise<Buffer> {
    const position = options?.position || 'bottom-right'
    const opacity = options?.opacity || 0.5
    const scale = options?.scale || 0.1

    // Get image dimensions
    const metadata = await sharp(imageBuffer).metadata()
    const width = metadata.width || 0
    const height = metadata.height || 0

    // Resize watermark
    const watermarkWidth = Math.floor(width * scale)
    const resizedWatermark = await sharp(watermarkBuffer)
      .resize(watermarkWidth)
      .composite([
        {
          input: Buffer.from([255, 255, 255, Math.floor(opacity * 255)]),
          raw: {
            width: 1,
            height: 1,
            channels: 4,
          },
          tile: true,
          blend: 'dest-in',
        },
      ])
      .toBuffer()

    // Calculate position
    const wmMetadata = await sharp(resizedWatermark).metadata()
    const wmWidth = wmMetadata.width || 0
    const wmHeight = wmMetadata.height || 0

    let top = 0
    let left = 0
    const padding = 20

    switch (position) {
      case 'top-left':
        top = padding
        left = padding
        break
      case 'top-right':
        top = padding
        left = width - wmWidth - padding
        break
      case 'bottom-left':
        top = height - wmHeight - padding
        left = padding
        break
      case 'bottom-right':
        top = height - wmHeight - padding
        left = width - wmWidth - padding
        break
      case 'center':
        top = Math.floor((height - wmHeight) / 2)
        left = Math.floor((width - wmWidth) / 2)
        break
    }

    // Composite watermark
    const result = await sharp(imageBuffer)
      .composite([
        {
          input: resizedWatermark,
          top,
          left,
          blend: 'over',
        },
      ])
      .toBuffer()

    return result
  }

  /**
   * Blend two images
   */
  async blendImages(
    image1Buffer: Buffer,
    image2Buffer: Buffer,
    blendMode: 'over' | 'multiply' | 'screen' | 'overlay' = 'over',
    opacity: number = 1.0
  ): Promise<Buffer> {
    const result = await sharp(image1Buffer)
      .composite([
        {
          input: image2Buffer,
          blend: blendMode,
        },
      ])
      .toBuffer()

    return result
  }

  /**
   * Create gradient overlay
   */
  async addGradientOverlay(
    imageBuffer: Buffer,
    gradient: {
      type: 'linear' | 'radial'
      direction?: 'horizontal' | 'vertical' | 'diagonal'
      colors: string[]
      opacity?: number
    }
  ): Promise<Buffer> {
    const metadata = await sharp(imageBuffer).metadata()
    const width = metadata.width || 0
    const height = metadata.height || 0
    const opacity = gradient.opacity || 0.5

    // Generate gradient SVG
    let gradientSvg = ''

    if (gradient.type === 'linear') {
      const direction = gradient.direction || 'vertical'
      let x1 = 0,
        y1 = 0,
        x2 = 0,
        y2 = 0

      switch (direction) {
        case 'horizontal':
          x2 = 100
          break
        case 'vertical':
          y2 = 100
          break
        case 'diagonal':
          x2 = 100
          y2 = 100
          break
      }

      const stops = gradient.colors
        .map((color, i) => {
          const offset = (i / (gradient.colors.length - 1)) * 100
          return `<stop offset="${offset}%" stop-color="${color}" stop-opacity="${opacity}"/>`
        })
        .join('\n')

      gradientSvg = `
        <svg width="${width}" height="${height}">
          <defs>
            <linearGradient id="grad" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
              ${stops}
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grad)"/>
        </svg>
      `
    }

    const result = await sharp(imageBuffer)
      .composite([
        {
          input: Buffer.from(gradientSvg),
          blend: 'over',
        },
      ])
      .toBuffer()

    return result
  }
}

export const compositeService = new CompositeService()
