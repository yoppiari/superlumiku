import Tesseract, { Worker } from 'tesseract.js'
import type { TextBox } from '../../types'

let worker: Worker | null = null

export class TesseractService {
  /**
   * Initialize Tesseract worker
   */
  async initialize(): Promise<void> {
    if (worker) return

    worker = await Tesseract.createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${(m.progress * 100).toFixed(1)}%`)
        }
      },
    })
  }

  /**
   * Detect text in image
   */
  async detectText(imagePath: string, options?: { psm?: number }): Promise<TextBox[]> {
    await this.initialize()

    if (!worker) {
      throw new Error('Tesseract worker not initialized')
    }

    // Set PSM (Page Segmentation Mode)
    if (options?.psm) {
      await worker.setParameters({
        tessedit_pageseg_mode: options.psm.toString(),
      })
    }

    const {
      data: { words },
    } = await worker.recognize(imagePath)

    const textBoxes: TextBox[] = words
      .filter((word) => word.confidence > 60) // Filter low confidence
      .map((word, index) => ({
        id: `text_${index + 1}`,
        text: word.text,
        confidence: word.confidence,
        bbox: {
          x: word.bbox.x0,
          y: word.bbox.y0,
          width: word.bbox.x1 - word.bbox.x0,
          height: word.bbox.y1 - word.bbox.y0,
        },
      }))

    return textBoxes
  }

  /**
   * Group nearby words into text blocks
   */
  groupTextBlocks(textBoxes: TextBox[], maxDistance: number = 50): TextBox[] {
    if (textBoxes.length === 0) return []

    const blocks: TextBox[] = []
    const used = new Set<number>()

    for (let i = 0; i < textBoxes.length; i++) {
      if (used.has(i)) continue

      const block = { ...textBoxes[i] }
      used.add(i)

      // Find nearby text boxes
      for (let j = i + 1; j < textBoxes.length; j++) {
        if (used.has(j)) continue

        const distance = this.calculateDistance(block.bbox, textBoxes[j].bbox)

        if (distance < maxDistance) {
          // Merge boxes
          block.text += ' ' + textBoxes[j].text
          block.bbox = this.mergeBboxes(block.bbox, textBoxes[j].bbox)
          block.confidence = (block.confidence + textBoxes[j].confidence) / 2
          used.add(j)
        }
      }

      blocks.push(block)
    }

    return blocks
  }

  /**
   * Calculate distance between two bounding boxes
   */
  private calculateDistance(
    bbox1: TextBox['bbox'],
    bbox2: TextBox['bbox']
  ): number {
    const dx = Math.abs(bbox1.x + bbox1.width / 2 - (bbox2.x + bbox2.width / 2))
    const dy = Math.abs(bbox1.y + bbox1.height / 2 - (bbox2.y + bbox2.height / 2))
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * Merge two bounding boxes
   */
  private mergeBboxes(bbox1: TextBox['bbox'], bbox2: TextBox['bbox']): TextBox['bbox'] {
    const x = Math.min(bbox1.x, bbox2.x)
    const y = Math.min(bbox1.y, bbox2.y)
    const x2 = Math.max(bbox1.x + bbox1.width, bbox2.x + bbox2.width)
    const y2 = Math.max(bbox1.y + bbox1.height, bbox2.y + bbox2.height)

    return {
      x,
      y,
      width: x2 - x,
      height: y2 - y,
    }
  }

  /**
   * Terminate worker
   */
  async terminate(): Promise<void> {
    if (worker) {
      await worker.terminate()
      worker = null
    }
  }
}

export const tesseractService = new TesseractService()
