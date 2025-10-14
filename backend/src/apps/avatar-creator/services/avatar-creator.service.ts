import path from 'path'
import fs from 'fs/promises'
import sharp from 'sharp'
import * as repository from '../repositories/avatar-creator.repository'
import { addAvatarGenerationJob } from '../../../lib/queue'
import {
  validateImageFile,
  generateSecureFilename,
  logSecurityViolation,
} from '../../../utils/file-validation'
import { NotFoundError, ResourceNotFoundError } from '../../../core/errors'
import type {
  AvatarProject,
  Avatar,
  AvatarGeneration,
  CreateProjectRequest,
  UpdateProjectRequest,
  UploadAvatarRequest,
  UpdateAvatarRequest,
  TrackUsageRequest,
  GenerateAvatarRequest,
  PersonaData,
  VisualAttributes,
} from '../types'

/**
 * Avatar Creator Service
 *
 * Business logic layer for avatar creation and management
 * Handles file processing, validation, and orchestration
 */

class AvatarCreatorService {
  private uploadBasePath: string

  constructor() {
    this.uploadBasePath = path.join(process.cwd(), 'uploads', 'avatar-creator')
  }

  // ========================================
  // Project Management
  // ========================================

  async getProjects(userId: string): Promise<AvatarProject[]> {
    return repository.findProjectsByUserId(userId)
  }

  async getProjectById(projectId: string, userId: string): Promise<AvatarProject> {
    const project = await repository.findProjectById(projectId, userId)

    if (!project) {
      throw new ResourceNotFoundError('Project', projectId)
    }

    return project
  }

  async createProject(userId: string, data: CreateProjectRequest): Promise<AvatarProject> {
    return repository.createProject({
      userId,
      name: data.name,
      description: data.description,
    })
  }

  async updateProject(
    projectId: string,
    userId: string,
    data: UpdateProjectRequest
  ): Promise<AvatarProject> {
    // Verify ownership
    await this.getProjectById(projectId, userId)

    return repository.updateProject(projectId, userId, data)
  }

  async deleteProject(projectId: string, userId: string): Promise<void> {
    // Verify ownership
    const project = await this.getProjectById(projectId, userId)

    // Delete all avatar files
    for (const avatar of project.avatars || []) {
      try {
        await this.deleteAvatarFiles(avatar)
      } catch (error) {
        console.error(`Failed to delete files for avatar ${avatar.id}:`, error)
        // Continue deletion even if file cleanup fails
      }
    }

    // Delete from database (cascade will handle avatars)
    await repository.deleteProject(projectId, userId)
  }

  // ========================================
  // Avatar - Upload
  // ========================================

  async uploadAvatar(
    projectId: string,
    userId: string,
    file: File,
    data: UploadAvatarRequest
  ): Promise<Avatar> {
    // Verify project exists and user owns it
    await this.getProjectById(projectId, userId)

    // SECURITY: Validate file with comprehensive security checks
    // This replaces the vulnerable validateImageFile() method
    const validated = await validateImageFile(file, {
      maxSizeBytes: 10 * 1024 * 1024, // 10MB
      minWidth: 256,
      minHeight: 256,
      maxWidth: 4096,
      maxHeight: 4096,
    })

    // Log validation success for monitoring
    console.log(`[AVATAR_UPLOAD] User ${userId} uploaded valid image`, {
      dimensions: `${validated.metadata.width}x${validated.metadata.height}`,
      format: validated.metadata.format,
      size: validated.metadata.size,
    })

    // Process and save file using validated buffer and secure filename
    const { imagePath, thumbnailPath } = await this.saveImageWithThumbnail(
      userId,
      validated.buffer,
      validated.sanitizedFilename
    )

    // Create avatar record
    const avatar = await repository.createAvatar({
      userId,
      projectId,
      name: data.name,
      baseImageUrl: imagePath,
      thumbnailUrl: thumbnailPath,
      sourceType: 'uploaded',
      // Persona
      personaName: data.personaName,
      personaAge: data.personaAge,
      personaPersonality: data.personaPersonality
        ? JSON.stringify(data.personaPersonality)
        : undefined,
      personaBackground: data.personaBackground,
      // Visual attributes
      gender: data.gender,
      ageRange: data.ageRange,
      ethnicity: data.ethnicity,
      bodyType: data.bodyType,
      hairStyle: data.hairStyle,
      hairColor: data.hairColor,
      eyeColor: data.eyeColor,
      skinTone: data.skinTone,
      style: data.style,
    })

    return avatar
  }

  // ========================================
  // Avatar - AI Generation
  // ========================================

