// Avatar Project Types
export interface AvatarProject {
  id: string
  userId: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  avatars?: Avatar[]
}

export interface CreateProjectRequest {
  name: string
  description?: string
}

export interface UpdateProjectRequest {
  name?: string
  description?: string
}

// Avatar Types
export interface Avatar {
  id: string
  userId: string
  projectId: string // NEW
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
