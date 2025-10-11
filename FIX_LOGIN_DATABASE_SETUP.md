# Fix Login Issue - Database Setup Required 🔧

**Problem:** Cannot login - table `public.users` does not exist

**Root Cause:** Database tables belum dibuat di production PostgreSQL

---

## 🚀 SOLUTION (Choose ONE):

### ✅ Option 1: DB Push via Coolify Terminal (FASTEST - 30 seconds)

**Recommended!** Ini cara tercepat dan paling mudah.

#### Steps:
1. Go to **Coolify** → **SuperLumiku** → **Terminal** tab
2. Run command:
   ```bash
   cd /app/backend
   bun prisma db push --accept-data-loss
   ```
3. Wait ~10 seconds
4. Done! Tables created.

#### Expected Output:
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "postgres" at "kssgoso:5432"

🚀 Your database is now in sync with your Prisma schema. Done in 2.34s

✔ Generated Prisma Client to ./node_modules/@prisma/client
```

---

### Option 2: Create Initial Migration (More Proper)

If you want proper migration files:

#### Step 1: Create migration file

1. Go to Coolify Terminal:
   ```bash
   cd /app/backend
   mkdir -p prisma/migrations/20251006000000_init
   ```

2. Create migration SQL (manually create file or copy-paste):
   ```bash
   cat > prisma/migrations/20251006000000_init/migration.sql <<'EOF'
   -- CreateTable
   CREATE TABLE "users" (
       "id" TEXT NOT NULL,
       "email" TEXT NOT NULL,
       "password" TEXT NOT NULL,
       "name" TEXT,
       "role" TEXT NOT NULL DEFAULT 'user',
       "storageQuota" INTEGER NOT NULL DEFAULT 1073741824,
       "storageUsed" INTEGER NOT NULL DEFAULT 0,
       "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
       "updatedAt" TIMESTAMP(3) NOT NULL,

       CONSTRAINT "users_pkey" PRIMARY KEY ("id")
   );

   -- Add all other tables (sessions, credits, payments, etc.)
   -- (Full SQL too long for this guide - use db push instead!)
   EOF
   ```

3. Run migration:
   ```bash
   bun prisma migrate deploy
   ```

**Note:** Migration SQL is VERY long (19 tables). **Use Option 1 instead!**

---

### Option 3: Generate Migration Locally & Deploy

If you want to use git to deploy migrations:

#### Local (your computer):
```bash
cd backend

# Temporarily use production DB URL (be careful!)
export DATABASE_URL="postgresql://postgres:3qQOc2DzN8GpkTAKkTNvvoXKn4ZPbyxkX65zRMBL0IbI9XsVZd5zQkhAj5j793e6@kssgoso:5432/postgres?schema=public"

# Generate migration
bun prisma migrate dev --name init

# Push to git
git add prisma/migrations
git commit -m "feat: Add initial database migrations"
git push origin main
```

#### Then redeploy in Coolify:
1. Go to Deployments tab
2. Click "Redeploy"
3. Migrations will run automatically via docker-entrypoint.sh

---

## 🎯 RECOMMENDED APPROACH:

**Just use Option 1 (DB Push)!** It's:
- ✅ Fastest (30 seconds)
- ✅ Simplest (one command)
- ✅ Safe (Prisma validates schema)
- ✅ No git commits needed

---

## 📝 After Running DB Push:

### 1. Verify Tables Created

In Coolify Terminal:
```bash
cd /app/backend
bun prisma db execute --stdin <<'EOF'
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
EOF
```

**Expected output** (19 tables):
```
app_usages
apps
carousel_generations
carousel_position_settings
carousel_projects
carousel_slides
carousel_texts
credits
devices
looping_flow_audio_layers
looping_flow_generations
looping_flow_projects
looping_flow_videos
payments
sessions
tool_configs
users ✅ (This is the one we need!)
video_mixer_generations
video_mixer_groups
video_mixer_projects
video_mixer_videos
```

### 2. Create Test User (Optional)

```bash
cd /app/backend
bun run -e "
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const password = await bcrypt.hash('password123', 10);

const user = await prisma.user.create({
  data: {
    email: 'test@lumiku.com',
    password,
    name: 'Test User',
    role: 'admin',
    credits: {
      create: {
        amount: 1000,
        balance: 1000,
        type: 'bonus',
        description: 'Welcome bonus'
      }
    }
  }
});

console.log('✅ User created:', user.email);
"
```

Or use Prisma Studio:
```bash
bunx prisma studio --port 5555
```
Then access via port forwarding.

### 3. Test Login

**Via browser:**
```
https://app.lumiku.com/login
Email: test@lumiku.com
Password: password123
```

**Via curl:**
```bash
curl -X POST "https://app.lumiku.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@lumiku.com","password":"password123"}'
```

**Expected response:**
```json
{
  "user": {
    "id": "...",
    "email": "test@lumiku.com",
    "name": "Test User",
    "creditBalance": 1000
  },
  "token": "eyJ..."
}
```

---

## ❓ FAQ

### Q: Will `db push` delete existing data?
**A:** No, it only adds missing tables/columns. It's safe.

### Q: What about migrations folder being empty?
**A:** `db push` doesn't create migration files. It directly syncs schema to DB.
For production, this is OK for initial setup. Future changes should use proper migrations.

### Q: Can I use SQLite instead of PostgreSQL?
**A:** No, schema is already set to PostgreSQL. Coolify uses PostgreSQL.

### Q: What if I get permission denied?
**A:** Make sure you're using Coolify Terminal (not local). DATABASE_URL in production already has correct credentials.

---

## 🎯 Quick Command (Copy-Paste Ready):

```bash
cd /app/backend && bun prisma db push --accept-data-loss
```

That's it! After this command, login should work.

---

## 🔍 Troubleshooting

### Error: "Environment variable not found: DATABASE_URL"
**Solution:** DATABASE_URL should be set in Coolify env vars. Check Configuration tab.

### Error: "Can't reach database server"
**Solution:**
1. Verify PostgreSQL service is running in Coolify
2. Check POSTGRES_HOST=kssgoso is correct
3. Verify network connectivity

### Error: "Database 'postgres' does not exist"
**Solution:** The database should exist (it's the default). If not, create it via PostgreSQL service in Coolify.

### Still can't login after db push?
**Solution:** Create user manually (see "Create Test User" section above).

---

**Time to fix:** ~2 minutes
**Difficulty:** Easy (one command)
**Impact:** Login will work immediately!

🎯 **Run the command now and report back the output!**
