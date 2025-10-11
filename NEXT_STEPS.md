# 📋 Next Steps - Dual User System Implementation

**Last Updated:** 2025-01-15
**Current Status:** ✅ Core System Complete, Ready for Integration & Enhancement

---

## 🎯 OVERVIEW

The **Dual User System with Model-Level Access Control** is now fully implemented at the backend level. This document outlines the remaining steps to complete the full integration and enhance the system for production deployment.

---

## 📊 IMPLEMENTATION STATUS

| Phase | Status | Progress |
|-------|--------|----------|
| Database Schema | ✅ Complete | 100% |
| Services Layer | ✅ Complete | 100% |
| Middleware | ✅ Complete | 100% |
| API Endpoints | ✅ Complete | 100% |
| Background Jobs | ✅ Complete | 100% |
| **App Routes Migration** | 🔄 Pending | 20% |
| **Frontend Integration** | ⏭️ Not Started | 0% |
| **Payment Integration** | ⏭️ Not Started | 0% |
| **Testing & QA** | 🔄 Partial | 40% |
| **Deployment** | ⏭️ Not Started | 0% |

---

## 🚀 PRIORITY 1: App Routes Migration (Week 1-2)

### Goal
Migrate all existing app routes to use the new hybrid usage system (credit/quota).

### Tasks

#### 1.1 Video Generator ⭐ **HIGHEST PRIORITY**
**Why:** Has multiple models, most complex implementation
**Estimated Time:** 4-6 hours

**Files to Update:**
- `backend/src/apps/video-generator/routes.ts`
- `backend/src/apps/video-generator/services/video-gen.service.ts`

**Steps:**
1. Read `APP_ROUTES_UPDATE_GUIDE.md`
2. Update `POST /generate` endpoint:
   ```typescript
   import { deductModelUsage } from '../../middleware/hybrid-usage.middleware'
   import { recordModelUsage } from '../../middleware/record-model-usage.middleware'

   routes.post('/generate', authMiddleware, async (c) => {
     const { modelId } = await c.req.json()
     const modelKey = `video-generator:${modelId}`

     // Apply hybrid middleware
     const usageMiddleware = deductModelUsage(modelKey, 'generate_video')
     await usageMiddleware(c, async () => {})

     // Generate video
     const result = await service.generate(...)

     // Record usage
     await recordModelUsage(c)

     return c.json({ success: true, result })
   })
   ```

3. Update `GET /models` to return filtered models:
   ```typescript
   routes.get('/models', authMiddleware, async (c) => {
     const userId = c.get('userId')
     const models = await modelRegistryService.getUserAccessibleModels(
       userId,
       'video-generator'
     )
     return c.json({ models })
   })
   ```

4. Test with both PAYG and Subscription users
5. Verify quota increment and credit deduction

**Testing Checklist:**
- [ ] PAYG user: Credit deducted correctly
- [ ] Subscription user: Quota incremented correctly
- [ ] Model access control working (403 for unauthorized)
- [ ] Free tier models accessible to all
- [ ] Pro tier models only for Pro+ subscribers
- [ ] Enterprise tier models only for Enterprise subscribers
- [ ] ModelUsage records created
- [ ] Model stats increment

---

#### 1.2 Poster Editor ⭐ **HIGH PRIORITY**
**Why:** Multiple models, critical for users
**Estimated Time:** 6-8 hours

**Files to Update:**
- `backend/src/apps/poster-editor/routes.ts`
- `backend/src/apps/poster-editor/controllers/generate.controller.ts`
- `backend/src/apps/poster-editor/controllers/inpaint-batch.controller.ts`
- `backend/src/apps/poster-editor/controllers/enhance.controller.ts`

**Model Mapping:**
| Action | Model | Tier |
|--------|-------|------|
| Quick Edit | `poster-editor:inpaint-standard` | free |
| Batch Inpaint (Standard) | `poster-editor:inpaint-standard` | free |
| Batch Inpaint (Pro) | `poster-editor:inpaint-pro` | pro |
| Super Resolution | `poster-editor:super-resolution` | enterprise |

