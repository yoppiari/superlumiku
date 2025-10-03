import { CarouselRepository } from '../repositories/carousel.repository'
import {
  TextVariationSettings,
  applyTextVariation,
  calculatePossibleCombinations,
  calculateAntiFingerprintingStrength,
} from '../lib/text-variation'
import { carouselMixConfig } from '../plugin.config'

const repo = new CarouselRepository()

export class CarouselService {
  // ===========================
  // PROJECT METHODS
  // ===========================

  async createProject(userId: string, data: { name: string; description?: string }) {
    return repo.createProject(userId, data)
  }

  async getProjects(userId: string) {
    return repo.findProjectsByUserId(userId)
  }

  async getProjectById(id: string, userId: string) {
    const project = await repo.findProjectById(id)

    if (!project) {
      throw new Error('Project not found')
    }

    if (project.userId !== userId) {
      throw new Error('Unauthorized: This project belongs to another user')
    }

    return project
  }

  async updateProject(id: string, userId: string, data: Partial<{ name: string; description: string }>) {
    // Verify ownership
    await this.getProjectById(id, userId)
    return repo.updateProject(id, data)
  }

  async deleteProject(id: string, userId: string) {
    // Verify ownership
    await this.getProjectById(id, userId)
    return repo.deleteProject(id)
  }

  // ===========================
  // SLIDE METHODS
  // ===========================

  async addSlide(
    projectId: string,
    userId: string,
    data: {
      fileName: string
      filePath: string
      fileType: string
      fileSize: number
      slidePosition: number // NEW: Required for position-based system
    }
  ) {
    // Verify project ownership
    await this.getProjectById(projectId, userId)

    // Get slides for this position to determine order within position
    const existingSlides = await repo.findSlidesByProjectId(projectId)
    const slidesAtPosition = existingSlides.filter(s => s.slidePosition === data.slidePosition)

    // Maximum 8 slides per position (Instagram carousel limit)
    if (slidesAtPosition.length >= 8) {
      throw new Error(`Maximum 8 slides allowed per position. Position ${data.slidePosition} already has ${slidesAtPosition.length} slides.`)
    }

    return repo.createSlide(projectId, {
      ...data,
      order: slidesAtPosition.length, // Order within this position
    })
  }

  async getSlides(projectId: string, userId: string) {
    // Verify ownership
    await this.getProjectById(projectId, userId)
    return repo.findSlidesByProjectId(projectId)
  }

  async deleteSlide(slideId: string, userId: string) {
    const slide = await repo.findSlidesByProjectId('') // We need to get slide first
    // TODO: Add proper authorization check
    return repo.deleteSlide(slideId)
  }

  async reorderSlides(projectId: string, userId: string, slideOrders: { id: string; order: number }[]) {
    // Verify ownership
    await this.getProjectById(projectId, userId)

    // Update all slides' order
    const promises = slideOrders.map((item) => repo.updateSlideOrder(item.id, item.order))

    return Promise.all(promises)
  }

  // ===========================
  // TEXT METHODS
  // ===========================

  async addText(
    projectId: string,
    userId: string,
    data: {
      content: string
      slidePosition: number // NEW: Required for position-based system
      style?: any
      position?: any
      alignment?: string
      fontSize?: number
      fontColor?: string
      fontWeight?: string
      order: number
    }
  ) {
    // Verify project ownership
    await this.getProjectById(projectId, userId)

    // Prepare data with JSON serialization for complex fields
    const textData: any = {
      content: data.content,
      slidePosition: data.slidePosition, // NEW: Pass slidePosition to repository
      order: data.order,
    }

    // If comprehensive styling is provided, serialize it
    if (data.style) {
      textData.styleData = JSON.stringify(data.style)
      // Also populate legacy fields for backward compatibility
      textData.fontSize = data.style.fontSize || 24
      textData.fontColor = data.style.color || '#FFFFFF'
      textData.fontWeight = data.style.fontWeight >= 700 ? 'bold' : 'normal'
    } else if (data.fontSize !== undefined || data.fontColor !== undefined || data.fontWeight !== undefined) {
      // Legacy fields provided
      textData.fontSize = data.fontSize
      textData.fontColor = data.fontColor
      textData.fontWeight = data.fontWeight
    }

    // If comprehensive position is provided, serialize it
    if (data.position) {
      textData.positionData = JSON.stringify(data.position)
      // Also populate legacy position field
      textData.position = data.position.preset || 'center'
      textData.alignment = data.position.align || 'center'
    } else if (data.alignment !== undefined) {
      // Legacy alignment provided
      textData.alignment = data.alignment
      textData.position = 'center'
    }

    return repo.createText(projectId, textData)
  }

