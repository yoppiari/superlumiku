# 🎨 Smart Poster Editor - Complete Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Pricing & Credits](#pricing--credits)
4. [Setup & Configuration](#setup--configuration)
5. [API Endpoints](#api-endpoints)
6. [ModelsLab Integration](#modelslab-integration)
7. [Usage Guide](#usage-guide)
8. [Troubleshooting](#troubleshooting)

---

## 📖 Overview

Smart Poster Editor adalah aplikasi yang memungkinkan pengguna untuk mengedit teks pada poster secara otomatis menggunakan AI, enhance kualitas gambar, dan mengexport ke berbagai format (print & social media).

### ✨ Key Features
- **AI Text Detection**: Auto-detect teks dengan Tesseract.js OCR
- **Smart Text Editing**: Edit teks langsung dengan visual editor (Fabric.js)
- **AI Inpainting**: Hapus teks lama dengan ModelsLab Inpainting API
- **AI Enhancement**: Upscale 2x, 3x, 4x dengan ModelsLab Super Resolution
- **Multi-Format Export**: A0-A5, Instagram, Facebook, Twitter, dll (50+ formats)
- **Batch Export**: Export 1 poster ke multiple formats sekaligus
- **Smart Resize**: AI-powered crop yang preserve important content
- **Bridge to Variation Generator**: Seamless integration ke App 2

---

## 🏗️ Architecture

### Backend Structure
```
backend/src/apps/poster-editor/
├── plugin.config.ts              # Pricing & configuration
├── routes.ts                     # API endpoints
├── controllers/
│   ├── upload.controller.ts      # File upload handler
│   ├── text-detection.controller.ts  # OCR endpoint
│   ├── generate.controller.ts    # Generate edited poster
│   ├── enhance.controller.ts     # AI upscaling
│   ├── resize.controller.ts      # Format conversion
│   ├── batch-export.controller.ts    # Multiple formats
│   └── send-to-variations.controller.ts  # Bridge to App 2
├── services/
│   ├── ocr/
│   │   └── tesseract.service.ts  # Text detection
│   ├── modelslab/
│   │   ├── inpainting.service.ts # Remove text API
│   │   ├── super-resolution.service.ts  # Upscale API
│   │   └── webhook.service.ts    # Handle callbacks
│   ├── image/
│   │   ├── mask-generator.service.ts  # Create masks
│   │   ├── text-renderer.service.ts   # Render text (canvas)
│   │   ├── composite.service.ts   # Combine images
│   │   └── smart-crop.service.ts  # Intelligent cropping
│   ├── resize/
│   │   ├── format-converter.service.ts  # Resize logic
│   │   ├── batch-resize.service.ts  # Multiple formats
│   │   └── format-presets.ts      # Format definitions
│   └── storage/
│       └── file-manager.service.ts  # File operations
├── jobs/
│   ├── process-inpainting.job.ts  # Queue: inpainting
│   ├── process-upscaling.job.ts   # Queue: upscaling
│   └── batch-export.job.ts        # Queue: batch export
└── utils/
    ├── image-validator.ts         # Validate uploads
    └── credit-calculator.ts       # Calculate costs
```

### Frontend Structure
```
frontend/src/apps/
├── PosterEditor.tsx               # Main component
└── poster-editor/
    └── components/
        ├── UploadZone.tsx
        ├── TextDetector.tsx       # OCR overlay
        ├── PosterCanvas.tsx       # Fabric.js canvas
        ├── TextEditorPanel.tsx    # Edit panel
        ├── EnhancePanel.tsx       # Upscale options
        ├── FormatSelector.tsx     # Format grid
        └── ExportOptions.tsx      # Download buttons
```

### Database Schema
```sql
-- Poster Edits
CREATE TABLE poster_edits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  original_url TEXT NOT NULL,
  mask_url TEXT,
  edited_url TEXT,
  enhanced_url TEXT,
  original_size TEXT,              -- JSON: {width, height, fileSize}
  enhanced_size TEXT,              -- JSON: After upscaling
  ocr_data TEXT,                   -- JSON: Detected text boxes
  user_edits TEXT,                 -- JSON: Text modifications
  enhance_settings TEXT,           -- JSON: {scale, faceEnhance, model}
  status TEXT DEFAULT 'PENDING',
  processing_time INTEGER,
  error_message TEXT,
  credits_used INTEGER DEFAULT 0,
  breakdown TEXT,                  -- JSON: {inpainting: 0, enhance: 0}
  sent_to_variations BOOLEAN DEFAULT FALSE,
  variation_project_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Exports
CREATE TABLE poster_exports (
  id TEXT PRIMARY KEY,
  poster_edit_id TEXT NOT NULL,
  format_name TEXT NOT NULL,       -- "A4", "IG_POST", etc
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  resize_method TEXT NOT NULL,     -- "smart_crop", "fit", etc
  was_upscaled BOOLEAN DEFAULT FALSE,
  upscale_ratio REAL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Variation Projects (Bridge to App 2)
CREATE TABLE variation_projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  source_type TEXT DEFAULT 'FROM_EDITOR',  -- FROM_EDITOR, DIRECT_UPLOAD
  poster_edit_id TEXT,
  uploaded_url TEXT,
  settings TEXT,                   -- JSON: generation settings
  status TEXT DEFAULT 'pending',
  variation_urls TEXT,             -- JSON: generated variations
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 💰 Pricing & Credits

### Credit Value
- **1 Credit = Rp 50**
- **UNLIMITED** dengan Enterprise Plan ModelsLab ($147/month)

### Action Pricing

#### Free Actions
| Action | Credits | Notes |
|--------|---------|-------|
| Upload poster | 0 | FREE |
| OCR text detection | 0 | FREE (Tesseract.js local) |
| Text editing | 0 | FREE (client-side) |
| Resize (no upscale) | 0 | FREE (Sharp local) |

#### Paid Actions (With Enterprise Plan: FREE!)
| Action | Credits (Standard) | Credits (Enterprise) | Time |
|--------|-------------------|---------------------|------|
| AI Remove Text (Inpainting) | 10 | **0 (FREE)** | 15-30s |
| Enhance 2x | 5 | **0 (FREE)** | 10-15s |
| Enhance 3x | 10 | **0 (FREE)** | 15-20s |
| Enhance 4x | 20 | **0 (FREE)** | 20-30s |
| Resize + Upscale (per format) | 5 | **0 (FREE)** | 5-10s |

### Workflow Examples

**Example 1: Basic Text Edit**
- Upload poster: 0 credits
- OCR detection: 0 credits
- Edit text: 0 credits
- AI Remove old text: **0 credits** (Enterprise)
- Render new text: 0 credits
- Download: 0 credits
- **Total: FREE!** (with Enterprise plan)

**Example 2: Edit + Enhance + Multi-Format**
- Upload: 0 credits
- Edit text: **0 credits** (Enterprise)
- Enhance 3x: **0 credits** (Enterprise)
- Export to 5 formats (IG Post, IG Story, FB Post, A4, A3):
  - No upscale needed: **0 credits**
  - With upscale: **0 credits** (Enterprise)
- **Total: FREE!** (with Enterprise plan)

**Example 3: Send to Variation Generator**
- Edit poster: **0 credits**
- Enhance: **0 credits**
- Send to App 2: 0 credits
- Generate 20 variations: Handled by App 2
- **Bridge cost: FREE!**

### Enterprise Plan Benefits
✅ **UNLIMITED Inpainting** (text removal)
✅ **UNLIMITED Super Resolution** (upscaling)
✅ **UNLIMITED Image-to-Image** (for App 2)
✅ **15 parallel generations**
✅ **NO per-image fees**

**ROI:**
- Enterprise Plan: $147/month
- Standard cost per poster (with enhancements): ~15-30 credits
- Break-even: ~150 posters/month
- **Perfect for SaaS model!**

---

## ⚙️ Setup & Configuration

### 1. Environment Variables

Add to your `.env`:

```bash
# ModelsLab API (REQUIRED)
MODELSLAB_API_KEY=your_modelslab_api_key_here

# ModelsLab Webhook (Optional - for async processing)
MODELSLAB_WEBHOOK_URL=https://your-domain.com/api/apps/poster-editor/webhook
MODELSLAB_WEBHOOK_SECRET=your_webhook_secret

# Storage (Local or S3)
STORAGE_TYPE=local  # or 's3'
UPLOAD_DIR=./uploads

# S3 Configuration (if STORAGE_TYPE=s3)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_BUCKET_NAME=lumiku-posters
AWS_REGION=ap-southeast-1
```

### 2. Database Migration

Migration sudah ada di schema. Jika belum running:

```bash
cd backend
bun prisma db push
```

### 3. Dependencies

Dependencies sudah installed (sharp, canvas, tesseract.js, axios).

Jika ada missing:

```bash
cd backend
bun add sharp canvas tesseract.js axios @types/node
```

### 4. Worker Setup (Production)

Ensure Redis is running for background processing:

```bash
# Start Redis (if not running)
redis-server

# Worker akan auto-start dengan backend
bun run dev
```

---

## 🔌 API Endpoints

Base URL: `/api/apps/poster-editor`

### Upload

#### `POST /upload`
Upload poster untuk editing

**Request:** (multipart/form-data)
```
file: <image file> (JPG/PNG/WebP, max 10MB)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "posterId": "clx123...",
    "originalUrl": "/uploads/user123/poster456/original.jpg",
    "metadata": {
      "width": 1080,
      "height": 1080,
      "format": "jpeg",
      "fileSize": 2156789
    }
  }
}
```

---

### Text Detection (OCR)

#### `POST /:posterId/detect-text`
Detect semua teks dalam poster

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
        }
      }
    ],
    "processingTime": 3.2
  }
}
```

---

### Generate Edited Poster

#### `POST /:posterId/generate`
Generate poster dengan teks baru

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
        "color": "#FFFFFF"
      }
    }
  ]
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

