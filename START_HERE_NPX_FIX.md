# START HERE: Fix "npx: not found" Error

## 🚨 IMMEDIATE FIX (30 Seconds)

### 1. Open Coolify Terminal
- Go to: https://cf.avolut.com
- Navigate to: Applications → lumiku-backend → Terminal

### 2. Copy This Command
```bash
cd /app/backend && bunx prisma migrate deploy
```

### 3. Paste in Terminal and Press Enter

### 4. Done! ✓

You should see:
```
All migrations have been successfully applied.
```

---

## 📋 What Happened?

**Error You Saw:**
```
sh: npx: not found
```

**Why It Happened:**
- Your container uses **Bun** runtime, not Node.js
- `npx` is a Node.js/npm tool
- Bun uses `bunx` instead

**The Fix:**
- Replace `npx` with `bunx`
- Everything else stays the same

---

## 📁 Files Created for You

### Quick Reference
- **COOLIFY_TERMINAL_COPY_PASTE.txt** - Commands to copy-paste
- **FIX_NPX_NOT_FOUND.txt** - Detailed instructions
- **VISUAL_FIX_GUIDE.md** - Step-by-step visual guide

### Advanced Options
- **COOLIFY_MIGRATION_COMMANDS.txt** - All alternative commands
- **DEPLOY_VIA_API.md** - API-based deployment methods
- **NPX_NOT_FOUND_DIAGNOSTIC.sh** - Diagnostic script
- **EXECUTIVE_SUMMARY_NPX_FIX.md** - Technical analysis

---

## 🔄 Command Translation

| You Typed (NPM) | Use This (Bun) |
|-----------------|----------------|
| `npx prisma migrate deploy` | `bunx prisma migrate deploy` |
| `npx prisma migrate status` | `bunx prisma migrate status` |
| `npm run dev` | `bun run dev` |
| `npm install` | `bun install` |

---

## ✅ Verification Steps

After running the migration:

```bash
# Check status
bunx prisma migrate status

# Expected output:
# "All migrations have been successfully applied."
```

---

## 🔧 Alternative Solutions

If `bunx` doesn't work:

### Option 1: Direct Binary
```bash
cd /app/backend
./node_modules/.bin/prisma migrate deploy
```

### Option 2: Package Script
```bash
cd /app/backend
bun run prisma:migrate:deploy
```

### Option 3: Bun Command
```bash
cd /app/backend
bun prisma migrate deploy
```

---

## 🎯 Complete Workflow

```bash
# Step 1: Navigate
cd /app/backend

# Step 2: Deploy migrations
bunx prisma migrate deploy

# Step 3: Verify
bunx prisma migrate status

# Step 4: Seed database (if needed)
bun run prisma:seed

# Step 5: Seed AI models (if needed)
bun run seed:ai-models
```

---

## 🐛 Troubleshooting

### "bunx: command not found"
**Fix**: Use direct binary
```bash
./node_modules/.bin/prisma migrate deploy
```

### "Cannot find module '@prisma/client'"
**Fix**: Generate Prisma client first
```bash
bunx prisma generate
bunx prisma migrate deploy
```

### "Can't reach database server"
**Fix**: Check DATABASE_URL in Coolify settings
- Go to: Settings → Environment Variables
- Verify: DATABASE_URL is set correctly

### "Permission denied"
**Fix**: This is normal, container runs as non-root user
- Try: `bun run prisma:migrate:deploy`

---

## 📊 System Architecture

```
Production Container (oven/bun:1-alpine)
├── Runtime: Bun (NOT Node.js)
├── Package Manager: Bun (NOT npm)
├── Available Commands:
│   ✓ bun
│   ✓ bunx
│   ✗ node
│   ✗ npm
│   ✗ npx
└── Location: /app/backend
```

---

## 🎓 Why Bun?

Benefits of using Bun instead of Node.js:
1. **3x faster startup** - Better for containers
2. **Lower memory usage** - More efficient
3. **Built-in TypeScript** - No compilation needed
4. **Better performance** - Native code execution
5. **Smaller image size** - Optimized for production

---

## 📞 Support

If you still have issues:

1. **Check Dockerfile**: `C:\Users\yoppi\Downloads\Lumiku App\Dockerfile`
2. **View logs**: In Coolify → Logs tab
3. **Read detailed guides**: See files listed above
4. **Test connection**: `bunx prisma migrate status`

---

## 🎯 Success Criteria

You know it worked when:
- ✅ Command runs without "not found" error
- ✅ Migration output shows success message
- ✅ `bunx prisma migrate status` shows no pending migrations
- ✅ Application loads without errors
- ✅ Dashboard displays correctly

---

## 💡 Key Takeaways

1. **Always use `bunx` instead of `npx`** in production
2. **Container uses Bun runtime**, not Node.js
3. **All npm commands have Bun equivalents**
4. **Prisma works perfectly with Bun**
5. **No need to rebuild image** - just use correct commands

---

## 🚀 Next Steps

After fixing the migration:

1. **Verify application works**
   ```bash
   curl https://dev.lumiku.com/health
   ```

2. **Test dashboard**
   - Open: https://dev.lumiku.com
   - Login and check all features work

3. **Update documentation**
   - Replace `npx` with `bunx` in all docs
   - Update deployment guides

4. **Train team**
   - Share this guide with team
   - Update onboarding materials

---

## 📝 Quick Commands Cheat Sheet

```bash
# MIGRATION
bunx prisma migrate deploy

# STATUS
bunx prisma migrate status

# SEED
bun run prisma:seed

# GENERATE CLIENT
bunx prisma generate

# VIEW SCHEMA
bunx prisma studio

# CHECK BUN VERSION
bun --version

# LIST MIGRATIONS
ls -la prisma/migrations/
```

---

## 🔗 Related Files

- Dockerfile: `C:\Users\yoppi\Downloads\Lumiku App\Dockerfile`
- Backend Dockerfile: `C:\Users\yoppi\Downloads\Lumiku App\backend\Dockerfile`
- Package.json: `C:\Users\yoppi\Downloads\Lumiku App\backend\package.json`
- Prisma Schema: `C:\Users\yoppi\Downloads\Lumiku App\backend\prisma\schema.prisma`

---

## 📅 Summary

- **Problem**: `npx: not found` error
- **Cause**: Container uses Bun, not Node.js
- **Solution**: Use `bunx` instead of `npx`
- **Time to Fix**: 30 seconds
- **Difficulty**: Easy
- **Impact**: Enables database migrations

---

**TL;DR**: Replace `npx` with `bunx`. That's the entire fix. Copy command from top of this file and paste in Coolify terminal.

---

*Last Updated: 2025-10-16*
*App ID: d8ggwoo484k8ok48g8k8cgwk*
*Environment: Production (Coolify)*
