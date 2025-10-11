# 🚀 Production Deployment Guide: app.lumiku.com

**Status:** Ready to Deploy
**Branch:** `main`
**Date:** 2025-10-10
**Version:** 1.0.0 with Subscription System

---

## 📋 What's New in This Deployment

### ✨ Major Features Added

1. **Dual User System** (PAYG vs Subscription)
   - Pay-as-you-go users (credit-based)
   - Subscription users (quota-based)
   - Multiple tiers: Free, Basic, Pro, Enterprise

2. **Model-Level Access Control**
   - AI models categorized by tier
   - Dynamic pricing based on user type
   - Automatic model filtering per user

3. **Subscription Management**
   - Monthly/Yearly plans
   - Auto-renewal system
   - Upgrade/downgrade capabilities
   - Daily quota tracking with auto-reset

4. **New Apps**
   - Video Generator (Multiple AI providers)
   - Poster Editor (AI Inpainting + Text Detection)

5. **Background Jobs**
   - Daily quota reset (00:00 UTC)
   - Subscription expiry checker (hourly)

### 📊 Database Changes

**New Tables:**
- `AIModel` - Central AI model registry
- `SubscriptionPlan` - Subscription tier definitions
- `Subscription` - User subscriptions
- `QuotaUsage` - Daily quota tracking
- `ModelUsage` - Detailed usage analytics
- `VideoGeneratorProject`, `VideoGeneration`
- `PosterEditorProject`, `PosterEdit`, `PosterExport`

**Updated Tables:**
- `User` - Added `accountType` and `subscriptionTier`

---

## 🔐 Prerequisites

### 1. Required Secrets

Generate production secrets (DO NOT use development secrets!):

```bash
# JWT Secret (Base64 encoded, 32 bytes)
openssl rand -base64 32

# PostgreSQL Password (32 characters)
openssl rand -base64 24
```

### 2. Domain & SSL

- Domain: `app.lumiku.com` must point to server
- SSL: Coolify will auto-generate Let's Encrypt certificate

### 3. API Keys

Required for production:
- ✅ **ANTHROPIC_API_KEY** (Claude)
- ✅ **MODELSLAB_API_KEY** (Video/Image Generation)
- ✅ **EDENAI_API_KEY** (Optional - Advanced models)
- ✅ **DUITKU** Production credentials (NOT sandbox!)

### 4. Payment Gateway

**IMPORTANT:** Use Duitku **PRODUCTION** credentials:
- Merchant Code: (Your production merchant code)
- API Key: (Your production API key)
- Environment: `production`

---

## 📝 Step-by-Step Deployment

### Step 1: Access Coolify Dashboard

```
URL: https://cf.avolut.com
```

Login with your credentials.

---

### Step 2: Create New Application

1. Click **+ New Resource**
2. Select **Application**
3. Choose **Public Repository**

**Configuration:**
```
Repository URL: https://github.com/yoppiari/superlumiku.git
Branch: main
Build Pack: Docker Compose
Docker Compose File: docker-compose.prod.yml
```

---

### Step 3: Application Settings

**Basic Settings:**
```
Name: Lumiku Production
Description: Production environment for app.lumiku.com
```

**Build Settings:**
```
Branch: main
Build Pack: Docker Compose
Docker Compose File: docker-compose.prod.yml
Base Directory: / (root)
```

---

### Step 4: Configure Domain

1. Go to **Domains** tab
2. Click **+ Add Domain**
3. Enter: `app.lumiku.com`
4. Enable **Generate SSL Certificate** ✅
5. Click **Save**

⏰ SSL generation takes 2-5 minutes.

---

### Step 5: Environment Variables

**CRITICAL:** Use production values, NOT development!

Click **Environment Variables** → **Bulk Edit**, paste this:

