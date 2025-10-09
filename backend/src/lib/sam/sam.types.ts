/**
 * SAM Service Type Definitions
 */

export interface SAMSegmentPointRequest {
  image: string // Base64 encoded image
  point: [number, number] // [x, y]
  objectPrompt?: string // Optional hint for object type
}

export interface SAMSegmentPointsRequest {
  image: string
  points: number[][] // [[x1, y1], [x2, y2], ...]
  objectPrompt?: string
}

export interface SAMSegmentBoxRequest {
  image: string
  box: [number, number, number, number] // [x1, y1, x2, y2]
}

export interface SAMSegmentResponse {
  success: boolean
  maskBase64?: string // Base64 encoded mask image
  confidence?: number // Confidence score 0-1
  message?: string
}

export interface SAMHealthResponse {
  status: string
  model: string
  device: string
}

export interface SAMError {
  detail: string
  status?: number
}
