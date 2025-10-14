import prisma from '../db/client'
import { AuthorizationError, ResourceNotFoundError } from '../errors/AuthorizationError'

/**
 * Centralized Authorization Service
 *
 * Provides secure, reusable authorization checks across all apps.
 * Implements defense-in-depth strategy with consistent error handling.
 *
 * Security Principles:
 * 1. Fail securely - return 404 instead of 403 to avoid info leaking
 * 2. Centralized logic - single source of truth for authorization
 * 3. Type-safe - full TypeScript support
 * 4. Auditable - log all authorization failures
 * 5. Extensible - easy to add new resource types
 *
 * @example
 * ```typescript
 * // Verify user owns a project
 * await authService.verifyCarouselProjectOwnership(userId, projectId)
 *
 * // Get resource with ownership check
 * const project = await authService.getAuthorizedCarouselProject(userId, projectId)
 * ```
 */

export type ResourceType =
  | 'CarouselProject'
  | 'CarouselSlide'
  | 'CarouselText'
  | 'CarouselGeneration'
  | 'AvatarProject'
  | 'Avatar'
  | 'AvatarGeneration'
  | 'VideoMixerProject'
  | 'VideoMixerGroup'
  | 'VideoMixerVideo'
  | 'VideoMixerGeneration'
  | 'LoopingFlowProject'
  | 'LoopingFlowVideo'
  | 'LoopingFlowGeneration'
  | 'LoopingFlowAudioLayer'
  | 'AvatarGeneratorGeneration'

interface AuthorizationOptions {
  /**
   * If true, throws ResourceNotFoundError instead of AuthorizationError
   * This prevents information leakage (don't reveal resource exists)
   */
  hideExistence?: boolean

  /**
   * If true, logs authorization failures for security auditing
   */
  auditLog?: boolean
}

/**
 * Authorization Service
 *
 * Handles all resource ownership verification across the platform.
 * Ensures users can only access their own resources.
 */
export class AuthorizationService {
  private static instance: AuthorizationService

  private constructor() {}

  static getInstance(): AuthorizationService {
    if (!AuthorizationService.instance) {
      AuthorizationService.instance = new AuthorizationService()
    }
    return AuthorizationService.instance
  }

  /**
   * Log authorization failure for security auditing
   */
  private logAuthorizationFailure(
    userId: string,
    resourceType: ResourceType,
    resourceId: string,
    reason: string
  ): void {
    console.warn('[SECURITY] Authorization failure:', {
      timestamp: new Date().toISOString(),
      userId,
      resourceType,
      resourceId,
      reason,
    })
  }

  // ========================================
  // CAROUSEL MIX AUTHORIZATION
  // ========================================

  /**
   * Verify user owns a carousel project
   * @throws ResourceNotFoundError if project doesn't exist or user doesn't own it
   */
  async verifyCarouselProjectOwnership(
    userId: string,
    projectId: string,
    options: AuthorizationOptions = { hideExistence: true, auditLog: true }
  ): Promise<void> {
    const project = await prisma.carouselProject.findUnique({
      where: { id: projectId },
      select: { userId: true },
    })

    if (!project) {
      if (options.auditLog) {
        this.logAuthorizationFailure(userId, 'CarouselProject', projectId, 'Project not found')
      }
      throw new ResourceNotFoundError('CarouselProject', projectId)
    }

    if (project.userId !== userId) {
      if (options.auditLog) {
        this.logAuthorizationFailure(
          userId,
          'CarouselProject',
          projectId,
          'User does not own resource'
        )
      }
      if (options.hideExistence) {
        throw new ResourceNotFoundError('CarouselProject', projectId)
      }
      throw new AuthorizationError('CarouselProject', projectId)
    }
  }

  /**
   * Get carousel project with ownership verification
   * @throws ResourceNotFoundError if project doesn't exist or user doesn't own it
   */
  async getAuthorizedCarouselProject(userId: string, projectId: string) {
    const project = await prisma.carouselProject.findUnique({
      where: { id: projectId },
      include: {
        slides: { orderBy: [{ slidePosition: 'asc' }, { order: 'asc' }] },
        texts: { orderBy: [{ slidePosition: 'asc' }, { order: 'asc' }] },
        generations: { orderBy: { createdAt: 'desc' } },
        positionSettings: { orderBy: { slidePosition: 'asc' } },
      },
    })

    if (!project) {
      this.logAuthorizationFailure(userId, 'CarouselProject', projectId, 'Project not found')
      throw new ResourceNotFoundError('CarouselProject', projectId)
    }

    if (project.userId !== userId) {
      this.logAuthorizationFailure(
        userId,
        'CarouselProject',
        projectId,
        'User does not own resource'
      )
      throw new ResourceNotFoundError('CarouselProject', projectId)
    }

    return project
  }

