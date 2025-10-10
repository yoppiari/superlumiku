# 🚀 DEPLOY AVATAR & POSE GENERATOR TO DEV.LUMIKU.COM

**Date:** 2025-10-10
**Status:** READY TO DEPLOY
**Branch:** development ✅ (Already pushed!)

---

## ✅ PRE-DEPLOYMENT CHECKLIST

- [x] Database schema added to `backend/prisma/schema.prisma`
- [x] Schema formatted and validated
- [x] Prisma Client generated locally
- [x] Changes committed to git
- [x] Pushed to `development` branch

**All clear! Ready to deploy! 🎉**

---

## 📋 DEPLOYMENT STEPS

### Step 1: SSH to dev.lumiku.com

```bash
# SSH to server (update with actual credentials)
ssh user@dev.lumiku.com

# Or if using specific user/key:
ssh -i ~/.ssh/your_key user@dev.lumiku.com
```

---

### Step 2: Navigate to Lumiku Directory

```bash
# Navigate to application directory
cd /path/to/lumiku

# Check current branch
git branch

# Should show: * development
```

---

### Step 3: Pull Latest Changes

```bash
# Pull latest from development branch
git pull origin development

# You should see:
# - AVATAR_POSE_MASTER_REFERENCE.md
# - AVATAR_POSE_QUICK_START.md
# - AVATAR_POSE_IMPLEMENTATION_ROADMAP.md
# - LUMIKU_AI_APPS_STRATEGY.md
# - WEEK1_FOUNDATION_PROGRESS.md
# - backend/prisma/schema.prisma (updated)
```

---

### Step 4: Install Backend Dependencies

```bash
cd backend

# Install new dependencies for Avatar & Pose Generator
bun add @huggingface/inference axios canvas form-data

# Verify installation
bun pm ls | grep -E "huggingface|axios|canvas"
```

**Expected output:**
```
@huggingface/inference
axios
canvas
form-data
```

---

### Step 5: Run Database Migration

**⚠️ IMPORTANT: This will modify production database!**

```bash
# Still in backend directory
cd backend

# Generate Prisma Client
bun prisma generate

# Run migration (creates 9 new tables)
bun prisma migrate deploy

# ✅ You should see:
# - brand_kits
# - avatars
# - products
# - pose_templates
# - pose_generation_projects
# - pose_generations
# - generated_poses
# - design_metrics
```

**Verify Migration:**
```bash
# Open Prisma Studio to verify tables
bun prisma studio

# Or check via psql
psql $DATABASE_URL -c "\dt" | grep -E "brand_kits|avatars|products|pose_"
```

---

### Step 6: Setup Environment Variables

```bash
# Edit .env file
cd backend
nano .env

# Add these new variables:
```

**Add to `.env`:**
```bash
# ========================================
# AVATAR & POSE GENERATOR CONFIGURATION
# ========================================

# Hugging Face API (Get token: https://huggingface.co/settings/tokens)
HUGGINGFACE_API_KEY="hf_xxxxxxxxxxxxxxxxxxxxx"
HUGGINGFACE_MODEL_ID="lllyasviel/control_v11p_sd15_openpose"

# Storage Limits
MAX_AVATAR_SIZE_MB=10
MAX_PRODUCT_SIZE_MB=20
MAX_POSES_PER_GENERATION=500

# Pose Dataset Path
POSE_DATASET_PATH="./storage/pose-dataset"

# Optional: Fallback Providers
# FAL_API_KEY="xxxxxxxxxxxxxxxxxxxxx"
# REPLICATE_API_TOKEN="r8_xxxxxxxxxxxxxxxxxxxxx"
```

**Save and exit** (Ctrl+O, Enter, Ctrl+X in nano)

---

### Step 7: Get Hugging Face API Key

**On your local machine** (or server browser):

1. Go to: https://huggingface.co/settings/tokens
2. Login or create account (FREE!)
3. Click "Create new token"
4. Name: "Lumiku Avatar & Pose Generator"
5. Type: "Read" (default is fine)
6. Click "Generate"
7. Copy the token: `hf_xxxxxxxxxxxxxxxxxxxxx`

**Update .env on server:**
```bash
nano backend/.env

# Update line:
HUGGINGFACE_API_KEY="hf_YOUR_ACTUAL_TOKEN_HERE"
```

---

### Step 8: Create Storage Directory

```bash
# Create directory for pose dataset
mkdir -p backend/storage/pose-dataset

# Create subdirectories
mkdir -p backend/storage/pose-dataset/fashion
mkdir -p backend/storage/pose-dataset/skincare
mkdir -p backend/storage/pose-dataset/lifestyle

# Set permissions
chmod 755 backend/storage/pose-dataset
```

---

### Step 9: Restart Backend Service

**If using PM2:**
```bash
# Restart backend
pm2 restart lumiku-backend

# Check logs
pm2 logs lumiku-backend --lines 50

# Look for:
# ✅ Database connected successfully
# ✅ Prisma Client loaded
# 🔌 Mounted plugins (existing apps)
```

**If using other process manager:**
```bash
# Stop service
systemctl stop lumiku-backend

# Start service
systemctl start lumiku-backend

# Check status
systemctl status lumiku-backend
```

