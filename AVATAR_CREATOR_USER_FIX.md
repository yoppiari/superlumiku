# Avatar Creator: Quick Fix for Users

## Problem
Avatar Creator shows 400 errors in console and fails to load projects properly.

## Quick Fix (For Users)

### Option 1: Hard Refresh (Try This First)
**Windows/Linux**: `Ctrl + Shift + R`
**Mac**: `Cmd + Shift + R`

This clears cached JavaScript and loads the latest version.

---

### Option 2: Clear Browser Cache
If hard refresh doesn't work:

**Chrome**:
1. Click the three dots (⋮) → Settings
2. Privacy and security → Clear browsing data
3. Select "Cached images and files"
4. Click "Clear data"

**Firefox**:
1. Click three lines (≡) → Settings
2. Privacy & Security → Cookies and Site Data
3. Click "Clear Data"
4. Select "Cached Web Content"
5. Click "Clear"

**Safari**:
1. Safari → Preferences → Advanced
2. Check "Show Develop menu"
3. Develop → Empty Caches

---

### Option 3: Use Incognito/Private Window
Open Avatar Creator in:
- Chrome: `Ctrl + Shift + N`
- Firefox: `Ctrl + Shift + P`
- Safari: `Cmd + Shift + N`

This bypasses all cached files.

---

## Verification
After applying fix, check:
1. Open Avatar Creator
2. Open browser DevTools (F12)
3. Go to Console tab
4. Should see **NO** errors like:
   ```
   Failed to load: /api/apps/avatar-creator_88082ugb227d4g3wi1
   ```

---

## Still Not Working?

Contact support and provide:
1. Browser name and version
2. Screenshot of console errors
3. Network tab screenshot showing the failing request

---

## For Developers

See `AVATAR_CREATOR_HARDCODED_ID_FIX.md` for complete technical documentation.
