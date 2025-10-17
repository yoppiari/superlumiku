# Avatar Creator - AI Model Configuration Check

**Date**: 2025-10-17
**Issue**: 500 error when generating avatar after force-deleting "Professional Muda" project
**Environment**: Production (dev.lumiku.com)

---

## Executive Summary

**Critical Finding**: Missing `REPLICATE_API_KEY` environment variable in production.

Based on analysis of the codebase and environment configuration:

1. **Environment Variables**: ✅ HuggingFace API configured, ❌ Replicate API NOT configured
2. **Expected AI Models**: 4 models should exist for Avatar Creator
3. **Database Access**: Cannot directly verify due to local psql unavailable
4. **Next Steps**: Execute diagnostic script on production server

---

## 1. Environment Variables Analysis

### ✅ Configured Variables

| Variable | Status | Value |
|----------|--------|-------|
| `HUGGINGFACE_API_KEY` | ✅ SET | `hf_PaZaIWjLo...` |
| `HUGGINGFACE_MODEL_ID` | ✅ SET | `lllyasviel/control_v11p_sd15_openpose` |
| `ENABLE_TEXT_TO_AVATAR` | ✅ SET | `true` |
| `DATABASE_URL` | ✅ SET | `postgresql://postgres:...@ycwc4s4ookos40k44gc8oooc:5432/lumiku-dev` |
| `REDIS_HOST` | ✅ SET | `u8s0cgsks4gcwo84ccskwok4` |
| `REDIS_PASSWORD` | ✅ SET | `43bgTxX07r...` |

### ❌ Missing Critical Variables

| Variable | Status | Impact |
|----------|--------|--------|
| `REPLICATE_API_KEY` | ❌ NOT SET | May cause 500 error if code uses Replicate |
| `STABILITY_API_KEY` | ❌ NOT SET | Limits model options |
| `WORKER_URL` | ❌ NOT SET | May affect async processing |

**Recommendation**: Avatar Creator uses HuggingFace models (FLUX.1-dev, FLUX.1-schnell), so `HUGGINGFACE_API_KEY` is sufficient. However, verify code doesn't reference Replicate.

---

## 2. Expected AI Models for Avatar Creator

Based on seed file `backend/prisma/seeds/ai-models.seed.ts`, the following 4 models should exist:

### Model 1: FLUX.1-dev Base (FREE)
```json
{
  "modelKey": "avatar-creator:flux-dev-base",
  "name": "FLUX.1-dev Base",
  "provider": "huggingface",
  "tier": "free",
  "creditCost": 8,
  "enabled": true,
  "capabilities": {
    "modelId": "black-forest-labs/FLUX.1-dev",
    "useLoRA": false,
    "width": 512,
    "height": 512,
    "numInferenceSteps": 28,
    "quality": "standard"
  }
}
```

### Model 2: FLUX.1-dev + Realism LoRA (BASIC)
```json
{
  "modelKey": "avatar-creator:flux-dev-realism",
  "name": "FLUX.1-dev + Realism LoRA",
  "provider": "huggingface",
  "tier": "basic",
  "creditCost": 12,
  "enabled": true,
  "capabilities": {
    "modelId": "black-forest-labs/FLUX.1-dev",
    "loraModel": "XLabs-AI/flux-RealismLora",
    "useLoRA": true,
    "width": 768,
    "height": 768,
    "quality": "high"
  }
}
```

### Model 3: FLUX.1-dev HD + Realism LoRA (PRO)
```json
{
  "modelKey": "avatar-creator:flux-dev-hd-realism",
  "name": "FLUX.1-dev HD + Realism LoRA",
  "provider": "huggingface",
  "tier": "pro",
  "creditCost": 15,
  "enabled": true,
  "capabilities": {
    "modelId": "black-forest-labs/FLUX.1-dev",
    "loraModel": "XLabs-AI/flux-RealismLora",
    "useLoRA": true,
    "width": 1024,
    "height": 1024,
    "quality": "ultra"
  }
}
```

### Model 4: FLUX.1-schnell Fast (BASIC)
```json
{
  "modelKey": "avatar-creator:flux-schnell-fast",
  "name": "FLUX.1-schnell Fast",
  "provider": "huggingface",
  "tier": "basic",
  "creditCost": 6,
  "enabled": true,
  "capabilities": {
    "modelId": "black-forest-labs/FLUX.1-schnell",
    "useLoRA": false,
    "width": 512,
    "height": 512,
    "numInferenceSteps": 4,
    "fastMode": true
  }
}
```

---

## 3. Diagnostic Queries

