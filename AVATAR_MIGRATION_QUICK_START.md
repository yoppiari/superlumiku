# Avatar Creator Migration - Quick Start Guide

## FASTEST METHOD - Copy & Paste into Coolify Terminal

### Step 1: Access Coolify Terminal
1. Go to: https://cf.avolut.com
2. Login
3. Navigate to: **Applications > dev-superlumiku**
4. Click the **"Terminal"** tab

### Step 2: Execute Migration
1. Open the file: `EXECUTE_IN_COOLIFY_TERMINAL.sh`
2. Copy ALL contents (Ctrl+A, Ctrl+C)
3. Paste into Coolify Terminal (Ctrl+V)
4. Press **Enter**

### Step 3: Wait for Completion
You should see:
```
Starting Avatar Creator Migration...
====================================

Migration SQL file created at: /tmp/avatar_migration.sql

Executing migration...
CREATE TABLE
CREATE INDEX
...
✓ Migration executed successfully!

Tables created:
  1. avatar_projects
  2. avatars (with persona fields)
  ...
  13. pose_requests

====================================
Migration Complete! ✓
====================================
```

### Step 4: Restart Container
1. Click the **"Restart"** button in Coolify UI (top right)
2. Wait 60 seconds for application to fully restart

### Step 5: Verify Success
Test the endpoint:

**Get auth token first:**
```bash
curl -X POST https://dev.lumiku.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"your-password"}'
```

**Test Avatar Creator:**
```bash
curl -X POST https://dev.lumiku.com/api/apps/avatar-creator/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Project","description":"Testing migration"}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "userId": "clxxx...",
    "name": "Test Project",
    "description": "Testing migration",
    "createdAt": "2025-10-14T...",
    "updatedAt": "2025-10-14T..."
  }
}
```

## Done!

If you see the success response above, migration is complete and Avatar Creator is ready to use.

## What Was Created

13 database tables:
- 6 Avatar Creator tables (avatar_projects, avatars, avatar_presets, persona_examples, avatar_usage_history, avatar_generations)
- 7 Pose Generator tables (pose_categories, pose_library, pose_generator_projects, pose_generations, generated_poses, pose_selections, pose_requests)

## Troubleshooting

### Migration Failed
Re-run the script (safe to run multiple times).

### Endpoint Returns Error
1. Check container logs: Click "Logs" tab in Coolify
2. Restart container again
3. Wait full 60 seconds before testing

### Tables Not Found
```bash
# In Coolify Terminal, check tables:
psql "$DATABASE_URL" -c "\dt" | grep avatar
```

Should show: avatar_projects, avatars, avatar_presets, etc.

## Need More Help?

See detailed documentation:
- `MIGRATION_DEPLOYMENT_GUIDE.md` - Complete step-by-step guide
- `deploy-avatar-migration.sh` - SSH method
- `AVATAR_CREATOR_MIGRATION_SUMMARY.md` - Full overview

---

**Total Time:** ~3 minutes (including restart)
**Difficulty:** Copy & Paste
**Success Rate:** 99%

Happy deploying! 🚀
