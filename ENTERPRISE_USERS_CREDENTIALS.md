# 🎉 Enterprise Users - Login Credentials

**Status:** ✅ **Successfully Created**
**Date:** 2025-10-10
**Environment:** Production (app.lumiku.com)

---

## 📧 Login Credentials

| No | Email | Password | Credits | Storage |
|----|-------|----------|---------|---------|
| 1 | ardianfaisal.id@gmail.com | `Lumiku2025!` | 100,000 | 1GB |
| 2 | iqbal.elvo@gmail.com | `Lumiku2025!` | 100,000 | 1GB |
| 3 | galuh.inteko@gmail.com | `Lumiku2025!` | 100,000 | 1GB |
| 4 | dilla.inteko@gmail.com | `Lumiku2025!` | 100,000 | 1GB |

---

## 🔑 Important Information

### **Password Details:**
- **Password:** `Lumiku2025!` (case-sensitive!)
- **First Character:** Capital L
- **Last Character:** Exclamation mark `!`
- **Total Length:** 11 characters

### **Security Reminder:**
⚠️ **Users MUST change password after first login!**

To change password:
1. Login to app.lumiku.com
2. Go to **Settings** → **Change Password**
3. Enter new password

---

## ✅ What Each User Gets

### **Credits:**
- **100,000 credits** (effectively unlimited for normal usage)
- **Usage calculation:**
  - Video Mixer: 2 credits/generation = **50,000 videos**
  - Carousel Mix: 2 credits/generation = **50,000 carousels**
  - At 10 generations/day = **~13 years of usage**

### **Storage:**
- **1GB storage quota**
- For uploading images, videos, templates

### **Full App Access:**
- ✅ **Video Mixer** - Mix multiple videos into one
- ✅ **Carousel Mix** - Create Instagram carousels
- ✅ **Looping Flow** - Create looping videos
- ✅ **Video Generator** - Generate videos with AI
- ✅ **Poster Editor** - Create and edit posters
- ✅ **All AI Models** - Access to all available AI models

---

## 🧪 Testing Instructions

### **Step 1: Test Login**

For each user:
1. Go to: `https://app.lumiku.com`
2. Click **Login**
3. Enter credentials:
   - Email: (from table above)
   - Password: `Lumiku2025!`
4. Click **Sign In**

**Expected:** Successfully logged in to dashboard

---

### **Step 2: Verify Credits**

After login:
1. Check top-right corner or dashboard
2. Should display: **100,000 credits**

---

### **Step 3: Test Video Mixer**

1. Go to Dashboard
2. Click **Video Mixer**
3. Upload 2-3 test videos
4. Configure settings
5. Click **Generate**
6. Wait for processing
7. **Verify:** Credits decrease (100,000 → 99,998)

---

### **Step 4: Test Carousel Mix**

1. Go to Dashboard
2. Click **Carousel Mix**
3. Upload test images (3-5 images)
4. Add text/captions
5. Choose template
6. Click **Generate**
7. **Verify:** Credits decrease further

---

## 📊 Database Verification

Users were created with these database records:

### **Users Table:**
```sql
id: ent-user-001, ent-user-002, ent-user-003, ent-user-004
email: (as listed in table)
password: $2b$10$U9Xn0SzBi6xBAdD.25JzbeYHyCdDNyvTM8tEkr5P33z0iRreJ53bi (bcrypt hash)
role: user
storageQuota: 1073741824 (1GB in bytes)
storageUsed: 0
```

### **Credits Table:**
```sql
id: credit-ent-user-001, credit-ent-user-002, etc.
userId: ent-user-001, ent-user-002, ent-user-003, ent-user-004
amount: 100000
balance: 100000
type: bonus
description: Enterprise unlimited credits
```

### **Verification Query:**
```sql
SELECT u.email, u.name, c.balance as credits
FROM users u
LEFT JOIN credits c ON c."userId" = u.id
WHERE u.email IN (
  'ardianfaisal.id@gmail.com',
  'iqbal.elvo@gmail.com',
  'galuh.inteko@gmail.com',
  'dilla.inteko@gmail.com'
);
```

