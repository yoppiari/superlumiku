/**
 * SAM Library - Main Export
 */

export { SAMClient, getSAMClient } from './sam.client'
export type {
  SAMSegmentPointRequest,
  SAMSegmentPointsRequest,
  SAMSegmentBoxRequest,
  SAMSegmentResponse,
  SAMHealthResponse,
  SAMError,
} from './sam.types'
export { SAM_CONFIG, isSAMEnabled } from './sam.config'
