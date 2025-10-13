# 🎯 Setup Enterprise Users untuk 4 Orang

**Tujuan:** Memberikan akses UNLIMITED ke Video Mixer dan Carousel Mix tanpa credit charge

**Users:**
1. ardianfaisal.id@gmail.com
2. iqbal.elvo@gmail.com
3. galuh.inteko@gmail.com
4. dilla.inteko@gmail.com

---

## ⚡ Quick Setup (Production - app.lumiku.com)

### **Step 1: Login ke Coolify Terminal**

1. Buka Coolify: `https://cf.avolut.com`
2. Go to Application: **SuperLumiku**
3. Click **Terminal** tab
4. Select container: **app** (SuperLumiku)

---

### **Step 2: Run Script**

Copy-paste command ini di terminal:

```bash
bun run backend/scripts/create-enterprise-users.ts
```

**Expected Output:**
```
🚀 Creating Enterprise Users...

📋 Step 1: Checking Enterprise Subscription Plan...
   ✅ Enterprise plan exists

👤 Creating user: ardianfaisal.id@gmail.com
   ✅ User created
   ✅ Subscription created (expires: 1 year)
   ✅ Daily quota initialized (500/day)
   ✅ Bonus credits added (1000 credits backup)
   📧 Email: ardianfaisal.id@gmail.com
   🔑 Password: Lumiku2025!

👤 Creating user: iqbal.elvo@gmail.com
   ✅ User created
   ...

✅ All enterprise users created!
```

---

## 📧 Login Credentials

Setelah script selesai, credentials untuk 4 users:

| Email | Password | Tier |
|-------|----------|------|
| ardianfaisal.id@gmail.com | `Lumiku2025!` | Enterprise |
| iqbal.elvo@gmail.com | `Lumiku2025!` | Enterprise |
| galuh.inteko@gmail.com | `Lumiku2025!` | Enterprise |
| dilla.inteko@gmail.com | `Lumiku2025!` | Enterprise |

**⚠️ IMPORTANT:** Share credentials securely! Users harus ganti password setelah login pertama.

---

## ✅ What They Get

### **Account Type:**
- ✅ **Subscription** (NOT Pay-as-you-go)
- ✅ Tier: **Enterprise** (highest)
- ✅ Daily Quota: **500 generations/day**
- ✅ Subscription: **Active for 1 year**

### **Apps Access (NO CREDIT CHARGE!):**

#### **Video Mixer** ✅ FREE
- Mix unlimited videos
- All features unlocked
- No credit deduction
- Uses quota system

#### **Carousel Mix** ✅ FREE
- Generate unlimited carousels
- All templates available
- No credit deduction
- Uses quota system

#### **Bonus Access:**
- ✅ Looping Flow
- ✅ Video Generator (quota-based)
- ✅ Poster Editor (quota-based)
- ✅ ALL AI models (including Pro & Enterprise tier)

---

## 🎯 How It Works

### **For Video Mixer & Carousel Mix:**

**Traditional (PAYG users):**
```
Generate → Deduct 2 credits → Balance reduced
```

**Enterprise (These 4 users):**
```
Generate → Use 1 quota → Quota reduces (NOT credits!)
Quota resets daily at 00:00 UTC
```

### **Daily Quota System:**

```
Start of day: 500 quota available
After 10 generations: 490 quota remaining
After 100 generations: 400 quota remaining
...
Midnight UTC: Reset to 500 quota
```

**Key Difference:**
- ❌ NOT charged credits
- ✅ Uses daily quota
- 🔄 Auto-reset every day

---

## 📊 Verify Users Created

### **Via Terminal (Coolify):**

```bash
# Check users
bun run backend/scripts/check-enterprise-users.ts

# Or via database directly
```

### **Via Database Query:**

```bash
# Connect to database
docker exec -it <postgres-container> psql -U postgres -d postgres

# Check enterprise users
SELECT email, "accountType", "subscriptionTier"
FROM users
WHERE email IN (
  'ardianfaisal.id@gmail.com',
  'iqbal.elvo@gmail.com',
  'galuh.inteko@gmail.com',
  'dilla.inteko@gmail.com'
);

# Should return:
# email                        | accountType  | subscriptionTier
# ----------------------------+-------------+-----------------
# ardianfaisal.id@gmail.com   | subscription | enterprise
# iqbal.elvo@gmail.com        | subscription | enterprise
# galuh.inteko@gmail.com      | subscription | enterprise
# dilla.inteko@gmail.com      | subscription | enterprise
```

