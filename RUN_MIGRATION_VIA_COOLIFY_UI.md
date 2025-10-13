# 🗄️ Run Avatar Project Migration via Coolify UI

## ✅ Status: Deployment Complete!
- ✅ Code deployed to production
- ✅ Backend & Frontend rebuilt successfully
- ⏳ **Next Step: Apply Database Migration**

---

## 📋 Step-by-Step Guide

### Option 1: Via Coolify Database UI (EASIEST!)

1. **Buka Coolify Dashboard**
   - Go to: https://cf.avolut.com
   - Login

2. **Navigate to Database**
   - Click on your PostgreSQL database
   - Look for "coolify-db" or your main database

3. **Open Database Terminal**
   - Click "Terminal" atau "Execute SQL" button
   - Or click "phpPgAdmin" if available

4. **Copy & Paste SQL**
   - Open file: `AVATAR_PROJECT_MIGRATION_SQL.sql`
   - Copy ALL content (Ctrl+A, Ctrl+C)
   - Paste ke SQL terminal di Coolify
   - Click "Execute" atau "Run"

5. **Check Output**
   - Should see:
     ```
     Processing user: user_xxx (N avatars)
     Created project: proj_xxx
     Migrated N avatars to project
     ...
     ✅ All avatars have been migrated!
     ```

6. **Verify Results**
   - Scroll down to verification output
   - Check: `avatars_without_project` should be `0`
   - Check: `total_projects` > 0
   - Check: `avatar_count` per project

7. **Apply Constraints (IF verification passed)**
   - In the SQL file, uncomment Step 5:
     ```sql
     ALTER TABLE "avatars" ALTER COLUMN "project_id" SET NOT NULL;
     ALTER TABLE "avatars"
     ADD CONSTRAINT "fk_avatars_project"
     FOREIGN KEY ("project_id")
     REFERENCES "avatar_projects"("id")
     ON DELETE CASCADE;
     ```
   - Run these commands

---

### Option 2: Via SSH + psql (Advanced)

```bash
# SSH to Coolify server
ssh root@your-coolify-server

# Find database container
docker ps | grep postgres

# Connect to database
docker exec -it <postgres-container-name> psql -U <username> -d <database-name>

# Example:
docker exec -it coolify-db psql -U postgres -d lumiku

# Paste SQL content from AVATAR_PROJECT_MIGRATION_SQL.sql
# Or:
\i /path/to/AVATAR_PROJECT_MIGRATION_SQL.sql
```

---

### Option 3: Via Coolify Application Terminal

1. **Open Application Terminal**
   - Go to SuperLumiku application in Coolify
   - Click "Terminal" button

2. **Run Prisma Migration (if schema.prisma is ready)**
   ```bash
   cd /app/backend
   bunx prisma migrate deploy
   ```

3. **Run Migration Script**
   ```bash
   cd /app/backend
   bun run scripts/migrate-avatars-to-projects.ts
   ```

---

## 🔍 Verification Checklist

After running migration, verify:

### 1. Database Check
```sql
-- No orphaned avatars
SELECT COUNT(*) FROM avatars WHERE project_id IS NULL;
-- Should return: 0

-- Projects created
SELECT COUNT(*) FROM avatar_projects;
-- Should return: > 0

-- Avatars per project
SELECT
  ap.name,
  COUNT(a.id) as avatar_count
FROM avatar_projects ap
LEFT JOIN avatars a ON a.project_id = ap.id
GROUP BY ap.id, ap.name;
```

### 2. Backend API Check
```bash
# Test projects endpoint (replace YOUR_TOKEN)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://app.lumiku.com/api/apps/avatar-creator/projects

# Expected: { "projects": [...] }
```

### 3. Frontend Check
- Open: https://app.lumiku.com
- Login
- Go to Dashboard → Avatar Creator
- Should see: **Project list** (not flat avatar list)
- Click a project
- Should see: Upload & Generate AI buttons

---

## ⚠️ Important Notes

1. **Backup Database First!**
   - Via Coolify: Database → Backup
   - Or manual: `pg_dump lumiku > backup.sql`

2. **Migration is IDEMPOTENT**
   - Safe to run multiple times
   - Won't create duplicate projects
   - Uses `IF NOT EXISTS` and `IF NULL` checks

3. **Rollback Available**
   - If issues occur, rollback SQL:
     ```sql
     DROP TABLE IF EXISTS "avatar_projects" CASCADE;
     ALTER TABLE "avatars" DROP COLUMN IF EXISTS "project_id";
     ```

4. **Zero Downtime**
   - Migration runs while app is live
   - Users can continue using app
   - Only brief lock during ALTER TABLE

---

## 🎯 Expected Results

**Before Migration:**
```
avatars table:
- id, user_id, name, base_image_url, ... (no project_id)

avatar_projects table:
- Does not exist
```

**After Migration:**
```
avatar_projects table:
- Multiple rows (one "My Avatars" project per user)

avatars table:
- All rows have project_id populated
- Grouped by user's default project

Constraints:
- project_id is REQUIRED (NOT NULL)
- Foreign key to avatar_projects with CASCADE delete
```

---

## 📞 Need Help?

**If you get errors:**

1. **"Table already exists"**
   - OK! Skip table creation, run only migration part

2. **"Column already exists"**
   - OK! Skip column addition, run only data migration

3. **"Some avatars still NULL"**
   - Re-run Step 3 (DO $$ block)
   - Check user_id integrity

4. **Foreign key constraint error**
   - Don't run Step 5 yet
   - Fix NULL project_ids first

---

## ✅ Success Criteria

All must be ✅:
- [ ] `avatar_projects` table created
- [ ] `project_id` column added to `avatars`
- [ ] All avatars have non-NULL `project_id`
- [ ] Default projects created for all users
- [ ] Foreign key constraint applied
- [ ] Backend API `/api/apps/avatar-creator/projects` works
- [ ] Frontend shows project list
- [ ] Can create new project
- [ ] Can upload avatar to project
- [ ] Can generate AI avatar in project
- [ ] Integration with Pose Generator still works

---

**Ready to run?** Open `AVATAR_PROJECT_MIGRATION_SQL.sql` and execute! 🚀
