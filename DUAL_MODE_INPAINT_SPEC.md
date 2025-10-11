# Dual Mode Inpainting - Complete Specification

## Overview
Menambahkan 2 mode inpainting: **Brush Mode** (manual drawing) dan **Click-to-Annotate Mode** (quick edit dengan klik).

## Mode Comparison

### Mode 1: Brush Mode ✏️
- **Use Case**: Area kompleks, bentuk tidak beraturan, butuh kontrol presisi
- **How**: Draw mask dengan brush/eraser tools
- **Workflow**: Draw → Enter prompt → Generate
- **Cost**: 400 credits per operation
- **Status**: ✅ Already Implemented

### Mode 2: Click-to-Annotate Mode 👆 (NEW)
- **Use Case**: Quick edits, multiple area editing
- **How**: Klik pada area → Ketik prompt di floating box
- **Workflow**: Click → Type prompt → Add more (optional) → Process
- **Cost**: 400 credits per annotation
- **Status**: 🚧 To Be Implemented

## UI/UX Design

### 1. Mode Selector (ToolsPanel)
```
┌─────────────────────────────────────┐
│ Tools                                │
├─────────────────────────────────────┤
│ AI Inpaint Mode:                     │
│                                      │
│ ○ Brush Mode                         │
│   Manual drawing with brush/eraser  │
│                                      │
│ ● Quick Edit (Click & Type)         │
│   Click on areas to edit            │
│                                      │
│ [Start AI Inpaint] (400+ credits)   │
└─────────────────────────────────────┘
```

### 2. Annotate Mode Canvas
```
┌──────────────────────────────────────┐
│ Click on image to add edit:          │
│                                       │
│         Person                        │
│         ┌─────────────────────┐     │
│      1  │ blue formal shirt   │     │
│         │ Radius: [50px]     │     │
│         │ [✓] [✕]            │     │
│         └─────────────────────┘     │
│                                       │
│    Sky                                │
│    ┌─────────────────────┐          │
│ 2  │ sunset with clouds  │          │
│    │ Radius: [80px]     │          │
│    │ [✓] [✕]            │          │
│    └─────────────────────┘          │
│                                       │
│ Annotations: 2 | Cost: 800 credits   │
│ [Process All] [Clear All]            │
└──────────────────────────────────────┘
```

### 3. Annotation Management Panel
```
┌─────────────────────────────────────┐
│ 📍 Annotations                       │
├─────────────────────────────────────┤
│ 1. • "blue formal shirt"            │
│    Position: (120, 300)             │
│    Radius: 50px                     │
│    [Edit] [Delete] [Process]        │
├─────────────────────────────────────┤
│ 2. • "sunset with clouds"           │
│    Position: (400, 150)             │
│    Radius: 80px                     │
│    [Edit] [Delete] [Process]        │
├─────────────────────────────────────┤
│ Total: 2 annotations                 │
│ Cost: 800 credits (400 × 2)         │
│                                      │
│ [Process All] [Process Selected]     │
│ [Clear All]                          │
└─────────────────────────────────────┘
```

## Technical Architecture

### Frontend Components

#### 1. AnnotateCanvas.tsx (NEW)
```typescript
interface Annotation {
  id: string
  x: number              // Click position (pixels)
  y: number              // Click position (pixels)
  xPercent: number       // Position as % of image
  yPercent: number       // Position as % of image
  prompt: string
  maskRadius: number     // In pixels
  status: 'editing' | 'ready' | 'processing' | 'completed' | 'failed'
  jobId?: string
  resultUrl?: string
}

Features:
- Click handler to create annotation at cursor position
- Floating textarea for prompt input
- Visual markers (numbered circles with prompt preview)
- Mask preview (semi-transparent overlay)
- Edit/delete buttons per annotation
- Drag to reposition annotation
- Adjust radius with slider/input
```

#### 2. AnnotationPanel.tsx (NEW)
```typescript
Features:
- List view of all annotations
- Edit prompt inline
- Adjust mask radius
- Delete individual annotation
- Process individual annotation
- Process all annotations (sequential)
- Show processing status per annotation
- Display total cost
- Clear all button
```

