import prisma from '../../../db/client'
import { AvatarGenerationRequest, AvatarGeneration, AvatarGenerationStats } from '../types'
import { poseTemplateService } from '../../../services/pose-template.service'
import path from 'path'
import fs from 'fs/promises'

export class AvatarService {
  /**
   * Create new avatar generation request
   */
  async createGeneration(
    userId: string,
    inputImagePath: string,
    request: AvatarGenerationRequest
  ): Promise<AvatarGeneration> {
    // Verify pose template exists
    const poseTemplate = await poseTemplateService.getPoseTemplateById(request.poseTemplateId)
    if (!poseTemplate) {
      throw new Error('Pose template not found')
    }

    // Calculate credits
    let creditUsed = 5 // Base cost
    if (request.quality === 'hd') {
      creditUsed += 2
    }
    if (request.priority) {
      creditUsed += 3
    }

    // Create generation record
    const generation = await prisma.avatarGeneration.create({
      data: {
        userId,
        poseTemplateId: request.poseTemplateId,
        inputImageUrl: inputImagePath,
        quality: request.quality || 'sd',
        status: 'pending',
        creditUsed,
      },
    })

    return generation as AvatarGeneration
  }

  /**
   * Get generation by ID
   */
  async getGeneration(id: string, userId: string): Promise<AvatarGeneration | null> {
    const generation = await prisma.avatarGeneration.findFirst({
      where: { id, userId },
    })

    return generation as AvatarGeneration | null
  }

  /**
   * Get all generations for user
   */
  async getUserGenerations(
    userId: string,
    limit = 20,
    offset = 0
  ): Promise<{ data: AvatarGeneration[]; total: number }> {
    const [generations, total] = await Promise.all([
      prisma.avatarGeneration.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.avatarGeneration.count({
        where: { userId },
      }),
    ])

    return {
      data: generations as AvatarGeneration[],
      total,
    }
  }

  /**
   * Update generation status
   */
  async updateGenerationStatus(
    id: string,
    status: 'processing' | 'completed' | 'failed',
    outputImageUrl?: string,
    errorMessage?: string
  ): Promise<void> {
    await prisma.avatarGeneration.update({
      where: { id },
      data: {
        status,
        ...(outputImageUrl && { outputImageUrl }),
        ...(errorMessage && { errorMessage }),
        ...(status === 'completed' && { completedAt: new Date() }),
      },
    })
  }

  /**
   * Get statistics
   */
  async getStats(userId: string): Promise<AvatarGenerationStats> {
    const generations = await prisma.avatarGeneration.findMany({
      where: { userId },
    })

    const completed = generations.filter((g) => g.status === 'completed')
    const failed = generations.filter((g) => g.status === 'failed')

    const totalProcessingTime = completed.reduce((acc, g) => {
      if (g.completedAt) {
        return acc + (g.completedAt.getTime() - g.createdAt.getTime())
      }
      return acc
    }, 0)

    const averageProcessingTime = completed.length > 0 ? totalProcessingTime / completed.length : 0

    const totalCreditsUsed = generations.reduce((acc, g) => acc + g.creditUsed, 0)

    return {
      totalGenerations: generations.length,
      completedGenerations: completed.length,
      failedGenerations: failed.length,
      averageProcessingTime: Math.round(averageProcessingTime / 1000), // Convert to seconds
      totalCreditsUsed,
    }
  }

  /**
   * Delete generation
   */
  async deleteGeneration(id: string, userId: string): Promise<void> {
    const generation = await prisma.avatarGeneration.findFirst({
      where: { id, userId },
    })

    if (!generation) {
      throw new Error('Generation not found')
    }

    // Delete output file if exists
    if (generation.outputImageUrl) {
      const outputPath = path.join(process.cwd(), generation.outputImageUrl)
      try {
        await fs.unlink(outputPath)
      } catch (error) {
        console.error('Error deleting output file:', error)
      }
    }

    // Delete input file
    const inputPath = path.join(process.cwd(), generation.inputImageUrl)
    try {
      await fs.unlink(inputPath)
    } catch (error) {
      console.error('Error deleting input file:', error)
    }

    // Delete record
    await prisma.avatarGeneration.delete({
      where: { id },
    })
  }

  /**
   * Process avatar generation (placeholder for AI integration)
   * TODO: Integrate with ControlNet/OpenPose AI model
   */
  async processGeneration(generationId: string): Promise<void> {
    try {
      // Update status to processing
      await this.updateGenerationStatus(generationId, 'processing')

      // TODO: Call AI model API
      // For now, simulate processing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simulate success
      const outputUrl = `/uploads/avatar-generator/${generationId}/output.jpg`
      await this.updateGenerationStatus(generationId, 'completed', outputUrl)
    } catch (error: any) {
      await this.updateGenerationStatus(generationId, 'failed', undefined, error.message)
    }
  }
}

export const avatarService = new AvatarService()
