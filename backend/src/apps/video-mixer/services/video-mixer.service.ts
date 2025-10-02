import { VideoMixerRepository } from '../repositories/video-mixer.repository'
import { videoMixerConfig } from '../plugin.config'

const repo = new VideoMixerRepository()

interface GenerationSettings {
  // Mixing Options (Anti-Fingerprinting)
  enableOrderMixing: boolean
  enableDifferentStart: boolean
  fixedStartVideoId?: string
  enableGroupMixing: boolean
  groupMixingMode: 'sequential' | 'random'
  enableSpeedVariations: boolean
  speedMin: number
  speedMax: number

  // Quality Settings
  metadataSource: 'capcut' | 'tiktok' | 'instagram' | 'youtube'
  videoBitrate: 'low' | 'medium' | 'high'
  videoResolution: '480p' | '720p' | '1080p' | '4k'
  frameRate: 24 | 30 | 60
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5'

  // Duration Settings
  durationType: 'original' | 'fixed'
  fixedDuration?: number // seconds
  smartDistribution: boolean
  distributionMode: 'proportional' | 'equal' | 'weighted'

  // Audio
  audioOption: 'keep' | 'mute'
}

export class VideoMixerService {
  // ===== Projects =====
  async createProject(userId: string, name: string, description?: string) {
    if (!name || name.trim().length === 0) {
      throw new Error('Project name is required')
    }
    return await repo.createProject(userId, name, description)
  }

  async getProjects(userId: string) {
    return await repo.findProjectsByUserId(userId)
  }

  async getProject(projectId: string, userId: string) {
    const project = await repo.findProjectById(projectId, userId)
    if (!project) {
      throw new Error('Project not found or access denied')
    }
    return project
  }

  async updateProject(projectId: string, userId: string, name?: string, description?: string) {
    const result = await repo.updateProject(projectId, userId, { name, description })
    if (result.count === 0) {
      throw new Error('Project not found or access denied')
    }
    return { success: true }
  }

  async deleteProject(projectId: string, userId: string) {
    const result = await repo.deleteProject(projectId, userId)
    if (result.count === 0) {
      throw new Error('Project not found or access denied')
    }
    return { success: true }
  }

  // ===== Groups =====
  async createGroup(projectId: string, userId: string, name: string, order: number = 0) {
    // Verify project ownership
    await this.getProject(projectId, userId)

    if (!name || name.trim().length === 0) {
      throw new Error('Group name is required')
    }

    return await repo.createGroup(projectId, name, order)
  }

  async getGroups(projectId: string, userId: string) {
    // Verify project ownership
    await this.getProject(projectId, userId)
    return await repo.findGroupsByProjectId(projectId)
  }

  async updateGroup(groupId: string, userId: string, name?: string, order?: number) {
    const group = await repo.updateGroup(groupId, { name, order })
    return group
  }

  async deleteGroup(groupId: string, userId: string) {
    await repo.deleteGroup(groupId)
    return { success: true }
  }

  // ===== Videos =====
  async createVideo(data: {
    projectId: string
    userId: string
    groupId?: string
    fileName: string
    filePath: string
    fileSize: number
    duration: number
    mimeType: string
    order?: number
  }) {
    // Verify project ownership
    await this.getProject(data.projectId, data.userId)

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024 // 100MB in bytes
    if (data.fileSize > maxSize) {
      throw new Error('File size exceeds maximum limit of 100MB')
    }

    // Validate mime type
    if (!data.mimeType.startsWith('video/')) {
      throw new Error('Invalid file type. Only video files are allowed')
    }

    const { userId, ...videoData } = data
    return await repo.createVideo(videoData)
  }

  async getVideos(projectId: string, userId: string) {
    // Verify project ownership
    await this.getProject(projectId, userId)
    return await repo.findVideosByProjectId(projectId)
  }

  async deleteVideo(videoId: string, userId: string) {
    const video = await repo.findVideoById(videoId)
    if (!video) {
      throw new Error('Video not found')
    }

    // Verify project ownership
    await this.getProject(video.projectId, userId)

    await repo.deleteVideo(videoId)
    return { success: true }
  }

  // ===== Generation =====
  calculateCreditCost(settings: GenerationSettings, totalVideosToGenerate: number): number {
    let costPerVideo = videoMixerConfig.credits.baseGeneration

    // Mixing options
    if (settings.enableOrderMixing) {
      costPerVideo += videoMixerConfig.credits.orderMixing
    }

    if (settings.enableGroupMixing && settings.groupMixingMode === 'random') {
      costPerVideo += videoMixerConfig.credits.groupMixingRandom
    }

    if (settings.enableSpeedVariations) {
      costPerVideo += videoMixerConfig.credits.speedVariations
    }

    // Quality upgrades
    const resolutionCosts: Record<string, number> = {
      '480p': 0,
      '720p': videoMixerConfig.credits.hdResolution,
      '1080p': videoMixerConfig.credits.fullHdResolution,
      '4k': videoMixerConfig.credits.fourKResolution,
    }
    costPerVideo += resolutionCosts[settings.videoResolution] || 0

    if (settings.videoBitrate === 'high') {
      costPerVideo += videoMixerConfig.credits.highBitrate
    }

    if (settings.frameRate === 60) {
      costPerVideo += videoMixerConfig.credits.highFrameRate
    }

    // Duration features
    if (settings.smartDistribution) {
      costPerVideo += videoMixerConfig.credits.smartDistribution
    }

    return costPerVideo * totalVideosToGenerate
  }

