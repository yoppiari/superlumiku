# SAM Quick Start Guide

## ✅ SYSTEM STATUS: FULLY OPERATIONAL

**SAM Service:** ✅ Running on http://localhost:5001
**Python Version:** 3.11.9
**Model:** MobileSAM (mobile_sam.pt)
**Backend Integration:** ✅ Complete
**Frontend Integration:** ✅ Complete
**ModelsLab API:** ✅ Connected

---

## 🚀 Quick Start (Already Completed!)

### ✅ Step 1: Install Dependencies (DONE)

Python 3.11.9 installed at: `C:\Users\yoppi\AppData\Local\Programs\Python\Python311\`

All dependencies installed:
- FastAPI
- uvicorn
- PyTorch
- MobileSAM
- OpenCV, Pillow, NumPy
- timm

### ✅ Step 2: Download Model (DONE)

MobileSAM checkpoint downloaded: `mobile_sam.pt` (~38MB)

### ✅ Step 3: Start SAM Service (RUNNING)

SAM service is running on port 5001 (Background Process ID: 4fdc90)

Output:
```
🚀 Starting SAM Service...
Initializing SAM model: mobile_sam
Device: cpu
✅ SAM model loaded successfully
✅ SAM Service ready!
INFO:     Uvicorn running on http://0.0.0.0:5001
```

### ✅ Step 4: Test SAM (VERIFIED)

Health check successful:
```bash
curl http://localhost:5001/health
# Returns: {"status":"healthy","model":"mobile_sam","device":"cpu"}
```

### ✅ Step 5: Use in Lumiku (READY!)

**Quick Edit mode is fully operational:**
- Open Poster Editor at http://localhost:5173
- Click "Quick Edit" mode
- Click any object → SAM automatically detects it
- Enter edit prompt → ModelsLab inpaints
- Full object edited in ~40-70 seconds!

**That's it!** 🎉

---

## 🔄 Restart SAM Service (If Needed)

If SAM service stops, restart with:

```bash
cd "C:\Users\yoppi\Downloads\Lumiku App\services\sam-service"
"C:\Users\yoppi\AppData\Local\Programs\Python\Python311\python.exe" app.py
```

---

## 📝 How to Call SAM from Code

### From Backend (TypeScript)

```typescript
import { getSAMClient } from '@/lib/sam'

const samClient = getSAMClient()

// Segment by point
const result = await samClient.segmentByPoint(
  imageBase64,
  [100, 200], // x, y coordinates
  'shirt'     // optional object hint
)

console.log(result.maskBase64) // Use for inpainting
console.log(result.confidence) // 0-1 quality score
```

### Direct HTTP Call (Any Language)

```bash
curl -X POST http://localhost:5001/segment/point \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/png;base64,...",
    "point": [100, 200],
    "objectPrompt": "shirt"
  }'
```

---

## 🔧 Common Issues

### "ModuleNotFoundError: mobile_sam"
```bash
pip install git+https://github.com/ChaoningZhang/MobileSAM.git
```

### "Checkpoint not found"
Make sure `mobile_sam.pt` is in `services/sam-service/` directory

### Backend can't connect to SAM
Check SAM is running: `curl http://localhost:5001/health`

---

## ⚡ Performance Tips

- **Development:** MobileSAM on CPU (~3s) is fine
- **Production:** Use GPU or Segmind API for faster results
- **Switch to GPU:** Just change `.env` to `DEVICE=cuda`

---

## 📚 Full Documentation

See `SAM_DOCUMENTATION.md` for complete reference.

---

**Questions?** Check the documentation or test with curl commands above.
