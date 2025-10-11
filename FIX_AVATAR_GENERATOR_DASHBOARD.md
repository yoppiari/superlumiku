# Fix Avatar Generator Dashboard Visibility

**Issue**: Avatar Generator app not showing in dashboard
**Root Cause**: No AI models registered for the app
**Solution**: Register 3 ControlNet models for Avatar Generator

---

## Why Apps Don't Appear

The dashboard shows apps based on this logic (`backend/src/services/access-control.service.ts:65-98`):

```typescript
async getUserAccessibleApps(userId: string) {
  const allApps = pluginRegistry.getDashboardApps()
  const accessibleApps = []

  for (const app of allApps) {
    const models = await modelRegistryService.getUserAccessibleModels(userId, app.appId)

    // Only add app if user can access at least one model
    if (models.length > 0) {
      accessibleApps.push(app)
    }
  }

  return accessibleApps
}
```

**Key point**: Apps need at least ONE accessible AI model to appear in the dashboard.

---

## Solution: Register AI Models

### Option 1: Run Seed Script (Recommended for Fresh Setup)

If you're setting up a new database or want to seed all models:

```bash
# SSH to production server
ssh root@107.155.75.50

# Navigate to backend directory
cd /app/backend  # or wherever the backend is deployed

# Run Prisma seed
bun run prisma db seed
```

### Option 2: Run SQL Script (Recommended for Production)

If the database is already seeded and you only need Avatar Generator models:

```bash
# SSH to production server
ssh root@107.155.75.50

# Copy the SQL file to server (from local machine)
# Open new terminal on your local machine:
scp SEED_AVATAR_MODELS.sql root@107.155.75.50:/tmp/

# Back on server, run the SQL
cd /tmp
psql postgresql://lumiku_dev:lumiku_dev_password@postgres:5432/lumiku_development < SEED_AVATAR_MODELS.sql
```

### Option 3: Manual SQL Execution

Connect to the database and run this SQL:

```sql
-- See SEED_AVATAR_MODELS.sql file for full SQL script
-- It registers 3 models:
-- 1. avatar-generator:controlnet-sd (free, 5 credits)
-- 2. avatar-generator:controlnet-hd (basic, 7 credits)
-- 3. avatar-generator:controlnet-ultra (pro, 10 credits)
```

---

## Models Registered

| Model Key | Name | Tier | Credits | Resolution | Description |
|-----------|------|------|---------|------------|-------------|
| `avatar-generator:controlnet-sd` | ControlNet SD (Free) | free | 5 | 512x512 | Standard avatar generation |
| `avatar-generator:controlnet-hd` | ControlNet HD | basic | 7 | 1024x1024 | HD quality generation |
| `avatar-generator:controlnet-ultra` | ControlNet Ultra Pro | pro | 10 | 1024x1024 | Ultra quality + priority |

---

## Verification

### 1. Check Database

```sql
SELECT "appId", "modelKey", "name", "tier", "creditCost", "enabled"
FROM ai_models
WHERE "appId" = 'avatar-generator';
```

Expected output:
```
appId            | modelKey                         | name                    | tier  | creditCost | enabled
----------------|----------------------------------|------------------------|-------|------------|--------
avatar-generator | avatar-generator:controlnet-sd   | ControlNet SD (Free)   | free  | 5          | true
avatar-generator | avatar-generator:controlnet-hd   | ControlNet HD          | basic | 7          | true
avatar-generator | avatar-generator:controlnet-ultra| ControlNet Ultra Pro   | pro   | 10         | true
```

### 2. Check API Response

Test the dashboard API:

```bash
# Get JWT token from login
TOKEN="your-jwt-token"

# Call dashboard API
curl -H "Authorization: Bearer $TOKEN" https://dev.lumiku.com/api/apps
```