---

### Enhance Quality

#### `POST /:posterId/enhance`
Upscale dengan AI

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

---

### Resize & Format Conversion

#### `POST /:posterId/resize`
Resize ke format tertentu

**Request:**
```json
{
  "format": "A4",
  "resizeMethod": "smart_crop",
  "autoUpscale": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "formatName": "A4",
    "url": "/exports/poster-a4.jpg",
    "dimensions": { "width": 2480, "height": 3508 },
    "wasUpscaled": true
  }
}
```

---

### Batch Export

#### `POST /:posterId/batch-export`
Export ke multiple formats sekaligus

**Request:**
```json
{
  "formats": ["A4", "A3", "IG_POST", "IG_STORY"],
  "packName": "SOCIAL_PACK",
  "autoUpscale": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "batch_ghi789",
    "totalFormats": 4,
    "estimatedTime": 20,
    "zipUrl": "/exports/poster-batch.zip"
  }
}
```

---

### Send to Variation Generator

#### `POST /:posterId/send-to-variations`
Bridge ke App 2 untuk bulk variations

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
    "redirectUrl": "/variations/vproj_xyz123"
  }
}
```

---

## 🎨 ModelsLab Integration

### APIs Used

#### 1. Inpainting API
**Purpose:** Remove text dari poster

**Endpoint:** `POST https://modelslab.com/api/v6/image_editing/inpaint`

