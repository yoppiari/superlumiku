import prisma from '../../../db/client'
import { PoseGeneration, StartGenerationRequest, PoseGeneratorStats } from '../types'
import { controlNetService } from './controlnet.service'
import { fashionEnhancementService } from './fashion-enhancement.service'
import { backgroundService } from './background.service'
import { themeProcessorService } from './theme-processor.service'
import fs from 'fs/promises'
import path from 'path'

export class PoseGenerationService {
  /**
   * Start new pose generation
   */
  async startGeneration(
    userId: string,
    request: StartGenerationRequest
  ): Promise<PoseGeneration> {
    // Verify avatar exists
    const avatar = await prisma.avatar.findFirst({
      where: { id: request.avatarId, userId }
    })

    if (!avatar) {
      throw new Error('Avatar not found')
    }

    // Create generation record
    const generation = await prisma.poseGeneration.create({
      data: {
        userId,
        avatarId: request.avatarId,
        totalPoses: request.selectedPoseIds.length,
        selectedPoseIds: JSON.stringify(request.selectedPoseIds),
        batchSize: request.selectedPoseIds.length,
        quality: request.quality || 'sd',
        fashionSettings: request.fashionSettings ? JSON.stringify(request.fashionSettings) : null,
        backgroundSettings: request.backgroundSettings ? JSON.stringify(request.backgroundSettings) : null,
        professionTheme: request.professionTheme || null,
        provider: 'modelslab',
        modelId: 'controlnet-sd15',
        basePrompt: this.buildPrompt(request),
        negativePrompt: 'ugly, blurry, low quality, distorted, deformed',
        status: 'pending',
        progress: 0,
      }
    })

    // Start processing in background (don't await)
    this.processGeneration(generation.id).catch(err => {
      console.error(`Generation ${generation.id} failed:`, err)
    })

    return generation as PoseGeneration
  }

  /**
   * Build AI prompt from request
   */
  private buildPrompt(request: StartGenerationRequest): string {
    let prompt = 'professional photo, high quality, detailed'

    if (request.fashionSettings) {
      if (request.fashionSettings.hijab) {
        prompt += `, wearing ${request.fashionSettings.hijab.style} hijab in ${request.fashionSettings.hijab.color}`
      }
      if (request.fashionSettings.outfit) {
        prompt += `, ${request.fashionSettings.outfit}`
      }
    }

    if (request.professionTheme) {
      prompt += `, as ${request.professionTheme}`
    }

    if (request.quality === 'hd') {
      prompt += ', 4k, sharp, ultra detailed'
    }

    return prompt
  }

