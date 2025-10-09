import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'
import { createCanvas } from 'canvas'

interface InpaintRequest {
  prompt: string
  initImagePath: string
  maskImageBase64: string
  width?: number
  height?: number
}

interface InpaintJob {
  id: string
  status: 'processing' | 'completed' | 'failed'
  eta?: number
  output?: string[]
  error?: string
}

export class ModelsLabInpaintService {
  private readonly apiKey: string
  private readonly baseUrl = 'https://modelslab.com/api/v6'
  private jobs: Map<string, InpaintJob> = new Map()

  constructor() {
    this.apiKey = process.env.MODELSLAB_API_KEY || ''
    if (!this.apiKey) {
      console.warn('⚠️ MODELSLAB_API_KEY not configured')
    }
  }

  /**
   * Convert image file to base64
   */
  private async imageToBase64(imagePath: string): Promise<string> {
    const buffer = await fs.readFile(imagePath)
    return buffer.toString('base64')
  }

  /**
   * Generate circular mask from coordinates and radius
   * Returns base64 PNG data URL
   */
  generateCircularMask(
    x: number,
    y: number,
    radius: number,
    imageWidth: number,
    imageHeight: number
  ): string {
    // Create canvas with same dimensions as image
    const canvas = createCanvas(imageWidth, imageHeight)
    const ctx = canvas.getContext('2d')

    // Start with transparent background
    ctx.clearRect(0, 0, imageWidth, imageHeight)

    // Draw white circle at specified position
    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()

    // Convert to base64 PNG data URL
    const dataUrl = canvas.toDataURL('image/png')
    return dataUrl
  }

  /**
   * Start inpainting job with ModelsLab API
   */
  async startInpaint(request: InpaintRequest): Promise<string> {
    try {
      // Convert init image to base64
      const initImageBase64 = await this.imageToBase64(request.initImagePath)

      // Prepare request body for ModelsLab API
      const body = {
        key: this.apiKey,
        prompt: request.prompt,
        init_image: `data:image/png;base64,${initImageBase64}`,
        mask_image: request.maskImageBase64, // Already includes data:image/png;base64 prefix
        width: request.width || 1024,
        height: request.height || 1024,
        samples: 1,
        num_inference_steps: 50,
        guidance_scale: 7.5,
        strength: 0.9,
        scheduler: 'UniPCMultistepScheduler',
        seed: null,
        webhook: null,
        track_id: null
      }

      console.log('🎨 Starting ModelsLab inpaint job...')
      const response = await axios.post(
        `${this.baseUrl}/image_editing/inpaint`,
        body,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 60000
        }
      )

      const data = response.data
      console.log('📊 ModelsLab response:', JSON.stringify(data, null, 2))

      // ModelsLab returns different response formats
      if (data.status === 'error') {
        throw new Error(data.message || 'Inpaint job failed')
      }

      // Extract job ID
      const jobId = data.id || data.fetch_result || crypto.randomUUID()

      // Store job
      this.jobs.set(jobId, {
        id: jobId,
        status: 'processing',
        eta: data.eta || 30
      })

      console.log(`✅ Inpaint job started: ${jobId}`)
      return jobId

    } catch (error: any) {
      console.error('❌ ModelsLab inpaint error:', error.response?.data || error.message)
      throw new Error(`Failed to start inpaint: ${error.response?.data?.message || error.message}`)
    }
  }

  /**
   * Check inpainting job status
   */
  async checkStatus(jobId: string): Promise<InpaintJob> {
    try {
      const fetchUrl = `${this.baseUrl}/images/fetch/${jobId}`

      const response = await axios.post(
        fetchUrl,
        { key: this.apiKey },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        }
      )

      const data = response.data

      // Parse status
      let status: 'processing' | 'completed' | 'failed' = 'processing'
      let output: string[] | undefined
      let error: string | undefined

      if (data.status === 'success' && data.output) {
        status = 'completed'
        output = Array.isArray(data.output) ? data.output : [data.output]
      } else if (data.status === 'processing') {
        status = 'processing'
      } else if (data.status === 'error' || data.status === 'failed') {
        status = 'failed'
        error = data.message || data.messege || 'Inpainting failed'
      }

      // Update job
      const job: InpaintJob = {
        id: jobId,
        status,
        eta: data.eta,
        output,
        error
      }

      this.jobs.set(jobId, job)
      return job

    } catch (error: any) {
      console.error('❌ Status check error:', error.message)

      // Return failed status if error
      const failedJob: InpaintJob = {
        id: jobId,
        status: 'failed',
        error: error.message
      }

      this.jobs.set(jobId, failedJob)
      return failedJob
    }
  }

  /**
   * Download inpainted image from URL
   */
  async downloadImage(url: string, outputPath: string): Promise<void> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 60000
      })

      await fs.writeFile(outputPath, response.data)
      console.log(`✅ Image downloaded: ${outputPath}`)
    } catch (error: any) {
      console.error('❌ Download error:', error.message)
      throw new Error(`Failed to download image: ${error.message}`)
    }
  }

  /**
   * Get job from cache
   */
  getJob(jobId: string): InpaintJob | undefined {
    return this.jobs.get(jobId)
  }

  /**
   * Clear completed/failed jobs older than 1 hour
   */
  clearOldJobs() {
    // Simple cleanup - in production, add timestamp tracking
    const toDelete: string[] = []

    for (const [jobId, job] of this.jobs.entries()) {
      if (job.status === 'completed' || job.status === 'failed') {
        toDelete.push(jobId)
      }
    }

    toDelete.forEach(jobId => this.jobs.delete(jobId))
    console.log(`🧹 Cleaned ${toDelete.length} old jobs`)
  }
}

// Singleton instance
export const modelsLabInpaintService = new ModelsLabInpaintService()
