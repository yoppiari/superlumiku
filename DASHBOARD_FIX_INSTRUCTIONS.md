# Dashboard "Page Error" Fix - URGENT

## Issue Summary

**Problem:** Dashboard shows "Page Error" after Sprint 1 deployment

**Root Cause:** Avatar Creator app has no AI models in production database, causing it to be filtered out from `/api/apps`, which breaks the frontend Dashboard.

**Evidence:**
```
Backend logs show:
🏱 Dashboard Apps for user cmgjk16in0000ks01443u0c6x:
  - Accessible apps: 2
  - Apps: Video Mixer, Carousel Mix
```

Avatar Creator is missing!

---

## Solution: Seed Avatar Creator AI Models

### Option 1: Via Coolify Terminal (FASTEST - 2 minutes)

1. **Open Coolify** → Navigate to the Lumiku app
2. **Click "Terminal"** button
3. **Run these commands:**

```bash
# Navigate to backend
cd backend

# Run seed script
bun run prisma db seed

# Restart backend
pm2 restart lumiku-backend
```

4. **Verify fix:**
   - Open https://dev.lumiku.com/dashboard
   - Avatar Creator should now appear
   - No more "Page Error"

---

### Option 2: Via Direct SQL (5 minutes)

If Prisma seed doesn't work, execute the SQL directly:

1. **Get DATABASE_URL** from Coolify environment variables
2. **Connect to database:**
   ```bash
   psql "YOUR_DATABASE_URL"
   ```

3. **Run this SQL:**

```sql
-- Insert Avatar Creator AI Models
INSERT INTO "AIModel" (
  "appId", "modelId", "modelKey", "name", "description",
  "provider", "tier", "creditCost", "creditPerPixel", "quotaCost",
  "capabilities", "enabled", "beta"
) VALUES
  (
    'avatar-creator',
    'flux-dev-standard',
    'avatar-creator:flux-dev-standard',
    'FLUX.1-dev Standard',
    'Text-to-image avatar generation with FLUX.1-dev + Realism LoRA',
    'huggingface',
    'free',
    10,
    NULL,
    1,
    '{"model":"black-forest-labs/FLUX.1-dev","lora":"realism","quality":"standard","resolution":"512x512","guidanceScale":7.5,"processingTime":"~30-60s","photoRealistic":true}',
    true,
    false
  ),
  (
    'avatar-creator',
    'flux-dev-hd',
    'avatar-creator:flux-dev-hd',
    'FLUX.1-dev HD',
    'High resolution avatar generation (1024x1024) with enhanced details',
    'huggingface',
    'basic',
    15,
    NULL,
    2,
    '{"model":"black-forest-labs/FLUX.1-dev","lora":"realism","quality":"hd","resolution":"1024x1024","guidanceScale":7.5,"processingTime":"~45-90s","photoRealistic":true,"enhancedDetails":true}',
    true,
    false
  ),
  (
    'avatar-creator',
    'flux-schnell-fast',
    'avatar-creator:flux-schnell-fast',
    'FLUX.1-schnell Fast',
    'Rapid avatar generation with FLUX.1-schnell (5-10 seconds)',
    'huggingface',
    'pro',
    8,
    NULL,
    1,
    '{"model":"black-forest-labs/FLUX.1-schnell","lora":"realism","quality":"fast","resolution":"512x512","guidanceScale":0,"processingTime":"~5-10s","photoRealistic":true,"fastMode":true}',
    true,
    false
  )
ON CONFLICT ("modelKey") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "enabled" = EXCLUDED."enabled";

-- Verify
SELECT "appId", "modelId", "name", "tier", "creditCost", "enabled"
FROM "AIModel"
WHERE "appId" = 'avatar-creator'
ORDER BY "tier", "creditCost";
```

4. **Restart backend:**
   ```bash
   pm2 restart lumiku-backend
   ```

---

### Option 3: Emergency Rollback (If Fix Takes Too Long)

If we can't fix quickly, rollback to before Sprint 1:

```bash
# Via git
git revert HEAD
git push origin development

# Coolify will auto-deploy the reverted version
```

---

## Verification Steps

After applying the fix:

1. **Check API endpoint:**
   ```bash
   curl https://dev.lumiku.com/api/apps | grep -i avatar
   # Should now include "Avatar Creator"
   ```

2. **Check dashboard:**
   - Navigate to https://dev.lumiku.com/dashboard
   - Should load without errors
   - Avatar Creator tile should appear

3. **Check backend logs:**
   ```bash
   pm2 logs lumiku-backend --lines 50
   # Should show "Accessible apps: 3" (Video Mixer, Carousel Mix, Avatar Creator)
   ```

---

## Why This Happened

Sprint 1 added:
- ✅ Security validation layers
- ✅ File validation utilities
- ✅ Enhanced rate limiting
- ✅ Credit cost validation
- ❌ **MISSED:** Seeding AI models in production

The backend filters out apps with no AI models for security reasons, which is why Avatar Creator disappeared.

---

## Prevention for Future

**Pre-Deployment Checklist:**
- [ ] Run database seeds on production
- [ ] Verify all apps appear in `/api/apps`
- [ ] Test dashboard loads
- [ ] Check all app features work

**Add to CI/CD:**
```yaml
- name: Verify AI Models
  run: |
    psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"AIModel\"" | grep -v "^0$"
```

---

## Timeline

- **Discovery:** Dashboard shows "Page Error"
- **Diagnosis:** 10 minutes - Found Avatar Creator missing from apps list
- **Root Cause:** Avatar Creator has no AI models in production database
- **Fix Created:** SQL seed script ready
- **Execution:** 2-5 minutes depending on method chosen
- **Verification:** 2 minutes
- **Total Time to Fix:** ~15-20 minutes

---

## Files Created

1. `fix-avatar-creator-models.sql` - SQL script to seed models
2. `execute-fix-dashboard.sh` - Bash script to execute fix
3. `DASHBOARD_FIX_INSTRUCTIONS.md` - This document

---

## Ready to Execute

Choose **Option 1** (Prisma seed) for the fastest fix!

Once executed, the dashboard will work immediately (no frontend changes needed).
