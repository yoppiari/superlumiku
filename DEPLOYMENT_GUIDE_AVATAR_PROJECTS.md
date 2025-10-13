# Avatar Creator - Project System Deployment Guide

## 🎯 Overview
Deploy Avatar Creator refactor dari flat system → project-based system.

---

## ✅ Pre-Deployment Checklist

### Backend
- [x] Database schema updated (AvatarProject model)
- [x] Services created (avatar-project.service.ts)
- [x] Routes updated (project endpoints)
- [x] Migration script ready

### Frontend
- [x] Store created (avatarCreatorStore.ts)
- [x] Component refactored (AvatarCreator.tsx)
- [x] Routing updated (App.tsx)

---

## 🚀 Deployment Steps

### Step 1: Push Code to Production Server

```bash
# Commit all changes
git add .
git commit -m "feat: Avatar Creator project-based system"

# Push to server
git push origin development  # or main/master
```

### Step 2: Deploy Backend

```bash
# SSH to production server
ssh user@your-server

# Pull latest code
cd /path/to/backend
git pull

# Install dependencies (if needed)
bun install

# Generate Prisma Client with new schema
bunx prisma generate

# Create migration (DON'T run migrate dev in production!)
# Instead, we'll apply schema changes manually
```

### Step 3: Apply Database Schema Changes

**Option A: Using Prisma Migrate (Recommended)**

```bash
# Create migration
bunx prisma migrate deploy
```

**Option B: Manual SQL (if Prisma migrate unavailable)**

Run this SQL in your production database:

```sql
-- 1. Create avatar_projects table
CREATE TABLE IF NOT EXISTS "avatar_projects" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create index
CREATE INDEX IF NOT EXISTS "idx_avatar_projects_user_id" ON "avatar_projects"("user_id");

-- 3. Add projectId column to avatars (nullable for now)
ALTER TABLE "avatars" ADD COLUMN IF NOT EXISTS "project_id" TEXT;

-- 4. Create index for projectId
CREATE INDEX IF NOT EXISTS "idx_avatars_project_id" ON "avatars"("project_id");
```

### Step 4: Run Migration Script

This script migrates existing avatars to default projects:

```bash
# Still in backend directory
cd /path/to/backend

# Run migration script
bun run scripts/migrate-avatars-to-projects.ts
```

Expected output:
```
🚀 Starting avatar migration to project system...

📊 Found 5 users with avatars to migrate

👤 Processing user: user_abc123 (3 avatars)
   ✓ Created project: proj_xyz789
   ✓ Migrated 3 avatars to project

👤 Processing user: user_def456 (7 avatars)
   ✓ Created project: proj_uvw012
   ✓ Migrated 7 avatars to project

============================================================
📋 Migration Summary
============================================================
✅ Successfully migrated: 45 avatars
❌ Errors: 0
============================================================

✨ Perfect! All avatars have been migrated.
   You can now safely make projectId required in the schema.

🎉 Migration completed!
```

### Step 5: Make projectId Required (After Verifying Migration)

```sql
-- Only run this AFTER confirming all avatars have projectId

-- Add NOT NULL constraint
ALTER TABLE "avatars" ALTER COLUMN "project_id" SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE "avatars"
ADD CONSTRAINT "fk_avatars_project"
FOREIGN KEY ("project_id")
REFERENCES "avatar_projects"("id")
ON DELETE CASCADE;
```

### Step 6: Restart Backend

```bash
# Restart backend service
pm2 restart lumiku-backend
# or
systemctl restart lumiku-backend
# or whatever process manager you use
```

### Step 7: Deploy Frontend

```bash
# Build frontend
cd /path/to/frontend
bun install  # if needed
bun run build

# Deploy built files to web server
# (depends on your deployment setup - Netlify, Vercel, etc.)
```

---

## ✨ Verification Steps

### 1. Check Database

```sql
-- Verify all avatars have projectId
SELECT COUNT(*) FROM avatars WHERE project_id IS NULL;
-- Should return 0

-- Check projects created
SELECT
  ap.id,
  ap.name,
  COUNT(a.id) as avatar_count
FROM avatar_projects ap
LEFT JOIN avatars a ON a.project_id = ap.id
GROUP BY ap.id, ap.name
ORDER BY ap.created_at DESC;
```

### 2. Test Frontend

1. **Projects List View**
   - Visit `/apps/avatar-creator`
   - Should see list of projects
   - Can create new project

2. **Project Detail View**
   - Click a project
   - Should see avatars in that project
   - Can upload new avatar
   - Can generate AI avatar
   - Can delete avatar
   - Back button works

3. **Integration with Pose Generator**
   - Click "Generate Poses" on avatar
   - Should navigate to Pose Generator
   - Avatar should be selectable

### 3. Test Backend API

```bash
# Get projects
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-api.com/api/apps/avatar-creator/projects

# Get project detail
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-api.com/api/apps/avatar-creator/projects/PROJECT_ID

# Upload avatar (test with Postman or similar)
# Generate AI avatar (test with Postman or similar)
```

---

## 🔄 Rollback Plan (If Something Goes Wrong)

### Quick Rollback

```bash
# 1. Revert code
git revert HEAD
git push

# 2. Restart services
pm2 restart all

# 3. Database rollback
# Drop new table and column
DROP TABLE IF EXISTS "avatar_projects";
ALTER TABLE "avatars" DROP COLUMN IF EXISTS "project_id";
```

### Partial Rollback (Keep Data)

If migration ran but frontend has issues, you can keep the backend changes and just revert frontend:

```bash
# Only revert frontend
cd frontend
git revert HEAD~1  # or specific commit
git push
bun run build
# Deploy
```

Backend will continue working because we kept legacy routes:
- `GET /api/apps/avatar-creator/avatars` (all avatars)
- `GET /api/apps/avatar-creator/stats` (all stats)

---

## 📊 Monitoring

### After Deployment, Monitor:

1. **Error Logs**
   ```bash
   tail -f /var/log/lumiku-backend/error.log
   pm2 logs lumiku-backend
   ```

2. **Database Performance**
   ```sql
   -- Check query performance
   EXPLAIN ANALYZE
   SELECT * FROM avatars WHERE project_id = 'proj_xyz';
   ```

3. **User Feedback**
   - Check support tickets
   - Monitor error tracking (Sentry, etc.)

---

## 🎉 Success Criteria

- [ ] All existing avatars migrated to projects (0 orphans)
- [ ] Users can see their projects
- [ ] Users can create new projects
- [ ] Users can upload avatars to projects
- [ ] Users can generate AI avatars in projects
- [ ] Users can delete avatars and projects
- [ ] Integration with Pose Generator still works
- [ ] No 500 errors in backend logs
- [ ] No console errors in frontend

---

## 📞 Support

If issues arise during deployment:

1. Check this guide first
2. Review error logs
3. Check `AVATAR_CREATOR_IMPLEMENTATION_COMPLETE.md` for details
4. Use rollback plan if needed
5. Contact dev team

---

## 📝 Post-Deployment Tasks

- [ ] Update documentation
- [ ] Notify users of new feature (if applicable)
- [ ] Monitor for 48 hours
- [ ] Clean up old code (after confirming stable)
- [ ] Archive old screenshots/videos

---

**Deployment Date:** ___________
**Deployed By:** ___________
**Status:** ___________
**Issues Encountered:** ___________