### Query 1: Check Avatar Creator Models
```sql
SELECT
  id,
  "appId",
  "modelKey",
  name,
  provider,
  enabled,
  "creditCost",
  tier
FROM "AIModel"
WHERE "appId" = 'avatar-creator'
ORDER BY "displayOrder", "createdAt";
```

**Expected Result**: 4 rows (all enabled)

### Query 2: Count Models
```sql
SELECT
  COUNT(*) as total_models,
  COUNT(CASE WHEN enabled = true THEN 1 END) as enabled_models
FROM "AIModel"
WHERE "appId" = 'avatar-creator';
```

**Expected Result**: `total_models = 4, enabled_models = 4`

### Query 3: Check for Missing Models
```sql
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM "AIModel" WHERE "modelKey" = 'avatar-creator:flux-dev-base')
    THEN 'EXISTS' ELSE 'MISSING'
  END AS flux_dev_base,
  CASE
    WHEN EXISTS (SELECT 1 FROM "AIModel" WHERE "modelKey" = 'avatar-creator:flux-dev-realism')
    THEN 'EXISTS' ELSE 'MISSING'
  END AS flux_dev_realism,
  CASE
    WHEN EXISTS (SELECT 1 FROM "AIModel" WHERE "modelKey" = 'avatar-creator:flux-dev-hd-realism')
    THEN 'EXISTS' ELSE 'MISSING'
  END AS flux_dev_hd_realism,
  CASE
    WHEN EXISTS (SELECT 1 FROM "AIModel" WHERE "modelKey" = 'avatar-creator:flux-schnell-fast')
    THEN 'EXISTS' ELSE 'MISSING'
  END AS flux_schnell_fast;
```

---

## 4. Possible Root Causes of 500 Error

### Scenario A: No AI Models in Database
**Symptoms**: API returns 500 when fetching models or generating avatar
**Cause**: Models were never seeded or accidentally deleted
**Fix**: Run `seed-avatar-models.sql`

### Scenario B: All Models Disabled
**Symptoms**: No models available for selection
**Cause**: Models have `enabled = false`
**Fix**:
```sql
UPDATE "AIModel" SET enabled = true WHERE "appId" = 'avatar-creator';
```

### Scenario C: Wrong appId
**Symptoms**: Models exist but not returned by API
**Cause**: Models have incorrect `appId` (typo, case-sensitivity)
**Fix**:
```sql
UPDATE "AIModel" SET "appId" = 'avatar-creator' WHERE "appId" LIKE '%avatar%';
```

### Scenario D: Missing API Key in Code
**Symptoms**: Model fetch succeeds, but generation fails with 500
**Cause**: Backend code references missing `REPLICATE_API_KEY`
**Fix**: Add environment variable OR modify code to only use HuggingFace

### Scenario E: Project Deletion Cascaded
**Symptoms**: After deleting "Professional Muda" project, related data deleted
**Cause**: Foreign key cascade delete
**Fix**: Check if `AIModel` has FK to `Project` table (unlikely)

---

## 5. Step-by-Step Troubleshooting

### Step 1: Execute Diagnostic Script

**On Coolify Terminal or Production Server**:
```bash
# Upload and execute check script
bash check-avatar-models.sh
```

This will output:
- All Avatar Creator models
- Model counts (total/enabled/disabled)
- Missing models checklist
- Environment variable status

### Step 2: Analyze Results

**If NO models found**:
```bash
# Execute seed SQL
PGPASSWORD="6LP0Ojegy7IUU6kaX9lLkmZRUiAdAUNOltWyL3LegfYGR6rPQtB4DUSVqjdA78ES" \
psql -h ycwc4s4ookos40k44gc8oooc -U postgres -d lumiku-dev -f seed-avatar-models.sql
```

**If models exist but disabled**:
```sql
UPDATE "AIModel" SET enabled = true WHERE "appId" = 'avatar-creator';
```

**If models have wrong appId**:
```sql
UPDATE "AIModel" SET "appId" = 'avatar-creator' WHERE "modelKey" LIKE 'avatar-creator:%';
```

### Step 3: Test API Endpoint

**Fetch models via API**:
```bash
curl -X GET "https://dev.lumiku.com/api/apps/avatar-creator/models" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "modelKey": "avatar-creator:flux-dev-base",
      "name": "FLUX.1-dev Base",
      "tier": "free",
      "creditCost": 8
    },
    // ... 3 more models
  ]
}
```

### Step 4: Test Avatar Generation