**Steps:**
1. Update `POST /quick-edit`:
   ```typescript
   const modelKey = 'poster-editor:inpaint-standard'
   await deductModelUsage(modelKey, 'quick_edit')(c, async () => {})
   // ... inpainting logic
   await recordModelUsage(c)
   ```

2. Update `POST /batch-inpaint` (check quality param):
   ```typescript
   const modelKey = quality === 'pro'
     ? 'poster-editor:inpaint-pro'
     : 'poster-editor:inpaint-standard'
   await deductModelUsage(modelKey, 'batch_inpaint')(c, async () => {})
   // ... batch inpainting logic
   await recordModelUsage(c)
   ```

3. Update `POST /enhance`:
   ```typescript
   const modelKey = 'poster-editor:super-resolution'
   await deductModelUsage(modelKey, 'enhance')(c, async () => {})
   // ... enhancement logic
   await recordModelUsage(c)
   ```

4. Test all 3 endpoints with both user types

**Testing Checklist:**
- [ ] Quick edit works for all users
- [ ] Batch inpaint (standard) works for all users
- [ ] Batch inpaint (pro) only for Pro+ subscribers
- [ ] Super resolution only for Enterprise subscribers
- [ ] Credits deducted for PAYG users
- [ ] Quota incremented for Subscription users
- [ ] Error handling for insufficient quota/credits

---

#### 1.3 Video Mixer 🔵 **MEDIUM PRIORITY**
**Why:** Single model, simpler implementation
**Estimated Time:** 2-3 hours

**Files to Update:**
- `backend/src/apps/video-mixer/routes.ts`

**Steps:**
1. Use default model: `video-mixer:ffmpeg-standard`
2. Update `POST /generate` endpoint:
   ```typescript
   const modelKey = 'video-mixer:ffmpeg-standard'
   await deductModelUsage(modelKey, 'generate_videos')(c, async () => {})
   // ... mixing logic
   await recordModelUsage(c)
   ```

3. Test with both user types

**Testing Checklist:**
- [ ] PAYG users can generate with credit deduction
- [ ] Subscription users can generate with quota increment
- [ ] Default model accessible to all users (free tier)

---

#### 1.4 Carousel Mix 🔵 **MEDIUM PRIORITY**
**Why:** Single model, simpler implementation
**Estimated Time:** 2-3 hours

**Files to Update:**
- `backend/src/apps/carousel-mix/routes.ts`

**Steps:**
1. Use default model: `carousel-mix:canvas-standard`
2. Update `POST /generate` endpoint:
   ```typescript
   const modelKey = 'carousel-mix:canvas-standard'
   await deductModelUsage(modelKey, 'generate_carousel')(c, async () => {})
   // ... carousel generation logic
   await recordModelUsage(c)
   ```

3. Test with both user types

**Testing Checklist:**
- [ ] PAYG users: Credit deduction works
- [ ] Subscription users: Quota increment works
- [ ] Free tier model accessible to all

---

#### 1.5 Looping Flow ⚪ **LOW PRIORITY**
**Why:** Single model, less critical feature
**Estimated Time:** 2-3 hours

**Files to Update:**
- `backend/src/apps/looping-flow/routes.ts`

**Steps:**
1. Use default model: `looping-flow:ffmpeg-loop`
2. Update `POST /generate` endpoint:
   ```typescript
   const modelKey = 'looping-flow:ffmpeg-loop'
   await deductModelUsage(modelKey, 'generate_loop')(c, async () => {})
   // ... looping logic
   await recordModelUsage(c)
   ```

3. Test with both user types

**Testing Checklist:**
- [ ] Credit/quota tracking works
- [ ] Free tier accessible to all

---