```env
# ========================================
# Database Configuration (PRODUCTION)
# ========================================
POSTGRES_USER=lumiku_prod
POSTGRES_PASSWORD=YOUR_GENERATED_POSTGRES_PASSWORD_HERE
POSTGRES_DB=lumiku_production
DATABASE_URL=postgresql://lumiku_prod:YOUR_GENERATED_POSTGRES_PASSWORD_HERE@postgres:5432/lumiku_production?schema=public
POSTGRES_HOST=postgres

# ========================================
# Server Configuration
# ========================================
NODE_ENV=production
PORT=80

# ========================================
# JWT Configuration (PRODUCTION SECRETS!)
# ========================================
JWT_SECRET=YOUR_GENERATED_JWT_SECRET_HERE
JWT_EXPIRES_IN=7d

# ========================================
# Payment Gateway (PRODUCTION - DUITKU)
# ========================================
DUITKU_MERCHANT_CODE=YOUR_PRODUCTION_MERCHANT_CODE
DUITKU_API_KEY=YOUR_PRODUCTION_API_KEY
DUITKU_ENV=production
DUITKU_CALLBACK_URL=https://app.lumiku.com/api/mainapp/payment/callback
DUITKU_RETURN_URL=https://app.lumiku.com/dashboard

# ========================================
# AI Services (PRODUCTION API KEYS!)
# ========================================
ANTHROPIC_API_KEY=YOUR_PRODUCTION_ANTHROPIC_KEY
MODELSLAB_API_KEY=YOUR_PRODUCTION_MODELSLAB_KEY
EDENAI_API_KEY=YOUR_PRODUCTION_EDENAI_KEY

# ========================================
# File Storage
# ========================================
UPLOAD_PATH=/app/backend/uploads
OUTPUT_PATH=/app/backend/outputs
MAX_FILE_SIZE=524288000
UPLOAD_DIR=/app/backend/uploads
OUTPUT_DIR=/app/backend/uploads/outputs

# ========================================
# FFmpeg
# ========================================
FFMPEG_PATH=ffmpeg
FFPROBE_PATH=ffprobe

# ========================================
# CORS (PRODUCTION DOMAIN!)
# ========================================
CORS_ORIGIN=https://app.lumiku.com

# ========================================
# Rate Limiting (Stricter for production)
# ========================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ========================================
# Redis Configuration
# ========================================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_USERNAME=

# ========================================
# SAM Server (AI Segmentation)
# ========================================
SAM_SERVER_URL=http://localhost:5000
SAM_SERVER_ENABLED=false
```

**⚠️ REPLACE ALL PLACEHOLDERS:**
- `YOUR_GENERATED_POSTGRES_PASSWORD_HERE`
- `YOUR_GENERATED_JWT_SECRET_HERE`
- `YOUR_PRODUCTION_MERCHANT_CODE`
- `YOUR_PRODUCTION_API_KEY`
- `YOUR_PRODUCTION_ANTHROPIC_KEY`
- `YOUR_PRODUCTION_MODELSLAB_KEY`
- `YOUR_PRODUCTION_EDENAI_KEY`

---

### Step 6: Enable Auto-Deploy

1. Go to **Source** tab
2. Toggle **Auto Deploy on Push** → ON ✅
3. Ensure branch is `main`
4. Save

**Webhook:** Coolify auto-creates GitHub webhook

---

### Step 7: Deploy! 🚀

1. Click **Deployments** tab
2. Click **Deploy** button
3. Monitor logs in real-time

**Expected Process:**
```
✅ Cloning repository (branch: main)
✅ Building Docker images
✅ Starting postgres container
✅ Starting redis container
✅ Starting app container
✅ Health checks passing
✅ Deployment successful!
```

⏰ First deployment: **10-15 minutes**

---

### Step 8: Run Database Migrations

After deployment succeeds, run migrations:

#### Via Coolify Terminal:

1. Go to **Terminal** tab
2. Select container: `lumiku-app` (or `app`)
3. Run these commands:

```bash
# Generate Prisma Client
bunx prisma generate

# Run all migrations
bunx prisma migrate deploy

# Seed subscription plans and AI models
bunx prisma db seed
```

#### Expected Output:

```
✅ Prisma Client generated
✅ 15 migrations applied
✅ Seeded subscription plans (5 plans)
✅ Seeded AI models (15 models)
✅ Migrated existing users to PAYG
```

---

### Step 9: Create Initial Admin User

Create an admin account:

```bash
# In container terminal
bun run backend/scripts/create-test-user.ts
```

Or manually via PostgreSQL:

```bash
# Connect to database
docker exec -it lumiku-postgres psql -U lumiku_prod -d lumiku_production

# Create admin user (in psql)
INSERT INTO users (id, email, password, name, role, "accountType", "subscriptionTier")
VALUES (
  'admin-001',
  'admin@lumiku.com',
  '$2a$10$HASHED_PASSWORD_HERE',  -- Use bcrypt to hash your password
  'Admin',
  'admin',
  'subscription',
  'enterprise'
);
```

---

### Step 10: Verify Deployment ✅

#### 1. Health Check

```bash
curl https://app.lumiku.com/health
```

