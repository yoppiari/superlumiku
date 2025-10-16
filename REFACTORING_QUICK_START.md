# Refactoring Quick Start Guide
## New Developer Reference for Refactored Services

This guide helps developers quickly adopt the new refactored services in their route handlers.

---

## Credits Service

### Import
```typescript
import { creditsService } from '../../services/credits.service'
```

### Common Operations

#### 1. Deduct Credits (Most Common)
```typescript
// Replace manual credit checking with this
const result = await creditsService.deduct({
  userId: c.get('userId'),
  amount: 10,
  action: 'generate_avatar',
  appId: 'avatar-creator',
  metadata: { projectId, generationId }  // Optional tracking data
})

// Return in response
return c.json({
  success: true,
  creditUsed: result.creditUsed,        // 0 for enterprise users
  creditBalance: result.newBalance,
  isEnterprise: result.isEnterprise
})
```

#### 2. Check Balance Before Action
```typescript
const check = await creditsService.checkBalance(userId, 50, 'avatar-creator')

if (!check.canProceed) {
  throw new InsufficientCreditsError(check.required, check.balance)
}
```

#### 3. Refund Credits (On Failure)
```typescript
// In worker error handler
try {
  // ... generation logic
} catch (error) {
  // Refund credits if generation fails
  await creditsService.refund({
    userId,
    amount: creditCost,
    reason: 'Generation failed',
    referenceId: generationId
  })
  throw error
}
```

#### 4. Add Credits (Purchase/Admin)
```typescript
// After successful payment
const newBalance = await creditsService.add(
  userId,
  100,
  'purchase',
  'Credit package purchase',
  paymentId
)
```

---

## Validation Service

### Import
```typescript
import { validationService } from '../../services/validation.service'
```

### Common Operations

#### 1. Validate Image Upload
```typescript
const file = body['image'] as File
if (!file) {
  throw new ValidationError('Image file is required')
}

// Comprehensive validation with security checks
const validated = await validationService.validateImage(file, {
  maxSizeBytes: 10 * 1024 * 1024,  // 10MB
  minWidth: 512,
  minHeight: 512,
  maxWidth: 4096,
  maxHeight: 4096,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp']
})

// Use validated data
await saveFile(validated.buffer, validated.secureFilename, 'avatars')
```

#### 2. Validate Video Upload
```typescript
const validated = await validationService.validateVideo(file, {
  maxSizeBytes: 500 * 1024 * 1024,  // 500MB
  allowedMimeTypes: ['video/mp4', 'video/quicktime'],
  allowedExtensions: ['.mp4', '.mov']
})

// Save with secure filename
await saveFile(file, validated.secureFilename, 'videos')
```

#### 3. Validate Audio Upload
```typescript
const validated = await validationService.validateAudio(file, {
  maxSizeBytes: 50 * 1024 * 1024,  // 50MB
  allowedMimeTypes: ['audio/mpeg', 'audio/wav'],
  allowedExtensions: ['.mp3', '.wav']
})
```

#### 4. Validate Input Data
```typescript
// Range validation
validationService.validateRange(slidePosition, 1, 8, 'slidePosition')

// Enum validation
validationService.validateEnum(loopStyle, ['simple', 'crossfade', 'boomerang'], 'loopStyle')

// String length validation
validationService.validateStringLength(projectName, 1, 100, 'projectName')

// Required field validation
validationService.validateRequired(body.name, 'name')

// UUID validation
validationService.validateUUID(projectId, 'projectId')

// Array length validation
validationService.validateArrayLength(items, 1, 10, 'items')
```

#### 5. Sanitize User Input
```typescript
const safeName = validationService.sanitizeInput(userInput)
const safeDescription = validationService.sanitizeInput(description, true) // Allow newlines
```

---

## Error Handling

### Import
```typescript
import { asyncHandler } from '../../core/errors/ErrorHandler'
import { ValidationError, NotFoundError, InsufficientCreditsError } from '../../core/errors'
```

