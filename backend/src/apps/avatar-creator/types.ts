/**
 * Avatar Creator - Type Definitions
 *
 * Full type system for avatar creation, persona management,
 * and cross-app integration
 */

// ========================================
// Core Entity Types
// ========================================

export interface AvatarProject {
  id: string
  userId: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  avatars?: Avatar[]
}

export interface Avatar {
  id: string
  userId: string
  projectId: string

  // Basic Info
  name: string
  baseImageUrl: string
  thumbnailUrl: string | null

  // Persona
  personaName: string | null
  personaAge: number | null
  personaPersonality: string | null // JSON: ["friendly", "professional"]
  personaBackground: string | null

  // Visual Attributes
  gender: string | null
  ageRange: string | null
  ethnicity: string | null
  bodyType: string | null
  hairStyle: string | null
  hairColor: string | null
  eyeColor: string | null
  skinTone: string | null
  style: string | null

  // Generation Info
  sourceType: AvatarSourceType
  generationPrompt: string | null
  seedUsed: number | null

  // Tracking
  usageCount: number
  lastUsedAt: Date | null

  createdAt: Date
  updatedAt: Date

  // Relations (optional)
  project?: AvatarProject
  usageHistory?: AvatarUsageHistory[]
}

export interface AvatarPreset {
  id: string
  name: string
  previewImageUrl: string
  category: PresetCategory
  personaTemplate: string // JSON
  visualAttributes: string // JSON
  generationPrompt: string
  isPublic: boolean
  usageCount: number
  createdAt: Date
  updatedAt: Date
  // Optional individual fields (for easy access without parsing JSON)
  personaName?: string | null
  personaAge?: number | null
  personaPersonality?: string | null
  personaBackground?: string | null
  gender?: string | null
  ageRange?: string | null
  ethnicity?: string | null
  bodyType?: string | null
  hairStyle?: string | null
  hairColor?: string | null
  eyeColor?: string | null
  skinTone?: string | null
  style?: string | null
}

export interface PersonaExample {
  id: string
  name: string
  category: PersonaCategory
  personaName: string
  personaAge: number
  personaPersonality: string // JSON
  personaBackground: string
  suggestedAttributes: string | null // JSON
  displayOrder: number
  isActive: boolean
  createdAt: Date
}

export interface AvatarUsageHistory {
  id: string
  avatarId: string
  userId: string
  appId: string
  appName: string
  action: string
  referenceId: string | null
  referenceType: string | null
  metadata: string | null // JSON
  createdAt: Date
  avatar?: Avatar
}

export interface AvatarGeneration {
  id: string
  userId: string
  avatarId: string | null
  projectId: string
  status: GenerationStatus
  prompt: string
  options: string | null // JSON
  errorMessage: string | null
  createdAt: Date
  completedAt: Date | null
}

// ========================================
// Enum Types
// ========================================

export type AvatarSourceType =
  | 'uploaded' // User uploaded image
  | 'text_to_image' // AI generated from text
  | 'from_preset' // Generated from preset
  | 'from_reference' // AI generated from reference image

export type PresetCategory = 'business' | 'casual' | 'traditional' | 'creative'

export type PersonaCategory = 'business' | 'creative' | 'lifestyle' | 'healthcare' | 'education'

export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed'

// ========================================
// Request/Response DTOs
// ========================================

export interface CreateProjectRequest {
  name: string
  description?: string
}

export interface UpdateProjectRequest {
  name?: string
  description?: string
}

export interface UploadAvatarRequest {
  name: string
  // Persona
  personaName?: string
  personaAge?: number
  personaPersonality?: string[] // Will be JSONified
  personaBackground?: string
  // Visual attributes
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

export interface GenerateAvatarRequest {
  name: string
  prompt: string
  // Persona
  personaName?: string
  personaAge?: number
  personaPersonality?: string[]
  personaBackground?: string
  // Visual attributes
  gender?: string
  ageRange?: string
  ethnicity?: string
  style?: string
  // Generation options
  seed?: number
  width?: number
  height?: number
}

export interface GenerateFromPresetRequest {
  name: string
  presetId: string
  // Allow overrides
  personaName?: string
  personaAge?: number
  customPrompt?: string
}

export interface GenerateFromReferenceRequest {
  name: string
  prompt: string
  // Reference image will be in form-data
  // Persona & attributes same as GenerateAvatarRequest
  personaName?: string
  personaAge?: number
  personaPersonality?: string[]
  personaBackground?: string
  gender?: string
  ageRange?: string
  style?: string
}

export interface UpdateAvatarRequest {
  name?: string
  // Persona updates
  personaName?: string
  personaAge?: number
  personaPersonality?: string[]
  personaBackground?: string
  // Visual attributes updates
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

export interface TrackUsageRequest {
  appId: string
  appName: string
  action: string
  referenceId?: string
  referenceType?: string
  metadata?: Record<string, any>
}

// ========================================
// Response Types
// ========================================

export interface AvatarProjectResponse {
  project: AvatarProject & { avatars: Avatar[] }
}

export interface AvatarResponse {
  avatar: Avatar
}

export interface AvatarListResponse {
  avatars: Avatar[]
  meta: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface PresetListResponse {
  presets: AvatarPreset[]
  categories: string[]
}

export interface PersonaExampleListResponse {
  examples: PersonaExample[]
  categories: string[]
}

export interface UsageHistoryResponse {
  history: AvatarUsageHistory[]
  summary: UsageSummary[]
}

export interface UsageSummary {
  appId: string
  appName: string
  count: number
  lastUsed: Date
}

export interface AvatarStatsResponse {
  totalAvatars: number
  totalProjects: number
  recentUploads: number // Last 7 days
  totalUsage: number
  averageUsage: number
  topUsedAvatars: Array<{
    id: string
    name: string
    usageCount: number
  }>
}

// ========================================
// Internal Service Types
// ========================================

export interface PersonaData {
  name?: string
  age?: number
  personality?: string[]
  background?: string
}

export interface VisualAttributes {
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

export interface GenerationOptions {
  width?: number
  height?: number
  seed?: number
  numInferenceSteps?: number
  guidanceScale?: number
}

export interface PromptBuildResult {
  fullPrompt: string
  negativePrompt: string
  enhancedPrompt: string
}

// ========================================
// Queue Job Types
// ========================================

export interface AvatarGenerationJob {
  generationId: string
  userId: string
  projectId: string
  avatarId: string | null
  prompt: string
  options: GenerationOptions
  metadata: {
    name: string
    sourceType: AvatarSourceType
    persona?: PersonaData
    attributes?: VisualAttributes
    creditCost?: number // Cost of this generation for accurate refunds on failure
  }
}