---

### Step 10: Verify Deployment

**Test API:**
```bash
# Test health endpoint
curl https://dev.lumiku.com/health

# Expected: {"status":"ok","timestamp":"..."}

# Test apps endpoint
curl https://dev.lumiku.com/api/apps

# Should show existing apps (no Avatar/Pose apps yet - we'll add in Week 3)
```

**Check Database:**
```bash
cd backend

# List all tables
bun prisma studio

# Or via command line:
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"

# Verify new tables exist:
# ✅ brand_kits
# ✅ avatars
# ✅ products
# ✅ pose_templates
# ✅ pose_generation_projects
# ✅ pose_generations
# ✅ generated_poses
# ✅ design_metrics
```

---

## ✅ POST-DEPLOYMENT VERIFICATION

### Checklist

- [ ] SSH to dev.lumiku.com successful
- [ ] Code pulled from development branch
- [ ] Dependencies installed (@huggingface/inference, axios, canvas)
- [ ] Prisma Client generated
- [ ] Migration run successfully (9 new tables created)
- [ ] Environment variables added (HUGGINGFACE_API_KEY)
- [ ] Storage directory created
- [ ] Backend service restarted
- [ ] API health check passes
- [ ] Database tables verified

---

## 📊 DEPLOYMENT SUMMARY

**What Changed:**
- ✅ 9 new database tables for Avatar & Pose Generator
- ✅ 3 new relations on User model
- ✅ 4 new npm packages installed
- ✅ 8 new environment variables
- ✅ Storage directory structure created

**What's Next:**
- Week 2: Prepare pose dataset (download & seed 500-1000 poses)
- Week 3: Build Brand Kit plugin
- Week 4-5: Build Avatar Manager plugin
- Week 6: Build Product Manager plugin
- Week 7-9: Build Pose Generator plugin (CORE!)

---

## 🐛 TROUBLESHOOTING

### Issue: Migration Failed

```bash
# Check migration status
cd backend
bun prisma migrate status

# If migration pending:
bun prisma migrate deploy

# If migration failed, rollback:
bun prisma migrate resolve --rolled-back <migration-name>
```

### Issue: Prisma Client Not Found

```bash
# Regenerate Prisma Client
cd backend
rm -rf node_modules/.prisma
bun prisma generate
pm2 restart lumiku-backend
```

### Issue: Backend Won't Start

```bash
# Check logs
pm2 logs lumiku-backend --lines 100

# Common issues:
# - DATABASE_URL not set
# - Prisma Client not generated
# - Port already in use

# Fix:
# 1. Check .env has DATABASE_URL
# 2. Run: bun prisma generate
# 3. Kill process on port: lsof -ti:3000 | xargs kill
```

### Issue: Dependencies Not Installing

```bash
# Clear cache and reinstall
cd backend
rm -rf node_modules
rm bun.lock
bun install
bun add @huggingface/inference axios canvas form-data
```

---

## 🎯 SUCCESS CRITERIA

Deployment is successful when:

- ✅ Backend starts without errors
- ✅ API responds to health check
- ✅ Database has 9 new tables
- ✅ User table has 3 new relations (brandKits, avatars, products)
- ✅ Prisma Studio shows all models
- ✅ No migration errors in logs

---

## 📞 NEXT STEPS AFTER DEPLOYMENT

### Immediate (Week 1-2):
1. Download pose dataset from Hugging Face
2. Create seed script for PoseTemplate
3. Seed database with 500-1000 poses
4. Verify poses accessible via Prisma Studio

### Week 3:
1. Build Brand Kit plugin (backend + frontend)
2. Test brand kit CRUD operations
3. Deploy and verify on dev.lumiku.com

---

## 📝 DEPLOYMENT LOG

**Date:** _____________
**Deployed By:** _____________
**Server:** dev.lumiku.com
**Branch:** development
**Commit:** 8f4b0a4

**Verification:**
- [ ] Migration completed
- [ ] Backend restarted
- [ ] Tables created
- [ ] API working

**Issues Encountered:**
_____________________________________________
_____________________________________________

**Resolution:**
_____________________________________________
_____________________________________________

**Notes:**
_____________________________________________
_____________________________________________

---

## 🎉 CONGRATULATIONS!

If all steps completed successfully, you've just deployed the **foundation** for the Avatar & Pose Generator system!

**What you've accomplished:**
- ✅ Database schema for complete Avatar & Pose system
- ✅ Infrastructure ready for 4 new apps
- ✅ Hugging Face API integration configured
- ✅ Storage structure prepared

**Next milestone:** Week 2 - Prepare pose dataset library (500-1000 poses)

---

**Keep this document for reference!**

If you encounter any issues during deployment, refer to:
- `AVATAR_POSE_MASTER_REFERENCE.md` - Complete technical reference
- `AVATAR_POSE_QUICK_START.md` - Quick troubleshooting
- `WEEK1_FOUNDATION_PROGRESS.md` - Progress tracking

---

**Document Version:** 1.0
**Last Updated:** 2025-10-10
**Status:** Ready for Deployment 🚀