## 🎨 PRIORITY 2: Frontend Integration (Week 3-4)

### Goal
Build UI components for subscription management, quota display, and model selection.

### Tasks

#### 2.1 Subscription Management UI ⭐ **CRITICAL**
**Estimated Time:** 12-16 hours

**Pages to Create:**
1. **Subscription Plans Page** (`/pricing` or `/plans`)
   - Display all available plans
   - Feature comparison table
   - "Subscribe" / "Upgrade" buttons
   - Current plan indicator

2. **Subscription Dashboard** (`/account/subscription`)
   - Current plan details
   - Billing cycle & next payment date
   - Usage statistics (quota usage, credit balance)
   - Cancel/change plan options
   - Billing history

**Components:**
```typescript
// components/SubscriptionPlanCard.tsx
interface PlanCardProps {
  plan: SubscriptionPlan
  current: boolean
  onSubscribe: () => void
}

// components/QuotaMeter.tsx
interface QuotaMeterProps {
  used: number
  limit: number
  resetAt: Date
}

// components/UpgradePrompt.tsx
interface UpgradePromptProps {
  reason: string
  requiredTier: string
}
```

**API Integration:**
- `GET /api/subscription/plans` → List all plans
- `GET /api/subscription/status` → Get user's subscription
- `POST /api/subscription/subscribe` → Create subscription
- `POST /api/subscription/cancel` → Cancel subscription
- `POST /api/subscription/change-plan` → Upgrade/downgrade

**Design Guidelines:**
- Show clear tier differences (Free, Basic, Pro, Enterprise)
- Highlight "Most Popular" plan
- Display daily quota prominently
- Show "Save 20%" for yearly plans
- Use color coding: Blue (Free), Green (Basic), Purple (Pro), Gold (Enterprise)

---

#### 2.2 Quota Display Widget ⭐ **CRITICAL**
**Estimated Time:** 4-6 hours

**Where to Display:**
- Header/Navbar (compact meter)
- Dashboard (detailed stats)
- Before generation (remaining quota alert)

**Component Structure:**
```typescript
// components/QuotaWidget.tsx
export const QuotaWidget = () => {
  const { data: quota } = useQuery('/api/quota/status')

  return (
    <div className="quota-widget">
      <div className="quota-meter">
        <div className="quota-fill" style={{ width: `${percentage}%` }} />
      </div>
      <p>{quota.remaining} / {quota.limit} generates left</p>
      <p className="reset-time">Resets in {timeUntilReset}</p>
    </div>
  )
}
```

**Features:**
- Real-time quota tracking
- Visual progress bar
- Countdown to reset time
- Warning when quota low (< 20%)
- Model-specific breakdown (optional, expandable)

---

#### 2.3 Model Selector with Tier Badges ⭐ **HIGH PRIORITY**
**Estimated Time:** 6-8 hours

**Where to Use:**
- Video Generator: Model selection dropdown
- Poster Editor: Quality/model selection
- Any app with multiple models

**Component Structure:**
```typescript
// components/ModelSelector.tsx
interface ModelSelectorProps {
  appId: string
  onSelectModel: (modelKey: string) => void
}

export const ModelSelector = ({ appId, onSelectModel }: ModelSelectorProps) => {
  const { data: models } = useQuery(`/api/apps/${appId}/models`)

  return (
    <select>
      {models.map(model => (
        <option key={model.modelKey} value={model.modelKey}>
          {model.name}
          {model.tier !== 'free' && ` (${model.tier.toUpperCase()})`}
          {model.beta && ' [BETA]'}
        </option>
      ))}
    </select>
  )
}
```

**Features:**
- Show tier badge (Free/Basic/Pro/Enterprise)
- Disable locked models with tooltip
- Show cost preview (credit or quota cost)
- "Upgrade to unlock" button for locked models
- Beta badge for beta models

---

#### 2.4 Upgrade Prompts & CTAs 🔵 **MEDIUM PRIORITY**
**Estimated Time:** 4-6 hours

