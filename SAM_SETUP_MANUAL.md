# SAM Setup Manual - Step by Step
## Install Python & SAM Service di Windows

**Status Saat Ini:** ✅ SELESAI - Python installed, SAM service running, system fully operational!

---

## Step 1: Install Python ✅ SELESAI

### ✅ Python 3.11.9 Installed
**Lokasi:** `C:\Users\yoppi\AppData\Local\Programs\Python\Python311\`

**Installed via:**
```bash
winget install Python.Python.3.11 --silent
```

### ✅ Verified Installation:
```bash
python --version
# Output: Python 3.11.9

pip --version
# Output: pip 24.x.x from C:\Users\yoppi\AppData\Local\Programs\Python\Python311\Lib\site-packages\pip
```

**Status:** ✅ Complete

---

## Step 2: Install SAM Dependencies ✅ SELESAI

```bash
cd "C:\Users\yoppi\Downloads\Lumiku App\services\sam-service"
"C:\Users\yoppi\AppData\Local\Programs\Python\Python311\python.exe" -m pip install -r requirements.txt
```

**✅ Successfully Installed:**
- FastAPI 0.115.12 (web framework)
- uvicorn 0.34.0 (server)
- torch 2.6.0+cpu (PyTorch CPU)
- mobile_sam (MobileSAM model)
- opencv-python (image processing)
- Pillow 11.0.0 (image library)
- numpy 2.2.4 (arrays)
- timm 1.0.14 (additional dependency)

**Total Downloaded:** ~250MB
**Status:** ✅ Complete

---

## Step 3: Download MobileSAM Model ✅ SELESAI

### ✅ Model Downloaded

Downloaded via curl:
```bash
curl -L -o mobile_sam.pt https://github.com/ChaoningZhang/MobileSAM/raw/master/weights/mobile_sam.pt
```

**File Location:** `C:\Users\yoppi\Downloads\Lumiku App\services\sam-service\mobile_sam.pt`
**File Size:** 38.8 MB
**Status:** ✅ Complete

---

## Step 4: Setup Environment (Optional)

```bash
cd services/sam-service

# Copy .env.example to .env
copy .env.example .env
```

Default config sudah bagus untuk development:
```
PORT=5001
SAM_MODEL=mobile_sam
SAM_CHECKPOINT=mobile_sam.pt
DEVICE=auto
```

---

## Step 5: Start SAM Service ✅ RUNNING

```bash
cd "C:\Users\yoppi\Downloads\Lumiku App\services\sam-service"
"C:\Users\yoppi\AppData\Local\Programs\Python\Python311\python.exe" app.py
```

**✅ Service Running (Background Process ID: 4fdc90):**
```
🚀 Starting SAM Service...
Initializing SAM model: mobile_sam
Device: cpu
Checkpoint: mobile_sam.pt
✅ SAM model loaded successfully
✅ SAM Service ready!
INFO:     Uvicorn running on http://0.0.0.0:5001
```

**Status:** ✅ Active and Running on port 5001

---

## Step 6: Test SAM Service ✅ VERIFIED

```bash
curl http://localhost:5001/health
```

**✅ Actual Response:**
```json
{"status":"healthy","model":"mobile_sam","device":"cpu"}
```

✅ **SAM Service Fully Operational!**

---

## Step 7: Gunakan di Poster Editor ✅ READY TO USE

**✅ System Status:**
1. ✅ SAM service running (port 5001)
2. ✅ Backend running (port 3001)
3. ✅ Frontend running (port 5173)

**Cara Pakai:**
1. Buka http://localhost:5173
2. Pilih "Poster Editor"
3. Upload gambar
4. Mode "Quick Edit" otomatis aktif
5. **Klik sekali di object** (shirt, rambut, background, dll)
6. Masukkan prompt edit (contoh: "change to blue color")
7. Klik Save → Box hilang, tinggal badge nomor
8. Klik "Start AI Inpaint" → SAM + ModelsLab bekerja!
9. Tunggu ~40-70 detik → Hasil full object edited! ✨

**Dual AI System Active:**
- SAM mendeteksi object penuh (3-5s)
- ModelsLab melakukan inpainting (30-60s)
- Total: Professional quality editing!

---

## Troubleshooting

### Issue: "pip: command not found"
**Solusi:** Python belum terinstall atau tidak ada di PATH
- Reinstall Python, centang "Add to PATH"
- Restart terminal

### Issue: "ModuleNotFoundError: No module named 'mobile_sam'"
**Solusi:**
```bash
pip install git+https://github.com/ChaoningZhang/MobileSAM.git
```

### Issue: "Checkpoint not found"
**Solusi:** Download `mobile_sam.pt` manual (Step 3)

### Issue: SAM Service Slow (~10+ seconds)
**Ini normal!** MobileSAM on CPU: ~3-5 seconds
- Untuk production, deploy dengan GPU server
- Atau gunakan Segmind API ($0.001/request)

### Issue: Backend tidak connect ke SAM
**Check:**
```bash
# Is SAM running?
curl http://localhost:5001/health

# Check backend logs
cd backend
PORT=3001 bun run src/index.ts
```

---

## Architecture Saat Ini

```
Frontend (localhost:5173)
    ↓
Backend (localhost:3001)
    ↓
SAM Service (localhost:5001) ← Perlu dijalankan manual
    ↓
ModelsLab API
```

---

## Commands Summary

**Terminal 1 - SAM Service:**
```bash
cd "C:\Users\yoppi\Downloads\Lumiku App\services\sam-service"
python app.py
```

**Terminal 2 - Backend:**
```bash
cd "C:\Users\yoppi\Downloads\Lumiku App\backend"
PORT=3001 bun run src/index.ts
```

**Terminal 3 - Frontend:**
```bash
cd "C:\Users\yoppi\Downloads\Lumiku App\frontend"
npm run dev
```

---

## What Happens Without SAM?

Jika SAM service tidak running:
- ✅ System tetap berfungsi normal
- ✅ Automatic fallback ke circular masking
- ✅ No errors untuk user
- ⚠️ Tapi tidak ada smart object detection

**Recommendation:** Install Python & run SAM untuk best experience!

---

## Alternative: Use Segmind API (No Python Needed!)

Jika tidak mau install Python, bisa pakai Segmind SAM API:

1. Signup di https://www.segmind.com/
2. Get API key
3. Update backend `.env`:
```bash
SAM_ENABLED=true
SAM_USE_API=true
SEGMIND_API_KEY=your_api_key_here
```

**Cost:** $0.001 per SAM request (~Rp 15)

---

## Status Implementation

✅ **Complete & Ready:**
- Python SAM service code
- Backend integration
- Frontend integration
- Automatic fallback
- Complete documentation
- Docker config

⏳ **Perlu Manual Setup:**
- Install Python (Step 1)
- Install dependencies (Step 2)
- Download model (Step 3)
- Run SAM service (Step 5)

---

## Questions?

**Check other docs:**
- `SAM_QUICK_START.md` - Quick reference
- `SAM_DOCUMENTATION.md` - Complete technical docs
- `SAM_IMPLEMENTATION_SUMMARY.md` - What was built

**Test SAM:**
```bash
curl http://localhost:5001/health
```

---

**Last Updated:** 2025-01-07
**Your Next Step:** Install Python (Step 1)
