export interface PoseGeneration {
  id: string
  projectId: string | null
  userId: string
  avatarId: string
  totalPoses: number
  selectedPoseIds: string
  batchSize: number
  quality: string
  fashionSettings: string | null
  backgroundSettings: string | null
  professionTheme: string | null
  provider: string
  modelId: string
  basePrompt: string
  negativePrompt: string | null
  status: string
  progress: number
  successfulPoses: number
  failedPoses: number
  creditUsed: number
  outputFolder: string | null
  createdAt: Date
  updatedAt: Date
  completedAt: Date | null
}

export interface GeneratedPose {
  id: string
  generationId: string
  userId: string
  avatarId: string
  poseTemplateId: string
  prompt: string
  negativePrompt: string | null
  outputUrl: string
  thumbnailUrl: string | null
  success: boolean
  qualityScore: number | null
  generationTime: number
  provider: string
  createdAt: Date
}

export interface StartGenerationRequest {
  avatarId: string
  selectedPoseIds: string[] // Array of pose template IDs
  quality?: 'sd' | 'hd'
  fashionSettings?: {
    hijab?: { style: string; color: string }
    accessories?: string[]
    outfit?: string
  }
  backgroundSettings?: {
    type: 'auto' | 'custom' | 'scene'
    scene?: string
    customPrompt?: string
  }
  professionTheme?: string
}

export interface PoseGeneratorStats {
  totalGenerations: number
  completedGenerations: number
  totalPosesGenerated: number
  averageSuccessRate: number
  recentActivity: number
}
