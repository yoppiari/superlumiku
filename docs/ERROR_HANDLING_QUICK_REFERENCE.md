# Error Handling Quick Reference - Avatar Creator Pattern

## For New Developers

This guide shows how to implement proper error handling in Lumiku apps using the Avatar Creator as a reference.

## Import Required Error Classes

```typescript
// At the top of your routes file
import { asyncHandler } from '../../core/errors/ErrorHandler'
import {
  ValidationError,
  NotFoundError,
  ResourceNotFoundError,
  InsufficientCreditsError,
  // ... other error classes as needed
} from '../../core/errors'
```

## Pattern 1: Simple GET Route

**Use Case**: Fetching a resource by ID

```typescript
// ✅ GOOD - Using asyncHandler
app.get('/projects/:id',
  authMiddleware,
  asyncHandler(async (c) => {
    const userId = c.get('userId')
    const projectId = c.req.param('id')

    // Service throws ResourceNotFoundError if not found
    const project = await service.getProjectById(projectId, userId)

    return c.json({ project })
  }, 'Get Project')
)

// ❌ BAD - Manual try-catch
app.get('/projects/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('id')
    const project = await service.getProjectById(projectId, userId)
    if (!project) {
      return c.json({ error: 'Not found' }, 404)
    }
    return c.json({ project })
  } catch (error: any) {
    console.error(error)
    return c.json({ error: error.message }, 500)
  }
})
```

## Pattern 2: POST Route with Validation

**Use Case**: Creating a resource with input validation

```typescript
// ✅ GOOD
app.post('/projects',
  authMiddleware,
  validateBody(createProjectSchema),
  asyncHandler(async (c) => {
    const userId = c.get('userId')
    const body = c.get('validatedBody') as CreateProjectInput

    const project = await service.createProject(userId, body)

    return c.json({
      message: 'Project created successfully',
      project,
    })
  }, 'Create Project')
)
```

## Pattern 3: Manual Validation

**Use Case**: Validating conditions not covered by Zod

```typescript
// ✅ GOOD - Throw typed error
app.post('/upload',
  authMiddleware,
  asyncHandler(async (c) => {
    const body = await c.req.parseBody()
    const file = body['image'] as File

    if (!file) {
      throw new ValidationError('Image file is required')
    }

    const result = await service.uploadImage(file)
    return c.json({ result })
  }, 'Upload Image')
)

// ❌ BAD - Manual error response
app.post('/upload', authMiddleware, async (c) => {
  try {
    const body = await c.req.parseBody()
    const file = body['image'] as File

    if (!file) {
      return c.json({ error: 'Image file is required' }, 400)
    }

    const result = await service.uploadImage(file)
    return c.json({ result })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})
```

## Pattern 4: Credit Checking

**Use Case**: Checking user has sufficient credits

```typescript
// ✅ GOOD
app.post('/generate',
  authMiddleware,
  asyncHandler(async (c, next) => {
    const userId = c.get('userId')
    const creditCost = 10

    const balance = await getCreditBalance(userId)

    if (balance < creditCost) {
      throw new InsufficientCreditsError(creditCost, balance)
    }

    c.set('creditCost', creditCost)
    await next()
  }, 'Check Credits'),
  asyncHandler(async (c) => {
    // ... generation logic
  }, 'Generate')
)

// ❌ BAD - Manual credit check
app.post('/generate', authMiddleware, async (c) => {
  try {
    const balance = await getCreditBalance(userId)
    if (balance < 10) {
      return c.json({
        error: 'Insufficient credits',
        required: 10,
        current: balance
      }, 402)
    }
    // ... rest
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})
```

## Pattern 5: Service Layer

**Use Case**: Service methods that fetch resources

```typescript
// ✅ GOOD - Throw error, never return null
class MyService {
  async getProjectById(projectId: string, userId: string): Promise<Project> {
    const project = await repository.findById(projectId, userId)

    if (!project) {
      throw new ResourceNotFoundError('Project', projectId)
    }

    return project // Always returns or throws
  }
}

// ❌ BAD - Return null, caller must check
class MyService {
  async getProjectById(projectId: string, userId: string): Promise<Project | null> {
    return repository.findById(projectId, userId) // May be null
  }
}
```

