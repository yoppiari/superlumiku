# Quick Edit with Dual AI System - Complete Guide
**Lumiku Poster Editor**
**Last Updated:** 2025-01-08
**Status:** ✅ FULLY OPERATIONAL

---

## 🎯 What is Quick Edit?

Quick Edit is Lumiku's **one-click AI-powered image editing** feature in the Poster Editor. It uses **TWO AI systems** working together to enable professional object editing with just a single click.

---

## 🤖 The Dual AI System

### AI #1: SAM (Segment Anything Model) 🎯
**Purpose:** Smart Object Detection
**Technology:** Meta AI's MobileSAM
**Location:** Local (localhost:5001)
**Cost:** $0 (self-hosted)
**Speed:** 3-5 seconds

**What it does:**
- User clicks on any object (shirt, hair, background, etc.)
- SAM automatically detects the **FULL object boundaries**
- Generates a precise mask (white = object, black = background)
- Returns high-quality segmentation mask

### AI #2: ModelsLab Inpaint 🎨
**Purpose:** AI Image Editing
**Technology:** Stable Diffusion Inpainting
**Location:** Cloud API (modelslab.com)
**Cost:** ~400 credits per request
**Speed:** 30-60 seconds

**What it does:**
- Takes the original image + SAM mask + user prompt
- Uses AI to intelligently edit the masked area
- Preserves image quality and natural appearance
- Returns professionally edited result

---

## 🔄 Complete Workflow

```
1. USER ACTION
   └─ Click on shirt in poster

2. USER INPUT
   └─ Type: "change to blue color"
   └─ Click Save

3. SAM DETECTION (3-5 sec)
   └─ AI detects entire shirt
   └─ Creates precise mask

4. MODELSLAB EDITING (30-60 sec)
   └─ AI inpaints shirt with blue color
   └─ Preserves lighting, shadows, textures

5. RESULT
   └─ Entire shirt is now blue!
   └─ Professional, natural-looking result ✨
```

**Total Time:** ~40-70 seconds
**Total Cost:** 400+ credits per annotation

---

## 📋 Step-by-Step User Guide

### 1. Open Poster Editor
- Navigate to http://localhost:5173
- Click on "Poster Editor" app

### 2. Create or Open Project
- Upload a new image OR
- Open existing poster project

### 3. Select Quick Edit Mode
- Click "Quick Edit" radio button
- You'll see: "✨ Smart Detection Active"

### 4. Add Annotation
- Click ONCE on any object you want to edit
  - Examples: shirt, hair, background, furniture, etc.
- A numbered badge (① ② ③) appears at click point
- Edit box pops up automatically

### 5. Enter Edit Instructions
- Type what you want to do in the text box
  - "change to blue color"
  - "make it red"
  - "remove this object"
  - "change to golden texture"
- Click "Save" button
- **Edit box disappears, only number badge remains** ✅

### 6. Add More Annotations (Optional)
- Click on other objects to add more edits
- Each gets a new number badge
- All boxes stay hidden until you click the badge

### 7. View/Edit Existing Annotations
- Click any number badge to show its details
- Edit the prompt if needed
- Click outside or on another badge to hide

### 8. Start Processing
- When ready, click "Start AI Inpaint (400+ credits)"
- System processes ALL annotations sequentially
- Watch status change: Ready → Processing → Done

### 9. Wait for Results
- First annotation: ~40-70 seconds
- Each additional annotation: +40-70 seconds
- Progress shown in real-time

### 10. See Results!
- Image updates automatically
- All edits applied with professional quality
- Download or continue editing

---

## 🎨 UI Features

### Clean Annotation Display
**After Save:**
- ✅ Only numbered badges visible (①②③)
- ✅ Image stays clean and uncluttered
- ✅ Easy to add many annotations

**On Click:**
- Badge clicked → Details box appears
- Shows prompt and "✨ Smart Detection" indicator
- Edit or delete options available

**Smart Detection Badge:**
All annotations show:
```
✨ Smart Detection
AI will detect the full object automatically
```

### Modes Available

**Quick Edit (Current - with SAM):**
- ✨ One click = full object
- AI-powered smart detection
- Best for: Single objects, precise editing
- Uses: SAM + ModelsLab

**Brush Mode (Alternative):**
- Manual mask drawing
- Full control over edit area
- Best for: Complex selections, artistic control
- Uses: ModelsLab only