#### 3. Updates to Existing Components

**ToolsPanel.tsx:**
- Add mode selector (radio buttons)
- Update button text based on mode
- Show different instructions per mode

**EditorCanvas.tsx:**
- Conditional rendering based on mode
- Brush mode → InpaintCanvas
- Annotate mode → AnnotateCanvas
- Pass mode prop

**PosterEditor.tsx:**
- Add `inpaintMode` state: 'brush' | 'annotate'
- Add `annotations` state management
- Pass to child components

**InpaintPanel.tsx:**
- Support brush mode (existing)
- Support annotate mode (show annotation list)
- Different UI based on mode

### Backend Implementation

#### Mask Generation Utility
```typescript
// In modelslab-inpaint.service.ts
function generateCircularMask(
  x: number,           // Center X (pixels)
  y: number,           // Center Y (pixels)
  radius: number,      // Radius (pixels)
  imageWidth: number,
  imageHeight: number
): string {
  // Create canvas
  // Draw white circle on transparent background
  // Return base64 PNG data URL
}
```

#### Batch Processing Endpoint
```typescript
POST /api/apps/poster-editor/inpaint-batch
Body: {
  posterId: string,
  annotations: [{
    x: number,
    y: number,
    prompt: string,
    maskRadius: number
  }]
}

Response: {
  success: true,
  jobs: [{
    jobId: string,
    annotationIndex: number
  }],
  totalCreditsUsed: number
}
```

#### Batch Status Check
```typescript
GET /api/apps/poster-editor/inpaint-batch/:batchId/status

Response: {
  success: true,
  batchId: string,
  jobs: [{
    jobId: string,
    annotationIndex: number,
    status: 'processing' | 'completed' | 'failed',
    outputUrl?: string,
    error?: string
  }],
  overallStatus: 'processing' | 'completed' | 'partial' | 'failed'
}
```

## Processing Strategies

### Sequential Processing (Recommended)
```
Original Image
    ↓
Apply Annotation 1 → Result 1
    ↓
Apply Annotation 2 on Result 1 → Result 2
    ↓
Apply Annotation 3 on Result 2 → Final Result
```

**Pros:**
- Annotations build on each other
- More predictable results
- Single final image

**Cons:**
- Takes longer (serial processing)
- If one fails, chain breaks

### Parallel Processing (Future Enhancement)
```
Original Image
    ↓
    ├─ Annotation 1 → Result 1
    ├─ Annotation 2 → Result 2
    └─ Annotation 3 → Result 3
        ↓
    Combine Results → Final Image
```

## Implementation Phases

### Phase 1: Frontend - Mode Selection ✅
- [ ] Update ToolsPanel with mode selector
- [ ] Add mode state in PosterEditor
- [ ] Pass mode to child components

### Phase 2: Frontend - Annotate Canvas ✅
- [ ] Create AnnotateCanvas component
- [ ] Click handler to create annotations
- [ ] Floating prompt input
- [ ] Visual markers with numbers
- [ ] Mask radius preview
- [ ] Edit/delete functionality

### Phase 3: Frontend - Annotation Management ✅
- [ ] Create AnnotationPanel component
- [ ] List all annotations
- [ ] Edit prompt inline
- [ ] Adjust radius per annotation
- [ ] Delete individual annotation
- [ ] Calculate total cost
- [ ] Process all button

### Phase 4: Backend - Mask Generation ✅
- [ ] Create generateCircularMask utility
- [ ] Canvas-based mask drawing
- [ ] Export to base64 PNG
- [ ] Test mask quality

### Phase 5: Backend - Batch Processing ✅
- [ ] Create batch endpoint
- [ ] Sequential job processing
- [ ] Track multiple jobs
- [ ] Return batch ID
- [ ] Status aggregation

### Phase 6: Integration ✅
- [ ] Connect frontend to batch endpoint
- [ ] Poll status for all jobs
- [ ] Update UI per annotation
- [ ] Show final result
- [ ] Update credit balance

