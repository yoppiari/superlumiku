# Avatar Creator Migration - Quick Start Guide

## TL;DR

**Problem**: `POST /api/apps/avatar-creator/projects` returns 500 error
**Cause**: Database missing Avatar Creator tables
**Fix**: Run migration in Coolify terminal
**Time**: 10 minutes

## Pre-Deployment

1. **Push code to GitHub**:
   ```bash
   git push origin development
   ```

2. **Wait for Coolify auto-deploy** (or trigger manually in Coolify UI)

## Deployment (In Coolify Terminal)

Copy-paste these commands ONE BY ONE:

```bash
# 1. BACKUP DATABASE (REQUIRED!)
pg_dump $DATABASE_URL > /app/backups/backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Navigate to backend
cd /app/backend

# 3. Check migration status
npx prisma migrate status

# 4. Deploy migration
npx prisma migrate deploy

# 5. Generate Prisma Client
npx prisma generate

# 6. Restart backend
pm2 restart backend

# 7. Verify tables created
psql $DATABASE_URL -c "\dt avatar*"

# 8. Check column exists
psql $DATABASE_URL -c "\d avatars" | grep persona
```

## Verification

Test the endpoint:

```bash
# Should now return 201 Created instead of 500 error
curl -X POST https://dev.lumiku.com/api/apps/avatar-creator/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Project","description":"Testing migration"}'
```

## If Something Goes Wrong

```bash
# Restore from backup
psql $DATABASE_URL < /app/backups/backup_[FIND_LATEST].sql

# Restart backend
pm2 restart backend
```

## Expected Output

### Step 3 (migrate status)
```
Following migrations have not been applied:
20251014_add_avatar_creator_complete
```

### Step 4 (migrate deploy)
```
Applying migration `20251014_add_avatar_creator_complete`
Migration complete!
```

### Step 7 (verify tables)
```
 avatar_generations
 avatar_presets
 avatar_projects
 avatar_usage_history
 avatars
 persona_examples
```

### Step 8 (check columns)
```
personaName          | text
personaAge           | integer
personaPersonality   | text
personaBackground    | text
```

## Success Checklist

- [ ] Backup created
- [ ] Migration deployed successfully
- [ ] Prisma Client regenerated
- [ ] Backend restarted
- [ ] Tables exist in database
- [ ] Columns exist in avatars table
- [ ] POST endpoint returns 201
- [ ] No errors in `pm2 logs backend`

## Documentation

For detailed information, see:
- **COOLIFY_MIGRATION_COMMANDS.txt** - Complete command reference
- **AVATAR_CREATOR_MIGRATION_SUMMARY.md** - Executive summary
- **PRISMA_SCHEMA_SYNC_SOLUTION.md** - Technical deep dive

## Timeline

- Backup: 2 min
- Deploy: 1-2 min
- Verify: 2 min
- Test: 3 min
- **Total: ~10 minutes**

## Contact

If migration fails or you need help, check the Rollback Plan in COOLIFY_MIGRATION_COMMANDS.txt
