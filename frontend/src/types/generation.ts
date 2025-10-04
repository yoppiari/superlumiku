export interface GenerationItem {
  id: string
  appId: 'video-mixer' | 'carousel-mix'
  appName: string
  appIcon: string
  appColor: string
  projectId: string
  projectName: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  outputPaths: string[]
  thumbnailUrl?: string
  creditUsed: number
  createdAt: string
  completedAt?: string
  fileCount: number
  totalSize?: number
}

export interface GenerationsResponse {
  generations: GenerationItem[]
  total: number
  hasMore: boolean
}
