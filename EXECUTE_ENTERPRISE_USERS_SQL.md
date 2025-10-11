# 🚀 Execute Enterprise Users SQL Script

**Status:** Ready to execute
**Time Required:** 2 minutes
**Impact:** Creates 4 enterprise users with 100,000 credits each

---

## ✅ Quick Execution Steps

### **Step 1: Open Coolify Terminal**

1. Go to: `https://cf.avolut.com`
2. Login
3. Navigate to **Applications** → **SuperLumiku** (jws8c80ckos00og0cos4cw8s)
4. Click **Terminal** tab
5. Select container: **app** (SuperLumiku)

---

### **Step 2: Connect to PostgreSQL**

In the Coolify terminal, run:

```bash
# Get PostgreSQL connection string from env
echo $DATABASE_URL
```

**Expected output:**
```
postgresql://postgres:YOUR_PASSWORD@postgres:5432/postgres
```

---

### **Step 3: Execute SQL Script**

#### **Method 1: Direct psql Command (Recommended)**

Copy and paste this ENTIRE block into the Coolify terminal:

```bash
cat << 'EOF' | psql $DATABASE_URL
-- User 1: ardianfaisal.id@gmail.com
INSERT INTO users (id, email, password, name, role, "storageQuota", "storageUsed", "createdAt", "updatedAt")
VALUES (
  'ent-user-001',
  'ardianfaisal.id@gmail.com',
  '$2b$10$U9Xn0SzBi6xBAdD.25JzbeYHyCdDNyvTM8tEkr5P33z0iRreJ53bi',
  'Ardian Faisal',
  'user',
  10737418240,
  0,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- User 2: iqbal.elvo@gmail.com
INSERT INTO users (id, email, password, name, role, "storageQuota", "storageUsed", "createdAt", "updatedAt")
VALUES (
  'ent-user-002',
  'iqbal.elvo@gmail.com',
  '$2b$10$U9Xn0SzBi6xBAdD.25JzbeYHyCdDNyvTM8tEkr5P33z0iRreJ53bi',
  'Iqbal Elvo',
  'user',
  10737418240,
  0,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- User 3: galuh.inteko@gmail.com
INSERT INTO users (id, email, password, name, role, "storageQuota", "storageUsed", "createdAt", "updatedAt")
VALUES (
  'ent-user-003',
  'galuh.inteko@gmail.com',
  '$2b$10$U9Xn0SzBi6xBAdD.25JzbeYHyCdDNyvTM8tEkr5P33z0iRreJ53bi',
  'Galuh Inteko',
  'user',
  10737418240,
  0,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- User 4: dilla.inteko@gmail.com
INSERT INTO users (id, email, password, name, role, "storageQuota", "storageUsed", "createdAt", "updatedAt")
VALUES (
  'ent-user-004',
  'dilla.inteko@gmail.com',
  '$2b$10$U9Xn0SzBi6xBAdD.25JzbeYHyCdDNyvTM8tEkr5P33z0iRreJ53bi',
  'Dilla Inteko',
  'user',
  10737418240,
  0,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Give each user 100000 credits
INSERT INTO credits (id, "userId", amount, balance, type, description, "createdAt")
SELECT
  'credit-' || id,
  id,
  100000,
  100000,
  'bonus',
  'Enterprise unlimited credits',
  NOW()
FROM users
WHERE email IN (
  'ardianfaisal.id@gmail.com',
  'iqbal.elvo@gmail.com',
  'galuh.inteko@gmail.com',
  'dilla.inteko@gmail.com'
)
ON CONFLICT DO NOTHING;

-- Verify users created
SELECT email, name, role FROM users WHERE email IN (
  'ardianfaisal.id@gmail.com',
  'iqbal.elvo@gmail.com',
  'galuh.inteko@gmail.com',
  'dilla.inteko@gmail.com'
);
EOF
```

**Expected Output:**
```
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 4
                  email                  |      name      | role
-----------------------------------------+----------------+------
 ardianfaisal.id@gmail.com              | Ardian Faisal  | user
 iqbal.elvo@gmail.com                   | Iqbal Elvo     | user
 galuh.inteko@gmail.com                 | Galuh Inteko   | user
 dilla.inteko@gmail.com                 | Dilla Inteko   | user
(4 rows)
```

---

#### **Method 2: Interactive psql (Alternative)**

If Method 1 doesn't work:

```bash
# 1. Connect to PostgreSQL
psql $DATABASE_URL

# 2. Paste SQL commands one by one
# (Copy from create-enterprise-users-simple.sql)

# 3. Exit when done
\q
```

---

### **Step 4: Verify Credits Assigned**

```bash
cat << 'EOF' | psql $DATABASE_URL
SELECT
  u.email,
  u.name,
  c.balance as credits
FROM users u
LEFT JOIN credits c ON c."userId" = u.id
WHERE u.email IN (
  'ardianfaisal.id@gmail.com',
  'iqbal.elvo@gmail.com',
  'galuh.inteko@gmail.com',
  'dilla.inteko@gmail.com'
);
EOF
```