Expected:
```json
{
  "status": "ok",
  "timestamp": "2025-10-10T..."
}
```

#### 2. Check Database

```bash
# Exec into postgres container
docker exec -it lumiku-postgres psql -U lumiku_prod -d lumiku_production

# Check tables
\dt

# Should see:
# - users
# - ai_models
# - subscription_plans
# - subscriptions
# - quota_usages
# - model_usages
# + all other tables

# Check AI models
SELECT "modelKey", name, tier, enabled FROM ai_models;

# Check subscription plans
SELECT "planId", name, tier, price FROM subscription_plans;
```

#### 3. Test Frontend

Open browser: `https://app.lumiku.com`

Expected:
- ✅ Login page loads
- ✅ SSL certificate valid (green padlock)
- ✅ Can login with test user
- ✅ Dashboard displays apps
- ✅ Can access Video Generator
- ✅ Can access Poster Editor

---

## 🔍 Post-Deployment Checklist

### Infrastructure
- [ ] All 3 containers running (app, postgres, redis)
- [ ] SSL certificate active and valid
- [ ] Domain resolves correctly
- [ ] Health endpoint returns 200 OK
- [ ] Logs show no critical errors

### Database
- [ ] Migrations applied successfully
- [ ] All tables created (25+ tables)
- [ ] Subscription plans seeded (5 plans)
- [ ] AI models seeded (15+ models)
- [ ] Admin user created

### Features
- [ ] Login/Register works
- [ ] Dashboard loads all apps
- [ ] Video Generator accessible
- [ ] Poster Editor accessible
- [ ] Video Mixer works
- [ ] Carousel Mix works
- [ ] Looping Flow works (if enabled)

### Subscription System
- [ ] `/api/subscription/plans` returns plans
- [ ] `/api/subscription/status` works for logged-in user
- [ ] `/api/quota/status` works for subscription users
- [ ] Model filtering works per tier
- [ ] PAYG users can access free models
- [ ] Subscription users can access tier models

### Background Jobs
- [ ] Cron scheduler initialized
- [ ] Daily quota reset job scheduled (00:00 UTC)
- [ ] Subscription expiry job scheduled (hourly)

### Payment Integration
- [ ] Duitku configured with PRODUCTION credentials
- [ ] Callback URL set to production domain
- [ ] Test payment flow (use small amount)

---

## 🛠️ Common Issues & Solutions

### ❌ Build Failed

**Check:**
```bash
# View build logs in Coolify
# Look for errors in dependency installation
```

**Fix:**
- Ensure `docker-compose.prod.yml` syntax is correct
- Check all environment variables are set
- Redeploy after fixing

### ❌ Database Connection Error

**Symptoms:** App can't connect to PostgreSQL

**Check:**
```bash
# Test postgres
docker exec -it lumiku-postgres pg_isready -U lumiku_prod

# Check DATABASE_URL format
echo $DATABASE_URL
```

**Fix:**
- Verify `DATABASE_URL` matches postgres credentials
- Ensure postgres container is healthy
- Restart app container

### ❌ Migration Failed

**Symptoms:** `prisma migrate deploy` errors

**Check:**
```bash
# View migration status
bunx prisma migrate status

# Check database connection
bunx prisma db pull
```

**Fix:**
- Ensure postgres is running and accessible
- Check schema.prisma for syntax errors
- Run `bunx prisma migrate reset` (⚠️ destructive!)

### ❌ Seeding Failed

**Symptoms:** No subscription plans or AI models

**Fix:**
```bash
# Manually run seed
bunx prisma db seed

# Or run seed files individually
bun run backend/prisma/seeds/subscription-plans.seed.ts
bun run backend/prisma/seeds/ai-models.seed.ts
```

### ❌ 502 Bad Gateway

**Symptoms:** nginx returns 502

**Check:**
```bash
# Check if app is running
docker logs lumiku-app

# Check if app is listening on port 80
docker exec lumiku-app netstat -tlnp | grep 80
```

**Fix:**
- Wait for app to fully start (health check)
- Check app logs for startup errors
- Restart app container

### ❌ SSL Certificate Error

**Symptoms:** Browser shows SSL warning

**Fix:**
1. Go to Coolify → Domains
2. Click **Regenerate Certificate**
3. Wait 2-5 minutes
4. Clear browser cache

---

## 📊 Monitoring & Maintenance

### Daily Tasks