  /**
   * Process generation (background task)
   */
  private async processGeneration(generationId: string): Promise<void> {
    try {
      const generation = await prisma.poseGeneration.findUnique({
        where: { id: generationId }
      })

      if (!generation) return

      // Update to processing
      await prisma.poseGeneration.update({
        where: { id: generationId },
        data: { status: 'processing' }
      })

      const poseIds = JSON.parse(generation.selectedPoseIds) as string[]
      let successCount = 0

      // Load avatar data
      const avatar = await prisma.avatar.findUnique({
        where: { id: generation.avatarId }
      })

      if (!avatar) {
        throw new Error('Avatar not found')
      }

      // Create output directory
      const outputDir = path.join(process.cwd(), 'uploads', 'pose-generator', generationId)
      await fs.mkdir(outputDir, { recursive: true })

      for (let i = 0; i < poseIds.length; i++) {
        const poseId = poseIds[i]
        const startTime = Date.now()

        try {
          // Load pose template
          const poseTemplate = await prisma.poseTemplate.findUnique({
            where: { id: poseId }
          })

          if (!poseTemplate) {
            throw new Error(`Pose template ${poseId} not found`)
          }

          // ⭐ PHASE 1: ControlNet Pose Generation
          console.log(`[1/4] Generating pose ${i + 1}/${poseIds.length} with ControlNet...`)

          let resultBuffer = await controlNetService.generatePose({
            avatarImagePath: avatar.baseImageUrl,
            poseKeypoints: poseTemplate.keypointsJson,
            prompt: generation.basePrompt,
            negativePrompt: generation.negativePrompt || undefined,
            quality: generation.quality as 'sd' | 'hd',
          })

          // ⭐ PHASE 3: Fashion Enhancement (if enabled)
          if (generation.fashionSettings) {
            console.log(`[2/4] Applying fashion enhancements...`)
            try {
              const fashionSettings = typeof generation.fashionSettings === 'string'
                ? JSON.parse(generation.fashionSettings)
                : generation.fashionSettings

              resultBuffer = await fashionEnhancementService.addFashionItems({
                generatedPoseBuffer: resultBuffer,
                fashionSettings
              })
            } catch (error: any) {
              console.error('Fashion enhancement failed:', error)
              // Continue with original result
            }
          }

          // ⭐ PHASE 4: Background Replacement (if enabled)
          if (generation.backgroundSettings) {
            console.log(`[3/4] Replacing background...`)
            try {
              const backgroundSettings = typeof generation.backgroundSettings === 'string'
                ? JSON.parse(generation.backgroundSettings)
                : generation.backgroundSettings

              resultBuffer = await backgroundService.replaceBackground({
                generatedPoseBuffer: resultBuffer,
                backgroundSettings
              })
            } catch (error: any) {
              console.error('Background replacement failed:', error)
              // Continue with original result
            }
          }

          // ⭐ PHASE 4: Profession Theme (if enabled)
          if (generation.professionTheme) {
            console.log(`[4/4] Applying profession theme: ${generation.professionTheme}`)
            try {
              resultBuffer = await themeProcessorService.applyProfessionTheme({
                generatedPoseBuffer: resultBuffer,
                theme: generation.professionTheme
              })
            } catch (error: any) {
              console.error('Theme application failed:', error)
              // Continue with original result
            }
          }

          // Save final generated image
          const outputFileName = `pose_${i}_${Date.now()}.jpg`
          const outputPath = path.join(outputDir, outputFileName)
          await fs.writeFile(outputPath, resultBuffer)

          const outputUrl = `/uploads/pose-generator/${generationId}/${outputFileName}`
          const generationTime = Math.floor((Date.now() - startTime) / 1000)

          // Create database record
          await prisma.generatedPose.create({
            data: {
              generationId,
              userId: generation.userId,
              avatarId: generation.avatarId,
              poseTemplateId: poseId,
              prompt: generation.basePrompt,
              negativePrompt: generation.negativePrompt,
              outputUrl,
              success: true,
              generationTime,
              provider: 'huggingface',
              qualityScore: 0.85, // Default quality score
            }
          })

          successCount++

          console.log(`✓ Pose ${i + 1}/${poseIds.length} generated in ${generationTime}s`)

          // Update progress
          const progress = Math.round(((i + 1) / poseIds.length) * 100)
          await prisma.poseGeneration.update({
            where: { id: generationId },
            data: {
              progress,
              successfulPoses: successCount
            }
          })

        } catch (error: any) {
          console.error(`Failed to generate pose ${poseId}:`, error)

          // Create failed pose record
          await prisma.generatedPose.create({
            data: {
              generationId,
              userId: generation.userId,
              avatarId: generation.avatarId,
              poseTemplateId: poseId,
              prompt: generation.basePrompt,
              negativePrompt: generation.negativePrompt,
              outputUrl: '', // Empty for failed
              success: false,
              generationTime: Math.floor((Date.now() - startTime) / 1000),
              provider: 'huggingface',
            }
          })

          await prisma.poseGeneration.update({
            where: { id: generationId },
            data: { failedPoses: { increment: 1 } }
          })
        }
      }

      // Mark as completed
      await prisma.poseGeneration.update({
        where: { id: generationId },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      })

      // Increment avatar usage count
      await prisma.avatar.update({
        where: { id: generation.avatarId },
        data: { usageCount: { increment: 1 } }
      })

    } catch (error) {
      console.error(`Generation ${generationId} failed:`, error)
      await prisma.poseGeneration.update({
        where: { id: generationId },
        data: { status: 'failed' }
      })
    }
  }

  /**
   * Get generations for user
   */
  async getUserGenerations(userId: string) {
    return await prisma.poseGeneration.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
  }

  /**
   * Get generation by ID
   */
  async getGeneration(id: string, userId: string) {
    return await prisma.poseGeneration.findFirst({
      where: { id, userId }
    })
  }

  /**
   * Get generated poses for a generation
   */
  async getGeneratedPoses(generationId: string, userId: string) {
    // Verify ownership
    const generation = await this.getGeneration(generationId, userId)
    if (!generation) {
      throw new Error('Generation not found')
    }

    return await prisma.generatedPose.findMany({
      where: { generationId },
      orderBy: { createdAt: 'desc' }
    })
  }

  /**
   * Get stats
   */
  async getStats(userId: string): Promise<PoseGeneratorStats> {
    const generations = await prisma.poseGeneration.findMany({
      where: { userId }
    })

    const completed = generations.filter(g => g.status === 'completed')
    const totalPosesGenerated = generations.reduce((sum, g) => sum + g.successfulPoses, 0)

    const totalAttempts = generations.reduce((sum, g) => sum + g.totalPoses, 0)
    const totalSuccess = generations.reduce((sum, g) => sum + g.successfulPoses, 0)
    const averageSuccessRate = totalAttempts > 0 ? (totalSuccess / totalAttempts) * 100 : 0

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const recentActivity = generations.filter(g => g.createdAt > weekAgo).length

    return {
      totalGenerations: generations.length,
      completedGenerations: completed.length,
      totalPosesGenerated,
      averageSuccessRate: Math.round(averageSuccessRate * 10) / 10,
      recentActivity
    }
  }
}

export const poseGenerationService = new PoseGenerationService()
