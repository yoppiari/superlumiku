# Quick Deployment Reference - P1 Performance Fixes

## 🚀 Deploy in 5 Steps (15 minutes)

### Step 1: Deploy Code to Production
```bash
# Already on development branch - push changes
git add -A
git commit -m "perf: Fix P1 performance issues - N+1 query, missing indexes, cache stampede"
git push origin development

# Merge to main and deploy (use your deployment process)
# OR deploy directly from development branch
```

### Step 2: Run Database Migration
```bash
# SSH into production server
ssh your-production-server

# Navigate to backend
cd /app/backend

# Run migration (creates indexes)
npx prisma migrate deploy
```

**Expected output:**
```
✓ 1 migration found in prisma/migrations
✓ The following migration was applied:
  20251015_add_recovery_indexes
✓ Migration applied successfully
```

### Step 3: Install Dependencies & Restart
```bash
# Still on production server
cd /app/backend

# Install async-mutex dependency
bun install

# Restart all services
pm2 restart all

# Verify services are up
pm2 status
```

### Step 4: Verify Performance
```bash
# Test metrics API (should be < 50ms)
curl -X GET https://your-api.com/api/pose-generator/metrics/top-users \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nTime: %{time_total}s\n"

# Check worker logs
pm2 logs worker-pose-generator --lines 50 | grep "ControlNet"

# Verify indexes exist
psql $DATABASE_URL -c "\d pose_generations" | grep -A 2 "Indexes:"
```

### Step 5: Monitor for 30 Minutes
```bash
# Watch logs for errors
pm2 logs --lines 100

# Monitor database performance
psql $DATABASE_URL -c "
  SELECT query, mean_exec_time
  FROM pg_stat_statements
  WHERE query LIKE '%pose_generations%'
  ORDER BY mean_exec_time DESC
  LIMIT 5;
"
```

---

## 🛡️ Rollback (if needed)

```bash
# Revert code changes
git revert HEAD
git push origin development

# Restart services
pm2 restart all

# Drop indexes (optional - safe to keep)
psql $DATABASE_URL -c "
  DROP INDEX IF EXISTS pose_generations_status_startedAt_idx;
  DROP INDEX IF EXISTS pose_generations_status_startedAt_queueJobId_idx;
"
```

---

## 📊 What Was Fixed

| Issue | Impact | Fix |
|-------|--------|-----|
| **N+1 Query** | Metrics API 91% slower | Single JOIN query |
| **Missing Indexes** | Worker recovery 95% slower | Added 2 indexes |
| **Cache Stampede** | 10x redundant fetches | Per-URL mutex locks |

---

## ✅ Success Criteria

- ✅ Metrics API responds in < 50ms
- ✅ No errors in logs
- ✅ Worker cache hit rate > 90%
- ✅ Database query times < 10ms for recovery
- ✅ PM2 shows all services running

---

## 📞 Support

**Issues?** Check:
1. PM2 logs: `pm2 logs --lines 100`
2. Database connection: `psql $DATABASE_URL -c "SELECT 1"`
3. Migration status: `npx prisma migrate status`

**Rollback if:**
- Services won't start
- Database errors
- Performance degradation
- Any critical errors

---

**Last Updated:** 2025-10-15
**Estimated Time:** 15-20 minutes
**Risk Level:** LOW (backward compatible)