  async getTexts(projectId: string, userId: string) {
    // Verify ownership
    await this.getProjectById(projectId, userId)
    return repo.findTextsByProjectId(projectId)
  }

  async updateText(
    textId: string,
    userId: string,
    data: Partial<{
      content: string
      style: any
      position: any
      alignment: string
      fontSize: number
      fontColor: string
      fontWeight: string
      order: number
    }>
  ) {
    // TODO: Add proper authorization check

    // Prepare data with JSON serialization for complex fields
    const textData: any = {}

    if (data.content !== undefined) {
      textData.content = data.content
    }

    if (data.order !== undefined) {
      textData.order = data.order
    }

    // If comprehensive styling is provided, serialize it
    if (data.style) {
      textData.styleData = JSON.stringify(data.style)
      // Also update legacy fields for backward compatibility
      textData.fontSize = data.style.fontSize || 24
      textData.fontColor = data.style.color || '#FFFFFF'
      textData.fontWeight = data.style.fontWeight >= 700 ? 'bold' : 'normal'
    } else {
      // Update individual legacy fields if provided
      if (data.fontSize !== undefined) textData.fontSize = data.fontSize
      if (data.fontColor !== undefined) textData.fontColor = data.fontColor
      if (data.fontWeight !== undefined) textData.fontWeight = data.fontWeight
    }

    // If comprehensive position is provided, serialize it
    if (data.position) {
      textData.positionData = JSON.stringify(data.position)
      // Also update legacy position fields
      textData.position = data.position.preset || 'center'
      textData.alignment = data.position.align || 'center'
    } else {
      // Update individual legacy field if provided
      if (data.alignment !== undefined) textData.alignment = data.alignment
    }

    return repo.updateText(textId, textData)
  }

  async deleteText(textId: string, userId: string) {
    // TODO: Add proper authorization check
    return repo.deleteText(textId)
  }

  // ===========================
  // GENERATION METHODS
  // ===========================

  async calculateCredits(numSlides: number): Promise<number> {
    // Legacy pricing: Per 2 slides = 1 credit, max 8 slides = 4 credits
    if (numSlides < 2) return 0
    if (numSlides > 8) return 4 // Cap at 8 slides

    return Math.ceil(numSlides / 2)
  }

  /**
   * Calculate credits with new pricing structure
   * Formula: (base + perSlide * slides + perText * texts) * sets * bulkMultiplier
   */
  calculateCreditsV2(
    numSlides: number,
    numSets: number,
    textVariationCount: number = 0
  ): number {
    const { baseGeneration, perSlide, perTextVariation, bulkMultiplier } = carouselMixConfig.credits

    // Calculate per carousel cost
    let costPerCarousel = baseGeneration
    costPerCarousel += perSlide * numSlides
    costPerCarousel += perTextVariation * textVariationCount

    // Total for all sets
    let totalCost = costPerCarousel * numSets

    // Apply bulk multiplier for 10+ sets
    if (numSets >= 10) {
      totalCost *= bulkMultiplier
    }

    return Math.round(totalCost)
  }