  /**
   * Verify user owns a carousel slide
   */
  async verifyCarouselSlideOwnership(
    userId: string,
    slideId: string,
    options: AuthorizationOptions = { hideExistence: true, auditLog: true }
  ): Promise<void> {
    const slide = await prisma.carouselSlide.findUnique({
      where: { id: slideId },
      include: { project: { select: { userId: true } } },
    })

    if (!slide) {
      if (options.auditLog) {
        this.logAuthorizationFailure(userId, 'CarouselSlide', slideId, 'Slide not found')
      }
      throw new ResourceNotFoundError('CarouselSlide', slideId)
    }

    if (slide.project.userId !== userId) {
      if (options.auditLog) {
        this.logAuthorizationFailure(
          userId,
          'CarouselSlide',
          slideId,
          'User does not own resource'
        )
      }
      if (options.hideExistence) {
        throw new ResourceNotFoundError('CarouselSlide', slideId)
      }
      throw new AuthorizationError('CarouselSlide', slideId)
    }
  }

  /**
   * Verify user owns a carousel text
   */
  async verifyCarouselTextOwnership(
    userId: string,
    textId: string,
    options: AuthorizationOptions = { hideExistence: true, auditLog: true }
  ): Promise<void> {
    const text = await prisma.carouselText.findUnique({
      where: { id: textId },
      include: { project: { select: { userId: true } } },
    })

    if (!text) {
      if (options.auditLog) {
        this.logAuthorizationFailure(userId, 'CarouselText', textId, 'Text not found')
      }
      throw new ResourceNotFoundError('CarouselText', textId)
    }

    if (text.project.userId !== userId) {
      if (options.auditLog) {
        this.logAuthorizationFailure(
          userId,
          'CarouselText',
          textId,
          'User does not own resource'
        )
      }
      if (options.hideExistence) {
        throw new ResourceNotFoundError('CarouselText', textId)
      }
      throw new AuthorizationError('CarouselText', textId)
    }
  }

  /**
   * Verify user owns a carousel generation
   */
  async verifyCarouselGenerationOwnership(
    userId: string,
    generationId: string,
    options: AuthorizationOptions = { hideExistence: true, auditLog: true }
  ): Promise<void> {
    const generation = await prisma.carouselGeneration.findUnique({
      where: { id: generationId },
      select: { userId: true },
    })

    if (!generation) {
      if (options.auditLog) {
        this.logAuthorizationFailure(
          userId,
          'CarouselGeneration',
          generationId,
          'Generation not found'
        )
      }
      throw new ResourceNotFoundError('CarouselGeneration', generationId)
    }

    if (generation.userId !== userId) {
      if (options.auditLog) {
        this.logAuthorizationFailure(
          userId,
          'CarouselGeneration',
          generationId,
          'User does not own resource'
        )
      }
      if (options.hideExistence) {
        throw new ResourceNotFoundError('CarouselGeneration', generationId)
      }
      throw new AuthorizationError('CarouselGeneration', generationId)
    }
  }

  // ========================================
  // VIDEO MIXER AUTHORIZATION
  // ========================================

  /**
   * Verify user owns a video mixer project
   */
  async verifyVideoMixerProjectOwnership(
    userId: string,
    projectId: string,
    options: AuthorizationOptions = { hideExistence: true, auditLog: true }
  ): Promise<void> {
    const project = await prisma.videoMixerProject.findUnique({
      where: { id: projectId },
      select: { userId: true },
    })

    if (!project) {
      if (options.auditLog) {
        this.logAuthorizationFailure(userId, 'VideoMixerProject', projectId, 'Project not found')
      }
      throw new ResourceNotFoundError('VideoMixerProject', projectId)
    }

    if (project.userId !== userId) {
      if (options.auditLog) {
        this.logAuthorizationFailure(
          userId,
          'VideoMixerProject',
          projectId,
          'User does not own resource'
        )
      }
      if (options.hideExistence) {
        throw new ResourceNotFoundError('VideoMixerProject', projectId)
      }
      throw new AuthorizationError('VideoMixerProject', projectId)
    }
  }