---

## 🧪 Test Instructions for Users

### **Step 1: Login**

1. Go to: `https://app.lumiku.com`
2. Login dengan credentials di atas
3. Ganti password (Settings → Change Password)

### **Step 2: Test Video Mixer**

1. Go to Dashboard
2. Click **Video Mixer**
3. Upload videos
4. Generate
5. **Check:** Credits should NOT decrease!

### **Step 3: Test Carousel Mix**

1. Go to Dashboard
2. Click **Carousel Mix**
3. Upload images
4. Add text
5. Generate
6. **Check:** Credits should NOT decrease!

### **Step 4: Check Quota**

1. Go to Dashboard
2. Check quota display (should show 500/day)
3. After generation, quota decreases (e.g., 499/500)
4. Credits remain unchanged

---

## 🔧 Troubleshooting

### **User Already Exists?**

Script will **UPDATE** existing user to Enterprise:
```
⚠️  User already exists: email@example.com
🔄 Updating to Enterprise subscription...
✅ Updated to Enterprise subscription
```

No problem! User will be upgraded.

### **Script Fails?**

**Common issues:**

1. **Database not connected:**
   ```bash
   # Check database connection
   bunx prisma db pull
   ```

2. **Prisma Client not generated:**
   ```bash
   # Regenerate Prisma Client
   bunx prisma generate
   ```

3. **Migration not applied:**
   ```bash
   # Run migrations
   bunx prisma migrate deploy
   ```

### **Users Can't Login?**

Check:
1. Email correct (case-sensitive)
2. Password: `Lumiku2025!` (exactly)
3. Account created (check database)
4. Subscription active (check subscriptions table)

---

## 📝 Important Notes

### **1. Subscription Duration**

- **Created:** Today
- **Expires:** 1 year from today
- **Auto-renewal:** Enabled
- **Next billing:** 30 days (but won't be charged in this setup)

### **2. Quota Management**

- **Daily limit:** 500 generations
- **Reset time:** 00:00 UTC every day
- **Carry over:** No (resets to 500 daily)

### **3. Credits (Backup)**

Each user also gets 1000 bonus credits as backup. But they won't need it because:
- Enterprise users use **quota**, not credits
- Credits are only for PAYG users

### **4. Model Access**

Enterprise tier = Access to ALL models:
- ✅ Free tier models
- ✅ Basic tier models
- ✅ Pro tier models
- ✅ Enterprise tier models

---

## 🎁 Summary

| Feature | Value |
|---------|-------|
| **Account Type** | Subscription |
| **Tier** | Enterprise |
| **Daily Quota** | 500 generations |
| **Credit Charge** | ❌ None (uses quota) |
| **Video Mixer** | ✅ FREE |
| **Carousel Mix** | ✅ FREE |
| **Subscription** | Active for 1 year |
| **Auto-renewal** | Enabled |

---

## ✅ Checklist

Setelah run script, verify:

- [ ] All 4 users created successfully
- [ ] Each user has Enterprise subscription
- [ ] Daily quota = 500 for each user
- [ ] Subscription status = active
- [ ] Subscription expires in 1 year
- [ ] Users can login to app.lumiku.com
- [ ] Video Mixer works without credit charge
- [ ] Carousel Mix works without credit charge
- [ ] Quota decreases after generation (not credits)

---

## 🚀 Ready to Run!

**Command to run in Production:**

```bash
# In Coolify Terminal (SuperLumiku container)
bun run backend/scripts/create-enterprise-users.ts
```

**Time:** ~5 seconds
**Impact:** Zero downtime
**Reversible:** Yes (can delete users or downgrade)

---

**Questions?** Check logs or database tables:
- `users` - Check account type and tier
- `subscriptions` - Check subscription status
- `quota_usages` - Check daily quota
- `credits` - Check credit balance (should not decrease)

🎉 **Enjoy unlimited access!**