**Parameters:**
```json
{
  "key": "YOUR_API_KEY",
  "init_image": "https://.../original.jpg",
  "mask_image": "https://.../mask.png",
  "prompt": "clean background, remove text, seamless",
  "negative_prompt": "text, letters, words",
  "strength": 0.9,
  "num_inference_steps": 30
}
```

**Response:**
```json
{
  "status": "success",
  "output": ["https://.../inpainted.jpg"]
}
```

**Cost:** FREE (with Enterprise plan)

---

#### 2. Super Resolution API
**Purpose:** Upscale image quality

**Endpoint:** `POST https://modelslab.com/api/v6/image_editing/super_resolution`

**Parameters:**
```json
{
  "key": "YOUR_API_KEY",
  "init_image": "https://.../edited.jpg",
  "scale": 3,
  "face_enhance": true,
  "model_id": "realesr-general-x4v3"
}
```

**Available Models:**
1. `realesr-general-x4v3` (default, best quality)
2. `RealESRGAN_x4plus` (general purpose)
3. `RealESRGAN_x4plus_anime_6B` (for illustrations)
4. `RealESRGAN_x2plus` (faster, 2x only)
5. `ultra_resolution` (maximum quality)

**Response:**
```json
{
  "status": "success",
  "output": ["https://.../upscaled.jpg"]
}
```