**Expected Output:**
```
                  email                  |      name      | credits
-----------------------------------------+----------------+---------
 ardianfaisal.id@gmail.com              | Ardian Faisal  | 100000
 iqbal.elvo@gmail.com                   | Iqbal Elvo     | 100000
 galuh.inteko@gmail.com                 | Galuh Inteko   | 100000
 dilla.inteko@gmail.com                 | Dilla Inteko   | 100000
(4 rows)
```

---

## 📧 Login Credentials

After successful execution, share these credentials:

| Email | Password | Credits |
|-------|----------|---------|
| ardianfaisal.id@gmail.com | `Lumiku2025!` | 100,000 |
| iqbal.elvo@gmail.com | `Lumiku2025!` | 100,000 |
| galuh.inteko@gmail.com | `Lumiku2025!` | 100,000 |
| dilla.inteko@gmail.com | `Lumiku2025!` | 100,000 |

**⚠️ Important Notes:**
- Password is **case-sensitive**: `Lumiku2025!`
- Each user has **100,000 credits** (effectively unlimited for Video Mixer & Carousel Mix)
- Users should change password after first login

---

## 🧪 Test Login

### **Step 1: Test Login for Each User**

1. Go to: `https://app.lumiku.com`
2. Click **Login**
3. Enter credentials:
   - Email: `ardianfaisal.id@gmail.com`
   - Password: `Lumiku2025!`
4. Click **Sign In**

**Expected:** Successfully logged in to dashboard

---

### **Step 2: Verify Credits in Dashboard**

After login:
1. Check top-right corner for credit balance
2. Should show: **100,000 credits**

---

### **Step 3: Test Video Mixer**

1. Click **Video Mixer** from dashboard
2. Upload test videos
3. Click **Generate**
4. **Verify:** Credits should decrease (100,000 → 99,998)

---

### **Step 4: Test Carousel Mix**

1. Click **Carousel Mix** from dashboard
2. Upload test images
3. Add text
4. Click **Generate**
5. **Verify:** Credits should decrease

---

## 🔧 Troubleshooting

### **Issue 1: psql command not found**

**Solution:**
```bash
# Check if PostgreSQL client is installed
which psql

# If not found, use docker exec instead:
docker exec -it <postgres-container-name> psql -U postgres -d postgres
```

### **Issue 2: Users already exist**

**Output:**
```
INSERT 0 0  (instead of INSERT 0 1)
```

**Meaning:** Users already created (ON CONFLICT DO NOTHING)

**Verify:**
```bash
cat << 'EOF' | psql $DATABASE_URL
SELECT email, name FROM users WHERE email LIKE '%@gmail.com';
EOF
```

### **Issue 3: Credits table doesn't exist**

**Error:**
```
ERROR: relation "credits" does not exist
```

**Solution:**
```bash
# Run migrations first
bunx prisma migrate deploy

# Then retry SQL script
```

### **Issue 4: DATABASE_URL not set**

**Solution:**
```bash
# Manually set DATABASE_URL
export DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@postgres:5432/postgres"

# Get password from Coolify env variables
```

---

## ✅ Success Checklist

After execution, verify:

- [x] SQL script executed without errors
- [x] 4 users created (INSERT 0 1 × 4)
- [x] Credits assigned (INSERT 0 4)
- [x] Verification query shows 4 users
- [x] Each user has 100,000 credits
- [x] All 4 users can login to app.lumiku.com
- [x] Video Mixer works (credits decrease)
- [x] Carousel Mix works (credits decrease)

---

## 📊 What Each User Gets

| Feature | Value |
|---------|-------|
| **Credits** | 100,000 (effectively unlimited) |
| **Storage Quota** | 10GB |
| **Video Mixer** | ✅ Full access (2 credits/generation) |
| **Carousel Mix** | ✅ Full access (2 credits/generation) |
| **Looping Flow** | ✅ Full access |
| **Video Generator** | ✅ Full access |
| **Poster Editor** | ✅ Full access |
| **AI Models** | ✅ All models available |

**Usage Calculation:**
- 100,000 credits ÷ 2 credits per generation = **50,000 generations**
- At 10 generations/day = **~13 years of usage**

---

## 🎯 Summary

**Command to Run:**
```bash
cat << 'EOF' | psql $DATABASE_URL
[PASTE SQL FROM METHOD 1 ABOVE]
EOF
```

**Time:** ~30 seconds
**Impact:** 4 enterprise users created
**Reversible:** Yes (can delete users with DELETE FROM users WHERE id LIKE 'ent-user-%')

---

## 📝 Next Steps After Execution

1. ✅ Share credentials with 4 users
2. ✅ Ask them to test login
3. ✅ Ask them to change password (Settings → Change Password)
4. ✅ Monitor credit usage in admin dashboard
5. ✅ Top up credits if needed (when balance < 10,000)

---

**Status:** Ready to execute! 🚀

**Quick Start:** Copy Method 1 command block and paste in Coolify terminal.