### Use asyncHandler for All Routes
```typescript
// OLD WAY - Don't do this
app.get('/resource/:id', authMiddleware, async (c) => {
  try {
    const resource = await getResource(c.req.param('id'))
    return c.json({ resource })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// NEW WAY - Use asyncHandler
app.get('/resource/:id',
  authMiddleware,
  asyncHandler(async (c) => {
    const resource = await getResource(c.req.param('id'))
    return c.json({ resource })
  }, 'Get Resource')  // Operation name for logging
)
```

### Throw Specific Errors
```typescript
// Don't throw generic Error
throw new Error('User not found')  // BAD

// Throw specific error types
throw new NotFoundError('User not found')  // GOOD
throw new ValidationError('Invalid email format', { field: 'email' })
throw new InsufficientCreditsError(required, available)
```

---

## Complete Route Example

### Before Refactoring
```typescript
app.post('/projects/:projectId/generate', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('projectId')
    const body = await c.req.json()

    // Manual validation
    if (!body.name || body.name.length < 1) {
      return c.json({ error: 'Name is required' }, 400)
    }

    // Manual credit checking
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { userTags: true },
    })

    const tags = user?.userTags ? JSON.parse(user.userTags) : []
    const hasEnterprise = tags.includes('enterprise_unlimited')

    let creditCost = 10
    if (!hasEnterprise) {
      const balance = await getCreditBalance(userId)
      if (balance < creditCost) {
        return c.json({ error: 'Insufficient credits' }, 402)
      }
    } else {
      creditCost = 0
    }

    // File validation
    const file = body.file as File
    if (!file) {
      return c.json({ error: 'File required' }, 400)
    }

    const allowedTypes = ['image/jpeg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: 'Invalid file type' }, 400)
    }

    if (file.size > 10 * 1024 * 1024) {
      return c.json({ error: 'File too large' }, 413)
    }

    // Business logic
    const generation = await service.createGeneration(projectId, userId, body)

    // Manual credit deduction
    await prisma.credit.create({
      data: {
        userId,
        amount: -creditCost,
        balance: balance - creditCost,
        type: 'usage',
        description: 'Generation',
      },
    })

    return c.json({
      success: true,
      generation,
      creditUsed: creditCost,
    })

  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})
```

**Lines of Code:** 68
**Issues:** Manual validation, duplicated credit logic, poor error handling

---

### After Refactoring
```typescript
import { asyncHandler } from '../../core/errors/ErrorHandler'
import { creditsService } from '../../services/credits.service'
import { validationService } from '../../services/validation.service'
import { validateBody } from '../../middleware/validation.middleware'

const generateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
})

app.post('/projects/:projectId/generate',
  authMiddleware,
  validateBody(generateSchema),
  asyncHandler(async (c) => {
    const userId = c.get('userId')
    const projectId = c.req.param('projectId')
    const body = c.get('validatedBody')

    // File validation with security
    const file = body.file as File
    const validated = await validationService.validateImage(file, {
      maxSizeBytes: 10 * 1024 * 1024
    })

    // Business logic
    const generation = await service.createGeneration(projectId, userId, body)

    // Credit deduction with enterprise support
    const result = await creditsService.deduct({
      userId,
      amount: 10,
      action: 'generate',
      appId: 'my-app',
      metadata: { generationId: generation.id, projectId }
    })

    return c.json({
      success: true,
      generation,
      creditUsed: result.creditUsed,
      creditBalance: result.newBalance
    })
  }, 'Generate')
)
```

**Lines of Code:** 35 (**48% reduction**)
**Benefits:** Cleaner, more secure, reusable, better error handling

---

## Migration Checklist

When refactoring a route, use this checklist:

- [ ] Replace try/catch with `asyncHandler`
- [ ] Use `creditsService.deduct()` instead of manual credit checking
- [ ] Use `validationService` for file uploads
- [ ] Use Zod schemas with `validateBody` middleware
- [ ] Throw specific error types (ValidationError, NotFoundError, etc.)
- [ ] Add operation name to asyncHandler for logging
- [ ] Remove manual error responses (asyncHandler handles them)
- [ ] Test the refactored route
- [ ] Update route documentation if needed

---

