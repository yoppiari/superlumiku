/**
 * Pose Generator - Frontend Type Definitions
 *
 * Matches backend types from backend/src/apps/pose-generator/types.ts
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

  createdAt: string
  updatedAt: string

  // Relations
  generations?: PoseGeneration[]
}

export interface PoseGeneration {
  id: string
  projectId: string
  userId: string

  // Input Mode
  generationType: 'GALLERY_REFERENCE' | 'TEXT_DESCRIPTION'
  textPrompt: string | null
  generatedPoseStructure: string | null

  // Avatar Context
  avatarId: string | null
  avatarAttributes: string | null

  // Generation Settings
  batchSize: number
  totalExpectedPoses: number

  // Background Changer
  useBackgroundChanger: boolean
  backgroundPrompt: string | null
  backgroundMode: 'ai_generate' | 'solid_color' | 'upload' | null

  // Output Settings
  exportFormats: string[]

  // Status Tracking
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial'
  progress: number
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
  createdAt: string
  startedAt: string | null
  completedAt: string | null

  // Performance Metrics
  avgGenerationTime: number | null
  totalProcessingTime: number | null

  // Relations
  project?: PoseGeneratorProject
  poses?: GeneratedPose[]
  poseSelections?: PoseSelection[]
}

export interface GeneratedPose {
  id: string
  generationId: string
  poseLibraryId: string | null

  // Output
  outputImageUrl: string
  thumbnailUrl: string
  originalImageUrl: string | null

  // Export Formats
  exportFormats: Record<string, string>

  // Background Changer
  backgroundChanged: boolean
  backgroundPrompt: string | null

  // AI Parameters
  promptUsed: string
  seedUsed: number | null
  controlnetWeight: number

  // Quality Metrics
  generationTime: number | null
  aiConfidenceScore: number | null

  // User Actions
  isFavorite: boolean
  downloadCount: number

  // Status
  status: 'completed' | 'failed'
  errorMessage: string | null

  createdAt: string

  // Relations
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
  controlnetImageUrl: string
  thumbnailUrl: string | null

  // Metadata
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  genderSuitability: 'male' | 'female' | 'unisex'
  tags: string[]

  // Source
  sourceType: 'curated' | 'user_contributed' | 'ai_generated'
  sourceCredit: string | null
  licenseType: string

  // Popularity
  usageCount: number
  favoriteCount: number
  ratingAvg: number
  popularityScore: number

  // Status
  isPublic: boolean
  isFeatured: boolean
  isPremium: boolean

  createdAt: string
  updatedAt: string

  // Relations
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

  createdAt: string
  updatedAt: string

  // Relations
  parent?: PoseCategory
  children?: PoseCategory[]
  poses?: PoseLibraryItem[]
}

export interface PoseSelection {
  id: string
  generationId: string
  poseLibraryId: string
}

// ========================================
// Response Types
// ========================================

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

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
  project: PoseGeneratorProject
}

export interface GenerationResponse {
  generationId: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial'
  totalPosesExpected: number
  creditCharged: number
  estimatedCompletionTime?: number
  message?: string
}

export interface GenerationStatusResponse {
  generation: PoseGeneration
  progress: {
    percentage: number
    posesCompleted: number
    posesFailed: number
    posesTotal: number
    currentStatus: string
    estimatedTimeRemaining: number | null
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
  recentGenerations: number
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

// ========================================
// WebSocket Types
// ========================================

export interface WebSocketMessage {
  type: 'progress' | 'pose_completed' | 'generation_completed' | 'error'
  generationId: string
  data: any
}

export interface ProgressUpdate {
  generationId: string
  progress: number
  posesCompleted: number
  posesFailed: number
  totalPoses: number
  currentPose?: string
  estimatedTimeRemaining?: number
}

export interface PoseCompletedUpdate {
  generationId: string
  poseId: string
  poseLibraryId?: string
  outputImageUrl: string
  thumbnailUrl: string
  status: 'completed' | 'failed'
  errorMessage?: string
}

// ========================================
// Filter & Query Types
// ========================================

export interface PoseLibraryFilters {
  category?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  genderSuitability?: 'male' | 'female' | 'unisex'
  search?: string
  featured?: boolean
  page?: number
  limit?: number
}

export interface ProjectFilters {
  status?: 'active' | 'archived'
  page?: number
  limit?: number
}

// ========================================
// Form Types
// ========================================

export interface CreateProjectFormData {
  projectName: string
  description?: string
  avatarImageUrl: string
  avatarSource: 'AVATAR_CREATOR' | 'UPLOAD'
  avatarId?: string
}

export interface GenerateFormData {
  projectId: string
  generationType: 'GALLERY_REFERENCE' | 'TEXT_DESCRIPTION'

  // Gallery mode
  selectedPoseIds?: string[]
  batchSize?: number

  // Text mode
  textPrompt?: string
  variationCount?: number

  // Options
  useBackgroundChanger?: boolean
  backgroundMode?: 'ai_generate' | 'solid_color' | 'upload'
  backgroundPrompt?: string
  backgroundColor?: string
  backgroundImageUrl?: string

  // Export formats
  exportFormats?: string[]

  avatarId?: string
}

// ========================================
// UI State Types
// ========================================

export interface LoadingState {
  isLoading: boolean
  error: string | null
}

export interface GenerationWizardStep {
  step: 1 | 2 | 3 | 4
  title: string
  description: string
}
