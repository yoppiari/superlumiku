# 🧪 QUICK TEST GUIDE - AI SYSTEM

**Deployment**: ✅ BERHASIL
**Date**: 2025-10-11 14:30 WIB
**URL**: https://dev.lumiku.com

---

## ✅ BASIC VERIFICATION (5 menit)

### 1. Health Check ✅ **PASSED**
```bash
curl https://dev.lumiku.com/health
```
**Result**: `{"status":"ok"}`

### 2. Open Website
- Buka: https://dev.lumiku.com
- Login page muncul? ✅
- SSL certificate valid? ✅

### 3. Login
- Email: `admin@enterprise.com`
- Password: `password` (atau password enterprise Anda)
- Dashboard muncul? ⏳ **TEST NOW**

---

## 🎯 QUICK TESTS (10 menit)

### Test A: Avatar Creator - Upload ⏳

1. Apps → Avatar Creator
2. Upload Photo Reference
3. Upload any avatar image
4. Save

**Expected**: ✅ Avatar tersimpan dan muncul di list

---

### Test B: Avatar Creator - AI Generation ⏳ **[NEW!]**

1. Avatar Creator → Generate with AI
2. Prompt: `"Professional woman with hijab, smiling"`
3. Name: `"Test AI Avatar"`
4. Generate
5. **Wait 30-60 seconds**

**Expected**: ✅ Avatar ter-generate dari AI

---

### Test C: Pose Generator - Basic ⏳

1. Apps → Pose Generator
2. Select avatar (dari upload atau AI)
3. Choose any pose
4. Quality: SD
5. Generate
6. **Wait 20-40 seconds**

**Expected**: ✅ Pose ter-generate dengan avatar

---

### Test D: Pose Generator - With Hijab ⏳ **[NEW!]**

1. Select avatar + pose
2. Enable "Fashion Enhancement"
3. Hijab: Modern Hijab
4. Color: Any color
5. Generate
6. **Wait 40-60 seconds**

**Expected**: ✅ Avatar dengan hijab ter-generate

---

## 📊 SUCCESS CRITERIA

**Deployment SUKSES jika**:
- ✅ Health check PASS
- ✅ Login works
- ✅ Dashboard accessible
- ✅ Avatar upload works
- ✅ **AI generation works** (Test B) - **KEY TEST!**
- ✅ **Basic pose works** (Test C) - **KEY TEST!**
- ⚠️ Optional: Hijab feature works (Test D)

**Minimum untuk SUKSES**: Test A, B, dan C harus PASS

---

## 🚨 IF TESTS FAIL

### Avatar AI Generation Timeout?
1. Tunggu hingga 90 detik (first time memang lama)
2. Check Coolify logs: "Model is loading" = normal, retry setelah 30 detik
3. Retry generation

### Pose Generation Error?
1. Check logs untuk error message
2. Verify HUGGINGFACE_API_KEY di Coolify
3. Test API key: https://huggingface.co/settings/tokens

### Other Issues?
1. Screenshot error
2. Copy error message dari Coolify logs
3. Send to Claude

---

## 📝 REPORT FORMAT

Kirim hasil test ke Claude:

```
QUICK TEST RESULTS:

✅ Health Check: PASS
✅ Login: PASS
✅ Avatar Upload: PASS
✅ AI Generation: [PASS/FAIL - XX seconds]
✅ Basic Pose: [PASS/FAIL - XX seconds]
⚠️ Hijab Feature: [PASS/FAIL/SKIP]

Issues: [None / describe issues]
```

---

## 🎉 NEXT STEPS

**If All Pass**:
- System ready untuk production use!
- Test advanced features (backgrounds, themes)
- Share dengan team

**If Some Fail**:
- Document failures
- Send report to Claude
- Debug bersama

---

**Start Testing Now!** 🚀

Open: https://dev.lumiku.com
