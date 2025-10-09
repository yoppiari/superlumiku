/**
 * Poster Editor Types
 */

export interface TextBox {
  id: string
  text: string
  confidence: number
  bbox: {
    x: number
    y: number
    width: number
    height: number
  }
  font?: {
    detected?: string
    fallback?: string
  }
}

export interface TextEdit {
  id: string
  text: string
  position: {
    x: number
    y: number
  }
  font: {
    family: string
    size: number
    weight: string
    color: string
    stroke?: string
    strokeWidth?: number
  }
}

export interface GeneratePosterParams {
  posterId: string
  edits: TextEdit[]
  options?: {
    preserveEffects?: boolean
    matchOriginalColors?: boolean
    inpaintingStrength?: number
  }
}

export interface EnhanceParams {
  posterId: string
  scale: 2 | 3 | 4
  faceEnhance?: boolean
  model?: string
}

export interface ResizeParams {
  posterId: string
  format: string // Format name from presets or 'custom'
  customWidth?: number
  customHeight?: number
  resizeMethod: 'smart_crop' | 'fit' | 'fill' | 'stretch'
  quality?: 'high' | 'medium' | 'low'
  autoUpscale?: boolean
}

export interface BatchExportParams {
  posterId: string
  formats: string[] // Array of format names
  packName?: string // Preset pack name
  autoUpscale?: boolean
  quality?: 'high' | 'medium' | 'low'
}

export interface ModelsLabInpaintingParams {
  initImageUrl: string
  maskImageUrl: string
  prompt?: string
  negativePrompt?: string
  strength?: number
  numInferenceSteps?: number
  guidanceScale?: number
  webhookUrl?: string
}

export interface ModelsLabSuperResolutionParams {
  imageUrl: string
  scale: 2 | 3 | 4
  faceEnhance?: boolean
  model?: string
  webhookUrl?: string
}

export interface ModelsLabResponse {
  status: 'success' | 'processing' | 'error'
  output?: string[]
  id?: string
  fetch_result?: string
  message?: string
  track_id?: string
}

export interface ProcessingJob {
  id: string
  type: 'inpainting' | 'upscaling' | 'resize' | 'batch_export'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress?: number
  result?: any
  error?: string
}

export type EditStatus =
  | 'PENDING'
  | 'UPLOADING'
  | 'DETECTING_TEXT'
  | 'GENERATING'
  | 'ENHANCING'
  | 'COMPLETED'
  | 'FAILED'

export type SourceType = 'FROM_EDITOR' | 'DIRECT_UPLOAD'
