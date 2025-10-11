# Poster Editor - Implementation Plan

**Created:** 2025-10-07
**Status:** ✅ In Progress
**Design Reference:** Freepik AI Image Editor + Lumiku Pattern

---

## 🎯 Vision

Menggabungkan layout Freepik dengan pattern Lumiku yang konsisten dengan aplikasi lain (Carousel Mix, Video Generator).

## 🏗️ Architecture Overview

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ [Header - Standard Lumiku]                                   │
├─────────────────────────────────────────────────────────────┤
│ [Content Area - Max Width 7xl]                              │
│ ┌──────────────────────────┬────────────────────────────┐  │
│ │ Left Panel (60%)         │ Right Panel (40%)          │  │
│ │                          │                            │  │
│ │ ┌────────────────────┐   │ ┌────────────────────────┐ │  │
│ │ │  Canvas Editor     │   │ │  Upload Section        │ │  │
│ │ │  (Freepik-style)   │   │ │  - Drag & Drop         │ │  │
│ │ │                    │   │ │  - File Input          │ │  │
│ │ │  - Image Display   │   │ └────────────────────────┘ │  │
│ │ │  - Zoom Controls   │   │                            │  │
│ │ │  - Text Boxes      │   │ ┌────────────────────────┐ │  │
│ │ │  - Annotations     │   │ │  Posters List          │ │  │
│ │ │                    │   │ │  - Thumbnails          │ │  │
│ │ └────────────────────┘   │ │  - Status badges       │ │  │
│ │                          │ │  - Quick actions       │ │  │
│ │ [Bottom Toolbar]         │ └────────────────────────┘ │  │
│ │ - Text Detection         │                            │  │
│ │ - Inpainting            │ ┌────────────────────────┐ │  │
│ │ - Enhancement           │ │  Export History        │ │  │
│ │ - Export                │ │  - Downloads           │ │  │
│ └──────────────────────────┴────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Responsive Behavior

- **Desktop (lg+):** 60/40 split, side-by-side
- **Tablet (md):** 50/50 split
- **Mobile:** Stacked vertically (Editor top, Management bottom)

---

## 📋 Implementation Phases

### ✅ Phase 0: Foundation (DONE)
- [x] Project management system
- [x] Database schema (PosterEditorProject, PosterEdit, PosterExport)
- [x] Basic routes and service layer
- [x] Project list view

### 🔨 Phase 1: Split Panel Structure
**Goal:** Implement basic layout with upload functionality

**Frontend:**
1. Update `PosterEditor.tsx` project detail view
2. Create split panel layout (60/40)
3. Create components:
   - `EditorCanvas.tsx` - Left panel canvas area
   - `UploadPanel.tsx` - Right panel upload section
   - `PostersList.tsx` - Right panel posters list

**Backend:**
1. Implement `/upload` endpoint
2. File upload handling with multer
3. Save to `/uploads/poster-editor/`
4. Create database record

**Features:**
- Drag & drop upload
- File validation (image only, max 10MB)
- Display uploaded poster in canvas
- Show poster in list

---

### 🔨 Phase 2: Canvas Editor Basics
**Goal:** Interactive canvas with zoom and pan

**Frontend Components:**
1. `ZoomControls.tsx` - Zoom in/out, fit to screen, percentage display
2. `CanvasToolbar.tsx` - Bottom toolbar with mode selection
3. Enhanced `EditorCanvas.tsx`:
   - Image rendering with zoom/pan
   - Mouse interactions (drag to pan)
   - Zoom with mouse wheel

**Features:**
- Pan canvas by dragging
- Zoom: 10% - 400%
- Fit to screen button
- Canvas grid/guides (optional)

---

### 🔨 Phase 3: Text Detection
**Goal:** Detect text in poster and display bounding boxes

**Backend:**
1. Implement `/detect-text` endpoint
2. Integrate Eden AI Text Detection API
3. Store detected text regions in database
4. Update `PosterEdit` status to 'detected'

**Frontend:**
1. `TextDetectionOverlay.tsx` - Display bounding boxes
2. Text detection button in toolbar
3. Visual feedback (loading, success, error)
4. Click text box to edit

