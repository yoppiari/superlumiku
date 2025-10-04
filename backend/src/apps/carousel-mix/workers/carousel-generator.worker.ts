import sharp from 'sharp'
import archiver from 'archiver'
import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'
import { randomBytes } from 'crypto'
import prisma from '../../../db/client'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'
const OUTPUT_DIR = process.env.OUTPUT_DIR || './uploads/outputs'

// Ensure output directory exists
if (!fsSync.existsSync(OUTPUT_DIR)) {
  fsSync.mkdirSync(OUTPUT_DIR, { recursive: true })
  console.log(`✅ Carousel output directory created: ${OUTPUT_DIR}`)
}

interface PositionSettings {
  fontFamily: string
  fontSize: number           // Deprecated - kept for backward compatibility
  fontSizePercent: number    // Font size as % of image height
  fontColor: string
  fontWeight: number
  backgroundColor: string
  textPosition: string
  textAlignment: string
  positionX: number
  positionY: number
  textShadow?: string
  textOutline?: string
  paddingData?: string
}

export class CarouselGeneratorWorker {
  /**
   * Main method: Generate carousel sets
   */
  async generateCarousels(generationId: string): Promise<void> {
    console.log(`🎨 Starting carousel generation: ${generationId}`)

    try {
      // Update status to processing
      await prisma.carouselGeneration.update({
        where: { id: generationId },
        data: { status: 'processing' },
      })

      // Load generation with project data
      const generation = await prisma.carouselGeneration.findUnique({
        where: { id: generationId },
        include: {
          project: {
            include: {
              slides: {
                orderBy: { slidePosition: 'asc' },
              },
              texts: {
                orderBy: { slidePosition: 'asc' },
              },
              positionSettings: {
                orderBy: { slidePosition: 'asc' },
              },
            },
          },
        },
      })

      if (!generation) {
        throw new Error('Generation not found')
      }

      if (!generation.project) {
        throw new Error('Project not found')
      }

      const { project, numSlides, numSetsGenerated } = generation

      console.log(`   Project: ${project.name}`)
      console.log(`   Slides per carousel: ${numSlides}`)
      console.log(`   Sets to generate: ${numSetsGenerated}`)
      console.log(`   Total slides in project: ${project.slides.length}`)
      console.log(`   Total texts in project: ${project.texts.length}`)

      // Validate we have enough data
      if (project.slides.length === 0) {
        throw new Error('No slides found in project')
      }

      // Group slides and texts by position
      const slidesByPosition: { [position: number]: any[] } = {}
      const textsByPosition: { [position: number]: any[] } = {}

      for (const slide of project.slides) {
        if (!slidesByPosition[slide.slidePosition]) {
          slidesByPosition[slide.slidePosition] = []
        }
        slidesByPosition[slide.slidePosition].push(slide)
      }

      for (const text of project.texts) {
        if (!textsByPosition[text.slidePosition]) {
          textsByPosition[text.slidePosition] = []
        }
        textsByPosition[text.slidePosition].push(text)
      }

      console.log(`   Slides by position:`, Object.keys(slidesByPosition).map(k => `${k}:${slidesByPosition[+k].length}`).join(', '))
      console.log(`   Texts by position:`, Object.keys(textsByPosition).map(k => `${k}:${textsByPosition[+k].length}`).join(', '))

      // Generate all carousel sets
      const allSets: string[][] = []

      for (let setIndex = 0; setIndex < numSetsGenerated; setIndex++) {
        console.log(`   📸 Generating set ${setIndex + 1}/${numSetsGenerated}`)
        const carouselPaths = await this.generateSingleSet(
          project,
          slidesByPosition,
          textsByPosition,
          numSlides,
          setIndex,
          generationId
        )
        allSets.push(carouselPaths)
        console.log(`   ✅ Set ${setIndex + 1} complete: ${carouselPaths.length} images`)
      }

      // Create ZIP package
      console.log(`   📦 Creating ZIP package...`)
      const zipPath = await this.createZipPackage(allSets, generationId)
      console.log(`   ✅ ZIP created: ${zipPath}`)

      // Generate thumbnail from first image
      if (allSets.length > 0 && allSets[0].length > 0) {
        try {
          const thumbnailDir = path.join(UPLOAD_DIR, 'carousel-mix', generation.userId, generationId)
          await fs.mkdir(thumbnailDir, { recursive: true })
          const thumbnailPath = path.join(thumbnailDir, 'thumb.jpg')
          const firstImagePath = path.join(process.cwd(), allSets[0][0])
          await sharp(firstImagePath)
            .resize(640, 360, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath)
          console.log(`   📸 Thumbnail generated: thumb.jpg`)
        } catch (error) {
          console.error(`   ⚠️  Thumbnail generation failed:`, error)
        }
      }

      // Update generation status
      await prisma.carouselGeneration.update({
        where: { id: generationId },
        data: {
          status: 'completed',
          outputPath: zipPath,
          outputPaths: JSON.stringify(allSets),
          completedAt: new Date(),
        },
      })

      console.log(`✅ Carousel generation completed: ${generationId}`)
      console.log(`   Generated ${allSets.length} sets with ${allSets[0]?.length || 0} slides each`)
    } catch (error: any) {
      console.error(`❌ Carousel generation failed: ${generationId}`, error.message)
      console.error(error.stack)

      // Update generation status to failed
      await prisma.carouselGeneration.update({
        where: { id: generationId },
        data: {
          status: 'failed',
          errorMessage: error.message,
        },
      })

      throw error
    }
  }