  /**
   * Verify user owns a video mixer group
   */
  async verifyVideoMixerGroupOwnership(
    userId: string,
    groupId: string,
    options: AuthorizationOptions = { hideExistence: true, auditLog: true }
  ): Promise<void> {
    const group = await prisma.videoMixerGroup.findUnique({
      where: { id: groupId },
      include: { project: { select: { userId: true } } },
    })

    if (!group) {
      if (options.auditLog) {
        this.logAuthorizationFailure(userId, 'VideoMixerGroup', groupId, 'Group not found')
      }
      throw new ResourceNotFoundError('VideoMixerGroup', groupId)
    }

    if (group.project.userId !== userId) {
      if (options.auditLog) {
        this.logAuthorizationFailure(
          userId,
          'VideoMixerGroup',
          groupId,
          'User does not own resource'
        )
      }
      if (options.hideExistence) {
        throw new ResourceNotFoundError('VideoMixerGroup', groupId)
      }
      throw new AuthorizationError('VideoMixerGroup', groupId)
    }
  }

  /**
   * Verify user owns a video mixer video
   */
  async verifyVideoMixerVideoOwnership(
    userId: string,
    videoId: string,
    options: AuthorizationOptions = { hideExistence: true, auditLog: true }
  ): Promise<void> {
    const video = await prisma.videoMixerVideo.findUnique({
      where: { id: videoId },
      include: { project: { select: { userId: true } } },
    })

    if (!video) {
      if (options.auditLog) {
        this.logAuthorizationFailure(userId, 'VideoMixerVideo', videoId, 'Video not found')
      }
      throw new ResourceNotFoundError('VideoMixerVideo', videoId)
    }

    if (video.project.userId !== userId) {
      if (options.auditLog) {
        this.logAuthorizationFailure(
          userId,
          'VideoMixerVideo',
          videoId,
          'User does not own resource'
        )
      }
      if (options.hideExistence) {
        throw new ResourceNotFoundError('VideoMixerVideo', videoId)
      }
      throw new AuthorizationError('VideoMixerVideo', videoId)
    }
  }

  /**
   * Verify user owns a video mixer generation
   */
  async verifyVideoMixerGenerationOwnership(
    userId: string,
    generationId: string,
    options: AuthorizationOptions = { hideExistence: true, auditLog: true }
  ): Promise<void> {
    const generation = await prisma.videoMixerGeneration.findUnique({
      where: { id: generationId },
      select: { userId: true },
    })

    if (!generation) {
      if (options.auditLog) {
        this.logAuthorizationFailure(
          userId,
          'VideoMixerGeneration',
          generationId,
          'Generation not found'
        )
      }
      throw new ResourceNotFoundError('VideoMixerGeneration', generationId)
    }

    if (generation.userId !== userId) {
      if (options.auditLog) {
        this.logAuthorizationFailure(
          userId,
          'VideoMixerGeneration',
          generationId,
          'User does not own resource'
        )
      }
      if (options.hideExistence) {
        throw new ResourceNotFoundError('VideoMixerGeneration', generationId)
      }
      throw new AuthorizationError('VideoMixerGeneration', generationId)
    }
  }

  // ========================================
  // LOOPING FLOW AUTHORIZATION
  // ========================================

  /**
   * Verify user owns a looping flow project
   */
  async verifyLoopingFlowProjectOwnership(
    userId: string,
    projectId: string,
    options: AuthorizationOptions = { hideExistence: true, auditLog: true }
  ): Promise<void> {
    const project = await prisma.loopingFlowProject.findUnique({
      where: { id: projectId },
      select: { userId: true },
    })

    if (!project) {
      if (options.auditLog) {
        this.logAuthorizationFailure(userId, 'LoopingFlowProject', projectId, 'Project not found')
      }
      throw new ResourceNotFoundError('LoopingFlowProject', projectId)
    }

    if (project.userId !== userId) {
      if (options.auditLog) {
        this.logAuthorizationFailure(
          userId,
          'LoopingFlowProject',
          projectId,
          'User does not own resource'
        )
      }
      if (options.hideExistence) {
        throw new ResourceNotFoundError('LoopingFlowProject', projectId)
      }
      throw new AuthorizationError('LoopingFlowProject', projectId)
    }
  }

