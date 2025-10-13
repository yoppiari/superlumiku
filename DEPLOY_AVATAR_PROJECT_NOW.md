# 🚀 Deploy Avatar Creator Project System - COPAS INI

## ✅ Step 1: Code Pushed ✅
Code sudah di-push ke GitHub: commit `93e6702`

---

## 📋 Step 2: Deploy via Coolify

### A. Cara Otomatis (Coolify Auto-Deploy)

Jika Coolify sudah auto-deploy dari GitHub:
1. Buka Coolify dashboard
2. Cek deployment logs backend & frontend
3. Tunggu sampai selesai
4. Lanjut ke **Step 3: Run Migration**

### B. Cara Manual (Pull Latest Code)

Jika perlu deploy manual, SSH ke server dan jalankan:

```bash
# === BACKEND DEPLOYMENT ===

# 1. Go to backend directory di Coolify
cd /your-coolify-path/backend

# 2. Pull latest code
git pull origin development

# 3. Install dependencies (if needed)
bun install

# 4. Generate Prisma Client (WAJIB!)
bunx prisma generate

# 5. Restart backend via Coolify atau PM2
# Via Coolify: restart service dari dashboard
# Via PM2 (jika pakai):
pm2 restart lumiku-backend


# === FRONTEND DEPLOYMENT ===

# 1. Go to frontend directory
cd /your-coolify-path/frontend

# 2. Pull latest code
git pull origin development

# 3. Install dependencies (if needed)
bun install

# 4. Build frontend
bun run build

# 5. Restart/redeploy frontend via Coolify
# Via Coolify: restart service dari dashboard
```

---

## 📊 Step 3: Apply Database Schema Changes

### Option A: Prisma Migrate (Recommended)

```bash
cd /your-coolify-path/backend

# Run migration
bunx prisma migrate deploy
```

### Option B: Manual SQL (if Prisma unavailable)

Buka database PostgreSQL di Coolify dan run SQL ini:

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

-- 5. Verify schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'avatars' AND column_name = 'project_id';

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'avatar_projects';
```

Expected output:
```
avatars.project_id: TEXT, YES (nullable)
avatar_projects: 6 columns (id, user_id, name, description, created_at, updated_at)
```

---

## 🔄 Step 4: Run Migration Script

**WAJIB RUN!** Ini akan auto-create default project untuk semua user existing.

```bash
cd /your-coolify-path/backend

# Run migration script
bun run scripts/migrate-avatars-to-projects.ts
```

Expected output:
```
🚀 Starting avatar migration to project system...

📊 Found X users with avatars to migrate

👤 Processing user: user_xxx (Y avatars)
   ✓ Created project: proj_xxx
   ✓ Migrated Y avatars to project

============================================================
📋 Migration Summary
============================================================
✅ Successfully migrated: N avatars
❌ Errors: 0
============================================================

✨ Perfect! All avatars have been migrated.
   You can now safely make projectId required in the schema.

🎉 Migration completed!
```

**JIKA ERROR:**
- Check database connection di `.env`
- Check apakah schema sudah di-apply (Step 3)
- Check logs untuk detail error

---

## 🔒 Step 5: Make projectId Required (After Migration Success)

**HANYA RUN JIKA STEP 4 BERHASIL 100%!**

Buka database PostgreSQL dan run:

```sql
-- 1. Verify NO avatars with null projectId
SELECT COUNT(*) FROM avatars WHERE project_id IS NULL;
-- HARUS return 0!

-- 2. Make projectId NOT NULL
ALTER TABLE "avatars" ALTER COLUMN "project_id" SET NOT NULL;

-- 3. Add foreign key constraint
ALTER TABLE "avatars"
ADD CONSTRAINT "fk_avatars_project"
FOREIGN KEY ("project_id")
REFERENCES "avatar_projects"("id")
ON DELETE CASCADE;

-- 4. Verify constraints
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'avatars' AND kcu.column_name = 'project_id';
```

Expected output:
```
COUNT = 0 (no null projectId)
fk_avatars_project: FOREIGN KEY project_id -> avatar_projects.id
```

---

## ✅ Step 6: Verification

### A. Check Database

```sql
-- 1. Check projects created
SELECT
  ap.id,
  ap.name,
  ap.user_id,
  COUNT(a.id) as avatar_count,
  ap.created_at
