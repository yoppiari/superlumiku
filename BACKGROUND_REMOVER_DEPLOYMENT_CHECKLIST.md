# Background Remover Pro - Deployment Checklist

## Pre-Deployment Verification

### Frontend Build
- [x] TypeScript compilation passes
- [x] Production build successful (21.79 kB bundle)
- [x] No breaking changes to existing apps
- [x] All imports using type-only imports where needed
- [x] No console errors in development mode

### Code Quality
- [x] Store follows Zustand + Immer pattern
- [x] Component follows existing app patterns (Avatar Creator, Pose Generator)
- [x] Uses UnifiedHeader for consistency
- [x] Error handling with user feedback
- [x] Loading states for all async operations
- [x] Auto-cleanup on unmount (polling intervals)

### Files Created
- [x] `frontend/src/stores/backgroundRemoverStore.ts` (382 lines)
- [x] `frontend/src/apps/BackgroundRemover.tsx` (673 lines)

### Files Modified
- [x] `frontend/src/App.tsx` (added route with lazy loading)
- [x] `frontend/src/pages/Dashboard.tsx` (added Eraser icon)

## Backend Verification (To Check)

### Plugin Registration
- [ ] Plugin appears in `/api/plugins` response
- [ ] Plugin config has correct appId: `background-remover`
- [ ] Icon set to `eraser` in plugin.config.ts
- [ ] Dashboard card visible on frontend

### API Endpoints
Verify all endpoints return proper responses:
- [ ] `GET /api/background-remover/jobs` - Returns jobs array
- [ ] `GET /api/background-remover/stats` - Returns stats object
- [ ] `POST /api/background-remover/remove-single` - Accepts FormData
- [ ] `POST /api/background-remover/remove-batch` - Accepts FormData with multiple files
- [ ] `GET /api/background-remover/batches/:id` - Returns batch with jobs
- [ ] `GET /api/background-remover/batches/:id/download` - Returns ZIP blob
- [ ] `GET /api/background-remover/subscription` - Returns subscription or null
- [ ] `POST /api/background-remover/subscription/subscribe` - Creates subscription
- [ ] `POST /api/background-remover/subscription/cancel` - Cancels subscription

### Database
- [ ] Tables exist: `background_removal_jobs`, `background_removal_batches`, `background_removal_subscriptions`
- [ ] Indexes present for userId, status, createdAt
- [ ] Foreign keys working (cascade deletes)

### File Storage
- [ ] Upload directory exists and writable
- [ ] File paths returned in URLs are accessible
- [ ] Batch ZIP generation working
- [ ] File cleanup on job deletion working

### Credit System
- [ ] Credits deducted BEFORE processing
- [ ] Refunds on failure working
- [ ] Credit amounts match tier configuration:
  - Basic: 3 credits
  - Standard: 8 credits
  - Professional: 15 credits
  - Industry: 25 credits

### Subscription System
- [ ] Daily limits enforced
- [ ] Daily reset working
- [ ] Cancellation working
- [ ] Plan pricing correct:
  - Starter: Rp 99,000/month, 50/day
  - Pro: Rp 299,000/month, 200/day

## Deployment Steps

### 1. Commit Changes
```bash
cd "C:\Users\yoppi\Downloads\Lumiku App"
git add frontend/src/stores/backgroundRemoverStore.ts
git add frontend/src/apps/BackgroundRemover.tsx
git add frontend/src/App.tsx
git add frontend/src/pages/Dashboard.tsx
git commit -m "feat: add Background Remover Pro frontend implementation"
git push origin development
```

### 2. Deploy Frontend
- [ ] Coolify auto-deploys from git push
- [ ] Build completes successfully
- [ ] No deployment errors in Coolify logs

### 3. Verify Deployment
- [ ] Navigate to production URL
- [ ] Login to dashboard
- [ ] Background Remover card visible
- [ ] Click card navigates to `/apps/background-remover`
- [ ] All 4 tabs render without errors

## Post-Deployment Testing

### Smoke Tests (5 minutes)

#### Test 1: Single Upload
1. [ ] Go to Single Upload tab
2. [ ] Upload test image (PNG/JPG)
3. [ ] Select "Basic" tier
4. [ ] Click "Remove Background"
5. [ ] Check credit deduction
6. [ ] Go to Jobs tab
7. [ ] Verify job appears with "processing" status
8. [ ] Wait 30-60 seconds
9. [ ] Verify status changes to "completed"
10. [ ] Click Download button
11. [ ] Verify image downloads with transparent background

#### Test 2: Batch Upload
1. [ ] Go to Batch Upload tab
2. [ ] Enter batch name: "Test Batch"
3. [ ] Select 3 test images
4. [ ] Select "Standard" tier
5. [ ] Verify credit total shows (3 x 8 = 24 credits)
6. [ ] Click "Upload Batch"
7. [ ] Go to Jobs tab, click "Batches"
8. [ ] Verify batch appears
9. [ ] Watch progress bar update (auto-refresh every 5s)
10. [ ] Wait for completion
11. [ ] Click "Download ZIP"
12. [ ] Verify ZIP contains 3 processed images