  /**
   * Generate a single carousel set
   */
  private async generateSingleSet(
    project: any,
    slidesByPosition: { [position: number]: any[] },
    textsByPosition: { [position: number]: any[] },
    numSlides: number,
    setIndex: number,
    generationId: string
  ): Promise<string[]> {
    const carouselPaths: string[] = []

    // Generate each position/slide in the carousel
    for (let position = 1; position <= numSlides; position++) {
      // Get slides for this position
      const slidesAtPosition = slidesByPosition[position] || []
      if (slidesAtPosition.length === 0) {
        console.warn(`      ⚠️  No slides at position ${position}, skipping...`)
        continue
      }

      // Select image variation (round-robin based on set index)
      const slideIndex = setIndex % slidesAtPosition.length
      const selectedSlide = slidesAtPosition[slideIndex]

      // Get texts for this position
      const textsAtPosition = textsByPosition[position] || []

      // Get position settings (with defaults if not found)
      const settings = await this.getPositionSettings(project.id, position)

      // Determine output path
      const timestamp = Date.now()
      const randomId = randomBytes(4).toString('hex')
      const outputFilename = `${generationId}_set${setIndex + 1}_pos${position}_${timestamp}_${randomId}.jpg`
      const outputPath = path.join(OUTPUT_DIR, outputFilename)

      // If there are texts, select one and apply overlay
      if (textsAtPosition.length > 0) {
        // Select text variation (round-robin based on set index)
        const textIndex = setIndex % textsAtPosition.length
        const selectedText = textsAtPosition[textIndex]

        console.log(`      Position ${position}: slide ${slideIndex + 1}/${slidesAtPosition.length}, text ${textIndex + 1}/${textsAtPosition.length}`)

        // Apply text overlay
        const imagePath = path.join(UPLOAD_DIR, selectedSlide.filePath)
        await this.applyTextOverlay(imagePath, selectedText.content, settings, outputPath)
      } else {
        // No text, just crop the image to square
        console.log(`      Position ${position}: slide ${slideIndex + 1}/${slidesAtPosition.length} (no text)`)
        const imagePath = path.join(UPLOAD_DIR, selectedSlide.filePath)
        await sharp(imagePath)
          .resize(1080, 1080, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 95 })
          .toFile(outputPath)
      }

      carouselPaths.push(`outputs/${outputFilename}`)
    }

