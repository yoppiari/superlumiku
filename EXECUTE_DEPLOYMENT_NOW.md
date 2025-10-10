# 🚀 EXECUTE DEPLOYMENT - COPY & PASTE COMMANDS

**Status:** READY TO DEPLOY ✅
**Branch:** development (pushed)
**Server:** dev.lumiku.com

---

## 🎯 QUICK DEPLOY (2 Options)

### Option A: Automated Script (RECOMMENDED) ⭐

```bash
# 1. SSH to server
ssh user@dev.lumiku.com

# 2. Navigate to project
cd /path/to/lumiku

# 3. Pull latest (includes deployment script)
git pull origin development

# 4. Run automated deployment
bash DEPLOYMENT_SCRIPT.sh

# Follow prompts and done! 🎉
```

---

### Option B: Manual Commands (Step-by-Step)

Copy and paste these commands one by one:

```bash
# ============================================
# STEP 1: SSH to server
# ============================================
ssh user@dev.lumiku.com

# ============================================
# STEP 2: Navigate and pull
# ============================================
cd /path/to/lumiku  # Update with actual path!
git status
git pull origin development

# ============================================
# STEP 3: Install dependencies
# ============================================
cd backend
bun add @huggingface/inference axios canvas form-data

# ============================================
# STEP 4: Generate Prisma Client & Migrate
# ============================================
bun prisma generate
bun prisma migrate deploy

# ⚠️ Migration will create 9 new tables!

# ============================================
# STEP 5: Setup environment variables
# ============================================
nano .env

# Add these lines (get HF token from https://huggingface.co/settings/tokens):
# HUGGINGFACE_API_KEY="hf_xxxxxxxxxxxxxxxxxxxxx"
# HUGGINGFACE_MODEL_ID="lllyasviel/control_v11p_sd15_openpose"
# MAX_AVATAR_SIZE_MB=10
# MAX_PRODUCT_SIZE_MB=20
# MAX_POSES_PER_GENERATION=500
# POSE_DATASET_PATH="./storage/pose-dataset"

# Save: Ctrl+O, Enter, Ctrl+X

# ============================================
# STEP 6: Create storage directories
# ============================================
mkdir -p storage/pose-dataset/fashion
mkdir -p storage/pose-dataset/skincare
mkdir -p storage/pose-dataset/lifestyle
chmod -R 755 storage/pose-dataset

# ============================================
# STEP 7: Restart backend
# ============================================
cd ..
pm2 restart lumiku-backend

# Or if using systemctl:
# sudo systemctl restart lumiku-backend

# ============================================
# STEP 8: Verify deployment
# ============================================
# Check logs
pm2 logs lumiku-backend --lines 50

# Test API
curl https://dev.lumiku.com/health

# Check database
cd backend
bun prisma studio

# Look for 9 new tables:
# - brand_kits
# - avatars
# - products
# - pose_templates
# - pose_generation_projects
# - pose_generations
# - generated_poses
# - design_metrics
```

---

## ✅ SUCCESS CRITERIA

Deployment successful when you see:

```bash
# 1. Health check passes
curl https://dev.lumiku.com/health
# Response: {"status":"ok","timestamp":"..."}

# 2. PM2 logs show no errors
pm2 logs lumiku-backend --lines 20
# Look for: "✅ Database connected successfully"

# 3. Prisma Studio shows 9 new tables
bun prisma studio
# Tables: brand_kits, avatars, products, pose_templates, etc.
```

---

## 🐛 IF SOMETHING GOES WRONG

### Migration Failed?
```bash
cd backend
bun prisma migrate status
bun prisma migrate resolve --rolled-back <migration-name>
```

### Backend Won't Start?
```bash
# Check logs
pm2 logs lumiku-backend --err --lines 50

# Common fixes:
# 1. Regenerate Prisma Client
bun prisma generate

# 2. Check .env has DATABASE_URL
cat .env | grep DATABASE_URL

# 3. Restart again
pm2 restart lumiku-backend
```

### Dependencies Not Installing?
```bash
cd backend
rm -rf node_modules
rm bun.lock
bun install
bun add @huggingface/inference axios canvas form-data
```

---

## 📞 AFTER DEPLOYMENT

### Verify Everything Works:

```bash
# 1. API health
curl https://dev.lumiku.com/health

# 2. Database tables
cd backend
bun prisma studio

# 3. Backend logs
pm2 logs lumiku-backend --lines 100

# 4. Check all apps still work
curl https://dev.lumiku.com/api/apps
```

### Expected Results:
- ✅ Health endpoint returns OK
- ✅ 9 new tables visible in Prisma Studio
- ✅ No errors in PM2 logs
- ✅ Existing apps still work
- ✅ Backend running smoothly

---

## 🎯 WHAT'S NEXT AFTER DEPLOYMENT

### Week 2 Tasks:
1. Get Hugging Face API key (https://huggingface.co/settings/tokens)
2. Download pose dataset from Hugging Face
3. Create seed script for PoseTemplate
4. Seed database with 500-1000 poses

### Week 3 Tasks:
1. Build Brand Kit plugin (backend + frontend)
2. Test CRUD operations
3. Deploy and verify

---

## 📝 DEPLOYMENT CHECKLIST

Print and check off:

**Pre-Deployment:**
- [x] Code committed
- [x] Pushed to development branch
- [x] Deployment guide ready
- [x] Automated script ready

**During Deployment:**
- [ ] SSH successful
- [ ] Code pulled
- [ ] Dependencies installed
- [ ] Migration completed
- [ ] Environment variables added
- [ ] Storage created
- [ ] Backend restarted

**Post-Deployment:**
- [ ] Health check passes
- [ ] 9 tables created
- [ ] No errors in logs
- [ ] Prisma Studio accessible
- [ ] Existing apps still work

---

## 🎉 READY TO GO!

**Choose your deployment method:**

### AUTOMATED (EASY):
```bash
ssh user@dev.lumiku.com
cd /path/to/lumiku
git pull origin development
bash DEPLOYMENT_SCRIPT.sh
```

### MANUAL (CONTROL):
Follow "Option B" commands above

---

**Good luck with deployment! 🚀**

If you need help, refer to:
- `DEPLOY_TO_DEV_LUMIKU_NOW.md` - Detailed guide
- `AVATAR_POSE_MASTER_REFERENCE.md` - Technical reference

---

**Document Version:** 1.0
**Last Updated:** 2025-10-10
