export interface Avatar {
  id: string
  userId: string
  brandKitId: string | null
  name: string
  baseImageUrl: string
  thumbnailUrl: string | null
  gender: string | null
  ageRange: string | null
  style: string | null
  ethnicity: string | null
  generationPrompt: string | null
  faceEmbedding: string | null
  sourceType: string
  usageCount: number
  createdAt: Date
  updatedAt: Date
}

export interface CreateAvatarRequest {
  name: string
  gender?: string
  ageRange?: string
  style?: string
  ethnicity?: string
}

export interface UpdateAvatarRequest {
  name?: string
  gender?: string
  ageRange?: string
  style?: string
  ethnicity?: string
}

export interface AvatarStats {
  totalAvatars: number
  recentUploads: number
  totalUsage: number
  averageUsage: number
}