**Scenarios to Handle:**
1. **Model Access Denied (403)**
   ```typescript
   if (error.status === 403) {
     showUpgradeModal({
       title: "Premium Model",
       message: "This model requires Pro subscription",
       requiredTier: "pro",
       action: "Upgrade to Pro"
     })
   }
   ```

2. **Quota Exceeded (429)**
   ```typescript
   if (error.status === 429) {
     showQuotaExceededModal({
       title: "Daily Quota Exceeded",
       message: "You've used all 50 generates today",
       resetAt: data.resetAt,
       action: "Upgrade for More"
     })
   }
   ```

3. **Insufficient Credits (402)**
   ```typescript
   if (error.status === 402) {
     showBuyCreditModal({
       title: "Insufficient Credits",
       required: data.required,
       current: data.current,
       action: "Buy Credits"
     })
   }
   ```

**Components:**
```typescript
// components/UpgradeModal.tsx
// components/QuotaExceededModal.tsx
// components/BuyCreditModal.tsx
```

---

#### 2.5 Account Type Switcher ⚪ **LOW PRIORITY**
**Estimated Time:** 4-6 hours

**Feature:**
Allow users to switch between PAYG and Subscription models.

**UI Flow:**
1. User clicks "Switch to Subscription" on PAYG account
2. Show plan selection modal
3. Subscribe → Account type changes
4. User clicks "Switch to Pay-as-you-go" on Subscription account
5. Confirm cancellation → Keep subscription until period ends
6. After expiry → Revert to PAYG

---

## 💳 PRIORITY 3: Payment Integration (Week 5)

### Goal
Integrate subscription payments with Duitku (or other payment gateway).

### Tasks

#### 3.1 Duitku Subscription Webhook ⭐ **CRITICAL**
**Estimated Time:** 8-12 hours

**Current Status:**
- ✅ PAYG credit purchase already integrated
- ⏭️ Subscription payments not yet integrated

**Steps:**
1. Create subscription payment model:
   ```typescript
   model SubscriptionPayment {
     id              String   @id @default(cuid())
     userId          String
     subscriptionId  String
     planId          String
     amount          Float
     status          String   // pending, success, failed
     duitkuReference String   @unique
     merchantOrderId String   @unique
     createdAt       DateTime @default(now())
     updatedAt       DateTime @updatedAt
   }
   ```

2. Create subscription payment controller:
   ```typescript
   // POST /api/subscription/create-payment
   export const createSubscriptionPayment = async (c: Context) => {
     const { planId } = await c.req.json()
     const userId = c.get('userId')

     // Get plan details
     const plan = await prisma.subscriptionPlan.findUnique({
       where: { planId }
     })

     // Create Duitku payment request
     const duitkuPayment = await createDuitkuPayment({
       amount: plan.price,
       productDetails: `Lumiku ${plan.name} Subscription`,
       customerEmail: user.email,
       callbackUrl: `${BASE_URL}/api/subscription/payment-callback`,
       returnUrl: `${FRONTEND_URL}/subscription/success`
     })

     // Save payment record
     await prisma.subscriptionPayment.create({
       data: {
         userId,
         planId,
         amount: plan.price,
         status: 'pending',
         duitkuReference: duitkuPayment.reference,
         merchantOrderId: duitkuPayment.merchantOrderId
       }
     })

     return c.json({
       success: true,
       paymentUrl: duitkuPayment.paymentUrl
     })
   }
   ```

