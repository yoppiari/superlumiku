# PhotoMaker V2 Quick Start Guide

## 🚀 Immediate Next Steps

### 1. Seed Database (5 minutes)

Login to Coolify → Open Terminal:

```bash
cd backend
bun run prisma db seed
```

Verify seeded:
```bash
bunx prisma studio
# Check AIModel table for photomaker models
```

---

## 📸 How to Use PhotoMaker (Backend)

### Simple Example

```typescript
import { hfClient } from './backend/src/lib/huggingface-client'
import fs from 'fs'

// Load user photo
const photo = fs.readFileSync('user-photo.jpg')

// Generate studio portrait
const avatar = await hfClient.photoMakerGeneration({
  inputPhotos: [photo],
  prompt: 'A professional headshot, studio lighting',
  width: 1024,
  height: 1024
})

// Save result
fs.writeFileSync('generated-avatar.jpg', avatar)
```

---

## 💰 Pricing

| Tier | Resolution | Credits | Time |
|------|------------|---------|------|
| Basic | 512x512 | 18 | 60-90s |
| Pro | 1024x1024 | 25 | 90-120s |
| Enterprise | 1536x1536 | 35 | 120-180s |

---

## ✨ Features

✅ Upload 1-4 photos
✅ Zero-shot (no training)
✅ Identity preservation
✅ Studio-quality output
✅ Style customization

---

## 📝 Prompt Examples

**Professional:**
"A professional business headshot, studio lighting, corporate attire"

**Casual:**
"A casual outdoor portrait, natural lighting, friendly smile"

**Artistic:**
"An artistic portrait in oil painting style, warm colors, dramatic lighting"

---

## 🔧 Full Implementation TODO

**Frontend (8 hours):**
- Photo upload UI component
- Generation mode selector
- Model tier selector
- API integration

**Backend (4 hours):**
- API route handler
- Multipart/form-data support
- Avatar service integration
- Credit deduction logic

**Testing (2 hours):**
- Integration tests
- End-to-end tests
- Manual QA

---

## 📚 Documentation

- PHOTOMAKER_V2_DEPLOYMENT_SUMMARY.md - Complete guide
- AVATAR_AI_MODEL_RECOMMENDATIONS.md - Model research & comparison

---

## ⚡ Status

**Backend:** ✅ READY (deployed to dev.lumiku.com)
**Database:** ⏳ PENDING (run seed command)
**Frontend:** ❌ NOT STARTED
**API Routes:** ❌ NOT STARTED

---

**Next:** Run database seed, then implement frontend photo upload UI!
