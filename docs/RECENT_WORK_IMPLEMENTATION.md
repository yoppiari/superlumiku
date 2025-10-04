# Recent Work & My Work Implementation Guide

## Overview
Sistem untuk menampilkan semua hasil generations dari berbagai apps (Video Mixer, Carousel Mix, dll) dalam satu dashboard terpadu.

## Data Model

### Unified Generation Interface
```typescript
interface GenerationItem {
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
  createdAt: Date
  completedAt?: Date
  fileCount: number
  totalSize?: number
}
```

## API Endpoints

### GET /api/generations
Query params:
- `app`: Filter by appId
- `status`: Filter by status
- `limit`: Pagination limit
- `offset`: Pagination offset
- `sort`: Sort field (createdAt, name)

Response:
```json
{
  "generations": GenerationItem[],
  "total": number,
  "hasMore": boolean
}
```

### DELETE /api/generations/:id
Delete generation and cleanup files

### GET /api/generations/:id/download
Download single file or multiple as ZIP

## File Structure
```
/uploads/
  /video-mixer/{userId}/{generationId}/
    - output-1.mp4
    - output-2.mp4
    - thumb.jpg
  /carousel-mix/{userId}/{generationId}/
    - carousel-set-1.mp4
    - carousel-all.zip
    - thumb.jpg
```

## UI Components

### Dashboard Recent Work
- Shows 5 latest generations
- App icon + project name
- Status badge
- Quick download
- Navigate to project

### My Work Page (/my-work)
- Filter by app
- Sort options
- Grid/List view
- Bulk operations
- Preview modal
- Search

### Color Coding
- Video Mixer: purple (`bg-purple-50 text-purple-700`)
- Carousel Mix: blue (`bg-blue-50 text-blue-700`)

### Status Badges
- Completed: Green
- Processing: Blue (animated)
- Failed: Red
- Pending: Orange

## Implementation Phases

1. **Backend Foundation**: Generation service + API endpoints
2. **Dashboard Integration**: Update Recent Work
3. **My Work Page**: Full-featured page
4. **Preview & Enhancement**: Modal + bulk ops
5. **Polish**: Responsive + animations

## Technical Notes

- Union query from VideoMixerGeneration + CarouselGeneration
- Generate thumbnails in workers on completion
- Stream video for preview
- Create ZIP on-the-fly for bulk downloads
- Cleanup files on deletion