3. Create payment callback handler:
   ```typescript
   // POST /api/subscription/payment-callback
   export const subscriptionPaymentCallback = async (c: Context) => {
     const callbackData = await c.req.json()

     // Verify Duitku signature
     if (!verifyDuitkuSignature(callbackData)) {
       return c.json({ error: 'Invalid signature' }, 400)
     }

     // Find payment record
     const payment = await prisma.subscriptionPayment.findUnique({
       where: { duitkuReference: callbackData.reference }
     })

     if (callbackData.resultCode === '00') {
       // Payment success
       await prisma.subscriptionPayment.update({
         where: { id: payment.id },
         data: { status: 'success' }
       })

       // Create subscription
       await subscriptionService.createSubscription(
         payment.userId,
         payment.planId
       )

       // Send confirmation email
       await sendSubscriptionConfirmationEmail(payment.userId)
     }

     return c.json({ success: true })
   }
   ```

4. Test payment flow:
   - Select plan → Create payment → Redirect to Duitku
   - Complete payment → Callback received → Subscription created
   - User account type updated to "subscription"
   - Quota initialized

**Testing Checklist:**
- [ ] Payment URL generated correctly
- [ ] Duitku redirect works
- [ ] Callback signature verified
- [ ] Subscription created on success
- [ ] Account type updated
- [ ] Quota initialized
- [ ] Email sent

---

#### 3.2 Subscription Renewal Automation ⭐ **CRITICAL**
**Estimated Time:** 6-8 hours

**Goal:**
Automatically charge users for subscription renewal.

**Approach:**

**Option A: Manual Renewal (Simpler)**
- Send email reminder 3 days before expiry
- User manually pays to renew
- On payment success, extend subscription

**Option B: Auto-renewal (Complex)**
- Store payment method (credit card token)
- Charge automatically on renewal date
- Send receipt email

**Recommended:** Start with Option A (manual), add Option B later.

**Implementation (Manual Renewal):**
1. Add reminder job:
   ```typescript
   // jobs/subscription-renewal-reminder.job.ts
   export const sendRenewalReminders = async () => {
     const threeDaysFromNow = addDays(new Date(), 3)

     const expiringSubscriptions = await prisma.subscription.findMany({
       where: {
         status: 'active',
         autoRenew: true,
         endDate: {
           gte: new Date(),
           lte: threeDaysFromNow
         }
       },
       include: { user: true, plan: true }
     })

     for (const sub of expiringSubscriptions) {
       await sendRenewalReminderEmail({
         email: sub.user.email,
         planName: sub.plan.name,
         expiryDate: sub.endDate,
         renewalUrl: `${FRONTEND_URL}/subscription/renew`
       })
     }
   }
   ```

2. Schedule reminder job (daily):
   ```typescript
   cron.schedule('0 9 * * *', sendRenewalReminders) // 9 AM daily
   ```

3. Create renewal payment endpoint:
   ```typescript
   // POST /api/subscription/renew-payment
   export const createRenewalPayment = async (c: Context) => {
     const userId = c.get('userId')
     const subscription = await subscriptionService.getUserSubscription(userId)

     // Create payment with same plan
     // ... similar to createSubscriptionPayment
   }
   ```

4. On renewal payment success:
   ```typescript
   await subscriptionService.renewSubscription(userId)
   ```

---

#### 3.3 Refund Handling ⚪ **LOW PRIORITY**
**Estimated Time:** 4-6 hours

**Scenarios:**
1. User cancels within 24 hours → Full refund
2. User cancels mid-cycle → Prorated refund
3. Service issue → Manual refund

**Implementation:**
- Create refund endpoint
- Update subscription status
- Process Duitku refund API call
- Send refund confirmation email

---

## 🧪 PRIORITY 4: Comprehensive Testing (Week 6)

### Goal
Thoroughly test all features with both user types.

### Tasks

#### 4.1 Backend API Testing ⭐ **CRITICAL**
**Estimated Time:** 8-12 hours

**Tools:**
- Postman / Insomnia
- Jest / Bun Test (unit tests)
- Supertest (integration tests)

**Test Cases:**

**Subscription APIs:**
- [ ] GET /api/subscription/plans → Returns all plans
- [ ] GET /api/subscription/status → Returns user subscription
- [ ] POST /api/subscription/subscribe → Creates subscription
- [ ] POST /api/subscription/cancel → Cancels subscription
- [ ] POST /api/subscription/change-plan → Changes plan