  /**
   * Verify user owns a looping flow video
   */
  async verifyLoopingFlowVideoOwnership(
    userId: string,
    videoId: string,
    options: AuthorizationOptions = { hideExistence: true, auditLog: true }
  ): Promise<void> {
    const video = await prisma.loopingFlowVideo.findUnique({
      where: { id: videoId },
      include: { project: { select: { userId: true } } },
    })

    if (!video) {
      if (options.auditLog) {
        this.logAuthorizationFailure(userId, 'LoopingFlowVideo', videoId, 'Video not found')
      }
      throw new ResourceNotFoundError('LoopingFlowVideo', videoId)
    }

    if (video.project.userId !== userId) {
      if (options.auditLog) {
        this.logAuthorizationFailure(
          userId,
          'LoopingFlowVideo',
          videoId,
          'User does not own resource'
        )
      }
      if (options.hideExistence) {
        throw new ResourceNotFoundError('LoopingFlowVideo', videoId)
      }
      throw new AuthorizationError('LoopingFlowVideo', videoId)
    }
  }

  /**
   * Verify user owns a looping flow generation
   */
  async verifyLoopingFlowGenerationOwnership(
    userId: string,
    generationId: string,
    options: AuthorizationOptions = { hideExistence: true, auditLog: true }
  ): Promise<void> {
    const generation = await prisma.loopingFlowGeneration.findUnique({
      where: { id: generationId },
      select: { userId: true },
    })

    if (!generation) {
      if (options.auditLog) {
        this.logAuthorizationFailure(
          userId,
          'LoopingFlowGeneration',
          generationId,
          'Generation not found'
        )
      }
      throw new ResourceNotFoundError('LoopingFlowGeneration', generationId)
    }

    if (generation.userId !== userId) {
      if (options.auditLog) {
        this.logAuthorizationFailure(
          userId,
          'LoopingFlowGeneration',
          generationId,
          'User does not own resource'
        )
      }
      if (options.hideExistence) {
        throw new ResourceNotFoundError('LoopingFlowGeneration', generationId)
      }
      throw new AuthorizationError('LoopingFlowGeneration', generationId)
    }
  }

  /**
   * Verify user owns a looping flow audio layer (through generation)
   */
  async verifyLoopingFlowAudioLayerOwnership(
    userId: string,
    layerId: string,
    options: AuthorizationOptions = { hideExistence: true, auditLog: true }
  ): Promise<void> {
    const layer = await prisma.loopingFlowAudioLayer.findUnique({
      where: { id: layerId },
      include: { generation: { select: { userId: true } } },
    })

    if (!layer) {
      if (options.auditLog) {
        this.logAuthorizationFailure(
          userId,
          'LoopingFlowAudioLayer',
          layerId,
          'Audio layer not found'
        )
      }
      throw new ResourceNotFoundError('LoopingFlowAudioLayer', layerId)
    }

    if (layer.generation.userId !== userId) {
      if (options.auditLog) {
        this.logAuthorizationFailure(
          userId,
          'LoopingFlowAudioLayer',
          layerId,
          'User does not own resource'
        )
      }
      if (options.hideExistence) {
        throw new ResourceNotFoundError('LoopingFlowAudioLayer', layerId)
      }
      throw new AuthorizationError('LoopingFlowAudioLayer', layerId)
    }
  }

  // ========================================
  // BATCH OPERATIONS
  // ========================================

  /**
   * Verify user owns multiple resources of the same type
   * Useful for batch operations
   *
   * @throws ResourceNotFoundError if any resource doesn't exist or user doesn't own it
   */
  async verifyBatchOwnership(
    userId: string,
    resourceIds: string[],
    resourceType: ResourceType
  ): Promise<void> {
    // Verify each resource individually
    const verifyPromises = resourceIds.map((id) => {
      switch (resourceType) {
        case 'CarouselProject':
          return this.verifyCarouselProjectOwnership(userId, id)
        case 'CarouselSlide':
          return this.verifyCarouselSlideOwnership(userId, id)
        case 'CarouselText':
          return this.verifyCarouselTextOwnership(userId, id)
        case 'VideoMixerGroup':
          return this.verifyVideoMixerGroupOwnership(userId, id)
        case 'VideoMixerVideo':
          return this.verifyVideoMixerVideoOwnership(userId, id)
        default:
          throw new Error(`Batch verification not implemented for ${resourceType}`)
      }
    })

    await Promise.all(verifyPromises)
  }
}

// Singleton export
export const authorizationService = AuthorizationService.getInstance()
export default authorizationService
