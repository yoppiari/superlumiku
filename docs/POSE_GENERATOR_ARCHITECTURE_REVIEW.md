# Pose Generator - Architecture Review Report

**Review Date:** 2025-10-14
**Reviewer:** Senior Code Reviewer Agent
**Document Reviewed:** `docs/POSE_GENERATOR_ARCHITECTURE.md`
**Overall Score:** 6.9/10
**Approval Status:** ⚠️ **NEEDS REVISION**

---

## Executive Summary

The Pose Generator architecture demonstrates **strong technical fundamentals** with well-thought-out scalability strategies and comprehensive security measures. However, **8 Critical**, **12 High-priority**, and **15 Medium-priority issues** were identified that must be addressed before implementation.

### Critical Concerns

1. **Separate credit system** creates race conditions with main Credit table
2. **Missing foreign key constraints** will cause orphaned records
3. **FLUX API integration** completely undefined
4. **WebSocket architecture** missing despite mentions throughout
5. **Transaction handling** in partial refunds is incorrect

**Recommendation:** Schedule architecture revision to address critical issues before proceeding to Phase 1 implementation.

---

## Scoring Breakdown

| Category | Score | Comments |
|----------|-------|----------|
| Schema Design | 7/10 | Strong normalization; missing FK constraints (-1); separate credit system risk (-2) |
| API Design | 6/10 | RESTful principles followed; missing critical endpoints (-2); no pagination validation (-1) |
| Security | 7/10 | Excellent file validation; missing prompt validation (-1); webhook security undefined (-1) |
| Scalability | 8/10 | Well-designed BullMQ; excellent CDN strategy; missing job recovery (-2) |
| Integration | 8/10 | Clean Avatar Creator integration; inconsistent schema format (-2) |
| AI Pipeline | 6/10 | Smart two-stage approach; FLUX API details missing (-3); no NSFW detection (-1) |
| Credit System | 5/10 | Correct deduct-before pattern; separate table creates races (-3); transaction bugs (-2) |
| Documentation | 8/10 | Excellent diagrams; missing implementation details (-2) |
| **OVERALL** | **6.9/10** | **NEEDS REVISION** |

---

## Critical Issues (Must Fix Before Implementation)

### Issue #1: Separate Credit System Creates Data Inconsistency
**Severity:** 🔴 CRITICAL
**Impact:** Race conditions, double-deduction bugs, refund complexity

**Problem:**
The `user_pose_credits` table creates a parallel credit system independent from the main `Credit` table. This creates two sources of truth.

**Solution:**
Extend existing Credit system with app-specific metadata instead of creating separate table.

```typescript
// RECOMMENDED: Extend existing Credit table
async deductPoseCredits(userId: string, poseCount: number) {
  const creditCost = poseCount * 30

  return await creditService.deductCredits({
    userId,
    amount: creditCost,
    description: `Pose generation: ${poseCount} poses`,
    referenceType: 'pose_generation',
    metadata: {
      app: 'pose-generator',
      poseCount,
      costPerPose: 30
    }
  })
}
```

**For unlimited tier**, add fields to User model:
- `unlimitedPoseActive: boolean`
- `unlimitedPoseDailyQuota: int`
- `unlimitedPoseQuotaUsedToday: int`
- `unlimitedPoseQuotaResetAt: timestamp`

---

### Issue #2: Missing Foreign Key Constraints
**Severity:** 🔴 CRITICAL
**Impact:** Orphaned records, data corruption, no referential integrity

**Problem:**
SQL schemas use TEXT for foreign keys but don't define FOREIGN KEY constraints with cascade rules.

**Solution:**
Convert to Prisma schema with proper relations:

```prisma
model PoseLibrary {
  id              String   @id @default(cuid())
  name            String
  categoryId      String

  category        PoseCategory @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  generatedPoses  GeneratedPose[]

  @@index([categoryId])
  @@map("pose_library")
}

model PoseGeneratorProject {
  id          String   @id @default(cuid())
  userId      String
  avatarId    String?

  user        User @relation(fields: [userId], references: [id], onDelete: Cascade)
  avatar      Avatar? @relation(fields: [avatarId], references: [id], onDelete: SetNull)
  generations PoseGeneration[]

  @@index([userId])
  @@map("pose_generator_projects")
}
```