**Quota APIs:**
- [ ] GET /api/quota/status → Returns correct quota
- [ ] Quota increments after generation
- [ ] Quota reset at midnight UTC
- [ ] Error 429 when quota exceeded

**Model Access:**
- [ ] GET /api/apps → Filters by user tier
- [ ] GET /api/apps/:appId/models → Returns accessible models
- [ ] Free tier models accessible to all
- [ ] Pro tier models only for Pro+ subscribers
- [ ] Enterprise tier models only for Enterprise subscribers

**Hybrid Usage:**
- [ ] PAYG user → Credit deducted
- [ ] Subscription user → Quota incremented
- [ ] Error 402 when insufficient credits
- [ ] Error 429 when quota exceeded
- [ ] Error 403 when model access denied

**Background Jobs:**
- [ ] Daily quota reset runs at 00:00 UTC
- [ ] Subscription expiry check runs hourly
- [ ] Expired subscriptions revert to PAYG

---

#### 4.2 Frontend E2E Testing 🔵 **MEDIUM PRIORITY**
**Estimated Time:** 8-12 hours

**Tools:**
- Playwright / Cypress
- React Testing Library

**Test Scenarios:**

**PAYG User Journey:**
1. [ ] Login as PAYG user
2. [ ] Check credit balance displayed
3. [ ] Access free tier models
4. [ ] Cannot access pro tier models (locked)
5. [ ] Generate with free model → Credit deducted
6. [ ] Try to generate with insufficient credits → Error modal
7. [ ] Buy credits → Balance updated
8. [ ] View upgrade prompts

**Subscription User Journey:**
1. [ ] Browse subscription plans
2. [ ] Select plan & subscribe
3. [ ] Payment flow (Duitku redirect)
4. [ ] Return to app → Subscription active
5. [ ] Quota meter displayed
6. [ ] Access premium models (unlocked)
7. [ ] Generate multiple times → Quota decrements
8. [ ] Quota exceeded → Error modal
9. [ ] Wait for reset → Quota restored
10. [ ] Cancel subscription → Stays active until period ends
11. [ ] After expiry → Reverts to PAYG

**Model Selection:**
1. [ ] Free user sees only free models
2. [ ] Basic subscriber sees free + basic models
3. [ ] Pro subscriber sees free + basic + pro models
4. [ ] Enterprise subscriber sees all models
5. [ ] Locked models show upgrade prompt
6. [ ] Tier badges display correctly

---

#### 4.3 Load Testing ⚪ **LOW PRIORITY**
**Estimated Time:** 4-6 hours

**Tools:**
- k6 / Artillery
- Apache JMeter

**Scenarios:**
- 100 concurrent users generating videos
- 1000 requests to /api/apps
- Quota reset with 10,000 users
- Subscription expiry check with 5,000 subscriptions

**Metrics to Monitor:**
- Response time (< 500ms for most endpoints)
- Database query time
- Memory usage
- CPU usage
- Error rate (< 0.1%)

---

## 🚀 PRIORITY 5: Deployment & Monitoring (Week 7)

### Goal
Deploy to production and set up monitoring.

### Tasks

#### 5.1 Production Deployment ⭐ **CRITICAL**
**Estimated Time:** 4-8 hours

**Checklist:**
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Seeding scripts run
- [ ] Cron jobs scheduled
- [ ] HTTPS enabled
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] Error logging setup

**Deployment Platforms:**
- Coolify (already used for dev.lumiku.com)
- Vercel (frontend)
- Railway / Fly.io (backend alternative)

---

#### 5.2 Monitoring & Alerts 🔵 **MEDIUM PRIORITY**
**Estimated Time:** 4-6 hours