  async generateAvatar(
    projectId: string,
    userId: string,
    data: GenerateAvatarRequest,
    creditCost = 10 // Default cost for text-to-image generation
  ): Promise<AvatarGeneration> {
    // Verify project exists and user owns it
    await this.getProjectById(projectId, userId)

    // Create generation record
    const generation = await repository.createGeneration({
      userId,
      projectId,
      prompt: data.prompt,
      options: JSON.stringify({
        width: data.width,
        height: data.height,
        seed: data.seed,
      }),
    })

    // Prepare job data
    const jobData = {
      generationId: generation.id,
      userId,
      projectId,
      prompt: data.prompt,
      options: {
        width: data.width,
        height: data.height,
        seed: data.seed,
      },
      metadata: {
        name: data.name,
        sourceType: 'text_to_image' as const,
        persona: data.personaName || data.personaAge || data.personaPersonality || data.personaBackground
          ? {
              name: data.personaName,
              age: data.personaAge,
              personality: data.personaPersonality,
              background: data.personaBackground,
            }
          : undefined,
        attributes: data.gender || data.ageRange || data.ethnicity || data.style
          ? {
              gender: data.gender,
              ageRange: data.ageRange,
              ethnicity: data.ethnicity,
              style: data.style,
            }
          : undefined,
        creditCost, // Pass credit cost for accurate refunds on failure
      },
    }

    // Add to queue for background processing
    await addAvatarGenerationJob(jobData)

    return generation
  }

  async getGeneration(generationId: string, userId: string): Promise<AvatarGeneration> {
    const generation = await repository.findGenerationById(generationId)

    if (!generation) {
      throw new ResourceNotFoundError('Generation', generationId)
    }

    if (generation.userId !== userId) {
      throw new ResourceNotFoundError('Generation', generationId)
    }

    return generation
  }

  // ========================================
  // Avatar - Management
  // ========================================

  async getAvatar(avatarId: string, userId: string): Promise<Avatar> {
    const avatar = await repository.findAvatarById(avatarId, userId)

    if (!avatar) {
      throw new ResourceNotFoundError('Avatar', avatarId)
    }

    return avatar
  }

  async getAvatarsByProject(projectId: string, userId: string): Promise<Avatar[]> {
    // Verify project ownership
    await this.getProjectById(projectId, userId)

    return repository.findAvatarsByProjectId(projectId, userId)
  }

  async updateAvatar(
    avatarId: string,
    userId: string,
    data: UpdateAvatarRequest
  ): Promise<Avatar> {
    // Verify ownership
    await this.getAvatar(avatarId, userId)

    // Prepare update data
    const updateData: any = {}

    if (data.name !== undefined) updateData.name = data.name

    // Persona
    if (data.personaName !== undefined) updateData.personaName = data.personaName
    if (data.personaAge !== undefined) updateData.personaAge = data.personaAge
    if (data.personaPersonality !== undefined) {
      updateData.personaPersonality = JSON.stringify(data.personaPersonality)
    }
    if (data.personaBackground !== undefined) {
      updateData.personaBackground = data.personaBackground
    }

    // Visual attributes
    if (data.gender !== undefined) updateData.gender = data.gender
    if (data.ageRange !== undefined) updateData.ageRange = data.ageRange
    if (data.ethnicity !== undefined) updateData.ethnicity = data.ethnicity
    if (data.bodyType !== undefined) updateData.bodyType = data.bodyType
    if (data.hairStyle !== undefined) updateData.hairStyle = data.hairStyle
    if (data.hairColor !== undefined) updateData.hairColor = data.hairColor
    if (data.eyeColor !== undefined) updateData.eyeColor = data.eyeColor
    if (data.skinTone !== undefined) updateData.skinTone = data.skinTone
    if (data.style !== undefined) updateData.style = data.style

    return repository.updateAvatar(avatarId, userId, updateData)
  }

  async deleteAvatar(avatarId: string, userId: string): Promise<void> {
    // Get avatar for file paths
    const avatar = await this.getAvatar(avatarId, userId)

    // Delete files
    await this.deleteAvatarFiles(avatar)

    // Delete from database
    await repository.deleteAvatar(avatarId, userId)
  }

  // ========================================
  // Usage Tracking
  // ========================================

  async trackUsage(avatarId: string, userId: string, data: TrackUsageRequest): Promise<void> {
    // Verify avatar exists
    await this.getAvatar(avatarId, userId)

    // Create usage history
    await repository.createUsageHistory({
      avatarId,
      userId,
      appId: data.appId,
      appName: data.appName,
      action: data.action,
      referenceId: data.referenceId,
      referenceType: data.referenceType,
      metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
    })

    // Increment usage counter
    await repository.incrementAvatarUsage(avatarId)
  }

  async getUsageHistory(avatarId: string, userId: string) {
    // Verify ownership
    await this.getAvatar(avatarId, userId)

    const [history, summary] = await Promise.all([
      repository.findUsageHistoryByAvatarId(avatarId, userId),
      repository.getUsageSummaryByAvatarId(avatarId, userId),
    ])

    return { history, summary }
  }

  // ========================================
  // Stats
  // ========================================

  async getUserStats(userId: string) {
    return repository.getUserStats(userId)
  }

  // ========================================
  // Presets
  // ========================================

  async getPresets(category?: string) {
    return repository.findAllPresets(category)
  }

  async getPresetById(presetId: string) {
    const preset = await repository.findPresetById(presetId)
    if (!preset) {
      throw new ResourceNotFoundError('Preset', presetId)
    }
    return preset
  }

