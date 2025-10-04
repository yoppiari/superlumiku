# Carousel Mix - Fix Plan untuk Error 400 & Auto-save Indicator

**Created:** 2025-10-03
**Status:** 🔧 In Progress

---

## 🐛 Problem 1: Error 400 saat Add Text

### Root Cause Analysis:
1. Backend `createTextSchema` require beberapa fields:
   - ✅ `content: string` (required)
   - ✅ `slidePosition: number` (required - NEW)
   - ✅ `order: number` (required)
   - ⚠️ Kemungkinan `order` tidak di-set dengan benar

2. Frontend di `SlidePositionSection.tsx` line 52-73:
   ```typescript
   await addTextVariation(projectId, {
     content: newTextContent,
     slidePosition: position,  // ✓ Passed
     style: defaultTextStyle,
     position: {...},
     fontSize: ...,
     fontColor: ...,
     fontWeight: ...,
     alignment: ...,
     order: textsAtPosition.length,  // ⚠️ Ini bisa jadi 0!
   })
   ```

### Issues Found:
- `order: textsAtPosition.length` akan = 0 jika belum ada text
- Tapi schema expect `z.number().min(0)` - seharusnya valid
- Kemungkinan issue lain: style/position object structure

### Fixes:
1. ✅ Add detailed error logging di backend route (line 284-296)
2. ✅ Pastikan all required fields ada
3. ✅ Add try-catch dengan user-friendly error
4. ✅ Log request payload untuk debugging

---

## 💾 Problem 2: Tidak Ada Save Indicator

### Current State:
- Auto-save on every action (upload, add, delete)
- No visual feedback
- User tidak tahu apakah tersimpan

### Desired Features:
1. **Auto-save indicator** di header
   - Show "Saving..." saat request in progress
   - Show "Saved" dengan checkmark saat sukses
   - Show "Failed to save" jika error

2. **Toast notifications** untuk actions
   - "Image uploaded"
   - "Text added"
   - "Item deleted"

### Implementation Plan:
**Phase 1: Add Save Indicator (Simple)**
- Add state: `isSaving` dan `lastSaved` di store
- Update actions untuk set isSaving = true/false
- Display di header: "Saving..." atau "Saved 2 mins ago"

**Phase 2: Add Toast Notifications (Optional)**
- Use react-hot-toast or similar
- Show success/error messages
- Non-intrusive, auto-dismiss

---

## 🔧 Implementation Steps

### Step 1: Fix Error 400 (HIGH PRIORITY)
1. Read backend routes.ts POST /texts endpoint
2. Add detailed error logging
3. Add validation error messages
4. Test with console.log payload

### Step 2: Add Save Indicator (MEDIUM PRIORITY)
1. Update carouselMixStore.ts
   - Add isSaving state
   - Add lastSaved timestamp
2. Update all mutation actions (uploadSlide, addText, etc)
   - Set isSaving = true before API call
   - Set isSaving = false + lastSaved after success
3. Create SaveIndicator.tsx component
4. Add to InputPanel or BulkGenerator header

### Step 3: Testing
1. Test add text with various inputs
2. Check browser console for errors
3. Check backend logs for validation errors
4. Test save indicator updates

---

## 📁 Files to Modify

**Backend:**
- `backend/src/apps/carousel-mix/routes.ts` (add error logging)

**Frontend:**
- `frontend/src/stores/carouselMixStore.ts` (add isSaving state)
- `frontend/src/apps/carousel-mix/components/SlidePositionSection.tsx` (error handling)
- `frontend/src/apps/carousel-mix/components/SaveIndicator.tsx` (NEW - optional)

---

## ✅ Success Criteria

- [x] Add Text works without error 400
- [ ] User sees clear error messages if validation fails
- [ ] User knows when changes are saved
- [ ] UI feels responsive and provides feedback
