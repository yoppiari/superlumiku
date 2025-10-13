# ✅ SOLUSI DEPLOYMENT - dev.lumiku.com

## 🔍 Root Cause Analysis

### Kesalahan Yang Terjadi
Saya menggunakan **Coolify API** untuk deploy ke dev.lumiku.com, padahal:

| Environment | Deployment Method | Details |
|-------------|-------------------|---------|
| **app.lumiku.com** (Production) | ✅ Coolify | UUID: `jws8c80ckos00og0cos4cw8s`, Branch: `main` |
| **dev.lumiku.com** (Development) | ❌ SSH Manual | Branch: `development`, Script: `DEPLOYMENT_SCRIPT.sh` |

### Bukti dari Codebase

#### File: `DEPLOYMENT_SCRIPT.sh` (Lines 5-7)
```bash
# ==================================================
# AVATAR & POSE GENERATOR - DEPLOYMENT SCRIPT
# ==================================================
# Server: dev.lumiku.com
# Branch: development
```

#### File: `DEPLOYMENT_SCRIPT.sh` (Lines 27-28)
```bash
cd /home/deploy/lumiku || cd /var/www/lumiku || cd ~/lumiku
```

#### File: `DEPLOYMENT_SCRIPT.sh` (Lines 146-150)
```bash
# Try PM2 first
if command -v pm2 &> /dev/null; then
    pm2 restart lumiku-backend || pm2 restart backend || pm2 restart all
```

### Kesimpulan
**dev.lumiku.com menggunakan deployment manual via SSH**, bukan Coolify!

---

## 🚀 Cara Deploy FLUX Preview ke dev.lumiku.com

### Prerequisites
- SSH access ke server dev.lumiku.com
- Git branch `development` sudah ter-push (✅ SUDAH: commit `6630e24`)
- Environment variables sudah di-set di server

### Metode 1: Deploy Menggunakan DEPLOYMENT_SCRIPT.sh

#### Step 1: SSH ke Server
```bash
# Gunakan SSH key atau password
ssh deploy@dev.lumiku.com
# atau
ssh root@[IP_ADDRESS_DEV_SERVER]
```

#### Step 2: Run Deployment Script
```bash
cd /home/deploy/lumiku || cd /var/www/lumiku || cd ~/lumiku
bash DEPLOYMENT_SCRIPT.sh
```

Script akan otomatis:
1. ✅ Switch ke branch `development`
2. ✅ Pull latest changes (termasuk commit FLUX `6630e24`)
3. ✅ Install dependencies (`@huggingface/inference`, dll)
4. ✅ Generate Prisma Client
5. ✅ Run database migrations
6. ✅ Restart PM2 service
7. ✅ Health check

#### Step 3: Verify Deployment
```bash
# Check PM2 status
pm2 logs lumiku-backend --lines 50

# Test API
curl https://dev.lumiku.com/health
curl https://dev.lumiku.com/api/apps/avatar-creator/projects
```

---

### Metode 2: Deploy Manual (Jika Script Tidak Berjalan)

#### Step 1: SSH ke Server
```bash
ssh deploy@dev.lumiku.com
```

#### Step 2: Navigate to Project
```bash
cd /home/deploy/lumiku
# atau
cd /var/www/lumiku
```

#### Step 3: Pull Latest Code
```bash
# Make sure on development branch
git checkout development
git pull origin development

# Verify commit
git log -1 --oneline
# Should show: 6630e24 feat: Add FLUX.1-dev preview-first flow for Avatar Creator
```

#### Step 4: Install Backend Dependencies
```bash
cd backend
bun install
```

#### Step 5: Update Database
```bash
# Generate Prisma Client with new schema
bun prisma generate

# Run migration if needed
bun prisma db push --skip-generate
```

#### Step 6: Restart Service
```bash
# Using PM2
pm2 restart lumiku-backend

# Or using systemctl
sudo systemctl restart lumiku-backend
```