  /**
   * Estimate generation with detailed breakdown
   */
  async estimateGeneration(
    projectId: string,
    userId: string,
    settings: {
      numSlides: number
      numSets: number
      textVariation?: TextVariationSettings
    }
  ) {
    // Verify project
    const project = await this.getProjectById(projectId, userId)

    // Validate
    if (project.slides.length < 2) {
      return {
        feasible: false,
        reason: 'Project must have at least 2 slides',
        totalCombinations: 0,
        credits: { perSet: 0, total: 0 },
        strength: 0,
      }
    }

    if (settings.numSlides < 2 || settings.numSlides > 8) {
      return {
        feasible: false,
        reason: 'Number of slides must be between 2 and 8',
        totalCombinations: 0,
        credits: { perSet: 0, total: 0 },
        strength: 0,
      }
    }

    if (settings.numSlides > project.slides.length) {
      return {
        feasible: false,
        reason: `Project only has ${project.slides.length} slides`,
        totalCombinations: 0,
        credits: { perSet: 0, total: 0 },
        strength: 0,
      }
    }

    // Calculate combinations
    const textCount = settings.textVariation?.texts.length || 0
    const algorithm = settings.textVariation?.algorithm || 'sequential'
    const totalCombinations = calculatePossibleCombinations(
      settings.numSlides,
      textCount,
      algorithm
    )

    // Calculate credits
    const creditPerSet = this.calculateCreditsV2(
      settings.numSlides,
      1,
      textCount
    )
    const totalCredits = this.calculateCreditsV2(
      settings.numSlides,
      settings.numSets,
      textCount
    )

    // Calculate anti-fingerprinting strength
    const strength = settings.textVariation
      ? calculateAntiFingerprintingStrength(settings.textVariation)
      : 0

    return {
      feasible: true,
      totalCombinations,
      credits: {
        perSet: creditPerSet,
        total: totalCredits,
      },
      strength,
      strengthLabel: ['None', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][strength],
    }
  }

  async createGeneration(
    projectId: string,
    userId: string,
    numSlides: number,
    numSetsGenerated: number
  ) {
    // Verify project ownership
    const project = await this.getProjectById(projectId, userId)

    // Validate slides count
    if (project.slides.length < 2) {
      throw new Error('Project must have at least 2 slides')
    }

    if (numSlides < 2 || numSlides > 8) {
      throw new Error('Number of slides must be between 2 and 8')
    }

    if (numSlides > project.slides.length) {
      throw new Error(`Project only has ${project.slides.length} slides, cannot generate ${numSlides}-slide carousels`)
    }

    // Calculate credits
    const creditUsed = (await this.calculateCredits(numSlides)) * numSetsGenerated

    // Create generation record
    return repo.createGeneration({
      projectId,
      userId,
      numSlides,
      numSetsGenerated,
      creditUsed,
    })
  }

  async getGenerations(projectId: string, userId: string) {
    // Verify ownership
    await this.getProjectById(projectId, userId)
    return repo.findGenerationsByProjectId(projectId)
  }

  async getGenerationById(generationId: string, userId: string) {
    const generation = await repo.findGenerationById(generationId)

    if (!generation) {
      throw new Error('Generation not found')
    }

    if (generation.userId !== userId) {
      throw new Error('Unauthorized: This generation belongs to another user')
    }

    return generation
  }

  async updateGenerationStatus(
    generationId: string,
    status: string,
    outputPath?: string,
    errorMessage?: string
  ) {
    const data: any = { status }

    if (outputPath) {
      data.outputPath = outputPath
    }

    if (errorMessage) {
      data.errorMessage = errorMessage
    }

    if (status === 'completed') {
      data.completedAt = new Date()
    }

    return repo.updateGenerationStatus(generationId, data)
  }

  // ===========================
  // STATISTICS
  // ===========================

  async getStats(userId: string) {
    return repo.getProjectStats(userId)
  }
}