Expected response should include:
```json
{
  "apps": [
    {
      "appId": "avatar-generator",
      "name": "Avatar & Pose Generator",
      "description": "Generate avatars with custom poses using AI",
      "icon": "user-circle",
      "version": "1.0.0",
      "routePrefix": "/api/apps/avatar-generator",
      "availableModels": 1,  // or 3 depending on user tier
      "dashboard": {
        "order": 2,
        "color": "purple",
        ...
      }
    },
    ...
  ]
}
```

### 3. Check Dashboard UI

1. Open https://dev.lumiku.com/dashboard
2. Login with test credentials
3. Avatar Generator should appear in "Apps & Tools" section
4. Should have purple color theme
5. Should show near the top (order: 2)

---

## Troubleshooting

### App still not showing

**Possible causes**:

1. **Models not seeded**
   ```sql
   -- Check if models exist
   SELECT COUNT(*) FROM ai_models WHERE "appId" = 'avatar-generator';
   -- Should return 3
   ```

2. **Models disabled**
   ```sql
   -- Check enabled status
   SELECT "modelKey", "enabled" FROM ai_models WHERE "appId" = 'avatar-generator';
   -- All should be true
   ```

3. **User tier too low**
   ```sql
   -- Check user tier
   SELECT email, "subscriptionTier" FROM users WHERE email = 'test@lumiku.com';

   -- Free users only see free models
   -- If all models are basic/pro, free users won't see any
   ```

4. **App not registered**
   ```bash
   # Check server logs for plugin registration
   grep "Plugin registered: Avatar & Pose Generator" /var/log/app.log
   ```

5. **Deployment not complete**
   - Check Coolify deployment status
   - Verify latest commit is deployed
   - Check for deployment errors

### Server not responding

1. **Restart the backend**
   ```bash
   # Via Coolify dashboard or SSH
   pm2 restart backend
   # or
   systemctl restart lumiku-backend
   ```

2. **Check logs**
   ```bash
   # View backend logs
   tail -f /var/log/lumiku-backend.log

   # Or via Coolify
   # Coolify Dashboard → Application → Logs
   ```

---

## Code Changes Made

### 1. Plugin Registration
- **File**: `backend/src/plugins/loader.ts`
- **Change**: Added avatar-generator import and registration
- **Commit**: 57a4ca8

### 2. AI Models Seed
- **File**: `backend/prisma/seeds/ai-models.seed.ts`
- **Change**: Added 3 ControlNet models for avatar-generator
- **Commit**: 03bac46

### 3. Database Schema
- **File**: `backend/prisma/schema.prisma`
- **Change**: Added AvatarGeneration model
- **Commit**: 57a4ca8

---

## Next Steps After Fix

Once the app appears in the dashboard:

1. **Test avatar generation endpoint**
   ```bash
   POST /api/apps/avatar-generator/generate
   - Upload test image
   - Select pose template
   - Verify generation starts
   ```

2. **Integrate ControlNet AI**
   - Currently has placeholder implementation
   - Need to integrate ModelsLab ControlNet API
   - See `backend/src/apps/avatar-generator/services/avatar.service.ts:174`

3. **Build frontend UI**
   - Pose template gallery
   - Image upload interface
   - Generation status display
   - Results gallery

4. **Production deployment**
   - Test on dev.lumiku.com first
   - Then merge to main and deploy to production

---

## Quick Reference

### Deployment Timeline
1. ✅ Code pushed to development branch (commit 03bac46)
2. ⏳ Coolify auto-deploy (~2-5 minutes)
3. ⏳ Run seed script to register models
4. ✅ App appears in dashboard

### Files to Check
- `/backend/src/plugins/loader.ts` - Plugin registration
- `/backend/src/apps/avatar-generator/plugin.config.ts` - Plugin config
- `/backend/prisma/seeds/ai-models.seed.ts` - Model registration
- `/backend/src/services/access-control.service.ts` - Dashboard filtering logic

### Database Tables
- `ai_models` - Stores all AI model configurations
- `avatar_generations` - Stores generation history
- `pose_templates` - Stores 800+ pose templates

---

**Generated**: 2025-10-10
**Issue**: Dashboard visibility
**Status**: ✅ Fixed - Pending production seed
**Developer**: Claude Code