  async createAvatarFromPreset(
    projectId: string,
    userId: string,
    presetId: string,
    customName?: string,
    creditCost = 8 // Default cost for preset-based generation
  ) {
    // Verify project ownership
    await this.getProjectById(projectId, userId)

    // Get preset
    const preset = await this.getPresetById(presetId)

    // Create generation record for tracking
    const generation = await repository.createGeneration({
      userId,
      projectId,
      prompt: preset.generationPrompt,
      options: JSON.stringify({
        width: 1024,
        height: 1024,
        seed: undefined,
      }),
    })

    // Prepare job data
    const jobData = {
      generationId: generation.id,
      userId,
      projectId,
      prompt: preset.generationPrompt,
      options: {
        width: 1024,
        height: 1024,
        seed: undefined,
      },
      metadata: {
        name: customName || preset.name,
        sourceType: 'from_preset' as const,
        persona: {
          name: preset.personaName || undefined,
          age: preset.personaAge || undefined,
          personality: preset.personaPersonality ? JSON.parse(preset.personaPersonality) : undefined,
          background: preset.personaBackground || undefined,
        },
        attributes: {
          gender: preset.gender || undefined,
          ageRange: preset.ageRange || undefined,
          ethnicity: preset.ethnicity || undefined,
          bodyType: preset.bodyType || undefined,
          hairStyle: preset.hairStyle || undefined,
          hairColor: preset.hairColor || undefined,
          eyeColor: preset.eyeColor || undefined,
          skinTone: preset.skinTone || undefined,
          style: preset.style || undefined,
        },
        creditCost, // Pass credit cost for accurate refunds on failure
      },
    }

    // Add to queue for background processing
    await addAvatarGenerationJob(jobData)

    // Increment preset usage counter
    await repository.incrementPresetUsage(presetId)

    return generation
  }

  // ========================================
  // Helper Methods - File Processing
  // ========================================
  // Note: File validation is now handled by validateImageFile() from utils/file-validation.ts

  private async saveImageWithThumbnail(
    userId: string,
    imageBuffer: Buffer,
    sanitizedFilename: string
  ): Promise<{ imagePath: string; thumbnailPath: string }> {
    // Create user directory
    const userDir = path.join(this.uploadBasePath, userId)
    await fs.mkdir(userDir, { recursive: true })

    // SECURITY: Generate secure random filename instead of using user-provided name
    // This prevents:
    // - Filename collisions
    // - Directory traversal attempts that may have bypassed sanitization
    // - Predictable file locations
    const secureFilename = generateSecureFilename(sanitizedFilename, 'avatar')
    const ext = path.extname(secureFilename)
    const baseName = path.basename(secureFilename, ext)
    const thumbnailFilename = `${baseName}_thumb${ext}`

    // File paths
    const imageFullPath = path.join(userDir, secureFilename)
    const thumbnailFullPath = path.join(userDir, thumbnailFilename)

    // Relative paths for database
    const imagePath = `/uploads/avatar-creator/${userId}/${secureFilename}`
    const thumbnailPath = `/uploads/avatar-creator/${userId}/${thumbnailFilename}`

    // Save original image
    await fs.writeFile(imageFullPath, imageBuffer)

    // Generate and save thumbnail
    const thumbnailBuffer = await sharp(imageBuffer)
      .resize(300, 300, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 85 })
      .toBuffer()

    await fs.writeFile(thumbnailFullPath, thumbnailBuffer)

    return { imagePath, thumbnailPath }
  }

  private async deleteAvatarFiles(avatar: Avatar): Promise<void> {
    const filesToDelete: string[] = []

    // Add base image
    if (avatar.baseImageUrl) {
      filesToDelete.push(path.join(process.cwd(), avatar.baseImageUrl))
    }

    // Add thumbnail
    if (avatar.thumbnailUrl) {
      filesToDelete.push(path.join(process.cwd(), avatar.thumbnailUrl))
    }

    // Delete files
    for (const filepath of filesToDelete) {
      try {
        await fs.unlink(filepath)
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          // Ignore file not found, throw other errors
          console.error(`Failed to delete file ${filepath}:`, error)
        }
      }
    }
  }

  // ========================================
  // Helper Methods - Data Processing
  // ========================================

  private parsePersonaData(data: any): PersonaData {
    return {
      name: data.personaName,
      age: data.personaAge ? parseInt(data.personaAge) : undefined,
      personality: data.personaPersonality
        ? typeof data.personaPersonality === 'string'
          ? JSON.parse(data.personaPersonality)
          : data.personaPersonality
        : undefined,
      background: data.personaBackground,
    }
  }

  private parseVisualAttributes(data: any): VisualAttributes {
    return {
      gender: data.gender,
      ageRange: data.ageRange,
      ethnicity: data.ethnicity,
      bodyType: data.bodyType,
      hairStyle: data.hairStyle,
      hairColor: data.hairColor,
      eyeColor: data.eyeColor,
      skinTone: data.skinTone,
      style: data.style,
    }
  }
}

// Singleton export
export const avatarCreatorService = new AvatarCreatorService()
export default avatarCreatorService