**Check Logs:**
```bash
# Application logs
docker logs --tail=100 lumiku-app

# Database logs
docker logs --tail=100 lumiku-postgres

# Redis logs
docker logs --tail=100 lumiku-redis
```

**Monitor Background Jobs:**
```bash
# Check cron job execution
docker logs lumiku-app | grep "Scheduled:"
docker logs lumiku-app | grep "quota reset"
docker logs lumiku-app | grep "expired"
```

### Weekly Tasks

- Review quota usage patterns
- Check subscription renewals
- Monitor AI model usage stats
- Review error logs
- Check database size

### Monthly Tasks

- Backup database (Coolify auto-backup)
- Review and optimize slow queries
- Update dependencies (security patches)
- Analyze user growth and usage trends

---

## 🔄 Updating Production

### For Code Changes:

**Automatic (via webhook):**
```bash
# Locally
git checkout main
git pull origin development
git push origin main

# Coolify auto-deploys!
```

**Manual Deploy:**
1. Go to Coolify dashboard
2. Click **Deploy** button
3. Wait for completion

### For Database Changes:

```bash
# 1. Test migration in development first!
# 2. Create migration locally
bunx prisma migrate dev --name your_migration_name

# 3. Commit and push
git add .
git commit -m "feat: Add new migration"
git push origin main

# 4. After deploy, run migration in production
docker exec -it lumiku-app bunx prisma migrate deploy
```

### For Environment Variable Changes:

1. Go to Coolify → Environment Variables
2. Update values
3. Click **Save**
4. Click **Restart** (required for env changes)

---

## 🚨 Rollback Plan

If deployment fails critically:

### Option 1: Rollback to Previous Git Commit

```bash
# Find last good commit
git log --oneline -10

# Rollback locally
git reset --hard <last-good-commit>
git push origin main --force

# Coolify will auto-deploy old version
```

### Option 2: Use Backup Branch

```bash
# We created backup branch before merge
git checkout main
git reset --hard backup-main-before-merge
git push origin main --force
```

### Option 3: Database Rollback

```bash
# If you have database backup
# Restore from Coolify backup or manual dump
```

---

## 📈 Success Metrics

### Technical Metrics
- ✅ Uptime > 99.5%
- ✅ API response time < 500ms
- ✅ Database query time < 100ms
- ✅ Zero critical errors in logs
- ✅ All background jobs running on schedule

### Business Metrics
- ✅ User registrations increasing
- ✅ Subscription conversions > 5%
- ✅ Payment success rate > 95%
- ✅ Daily active users growing
- ✅ App usage balanced across features

---

## 🎯 Next Steps After Deployment

1. **Monitor First 24 Hours:**
   - Watch logs continuously
   - Check for errors
   - Verify cron jobs run at scheduled times

2. **Test All Features:**
   - Create test user accounts (PAYG + Subscription)
   - Test each app thoroughly
   - Test payment flow with small amount
   - Test quota system (create subscription user)

3. **Setup Monitoring:**
   - Enable Coolify monitoring
   - Setup uptime monitoring (UptimeRobot, etc)
   - Configure error alerts

4. **Backup Strategy:**
   - Enable Coolify auto-backup
   - Test restore procedure
   - Document backup retention policy

5. **User Onboarding:**
   - Prepare welcome emails
   - Create user documentation
   - Setup support channels

---

## 📞 Support & Resources

**Coolify Dashboard:**
```
https://cf.avolut.com
```

**Production Site:**
```
https://app.lumiku.com
```

**GitHub Repository:**
```
https://github.com/yoppiari/superlumiku
```

**Documentation:**
- DUAL_USER_SYSTEM_IMPLEMENTATION.md
- COOLIFY_SETUP_STEP_BY_STEP.md (for dev)
- This file (production)

---

## ✅ Final Checklist

Before announcing production launch:

- [ ] All deployment steps completed
- [ ] Database migrations successful
- [ ] Subscription system working
- [ ] Payment gateway tested (production)
- [ ] SSL certificate valid
- [ ] All apps functional
- [ ] Background jobs running
- [ ] Monitoring setup
- [ ] Backup configured
- [ ] Admin user created
- [ ] Test users created
- [ ] Documentation updated
- [ ] Team trained on new features

---

**Deployment Status:** ✅ READY FOR PRODUCTION

**Last Updated:** 2025-10-10
**Version:** 1.0.0 with Subscription System
**Branch:** main
**Commit:** 4a81b42

---

🎉 **Good luck with your production deployment!** 🚀
