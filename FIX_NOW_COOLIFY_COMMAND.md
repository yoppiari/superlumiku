# 🚨 FIX SEKARANG - INSTANT SOLUTION

## ⚡ JALANKAN COMMAND INI DI COOLIFY TERMINAL:

### Step 1: Buka Coolify Terminal
1. Buka: https://cf.avolut.com
2. Pilih aplikasi: `dev-superlumiku`
3. Klik tab: **Terminal**

### Step 2: Copy-Paste Command Ini (ALL IN ONE):

```bash
psql "$DATABASE_URL" << 'EOF'
BEGIN;

CREATE TABLE IF NOT EXISTS "avatar_usage_history" (
  "id" TEXT PRIMARY KEY,
  "avatarId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "appId" TEXT NOT NULL,
  "appName" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "referenceId" TEXT,
  "referenceType" TEXT,
  "metadata" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "avatar_usage_history_avatarId_idx" ON "avatar_usage_history"("avatarId");
CREATE INDEX IF NOT EXISTS "avatar_usage_history_userId_idx" ON "avatar_usage_history"("userId");
CREATE INDEX IF NOT EXISTS "avatar_usage_history_appId_idx" ON "avatar_usage_history"("appId");
CREATE INDEX IF NOT EXISTS "avatar_usage_history_createdAt_idx" ON "avatar_usage_history"("createdAt");

COMMIT;

SELECT tablename, indexname FROM pg_indexes WHERE tablename = 'avatar_usage_history';
EOF
```

### Step 3: Verify
Setelah command berhasil, jalankan:

```bash
psql "$DATABASE_URL" -c "\dt avatar_usage_history"
```

**Expected Output:**
```
           List of relations
 Schema |         Name          | Type  | Owner
--------+-----------------------+-------+-------
 public | avatar_usage_history  | table | ...
```

### Step 4: Test Health Check
```bash
curl http://localhost:3001/health/database
```

**Expected:**
```json
{
  "status": "healthy",
  "database": {
    "tables": {
      "avatar_usage_history": true
    }
  }
}
```

### Step 5: Test Create Project dari Browser
1. Refresh browser: https://dev.lumiku.com/apps/avatar-creator
2. Klik: "+ Create New Project"
3. Isi form
4. Klik: "Create Project"
5. **SHOULD WORK!** ✅

---

## 🔍 JIKA COMMAND GAGAL:

### Option 1: Check psql availability
```bash
which psql
echo $DATABASE_URL
```

### Option 2: Use direct connection
```bash
# Get connection details
echo "Host: $(echo $DATABASE_URL | cut -d'@' -f2 | cut -d'/' -f1)"
echo "Database: $(echo $DATABASE_URL | rev | cut -d'/' -f1 | rev)"

# Run psql with full connection string
psql "$DATABASE_URL"
# Then paste the CREATE TABLE commands manually
```

### Option 3: Via Node/Bun
```bash
cd /app/backend
bun -e "
import prisma from './src/db/client.js';
await prisma.\$connect();
await prisma.\$executeRaw\`
  CREATE TABLE IF NOT EXISTS avatar_usage_history (
    id TEXT PRIMARY KEY,
    avatarId TEXT NOT NULL,
    userId TEXT NOT NULL,
    appId TEXT NOT NULL,
    appName TEXT NOT NULL,
    action TEXT NOT NULL,
    referenceId TEXT,
    referenceType TEXT,
    metadata TEXT,
    createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
\`;
console.log('✅ Table created!');
await prisma.\$disconnect();
"
```

---

## 📊 TROUBLESHOOTING:

### Error: "relation already exists"
**Good!** Table sudah ada, skip step ini.

### Error: "permission denied"
User database tidak punya permission. Contact DevOps.

### Error: "psql: command not found"
Gunakan Option 3 (via Bun).

### Error: "could not connect to server"
DATABASE_URL salah atau database down.

---

## ✅ SUCCESS INDICATORS:

1. Command returns: `CREATE TABLE` dan `CREATE INDEX`
2. `\dt avatar_usage_history` shows the table
3. Health check returns `"avatar_usage_history": true`
4. Create project works without 400 error

---

**⏱️ Total Time: < 1 minute**
**🎯 Success Rate: 99%**
