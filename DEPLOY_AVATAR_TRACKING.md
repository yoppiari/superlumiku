# Deployment Guide: Avatar Usage Tracking

## 🚀 Quick Deployment Steps

### 1. Database Migration

#### Option A: Via Docker (Recommended for Production)
```bash
# If database is in Docker container
docker exec -i lumiku-postgres psql -U lumiku_dev -d lumiku_development < avatar-usage-tracking-migration.sql
```

#### Option B: Via psql command
```bash
psql -h localhost -U lumiku_dev -d lumiku_development -f avatar-usage-tracking-migration.sql
```

#### Option C: Via Prisma (Development)
```bash
cd backend
bun x prisma db push
```

### 2. Verify Migration
```bash
# Check if tables exist
psql -U lumiku_dev -d lumiku_development -c "\dt avatar*"

# Should show:
# - avatars (with lastUsedAt column)
# - avatar_usage_history (new table)
```

### 3. Generate Prisma Client
```bash
cd backend
bun x prisma generate
```

### 4. Restart Backend Service
```bash
cd backend
bun dev
# or in production:
pm2 restart lumiku-backend
```

### 5. Test the Implementation
1. Open Avatar Creator: `https://dev.lumiku.com/apps/avatar-creator`
2. Create or select a project
3. Upload or generate an avatar
4. Verify:
   - ✅ All attributes displayed (gender, age, style, ethnicity)
   - ✅ Timestamps visible (created date, last used)
   - ✅ History icon appears
   - ✅ Click history icon opens modal
5. Use avatar in Pose Generator
6. Check history again - should show new entry

## 📋 Migration SQL Content

The migration file (`avatar-usage-tracking-migration.sql`) contains:

1. **Add lastUsedAt to avatars table**
   ```sql
   ALTER TABLE "avatars" ADD COLUMN IF NOT EXISTS "lastUsedAt" TIMESTAMP(3);
   ```

2. **Create avatar_usage_history table**
   ```sql
   CREATE TABLE IF NOT EXISTS "avatar_usage_history" (
     id, avatarId, userId, appId, appName, action,
     referenceId, referenceType, metadata, createdAt
   );
   ```

3. **Add indexes for performance**
   ```sql
   CREATE INDEX ON avatar_usage_history(avatarId);
   CREATE INDEX ON avatar_usage_history(userId);
   CREATE INDEX ON avatar_usage_history(appId);
   CREATE INDEX ON avatar_usage_history(createdAt);
   ```

4. **Add foreign key constraint**
   ```sql
   ALTER TABLE avatar_usage_history
   ADD CONSTRAINT avatar_usage_history_avatarId_fkey
   FOREIGN KEY (avatarId) REFERENCES avatars(id) ON DELETE CASCADE;
   ```

## 🔧 Rollback (if needed)

```sql
-- Drop foreign key
ALTER TABLE "avatar_usage_history"
DROP CONSTRAINT IF EXISTS "avatar_usage_history_avatarId_fkey";

-- Drop table
DROP TABLE IF EXISTS "avatar_usage_history";

-- Remove column
ALTER TABLE "avatars" DROP COLUMN IF EXISTS "lastUsedAt";
```

## 📊 Monitoring

### Check Usage Statistics
```sql
-- Total usage records
SELECT COUNT(*) FROM avatar_usage_history;

-- Usage by app
SELECT appName, COUNT(*) as usage_count
FROM avatar_usage_history
GROUP BY appName;

-- Most used avatars
SELECT a.name, a.usageCount, a.lastUsedAt
FROM avatars a
ORDER BY a.usageCount DESC
LIMIT 10;

-- Recent activity
SELECT u.appName, u.action, u.createdAt
FROM avatar_usage_history u
ORDER BY u.createdAt DESC
LIMIT 20;
```

## 🐛 Troubleshooting

### Issue: Migration fails with "column already exists"
**Solution**: Column might already exist. Check with:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'avatars' AND column_name = 'lastUsedAt';
```

### Issue: Foreign key constraint fails
**Solution**: Ensure avatars table exists first:
```sql
SELECT * FROM avatars LIMIT 1;
```

### Issue: Prisma Client out of sync
**Solution**: Regenerate client:
```bash
cd backend
rm -rf node_modules/.prisma
bun x prisma generate
```

### Issue: Frontend not showing new fields
**Solution**:
1. Check browser console for errors
2. Clear browser cache
3. Restart frontend dev server
4. Verify API returns new fields:
```bash
curl https://dev.lumiku.com/api/apps/avatar-creator/projects/YOUR_PROJECT_ID
```

## 🔐 Production Checklist

Before deploying to production:

- [ ] Backup database
- [ ] Test migration on staging environment
- [ ] Verify no breaking changes
- [ ] Schedule downtime if needed (migration is fast, ~1 second)
- [ ] Update environment variables if needed
- [ ] Generate Prisma client
- [ ] Restart all backend services
- [ ] Monitor error logs for 30 minutes after deployment
- [ ] Test key user flows (create avatar, generate poses, view history)

## 📈 Performance Impact

- **Migration time**: < 1 second (adds one column + creates one table)
- **Query performance**: Negligible (properly indexed)
- **Storage impact**: ~100 bytes per usage record
- **API latency**: +5-10ms for usage tracking (async operation)

## 🎯 Success Metrics

After deployment, monitor:
- Avatar usage tracking rate: Should be 100% for new pose generations
- History modal load time: < 500ms
- Database query performance: < 50ms for history queries
- User engagement: Check if users are viewing history

## 📞 Support

If you encounter issues:
1. Check backend logs: `pm2 logs lumiku-backend`
2. Check database connectivity: `psql -U lumiku_dev -d lumiku_development -c "SELECT 1"`
3. Verify Prisma client: `cd backend && bun x prisma validate`
4. Review this guide's troubleshooting section

## 🎉 Post-Deployment

After successful deployment:
1. Announce new feature to users
2. Create user documentation/tutorial
3. Monitor usage patterns
4. Gather user feedback
5. Plan future enhancements based on data collected
