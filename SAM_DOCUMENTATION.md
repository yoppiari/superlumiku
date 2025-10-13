# SAM Integration Documentation
## Segment Anything Model for Lumiku Apps

**Last Updated:** 2025-01-08
**Status:** ✅ FULLY OPERATIONAL - Dual AI System Active

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup Guide](#setup-guide)
4. [API Reference](#api-reference)
5. [Usage Examples](#usage-examples)
6. [Troubleshooting](#troubleshooting)
7. [Deployment](#deployment)
8. [Future Apps Integration](#future-apps-integration)

---

## 🎯 Overview

### What is SAM?

**Segment Anything Model (SAM)** is Meta AI's foundation model for image segmentation. It can automatically detect and mask entire objects from a single point click.

### Why SAM for Lumiku?

**Problem:** Current circular masking only edits small areas. Users need to place many annotations to edit a full object.

**Solution:** SAM detects the entire object (shirt, hair, background) from 1 click → enables full object editing with single annotation.

### Implementation Status

- ✅ **Phase 1:** Standalone Python SAM service (MobileSAM) - **RUNNING**
- ✅ **Phase 2:** Backend integration with Poster Editor - **COMPLETE**
- ✅ **Phase 3:** Frontend UI with Quick Edit mode - **COMPLETE**
- ✅ **Dual AI System:** SAM + ModelsLab fully integrated - **OPERATIONAL**

### Dual AI System Architecture

**AI #1: SAM (Segment Anything Model)** 🎯
- **Purpose:** Smart object detection and masking
- **Technology:** Meta AI's MobileSAM
- **Location:** Local Python service (localhost:5001)
- **Status:** ✅ Running
- **Cost:** $0 (self-hosted)
- **Speed:** 3-5 seconds on CPU

**AI #2: ModelsLab Inpaint** 🎨
- **Purpose:** AI-powered image editing
- **Technology:** Stable Diffusion Inpainting
- **Location:** Cloud API (modelslab.com)
- **Status:** ✅ Integrated
- **Cost:** ~400 credits per request
- **Speed:** 30-60 seconds

**Complete Workflow:**
```
User clicks object → SAM detects (3-5s) → ModelsLab inpaints (30-60s) → Result!
Total: ~40-70 seconds for professional full-object editing
```

---

## 🏗️ Architecture

### System Overview

```
Frontend (React)
    ↓
Backend (Bun/Node) - Port 3001
    ↓
    ├─→ SAM Service (Python/FastAPI) - Port 5001
    │   └─→ Returns: mask image
    ↓
    └─→ ModelsLab Inpaint API
        └─→ Returns: edited image
```

### Components

1. **SAM Service** (`services/sam-service/`)
   - Standalone Python FastAPI service
   - Runs MobileSAM model
   - CPU-friendly (~3s per image)
   - GPU-ready (switch to SAM Original for <50ms)

2. **SAM Client Library** (`backend/src/lib/sam/`)
   - TypeScript HTTP client
   - Retry logic & error handling
   - Reusable across all Lumiku apps

3. **Poster Editor Integration** (`backend/src/apps/poster-editor/services/`)
   - SAM integration service
   - Batch inpainting with SAM support
   - Automatic fallback to circular masks

---

## 🚀 Setup Guide

### Prerequisites

- Python >= 3.8
- Node.js/Bun (already installed)
- 8GB RAM minimum (16GB recommended)
- GPU optional (CUDA for production)

### Step 1: Install SAM Service

```bash
# Navigate to SAM service directory
cd services/sam-service

# Install Python dependencies
pip install -r requirements.txt

# Download MobileSAM checkpoint
wget https://github.com/ChaoningZhang/MobileSAM/raw/master/weights/mobile_sam.pt

# Or download manually from:
# https://github.com/ChaoningZhang/MobileSAM/releases
```

### Step 2: Configure SAM Service

```bash
# Copy environment template
cp .env.example .env

# Edit .env (optional, defaults are good for development)
# PORT=5001
# SAM_MODEL=mobile_sam
# DEVICE=auto
```

### Step 3: Start SAM Service

```bash
# In terminal 1 - Start SAM service
cd services/sam-service
python app.py

# Should see:
# 🚀 Starting SAM Service...
# ✅ SAM model loaded successfully
# ✅ SAM Service ready!
```

### Step 4: Start Backend & Frontend

```bash
# In terminal 2 - Start backend
cd backend
PORT=3001 bun run src/index.ts

# In terminal 3 - Start frontend
cd frontend
npm run dev
```

### Step 5: Verify SAM is Running

```bash
# Test SAM health endpoint
curl http://localhost:5001/health

# Should return:
# {"status":"healthy","model":"mobile_sam","device":"cpu"}
```

---

## 📚 API Reference

### SAM Service Endpoints

#### `GET /health`
Health check

**Response:**
```json
{
  "status": "healthy",
  "model": "mobile_sam",
  "device": "cpu"
}
```

#### `POST /segment/point`
Segment object by single point

**Request:**
```json
{
  "image": "data:image/png;base64,...",
  "point": [100, 200],
  "objectPrompt": "shirt"
}
```

**Response:**
```json
{
  "success": true,
  "maskBase64": "data:image/png;base64,...",
  "confidence": 0.95,
  "message": "Segmentation successful"
}
```

#### `POST /segment/points`
Segment by multiple points (merged mask)

**Request:**
```json
{
  "image": "data:image/png;base64,...",
  "points": [[100, 200], [150, 250]],
  "objectPrompt": "person"
}
```

### Backend SAM Client Usage

```typescript
import { getSAMClient } from '@/lib/sam'

const samClient = getSAMClient()

// Segment by point
const result = await samClient.segmentByPoint(
  imageBase64,
  [100, 200],
  'shirt' // optional prompt
)

console.log(result.maskBase64) // Use this mask for inpainting
console.log(result.confidence) // 0-1 score
```

### Poster Editor Integration

```typescript
import { getSAMIntegrationService } from '@/apps/poster-editor/services/sam-integration.service'

const samService = getSAMIntegrationService()

// Generate mask for annotation
const mask = await samService.generateSAMMask(imageBase64, {
  id: 'ann-123',
  x: 100,
  y: 200,
  xPercent: 50,
  yPercent: 50,
  prompt: 'change color to red',
  segmentationMode: 'sam',
  samObjectPrompt: 'shirt'
})

// Use mask.maskBase64 for inpainting
```

---

## 💡 Usage Examples

### Example 1: Smart Detection in Poster Editor

**User Workflow:**
1. Upload poster image
2. Enable "Smart Detection" mode
3. Click once on shirt
4. SAM detects entire shirt automatically
5. Enter prompt: "change to red color"
6. Process → Entire shirt changes to red!

**Backend Flow:**
```
1. User clicks at (100, 200) with mode='sam'
2. Frontend sends annotation with segmentationMode='sam'
3. Backend calls SAM service with point [100, 200]
4. SAM returns mask covering entire shirt
5. ModelsLab inpaints using SAM mask
6. User sees edited image with red shirt
```

### Example 2: Background Removal (Future)

```typescript
// In Video Generator app
import { getSAMClient } from '@/lib/sam'

async function removeBackground(imageUrl: string) {
  const samClient = getSAMClient()

  // Detect main subject (person in center)
  const mask = await samClient.segmentByPoint(
    imageUrl,
    [imageWidth/2, imageHeight/2],
    'person'
  )

  // Invert mask to get background
  // Use for transparent background video
}
```

### Example 3: Product Isolation for Carousel

```typescript
// In Carousel Mix app
async function isolateProduct(imageUrl: string, clickPoint: [number, number]) {
  const samClient = getSAMClient()

  // Detect product
  const mask = await samClient.segmentByPoint(
    imageUrl,
    clickPoint,
    'product'
  )

  // Extract product with clean background for carousel
}
```

---

## 🔧 Troubleshooting

### Issue: SAM Service Won't Start

**Error:** `ModuleNotFoundError: No module named 'mobile_sam'`

**Solution:**
```bash
pip install git+https://github.com/ChaoningZhang/MobileSAM.git
```

---

### Issue: Out of Memory

**Error:** `RuntimeError: [enforce fail at alloc_cpu.cpp:114] ... DefaultCPUAllocator: not enough memory`

**Solutions:**
1. Close other applications
2. Reduce image size before sending to SAM
3. Use smaller model (MobileSAM instead of SAM Original)

---

### Issue: SAM is Slow (>10 seconds)

**Cause:** Running on CPU without optimization

**Solutions:**
1. ✅ **Acceptable for development** - 3-5s is normal for MobileSAM on CPU
2. For production: Deploy with GPU
3. Consider using Segmind API ($0.001/request) instead of self-hosting

---

### Issue: Backend Can't Connect to SAM

**Error:** `SAM service unavailable`

**Check:**
```bash
# 1. Is SAM service running?
curl http://localhost:5001/health

# 2. Check SAM service logs
cd services/sam-service
python app.py

# 3. Check environment variable
echo $SAM_SERVICE_URL  # Should be http://localhost:5001
```

---

### Issue: Mask Quality is Poor

**Symptoms:** SAM mask doesn't cover full object

**Solutions:**
1. Add `objectPrompt` hint: "shirt", "hair", "person"
2. Use multiple points for complex objects
3. For production: Switch to SAM Original (better quality)

```typescript
// Add object prompt
const mask = await samClient.segmentByPoint(
  image,
  [x, y],
  'shirt'  // ← Add this hint
)
```

---

## 🌐 Deployment

### Development (Laptop)

**Current Setup:**
- ✅ MobileSAM on CPU
- ✅ localhost:5001
- ✅ ~3 seconds per image
- ✅ Free ($0 per request)

**Commands:**
```bash
# Terminal 1: SAM
cd services/sam-service && python app.py

# Terminal 2: Backend
cd backend && PORT=3001 bun run src/index.ts

# Terminal 3: Frontend
cd frontend && npm run dev
```

---

### Production Option A: Self-Hosted CPU

**Setup:**
- MobileSAM on server CPU
- Docker container
- ~3s latency (acceptable)
- $0 per request

**Dockerfile:** (See `services/sam-service/Dockerfile`)

```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
RUN wget https://github.com/ChaoningZhang/MobileSAM/raw/master/weights/mobile_sam.pt

CMD ["python", "app.py"]
```

**Deploy:**
```bash
docker build -t lumiku-sam services/sam-service
docker run -p 5001:5001 lumiku-sam
```

---

### Production Option B: Self-Hosted GPU

**Setup:**
- Switch to SAM Original (ViT-H)
- GPU server (NVIDIA)
- ~10-50ms latency
- $0 per request + GPU server cost

**Steps:**
1. Download SAM ViT-H checkpoint:
```bash
wget https://dl.fbaipublicfiles.com/segment_anything/sam_vit_h_4b8939.pth
```

2. Update `.env`:
```bash
SAM_MODEL=sam_vit_h
SAM_CHECKPOINT=sam_vit_h_4b8939.pth
DEVICE=cuda
```

3. Restart service (no code changes needed!)

---

### Production Option C: Use Segmind API

**Setup:**
- No self-hosting
- $0.001 per request
- Fastest deployment

**Implementation:**
```typescript
// Update sam.client.ts
const SEGMIND_API_KEY = process.env.SEGMIND_API_KEY

async segmentByPoint(image, point, prompt) {
  const response = await fetch('https://api.segmind.com/v1/sam-v2-image', {
    method: 'POST',
    headers: {
      'x-api-key': SEGMIND_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      image,
      coordinates: `[${point[0]},${point[1]}]`,
      prompt
    })
  })

  return await response.json()
}
```

---

## 🔮 Future Apps Integration

### Template for New App

```typescript
// Example: Video Mixer with SAM background removal

// 1. Import SAM client
import { getSAMClient } from '@/lib/sam'

// 2. Use in your service
export class VideoMixerService {
  private samClient = getSAMClient()

  async removeBackground(videoFrame: string) {
    // Get mask for main subject
    const mask = await this.samClient.segmentByPoint(
      videoFrame,
      [width/2, height/2],
      'person'
    )

    // Use mask for video processing
    return this.processWithMask(videoFrame, mask.maskBase64)
  }
}
```

### Potential Use Cases

**Video Generator:**
- Background removal
- Object isolation
- Smart cropping

**Carousel Mix:**
- Product extraction
- Clean backgrounds
- Multi-object detection

**Looping Flow:**
- Subject tracking
- Seamless loop masking

**Video Mixer:**
- Smart compositing
- Background replacement

---

## 📊 Performance Benchmarks

| Model | Device | Latency | Quality | Cost |
|-------|--------|---------|---------|------|
| MobileSAM | CPU (Laptop) | ~3s | Good | $0 |
| MobileSAM | GPU | ~10ms | Good | $0 + GPU |
| SAM ViT-H | CPU | ~30s | Best | $0 |
| SAM ViT-H | GPU | ~50ms | Best | $0 + GPU |
| Segmind API | Cloud | ~1.8s | Best | $0.001/req |

**Recommendation:**
- Development: MobileSAM CPU (current setup)
- Production: MobileSAM GPU or Segmind API

---

## 🎓 Learning Resources

- [SAM Paper](https://arxiv.org/abs/2304.02643)
- [MobileSAM Paper](https://arxiv.org/abs/2306.14289)
- [Official SAM Demo](https://segment-anything.com/)
- [MobileSAM GitHub](https://github.com/ChaoningZhang/MobileSAM)

---

## ❓ FAQ

**Q: Do I need GPU for development?**
A: No! MobileSAM works fine on CPU (~3s). GPU optional for production.

**Q: Can I switch between MobileSAM and SAM Original easily?**
A: Yes! Just change `.env` file, no code changes needed.

**Q: What happens if SAM service is down?**
A: System automatically falls back to circular masking mode.

**Q: How much does SAM cost per request?**
A: Self-hosted = $0. Segmind API = $0.001.

**Q: Can other Lumiku apps use SAM?**
A: Yes! Import `getSAMClient()` from any app.

---

## 📞 Support

**Issues:** Check [Troubleshooting](#troubleshooting) section first

**Questions:** Review this documentation

**Bugs:** Test with `curl http://localhost:5001/health`

---

## ✅ Implementation Checklist

### Phase 1: Core Service ✅
- [x] Python SAM service created
- [x] FastAPI endpoints implemented
- [x] MobileSAM model integration
- [x] Health check endpoint
- [x] Error handling & logging

### Phase 2: Backend Integration ✅
- [x] SAM Client TypeScript library
- [x] Poster Editor SAM integration service
- [x] Batch inpainting SAM support
- [x] Annotation type updates
- [x] Automatic fallback logic

### Phase 3: Frontend (Simplified) 📝
- [ ] Smart Detection toggle
- [ ] SAM mask preview
- [ ] User feedback (confidence score)
- [ ] Error handling UI

### Phase 4: Production Deployment 📝
- [ ] Docker configuration
- [ ] Environment setup guide
- [ ] GPU deployment instructions
- [ ] Monitoring & logging

---

**End of Documentation**

Last Updated: 2025-01-07
Version: 1.0.0
Status: Ready for Testing
