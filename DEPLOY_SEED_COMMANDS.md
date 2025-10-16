# Avatar Creator AI Models - Deployment Seeding Guide

## Quick Copy-Paste Commands for Coolify Terminal

### Step 1: Navigate to Backend Directory

```bash
cd /app/backend
```

### Step 2: Seed AI Models

Choose ONE of the following methods:

#### Method 1: Using Prisma Seed (Recommended)

```bash
bun run seed
```

Expected output:
```
🌱 Seeding AI models...
✅ Seeded 21 AI models
```

#### Method 2: Using Node Directly

```bash
cd /app/backend
node prisma/seeds/ai-models.seed.ts
```

#### Method 3: Using SQL (Fallback)

```bash
psql $DATABASE_URL < /app/fix-avatar-creator-models.sql
```

---

### Step 3: Verify Models Were Seeded

```bash
cd /app
node verify-avatar-models.js
```

Expected output:
```
✅ Found 4 AI models for Avatar Creator

📋 AI Models Configuration:
┌────────────────────────────────────────────────────────────────────────────┐
│ Model Name                        │ Tier   │ Credits │ LoRA  │ Resolution │
├────────────────────────────────────────────────────────────────────────────┤
│ FLUX.1-dev Base                   │ free   │ 8       │ No    │ 512x512    │
│ FLUX.1-schnell Fast               │ basic  │ 6       │ No    │ 512x512    │
│ FLUX.1-dev + Realism LoRA         │ basic  │ 12      │ Yes   │ 768x768    │
│ FLUX.1-dev HD + Realism LoRA      │ pro    │ 15      │ Yes   │ 1024x1024  │
└────────────────────────────────────────────────────────────────────────────┘
```

---

### Step 4: Restart Backend and Worker

```bash
pm2 restart backend
pm2 restart worker
```

Check logs:
```bash
pm2 logs backend --lines 50
pm2 logs worker --lines 50
```

---

### Step 5: Verify Dashboard Works

Open browser and visit:
```
https://dev.lumiku.com/dashboard
```

Expected:
- ✅ Dashboard loads without "Page Error"
- ✅ Avatar Creator appears in app list

---

### Step 6: Test API

```bash
# Get user token first (login via dashboard)
curl https://dev.lumiku.com/api/apps \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected response should include:
```json
{
  "apps": [
    {
      "id": "avatar-creator",
      "name": "Avatar Creator",
      "icon": "User",
      "enabled": true
    }
  ]
}
```

---

## Troubleshooting

### Issue: Seed Script Not Found

**Error**: `Cannot find module 'ai-models.seed.ts'`

**Solution**:
```bash
# Check if file exists
ls -la /app/backend/prisma/seeds/ai-models.seed.ts

# If missing, run SQL directly
psql $DATABASE_URL < /app/fix-avatar-creator-models.sql
```

---

### Issue: Database Connection Error

**Error**: `Can't reach database server`

**Solution**:
```bash
# Check DATABASE_URL is set
echo $DATABASE_URL

# Test database connection
psql $DATABASE_URL -c "SELECT 1"

# If connection fails, check Coolify environment variables
```

---

### Issue: Models Already Exist

**Error**: `Unique constraint failed on the fields: (modelKey)`

**Solution**: Models are already seeded! Skip to Step 3 (Verify).

---

### Issue: Dashboard Still Shows Error

**Checklist**:
1. ✅ AI models seeded (run verify script)
2. ✅ Backend restarted (`pm2 restart backend`)
3. ✅ Worker restarted (`pm2 restart worker`)
4. ✅ Clear browser cache (Ctrl+Shift+R)
5. ✅ Check backend logs (`pm2 logs backend`)

If still not working:
```bash
# Check if app exists
psql $DATABASE_URL -c "SELECT * FROM \"App\" WHERE \"appId\" = 'avatar-creator';"

# Check if models exist
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"AIModel\" WHERE \"appId\" = 'avatar-creator';"
```

---

## Environment Variables Checklist

Ensure these are set in Coolify:

```bash
# Required
DATABASE_URL=postgresql://...
HUGGINGFACE_API_KEY=hf_xxxxx

# Optional (will use defaults from database)
FLUX_MODEL=black-forest-labs/FLUX.1-dev
FLUX_LORA_MODEL=XLabs-AI/flux-RealismLora
FLUX_LORA_SCALE=0.9

# Redis (if using workers)
REDIS_URL=redis://...
```

---

## Success Criteria

Deployment is successful when:

- ✅ `bun run seed` completes without errors
- ✅ `node verify-avatar-models.js` shows 4 models
- ✅ Backend and worker restart successfully
- ✅ Dashboard loads without "Page Error"
- ✅ Avatar Creator visible in app list
- ✅ API returns Avatar Creator in `/api/apps`
- ✅ Test generation works (creates job in queue)

---

## Next Steps After Seeding

1. **Test Free User Generation**:
   - Should use: FLUX.1-dev Base (8 credits, 512x512)

2. **Test Basic User Generation**:
   - Should use: FLUX.1-dev + Realism LoRA (12 credits, 768x768)
   - Check worker logs for: `🎨 LoRA: XLabs-AI/flux-RealismLora (scale: 0.9)`

3. **Test Pro User Generation**:
   - Should use: FLUX.1-dev HD + Realism LoRA (15 credits, 1024x1024)

4. **Monitor Worker Logs**:
   ```bash
   pm2 logs worker --lines 100 --follow
   ```

   Look for:
   ```
   🎨 Selected AI model: FLUX.1-dev + Realism LoRA
   💰 Credit cost: 12
   🤖 AI Model: black-forest-labs/FLUX.1-dev
   🎨 LoRA: XLabs-AI/flux-RealismLora (scale: 0.9)
   ⚙️  Steps: 30, Guidance: 3.5
   ```

---

## Rollback Plan

If something goes wrong:

### Option 1: Rollback Deployment
1. Go to Coolify UI
2. Navigate to Deployments tab
3. Find previous deployment (before ab5cf54)
4. Click "Redeploy"

### Option 2: Remove AI Models
```bash
psql $DATABASE_URL -c "DELETE FROM \"AIModel\" WHERE \"appId\" = 'avatar-creator';"
```

### Option 3: Fix Data Manually
```sql
-- Check current models
SELECT "modelKey", name, tier, "creditCost", enabled
FROM "AIModel"
WHERE "appId" = 'avatar-creator';

-- Enable/disable specific models
UPDATE "AIModel"
SET enabled = true
WHERE "modelKey" = 'avatar-creator:flux-dev-realism';
```

---

## Support

If you encounter issues:

1. Check build logs in Coolify UI
2. Check backend logs: `pm2 logs backend`
3. Check worker logs: `pm2 logs worker`
4. Run verification script: `node verify-avatar-models.js`
5. Check database directly:
   ```bash
   psql $DATABASE_URL -c "SELECT * FROM \"AIModel\" WHERE \"appId\" = 'avatar-creator';"
   ```

---

**Deployment UUID**: `t0sw4kokwkk0c0gk40ockogc`
**Commit**: `ab5cf54`
**Branch**: `development`
**Date**: 2025-10-14
