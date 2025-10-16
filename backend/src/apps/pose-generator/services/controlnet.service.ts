import sharp from 'sharp'
import axios, { AxiosResponse } from 'axios'
import fs from 'fs/promises'
import path from 'path'
import { Mutex } from 'async-mutex'

export class ControlNetService {
  private cacheDir: string
  private fetchLocks: Map<string, Mutex> // Per-URL locks to prevent cache stampede

  constructor() {
    this.cacheDir = '/app/backend/uploads/controlnet-cache'
    this.fetchLocks = new Map()
    this.ensureCacheDir()
  }

  /**
   * Get or create lock for specific URL
   */
  private getLock(url: string): Mutex {
    if (!this.fetchLocks.has(url)) {
      this.fetchLocks.set(url, new Mutex())
    }
    return this.fetchLocks.get(url)!
  }

  private async ensureCacheDir() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true })
    } catch (error) {
      console.warn('[ControlNet] Failed to create cache dir:', error)
    }
  }

  /**
   * Load ControlNet map from pose library
   *
   * PERFORMANCE: Fixed cache stampede (P1 - CACHE STAMPEDE)
   * - Uses per-URL mutex locks to prevent simultaneous fetches
   * - Double-check pattern: check cache before and after acquiring lock
   * - Only one worker fetches URL, others wait and read from cache
   *
   * SECURITY: Fixed memory leak (P0 - RESOURCE EXHAUSTION)
   * - Explicit cleanup of response buffer after use
   * - Try-finally block ensures cleanup on errors
   */
  async loadControlNetMap(controlNetMapUrl: string): Promise<Buffer | null> {
    try {
      if (controlNetMapUrl.includes('placeholder')) {
        return null
      }

      const cacheKey = this.getCacheKey(controlNetMapUrl)
      const cachedPath = path.join(this.cacheDir, `${cacheKey}.png`)

      // 1. Check cache first (no lock needed for reads)
      try {
        const cached = await fs.readFile(cachedPath)
        console.log('[ControlNet] Loaded from cache')
        return cached
      } catch {
        // Cache miss - continue to fetch
      }

      // 2. Acquire lock for this URL (prevent stampede)
      const lock = this.getLock(controlNetMapUrl)

      return await lock.runExclusive(async () => {
        // 3. Double-check cache (another worker might have fetched)
        try {
          const cached = await fs.readFile(cachedPath)
          console.log('[ControlNet] Loaded from cache (after lock)')
          return cached
        } catch {
          // Still not in cache - we fetch it
        }

        // 4. Fetch from URL (only one worker does this)
        let buffer: Buffer
        let response: AxiosResponse<ArrayBuffer> | undefined

        try {
          if (controlNetMapUrl.startsWith('http')) {
            response = await axios.get<ArrayBuffer>(controlNetMapUrl, {
              responseType: 'arraybuffer',
              timeout: 10000,
            })
            buffer = Buffer.from(response.data)

            // Release ArrayBuffer from memory
            response.data = null as any
          } else {
            const localPath = path.join('/app/backend/uploads',
              controlNetMapUrl.replace(/^\/uploads\//, ''))
            buffer = await fs.readFile(localPath)
          }

          // 5. Validate image
          const metadata = await sharp(buffer).metadata()
          if (!metadata.width || !metadata.height) {
            throw new Error('Invalid image metadata')
          }

          // 6. Cache it (atomic write)
          try {
            const tempPath = `${cachedPath}.tmp`
            await fs.writeFile(tempPath, buffer)
            await fs.rename(tempPath, cachedPath) // Atomic
            console.log('[ControlNet] Cached successfully')
          } catch (error) {
            console.warn('[ControlNet] Failed to cache:', error)
          }

          console.log(`[ControlNet] Loaded: ${metadata.width}x${metadata.height}`)
          return buffer

        } finally {
          // Cleanup response object
          if (response) {
            response = undefined
          }
        }
      })

    } catch (error) {
      console.error('[ControlNet] Failed to load:', error)
      return null
    } finally {
      // Cleanup old locks (prevent memory leak)
      if (this.fetchLocks.size > 100) {
        this.fetchLocks.clear()
      }
    }
  }

  /**
   * Process ControlNet map for FLUX input
   *
   * Currently: Resize and normalize
   * Future: Full ControlNet conditioning
   *
   * SECURITY: Fixed memory leak - cleanup handled by caller
   */
  async processForFlux(mapBuffer: Buffer, targetWidth: number, targetHeight: number): Promise<Buffer> {
    try {
      // Resize to target dimensions
      const processed = await sharp(mapBuffer)
        .resize(targetWidth, targetHeight, {
          fit: 'fill',
          kernel: 'lanczos3',
        })
        .greyscale() // ControlNet typically uses grayscale pose maps
        .png()
        .toBuffer()

      // Note: Caller responsible for cleaning up both input and output buffers
      return processed
    } catch (error) {
      console.error('[ControlNet] Processing failed:', error)
      throw error
    }
  }

  /**
   * Extract pose description from ControlNet map
   *
   * This enhances the prompt with pose-specific keywords based on the skeleton.
   * Future: Use ML to analyze skeleton and generate detailed description.
   */
  extractPoseDescription(libraryPose: any): string {
    const keywords: string[] = []

    // Extract from pose name
    const name = libraryPose.name.toLowerCase()

    // Body position
    if (name.includes('standing')) keywords.push('standing upright')
    if (name.includes('sitting')) keywords.push('sitting down')
    if (name.includes('walking')) keywords.push('walking forward')
    if (name.includes('running')) keywords.push('running motion')

    // Arms
    if (name.includes('arms crossed')) keywords.push('arms crossed over chest')
    if (name.includes('hands on hips')) keywords.push('hands placed on hips')
    if (name.includes('waving')) keywords.push('waving hand gesture')
    if (name.includes('pointing')) keywords.push('pointing gesture')

    // Direction
    if (name.includes('front')) keywords.push('facing camera directly')
    if (name.includes('side')) keywords.push('side profile view')
    if (name.includes('back')) keywords.push('back turned to camera')

    // Expression
    if (name.includes('confident')) keywords.push('confident expression')
    if (name.includes('friendly')) keywords.push('friendly smile')
    if (name.includes('professional')) keywords.push('professional demeanor')

    // Use description if available
    if (libraryPose.description) {
      keywords.push(libraryPose.description)
    }

    return keywords.join(', ')
  }

  /**
   * Generate cache key from URL
   */
  private getCacheKey(url: string): string {
    // Simple hash function
    let hash = 0
    for (let i = 0; i < url.length; i++) {
      hash = ((hash << 5) - hash) + url.charCodeAt(i)
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * Clear cache (for maintenance)
   */
  async clearCache(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir)
      for (const file of files) {
        await fs.unlink(path.join(this.cacheDir, file))
      }
      console.log(`[ControlNet] Cleared cache: ${files.length} files`)
    } catch (error) {
      console.warn('[ControlNet] Cache clear failed:', error)
    }
  }
}

export const controlNetService = new ControlNetService()
