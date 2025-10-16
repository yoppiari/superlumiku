/**
 * Pose Generator - Type Definitions
 *
 * Complete type system for pose generation, library browsing,
 * project management, and background customization.
 *
 * Based on POSE_GENERATOR_ARCHITECTURE.md v2.0
 */

// ========================================
// Core Entity Types
// ========================================

export interface PoseGeneratorProject {
  id: string
  userId: string
  projectName: string
  description: string | null

  // Avatar Integration
  avatarImageUrl: string | null
  avatarSource: 'AVATAR_CREATOR' | 'UPLOAD'
  avatarId: string | null

  // Stats
  totalGenerations: number
  totalPosesGenerated: number

  // Status
  status: 'active' | 'archived' | 'deleted'

  createdAt: Date
  updatedAt: Date

  // Relations (optional)
  generations?: PoseGeneration[]
}

export interface PoseGeneration {
  id: string
  projectId: string
  userId: string

  // Input Mode
  generationType: 'GALLERY_REFERENCE' | 'TEXT_DESCRIPTION'
  textPrompt: string | null
  generatedPoseStructure: string | null // AI-generated pose description (for text mode)

  // Avatar Context
  avatarId: string | null
  avatarAttributes: string | null // JSON: {gender, age, ethnicity, style}

  // Generation Settings
  batchSize: number // Variations per pose
  totalExpectedPoses: number

  // Background Changer (optional add-on)
  useBackgroundChanger: boolean
  backgroundPrompt: string | null
  backgroundMode: 'ai_generate' | 'solid_color' | 'upload' | null

  // Output Settings
  exportFormats: string[] // ['instagram_story', 'tiktok', 'shopee']

  // Status Tracking
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial'
  progress: number // 0-100
  posesCompleted: number
  posesFailed: number

  // Credit Tracking
  creditCharged: number
  creditRefunded: number

  // Queue Management
  queueJobId: string | null

  // Results
  errorMessage: string | null

  // Timestamps
  createdAt: Date
  startedAt: Date | null
  completedAt: Date | null

  // Performance Metrics
  avgGenerationTime: number | null // Seconds per pose
  totalProcessingTime: number | null // Total seconds

  // Relations (optional)
  project?: PoseGeneratorProject
  poses?: GeneratedPose[]
  poseSelections?: PoseSelection[]
}

export interface GeneratedPose {
  id: string
  generationId: string
  poseLibraryId: string | null // NULL for text-to-pose mode

  // Output
  outputImageUrl: string
  thumbnailUrl: string
  originalImageUrl: string | null // Before background change

  // Export Formats
  exportFormats: Record<string, string> // {instagram_story: "url", tiktok: "url"}

  // Background Changer
  backgroundChanged: boolean
  backgroundPrompt: string | null

  // AI Parameters
  promptUsed: string
  seedUsed: number | null
  controlnetWeight: number

  // Quality Metrics
  generationTime: number | null // Seconds
  aiConfidenceScore: number | null // 0.0-1.0

  // User Actions
  isFavorite: boolean
  downloadCount: number

  // Status
  status: 'completed' | 'failed'
  errorMessage: string | null

  createdAt: Date

  // Relations (optional)
  generation?: PoseGeneration
  poseLibrary?: PoseLibraryItem
}

export interface PoseLibraryItem {
  id: string
  name: string
  description: string | null
  categoryId: string

  // Media
  previewImageUrl: string
  referenceImageUrl: string
  controlnetImageUrl: string // Pre-computed ControlNet pose map
  thumbnailUrl: string | null

  // Metadata
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  genderSuitability: 'male' | 'female' | 'unisex'
  tags: string[] // ['Standing', 'professional', 'full-body']

  // Source
  sourceType: 'curated' | 'user_contributed' | 'ai_generated'
  sourceCredit: string | null
  licenseType: string

  // Popularity
  usageCount: number
  favoriteCount: number
  ratingAvg: number
  popularityScore: number // Computed: usageCount + favoriteCount