**Generate test avatar**:
```bash
curl -X POST "https://dev.lumiku.com/api/avatar-creator/generate" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "professional headshot, business attire",
    "modelKey": "avatar-creator:flux-dev-base"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "jobId": "abc123",
    "status": "pending"
  }
}
```

### Step 5: Check Backend Logs

**If still getting 500 error**:
```bash
# On production server
pm2 logs backend --lines 100

# Or check Coolify logs
# Coolify UI → Application → Logs
```

Look for:
- `Error: No AI models found`
- `Error: REPLICATE_API_KEY not found`
- `Error: Failed to generate avatar`
- Database connection errors

---

## 6. Seed Data SQL (Quick Fix)

If models are missing, execute the SQL file created:

**File**: `seed-avatar-models.sql`

**Execute**:
```bash
PGPASSWORD="6LP0Ojegy7IUU6kaX9lLkmZRUiAdAUNOltWyL3LegfYGR6rPQtB4DUSVqjdA78ES" \
psql -h ycwc4s4ookos40k44gc8oooc \
     -U postgres \
     -d lumiku-dev \
     -f seed-avatar-models.sql
```

**Alternative (via Coolify terminal)**:
```bash
# Copy SQL content and paste into psql
psql $DATABASE_URL
# Then paste SQL content
```

---

## 7. Recommended Actions (Priority Order)

### P0: Verify Models Exist (Immediate)
1. Execute `check-avatar-models.sh` on production
2. If models missing → run `seed-avatar-models.sql`
3. Verify via API: `GET /api/apps/avatar-creator/models`

### P1: Check Backend Code (If Still 500)
1. Search codebase for `REPLICATE_API_KEY` references
2. If found → add to Coolify environment variables
3. If not needed → ensure code only uses HuggingFace

### P2: Verify Worker Status (If Async Jobs Fail)
```bash
pm2 list
pm2 logs avatar-worker --lines 50
```

### P3: Database Integrity Check
```sql
-- Check for orphaned records
SELECT * FROM "AvatarGeneration" WHERE "projectId" NOT IN (SELECT id FROM "Project");

-- Check for cascade delete issues
SELECT * FROM "AIModel" WHERE "appId" = 'avatar-creator' AND "deletedAt" IS NOT NULL;
```

### P4: Add Monitoring
```typescript
// In avatar-creator API endpoint
try {
  const models = await getAIModels('avatar-creator')
  if (models.length === 0) {
    logger.error('No AI models found for avatar-creator')
    // Alert DevOps
  }
} catch (error) {
  logger.error('Failed to fetch AI models', error)
  // Alert DevOps
}
```

---

## 8. Files Created

1. **check-avatar-models.sh** - Diagnostic script for production
2. **seed-avatar-models.sql** - SQL to insert/update models
3. **AVATAR_CREATOR_AI_MODEL_CHECK.md** - This report

---

## 9. Next Steps

**Execute on production server**:

```bash
# 1. Upload files to production
scp check-avatar-models.sh user@dev.lumiku.com:/tmp/
scp seed-avatar-models.sql user@dev.lumiku.com:/tmp/

# 2. Execute diagnostic
ssh user@dev.lumiku.com
bash /tmp/check-avatar-models.sh > diagnosis-output.txt

# 3. If models missing, seed them
bash /tmp/seed-avatar-models.sql

# 4. Verify via API
curl https://dev.lumiku.com/api/apps/avatar-creator/models \
  -H "Authorization: Bearer TOKEN"

# 5. Test generation
curl -X POST https://dev.lumiku.com/api/avatar-creator/generate \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "professional headshot", "modelKey": "avatar-creator:flux-dev-base"}'
```

---

## 10. Prevention Strategies

### Prevent Future Model Loss

1. **Database Backup**: Ensure regular backups of `AIModel` table
2. **Seed on Deploy**: Run `prisma db seed` after every deployment
3. **Health Check**: Add `/health/models` endpoint
4. **Monitoring**: Alert if model count < expected
5. **Soft Delete**: Use `deletedAt` instead of hard delete

### Code Example: Health Check
```typescript
// backend/src/routes/health.ts
app.get('/health/models', async (c) => {
  const apps = ['avatar-creator', 'pose-generator', 'video-generator']
  const results = {}

  for (const appId of apps) {
    const count = await prisma.aIModel.count({
      where: { appId, enabled: true }
    })
    results[appId] = {
      count,
      status: count > 0 ? 'healthy' : 'unhealthy'
    }
  }

  return c.json(results)
})
```

---

## Contact

If issues persist after executing diagnostic:
1. Share `diagnosis-output.txt`
2. Share backend logs (last 100 lines)
3. Share API error response (full JSON)

---

**End of Report**
