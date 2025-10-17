# Quick Start: Deploy Migrations in 60 Seconds

## What This Will Do

Fix the production database by adding missing columns:
- `avatar_generations.avatarId` ✅
- `avatar_generations.projectId` ✅
- `pose_generations.generationType` ✅

## 3-Step Deployment

### Step 1: Open Coolify Terminal

1. Go to: https://cf.avolut.com
2. Navigate to: **Applications** > **Lumiku** > **Terminal**

### Step 2: Copy-Paste These Commands

```bash
cd /app/backend
npx prisma migrate deploy
```

### Step 3: Verify Success

You should see output like:

```
Applying migration `20251014_add_avatar_creator_complete`
Applying migration `20251015_add_recovery_indexes`
Applying migration `20251015_add_variation_key_to_generated_pose`
Applying migration `20251016_p2_performance_indexes`

The following migration(s) have been applied:

migrations/
  └─ 20251014_add_avatar_creator_complete/
      └─ migration.sql
  └─ 20251015_add_recovery_indexes/
      └─ migration.sql
  └─ 20251015_add_variation_key_to_generated_pose/
      └─ migration.sql
  └─ 20251016_p2_performance_indexes/
      └─ migration.sql

All migrations have been successfully applied.
```

## Done! ✅

That's it! Your database schema is now in sync.

## Optional: Verify Columns Exist

```bash
npx prisma db execute --stdin <<'EOF'
SELECT column_name, table_name
FROM information_schema.columns
WHERE table_name IN ('avatar_generations', 'pose_generations')
AND column_name IN ('avatarId', 'projectId', 'generationType');
EOF
```

Expected output:
```
 column_name    | table_name
----------------+---------------------
 avatarId       | avatar_generations
 projectId      | avatar_generations
 generationType | pose_generations
```

## If Something Goes Wrong

**Error: "Migration failed"**
- Copy the FULL error message
- Run: `npx prisma migrate status`
- Report the error for analysis

**Error: "Database connection failed"**
- Check PostgreSQL service is running
- Verify DATABASE_URL environment variable is set

**Partial Success**
- Some migrations applied, some failed
- Safe to re-run `npx prisma migrate deploy`
- Migrations are idempotent (safe to run multiple times)

## What Gets Applied

4 migrations:
1. **20251014_add_avatar_creator_complete** - Main fix (adds missing columns)
2. **20251015_add_recovery_indexes** - Performance indexes
3. **20251015_add_variation_key_to_generated_pose** - Variation support
4. **20251016_p2_performance_indexes** - P2 optimization indexes

## Safety Notes

✅ All migrations are production-safe
✅ Wrapped in transactions (auto-rollback on error)
✅ Use `IF NOT EXISTS` (won't fail if already applied)
✅ No data modifications
✅ No column drops
✅ No downtime

---

**Time Required**: 1-2 minutes
**Risk Level**: Low
**Downtime**: None

Ready? Go to Step 1! 🚀