---

## 💻 Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────┐
│                     FRONTEND                         │
│              http://localhost:5173                   │
│                                                      │
│  - Click annotation UI                              │
│  - Toggle visibility (click badges)                 │
│  - Batch processing display                         │
└──────────────────┬───────────────────────────────────┘
                   │ POST /api/apps/poster-editor/inpaint-batch
                   ↓
┌─────────────────────────────────────────────────────┐
│                     BACKEND                          │
│              http://localhost:3001                   │
│                                                      │
│  1. Receive annotations                             │
│  2. Check segmentationMode                          │
│  3. Call SAM or generate circular mask              │
│  4. Call ModelsLab API                              │
│  5. Poll for results                                │
│  6. Download & save edited images                   │
└──────────────┬────────────────────┬──────────────────┘
               │                    │
               │ SAM Mask           │ Inpaint Request
               ↓                    ↓
┌──────────────────────┐  ┌──────────────────────────┐
│    SAM SERVICE       │  │   MODELSLAB API          │
│  localhost:5001      │  │  modelslab.com/api/v6    │
│                      │  │                          │
│  - MobileSAM model   │  │  - Stable Diffusion      │
│  - Object detection  │  │  - AI inpainting         │
│  - Mask generation   │  │  - Cloud processing      │
│  - CPU processing    │  │  - High quality output   │
└──────────────────────┘  └──────────────────────────┘
```

### File Locations

**Backend Integration:**
```
backend/src/
├── lib/sam/
│   ├── sam.client.ts              # SAM HTTP client
│   ├── sam.types.ts               # TypeScript types
│   └── sam.config.ts              # Configuration
│
└── apps/poster-editor/
    ├── services/
    │   ├── sam-integration.service.ts     # SAM integration
    │   └── modelslab-inpaint.service.ts   # ModelsLab API
    │
    └── controllers/
        └── inpaint-batch.controller.ts    # Main orchestration
```

**Frontend:**
```
frontend/src/apps/poster-editor/
├── components/
│   └── AnnotateCanvas.tsx         # Click annotation UI
├── types/
│   └── annotation.ts              # Annotation types
└── PosterEditor.tsx               # Main component
```

**SAM Service:**
```
services/sam-service/
├── app.py                         # FastAPI service
├── sam_model.py                   # MobileSAM wrapper
├── mobile_sam.pt                  # Model checkpoint (38MB)
└── requirements.txt               # Python dependencies
```

---

## ⚙️ Configuration

### Environment Variables

**Backend (.env):**
```bash
# ModelsLab API
MODELSLAB_API_KEY=your_key_here

# SAM Service
SAM_SERVICE_URL=http://localhost:5001
SAM_ENABLED=true
SAM_TIMEOUT=30000
SAM_RETRY_ATTEMPTS=3
```

**SAM Service (.env):**
```bash
PORT=5001
SAM_MODEL=mobile_sam
SAM_CHECKPOINT=mobile_sam.pt
DEVICE=auto  # auto, cpu, or cuda
```

---

## 🔍 How to Check System Status

### Check SAM Service
```bash
curl http://localhost:5001/health
```

**Expected:**
```json
{"status":"healthy","model":"mobile_sam","device":"cpu"}
```

### Check Backend Logs
Look for these messages when processing:
- `🎯 Using SAM mask` - SAM working perfectly
- `🎯 Generating SAM mask` - SAM being called
- `⭕ Using circular mask` - Fallback mode (SAM unavailable)

### Check Frontend
- Open browser DevTools (F12)
- Network tab should show:
  - POST `/api/apps/poster-editor/inpaint-batch` (initial)
  - GET `/api/apps/poster-editor/inpaint-batch/{id}/status` (polling)

---

## 🐛 Troubleshooting

### Issue: Annotations not saving
**Check:**
- Prompt text is not empty
- "Save" button is enabled (green)
- No JavaScript errors in console

### Issue: "SAM service unavailable" in logs
**Solution:**
```bash
# Check if SAM is running
curl http://localhost:5001/health