FROM avatar_projects ap
LEFT JOIN avatars a ON a.project_id = ap.id
GROUP BY ap.id, ap.name, ap.user_id, ap.created_at
ORDER BY ap.created_at DESC
LIMIT 10;

-- 2. Check no orphaned avatars
SELECT COUNT(*) FROM avatars WHERE project_id IS NULL;
-- Should be 0

-- 3. Check total
SELECT
  (SELECT COUNT(*) FROM avatar_projects) as total_projects,
  (SELECT COUNT(*) FROM avatars) as total_avatars;
```

### B. Test Backend API

```bash
# Replace YOUR_TOKEN and YOUR_API_URL

# 1. Get all projects
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://YOUR_API_URL/api/apps/avatar-creator/projects

# Should return: { projects: [...] }

# 2. Get project detail
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://YOUR_API_URL/api/apps/avatar-creator/projects/PROJECT_ID

# Should return: { project: { id, name, avatars: [...] } }
```

### C. Test Frontend

1. Open browser: `https://cf.avolut.com` (atau domain Anda)
2. Login
3. Go to Dashboard → Avatar Creator
4. **Expected:**
   - ✅ Shows list of projects (not flat avatar list)
   - ✅ Each project shows avatar count
   - ✅ Can click project to see detail
   - ✅ In project detail: Upload & Generate AI buttons visible
   - ✅ Back button works
   - ✅ Can upload new avatar
   - ✅ Can generate AI avatar
   - ✅ Can delete avatar
   - ✅ Can delete project
   - ✅ Integration with Pose Generator works (click "Generate Poses")

---

## ❌ Rollback Plan (If Error)

### Quick Rollback

```bash
# 1. Revert code
cd /your-coolify-path/backend
git reset --hard 1aee0ec  # commit before Avatar Project changes
cd /your-coolify-path/frontend
git reset --hard 1aee0ec

# 2. Restart services via Coolify

# 3. Drop new table and column (OPTIONAL - if you want clean rollback)
# Buka database dan run:
DROP TABLE IF EXISTS "avatar_projects" CASCADE;
ALTER TABLE "avatars" DROP COLUMN IF EXISTS "project_id";
```

### Partial Rollback (Keep Backend, Revert Frontend Only)

If migration ran successfully but frontend has bugs:

```bash
# Only revert frontend
cd /your-coolify-path/frontend
git reset --hard 1aee0ec
bun run build
# Restart frontend

# Backend tetap jalan karena legacy routes masih ada:
# GET /api/apps/avatar-creator/avatars (all avatars)
# GET /api/apps/avatar-creator/stats (all stats)
```

---

## 📋 Checklist

- [ ] Code pushed to GitHub ✅ (sudah done!)
- [ ] Backend deployed (pull + install + generate Prisma)
- [ ] Frontend deployed (pull + install + build)
- [ ] Database schema applied (avatar_projects table + project_id column)
- [ ] Migration script ran successfully (all avatars have projectId)
- [ ] projectId made required + foreign key added
- [ ] Backend restarted
- [ ] Frontend restarted
- [ ] Database verified (no null projectId, all projects exist)
- [ ] Backend API tested (GET /projects works)
- [ ] Frontend tested (projects list shows, project detail works)
- [ ] Integration tested (Pose Generator still works)

---

## 🎉 Success Criteria

All must be ✅:
- [ ] No 500 errors in backend logs
- [ ] No console errors in frontend
- [ ] All existing avatars migrated to projects (0 orphans)
- [ ] Users can see their projects in dashboard
- [ ] Users can create new projects
- [ ] Users can upload avatars to projects
- [ [ Users can generate AI avatars in projects
- [ ] Users can delete avatars and projects
- [ ] Integration with Pose Generator still works
- [ ] No data loss

---

## 📞 Need Help?

**Jika ada error:**
1. Screenshot error message
2. Check backend logs: `pm2 logs lumiku-backend` or Coolify logs
3. Check database dengan SQL di Step 6A
4. Jika stuck, bisa rollback dulu (safe!)

**Contact:**
- Check `DEPLOYMENT_GUIDE_AVATAR_PROJECTS.md` for detailed steps
- Check `AVATAR_CREATOR_IMPLEMENTATION_COMPLETE.md` for code reference
- Review logs di Coolify dashboard

---

**Deployment Date:** _________
**Status:** ⏳ Ready to deploy
**Next Step:** Run commands di Coolify server