#### Step 7: Check Logs
```bash
pm2 logs lumiku-backend --lines 100

# Look for:
# - "🎨 Avatar Creator API initialized"
# - "POST /api/apps/avatar-creator/projects/:projectId/avatars/generate-preview"
# - "POST /api/apps/avatar-creator/projects/:projectId/avatars/save-preview"
```

---

## 🔧 Environment Variables Check

Pastikan file `.env` di server dev.lumiku.com memiliki:

```bash
# HuggingFace Configuration
HUGGINGFACE_API_KEY="hf_xxxxxxxxxxxxxxxxxxxxx"
FLUX_MODEL="black-forest-labs/FLUX.1-dev"
FLUX_LORA_MODEL="XLabs-AI/flux-RealismLora"

# Database (should already exist)
DATABASE_URL="postgresql://lumiku_dev:password@host:port/lumiku_development?schema=public"

# CORS
CORS_ORIGIN="https://dev.lumiku.com"
```

---

## 📋 Deployment Checklist

### Before Deployment
- [x] Code pushed to `development` branch (commit `6630e24`)
- [x] app.lumiku.com reverted to correct state
- [ ] SSH access to dev.lumiku.com server verified
- [ ] HuggingFace API key available

### During Deployment
- [ ] SSH connected to dev.lumiku.com
- [ ] Branch switched to `development`
- [ ] Latest code pulled
- [ ] Dependencies installed
- [ ] Prisma Client generated
- [ ] Database migrated
- [ ] Service restarted

### After Deployment
- [ ] Health check passed: `curl https://dev.lumiku.com/health`
- [ ] PM2 logs show no errors
- [ ] New endpoints available:
  - `POST /api/apps/avatar-creator/projects/:projectId/avatars/generate-preview`
  - `POST /api/apps/avatar-creator/projects/:projectId/avatars/save-preview`

---

## 🎯 Summary

| Item | Status | Notes |
|------|--------|-------|
| **Branch** | ✅ Ready | `development` with commit `6630e24` |
| **Code** | ✅ Pushed | Includes FLUX preview flow |
| **app.lumiku.com** | ✅ Fixed | Reverted to correct state |
| **dev.lumiku.com** | ⏳ Waiting | Needs SSH access to deploy |
| **Deployment Method** | ✅ Identified | SSH + `DEPLOYMENT_SCRIPT.sh` or manual |

---

## 📞 Next Action Required

**ANDA perlu:**

1. **Provide SSH access** to dev.lumiku.com:
   ```bash
   # Example credentials needed:
   ssh deploy@dev.lumiku.com
   # OR
   ssh root@[IP_ADDRESS]
   ```

2. **OR run deployment manually** on the server:
   ```bash
   ssh [your-user]@dev.lumiku.com
   cd /home/deploy/lumiku
   bash DEPLOYMENT_SCRIPT.sh
   ```

3. **OR provide alternative deployment method** if SSH is not available

---

## 🔄 What Changed (FLUX Preview Flow)

### Backend Changes
1. **Database Schema** (`backend/prisma/schema.prisma`):
   - Added `bodyType` field to Avatar model

2. **HuggingFace Client** (`backend/src/lib/huggingface-client.ts`):
   - Added `fluxTextToImage()` method with LoRA support

3. **Avatar AI Service** (`backend/src/apps/avatar-creator/services/avatar-ai.service.ts`):
   - Added `generatePreview()` - Generate without saving
   - Added `savePreview()` - Save preview to database
   - Updated `buildAvatarPrompt()` for body type

4. **API Routes** (`backend/src/apps/avatar-creator/routes.ts`):
   - Added `POST /projects/:projectId/avatars/generate-preview`
   - Added `POST /projects/:projectId/avatars/save-preview`

### Environment Variables
```bash
FLUX_MODEL="black-forest-labs/FLUX.1-dev"
FLUX_LORA_MODEL="XLabs-AI/flux-RealismLora"
```

---

**Ready to deploy once SSH access is provided! 🚀**