**Cost:** FREE (with Enterprise plan)

---

### Webhook Handling

ModelsLab can send webhooks when processing completes:

**Webhook URL:** `/api/apps/poster-editor/webhook`

**Payload:**
```json
{
  "status": "success",
  "output": ["https://.../result.jpg"],
  "track_id": "job_abc123"
}
```

**Handler:**
```typescript
async handleWebhook(body: any) {
  const { status, output, track_id } = body;

  if (status === 'success') {
    await updateJobStatus(track_id, {
      status: 'completed',
      resultUrl: output[0]
    });
  }
}
```

---

## 📐 Format Library

### Print Formats (300 DPI)

| Format | Width | Height | Size (mm) | Use Case |
|--------|-------|--------|-----------|----------|
| A0 | 9933px | 14043px | 841×1189 | Billboard, large poster |
| A1 | 7016px | 9933px | 594×841 | Large poster |
| A2 | 4961px | 7016px | 420×594 | Poster, menu board |
| A3 | 3508px | 4961px | 297×420 | Large flyer, small poster |
| A4 | 2480px | 3508px | 210×297 | Standard document, menu |
| A5 | 1748px | 2480px | 148×210 | Flyer, handout |
| Letter | 2550px | 3300px | 8.5×11in | US standard |
| Legal | 2550px | 4200px | 8.5×14in | US legal |
| Tabloid | 3300px | 5100px | 11×17in | Newspaper |

### Social Media Formats

| Platform | Format | Width | Height | Ratio | Use Case |
|----------|--------|-------|--------|-------|----------|
| Instagram | Post | 1080px | 1080px | 1:1 | Square post |
| Instagram | Portrait | 1080px | 1350px | 4:5 | Portrait post |
| Instagram | Story | 1080px | 1920px | 9:16 | Story/Reel |
| Facebook | Post | 1200px | 630px | 1.91:1 | Link preview |
| Facebook | Cover | 820px | 312px | 2.63:1 | Page cover |
| Twitter/X | Post | 1200px | 675px | 16:9 | Post image |
| LinkedIn | Post | 1200px | 627px | 1.91:1 | Post image |
| TikTok | Video | 1080px | 1920px | 9:16 | Thumbnail |
| YouTube | Thumbnail | 1280px | 720px | 16:9 | Video thumbnail |

### Preset Packs

#### Social Media Pack
- Instagram Post (1080×1080)
- Instagram Story (1080×1920)
- Facebook Post (1200×630)

#### Print Pack
- A4 (2480×3508)
- A3 (3508×4961)
- Poster 24×36 (7200×10800)

#### Restaurant Pack
- A4 Menu Board (2480×3508)
- Instagram Post (1080×1080)
- Digital Display (1920×1080)

#### Complete Marketing Pack
- A4, A3, IG Post, IG Story, FB Post, Twitter Post

---

## 📚 Usage Guide

### For End Users

#### Step 1: Upload Poster
1. Click "Upload Poster"
2. Select JPG/PNG/WebP (max 10MB)
3. Wait for OCR detection (~3-5s)

#### Step 2: Edit Text
1. View detected text boxes
2. Click to edit text inline
3. Adjust font, size, color
4. Drag to reposition

#### Step 3: Generate
1. Click "Generate Poster"
2. AI removes old text (15-30s)
3. New text rendered
4. Preview result

#### Step 4: Enhance (Optional)
1. Choose upscale: 2×, 3×, or 4×
2. Enable face enhancement if needed
3. Click "Enhance"
4. Wait 10-20 seconds

#### Step 5: Export
1. Select format (A4, IG Post, etc)
2. Or choose preset pack
3. Click "Download"
4. Or "Send to Variations" for App 2

---

### For Developers

#### Custom Format Definition

```typescript
export const CUSTOM_FORMAT: FormatDefinition = {
  name: 'Custom 1920×1080',
  width: 1920,
  height: 1080,
  dpi: 72,
  category: 'custom',
  aspectRatio: '16:9',
  description: 'HD digital display'
}
```

#### Smart Crop Algorithm