  // Status
  isPublic: boolean
  isFeatured: boolean
  isPremium: boolean

  createdAt: Date
  updatedAt: Date

  // Relations (optional)
  category?: PoseCategory
}

export interface PoseCategory {
  id: string
  name: string
  displayName: string
  description: string | null
  slug: string
  parentId: string | null

  // Display
  icon: string
  displayOrder: number
  color: string

  // Stats
  poseCount: number

  // Status
  isActive: boolean

  createdAt: Date
  updatedAt: Date

  // Relations (optional)
  parent?: PoseCategory
  children?: PoseCategory[]
  poses?: PoseLibraryItem[]
}

export interface PoseSelection {
  id: string
  generationId: string
  poseLibraryId: string
}

export interface PoseRequest {
  id: string
  userId: string
  poseName: string
  description: string
  referenceImageUrl: string | null
  categoryId: string | null
  useCase: string | null // 'e-commerce', 'professional', 'social'

  // Voting
  votesCount: number

  // Status
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected'
  adminNotes: string | null

  // Completion
  completedPoseId: string | null

  createdAt: Date
  updatedAt: Date
}

// ========================================
// Request Types
// ========================================

export interface GetLibraryRequest {
  category?: string
  page?: string
  limit?: string
  search?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  genderSuitability?: 'male' | 'female' | 'unisex'
  featured?: string // 'true' | 'false'
}

export interface CreateProjectRequest {
  projectName: string
  description?: string
  avatarImageUrl: string
  avatarSource: 'AVATAR_CREATOR' | 'UPLOAD'
  avatarId?: string
}

export interface UpdateProjectRequest {
  projectName?: string
  description?: string
  status?: 'active' | 'archived'
}

export interface GenerateRequest {
  projectId: string
  generationType: 'GALLERY_REFERENCE' | 'TEXT_DESCRIPTION'

  // Gallery mode
  selectedPoseIds?: string[]

  // Text mode
  textPrompt?: string
  variationCount?: number // Number of variations to generate from text

  // Options
  batchSize?: number // Variations per selected pose (gallery mode)
  useBackgroundChanger?: boolean
  backgroundMode?: 'ai_generate' | 'solid_color' | 'upload'
  backgroundPrompt?: string
  backgroundImageUrl?: string
  backgroundColor?: string // Hex color for solid_color mode

  // Phase 4D: Export Formats
  exportFormats?: string[] // ['instagram_story', 'tiktok', 'shopee_product'] - Generate exports automatically

  // Deprecated - use exportFormats instead
  outputFormats?: string[] // Kept for backward compatibility

  avatarId?: string // Avatar reference for generation context
}

export interface ChangeBackgroundRequest {
  backgroundMode: 'ai_generate' | 'solid_color' | 'upload'
  backgroundPrompt?: string // For ai_generate
  backgroundColor?: string // For solid_color (hex)
  backgroundImageUrl?: string // For upload
}

export interface CreatePoseRequestRequest {
  poseName: string
  description: string
  categoryId?: string
  useCase?: string
  referenceImageUrl?: string // Optional reference image
}

// ========================================
// Response Types
// ========================================

export interface PoseLibraryResponse {
  poses: PoseLibraryItem[]
  pagination: PaginationMeta
}

export interface PoseCategoryResponse {
  categories: PoseCategory[]
  totalCategories: number
}

export interface ProjectListResponse {
  projects: PoseGeneratorProject[]
  pagination: PaginationMeta
}

export interface ProjectResponse {
  project: PoseGeneratorProject & {
    generations?: PoseGeneration[]
  }
}

export interface GenerationResponse {
  generationId: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial'
  totalPosesExpected: number
  creditCharged: number
  estimatedCompletionTime?: number // Seconds
  message?: string
}