## Common Patterns

### Pattern 1: Check-then-Action
```typescript
// Check balance first, then perform action
asyncHandler(async (c) => {
  const check = await creditsService.checkBalance(userId, amount, appId)

  if (!check.canProceed) {
    return c.json({
      error: 'Insufficient credits',
      required: check.required,
      available: check.balance
    }, 402)
  }

  // Perform action
  const result = await performAction()

  // Deduct credits after success
  await creditsService.deduct({ userId, amount, action, appId })

  return c.json({ success: true, result })
}, 'Action Name')
```

### Pattern 2: Deduct-then-Refund-on-Failure
```typescript
// Deduct optimistically, refund if fails
asyncHandler(async (c) => {
  // Deduct credits first
  const creditResult = await creditsService.deduct({
    userId,
    amount,
    action,
    appId
  })

  try {
    // Perform action
    const result = await performAction()
    return c.json({ success: true, result })

  } catch (error) {
    // Refund credits on failure
    await creditsService.refund({
      userId,
      amount: creditResult.creditUsed,
      reason: 'Action failed'
    })
    throw error
  }
}, 'Action Name')
```

### Pattern 3: Multi-step with Partial Refunds
```typescript
asyncHandler(async (c) => {
  // Step 1: Deduct full amount
  const creditResult = await creditsService.deduct({
    userId,
    amount: 100,
    action: 'multi_step',
    appId
  })

  try {
    // Step 1 succeeds (costs 50 credits)
    await step1()

    try {
      // Step 2 may fail (costs 50 credits)
      await step2()
      return c.json({ success: true })

    } catch (step2Error) {
      // Refund unused credits from step 2
      await creditsService.refund({
        userId,
        amount: 50,
        reason: 'Step 2 failed'
      })
      throw step2Error
    }

  } catch (step1Error) {
    // Refund all credits if step 1 fails
    await creditsService.refund({
      userId,
      amount: creditResult.creditUsed,
      reason: 'Step 1 failed'
    })
    throw step1Error
  }
}, 'Multi Step Action')
```

---

## Testing Your Refactored Routes

### Unit Test Template
```typescript
import { describe, test, expect, beforeEach } from 'bun:test'
import { creditsService } from '../services/credits.service'
import prisma from '../db/client'

describe('My Route', () => {
  let testUserId: string

  beforeEach(async () => {
    // Setup test user with credits
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        password: 'hashed',
        userTags: JSON.stringify([])
      }
    })
    testUserId = user.id

    await prisma.credit.create({
      data: {
        userId: testUserId,
        amount: 100,
        balance: 100,
        type: 'admin_grant',
        description: 'Test credits'
      }
    })
  })

  test('should deduct credits successfully', async () => {
    const result = await creditsService.deduct({
      userId: testUserId,
      amount: 10,
      action: 'test_action',
      appId: 'test-app'
    })

    expect(result.creditUsed).toBe(10)
    expect(result.newBalance).toBe(90)
  })

  // Add more tests...
})
```

---

## FAQ

### Q: Should I migrate all routes at once?
**A:** No, migrate incrementally. Start with new routes, then gradually refactor existing ones.

### Q: What if my route has custom credit logic?
**A:** The credits service supports all standard patterns. For custom logic, extend the service or use it as a building block.

### Q: Do I need to update tests when refactoring?
**A:** Yes, update tests to use the new services. This often simplifies tests and improves coverage.

### Q: What about backward compatibility?
**A:** All refactoring maintains backward compatibility. Existing middleware and patterns continue to work.

### Q: How do I handle enterprise users?
**A:** The credits service automatically handles enterprise users. Just call `deduct()` - it checks the enterprise tag internally.

### Q: What if validation fails?
**A:** Throw a `ValidationError` with a clear message. The error handler will format it properly for the client.

---

## Need Help?

- See full documentation: `REFACTORING_REPORT.md`
- View test examples: `backend/src/services/__tests__/credits.service.test.ts`
- Check existing implementations: `avatar-creator/routes.ts`

---

**Quick Start Version:** 1.0
**Last Updated:** 2025-10-16