**Features:**
- Auto detect text on upload (optional)
- Manual trigger text detection
- Display bounding boxes with labels
- Edit detected text content
- Save/update text regions

**Database:**
```typescript
detectedTexts: Json? // Array of { x, y, width, height, text, confidence }
```

---

### 🔨 Phase 4: Text Editing & Inpainting
**Goal:** Remove/replace text using inpainting

**Backend:**
1. Implement `/inpaint` endpoint
2. Integrate inpainting API (Stability AI / Eden AI)
3. Generate mask from text region
4. Apply inpainting to remove text
5. Save edited version

**Frontend:**
1. `InpaintingTool.tsx` - Brush tool for manual masking
2. `TextEditModal.tsx` - Edit text content and style
3. Text replacement workflow:
   - Click text box → Open modal
   - Edit text or remove
   - Preview inpainting
   - Apply changes

**Features:**
- Auto-generate mask from text region
- Manual brush tool for custom masking
- Inpaint to remove text
- Add new text overlay (canvas text)
- Undo/redo support

**Database:**
```typescript
editedUrl: String? // URL of edited poster
editStatus: 'original' | 'editing' | 'edited'
```

---

### 🔨 Phase 5: Image Enhancement
**Goal:** Upscale and enhance poster quality

**Backend:**
1. Implement `/enhance` endpoint
2. Integrate enhancement API (Real-ESRGAN via Eden AI)
3. Support multiple enhancement models
4. Save enhanced version

**Frontend:**
1. `EnhancementPanel.tsx` - Model selection and settings
2. Enhancement preview (side-by-side comparison)
3. Apply enhancement

**Features:**
- Choose enhancement model
- Preview before/after
- Apply enhancement
- Download original/edited/enhanced

**Database:**
```typescript
enhancedUrl: String? // URL of enhanced poster
enhancementModel: String?
```

---

### 🔨 Phase 6: Multi-Format Export
**Goal:** Export poster in multiple sizes and formats

**Backend:**
1. Implement `/resize` endpoint
2. Implement `/batch-export` endpoint
3. Support preset formats:
   - Instagram Post (1080x1080)
   - Instagram Story (1080x1920)
   - Facebook Post (1200x630)
   - Custom dimensions
4. Export to PNG, JPG, WebP
5. Save export records

**Frontend:**
1. `ExportModal.tsx` - Format selection and export
2. `ExportHistory.tsx` - List of exports in right panel
3. Batch export (multiple formats at once)
4. Download all as ZIP

**Features:**
- Preset format selection
- Custom dimensions
- Format selection (PNG/JPG/WebP)
- Quality settings
- Batch export
- Export history with downloads

**Database:**
```typescript
model PosterExport {
  id          String   @id @default(cuid())
  posterId    String
  posterEdit  PosterEdit @relation(fields: [posterId], references: [id], onDelete: Cascade)
  format      String   // 'instagram-post', 'instagram-story', etc.
  width       Int
  height      Int
  fileType    String   // 'png', 'jpg', 'webp'
  fileSize    Int?
  url         String
  createdAt   DateTime @default(now())
}
```

---

## 🎨 Design System

### Colors (Green Theme)
- Primary: `bg-green-600`, `hover:bg-green-700`
- Light: `bg-green-50`, `text-green-700`
- Accent: `border-green-300`

### Components Styling
- Canvas: `bg-slate-100` with checkered pattern
- Toolbar: `bg-white`, `border-t`, `shadow-lg`
- Sidebar: `bg-white`, `border-r`
- Cards: `rounded-xl`, `shadow-lg`

### Icons (lucide-react)
- Upload: `Upload`, `ImagePlus`
- Edit: `Pencil`, `Eraser`, `Type`
- Zoom: `ZoomIn`, `ZoomOut`, `Maximize2`
- Export: `Download`, `FileDown`
- Enhance: `Sparkles`, `Wand2`

---

## 🔌 Backend API Endpoints