```typescript
async function smartCrop(image, targetFormat) {
  // 1. Detect faces, text, important objects
  const regions = await detectImportantRegions(image)

  // 2. Calculate optimal crop area
  const cropArea = calculateOptimalCrop(
    image.dimensions,
    targetFormat.dimensions,
    regions
  )

  // 3. Crop with Sharp
  await sharp(image)
    .extract(cropArea)
    .resize(targetFormat.width, targetFormat.height)
    .toFile(output)
}
```

---

## 🐛 Troubleshooting

### OCR Tidak Detect Teks

**Cause:** Text too stylized atau low contrast

**Solution:**
1. Pre-process image (increase contrast)
2. Use manual text box creation
3. Adjust OCR PSM mode

---

### Inpainting Result Not Good

**Cause:** Mask not precise atau complex background

**Solution:**
1. Adjust inpainting strength (0.7-1.0)
2. Improve mask generation
3. Try multiple times
4. Use negative prompts

---

### Upscaling Takes Too Long

**Cause:** Large image or slow API

**Solution:**
1. Check network connection
2. Use lower scale (2x instead of 4x)
3. Process in background (job queue)

---

### Export Format Wrong Size

**Cause:** Resize method mismatch

**Solution:**
1. Check resize method (smart_crop vs fit)
2. Verify target format dimensions
3. Enable auto-upscale if needed

---

### Bridge to App 2 Failed

**Cause:** variationProjectId not created

**Solution:**
1. Check database transaction
2. Verify posterEditId exists
3. Check user permissions

---

## 📊 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│  ┌──────────┐  ┌───────────┐  ┌────────────┐  ┌─────────┐  │
│  │  Upload  │  │   Text    │  │  Enhance   │  │ Export  │  │
│  │   Zone   │  │  Editor   │  │   Panel    │  │ Options │  │
│  └──────────┘  └───────────┘  └────────────┘  └─────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Fabric.js Canvas (Visual Editor)            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ├─ API Calls
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                         BACKEND API                          │
│  ┌───────────┐  ┌──────────┐  ┌────────────┐  ┌──────────┐ │
│  │ Controllers│→ │ Services │→ │ ModelsLab  │→ │ Database │ │
│  └───────────┘  └──────────┘  └────────────┘  └──────────┘ │
│       │              │                                       │
│       │              ├─ OCR (Tesseract.js)                  │
│       │              ├─ Image Processing (Sharp)            │
│       │              ├─ Text Rendering (Canvas)             │
│       │              └─ Format Conversion                   │
│       ↓                                                      │
│  ┌────────────────────────────────────────────────────┐    │
│  │              ModelsLab APIs                        │    │
│  │  ┌────────────┐  ┌───────────────┐               │    │
│  │  │ Inpainting │  │ Super         │               │    │
│  │  │ (Remove    │  │ Resolution    │               │    │
│  │  │  Text)     │  │ (Upscale)     │               │    │
│  │  └────────────┘  └───────────────┘               │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ├─ Job Queue (Redis/BullMQ)
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      BACKGROUND WORKER                       │
│  1. Process OCR (Tesseract)                                 │
│  2. Generate masks (Canvas)                                 │
│  3. Call ModelsLab Inpainting                               │
│  4. Render new text (Canvas)                                │
│  5. Composite images (Sharp)                                │
│  6. Optional: Upscale (ModelsLab)                           │
│  7. Optional: Resize to formats                             │
│  8. Save to storage                                         │
│  9. Deduct credits                                          │
│  10. Update database                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎉 Summary

Smart Poster Editor menyediakan:

✅ **AI-Powered Text Editing** - Auto-detect & replace text
✅ **Professional Quality** - AI upscaling up to 4×
✅ **50+ Export Formats** - Print (A0-A5) & Social Media
✅ **Batch Export** - 1 click → multiple formats
✅ **Smart Resize** - AI preserves important content
✅ **Bridge to App 2** - Generate 20 variations
✅ **Cost Effective** - FREE with Enterprise plan
✅ **Fast Processing** - 15-30s total workflow
✅ **Production Ready** - Background jobs, error handling

Untuk pertanyaan atau issues, cek:
- Backend logs: Console output
- API errors: Network tab in browser
- ModelsLab status: Check provider dashboard

**Happy Editing! 🎨✨**
