export type SegmentationMode = 'circular' | 'sam'

export interface Annotation {
  id: string
  x: number          // Position in pixels
  y: number
  xPercent: number   // Position as % for responsive
  yPercent: number
  prompt: string
  maskRadius: number // Radius in pixels (for circular mode)
  status: 'editing' | 'ready' | 'processing' | 'completed' | 'failed'

  // SAM Mode fields
  segmentationMode: SegmentationMode // 'circular' or 'sam'
  samObjectPrompt?: string // Optional hint for SAM (e.g., "shirt", "hair")
  samMaskBase64?: string // SAM-generated mask (base64 encoded)
  samConfidence?: number // SAM confidence score
}