### Projects (Already Implemented)
- `GET /api/apps/poster-editor/projects` - List projects
- `POST /api/apps/poster-editor/projects` - Create project
- `GET /api/apps/poster-editor/projects/:id` - Get project
- `PUT /api/apps/poster-editor/projects/:id` - Update project
- `DELETE /api/apps/poster-editor/projects/:id` - Delete project

### Posters (To Implement)
- `POST /api/apps/poster-editor/upload` - Upload poster
- `GET /api/apps/poster-editor/posters/:id` - Get poster details
- `DELETE /api/apps/poster-editor/posters/:id` - Delete poster

### Text Detection (To Implement)
- `POST /api/apps/poster-editor/detect-text` - Detect text in poster
- `GET /api/apps/poster-editor/posters/:id/detected-text` - Get detected text
- `PUT /api/apps/poster-editor/posters/:id/detected-text` - Update detected text

### Editing (To Implement)
- `POST /api/apps/poster-editor/inpaint` - Inpaint/remove text
- `POST /api/apps/poster-editor/add-text` - Add text overlay

### Enhancement (To Implement)
- `POST /api/apps/poster-editor/enhance` - Enhance poster quality
- `GET /api/apps/poster-editor/enhance/models` - List enhancement models

### Export (To Implement)
- `POST /api/apps/poster-editor/resize` - Resize poster
- `POST /api/apps/poster-editor/batch-export` - Batch export
- `GET /api/apps/poster-editor/formats` - List preset formats
- `GET /api/apps/poster-editor/posters/:id/exports` - Get export history
- `POST /api/apps/poster-editor/exports/:id/download` - Download export

---

## 📦 Dependencies

### Already Installed
- `@prisma/client` - Database ORM
- `hono` - Web framework
- `zod` - Validation
- `lucide-react` - Icons
- `react-router-dom` - Routing

### To Install
```bash
# Backend
cd backend
bun add multer @types/multer sharp axios form-data

# Frontend (if needed)
cd frontend
npm install react-dropzone
```

---

## 🔐 Credit System

### Cost Structure
- **Upload:** FREE
- **Text Detection:** 50 credits
- **Inpainting:** 100 credits per operation
- **Enhancement:** 150 credits
- **Export (single):** FREE
- **Batch Export:** 50 credits

### Implementation
- Check credit balance before operation
- Deduct credits on successful completion
- Refund on failure
- Display cost estimates in UI

---

## 🧪 Testing Checklist

### Phase 1
- [ ] Upload image via drag & drop
- [ ] Upload image via file input
- [ ] Display poster in canvas
- [ ] Show poster in list
- [ ] Responsive layout works

### Phase 2
- [ ] Zoom in/out works
- [ ] Pan canvas by dragging
- [ ] Fit to screen button
- [ ] Zoom percentage display

### Phase 3
- [ ] Text detection triggers
- [ ] Bounding boxes display correctly
- [ ] Click to edit text
- [ ] Save detected text

### Phase 4
- [ ] Inpaint removes text
- [ ] Manual masking tool works
- [ ] Text overlay addition
- [ ] Undo/redo functionality

### Phase 5
- [ ] Enhancement preview works
- [ ] Apply enhancement
- [ ] Download enhanced version

### Phase 6
- [ ] Single format export
- [ ] Batch export multiple formats
- [ ] Export history displays
- [ ] Download exports

---

## 📝 Notes

### API Integration
- Use Eden AI for text detection and enhancement
- Use Stability AI or Eden AI for inpainting
- Fallback to local processing if API fails

### File Storage
- Originals: `/uploads/poster-editor/originals/`
- Edited: `/uploads/poster-editor/edited/`
- Enhanced: `/uploads/poster-editor/enhanced/`
- Exports: `/uploads/poster-editor/exports/`

### Performance
- Lazy load images
- Compress thumbnails
- Cache API responses
- Queue heavy operations

### Security
- Validate file types (images only)
- Limit file size (10MB max)
- Sanitize filenames
- Check user ownership

---

**Last Updated:** 2025-10-07
**Next Phase:** Phase 1 - Split Panel Structure
