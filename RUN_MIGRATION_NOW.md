# 🚨 URGENT: Run Migration Manually

## ❌ Problem Confirmed:
Migration **TIDAK JALAN** saat deployment! Table `avatar_projects` masih belum dibuat.

## ✅ Solution: Run Manual Migration SEKARANG

### Option 1: Via Coolify Terminal (FASTEST - RECOMMENDED)

1. **Buka Coolify:** https://cf.avolut.com
2. **Navigate to:** dev-superlumiku → **Terminal** tab
3. **Run command berikut:**

```bash
cd /app/backend
bun prisma db push --skip-generate --accept-data-loss
```

**Expected output:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20251012_create_avatar_projects/
      └─ migration.sql

✔ Generated Prisma Client to ./node_modules/@prisma/client
```

4. **Verify:**
```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM avatar_projects;"
```

Should return: `0` (no error = table exists!)

---

### Option 2: Direct SQL Execution (If Coolify Terminal Fails)

**Connect to database via psql:**

```bash
# Get connection string from Coolify environment variables
# DATABASE_URL should be something like:
# postgresql://lumiku_dev:password@107.155.75.50:5986/lumiku-dev

psql "$DATABASE_URL"
```

**Then run this SQL:**

```sql
-- Create avatar_projects table
CREATE TABLE IF NOT EXISTS "avatar_projects" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Create index
CREATE INDEX IF NOT EXISTS "avatar_projects_userId_idx"
ON "avatar_projects"("userId");

-- Add foreign key if avatars table has projectId
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'avatars' AND column_name = 'projectId'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'avatars_projectId_fkey'
      AND table_name = 'avatars'
    ) THEN
      ALTER TABLE "avatars"
      ADD CONSTRAINT "avatars_projectId_fkey"
      FOREIGN KEY ("projectId") REFERENCES "avatar_projects"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END IF;
END $$;

-- Verify
SELECT COUNT(*) FROM avatar_projects;
\dt avatar_projects
```

**Expected output:**
```
CREATE TABLE
CREATE INDEX
 count
-------
     0
(1 row)

              List of relations
 Schema |       Name       | Type  |    Owner
--------+------------------+-------+--------------
 public | avatar_projects  | table | lumiku_dev
```

---

### Option 3: Via SQL File Upload

If you have database admin tool (pgAdmin, DBeaver, etc):

1. **Connect to database:**
   - Host: `107.155.75.50`
   - Port: `5986`
   - Database: `lumiku-dev`
   - User: `lumiku_dev`
   - Password: (from Coolify env vars)

2. **Run SQL file:**
   - Open file: `fix-avatar-projects-table.sql`
   - Execute all statements

---

### Option 4: Restart Container with Forced Migration

Via Coolify UI:

1. **Go to:** https://cf.avolut.com
2. **Navigate to:** dev-superlumiku → **Actions** tab
3. **Click:** "Restart" button
4. **Check logs** for migration output

**Look for:**
```
🗄️  Running database migrations...
✅ Prisma db push successful - schema synced to database
```

---

## 🧪 After Migration - Test Immediately

### Browser Console Test:

1. Open: https://dev.lumiku.com
2. Press F12 → Console
3. Run:

```javascript
const token = localStorage.getItem('token')
fetch('/api/apps/avatar-creator/projects', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Test After Manual Migration',
    description: 'Should work now!'
  })
}).then(r => r.json()).then(console.log)
```

**Expected (if fixed):**
```json
{
  "success": true,
  "project": {
    "id": "cm5...",
    "name": "Test After Manual Migration",
    ...
  }
}
```

**If still fails:**
- Check if table was created: `\dt avatar_projects` in psql
- Check Prisma Client regeneration: `bun prisma generate`
- Restart container again

---

## 🎯 Why Migration Didn't Run

**Root Cause Analysis:**

1. ❌ **docker-entrypoint.sh ran**, but migration failed silently
2. ❌ **Prisma migrate deploy** failed (no migration files)
3. ❌ **Prisma db push** fallback also failed OR didn't run
4. ❌ **Script continues anyway** (exit 0 instead of exit 1)

**Fix:** Manual migration required!

---

## 📋 Checklist

After running ANY of the options above:

- [ ] Run migration command
- [ ] Verify table exists: `\dt avatar_projects`
- [ ] Check table has data: `SELECT COUNT(*) FROM avatar_projects;`
- [ ] Test project creation in browser
- [ ] Verify no more 400 errors
- [ ] Hard refresh browser (Ctrl + Shift + R)
- [ ] Test full flow: create → upload → generate

---

## 🚨 URGENT ACTION REQUIRED

**You need to:**
1. Choose ONE option above (Option 1 recommended)
2. Run the migration command
3. Verify table creation
4. Test project creation again

**This is the ONLY way to fix the 400 error!**

The deployment was successful, but the migration step was skipped/failed.

---

**Generated:** 2025-10-12 08:45 UTC
**Priority:** CRITICAL
**Status:** ⏳ Waiting for manual action