**Tools:**
- Sentry (error tracking)
- LogRocket / FullStory (user session replay)
- DataDog / New Relic (APM)
- Uptime Robot (uptime monitoring)

**Metrics to Track:**
- API response times
- Error rates by endpoint
- Quota reset success rate
- Subscription expiry job success rate
- Payment success rate
- Database query performance

**Alerts to Configure:**
- Quota reset job failed
- Subscription expiry job failed
- Payment callback errors
- High error rate (> 1%)
- Slow response times (> 2s)
- Database connection issues

---

#### 5.3 Backup & Disaster Recovery ⚪ **LOW PRIORITY**
**Estimated Time:** 4-6 hours

**Backup Strategy:**
- Daily database backups (automated)
- Weekly full backups
- 30-day retention
- Test restore procedure

**Disaster Recovery Plan:**
- Database failover
- Cron job redundancy
- Payment webhook replay mechanism

---

## 📈 PRIORITY 6: Analytics & Optimization (Week 8+)

### Goal
Gather insights and optimize the system.

### Tasks

#### 6.1 Usage Analytics Dashboard 🔵 **MEDIUM PRIORITY**
**Estimated Time:** 12-16 hours

**Metrics to Display:**
1. **Subscription Metrics:**
   - Active subscriptions by tier
   - Monthly Recurring Revenue (MRR)
   - Churn rate
   - Conversion rate (PAYG → Subscription)
   - Average subscription lifetime

2. **Usage Metrics:**
   - Total generations per day
   - Generations by model
   - Quota utilization rate
   - Credit consumption rate
   - Popular models

3. **User Metrics:**
   - Total users by account type
   - New signups per day
   - Active users (DAU/MAU)
   - User retention

**Implementation:**
- Query `ModelUsage` table for analytics
- Aggregate by date, model, user
- Create admin dashboard
- Export reports (CSV/PDF)

---

#### 6.2 A/B Testing for Pricing ⚪ **LOW PRIORITY**
**Estimated Time:** 8-12 hours

**Test Scenarios:**
- Different price points
- Different quota limits
- Free trial periods
- Discount promotions

**Tools:**
- Feature flags (LaunchDarkly / Flagsmith)
- Analytics (Google Analytics / Mixpanel)

---

#### 6.3 Performance Optimization ⚪ **LOW PRIORITY**
**Estimated Time:** 8-12 hours

**Areas to Optimize:**
1. **Database Queries:**
   - Add indexes for frequently queried fields
   - Optimize N+1 queries
   - Use database connection pooling

2. **API Responses:**
   - Add caching (Redis)
   - Compress responses (gzip)
   - Paginate large result sets

3. **Background Jobs:**
   - Optimize quota reset query
   - Batch process subscriptions

---

## 🛠️ PRIORITY 7: Advanced Features (Week 9+)

### Optional Enhancements

#### 7.1 Team Subscriptions ⚪ **OPTIONAL**
**Estimated Time:** 16-24 hours

**Features:**
- Create team/organization
- Invite team members
- Shared quota pool
- Team admin dashboard
- Usage by team member

---

#### 7.2 API Access for Enterprise ⚪ **OPTIONAL**
**Estimated Time:** 12-16 hours

**Features:**
- Generate API keys
- API rate limiting
- API usage tracking
- API documentation (Swagger/OpenAPI)

---

#### 7.3 Custom Model Training ⚪ **OPTIONAL**
**Estimated Time:** 40-60 hours

**Features:**
- Upload training data
- Train custom models
- Model versioning
- A/B test custom models

---

#### 7.4 Webhook System ⚪ **OPTIONAL**
**Estimated Time:** 8-12 hours

**Events:**
- `subscription.created`
- `subscription.renewed`
- `subscription.cancelled`
- `quota.exceeded`
- `quota.reset`
- `model.used`

---

## 📞 SUPPORT & MAINTENANCE

### Ongoing Tasks

