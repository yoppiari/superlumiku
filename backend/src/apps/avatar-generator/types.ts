export interface AvatarGenerationRequest {
  poseTemplateId: string
  quality?: 'sd' | 'hd'
  priority?: boolean
}

export interface AvatarGeneration {
  id: string
  userId: string
  poseTemplateId: string
  inputImageUrl: string
  outputImageUrl?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  quality: 'sd' | 'hd'
  creditUsed: number
  errorMessage?: string
  createdAt: Date
  completedAt?: Date
}

export interface AvatarGenerationStats {
  totalGenerations: number
  completedGenerations: number
  failedGenerations: number
  averageProcessingTime: number
  totalCreditsUsed: number
}