export interface GenerationStatusResponse {
  generation: PoseGeneration & {
    poses?: GeneratedPose[]
  }
  progress: {
    percentage: number
    posesCompleted: number
    posesFailed: number
    posesTotal: number
    currentStatus: string
    estimatedTimeRemaining: number | null // Seconds
  }
}

export interface GenerationResultsResponse {
  results: GeneratedPose[]
  generation: {
    id: string
    status: string
    totalPoses: number
    successCount: number
    failedCount: number
    creditCharged: number
    creditRefunded: number
  }
}

export interface PoseStatsResponse {
  totalPosesGenerated: number
  totalProjects: number
  recentGenerations: number // Last 7 days
  creditUsage: {
    totalSpent: number
    last30Days: number
    averagePerGeneration: number
  }
  topUsedPoses: Array<{
    poseId: string
    poseName: string
    usageCount: number
    previewUrl: string
  }>
}

export interface BackgroundChangeResponse {
  poseId: string
  outputImageUrl: string
  creditCharged: number
  creditBalance: number
}

export interface PoseRequestResponse {
  request: PoseRequest
  message: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

// ========================================
// Internal Service Types
// ========================================

export interface AvatarContext {
  avatarId?: string
  avatarImageUrl: string
  attributes?: {
    gender?: string
    ageRange?: string
    ethnicity?: string
    bodyType?: string
    hairStyle?: string
    hairColor?: string
    eyeColor?: string
    skinTone?: string
    style?: string
  }
}

export interface GenerationOptions {
  width?: number
  height?: number
  seed?: number
  numInferenceSteps?: number
  guidanceScale?: number
  controlnetWeight?: number
}

export interface BackgroundOptions {
  mode: 'ai_generate' | 'solid_color' | 'upload'
  prompt?: string
  color?: string
  imageUrl?: string
}

export interface ExportFormat {
  name: string // 'instagram_story', 'tiktok', 'shopee_product'
  width: number
  height: number
  aspectRatio: string
}

// ========================================
// Queue Job Types
// ========================================

export interface PoseGenerationJob {
  generationId: string
  userId: string
  projectId: string
  generationType: 'GALLERY_REFERENCE' | 'TEXT_DESCRIPTION'
  totalCost: number // For accurate refunds on failure
  metadata: {
    poseCount: number
    baseCost: number
    backgroundCost: number
  }
}

export interface BackgroundChangeJob {
  poseId: string
  userId: string
  generationId: string
  backgroundOptions: BackgroundOptions
  creditCost: number
}

// ========================================
// Validation Types
// ========================================

export interface TextPromptValidation {
  isValid: boolean
  errors?: string[]
  sanitized?: string
}

export interface GenerationValidation {
  isValid: boolean
  errors?: string[]
  warnings?: string[]
  estimatedCost?: number
  estimatedTime?: number // Seconds
}

// ========================================
// Error Types
// ========================================

export class PoseGeneratorError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'PoseGeneratorError'
  }
}

export class InsufficientQuotaError extends PoseGeneratorError {
  constructor(resourceType: string) {
    super(
      `Insufficient ${resourceType}. Please upgrade your plan or wait for quota reset.`,
      'INSUFFICIENT_QUOTA',
      403
    )
  }
}

export class InvalidPromptError extends PoseGeneratorError {
  constructor(reason: string) {
    super(`Invalid prompt: ${reason}`, 'INVALID_PROMPT', 400)
  }
}

export class GenerationNotFoundError extends PoseGeneratorError {
  constructor(generationId: string) {
    super(`Generation ${generationId} not found`, 'GENERATION_NOT_FOUND', 404)
  }
}

export class ProjectNotFoundError extends PoseGeneratorError {
  constructor(projectId: string) {
    super(`Project ${projectId} not found`, 'PROJECT_NOT_FOUND', 404)
  }
}

export class UnauthorizedAccessError extends PoseGeneratorError {
  constructor(resource: string) {
    super(
      `You do not have permission to access this ${resource}`,
      'UNAUTHORIZED_ACCESS',
      403
    )
  }
}
