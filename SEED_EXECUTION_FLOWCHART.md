# Database Seed Execution Flowchart

```
┌─────────────────────────────────────────────────────────────────┐
│                    START: Seed Production Database              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │ Do you have access │
                    │ to Coolify Web UI? │
                    └──────┬─────────┬───┘
                           │         │
                      YES  │         │  NO
                           │         │
          ┌────────────────┘         └────────────────┐
          ▼                                           ▼
┌─────────────────────┐                    ┌──────────────────────┐
│  METHOD 1: Web UI   │                    │ Do you have SSH      │
│                     │                    │ access to server?    │
│ 1. Open Coolify     │                    └──────┬───────────┬───┘
│ 2. Navigate to app  │                           │           │
│ 3. Open Terminal    │                      YES  │           │ NO
│ 4. Run:             │                           │           │
│                     │          ┌────────────────┘           │
│ cd /app/backend &&  │          ▼                            ▼
│ bunx prisma db seed │ ┌─────────────────────┐    ┌──────────────────┐
│                     │ │  METHOD 2: SSH      │    │ METHOD 3: SQL    │
└──────────┬──────────┘ │                     │    │                  │
           │            │ 1. SSH into server  │    │ Contact server   │
           │            │ 2. Find container:  │    │ admin for help   │
           │            │    docker ps | grep │    │                  │
           │            │    d8ggwoo4...      │    │ OR use SQL       │
           │            │ 3. Execute:         │    │ fallback script  │
           │            │    docker exec      │    │                  │
           │            │    CONTAINER sh -c  │    └──────────┬───────┘
           │            │    "cd /app/backend │               │
           │            │    && bunx prisma   │               │
           │            │    db seed"         │               │
           │            └──────────┬──────────┘               │
           │                       │                          │
           └───────────────────────┴──────────────────────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │ Did seed complete    │
                        │ successfully?        │
                        └──────┬───────────┬───┘
                               │           │
                          YES  │           │  NO
                               │           │
              ┌────────────────┘           └────────────────┐
              ▼                                             ▼
    ┌─────────────────────┐                     ┌──────────────────────┐
    │ VERIFY:             │                     │ TROUBLESHOOT:        │
    │                     │                     │                      │
    │ ✅ Database check   │                     │ 1. Check error msg   │
    │    4 models for     │                     │ 2. Verify Bun exists │
    │    avatar-creator   │                     │ 3. Check DATABASE_URL│
    │                     │                     │ 4. Generate Prisma   │
    │ ✅ API check        │                     │    client            │
    │    /api/apps        │                     │ 5. Try SQL fallback  │
    │    includes app     │                     │                      │
    │                     │                     │ See:                 │
    │ ✅ Dashboard check  │                     │ EXECUTE_SEED_IN_     │
    │    Avatar Creator   │                     │ PRODUCTION.md        │
    │    visible          │                     │ (Troubleshooting)    │
    │                     │                     │                      │
    │ ✅ Model dropdown   │                     └──────────┬───────────┘
    │    shows 4 models   │                                │
    │                     │                                │
    └──────────┬──────────┘                                │
               │                                           │
               │        ┌──────────────────────────────────┘
               │        │
               ▼        ▼
    ┌──────────────────────┐
    │ TEST GENERATION:     │
    │                      │
    │ 1. Select model      │
    │ 2. Enter prompt      │
    │ 3. Generate avatar   │
    │ 4. Verify success    │
    │ 5. Check credits     │
    │    deducted          │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ Did generation work? │
    └──────┬───────────┬───┘
           │           │
      YES  │           │  NO
           │           │
           ▼           ▼
    ┌──────────┐   ┌─────────────────────────┐
    │ SUCCESS! │   │ Check:                  │
    │          │   │ - Worker running?       │
    │ ✅ Seed  │   │ - Redis connected?      │
    │ ✅ Models│   │ - HuggingFace API key?  │
    │ ✅ App   │   │ - Application logs?     │
    │ ✅ Test  │   │                         │
    │          │   │ See: TROUBLESHOOTING_   │
    │ DONE! 🎉 │   │ AVATAR_CREATOR.md       │
    └──────────┘   └─────────────────────────┘
```

