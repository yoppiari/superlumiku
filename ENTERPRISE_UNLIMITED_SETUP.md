# Enterprise Unlimited Access Setup Guide

## ✅ What Has Been Done

### 1. Code Changes (Already Deployed)
- ✅ Added `userTags` field to User model in Prisma schema
- ✅ Modified credit middleware to check for `enterprise_unlimited` tag
- ✅ Enterprise users with this tag skip credit charges for Video Mixer & Carousel Mix
- ✅ Other apps still use credits normally
- ✅ Code committed and pushed to GitHub
- ✅ Production deployment triggered

### 2. Database Setup Scripts Created
- `setup-enterprise-unlimited.js` - Tags 4 users with unlimited access
- `seed-apps-now.js` - Seeds 5 apps to dashboard

## 🚀 Next Steps (Run in Coolify Terminal)

### Step 1: Wait for Deployment
Wait for the current deployment to complete (~2-3 minutes).

Check deployment status at: https://cf.avolut.com

### Step 2: Run Enterprise Setup Script
Open Coolify Terminal for **SuperLumiku** (app.lumiku.com) and run:

```bash
node setup-enterprise-unlimited.js
```

**Expected Output:**
```
✅ Connected to production database

📋 Step 1: Adding userTags column to users table...
✅ Column added successfully

📋 Step 2: Tagging enterprise users with unlimited access...
✅ Tagged 4 users:
   - Ardian Faisal (ardianfaisal.id@gmail.com)
     Tags: ["enterprise_unlimited"]
   - Iqbal Elvo (iqbal.elvo@gmail.com)
     Tags: ["enterprise_unlimited"]
   - Galuh Inteko (galuh.inteko@gmail.com)
     Tags: ["enterprise_unlimited"]
   - Dilla Inteko (dilla.inteko@gmail.com)
     Tags: ["enterprise_unlimited"]

📋 Step 3: Verifying enterprise setup...
✅ Enterprise Users Status:
════════════════════════════════════════════════════════════════════════════════
📧 ardianfaisal.id@gmail.com
   Name: Ardian Faisal
   Account Type: payg
   Tier: free
   Tags: ["enterprise_unlimited"]
   Credits: 100000
   ⭐ Unlimited Access: Video Mixer & Carousel Mix

[... 3 more users ...]
════════════════════════════════════════════════════════════════════════════════

🎉 Enterprise unlimited access configured successfully!

📝 Summary:
   - 4 users tagged with "enterprise_unlimited"
   - Video Mixer: NO CREDIT CHARGE ✅
   - Carousel Mix: NO CREDIT CHARGE ✅
   - Other apps: Still use credits ⚠️
```

### Step 3: Seed Apps to Dashboard
Still in Coolify Terminal, run:

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
```

### Step 4: Verify Setup
1. Open https://app.lumiku.com
2. Login with any of the 4 enterprise accounts:
   - ardianfaisal.id@gmail.com / Lumiku2025!
   - iqbal.elvo@gmail.com / Lumiku2025!
   - galuh.inteko@gmail.com / Lumiku2025!
   - dilla.inteko@gmail.com / Lumiku2025!

3. You should see **5 apps** on the dashboard
4. Try using **Video Mixer** - it should NOT deduct credits!
5. Try using **Carousel Mix** - it should NOT deduct credits!
6. Credits will still be deducted for other apps (Looping Flow, Video Generator, Poster Editor)

## 📊 Enterprise User Summary

| Email | Password | Credits | Unlimited Apps |
|-------|----------|---------|----------------|
| ardianfaisal.id@gmail.com | Lumiku2025! | 100,000 | Video Mixer, Carousel Mix |
| iqbal.elvo@gmail.com | Lumiku2025! | 100,000 | Video Mixer, Carousel Mix |
| galuh.inteko@gmail.com | Lumiku2025! | 100,000 | Video Mixer, Carousel Mix |
| dilla.inteko@gmail.com | Lumiku2025! | 100,000 | Video Mixer, Carousel Mix |

## 🔧 How It Works

### Credit Middleware Logic
```typescript
// Check if user has enterprise unlimited access
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { userTags: true },
})

const tags = user?.userTags ? JSON.parse(user.userTags) : []
const hasEnterpriseUnlimited = tags.includes('enterprise_unlimited')

// Skip credit check for enterprise users on specific apps
const unlimitedApps = ['video-mixer', 'carousel-mix']
if (hasEnterpriseUnlimited && unlimitedApps.includes(appId)) {
  // No credits deducted! ✅
  c.set('creditDeduction', {
    amount: 0,
    action,
    appId,
    isEnterprise: true,
  })
  await next()
  return
}

// Normal credit check for other apps
// ...
```

### Adding More Unlimited Apps
To give unlimited access to more apps, update this line in `backend/src/core/middleware/credit.middleware.ts`:

```typescript
const unlimitedApps = ['video-mixer', 'carousel-mix', 'looping-flow'] // Add more apps here
```

Then redeploy.

### Adding More Enterprise Users
To tag more users, add their emails to the array and run:

```sql
UPDATE users
SET "userTags" = '["enterprise_unlimited"]'
WHERE email IN ('new-user@gmail.com');
```

Or create a new script similar to `setup-enterprise-unlimited.js`.

## ✅ Final Checklist

- [x] Code changes committed and pushed
- [x] Production deployment triggered
- [ ] Wait for deployment to complete
- [ ] Run `node setup-enterprise-unlimited.js` in Coolify Terminal
- [ ] Run `node seed-apps-now.js` in Coolify Terminal
- [ ] Test login with all 4 enterprise users
- [ ] Verify 5 apps visible on dashboard
- [ ] Test Video Mixer - confirm NO credit deduction
- [ ] Test Carousel Mix - confirm NO credit deduction
- [ ] Test other apps - confirm credits ARE deducted

## 🎉 Success Criteria

✅ All 4 enterprise users can login
✅ Dashboard shows 5 apps
✅ Video Mixer works without deducting credits
✅ Carousel Mix works without deducting credits
✅ Other apps still deduct credits normally
✅ Credit balance remains at 100,000 after using Video Mixer/Carousel Mix

---

**Deployment UUID**: mcc8okww4wsc8kokwoosk08g
**Deployed at**: 2025-10-10
**Status**: Waiting for deployment completion ⏳
