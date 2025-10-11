# 🔧 Setup Apps - Coolify Terminal Command

**Issue:** Dashboard showing "No apps available yet"
**Cause:** Apps table is empty
**Solution:** Seed 5 apps into database

---

## 🚀 RUN THIS IN COOLIFY TERMINAL:

```bash
node seed-apps-now.js
```

**Expected Output:**
```
✅ Connected to production database

🌱 Seeding apps...

✅ Seeded 5 apps:
   - Video Mixer (video-mixer)
   - Carousel Mix (carousel-mix)
   - Looping Flow (looping-flow)
   - Video Generator (video-generator)
   - Poster Editor (poster-editor)

🔍 Verifying apps in database...

✅ Apps in database:
════════════════════════════════════════════════════════════════════════════════
1. Video Mixer
   App ID: video-mixer
   Icon: video
   Color: blue
   Enabled: ✅

2. Carousel Mix
   App ID: carousel-mix
   Icon: layers
   Color: purple
   Enabled: ✅

3. Looping Flow
   App ID: looping-flow
   Icon: film
   Color: green
   Enabled: ✅

4. Video Generator [BETA]
   App ID: video-generator
   Icon: video
   Color: orange
   Enabled: ✅

5. Poster Editor [BETA]
   App ID: poster-editor
   Icon: file-text
   Color: red
   Enabled: ✅

════════════════════════════════════════════════════════════════════════════════

🎉 Apps seeded successfully!
📱 Refresh dashboard to see all apps

✅ Database connection closed
```

---

## ✅ After Running:

1. **Refresh browser** (F5 atau Ctrl+R)
2. **Apps akan muncul** di dashboard
3. **5 apps tersedia:**
   - ✅ Video Mixer (blue)
   - ✅ Carousel Mix (purple)
   - ✅ Looping Flow (green)
   - ✅ Video Generator (orange, BETA)
   - ✅ Poster Editor (red, BETA)

---

## 🧪 Test Other 3 Users:

After apps seeded, test login for:

| Email | Password | Should See |
|-------|----------|------------|
| iqbal.elvo@gmail.com | `Lumiku2025!` | 100,000 credits + 5 apps |
| galuh.inteko@gmail.com | `Lumiku2025!` | 100,000 credits + 5 apps |
| dilla.inteko@gmail.com | `Lumiku2025!` | 100,000 credits + 5 apps |

---

## 📊 What Was Fixed:

### **Problem 1: Missing Database Columns** ✅ SOLVED
- Added `accountType` and `subscriptionTier` columns
- Users can now login

### **Problem 2: Empty Apps Table** ← CURRENT
- Apps table was empty
- Dashboard shows "No apps available yet"
- **Solution:** Seed 5 apps

---

## 🎯 Complete Setup Checklist:

- [x] Database schema fixed (accountType, subscriptionTier)
- [x] 4 enterprise users created
- [x] 100,000 credits assigned to each user
- [x] Password hash correct
- [x] Login API working
- [x] Login browser working (ardianfaisal.id@gmail.com tested)
- [ ] Apps seeded ← **RUN `node seed-apps-now.js` NOW**
- [ ] Test other 3 users
- [ ] All 4 users can access all 5 apps

---

**Next:** Run `node seed-apps-now.js` in Coolify Terminal, then refresh browser!