  // Calculate possible combinations
  calculatePossibleCombinations(totalVideos: number, groupCount: number, enableGroupMixing: boolean): number {
    if (totalVideos === 0) return 0

    // For large numbers, return infinity to avoid overflow
    if (totalVideos > 10) return Infinity

    // Calculate video permutations
    let combinations = this.factorial(totalVideos)

    // If group mixing is enabled, multiply by group permutations
    if (enableGroupMixing && groupCount > 1) {
      if (groupCount > 10) return Infinity
      combinations *= this.factorial(groupCount)
    }

    return combinations
  }

  // Calculate anti-fingerprinting strength (0-5 scale)
  calculateStrength(settings: GenerationSettings): number {
    let score = 0

    if (settings.enableOrderMixing) score += 1
    if (settings.enableDifferentStart) score += 1

    if (settings.enableGroupMixing) {
      if (settings.groupMixingMode === 'random') {
        score += 2
      } else {
        score += 1
      }
    }

    if (settings.enableSpeedVariations) score += 1

    return Math.min(score, 5)
  }

  async estimateGeneration(projectId: string, userId: string, settings: GenerationSettings, totalVideosToGenerate: number) {
    const project = await this.getProject(projectId, userId)

    if (!project.videos || project.videos.length === 0) {
      throw new Error('Project has no videos to mix')
    }

    // Calculate total duration
    const totalDuration = project.videos.reduce((sum, v) => sum + v.duration, 0)

    // Adjust duration based on settings
    let estimatedDuration = totalDuration
    if (settings.durationType === 'fixed' && settings.fixedDuration) {
      estimatedDuration = settings.fixedDuration
    } else if (settings.enableSpeedVariations) {
      // Average of speed range
      const avgSpeed = (settings.speedMin + settings.speedMax) / 2
      estimatedDuration = totalDuration / avgSpeed
    }

    // Calculate credit cost
    const creditCost = this.calculateCreditCost(settings, totalVideosToGenerate)

    // Calculate possible combinations
    const totalVideos = project.videos.length
    const groupCount = project.groups?.length || 0
    const possibleCombinations = this.calculatePossibleCombinations(
      totalVideos,
      groupCount,
      settings.enableGroupMixing
    )

    // Calculate anti-fingerprinting strength
    const strength = this.calculateStrength(settings)
    const strengthLabels = ['None', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent']

    return {
      totalSourceVideos: totalVideos,
      totalGroups: groupCount,
      estimatedDurationPerVideo: estimatedDuration,
      totalVideosToGenerate: totalVideosToGenerate,
      possibleCombinations: possibleCombinations,
      creditCostPerVideo: Math.round((creditCost / totalVideosToGenerate) * 100) / 100,
      totalCreditCost: creditCost,
      strength: strength,
      strengthLabel: strengthLabels[strength],
    }
  }

  async createGeneration(
    projectId: string,
    userId: string,
    totalVideos: number,
    settings: GenerationSettings
  ) {
    const project = await this.getProject(projectId, userId)

    if (!project.videos || project.videos.length === 0) {
      throw new Error('Project has no videos to mix')
    }

    // Calculate costs
    const creditUsed = this.calculateCreditCost(settings, totalVideos)

    // Calculate estimated duration
    const totalDuration = project.videos.reduce((sum, v) => sum + v.duration, 0)
    let estimatedDuration = totalDuration
    if (settings.durationType === 'fixed' && settings.fixedDuration) {
      estimatedDuration = settings.fixedDuration
    } else if (settings.enableSpeedVariations) {
      const avgSpeed = (settings.speedMin + settings.speedMax) / 2
      estimatedDuration = totalDuration / avgSpeed
    }

    // Create generation record with all settings
    const generation = await repo.createGeneration({
      projectId,
      userId,
      totalVideos,
      settings: JSON.stringify(settings),
      creditUsed,
      estimatedDuration,

      // Mixing options
      enableOrderMixing: settings.enableOrderMixing,
      enableDifferentStart: settings.enableDifferentStart,
      fixedStartVideoId: settings.fixedStartVideoId,
      enableGroupMixing: settings.enableGroupMixing,
      groupMixingMode: settings.groupMixingMode,
      enableSpeedVariations: settings.enableSpeedVariations,
      speedMin: settings.speedMin,
      speedMax: settings.speedMax,

      // Quality
      metadataSource: settings.metadataSource,
      videoBitrate: settings.videoBitrate,
      videoResolution: settings.videoResolution,
      frameRate: settings.frameRate,
      aspectRatio: settings.aspectRatio,

      // Duration
      durationType: settings.durationType,
      fixedDuration: settings.fixedDuration,
      smartDistribution: settings.smartDistribution,
      distributionMode: settings.distributionMode,

      // Audio
      audioOption: settings.audioOption,
    })

    return {
      generation,
      creditUsed,
    }
  }

  async getGenerations(projectId: string, userId: string) {
    // Verify project ownership
    await this.getProject(projectId, userId)
    return await repo.findGenerationsByProjectId(projectId)
  }

  async getStats(userId: string) {
    const projects = await repo.findProjectsByUserId(userId)

    const totalProjects = projects.length
    const totalVideos = projects.reduce((sum, p) => sum + p.videos.length, 0)
    const totalGenerations = projects.reduce((sum, p) => sum + p.generations.length, 0)

    return {
      totalProjects,
      totalVideos,
      totalGenerations,
    }
  }

  // Helper
  private factorial(n: number): number {
    if (n <= 1) return 1
    return n * this.factorial(n - 1)
  }
}