### Phase 7: Polish & Testing ✅
- [ ] Error handling
- [ ] Loading states
- [ ] Success feedback
- [ ] Credit validation
- [ ] End-to-end testing

## User Workflows

### Workflow A: Quick Single Edit
1. Select "Quick Edit" mode
2. Click on shirt → "blue formal shirt"
3. Click "Process" or "Process All"
4. Wait 10-30s → Done
5. Cost: 400 credits

### Workflow B: Multiple Edits
1. Select "Quick Edit" mode
2. Click on sky → "sunset sky"
3. Click on shirt → "red t-shirt"
4. Click on background → "beach"
5. Review annotations in panel
6. Adjust radius if needed
7. Click "Process All"
8. Wait ~30-90s (sequential)
9. Cost: 1,200 credits (3 × 400)

### Workflow C: Precision Edit
1. Select "Brush Mode"
2. Draw custom irregular mask
3. Enter prompt
4. Generate
5. Cost: 400 credits

## Credit Calculation

**Formula:** `Total Cost = 400 × Number of Annotations`

**Examples:**
- 1 annotation = 400 credits
- 2 annotations = 800 credits
- 5 annotations = 2,000 credits

**Validation:**
- Check sufficient balance before starting
- Deduct immediately upon job start
- No refunds for failed jobs (ModelsLab already charged)

## Visual Design Guidelines

### Annotation Markers
- **Circle**: Semi-transparent white with border
- **Number**: Inside circle, sequential (1, 2, 3...)
- **Hover**: Show full prompt as tooltip
- **Selected**: Highlight with green border
- **Processing**: Pulsing animation
- **Completed**: Checkmark icon
- **Failed**: X icon with red color

### Color Scheme
- **Primary**: Purple (#9333EA) - For annotate mode
- **Success**: Green (#10B981) - Completed
- **Warning**: Amber (#F59E0B) - Processing
- **Error**: Red (#EF4444) - Failed
- **Neutral**: Slate (#64748B) - Default

### Responsive Behavior
- Mobile: Stack annotations vertically in panel
- Desktop: Side-by-side canvas + panel
- Tablet: Adjustable split panel

## Error Handling

### Insufficient Credits
```
Alert: "Insufficient credits. Required: 800, Available: 500"
Action: Prevent processing, show upgrade prompt
```

### API Failure
```
Alert: "Failed to process annotation 2: API timeout"
Action: Mark annotation as failed, continue with others
```

### Network Error
```
Alert: "Network error. Please check connection."
Action: Retry button, save annotations locally
```

## Testing Checklist

- [ ] Mode switching works smoothly
- [ ] Click creates annotation at correct position
- [ ] Floating input appears and functions
- [ ] Multiple annotations can be added
- [ ] Radius adjustment updates mask preview
- [ ] Edit prompt works inline
- [ ] Delete removes annotation
- [ ] Process all sends batch request
- [ ] Status polling updates each annotation
- [ ] Final result displays correctly
- [ ] Credits deducted accurately
- [ ] Error states handled gracefully
- [ ] Works on mobile/tablet
- [ ] Backward compatible with brush mode

## Future Enhancements

1. **AI Object Detection**: Auto-detect object boundaries instead of circles
2. **Smart Mask**: Use Segment Anything Model (SAM) for precise masks
3. **Drag & Reposition**: Move annotations after creation
4. **Copy Prompt**: Duplicate annotation with same prompt
5. **Templates**: Save common annotation sets
6. **Undo/Redo**: Annotation history
7. **Preview Before Process**: Show estimated result
8. **Batch Export**: Download all versions

## Success Metrics

✅ **Usability**: User dapat dengan mudah switch antara modes
✅ **Speed**: Annotate mode 50% lebih cepat untuk simple edits
✅ **Flexibility**: Brush mode tetap tersedia untuk precision
✅ **Scalability**: Support 10+ annotations per image
✅ **Reliability**: 95%+ success rate untuk batch processing
✅ **UX**: Clear visual feedback di setiap step

---

**Document Version**: 1.0
**Last Updated**: October 7, 2025
**Status**: Ready for Implementation
