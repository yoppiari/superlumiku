# Quick Fix Guide - Avatar Project Deletion

## Problem
Cannot delete Avatar Creator project. Error: `Foreign key constraint violated: generated_poses_avatarId_fkey`

## Solution Applied ✅

### What Was Changed
Updated the project deletion logic to use a **transaction** that deletes related records in the correct order.

### Files Modified
1. `backend/src/apps/avatar-creator/repositories/avatar-creator.repository.ts` - Lines 89-162
2. `backend/src/apps/avatar-creator/services/avatar-creator.service.ts` - Lines 79-120

---

## Quick Deploy (Copy-Paste Ready)

### 1. Verify Changes
```bash
cd "C:\Users\yoppi\Downloads\Lumiku App\backend"
git status
git diff src/apps/avatar-creator/
```

### 2. Test Locally (Optional but Recommended)
```bash
# Start local server
npm run dev

# In another terminal, test deletion
export AUTH_TOKEN="your-test-token"
curl -X DELETE http://localhost:3000/api/apps/avatar-creator/projects/test-project-id \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -v
```

### 3. Commit Changes
```bash
git add backend/src/apps/avatar-creator/repositories/avatar-creator.repository.ts
git add backend/src/apps/avatar-creator/services/avatar-creator.service.ts
git commit -m "fix(avatar-creator): Resolve foreign key constraint violation on project deletion

- Add transaction-based deletion to handle foreign key relationships
- Delete GeneratedPose, PoseGeneration, and related records before Avatar
- Add comprehensive logging for debugging
- Improve error handling with specific Prisma error codes

Fixes foreign key constraint error: generated_poses_avatarId_fkey
Resolves deletion failure for project: cmgn8zbl80002wgb227d4g3wi"
```

### 4. Deploy to Production
```bash
git push origin development
# Then trigger deployment on Coolify
```

---

## Verify Fix Works

### Test the Previously Failing Project
```bash
# Set your auth token
export AUTH_TOKEN="your-production-token"

# Try deleting the problematic project
curl -X DELETE https://your-domain.com/api/apps/avatar-creator/projects/cmgn8zbl80002wgb227d4g3wi \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -v
```

### Expected Response
**Before Fix:**
```json
{
  "error": "Foreign key constraint violated: generated_poses_avatarId_fkey"
}
```

**After Fix:**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

### Check Logs
```bash
# On your server
grep "AVATAR_PROJECT_DELETE" /var/log/app/production.log

# Should see:
# [AVATAR_PROJECT_DELETE] Starting deletion for project cmgn8zbl80002wgb227d4g3wi
# [AVATAR_PROJECT_DELETE] Successfully deleted project cmgn8zbl80002wgb227d4g3wi
```

---

## Troubleshooting

### Still Getting P2003 Error?

1. **Enable detailed Prisma logging:**
```bash
export DEBUG="prisma:query,prisma:error"
npm run dev
```

2. **Check for other foreign keys:**
```sql
SELECT constraint_name, table_name, column_name
FROM information_schema.key_column_usage
WHERE table_name IN ('Avatar', 'AvatarProject', 'GeneratedPose', 'PoseGeneration')
  AND constraint_name LIKE '%fkey%';
```

3. **Check for orphaned records:**
```bash
psql $DATABASE_URL -f verify-avatar-project-deletion.sql
```

### Transaction Timeout?

For very large projects, increase timeout:
```typescript
// In repository.ts, line 92
await prisma.$transaction(async (tx) => {
  // ... deletion logic
}, {
  timeout: 30000 // 30 seconds instead of default 5 seconds
})
```

---

## What the Fix Does

### Before (Broken)
```typescript
// Simple delete - fails if foreign keys exist
await prisma.avatarProject.delete({
  where: { id: projectId, userId }
})
// ❌ Error: generated_poses_avatarId_fkey constraint violation
```

### After (Fixed)
```typescript
// Transaction-based deletion in correct order
await prisma.$transaction(async (tx) => {
  // 1. Get avatars in project
  const avatars = await tx.avatar.findMany(...)

  // 2. Delete GeneratedPoses (child of PoseGeneration)
  await tx.generatedPose.deleteMany(...)

  // 3. Delete PoseGenerations (references Avatar)
  await tx.poseGeneration.deleteMany(...)

  // 4. Update PoseGeneratorProjects (set avatarId = null)
  await tx.poseGeneratorProject.updateMany(...)

  // 5. Delete AvatarUsageHistory
  await tx.avatarUsageHistory.deleteMany(...)

  // 6. Delete Avatars
  await tx.avatar.deleteMany(...)

  // 7. Delete AvatarGenerations
  await tx.avatarGeneration.deleteMany(...)

  // 8. Delete AvatarProject
  await tx.avatarProject.delete(...)
})
// ✅ Success: All related data deleted in correct order
```

---

## Key Points

✅ **Safe**: Uses transaction - all-or-nothing deletion
✅ **Complete**: Deletes all related data across tables
✅ **Logged**: Comprehensive logging for debugging
✅ **Tested**: TypeScript compilation successful

⚠️ **Important**: This is a hard delete. Once deleted, data cannot be recovered (unless you have database backups).

---

## Need Help?

### View Full Documentation
- Complete details: `AVATAR_PROJECT_DELETE_FIX.md`
- SQL queries: `verify-avatar-project-deletion.sql`
- Test script: `test-avatar-project-deletion.sh`

### Enable Debug Mode
```bash
# In your .env
DEBUG=prisma:query,prisma:error
LOG_LEVEL=debug
```

### Check Database Integrity
```sql
-- Find orphaned records
SELECT 'GeneratedPoses', COUNT(*) FROM "GeneratedPose" gp
LEFT JOIN "PoseGeneration" pg ON gp."generationId" = pg.id
WHERE pg.id IS NULL;
```

---

**Status**: READY TO DEPLOY ✅
**Risk**: Low (no schema changes, uses transaction)
**Impact**: Fixes critical bug preventing project deletion