## Pattern 6: Worker Error Handling

**Use Case**: Background job error handling

```typescript
// ✅ GOOD - Structured error handling
async processJob(job: Job) {
  try {
    // ... processing logic
  } catch (error) {
    const structuredError = error instanceof BaseAppError
      ? error
      : error instanceof Error
      ? new AIProviderError('ServiceName', error.message)
      : new InternalError('Job processing failed')

    console.error('Job failed:', {
      jobId: job.id,
      errorCode: structuredError.errorCode,
      errorMessage: structuredError.message,
      errorCategory: structuredError.category,
      stack: structuredError.stack,
    })

    throw structuredError
  }
}

// ❌ BAD - Unstructured logging
async processJob(job: Job) {
  try {
    // ... processing
  } catch (error: any) {
    console.error('Job failed:', error)
    throw error
  }
}
```

## Common Error Classes

| Error Class | HTTP Status | Use Case | Example |
|-------------|-------------|----------|---------|
| `ValidationError` | 400 | Invalid input | `throw new ValidationError('Name is required')` |
| `NotFoundError` | 404 | Generic not found | `throw new NotFoundError('Resource not found')` |
| `ResourceNotFoundError` | 404 | Specific resource | `throw new ResourceNotFoundError('Project', projectId)` |
| `InsufficientCreditsError` | 402 | Credit check | `throw new InsufficientCreditsError(10, 5)` |
| `AIProviderError` | 502 | AI service failure | `throw new AIProviderError('FLUX', 'Timeout')` |
| `DatabaseError` | 500 | Database failure | `throw new DatabaseError('Connection failed')` |

## Error Response Format

All errors return this consistent format:

```json
{
  "error": "User-friendly error message",
  "code": "ERROR_CODE",
  "metadata": {
    "additionalInfo": "..."
  }
}
```

Examples:

### Validation Error
```json
{
  "error": "Image file is required",
  "code": "VALIDATION_ERROR"
}
```

### Resource Not Found
```json
{
  "error": "Project not found",
  "code": "RESOURCE_NOT_FOUND",
  "metadata": {
    "resourceType": "Project",
    "resourceId": "proj_123"
  }
}
```

### Insufficient Credits
```json
{
  "error": "Insufficient credits. Required: 10, Available: 5",
  "code": "INSUFFICIENT_CREDITS",
  "metadata": {
    "required": 10,
    "available": 5
  }
}
```

## Checklist for New Routes

When creating a new route:

- [ ] Import `asyncHandler` and error classes
- [ ] Wrap handler in `asyncHandler()`
- [ ] Provide operation name as second argument
- [ ] Remove manual try-catch blocks
- [ ] Throw typed errors instead of returning error responses
- [ ] Let service layer throw errors for not found cases
- [ ] Use structured logging in workers

## Testing Your Error Handling

```bash
# Test not found
curl -X GET http://localhost:3000/api/apps/myapp/items/invalid_id \
  -H "Authorization: Bearer <token>"
# Expected: 404 with ResourceNotFoundError

# Test validation
curl -X POST http://localhost:3000/api/apps/myapp/items \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{}'
# Expected: 400 with ValidationError

# Test insufficient credits
curl -X POST http://localhost:3000/api/apps/myapp/generate \
  -H "Authorization: Bearer <token>"
# Expected: 402 with InsufficientCreditsError
```

## Migration Checklist

When migrating existing code:

1. [ ] Add error imports
2. [ ] Wrap all route handlers with `asyncHandler()`
3. [ ] Remove manual try-catch blocks
4. [ ] Replace manual error responses with `throw` statements
5. [ ] Update service methods to throw instead of returning null
6. [ ] Add structured error logging to workers
7. [ ] Test all error scenarios
8. [ ] Verify HTTP status codes unchanged

## Questions?

See the full migration guide: `docs/AVATAR_CREATOR_ERROR_MIGRATION.md`

Or check the reference implementation: `backend/src/apps/avatar-creator/routes.ts`