**Cascade Rules:**
- Projects → Generations: CASCADE (delete generations when project deleted)
- Generations → Poses: CASCADE (delete poses when generation deleted)
- Categories → Library: RESTRICT (prevent deletion of used categories)
- Avatar references: SET NULL (avatar deletion shouldn't delete poses)

---

### Issue #3: FLUX API Integration Details Missing
**Severity:** 🔴 CRITICAL
**Impact:** Implementation blocked, no error handling, cost overruns

**Problem:**
Document mentions FLUX.1-dev but provides zero integration details (endpoint, auth, error codes, rate limits).

**Solution:**
Add comprehensive FLUX API section:

```typescript
// FLUX API Integration Specification

// Provider: Hugging Face Inference API
// Endpoint: https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev
// Authentication: Bearer token (env: HUGGINGFACE_API_KEY)
// Rate Limit: 100 req/hour (free), 1000 req/hour (pro)

interface FluxGenerationRequest {
  inputs: string // Prompt
  parameters: {
    width: number
    height: number
    num_inference_steps: number // 20-50
    guidance_scale: number // 7.5
    negative_prompt?: string
    seed?: number
    controlnet_conditioning_scale?: number // 0.0-1.0
    control_image?: string // Base64 ControlNet pose map
  }
}

// Error Handling:
// - 429 Too Many Requests: Exponential backoff (10s, 20s, 40s)
// - 500 Server Error: Retry 3x with backoff
// - 503 Model Loading: Wait 20s, retry (cold start)
// - 400 Bad Request: Fail immediately, refund user

// Implementation:
import { HfInference } from '@huggingface/inference'

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY)

async function generateWithFlux(prompt: string, controlNetImage: Buffer) {
  const blob = await hf.imageToImage({
    model: 'black-forest-labs/FLUX.1-dev',
    inputs: controlNetImage,
    parameters: {
      prompt,
      strength: 0.75,
      num_inference_steps: 30,
      guidance_scale: 7.5
    }
  })

  return Buffer.from(await blob.arrayBuffer())
}
```

---

### Issue #4: WebSocket Architecture Undefined
**Severity:** 🔴 CRITICAL
**Impact:** No real-time updates, poor UX, scalability issues

**Problem:**
WebSockets mentioned 6+ times but zero architecture provided (auth, routing, reconnection, message format).

**Solution:**
Add WebSocket specification:

```typescript
// WebSocket Real-Time Updates

// Connection: wss://api.lumiku.com/ws?token=<jwt_token>
// Authentication: JWT in query parameter

interface WebSocketMessage {
  type: 'pose_generation_progress' | 'pose_generation_complete' | 'pose_generation_failed'
  generationId: string
  data: any
}

// Progress Update
{
  type: 'pose_generation_progress',
  generationId: 'gen_789',
  data: {
    progress: 45,
    posesCompleted: 9,
    posesTotal: 20,
    currentPose: 'Professional Handshake',
    estimatedTimeRemaining: 180
  }
}

// Implementation: Hono WebSocket + Redis Pub/Sub
// Worker publishes progress → Redis → WebSocket server → Client
```

---

### Issue #5: Partial Refund Transaction Race Condition
**Severity:** 🔴 CRITICAL
**Impact:** Double refunds, credit balance inconsistency

**Problem:**
Refund logic queries generation, counts failed poses, then calls `creditService.addCredits()` in separate transactions.

**Solution:**
Wrap entire refund in single atomic transaction:

```typescript
async function handlePartialFailure(generationId: string) {
  return await prisma.$transaction(async (tx) => {
    // Lock generation record
    const generation = await tx.poseGeneration.findUnique({
      where: { id: generationId },
      include: { poses: { where: { status: 'failed' } } }
    })

    if (!generation) throw new Error('Generation not found')

    // Prevent double refund
    if (generation.creditRefunded > 0) {
      return { alreadyRefunded: true }
    }

    const failedCount = generation.poses.length
    const refundAmount = failedCount * 30

    if (refundAmount === 0) return { refundAmount: 0 }

    // Get latest balance
    const latestCredit = await tx.credit.findFirst({
      where: { userId: generation.userId },
      orderBy: { createdAt: 'desc' }
    })

    const currentBalance = latestCredit?.balance || 0

    // Create refund record
    await tx.credit.create({
      data: {
        userId: generation.userId,
        amount: refundAmount,
        balance: currentBalance + refundAmount,
        type: 'refund',
        description: `Refund for ${failedCount} failed poses`,
        referenceId: generationId,
        referenceType: 'pose_generation'
      }
    })

    // Mark as refunded
    await tx.poseGeneration.update({
      where: { id: generationId },
      data: { creditRefunded: refundAmount, status: 'partial' }
    })

    return { refundAmount, failedCount }
  }, { isolationLevel: 'Serializable' })
}
```

---

### Issue #6: Infinite Loop in Quota Reset
**Severity:** 🔴 CRITICAL
**Impact:** Incorrect quota calculations after multi-day absence

**Problem:**
Quota reset uses `addDays(now, 1)` but doesn't handle multi-day server downtime.

**Solution:**
Period-based quota reset:

```typescript
async function checkUnlimitedQuota(userId: string) {
  const credits = await prisma.userPoseCredits.findUnique({ where: { userId } })
  const now = new Date()
  const todayPeriod = now.toISOString().split('T')[0] // "2025-10-14"
  const lastPeriod = credits.unlimitedQuotaResetAt.toISOString().split('T')[0]

  // Reset if new day
  if (todayPeriod !== lastPeriod) {
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    await prisma.userPoseCredits.update({
      where: { userId },
      data: {
        unlimitedQuotaUsedToday: 0,
        unlimitedQuotaResetAt: tomorrow
      }
    })

    return credits.unlimitedDailyQuota
  }

  return credits.unlimitedDailyQuota - credits.unlimitedQuotaUsedToday
}
```

---

### Issue #7: No Job Recovery for Long-Running Batches
**Severity:** 🔴 CRITICAL
**Impact:** Lost credits on server crashes, poor reliability

**Problem:**
No strategy for resuming interrupted jobs (server crash after 50/100 poses complete).

**Solution:**
Job persistence and recovery:

```typescript
// BullMQ Configuration
const poseQueue = new Queue('pose-generation', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 10000 },
    removeOnComplete: 100,
    removeOnFail: 500
  }
})

// Store progress every 5 poses
await prisma.poseGeneration.update({
  where: { id: generationId },
  data: {
    posesCompleted: completedCount,
    outputUrls: completedUrls,
    status: 'processing'
  }
})

// Recovery on worker restart
const stuckJobs = await prisma.poseGeneration.findMany({
  where: {
    status: 'processing',
    startedAt: { lt: subHours(new Date(), 2) }
  }
})

for (const job of stuckJobs) {
  const remaining = job.totalExpectedPoses - job.posesCompleted
  if (remaining > 0) {
    await poseQueue.add('resume-generation', {
      generationId: job.id,
      startFrom: job.posesCompleted
    })
  }
}
```

---

### Issue #8: No Text Prompt Validation
**Severity:** 🔴 CRITICAL
**Impact:** NSFW content, copyright infringement, GPT-4 abuse

**Problem:**
Text-to-pose mode allows arbitrary input without validation.

**Solution:**
Prompt validation layer:

```typescript
const FORBIDDEN_KEYWORDS = [
  'nude', 'naked', 'nsfw', 'explicit',
  'mickey mouse', 'spiderman', // Copyrighted
  'hitler', 'terrorist' // Inappropriate
]

const MAX_PROMPT_LENGTH = 500

async function validateTextPrompt(prompt: string) {
  if (prompt.length > MAX_PROMPT_LENGTH) {
    throw new ValidationError(`Prompt too long. Max ${MAX_PROMPT_LENGTH} chars`)
  }

  const lower = prompt.toLowerCase()
  for (const keyword of FORBIDDEN_KEYWORDS) {
    if (lower.includes(keyword)) {
      logSecurityViolation('FORBIDDEN_KEYWORD', { keyword })
      throw new ValidationError('Prompt contains inappropriate content')
    }
  }

  // Ensure pose-related
  const poseKeywords = ['pose', 'standing', 'sitting', 'position']
  if (!poseKeywords.some(k => lower.includes(k))) {
    throw new ValidationError('Please describe a pose or body position')
  }

  return true
}
```

---

## High-Priority Issues (12 identified)

### Issue #9: Missing Credit Cost Validation
Client-provided costs must be recalculated server-side to prevent manipulation.

### Issue #10: No Batch-Size-Aware Rate Limiting
Generic 10 req/min allows 1000 poses/min (10 requests × 100 poses).

### Issue #11: File Upload Endpoint Missing
Background upload endpoint referenced but not defined.

### Issue #12: No Prisma Schema Provided
SQL schemas require manual conversion, increasing error risk.

### Issue #13: Background Changer Double Charging
Unclear if background change costs 10 credits during generation or separately.

### Issue #14: Export Format Dimensions Undefined
10+ formats mentioned, zero specifications provided.

### Issue #15: No Pose Library Seeding Strategy
App launches with empty library without seeding plan.

### Issue #16: Missing Payment Webhook Security
Midtrans webhooks need HMAC signature validation.

### Issue #17: No Pose Duplication Detection
Prevents admins from uploading duplicate poses.

### Issue #18: Unlimited Tier Abuse Vector
Timestamp manipulation could reset quota unlimited times.

### Issue #19: No Database Migration Strategy
Production deployment without downtime strategy undefined.

### Issue #20: Missing Monitoring & Alerting
No metrics for queue depth, success rate, cost tracking.

---

## Medium-Priority Issues (15 identified)

Issues #21-35 cover pagination validation, cascade delete rules, unused schema fields, stale job cleanup, health check endpoint, input sanitization, CORS config, and more.

*(Full details in original review document)*

---

## Strengths Identified

1. ✅ **Excellent schema normalization** with hierarchical pose categories
2. ✅ **Pre-computed ControlNet optimization** saves 3-5s per generation
3. ✅ **Deduct-before-generate pattern** prevents race conditions
4. ✅ **Comprehensive indexing strategy** with 40+ indexes
5. ✅ **Realistic AI pipeline design** with two-stage text-to-pose
6. ✅ **Data-driven technology justifications** (R2 vs S3 cost analysis)
7. ✅ **Clean Avatar Creator integration** following plugin patterns
8. ✅ **Fair use enforcement** for unlimited tier (100 poses/day)
9. ✅ **Granular progress tracking** for real-time UX
10. ✅ **Community-driven feature** (pose requests with upvoting)

---

## Recommended Action Plan

### Phase 1: Critical Fixes (Week 1)
1. Redesign credit system to extend existing `Credit` table
2. Convert SQL to Prisma with foreign key constraints
3. Define FLUX API integration specs
4. Add WebSocket architecture section
5. Fix partial refund transaction logic

### Phase 2: High-Priority Fixes (Week 2)
6. Add server-side cost validation
7. Implement batch-aware rate limiting
8. Define file upload endpoint
9. Add comprehensive prompt validation
10. Specify export format dimensions
11. Create pose library seeding strategy

### Phase 3: Documentation Update (Week 2)
12. Add monitoring/alerting section
13. Define health check endpoints
14. Add database migration strategy
15. Document webhook security

### Phase 4: Implementation (Weeks 3-14)
16. Proceed with backend implementation
17. Deploy with monitoring from day one
18. Beta launch with 100 users
19. Public production launch

---

## Approval Status

**⚠️ NEEDS REVISION** - Address critical issues before proceeding to Phase 1 implementation.

The architecture has strong foundations, but the 8 critical issues represent fundamental design decisions that will cause:
- Production bugs
- Security vulnerabilities
- Scalability problems
- Financial losses (double refunds, credit manipulation)

**Recommendation:** Schedule 2-hour architecture revision meeting to address critical issues. These foundations are solid - fixing these issues now prevents significant technical debt.

---

## Next Steps

1. **Review this report** with system-architect agent
2. **Create revised architecture document** addressing all critical issues
3. **Re-submit for review** by senior-code-reviewer
4. **Proceed to Phase 0.3** (UI/UX design) once approved
5. **Begin Phase 1 implementation** with corrected architecture

**Timeline Impact:** +1 week for revisions, but prevents 2-4 weeks of rework later.

---

*Generated by: Senior Code Reviewer Agent*
*Review Date: 2025-10-14*
*Review Duration: Comprehensive analysis of 1,200+ line architecture document*