# If not, start it:
cd services/sam-service
C:\Users\yoppi\AppData\Local\Programs\Python\Python311\python.exe app.py
```

### Issue: Processing takes too long
**Normal timing:**
- SAM detection: 3-5 seconds (CPU)
- ModelsLab inpainting: 30-60 seconds
- Total: ~40-70 seconds per annotation

**If longer:**
- Check internet connection (ModelsLab is cloud)
- Check ModelsLab API status
- Check credit balance

### Issue: Results not showing
**Check:**
- Frontend is polling batch status
- Backend successfully downloaded result
- No errors in backend logs
- Image path is accessible

---

## 📊 Performance & Costs

### Processing Time
| Step | Duration | Location |
|------|----------|----------|
| SAM Detection | 3-5 sec | Local |
| ModelsLab Queue | 0-5 sec | Cloud |
| ModelsLab Processing | 30-60 sec | Cloud |
| Download & Save | 2-3 sec | Local |
| **Total** | **40-70 sec** | - |

### Credit Costs
| Action | Credits | Notes |
|--------|---------|-------|
| Quick Edit (1 annotation) | 400+ | SAM free + ModelsLab 400 |
| Quick Edit (5 annotations) | 2000+ | Sequential processing |
| Brush Mode (1 annotation) | 400+ | No SAM, ModelsLab only |

### Optimization Tips
**For Development:**
- ✅ Current setup is fine (CPU-based SAM)
- Process time acceptable for testing

**For Production:**
- Use GPU for SAM (reduces to 50-100ms)
- OR use Segmind SAM API ($0.001/request)
- Consider batch processing optimization
- Implement caching for repeated edits

---

## ✨ Best Practices

### For Users
1. **Be specific with prompts**
   - ✅ "change shirt to navy blue"
   - ❌ "make it different"

2. **Click center of objects**
   - Better detection accuracy
   - More consistent results

3. **Process in batches**
   - Add all annotations first
   - Process all at once
   - More efficient credit usage

4. **Use descriptive prompts**
   - Include color, texture, style details
   - Better AI understanding = better results

### For Developers
1. **Always check SAM health before processing**
2. **Implement automatic fallback to circular**
3. **Log all AI interactions for debugging**
4. **Handle network errors gracefully**
5. **Implement retry logic for API calls**

---

## 🚀 Future Enhancements

### Planned Features
- [ ] Batch prompt templates (e.g., "make all shirts blue")
- [ ] Mask preview before processing
- [ ] SAM confidence score display
- [ ] Undo/redo for annotations
- [ ] Annotation copy/paste
- [ ] Export mask for reuse

### Performance Upgrades
- [ ] GPU support for SAM service
- [ ] Parallel processing for multiple annotations
- [ ] Result caching
- [ ] Optimized polling intervals

---

## 📚 Additional Documentation

**Complete Technical Docs:**
- `SAM_DOCUMENTATION.md` - Full technical reference
- `SAM_IMPLEMENTATION_SUMMARY.md` - Implementation details
- `SAM_FINAL_NOTES.md` - Setup & dual AI architecture
- `SAM_QUICK_START.md` - 5-minute quick start

**Setup Guides:**
- `SAM_SETUP_MANUAL.md` - Windows installation guide

---

## ✅ Quick Reference Checklist

**Before Using:**
- [ ] SAM service running (localhost:5001)
- [ ] Backend running (localhost:3001)
- [ ] Frontend running (localhost:5173)
- [ ] ModelsLab API key configured
- [ ] Sufficient credits available

**Usage Flow:**
- [ ] Open Poster Editor
- [ ] Select Quick Edit mode
- [ ] Click on object
- [ ] Enter edit prompt
- [ ] Save annotation
- [ ] Add more annotations (optional)
- [ ] Click "Start AI Inpaint"
- [ ] Wait for results
- [ ] Download edited image

**Troubleshooting:**
- [ ] Check SAM health: `curl localhost:5001/health`
- [ ] Check backend logs for errors
- [ ] Verify credit balance
- [ ] Test with simple edits first

---

## 🎉 Summary

**Quick Edit with Dual AI** is a revolutionary feature that combines:
- **SAM's intelligence** for precise object detection
- **ModelsLab's power** for professional AI editing
- **Simple UX** with one-click annotation
- **Clean UI** with toggle visibility

**Result:** Professional-quality image editing that takes seconds to set up and delivers studio-quality results!

**Ready to use RIGHT NOW!** ✨

---

**Last Updated:** 2025-01-08
**Documentation Version:** 1.0
**System Status:** 🟢 Fully Operational
**Support:** See other SAM_*.md files for detailed information

---

**End of Quick Edit Dual AI Guide**
