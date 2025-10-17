# Visual Fix Guide: NPX Not Found Error

## Problem Screenshot Analysis

```
/app # cd /app/backend
/app/backend # npx prisma migrate deploy
sh: npx: not found  ← ERROR HERE
/app/backend # npx prisma migrate status
sh: npx: not found  ← ERROR HERE
/app/backend #
```

## What This Error Means

```
┌─────────────────────────────────────────────────┐
│  Container Environment                          │
├─────────────────────────────────────────────────┤
│  Base Image:    oven/bun:1-alpine               │
│  Runtime:       Bun (NOT Node.js)               │
│  Available:     ✓ bun, ✓ bunx                   │
│  NOT Available: ✗ node, ✗ npm, ✗ npx           │
└─────────────────────────────────────────────────┘
```

## The Fix (Visual Steps)

### Step 1: Open Coolify Terminal

```
Coolify Dashboard
  └── Applications
      └── lumiku-backend (d8ggwoo484k8ok48g8k8cgwk)
          └── [Terminal] ← Click here
```

### Step 2: Copy This Command

```bash
cd /app/backend && bunx prisma migrate deploy
```

### Step 3: Paste in Terminal

```
/app # cd /app/backend && bunx prisma migrate deploy
                ^^^^
              USE THIS instead of npx
```

### Step 4: Expected Success Output

```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "lumiku_prod", schema "public"

The following migration(s) have been applied:

migrations/
  └─ 20251014_add_avatar_creator_complete/
     └─ migration.sql

All migrations have been successfully applied.
✓ Generated Prisma Client
```

## Command Comparison

### ❌ WRONG (Using NPX - Will Fail)

```bash
/app/backend # npx prisma migrate deploy
sh: npx: not found  ← ERROR!
```

### ✅ CORRECT (Using BUNX - Will Work)

```bash
/app/backend # bunx prisma migrate deploy
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
✓ Migration successful!
```

## Why This Happens

```
Docker Build Process
├── Stage 1: frontend-builder (node:20-alpine)
│   └── Builds React frontend
│
├── Stage 2: backend-builder (oven/bun:1-alpine)
│   └── Installs Bun dependencies
│
└── Stage 3: production (oven/bun:1-alpine)  ← YOU ARE HERE
    ├── ✓ Copies built frontend
    ├── ✓ Copies backend code
    ├── ✓ Has Bun runtime
    └── ✗ Does NOT have Node.js/npm/npx
```

## Architecture Diagram

```
┌───────────────────────────────────────────────┐
│  Coolify Production Container                 │
├───────────────────────────────────────────────┤
│                                               │
│  /app/                                        │
│  ├── frontend/                                │
│  │   └── dist/  (Built by Node.js stage)     │
│  │                                            │
│  └── backend/                                 │
│      ├── src/  (TypeScript)                   │
│      ├── prisma/                              │
│      │   ├── schema.prisma                    │
│      │   └── migrations/                      │
│      └── node_modules/                        │
│          └── .bin/                            │
│              └── prisma  (binary)             │
│                                               │
│  Runtime: Bun (NOT Node.js)                   │
│  Commands: bunx, bun (NOT npx, npm)           │
└───────────────────────────────────────────────┘
```

## Complete Command Reference

### Migration Commands

```bash
# Deploy migrations
bunx prisma migrate deploy

# Check migration status
bunx prisma migrate status

# Generate Prisma client
bunx prisma generate

# View database schema
bunx prisma db pull
```

### Seed Commands

```bash
# Seed all data
bun run prisma:seed

# Seed AI models
bun run seed:ai-models

# Seed pose generator
bun run seed:pose-generator
```

### Diagnostic Commands

```bash
# Check Bun version
bun --version

# List Prisma binary
ls -la node_modules/.bin/prisma

# Test database connection
bunx prisma migrate status
```

## Troubleshooting Decision Tree

```
┌─────────────────────────────────────────┐
│ Does "bunx" command work?               │
└───────┬─────────────────────────────────┘
        │
   ┌────┴────┐
   │         │
  YES       NO
   │         │
   │    ┌────┴─────────────────────────────┐
   │    │ Try direct binary:               │
   │    │ ./node_modules/.bin/prisma       │
   │    └────┬─────────────────────────────┘
   │         │
   │    ┌────┴────┐
   │    │         │
   │   YES       NO
   │    │         │
   │    │    ┌────┴─────────────────────────┐
   │    │    │ Try package script:          │
   │    │    │ bun run prisma:migrate:deploy│
   │    │    └──────────────────────────────┘
   │    │
   ▼    ▼
┌──────────────────────────────────────────┐
│ ✓ SUCCESS - Migration deployed          │
└──────────────────────────────────────────┘
```

## Common Errors & Solutions

### Error 1: "bunx: command not found"

**Cause**: Bun not installed or PATH issue

**Solution**:
```bash
# Check Bun is available
which bun

# If not, use direct binary
./node_modules/.bin/prisma migrate deploy
```

### Error 2: "Cannot find module '@prisma/client'"

**Cause**: Prisma client not generated

**Solution**:
```bash
# Generate Prisma client first
bunx prisma generate

# Then run migration
bunx prisma migrate deploy
```

### Error 3: "Can't reach database server"

**Cause**: DATABASE_URL not set or incorrect

**Solution**:
```bash
# Check environment variable
echo $DATABASE_URL

# Verify in Coolify UI:
# Settings → Environment Variables → DATABASE_URL
```

### Error 4: "Migration file not found"

**Cause**: Migration files not copied to container

**Solution**:
```bash
# Check migrations exist
ls -la prisma/migrations/

# If empty, redeploy application in Coolify
```

## Success Checklist

After running migration, verify:

- [ ] Command completes without errors
- [ ] Output shows "All migrations have been successfully applied"
- [ ] `bunx prisma migrate status` shows no pending migrations
- [ ] Application restarts successfully
- [ ] Dashboard loads without errors
- [ ] API endpoints return data correctly

## Quick Reference Card

```
┌──────────────────────────────────────────────┐
│  LUMIKU PRODUCTION COMMANDS                  │
├──────────────────────────────────────────────┤
│                                              │
│  Package Manager:  Bun (NOT npm)             │
│  Runtime:          Bun (NOT Node.js)         │
│                                              │
│  MIGRATION:                                  │
│  bunx prisma migrate deploy                  │
│                                              │
│  STATUS:                                     │
│  bunx prisma migrate status                  │
│                                              │
│  SEED:                                       │
│  bun run prisma:seed                         │
│                                              │
│  WORKING DIR:                                │
│  cd /app/backend                             │
│                                              │
└──────────────────────────────────────────────┘
```

## Copy-Paste Quick Fix

**Just copy and paste this into Coolify terminal:**

```bash
cd /app/backend && bunx prisma migrate deploy && echo "✓ Done!"
```

That's it! 🎉
