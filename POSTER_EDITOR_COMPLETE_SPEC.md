# 🎨 SMART POSTER EDITOR - Complete Specification & Reference

**Version:** 1.0.0
**Date:** 2025-10-06
**Project:** Lumiku App - Smart Poster Editor (App 1 of 2)

---

## 📋 Table of Contents

1. [Vision & Overview](#vision--overview)
2. [Core Features](#core-features)
3. [Technical Architecture](#technical-architecture)
4. [API Specifications](#api-specifications)
5. [Database Schema](#database-schema)
6. [UI/UX Flow](#uiux-flow)
7. [ModelsLab API Integration](#modelslab-api-integration)
8. [Format Library](#format-library)
9. [Implementation Roadmap](#implementation-roadmap)
10. [Pricing & Economics](#pricing--economics)

---

## 🎯 Vision & Overview

### Problem Statement
Non-designers (restaurant owners, small business owners) struggle to:
- Edit simple text in posters (dates, names, titles)
- Resize posters for different use cases (print, social media)
- Create quality content quickly without hiring designers

### Solution
**Smart Poster Editor**: AI-powered tool that enables anyone to:
1. Upload existing poster
2. Auto-detect and edit text using AI
3. Enhance quality with AI upscaling
4. Resize to any format (A0-A5, Instagram, Facebook, etc.)
5. Export in multiple formats at once
6. Send to App 2 for bulk variations

### Key Value Propositions
- ⚡ **10x Faster**: 5 minutes vs 2 hours with designer
- 💰 **Cost Effective**: $0.02 per edit vs $50-200 designer fee
- 🎯 **Zero Skills Required**: No Photoshop, no design knowledge
- 📐 **Professional Output**: Print-ready quality (300 DPI)
- 🔄 **Seamless Integration**: Bridge to variation generator

---

## 🚀 Core Features

### Feature 1: Smart Text Detection & Editing
**Technology:** Tesseract.js OCR + ModelsLab Inpainting

**User Flow:**
1. Upload poster (JPG/PNG/WebP, max 10MB)
2. AI automatically detects all text (2-5 seconds)
3. User sees interactive text overlays with confidence scores
4. Click to edit text inline
5. Drag to reposition
6. Choose font from 50+ library
7. Adjust size, color, effects
8. Click "Generate"

**Backend Process:**
1. OCR detects text positions
2. Generate mask for text areas (Canvas API)
3. ModelsLab Inpainting removes old text
4. node-canvas renders new text
5. Sharp composites final image

**Time:** 15-30 seconds
**Cost:** FREE (with Enterprise plan)

---

### Feature 2: AI Quality Enhancement
**Technology:** ModelsLab Super Resolution API

**Options:**
- **2x Upscale**: 1080×1080 → 2160×2160
- **3x Upscale**: 1080×1080 → 3240×3240
- **4x Upscale**: 1080×1080 → 4320×4320
- **Face Enhancement**: Toggle for portrait posters

**Available Models:**
1. `realesr-general-x4v3` (default, best quality)
2. `RealESRGAN_x4plus` (general purpose)
3. `RealESRGAN_x4plus_anime_6B` (for illustrations)
4. `RealESRGAN_x2plus` (faster, lower scale)
5. `ultra_resolution` (maximum quality)

**Time:** 10-20 seconds
**Cost:** FREE (with Enterprise plan)

---

### Feature 3: Smart Resize & Format Converter
**Technology:** Sharp + Smart Crop Algorithm

**Format Categories:**

#### A. Print Formats (300 DPI)
- A0: 9933×14043 px (841×1189mm)
- A1: 7016×9933 px (594×841mm)
- A2: 4961×7016 px (420×594mm)
- A3: 3508×4961 px (297×420mm)
- A4: 2480×3508 px (210×297mm)
- A5: 1748×2480 px (148×210mm)
- Letter: 2550×3300 px (8.5×11in)
- Legal: 2550×4200 px (8.5×14in)
- Tabloid: 3300×5100 px (11×17in)
- Billboard: 14400×4800 px @150 DPI (48×16ft)
- Poster 24×36: 7200×10800 px (24×36in)

#### B. Social Media Formats
**Instagram:**
- Post: 1080×1080 (1:1)
- Portrait: 1080×1350 (4:5)
- Story: 1080×1920 (9:16)
- Reel: 1080×1920 (9:16)

**Facebook:**
- Post: 1200×630 (1.91:1)
- Cover: 820×312 (2.63:1)
- Ad: 1200×628 (1.91:1)

**Twitter/X:**
- Post: 1200×675 (16:9)
- Header: 1500×500 (3:1)

**LinkedIn:**
- Post: 1200×627 (1.91:1)
- Cover: 1584×396 (4:1)

**TikTok:**
- Video: 1080×1920 (9:16)

**YouTube:**
- Thumbnail: 1280×720 (16:9)
- Banner: 2560×1440 (16:9)

#### C. Preset Packs
**Social Media Pack:**
- Instagram Post (1080×1080)
- Instagram Story (1080×1920)
- Facebook Post (1200×630)

**Print Pack:**
- A4 (2480×3508)
- A3 (3508×4961)
- Poster 24×36 (7200×10800)

**Restaurant Pack:**
- A4 Menu Board (2480×3508)
- Instagram Post (1080×1080)
- Digital Display (1920×1080)

**Complete Marketing Pack:**
- A4, A3, Instagram Post, Instagram Story, Facebook Post, Twitter Post

**Resize Methods:**
- **Smart Crop**: AI detects important regions (faces, text) and crops intelligently
- **Fit**: Maintain aspect ratio, add padding if needed
- **Fill**: Crop to fill entire frame
- **Stretch**: Distort to fit (not recommended)

---

### Feature 4: Batch Export
**Capability:** Export single poster to multiple formats at once

**Example:**
- User clicks "Social Media Pack"
- System generates:
  - poster-ig-post.jpg (1080×1080)
  - poster-ig-story.jpg (1080×1920)
  - poster-fb-post.jpg (1200×630)
- Downloads as ZIP file

**Time:** 5-10 seconds for 3 formats
**Cost:** FREE (Sharp only, no upscaling)

---

### Feature 5: Bridge to App 2
**Purpose:** Seamless handoff to Variation Generator

**Flow:**
1. User completes text editing in App 1
2. Clicks "Create Variations →"
3. Backend creates `VariationProject` entry
4. Links `posterEdit.variationProjectId`
5. Redirects to App 2: `/variations/{projectId}`
6. App 2 loads poster automatically
7. User can generate 20 variations

---

## 🏗️ Technical Architecture

### Tech Stack
- **Backend:** Bun + Fastify + TypeScript
- **Frontend:** React 18 + TypeScript + Vite
- **Database:** PostgreSQL + Prisma ORM
- **Job Queue:** BullMQ + Redis
- **File Storage:** Local filesystem (uploads/) or S3/R2
- **Image Processing:** Sharp (native)
- **Canvas Rendering:** node-canvas
- **OCR:** Tesseract.js
- **UI Canvas:** Fabric.js
- **AI APIs:** ModelsLab (Inpainting, Super Resolution)

### System Architecture

```
┌─────────────────────────────────────────────────────┐
│              FRONTEND (React)                       │
│  - Upload UI                                        │
│  - Fabric.js Text Editor                            │
│  - Format Selector                                  │
│  - Export Manager                                   │
└──────────────────┬──────────────────────────────────┘
                   │ HTTP/WebSocket
┌──────────────────▼──────────────────────────────────┐
│           BACKEND API (Fastify)                     │
│  - Upload handler                                   │
│  - OCR service (Tesseract.js)                       │
│  - Job queue manager (BullMQ)                       │
│  - File storage manager                             │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐  ┌────────▼────────┐
│  JOB WORKERS   │  │  MODELSLAB API  │
│  - Inpainting  │  │  - Inpainting   │
│  - Upscaling   │  │  - Super Res    │
│  - Resizing    │  │                 │
│  - Exporting   │  │                 │
└───────┬────────┘  └─────────────────┘
        │
┌───────▼────────┐
│   STORAGE      │
│  - /uploads    │
│  - /processed  │
│  - /exports    │
└────────────────┘
```

### Directory Structure

```
backend/src/apps/poster-editor/
├── routes.ts                           # Main router
├── controllers/
│   ├── upload.controller.ts            # Handle file uploads
│   ├── text-detection.controller.ts    # OCR endpoint
│   ├── generate.controller.ts          # Generate edited poster
│   ├── enhance.controller.ts           # AI upscaling
│   ├── resize.controller.ts            # Format conversion
│   ├── batch-export.controller.ts      # Multiple formats
│   ├── export.controller.ts            # Download handler
│   └── send-to-variations.controller.ts # Bridge to App 2
├── services/
│   ├── ocr/
│   │   └── tesseract.service.ts        # Text detection
│   ├── modelslab/
│   │   ├── inpainting.service.ts       # Remove text API
│   │   ├── super-resolution.service.ts # Upscale API
│   │   └── webhook.service.ts          # Handle callbacks
│   ├── image/
│   │   ├── mask-generator.service.ts   # Create masks
│   │   ├── text-renderer.service.ts    # Render text (canvas)
│   │   ├── composite.service.ts        # Combine images
│   │   └── smart-crop.service.ts       # Intelligent cropping
│   ├── resize/
│   │   ├── format-converter.service.ts # Resize logic
│   │   ├── batch-resize.service.ts     # Multiple formats
│   │   └── format-presets.ts           # Format definitions
│   └── storage/
│       └── file-manager.service.ts     # File operations
├── jobs/
│   ├── process-inpainting.job.ts       # Queue: inpainting
│   ├── process-upscaling.job.ts        # Queue: upscaling
│   ├── process-resize.job.ts           # Queue: resize
│   └── batch-export.job.ts             # Queue: batch export
├── utils/
│   ├── image-validator.ts              # Validate uploads
│   ├── credit-calculator.ts            # Calculate costs
│   └── error-handler.ts                # Error handling
└── types.ts                            # TypeScript types

frontend/src/apps/PosterEditor/
├── PosterEditor.tsx                    # Main component
├── pages/
│   ├── Upload.tsx                      # Step 1: Upload
│   ├── EditText.tsx                    # Step 2: Edit text
│   ├── Processing.tsx                  # Step 3: Processing
│   ├── PreviewEnhance.tsx              # Step 4: Preview & enhance
│   ├── ResizeFormat.tsx                # Step 5: Resize options
│   └── Export.tsx                      # Step 6: Download
├── components/
│   ├── upload/
│   │   ├── UploadZone.tsx              # Drag & drop
│   │   └── ImagePreview.tsx            # Preview thumbnail
│   ├── editor/
│   │   ├── PosterCanvas.tsx            # Fabric.js canvas
│   │   ├── TextDetector.tsx            # OCR overlay
│   │   ├── TextEditorPanel.tsx         # Edit panel
│   │   ├── FontSelector.tsx            # Font picker
│   │   └── ColorPicker.tsx             # Color chooser
│   ├── enhance/
│   │   ├── EnhancePanel.tsx            # Upscale options
│   │   ├── BeforeAfterSlider.tsx       # Comparison
│   │   └── QualitySelector.tsx         # Scale selector
│   ├── resize/
│   │   ├── FormatSelector.tsx          # Format grid
│   │   ├── PresetPackSelector.tsx      # Pack chooser
│   │   ├── CustomSizeInput.tsx         # Custom dimensions
│   │   └── BatchExportList.tsx         # Selected formats
│   ├── export/
│   │   ├── ExportOptions.tsx           # Download buttons
│   │   ├── ZipDownloader.tsx           # Batch download
│   │   └── SendToVariationsButton.tsx  # Bridge to App 2
│   └── common/
│       ├── ProcessingStatus.tsx        # Progress indicator
│       ├── ProgressBar.tsx             # Progress bar
│       └── ErrorDisplay.tsx            # Error messages
├── hooks/
│   ├── useUpload.ts                    # Upload logic
│   ├── useOCR.ts                       # OCR detection
│   ├── usePosterEdit.ts                # Edit state
│   ├── useEnhance.ts                   # Enhancement
│   ├── useResize.ts                    # Resize logic
│   ├── useBatchExport.ts               # Batch export
│   └── useWebSocket.ts                 # Real-time updates
├── stores/
│   └── posterEditorStore.ts            # Zustand store
├── utils/
│   ├── fabric-helpers.ts               # Fabric.js utils
│   ├── format-helpers.ts               # Format calculations
│   └── api-client.ts                   # API wrapper
└── types.ts                            # TypeScript types
```

---

## 📡 API Specifications

### Base URL
```
Development: http://localhost:3000/api/poster-editor
Production: https://your-domain.com/api/poster-editor
```

### Authentication
All endpoints require user authentication via JWT token in header:
```
Authorization: Bearer {token}
```

---

### 1. Upload Poster

**Endpoint:** `POST /upload`

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  ```
  file: File (JPG/PNG/WebP, max 10MB)
  ```

**Response:**
```json
{
  "success": true,
  "data": {
    "posterId": "clx1234567890",
    "originalUrl": "/uploads/user123/poster456/original.jpg",
    "metadata": {
      "width": 1080,
      "height": 1080,
      "format": "jpeg",
      "fileSize": 2156789,
      "aspectRatio": "1:1"
    }
  }
}
```

---

### 2. Detect Text (OCR)

**Endpoint:** `POST /:posterId/detect-text`

**Request:**
```json
{
  "language": "eng",
  "psm": 3
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "textBoxes": [
      {
        "id": "text_1",
        "text": "GRAND OPENING",
        "confidence": 92.5,
        "bbox": {
          "x": 120,
          "y": 50,
          "width": 840,
          "height": 120
        },
        "font": {
          "detected": "Bebas Neue",
          "fallback": "Arial Black"
        }
      },
      {
        "id": "text_2",
        "text": "15 JAN 2025",
        "confidence": 88.3,
        "bbox": {
          "x": 300,
          "y": 500,
          "width": 480,
          "height": 60
        }
      }
    ],
    "processingTime": 3.2
  }
}
```

---

### 3. Generate Edited Poster

**Endpoint:** `POST /:posterId/generate`

**Request:**
```json
{
  "edits": [
    {
      "id": "text_1",
      "text": "NOW OPEN",
      "position": { "x": 120, "y": 50 },
      "font": {
        "family": "Bebas Neue",
        "size": 72,
        "weight": "bold",
        "color": "#FFFFFF",
        "stroke": "#000000",
        "strokeWidth": 2
      }
    },
    {
      "id": "text_2",
      "text": "20 JAN 2025",
      "position": { "x": 300, "y": 500 },
      "font": {
        "family": "Arial",
        "size": 36,
        "weight": "normal",
        "color": "#FF0000"
      }
    }
  ],
  "options": {
    "preserveEffects": true,
    "matchOriginalColors": false,
    "inpaintingStrength": 0.9
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job_abc123",
    "status": "processing",
    "estimatedTime": 25
  }
}
```

**Job Status Endpoint:** `GET /:posterId/jobs/:jobId/status`

**Job Complete Response:**
```json
{
  "success": true,
  "data": {
    "status": "completed",
    "editedUrl": "/uploads/user123/poster456/edited.jpg",
    "maskUrl": "/uploads/user123/poster456/mask.png",
    "processingTime": 23.5,
    "creditsUsed": 0
  }
}
```

---

### 4. Enhance Quality

**Endpoint:** `POST /:posterId/enhance`

**Request:**
```json
{
  "scale": 3,
  "faceEnhance": true,
  "model": "realesr-general-x4v3"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job_def456",
    "status": "processing",
    "estimatedTime": 15
  }
}
```

**Job Complete:**
```json
{
  "success": true,
  "data": {
    "status": "completed",
    "enhancedUrl": "/uploads/user123/poster456/enhanced.jpg",
    "originalSize": { "width": 1080, "height": 1080 },
    "enhancedSize": { "width": 3240, "height": 3240 },
    "fileSize": 4856732,
    "processingTime": 12.8,
    "creditsUsed": 0
  }
}
```

---

### 5. Resize to Format

**Endpoint:** `POST /:posterId/resize`

**Request:**
```json
{
  "format": "A4",
  "resizeMethod": "smart_crop",
  "quality": "high",
  "autoUpscale": true
}
```

Or custom:
```json
{
  "format": "custom",
  "width": 1920,
  "height": 1080,
  "resizeMethod": "fit",
  "quality": "high"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "formatName": "A4",
    "url": "/exports/user123/poster456/poster-a4.jpg",
    "dimensions": { "width": 2480, "height": 3508 },
    "fileSize": 3256789,
    "wasUpscaled": true,
    "upscaleRatio": 2.3,
    "processingTime": 2.1
  }
}
```

---

### 6. Batch Export

**Endpoint:** `POST /:posterId/batch-export`

**Request:**
```json
{
  "formats": ["A4", "A3", "IG_POST", "IG_STORY", "FB_POST"],
  "packName": "SOCIAL_PACK",
  "autoUpscale": true,
  "quality": "high"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "batch_ghi789",
    "totalFormats": 5,
    "estimatedTime": 15
  }
}
```

**Job Complete:**
```json
{
  "success": true,
  "data": {
    "status": "completed",
    "exports": [
      {
        "format": "A4",
        "url": "/exports/user123/poster456/poster-a4.jpg",
        "dimensions": { "width": 2480, "height": 3508 },
        "fileSize": 3256789
      },
      {
        "format": "IG_POST",
        "url": "/exports/user123/poster456/poster-ig-post.jpg",
        "dimensions": { "width": 1080, "height": 1080 },
        "fileSize": 856234
      }
    ],
    "zipUrl": "/exports/user123/poster456/poster-batch.zip",
    "zipSize": 12456789,
    "processingTime": 13.2,
    "creditsUsed": 0
  }
}
```

---

### 7. Download

**Endpoint:** `GET /:posterId/download`

**Query Params:**
- `version`: `original` | `edited` | `enhanced` | `{formatName}`
- `format`: (optional) specific export format

**Response:**
- Content-Type: `image/jpeg` or `application/zip`
- Binary file stream

---

### 8. Send to Variations

**Endpoint:** `POST /:posterId/send-to-variations`

**Request:**
```json
{
  "sourceVersion": "enhanced"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "variationProjectId": "vproj_xyz123",
    "redirectUrl": "/variations/vproj_xyz123",
    "posterUrl": "/uploads/user123/poster456/enhanced.jpg"
  }
}
```

---

## 💾 Database Schema

### Prisma Schema

```prisma
// backend/prisma/schema.prisma

model PosterEdit {
  id              String      @id @default(cuid())
  userId          String
  user            User        @relation(fields: [userId], references: [id])

  // File URLs
  originalUrl     String      // Original upload
  maskUrl         String?     // Generated mask for inpainting
  editedUrl       String?     // After inpainting + text rendering
  enhancedUrl     String?     // After super resolution

  // Metadata
  originalSize    Json        // {width, height, fileSize, format}
  enhancedSize    Json?       // After upscaling

  // OCR Data
  ocrData         Json?       // Detected text boxes with positions

  // User Edits
  userEdits       Json?       // Text modifications, fonts, colors

  // Enhancement Settings
  enhanceSettings Json?       // {scale, faceEnhance, model}

  // Processing
  status          EditStatus  @default(PENDING)
  processingTime  Int?        // Total seconds
  errorMessage    String?

  // Credits
  creditsUsed     Int         @default(0)
  breakdown       Json?       // {inpainting: 0, enhance: 0, resize: 0}

  // Exports
  exports         PosterExport[]

  // Bridge to App 2
  sentToVariations Boolean    @default(false)
  variationProjectId String?  @unique
  variationProject VariationProject? @relation(fields: [variationProjectId], references: [id])

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([userId, createdAt])
  @@index([status])
}

enum EditStatus {
  PENDING
  UPLOADING
  DETECTING_TEXT
  GENERATING
  ENHANCING
  COMPLETED
  FAILED
}

model PosterExport {
  id              String      @id @default(cuid())
  posterEditId    String
  posterEdit      PosterEdit  @relation(fields: [posterEditId], references: [id], onDelete: Cascade)

  formatName      String      // "A4", "IG_POST", "custom", etc.
  width           Int
  height          Int
  fileUrl         String
  fileSize        Int         // bytes

  resizeMethod    String      // "smart_crop", "fit", "fill", "stretch"
  wasUpscaled     Boolean     @default(false)
  upscaleRatio    Float?

  createdAt       DateTime    @default(now())

  @@index([posterEditId])
  @@index([formatName])
}

// Bridge to App 2
model VariationProject {
  id              String      @id @default(cuid())
  userId          String
  user            User        @relation(fields: [userId], references: [id])

  // Source
  sourceType      SourceType  @default(FROM_EDITOR)
  posterEditId    String?     @unique
  posterEdit      PosterEdit?

  // Or direct upload for App 2
  uploadedUrl     String?

  // Status
  status          String      @default("pending")

  // Variations will be in separate table
  // variations      Variation[]

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([userId, createdAt])
}

enum SourceType {
  FROM_EDITOR     // From App 1
  DIRECT_UPLOAD   // Direct to App 2
}
```

---

## 🎨 UI/UX Flow

### Complete User Journey

#### Screen 1: Welcome & Upload
```
┌───────────────────────────────────────────────────────┐
│  🎨 Smart Poster Editor                               │
│                                                       │
│  Transform your posters in minutes                   │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │                                                 │ │
│  │    📁 Drag & Drop your poster                   │ │
│  │    or click to browse                           │ │
│  │                                                 │ │
│  │    ✅ Supports: JPG, PNG, WebP                  │ │
│  │    📏 Max size: 10MB                            │ │
│  │    🎯 Best quality: 1080×1080 or higher         │ │
│  │                                                 │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  🎯 Use Cases:                                        │
│  • Change dates, names, or text                      │
│  • Resize for print (A3, A4, etc.)                   │
│  • Export for social media                           │
│  • Generate variations (20+ designs)                 │
│                                                       │
│  📸 Try Sample Template ▼                             │
│  [Restaurant] [Cafe] [Event] [Promo]                 │
└───────────────────────────────────────────────────────┘
```

#### Screen 2: Text Detection & Editing
```
┌────────────────────────────────────────────────────────────┐
│  ← Back    🎨 Edit Text (Step 2/6)       [?] Help  [Next] │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌────────────────────────┐  ┌────────────────────────┐  │
│  │   POSTER CANVAS        │  │   EDIT PANEL           │  │
│  │   (Fabric.js)          │  │                        │  │
│  │                        │  │  📝 Detected Text (2)  │  │
│  │   [Poster Preview]     │  │                        │  │
│  │                        │  │  ┌──────────────────┐  │  │
│  │   ┌──────────────┐     │  │  │ ✏️ Text Box 1    │  │  │
│  │   │ GRAND OPENING│ 🖊️  │  │  │                  │  │  │
│  │   └──────────────┘     │  │  │ [GRAND OPENING]  │  │  │
│  │    Confidence: 92% ✅   │  │  │                  │  │  │
│  │                        │  │  │ Font: Bebas ▼    │  │  │
│  │   ┌──────────────┐     │  │  │ Size: 72 ▬▬○▬▬  │  │  │
│  │   │ 15 JAN 2025  │ 🖊️  │  │  │ Color: [⚪]      │  │  │
│  │   └──────────────┘     │  │  │ Outline: [⚫]    │  │  │
│  │    Confidence: 88% ⚠️   │  │  │                  │  │  │
│  │                        │  │  │ [Delete]         │  │  │
│  │  [+ Add Text]          │  │  └──────────────────┘  │  │
│  │                        │  │                        │  │
│  │  🔧 Canvas Tools:      │  │  ┌──────────────────┐  │  │
│  │  [Move] [Edit] [Del]   │  │  │ ✏️ Text Box 2    │  │  │
│  │  [Undo] [Redo]         │  │  │ [15 JAN 2025]   │  │  │
│  │                        │  │  │ Font: Arial ▼    │  │  │
│  │                        │  │  │ ... (same opts)  │  │  │
│  └────────────────────────┘  │  └──────────────────┘  │  │
│                              │                        │  │
│  ⚙️ Settings:                │  💡 Quick Tips:        │  │
│  ☑ Auto-detect text          │  • Click to edit      │  │
│  ☑ Preserve effects          │  • Drag to move       │  │
│  ☐ Match colors              │  • Low confidence?    │  │
│                              │    Verify accuracy!   │  │
│                              │                        │  │
│                              │  [🎨 Generate Poster] │  │
│                              └────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

#### Screen 3: Processing
```
┌─────────────────────────────────────────────┐
│  🔄 Generating your poster...               │
│                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 75%         │
│                                             │
│  ✅ Analyzing text positions                │
│  ✅ Creating removal masks                  │
│  ✅ AI removing old text...                 │
│  ⏳ Rendering new text...                   │
│  ⏳ Finalizing image...                     │
│                                             │
│  Estimated time remaining: 8 seconds        │
│                                             │
│  💡 Did you know?                           │
│  You can enhance quality up to 4K           │
│  resolution in the next step!               │
│                                             │
│  [Cancel]                                   │
└─────────────────────────────────────────────┘
```

#### Screen 4: Preview & Enhancement
```
┌────────────────────────────────────────────────────────────┐
│  ✅ Poster Generated! (Step 4/6)          [Edit Again]     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │         BEFORE / AFTER COMPARISON                    │ │
│  │                                                      │ │
│  │    [Original] ◄═════════○═════════► [Edited]         │ │
│  │                                                      │ │
│  │         [Interactive slider]                         │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 🚀 ENHANCE QUALITY (Optional - Recommended for print)│ │
│  │                                                      │ │
│  │ Make your poster print-ready with AI upscaling       │ │
│  │                                                      │ │
│  │ Resolution:                                          │ │
│  │ ○ 2× (2160×2160) - Good for digital                 │ │
│  │ ● 3× (3240×3240) - Best for A4-A3 print             │ │
│  │ ○ 4× (4320×4320) - Best for A2-A0 print             │ │
│  │                                                      │ │
│  │ Current: 1080×1080 → Enhanced: 3240×3240            │ │
│  │ File size: ~2MB → ~6MB                              │ │
│  │                                                      │ │
│  │ ☐ Face Enhancement (recommended for portraits)       │ │
│  │                                                      │ │
│  │ Model: realesr-general-x4v3 ▼ (Best quality)        │ │
│  │                                                      │ │
│  │ Processing time: ~15 seconds | Credits: FREE         │ │
│  │                                                      │ │
│  │ [✨ Enhance Now]  [Skip Enhancement →]               │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  📊 Quality Preview:                                       │
│  Before: 1080×1080 (72 DPI - web only)                    │
│  After:  3240×3240 (300 DPI - print ready)                │
└────────────────────────────────────────────────────────────┘
```

#### Screen 5: Resize & Format Selection
```
┌────────────────────────────────────────────────────────────┐
│  📐 Resize & Format (Step 5/6)              [Skip] [Next]  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Current: 3240×3240 px (Enhanced 3×)                      │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 🖨️ PRINT FORMATS (300 DPI)                           │ │
│  │                                                      │ │
│  │ Popular Sizes:                                       │ │
│  │ [ A5 ] [ A4 ] [ A3 ] [ A2 ] [ A1 ] [ A0 ]          │ │
│  │ Small   Most   Large  Poster Banner Billboard       │ │
│  │        Used                                          │ │
│  │                                                      │ │
│  │ US Sizes:                                            │ │
│  │ [Letter] [Legal] [Tabloid] [24×36 Poster]           │ │
│  │                                                      │ │
│  │ Custom Print Size:                                   │ │
│  │ Width: [____] mm  Height: [____] mm                 │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 📱 SOCIAL MEDIA FORMATS                              │ │
│  │                                                      │ │
│  │ Instagram:                                           │ │
│  │ [  Post  ] [ Portrait ] [  Story  ] [  Reel  ]      │ │
│  │  1:1 ✅     4:5          9:16        9:16           │ │
│  │  Selected                                            │ │
│  │                                                      │ │
│  │ Facebook:                                            │ │
│  │ [  Post  ] [  Cover  ] [   Ad   ]                   │ │
│  │  1.91:1      2.63:1      1.91:1                     │ │
│  │                                                      │ │
│  │ Other Platforms:                                     │ │
│  │ [ Twitter ] [ LinkedIn ] [ TikTok ] [ YouTube ]     │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 🎯 PRESET PACKS (One-click export)                   │ │
│  │                                                      │ │
│  │ [📱 Social Media Pack]    3 formats                  │ │
│  │    • IG Post, IG Story, FB Post                     │ │
│  │                                                      │ │
│  │ [🖨️ Print Pack]           3 formats                  │ │
│  │    • A4, A3, 24×36 Poster                           │ │
│  │                                                      │ │
│  │ [🍽️ Restaurant Pack]      3 formats                  │ │
│  │    • A4 Menu, IG Post, Digital Display              │ │
│  │                                                      │ │
│  │ [⭐ Complete Pack]        6 formats                  │ │
│  │    • A4, A3, IG Post/Story, FB Post, Twitter        │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ ⚙️ RESIZE SETTINGS                                   │ │
│  │                                                      │ │
│  │ Method: ● Smart Crop  ○ Fit  ○ Fill  ○ Stretch     │ │
│  │                                                      │ │
│  │ Smart Crop: AI detects faces and text, crops        │ │
│  │ intelligently to preserve important content          │ │
│  │                                                      │ │
│  │ Quality: ● High (300 DPI) ○ Medium (150) ○ Low (72) │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  📦 Selected: 1 format (IG Post)                          │
│  [+ Add More Formats]                                     │
│                                                            │
│  [Continue to Export →]                                   │
└────────────────────────────────────────────────────────────┘
```

#### Screen 6: Export & Download
```
┌────────────────────────────────────────────────────────────┐
│  ✅ All Done! (Step 6/6)                                   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  🎉 Your poster is ready!                                 │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 📥 DOWNLOAD OPTIONS                                  │ │
│  │                                                      │ │
│  │ [⬇️ Download Original Edit]                          │ │
│  │    1080×1080 px | 2.1 MB                            │ │
│  │                                                      │ │
│  │ [⬇️ Download Enhanced (3×)]                          │ │
│  │    3240×3240 px | 6.3 MB | Recommended              │ │
│  │                                                      │ │
│  │ [⬇️ Download Instagram Post]                         │ │
│  │    1080×1080 px | 1.8 MB                            │ │
│  │                                                      │ │
│  │ [⬇️ Download All as ZIP]                             │ │
│  │    3 files | 10.2 MB total                          │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 🎨 NEXT STEPS                                        │ │
│  │                                                      │ │
│  │ Want more variations of this poster?                 │ │
│  │                                                      │ │
│  │ [🚀 Generate 20 Variations →]                        │ │
│  │                                                      │ │
│  │ Our AI will create 20 different design styles       │ │
│  │ from your edited poster in minutes!                  │ │
│  │                                                      │ │
│  │ • Minimalist, Colorful, Elegant, Modern, etc.       │ │
│  │ • Bulk export all formats                            │ │
│  │ • Perfect for A/B testing                            │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 📊 SESSION SUMMARY                                   │ │
│  │                                                      │ │
│  │ ✅ Text edits: 2 changes                             │ │
│  │ ✅ Enhanced: 3× upscale                              │ │
│  │ ✅ Formats: 1 (IG Post)                              │ │
│  │ ⏱️  Total time: 45 seconds                           │ │
│  │ 💳 Credits used: 0 (Unlimited plan)                  │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  [🔄 Edit Another Poster]  [📚 View My Projects]          │
└────────────────────────────────────────────────────────────┘
```

---

## 🔌 ModelsLab API Integration

### Configuration

```typescript
// backend/src/config/modelslab.ts

export const MODELSLAB_CONFIG = {
  apiKey: process.env.MODELSLAB_API_KEY!,
  baseUrl: 'https://modelslab.com/api/v6',

  // Endpoints
  endpoints: {
    inpainting: '/image_editing/inpaint',
    superResolution: '/image_editing/super_resolution',
    backgroundRemoval: '/image_editing/remove_bg',
    objectRemoval: '/image_editing/object_removal',
  },

  // Pricing plan
  plan: 'ENTERPRISE', // UNLIMITED calls

  // Limits
  maxParallelJobs: 15,
  timeoutMs: 120000, // 2 minutes

  // Webhook
  webhookUrl: process.env.MODELSLAB_WEBHOOK_URL,
  webhookSecret: process.env.MODELSLAB_WEBHOOK_SECRET,
};
```

### Inpainting Service

```typescript
// backend/src/apps/poster-editor/services/modelslab/inpainting.service.ts

import axios from 'axios';
import { MODELSLAB_CONFIG } from '../../../config/modelslab';

export class InpaintingService {
  async removeText(params: {
    initImageUrl: string;
    maskImageUrl: string;
    prompt?: string;
    negativePrompt?: string;
    strength?: number;
    webhookUrl?: string;
  }) {
    const response = await axios.post(
      `${MODELSLAB_CONFIG.baseUrl}${MODELSLAB_CONFIG.endpoints.inpainting}`,
      {
        key: MODELSLAB_CONFIG.apiKey,
        init_image: params.initImageUrl,
        mask_image: params.maskImageUrl,
        prompt: params.prompt || 'clean background, seamless, high quality',
        negative_prompt: params.negativePrompt || 'text, letters, words, watermark, logo',
        strength: params.strength || 0.9,
        num_inference_steps: 30,
        guidance_scale: 7.5,
        samples: 1,
        safety_checker: false,
        webhook: params.webhookUrl || MODELSLAB_CONFIG.webhookUrl,
        track_id: Date.now().toString(),
      }
    );

    return response.data;
  }

  async checkStatus(requestId: string) {
    // Poll for result or handle webhook
    // Implementation depends on ModelsLab's response pattern
  }
}
```

### Super Resolution Service

```typescript
// backend/src/apps/poster-editor/services/modelslab/super-resolution.service.ts

export class SuperResolutionService {
  async upscale(params: {
    imageUrl: string;
    scale: 2 | 3 | 4;
    faceEnhance?: boolean;
    model?: string;
    webhookUrl?: string;
  }) {
    const response = await axios.post(
      `${MODELSLAB_CONFIG.baseUrl}${MODELSLAB_CONFIG.endpoints.superResolution}`,
      {
        key: MODELSLAB_CONFIG.apiKey,
        init_image: params.imageUrl,
        scale: params.scale,
        face_enhance: params.faceEnhance || false,
        model_id: params.model || 'realesr-general-x4v3',
        webhook: params.webhookUrl || MODELSLAB_CONFIG.webhookUrl,
        track_id: Date.now().toString(),
      }
    );

    return response.data;
  }
}
```

### Webhook Handler

```typescript
// backend/src/apps/poster-editor/services/modelslab/webhook.service.ts

export class WebhookService {
  async handleCallback(body: any, signature: string) {
    // Verify signature
    const isValid = this.verifySignature(body, signature);
    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }

    // Process based on status
    const { status, output, track_id } = body;

    if (status === 'success') {
      // Update job status
      await this.updateJobStatus(track_id, {
        status: 'completed',
        resultUrl: output[0], // First result
      });

      // Notify client via WebSocket
      await this.notifyClient(track_id, {
        status: 'completed',
        url: output[0],
      });
    } else if (status === 'error') {
      await this.updateJobStatus(track_id, {
        status: 'failed',
        error: body.message,
      });
    }
  }

  private verifySignature(body: any, signature: string): boolean {
    // Implement signature verification
    return true;
  }
}
```

---

## 📐 Format Library

Complete format definitions with exact pixel dimensions:

```typescript
// backend/src/apps/poster-editor/services/resize/format-presets.ts

export interface FormatDefinition {
  name: string;
  width: number;
  height: number;
  dpi?: number;
  category: 'print' | 'social' | 'custom';
  aspectRatio: string;
  description: string;
}

export const PRINT_FORMATS: Record<string, FormatDefinition> = {
  // ISO A Series (at 300 DPI)
  A0: {
    name: 'A0',
    width: 9933,
    height: 14043,
    dpi: 300,
    category: 'print',
    aspectRatio: '1:1.41',
    description: 'A0 (841×1189mm) - Billboard, large poster',
  },
  A1: {
    name: 'A1',
    width: 7016,
    height: 9933,
    dpi: 300,
    category: 'print',
    aspectRatio: '1:1.41',
    description: 'A1 (594×841mm) - Large poster',
  },
  A2: {
    name: 'A2',
    width: 4961,
    height: 7016,
    dpi: 300,
    category: 'print',
    aspectRatio: '1:1.41',
    description: 'A2 (420×594mm) - Poster, menu board',
  },
  A3: {
    name: 'A3',
    width: 3508,
    height: 4961,
    dpi: 300,
    category: 'print',
    aspectRatio: '1:1.41',
    description: 'A3 (297×420mm) - Large flyer, small poster',
  },
  A4: {
    name: 'A4',
    width: 2480,
    height: 3508,
    dpi: 300,
    category: 'print',
    aspectRatio: '1:1.41',
    description: 'A4 (210×297mm) - Standard document, menu',
  },
  A5: {
    name: 'A5',
    width: 1748,
    height: 2480,
    dpi: 300,
    category: 'print',
    aspectRatio: '1:1.41',
    description: 'A5 (148×210mm) - Flyer, handout',
  },

  // US Paper Sizes (at 300 DPI)
  LETTER: {
    name: 'Letter',
    width: 2550,
    height: 3300,
    dpi: 300,
    category: 'print',
    aspectRatio: '1:1.29',
    description: 'Letter (8.5×11in) - US standard',
  },
  LEGAL: {
    name: 'Legal',
    width: 2550,
    height: 4200,
    dpi: 300,
    category: 'print',
    aspectRatio: '1:1.65',
    description: 'Legal (8.5×14in) - US legal document',
  },
  TABLOID: {
    name: 'Tabloid',
    width: 3300,
    height: 5100,
    dpi: 300,
    category: 'print',
    aspectRatio: '1:1.55',
    description: 'Tabloid (11×17in) - Newspaper, poster',
  },

  // Large Format
  POSTER_24x36: {
    name: '24×36 Poster',
    width: 7200,
    height: 10800,
    dpi: 300,
    category: 'print',
    aspectRatio: '2:3',
    description: '24×36 inches - Movie poster size',
  },
  BILLBOARD: {
    name: 'Billboard',
    width: 14400,
    height: 4800,
    dpi: 150,
    category: 'print',
    aspectRatio: '3:1',
    description: '48×16 feet - Large billboard',
  },
};

export const SOCIAL_FORMATS: Record<string, FormatDefinition> = {
  // Instagram
  IG_POST: {
    name: 'Instagram Post',
    width: 1080,
    height: 1080,
    category: 'social',
    aspectRatio: '1:1',
    description: 'Instagram square post',
  },
  IG_PORTRAIT: {
    name: 'Instagram Portrait',
    width: 1080,
    height: 1350,
    category: 'social',
    aspectRatio: '4:5',
    description: 'Instagram portrait post',
  },
  IG_STORY: {
    name: 'Instagram Story',
    width: 1080,
    height: 1920,
    category: 'social',
    aspectRatio: '9:16',
    description: 'Instagram story / reel',
  },
  IG_REEL: {
    name: 'Instagram Reel',
    width: 1080,
    height: 1920,
    category: 'social',
    aspectRatio: '9:16',
    description: 'Instagram reel video',
  },

  // Facebook
  FB_POST: {
    name: 'Facebook Post',
    width: 1200,
    height: 630,
    category: 'social',
    aspectRatio: '1.91:1',
    description: 'Facebook link preview',
  },
  FB_COVER: {
    name: 'Facebook Cover',
    width: 820,
    height: 312,
    category: 'social',
    aspectRatio: '2.63:1',
    description: 'Facebook page cover',
  },
  FB_AD: {
    name: 'Facebook Ad',
    width: 1200,
    height: 628,
    category: 'social',
    aspectRatio: '1.91:1',
    description: 'Facebook ad image',
  },

  // Twitter/X
  X_POST: {
    name: 'X/Twitter Post',
    width: 1200,
    height: 675,
    category: 'social',
    aspectRatio: '16:9',
    description: 'Twitter/X post image',
  },
  X_HEADER: {
    name: 'X/Twitter Header',
    width: 1500,
    height: 500,
    category: 'social',
    aspectRatio: '3:1',
    description: 'Twitter/X profile header',
  },

  // LinkedIn
  LI_POST: {
    name: 'LinkedIn Post',
    width: 1200,
    height: 627,
    category: 'social',
    aspectRatio: '1.91:1',
    description: 'LinkedIn post image',
  },
  LI_COVER: {
    name: 'LinkedIn Cover',
    width: 1584,
    height: 396,
    category: 'social',
    aspectRatio: '4:1',
    description: 'LinkedIn profile cover',
  },

  // TikTok
  TIKTOK: {
    name: 'TikTok',
    width: 1080,
    height: 1920,
    category: 'social',
    aspectRatio: '9:16',
    description: 'TikTok video thumbnail',
  },

  // YouTube
  YT_THUMBNAIL: {
    name: 'YouTube Thumbnail',
    width: 1280,
    height: 720,
    category: 'social',
    aspectRatio: '16:9',
    description: 'YouTube video thumbnail',
  },
  YT_BANNER: {
    name: 'YouTube Banner',
    width: 2560,
    height: 1440,
    category: 'social',
    aspectRatio: '16:9',
    description: 'YouTube channel banner',
  },
};

export const PRESET_PACKS = {
  SOCIAL_PACK: {
    name: 'Social Media Pack',
    formats: ['IG_POST', 'IG_STORY', 'FB_POST'],
    description: 'Perfect for social media marketing',
  },
  PRINT_PACK: {
    name: 'Print Pack',
    formats: ['A4', 'A3', 'POSTER_24x36'],
    description: 'Ready for professional printing',
  },
  RESTAURANT_PACK: {
    name: 'Restaurant Pack',
    formats: ['A4', 'IG_POST', 'IG_STORY'],
    description: 'Menu boards + social media',
  },
  COMPLETE_PACK: {
    name: 'Complete Marketing Pack',
    formats: ['A4', 'A3', 'IG_POST', 'IG_STORY', 'FB_POST', 'X_POST'],
    description: 'Everything for omnichannel marketing',
  },
};

export const ALL_FORMATS = {
  ...PRINT_FORMATS,
  ...SOCIAL_FORMATS,
};
```

---

## 🗺️ Implementation Roadmap

### Week 1: Foundation
**Days 1-2:** Setup & Infrastructure
- ✅ Create database schema
- ✅ Setup folder structure
- ✅ Install dependencies
- ✅ Configure ModelsLab API
- ✅ Setup file storage

**Days 3-5:** Core Backend Services
- ✅ Upload endpoint
- ✅ OCR service (Tesseract.js)
- ✅ Mask generation service
- ✅ ModelsLab integration
- ✅ Job queue setup

**Days 6-7:** Basic Frontend
- ✅ Upload UI
- ✅ Basic layout
- ✅ API integration
- ✅ State management

### Week 2: Core Features
**Days 8-10:** Text Editing
- ✅ Fabric.js canvas setup
- ✅ Text overlay component
- ✅ Edit panel UI
- ✅ Font library integration
- ✅ Color picker

**Days 11-12:** Image Processing
- ✅ Text rendering service (node-canvas)
- ✅ Image composite (Sharp)
- ✅ Inpainting job worker
- ✅ WebSocket real-time updates

**Days 13-14:** Testing & Polish
- ✅ End-to-end testing
- ✅ Error handling
- ✅ Loading states
- ✅ Bug fixes

### Week 3: Enhancement Features
**Days 15-16:** Super Resolution
- ✅ Super Resolution service
- ✅ Upscaling job worker
- ✅ Enhancement UI panel
- ✅ Before/After comparison

**Days 17-18:** Resize & Format
- ✅ Format presets library
- ✅ Smart crop algorithm
- ✅ Resize service
- ✅ Format selector UI

**Days 19-21:** Batch Export
- ✅ Batch export service
- ✅ ZIP generation
- ✅ Preset packs
- ✅ Download manager UI

### Week 4: Integration & Polish
**Days 22-23:** App 2 Bridge
- ✅ VariationProject schema
- ✅ Send to variations endpoint
- ✅ Bridge UI component
- ✅ Data handoff

**Days 24-25:** Credit System
- ✅ Credit calculation
- ✅ Usage tracking
- ✅ Quota management
- ✅ UI indicators

**Days 26-28:** Final Polish
- ✅ Performance optimization
- ✅ Error handling
- ✅ User onboarding
- ✅ Documentation
- ✅ Deployment

### Week 5: Launch
**Days 29-30:** Testing & Launch
- ✅ Full QA testing
- ✅ User testing
- ✅ Bug fixes
- ✅ Production deployment

---

## 💰 Pricing & Economics

### ModelsLab Subscription
**Enterprise Plan: $147/month**
- UNLIMITED Inpainting API calls
- UNLIMITED Super Resolution calls
- 15 parallel generations
- Access to all models
- No per-image fees

### Operational Costs
**Monthly:**
- ModelsLab: $147
- Server (2GB RAM): ~$20
- Storage (100GB): ~$10
- Database: ~$15
- **Total: ~$192/month**

### User Pricing Strategy

**Free Tier:**
- 3 edits per month
- Basic features only
- Watermark on exports
- Purpose: Acquisition & trial

**Basic Plan: $7/month**
- 25 edits per month
- Full text editing
- Quality enhancement (3×)
- All social media formats
- No watermark

**Pro Plan: $19/month**
- UNLIMITED edits
- All features unlocked
- All print formats (up to A0)
- Batch export
- Send to App 2
- Priority processing

**Bundle (Both Apps): $39/month**
- Everything in Pro (App 1)
- Variation Generator Pro (App 2)
- Save $9/month vs separate
- Best value

### Revenue Projections

**Break-even:**
- Need ~5 Pro users: 5 × $19 = $95
- Or ~10 Basic users: 10 × $7 = $70
- Or ~2 Bundle users: 2 × $39 = $78
- **Conservative target: 10 paying users = break-even**

**Growth Scenario (6 months):**
- 100 Free users (funnel)
- 30 Basic users: $210/month
- 20 Pro users: $380/month
- 15 Bundle users: $585/month
- **Total MRR: $1,175**
- **Profit: ~$983/month**

**Scale Scenario (12 months):**
- 500 Free users
- 100 Basic: $700/month
- 75 Pro: $1,425/month
- 50 Bundle: $1,950/month
- **Total MRR: $4,075**
- **Profit: ~$3,883/month**

### Unit Economics
**Per User (Pro plan):**
- Revenue: $19/month
- Cost: $1.92 (assuming 10 users sharing $192 infra)
- **Margin: $17.08 (90%)**
- **LTV (12 months): $205**
- **CAC target: <$50**

**Why this works:**
- Fixed cost model (unlimited API plan)
- High gross margin (90%+)
- Scalable infrastructure
- Low customer acquisition cost potential (organic + content marketing)

---

## ✅ Success Metrics

### Technical KPIs
- Upload success rate: >99%
- OCR accuracy: >80%
- Processing time: <30s (edit), <20s (enhance)
- API uptime: >99.9%
- Error rate: <1%

### User Experience KPIs
- Time to first edit: <2 minutes
- Completion rate: >70%
- User satisfaction: >4.5/5
- Return rate: >40%

### Business KPIs
- Free → Paid conversion: >5%
- Monthly churn: <10%
- LTV:CAC ratio: >3:1
- Monthly revenue growth: >20%

---

## 🔒 Security & Privacy

### Data Protection
- Uploaded images stored temporarily (30 days)
- Automatic cleanup of old files
- User data encrypted at rest
- HTTPS only
- No image analysis beyond OCR

### API Security
- API keys in environment variables
- Webhook signature verification
- Rate limiting per user
- Request validation
- CORS configuration

### User Privacy
- No sharing of user images
- No training on user data
- GDPR compliant
- Clear data deletion policy
- Privacy-first design

---

## 📚 References

### ModelsLab Documentation
- API Docs: https://docs.modelslab.com
- Pricing: https://modelslab.com/pricing
- Inpainting: https://docs.modelslab.com/image-editing/inpaint
- Super Resolution: https://docs.modelslab.com/image-editing/super-resolution

### Libraries & Tools
- Sharp: https://sharp.pixelplumbing.com
- Tesseract.js: https://tesseract.projectnaptha.com
- Fabric.js: http://fabricjs.com
- node-canvas: https://github.com/Automattic/node-canvas
- BullMQ: https://docs.bullmq.io

### Design Resources
- ISO Paper Sizes: https://www.papersizes.org/a-sizes-in-pixels.htm
- Social Media Sizes: https://sproutsocial.com/insights/social-media-image-sizes-guide/
- Print DPI Standards: https://www.printingforless.com/dpi-ppi-guide.html

---

**Document Version:** 1.0.0
**Last Updated:** 2025-10-06
**Status:** Ready for Implementation
**Next Step:** Begin Week 1 - Foundation Setup

---

*This is the master reference document. All implementation should follow these specifications.*