**Result:**
```
                  email                  |      name      | credits
-----------------------------------------+----------------+---------
 ardianfaisal.id@gmail.com              | Ardian Faisal  | 100000
 iqbal.elvo@gmail.com                   | Iqbal Elvo     | 100000
 galuh.inteko@gmail.com                 | Galuh Inteko   | 100000
 dilla.inteko@gmail.com                 | Dilla Inteko   | 100000
```

✅ All users verified!

---

## 🔧 Troubleshooting

### **Issue 1: Can't Login**

**Symptoms:**
- "Invalid credentials" error
- Login fails

**Solutions:**
1. **Check email spelling** (case-sensitive)
2. **Check password exactly:** `Lumiku2025!`
3. **Common mistakes:**
   - Using lowercase `l` instead of `L`
   - Missing exclamation mark `!`
   - Extra spaces before/after password

### **Issue 2: Credits Not Showing**

**Solution:**
1. Logout and login again
2. Refresh the page (Ctrl + F5)
3. Check database:
   ```bash
   psql $DATABASE_URL -c "SELECT * FROM credits WHERE \"userId\" = 'ent-user-001';"
   ```

### **Issue 3: App Not Working**

**Check:**
1. **Backend health:** `curl https://app.lumiku.com/health`
2. **Application status:** Coolify dashboard → SuperLumiku → should be "running:healthy"
3. **Logs:** Check for errors in Coolify logs

---

## 📝 Usage Monitoring

### **Check User Credit Balance:**

```bash
psql $DATABASE_URL -c "SELECT u.email, c.balance FROM users u LEFT JOIN credits c ON c.\"userId\" = u.id WHERE u.email = 'ardianfaisal.id@gmail.com';"
```

### **Check All Transactions:**

```bash
psql $DATABASE_URL -c "SELECT * FROM credits WHERE \"userId\" = 'ent-user-001' ORDER BY \"createdAt\" DESC LIMIT 10;"
```

### **Top Up Credits (if needed):**

```bash
psql $DATABASE_URL -c "INSERT INTO credits (id, \"userId\", amount, balance, type, description, \"createdAt\") VALUES (gen_random_uuid(), 'ent-user-001', 50000, 50000, 'bonus', 'Credit top-up', NOW());"
```

---

## 💡 Tips for Users

### **Credit Conservation:**
Even with 100,000 credits, users can optimize usage:
- Use lower quality settings for drafts
- Use higher quality only for final outputs
- Delete unused generations to free storage

### **Best Practices:**
1. **Change password immediately** after first login
2. **Don't share credentials** - each person has their own account
3. **Report bugs** or issues to admin
4. **Save important outputs** - download to local device

### **Getting Help:**
- Check app documentation
- Contact support
- Report issues to admin

---

## 📊 Summary

| Metric | Value |
|--------|-------|
| **Total Users Created** | 4 |
| **Total Credits Issued** | 400,000 |
| **Total Storage Quota** | 4GB |
| **Password** | `Lumiku2025!` |
| **Login URL** | https://app.lumiku.com |
| **Status** | ✅ Active |

---

## ✅ Deployment Checklist

- [x] 4 users created in database
- [x] Passwords hashed with bcrypt
- [x] 100,000 credits assigned to each user
- [x] Storage quota set to 1GB each
- [x] Database verification passed
- [x] All users visible in verification query
- [x] Credits properly linked to users
- [x] Ready for login testing

---

## 🎯 Next Steps

1. ✅ **Share credentials** with the 4 users (securely!)
2. ✅ **Ask them to test login** at app.lumiku.com
3. ✅ **Ask them to change password** after first login
4. ✅ **Monitor credit usage** in first week
5. ✅ **Collect feedback** on app functionality
6. ✅ **Top up credits** if needed (when balance < 10,000)

---

**Created by:** Claude Code Assistant
**Date:** 2025-10-10
**Environment:** Production (app.lumiku.com)
**Database:** PostgreSQL (via Coolify)

🎉 **Enterprise users ready to use!**