## Quick Decision Tree

### "Which method should I use?"

```
START
  │
  ├─ Can access Coolify Web UI?
  │   └─ YES → Use METHOD 1 (Easiest)
  │
  ├─ Can SSH to server?
  │   └─ YES → Use METHOD 2 (Flexible)
  │
  └─ Neither?
      └─ Use METHOD 3 (SQL Fallback)
          OR contact server admin
```

## Execution Time Estimates

| Method | Setup Time | Execution Time | Total |
|--------|-----------|----------------|-------|
| Method 1 (Web UI) | 1 min | 30-60 sec | ~2 min |
| Method 2 (SSH) | 2-3 min | 30-60 sec | ~4 min |
| Method 3 (SQL) | 3-5 min | 1-2 min | ~7 min |

## Success Indicators

### During Execution
```
🌱 Starting database seeding...
✅ Seeded subscription plans
✅ Seeded AI models
✅ Migrated users
✅ Seeded Pose Generator
✅ Created test user
```

### After Execution

#### Database Level
```bash
SELECT COUNT(*) FROM "AIModel"
WHERE "appId" = 'avatar-creator';
```
Expected: `4`

#### API Level
```bash
curl https://dev.lumiku.com/api/apps
```
Should include: `"id": "avatar-creator"`

#### UI Level
```
Dashboard → Avatar Creator card visible
Avatar Creator → 4 models in dropdown
```

#### Functional Level
```
Generate Avatar → Success
Credits → Deducted correctly
History → Avatar appears
```

## Common Paths

### Ideal Path (95% success rate)
```
Method 1 Web UI
  → Seed executes successfully
    → Database verification (4 models)
      → Dashboard shows app
        → Generation works
          → SUCCESS ✅
```

### Alternative Path (Seed fails)
```
Method 1 Web UI
  → Seed fails (missing Prisma client)
    → SSH to server
      → Generate Prisma client
        → Re-run seed
          → SUCCESS ✅
```

### Fallback Path (No CLI access)
```
Method 3 SQL
  → Connect to database
    → Run INSERT statements
      → Verify 4 rows inserted
        → Dashboard shows app
          → SUCCESS ✅
```

## Files Reference Map

```
SEED_EXECUTION_SUMMARY.md
  │
  ├─ Quick overview
  ├─ All methods listed
  └─ Troubleshooting summary
      │
      └─ EXECUTE_SEED_IN_PRODUCTION.md
          │
          ├─ Method 1: Detailed Web UI steps
          ├─ Method 2: Detailed SSH steps
          ├─ Method 3: Detailed SQL steps
          ├─ Verification procedures
          └─ Comprehensive troubleshooting
              │
              ├─ COPY_PASTE_SEED_COMMANDS.txt
              │   └─ Ready-to-copy commands
              │
              ├─ SEED_PRODUCTION_QUICK_COMMANDS.sh
              │   └─ Automated bash script
              │
              └─ SEED_PRODUCTION_SQL_FALLBACK.sql
                  └─ Complete SQL script
```

## Risk Assessment

| Scenario | Risk Level | Mitigation |
|----------|-----------|------------|
| Wrong container | LOW | Script finds container automatically |
| Database connection fails | LOW | DATABASE_URL already configured |
| Prisma client missing | MEDIUM | Can generate on-the-fly |
| Seed script not found | LOW | Already in repository |
| Duplicate models | NONE | Idempotent (ON CONFLICT) |
| Data loss | NONE | Non-destructive (INSERT/UPDATE only) |

## Support Contacts

If stuck:
1. Check `EXECUTE_SEED_IN_PRODUCTION.md` troubleshooting
2. Review container logs
3. Verify environment variables
4. Use SQL fallback method

---

**Ready to execute?** Start with Method 1 in `COPY_PASTE_SEED_COMMANDS.txt`