#### Test 3: Jobs Tab
1. [ ] Click "Single Jobs" - verify single uploads listed
2. [ ] Click "Batches" - verify batches listed
3. [ ] Check status icons correct:
   - Green checkmark for completed
   - Blue spinner for processing
   - Red X for failed (if any)
4. [ ] Verify download buttons only on completed jobs

#### Test 4: Subscription Tab
1. [ ] Go to Subscription tab
2. [ ] Verify plans displayed (Starter, Pro)
3. [ ] Click "Subscribe" on Starter plan
4. [ ] Verify confirmation dialog
5. [ ] Check subscription activates
6. [ ] Verify top stats bar shows plan + remaining
7. [ ] Test "Cancel Subscription" button
8. [ ] Verify cancellation works

### Edge Cases (10 minutes)

#### Large Files
- [ ] Upload 10MB image (should work)
- [ ] Upload 11MB image (should fail gracefully)

#### Concurrent Processing
- [ ] Upload 2 singles simultaneously
- [ ] Upload batch while single processing
- [ ] Verify both complete correctly

#### Error Handling
- [ ] Upload invalid file (e.g., .txt renamed to .jpg)
- [ ] Verify error message shown
- [ ] Verify credits NOT deducted
- [ ] Upload with 0 credits remaining
- [ ] Verify error shown
- [ ] Test with no internet (offline)
- [ ] Verify error handling

#### Subscription Limits
- [ ] Subscribe to Starter (50/day limit)
- [ ] Use all 50 removals
- [ ] Try 51st removal
- [ ] Verify limit enforced OR falls back to credits
- [ ] Wait for daily reset (or mock it)
- [ ] Verify limit resets

### Performance Testing (5 minutes)

#### Load Times
- [ ] Initial page load < 2 seconds
- [ ] Tab switching instant
- [ ] Job list render < 1 second for 50+ jobs
- [ ] Batch status refresh < 500ms

#### Auto-Refresh
- [ ] Upload batch
- [ ] Leave Jobs tab open
- [ ] Verify status updates automatically every 5s
- [ ] Navigate away and back
- [ ] Verify no duplicate polling intervals

#### Memory Leaks
- [ ] Open app
- [ ] Switch tabs rapidly 20 times
- [ ] Upload and monitor several jobs
- [ ] Check browser dev tools memory usage
- [ ] Should not grow unbounded

## Rollback Plan

If critical issues found:

### Quick Rollback
```bash
git revert HEAD
git push origin development
```

### Manual Rollback
1. Remove route from `App.tsx`
2. Remove import from `Dashboard.tsx`
3. Delete store and component files
4. Redeploy

## Success Criteria

### Must Have (Blocker)
- [x] App loads without errors
- [ ] Can upload single image
- [ ] Job completes and downloads
- [ ] Credits deducted correctly
- [ ] No console errors

### Should Have (Important)
- [ ] Batch upload works
- [ ] Subscription works
- [ ] Auto-refresh works
- [ ] All quality tiers work
- [ ] Error messages shown

### Nice to Have (Post-launch)
- [ ] Fast load times
- [ ] Mobile responsive
- [ ] No memory leaks
- [ ] Toast notifications instead of alerts

## Known Limitations (Document)

1. **Alerts instead of Toasts**: Using browser alerts temporarily, will upgrade to toast library
2. **No image preview in Jobs**: Downloads only, no preview modal yet
3. **No job deletion**: Can't delete old jobs yet
4. **No filter/sort**: Jobs shown chronologically only

## Support Preparation

### User Documentation
- [x] User Guide created (`BACKGROUND_REMOVER_USER_GUIDE.md`)
- [ ] Add to help section in app
- [ ] Create video tutorial (optional)

### Developer Documentation
- [x] Implementation guide created (`BACKGROUND_REMOVER_IMPLEMENTATION_COMPLETE.md`)
- [ ] API documentation check (`BACKGROUND_REMOVER_API_DOCUMENTATION.md` if exists)

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Job stuck processing | Backend queue issue | Check backend logs, restart worker |
| Download fails | CORS or file path issue | Check nginx config, file permissions |
| Credits not deducted | Transaction error | Check creditService logs |
| Subscription not applying | Cache or DB issue | Clear cache, check subscriptions table |
| Batch ZIP empty | File generation error | Check temp directory permissions |

## Monitoring

### Metrics to Track
- [ ] Upload success rate
- [ ] Average processing time
- [ ] Error rate by tier
- [ ] Subscription conversion rate
- [ ] Credit usage per user

### Alerts to Set Up
- [ ] Job failure rate > 10%
- [ ] Average processing time > 2 minutes
- [ ] Subscription creation failures
- [ ] Credit deduction errors

## Sign-Off

- [ ] **Developer**: Frontend implementation complete and tested
- [ ] **Backend Team**: API endpoints verified working
- [ ] **QA**: Smoke tests passed
- [ ] **Product Owner**: Features approved
- [ ] **DevOps**: Deployment successful, monitoring active

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Production URL**: https://lumiku.com/apps/background-remover
**Status**: Ready for Production Testing