#### Daily
- [ ] Monitor error logs
- [ ] Check cron job execution
- [ ] Review payment transactions

#### Weekly
- [ ] Analyze usage metrics
- [ ] Review customer feedback
- [ ] Check database performance

#### Monthly
- [ ] Generate revenue reports
- [ ] Analyze churn rate
- [ ] Review and adjust pricing
- [ ] Database backup verification

---

## 🎯 RECOMMENDED TIMELINE

### Week 1-2: App Routes Migration
- Day 1-2: Video Generator
- Day 3-4: Poster Editor
- Day 5: Video Mixer
- Day 6: Carousel Mix
- Day 7: Looping Flow
- Day 8-10: Testing & bug fixes

### Week 3-4: Frontend Integration
- Day 11-13: Subscription management UI
- Day 14-15: Quota display widget
- Day 16-17: Model selector with tier badges
- Day 18-19: Upgrade prompts & CTAs
- Day 20-24: Testing & polish

### Week 5: Payment Integration
- Day 25-27: Duitku subscription payments
- Day 28-30: Renewal automation
- Day 31-35: Testing & bug fixes

### Week 6: Testing & QA
- Day 36-38: Backend API testing
- Day 39-41: Frontend E2E testing
- Day 42: Load testing

### Week 7: Deployment
- Day 43-45: Production deployment
- Day 46-47: Monitoring setup
- Day 48-49: Final testing in production

### Week 8+: Analytics & Optimization
- Ongoing: Gather insights, optimize, iterate

---

## 📚 REFERENCE DOCUMENTS

1. **`DUAL_USER_SYSTEM_IMPLEMENTATION.md`**
   - Complete technical reference
   - Database schema details
   - Service & middleware documentation

2. **`APP_ROUTES_UPDATE_GUIDE.md`**
   - Step-by-step route update guide
   - Code examples for each app
   - Testing checklist

3. **`IMPLEMENTATION_COMPLETE.md`**
   - Current status summary
   - Testing guide
   - Quick start instructions

4. **This Document (`NEXT_STEPS.md`)**
   - Roadmap for remaining work
   - Prioritized task list
   - Timeline estimates

---

## 🎓 SUCCESS CRITERIA

### Phase Complete When:
- [ ] All app routes migrated to hybrid system
- [ ] Frontend displays subscription & quota correctly
- [ ] Payment integration working end-to-end
- [ ] All tests passing (unit, integration, E2E)
- [ ] Deployed to production without errors
- [ ] Monitoring & alerts configured
- [ ] Documentation complete
- [ ] Team trained on new system

---

## 🚨 BLOCKERS & DEPENDENCIES

### Known Blockers:
- None currently

### Dependencies:
- Frontend framework (React/Next.js) - Already in place
- Payment gateway (Duitku) - Already integrated for credits
- Email service (for notifications) - May need setup
- Analytics platform - May need setup

---

## 📝 NOTES

### Important Decisions to Make:
1. **Pricing Strategy:**
   - Final prices for each tier?
   - Free trial period?
   - Discount for yearly plans?

2. **Quota Limits:**
   - Final quota per tier?
   - Grace period if exceeded?
   - Overage charges?

3. **Renewal Policy:**
   - Auto-renewal default on or off?
   - Grace period for failed payments?
   - Downgrade to free tier or disable account?

4. **Model Availability:**
   - Which models are free vs paid?
   - Beta model access rules?
   - New model launch strategy?

---

## 💬 FEEDBACK & ITERATION

After each phase:
1. Gather user feedback
2. Review analytics
3. Identify pain points
4. Prioritize improvements
5. Iterate and improve

---

**🎯 GOAL: Full Production Launch within 7-8 Weeks**

**Current Status:** ✅ Week 0 Complete (Core System)
**Next Milestone:** Week 1-2 (App Routes Migration)

---

*Document created: 2025-01-15*
*Last updated: 2025-01-15*
*Maintained by: Development Team*
