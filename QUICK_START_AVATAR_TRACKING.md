# 🚀 Quick Start: Avatar Usage Tracking

## TL;DR - Run These Commands

```bash
# 1. Generate Prisma Client (✅ DONE)
cd backend && bun x prisma generate

# 2. Run Migration (⏳ TODO - Choose one method below)

# Method A: Via Prisma DB Push (Recommended)
cd backend && bun x prisma db push

# Method B: Via Docker
docker exec -i lumiku-postgres psql -U lumiku_dev -d lumiku_development < avatar-usage-tracking-migration.sql

# Method C: Via psql
psql -U lumiku_dev -d lumiku_development -f avatar-usage-tracking-migration.sql

# 3. Restart Backend
cd backend && bun dev
# Or: pm2 restart lumiku-backend

# 4. Test
node test-avatar-tracking.js
```

## What Was Implemented?

### ✅ Backend
- Added `lastUsedAt` field to Avatar model
- Created `AvatarUsageHistory` table
- Added tracking methods in Avatar Service
- Integrated tracking in Pose Generator
- New API endpoint for usage history

### ✅ Frontend
- Avatar cards show ALL attributes (gender, age, style, ethnicity)
- Timestamps displayed (created date, last used)
- History icon button
- Usage History Modal with summary & details

### ✅ Documentation
- Technical implementation guide
- Deployment guide with rollback
- Test script
- This quick start guide

## Test It

### 1. Open Avatar Creator
```
https://dev.lumiku.com/apps/avatar-creator
```

### 2. Check Avatar Card
Should show:
- ✅ Avatar image
- ✅ Name with AI indicator (if generated)
- ✅ All attributes (gender, age, style, ethnicity) as colored badges
- ✅ Created date with calendar icon
- ✅ Last used date with clock icon (if used before)
- ✅ Usage count with history icon button

### 3. Click History Icon
Should open modal with:
- Summary cards per app
- Detailed history list
- Or "No usage history yet" if never used

### 4. Use Avatar in Pose Generator
1. Go to Pose Generator
2. Select the avatar
3. Generate poses
4. Go back to Avatar Creator
5. Click history icon
6. Should see entry for Pose Generator

## Files Reference

| File | Purpose |
|------|---------|
| `avatar-usage-tracking-migration.sql` | Database migration |
| `AVATAR_TRACKING_COMPLETE.md` | Complete summary |
| `DEPLOY_AVATAR_TRACKING.md` | Deployment guide |
| `test-avatar-tracking.js` | Test script |
| `AVATAR_USAGE_TRACKING_IMPLEMENTATION.md` | Technical details |

## Quick Checks

### Is Migration Done?
```sql
psql -U lumiku_dev -d lumiku_development -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'avatars' AND column_name = 'lastUsedAt';"
```
Should return: `lastUsedAt`

### Is Tracking Working?
```sql
SELECT * FROM avatar_usage_history ORDER BY createdAt DESC LIMIT 5;
```
Should show recent usage entries after using avatar in Pose Generator

### Check Backend Logs
```bash
pm2 logs lumiku-backend
# or
tail -f backend/logs/app.log
```
Look for: "Track avatar usage" or similar messages

## Rollback (If Needed)

```sql
ALTER TABLE avatar_usage_history DROP CONSTRAINT IF EXISTS avatar_usage_history_avatarId_fkey;
DROP TABLE IF EXISTS avatar_usage_history;
ALTER TABLE avatars DROP COLUMN IF EXISTS lastUsedAt;
```

## Need Help?

1. Check `AVATAR_TRACKING_COMPLETE.md` for full details
2. Check `DEPLOY_AVATAR_TRACKING.md` for troubleshooting
3. Run `node test-avatar-tracking.js` for automated checks
4. Check backend logs for errors

## Status Checklist

- [x] ✅ Code Implementation Complete
- [x] ✅ Prisma Client Generated
- [ ] ⏳ Database Migration Pending
- [ ] ⏳ Backend Restart Needed
- [ ] ⏳ Manual Testing Needed

## Next Action

**Run the migration command now:**

```bash
cd backend && bun x prisma db push
```

Then restart backend and test!

---

**Total Time**: ~5 minutes
**Difficulty**: Easy
**Breaking Changes**: None
**Rollback Available**: Yes