    return carouselPaths
  }

  /**
   * Get position settings with defaults
   */
  private async getPositionSettings(projectId: string, slidePosition: number): Promise<PositionSettings> {
    const settings = await prisma.carouselPositionSettings.findUnique({
      where: {
        projectId_slidePosition: {
          projectId,
          slidePosition,
        },
      },
    })

    // Return settings or defaults
    return {
      fontFamily: settings?.fontFamily || 'Arial',
      fontSize: settings?.fontSize || 32,                    // Deprecated - kept for backward compatibility
      fontSizePercent: settings?.fontSizePercent || 4.5,     // Default 4.5% of image height
      fontColor: settings?.fontColor || '#FFFFFF',
      fontWeight: settings?.fontWeight || 700,
      backgroundColor: settings?.backgroundColor || 'rgba(0, 0, 0, 0.5)',
      textPosition: settings?.textPosition || 'center',
      textAlignment: settings?.textAlignment || 'center',
      positionX: settings?.positionX || 50,
      positionY: settings?.positionY || 50,
      textShadow: settings?.textShadow || undefined,
      textOutline: settings?.textOutline || undefined,
      paddingData: settings?.paddingData || undefined,
    }
  }

  /**
   * Apply text overlay to image using Sharp with SVG text
   */
  private async applyTextOverlay(
    imagePath: string,
    text: string,
    settings: PositionSettings,
    outputPath: string
  ): Promise<void> {
    // Crop image to square 1080x1080 first
    const image = sharp(imagePath)
      .resize(1080, 1080, {
        fit: 'cover',
        position: 'center'
      })

    // Use fixed dimensions for square output
    const width = 1080
    const height = 1080

    // Calculate font size from percentage of image height
    const actualFontSize = (settings.fontSizePercent / 100) * height

    // Calculate text position in pixels
    const textX = (settings.positionX / 100) * width
    const textY = (settings.positionY / 100) * height

    // Map text alignment to SVG text-anchor
    const textAnchor = settings.textAlignment === 'left' ? 'start' :
                       settings.textAlignment === 'right' ? 'end' :
                       'middle'

    // Escape XML special characters in text
    const escapedText = this.escapeXml(text)

    // Parse text shadow if available
    let textShadowFilter = ''
    if (settings.textShadow) {
      try {
        const shadow = JSON.parse(settings.textShadow)
        // SVG filter for text shadow (simplified)
        const shadowColor = shadow.color || 'rgba(0,0,0,0.5)'
        const offsetX = shadow.offsetX || 2
        const offsetY = shadow.offsetY || 2
        const blur = shadow.blur || 4
        textShadowFilter = `filter="drop-shadow(${offsetX}px ${offsetY}px ${blur}px ${shadowColor})"`
      } catch (e) {
        // Ignore invalid JSON
      }
    }

    // Parse text outline if available
    let strokeStyle = ''
    if (settings.textOutline) {
      try {
        const outline = JSON.parse(settings.textOutline)
        strokeStyle = `stroke="${outline.color || '#000000'}" stroke-width="${outline.width || 2}"`
      } catch (e) {
        // Ignore invalid JSON
      }
    }

    // Estimate text width for background box (approximate)
    const estimatedTextWidth = escapedText.length * actualFontSize * 0.6
    const padding = actualFontSize * 0.7  // Proportional padding (70% of font size)
    const borderRadius = actualFontSize * 0.25  // Proportional border radius (25% of font size)

    // Background box dimensions
    const boxWidth = estimatedTextWidth + (padding * 2)
    const boxHeight = actualFontSize + (padding * 1.2)

    // Background box position (centered on text position)
    let boxX = textX
    if (textAnchor === 'middle') {
      boxX = textX - boxWidth / 2
    } else if (textAnchor === 'end') {
      boxX = textX - boxWidth
    }
    const boxY = textY - boxHeight / 2

    // Create SVG with text and background box
    const svg = `
      <svg width="${width}" height="${height}">
        <defs>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=${settings.fontFamily.replace(' ', '+')}:wght@${settings.fontWeight}&amp;display=swap');
          </style>
        </defs>

        <!-- Background box -->
        <rect
          x="${boxX}"
          y="${boxY}"
          width="${boxWidth}"
          height="${boxHeight}"
          fill="${settings.backgroundColor}"
          rx="${borderRadius}"
          ry="${borderRadius}"
        />

        <!-- Text -->
        <text
          x="${textX}"
          y="${textY}"
          font-family="${settings.fontFamily}, Arial, sans-serif"
          font-size="${actualFontSize}"
          font-weight="${settings.fontWeight}"
          fill="${settings.fontColor}"
          text-anchor="${textAnchor}"
          dominant-baseline="middle"
          ${strokeStyle}
          ${textShadowFilter}>
          ${escapedText}
        </text>
      </svg>
    `

    // Debug: Log SVG for troubleshooting
    if (process.env.DEBUG) {
      console.log('Generated SVG:', svg)
    }

    // Composite SVG text onto image
    await image
      .composite([{
        input: Buffer.from(svg),
        top: 0,
        left: 0,
      }])
      .jpeg({ quality: 95 })
      .toFile(outputPath)
  }

  /**
   * Escape XML special characters
   * Important: & must be replaced first to avoid double-escaping
   */
  private escapeXml(text: string): string {
    if (!text) return ''

    // Replace & first to avoid double-escaping
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
      // Also escape any non-ASCII characters that might cause issues
      .replace(/[^\x20-\x7E]/g, (char) => `&#${char.charCodeAt(0)};`)
  }

  /**
   * Create ZIP package containing all carousel sets
   */
  private async createZipPackage(sets: string[][], generationId: string): Promise<string> {
    const timestamp = Date.now()
    const zipFilename = `carousel_${generationId}_${timestamp}.zip`
    const zipPath = path.join(OUTPUT_DIR, zipFilename)

    return new Promise((resolve, reject) => {
      const output = fsSync.createWriteStream(zipPath)
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Maximum compression
      })

      output.on('close', () => {
        console.log(`      ZIP size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`)
        resolve(`outputs/${zipFilename}`)
      })

      archive.on('error', (err) => {
        reject(err)
      })

      archive.pipe(output)

      // Add files to ZIP organized by sets
      sets.forEach((carouselPaths, setIndex) => {
        carouselPaths.forEach((filePath, slideIndex) => {
          const absolutePath = path.join(OUTPUT_DIR, path.basename(filePath))
          const zipEntryName = `set_${setIndex + 1}/slide_${slideIndex + 1}${path.extname(filePath)}`
          archive.file(absolutePath, { name: zipEntryName })
        })
      })

      archive.finalize()
    })
  }
}

// Standalone function to be called from queue or direct invocation
export async function generateCarousels(generationId: string): Promise<void> {
  const worker = new CarouselGeneratorWorker()
  await worker.generateCarousels(generationId)
}
