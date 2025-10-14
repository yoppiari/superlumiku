# Authorization System Documentation

## Overview

The Superlumiku authorization system ensures that users can only access, modify, and delete their own resources across all applications. This document explains the architecture, usage, and best practices for the centralized authorization system.

## Table of Contents

1. [Architecture](#architecture)
2. [Core Components](#core-components)
3. [Usage Guide](#usage-guide)
4. [Security Principles](#security-principles)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)
7. [API Reference](#api-reference)

---

## Architecture

### System Diagram

```
┌─────────────┐
│   Routes    │  ← HTTP Endpoints
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Services   │  ← Business Logic + Authorization Calls
└──────┬──────┘
       │
       ├──────────────────────────────┐
       │                              │
       ▼                              ▼
┌────────────────────┐      ┌──────────────────┐
│ AuthorizationService│      │   Repositories   │
└────────────────────┘      └──────────────────┘
       │                              │
       └──────────────┬───────────────┘
                      ▼
            ┌───────────────────┐
            │  Prisma + Database │
            └───────────────────┘
```

### Design Principles

1. **Defense in Depth**: Multiple layers of authorization checks
2. **Fail Securely**: Return 404 instead of 403 to avoid information leakage
3. **Single Source of Truth**: Centralized authorization logic
4. **Type Safety**: Full TypeScript support throughout
5. **Auditable**: All authorization failures are logged

---

## Core Components

### 1. Authorization Service

**Location:** `backend/src/services/authorization.service.ts`

Centralized service that handles all resource ownership verification.

**Key Features:**
- Generic ownership verification methods
- Consistent error handling
- Audit logging
- Support for batch operations
- Extensible for future permission models

### 2. Custom Error Classes

**Location:** `backend/src/errors/AuthorizationError.ts`

**Error Types:**

```typescript
// Resource not found OR user doesn't have access
// Returns: 404 (hides resource existence)
ResourceNotFoundError

// User explicitly denied access
// Returns: 403 (only use when appropriate)
AuthorizationError
```

### 3. Resource Types

Supported resource types across all apps:

- **Carousel Mix**: `CarouselProject`, `CarouselSlide`, `CarouselText`, `CarouselGeneration`
- **Avatar Creator**: `AvatarProject`, `Avatar`, `AvatarGeneration`
- **Video Mixer**: `VideoMixerProject`, `VideoMixerGroup`, `VideoMixerVideo`, `VideoMixerGeneration`
- **Looping Flow**: `LoopingFlowProject`, `LoopingFlowVideo`, `LoopingFlowGeneration`, `LoopingFlowAudioLayer`
- **Avatar Generator**: `AvatarGeneratorGeneration`

---

## Usage Guide

### Basic Authorization Check

```typescript
import { authorizationService } from '../services/authorization.service'

async function deleteSlide(slideId: string, userId: string) {
  // Verify user owns the slide (through project ownership)
  await authorizationService.verifyCarouselSlideOwnership(userId, slideId)

  // If we get here, user is authorized
  await repository.deleteSlide(slideId)
}
```

### Get Resource with Authorization

```typescript
async function getProject(projectId: string, userId: string) {
  // Get project WITH ownership check
  const project = await authorizationService.getAuthorizedCarouselProject(
    userId,
    projectId
  )

  // project is guaranteed to belong to userId
  return project
}
```

### Error Handling in Routes

```typescript
import { handleAuthorizationError } from '../errors/AuthorizationError'

routes.delete('/slides/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const slideId = c.req.param('id')

    await service.deleteSlide(slideId, userId)

    return c.json({ success: true })
  } catch (error: any) {
    // Handles ResourceNotFoundError and AuthorizationError
    return handleAuthorizationError(c, error)
  }
})
```

### Batch Operations

```typescript
async function deleteMultipleSlides(slideIds: string[], userId: string) {
  // Verify ownership of all slides in one call
  await authorizationService.verifyBatchOwnership(
    userId,
    slideIds,
    'CarouselSlide'
  )

  // All slides are verified, proceed with deletion
  await Promise.all(slideIds.map(id => repository.deleteSlide(id)))
}
```

---

## Security Principles

### 1. Information Hiding

**Problem:** Returning 403 Forbidden reveals that a resource exists.

**Solution:** Return 404 Not Found for both non-existent resources and unauthorized access.

```typescript
// BAD - Leaks information
if (!resource) {
  return 404  // Resource doesn't exist
}
if (resource.userId !== userId) {
  return 403  // Resource exists but you can't access it (LEAKED!)
}

// GOOD - Hides information
if (!resource || resource.userId !== userId) {
  return 404  // Could be either case - attacker can't tell
}
```

### 2. Audit Logging

All authorization failures are logged for security monitoring:

```typescript
[SECURITY] Authorization failure: {
  timestamp: "2025-10-13T...",
  userId: "user123",
  resourceType: "CarouselProject",
  resourceId: "project456",
  reason: "User does not own resource"
}
```

### 3. Defense in Depth

Authorization checks at multiple layers:

1. **Route Level**: Authentication middleware ensures user is logged in
2. **Service Level**: Authorization checks verify resource ownership
3. **Repository Level**: Some repositories include userId in queries as additional safety

### 4. Type Safety

Full TypeScript typing prevents authorization bypass through type errors:

```typescript
// Compiler ensures userId is always provided
async verifyCarouselProjectOwnership(
  userId: string,   // Required
  projectId: string // Required
): Promise<void>
```

---

## Testing

### Running Authorization Tests

```bash
cd backend
bun test src/services/__tests__/authorization.service.test.ts
```

### Test Categories

1. **Positive Tests**: Verify authorized users can access resources
2. **Negative Tests**: Verify unauthorized users cannot access resources
3. **Edge Cases**: Empty IDs, SQL injection attempts, very long IDs
4. **Error Handling**: Verify correct error types and status codes
5. **Information Leakage**: Verify error messages don't reveal resource existence

### Writing New Tests

```typescript
describe('New Resource Authorization', () => {
  test('should allow owner to access resource', async () => {
    await expect(
      authorizationService.verifyNewResourceOwnership(ownerId, resourceId)
    ).resolves.not.toThrow()
  })

  test('should deny non-owner access', async () => {
    await expect(
      authorizationService.verifyNewResourceOwnership(otherUserId, resourceId)
    ).rejects.toThrow(ResourceNotFoundError)
  })

  test('should return 404 for non-existent resource', async () => {
    await expect(
      authorizationService.verifyNewResourceOwnership(ownerId, 'fake-id')
    ).rejects.toThrow(ResourceNotFoundError)
  })
})
```

---

## Troubleshooting

### Common Issues

#### Issue: User can't access their own resource

**Symptoms:**
- User gets 404 error for their own resource
- Authorization logs show "User does not own resource"

**Possible Causes:**
1. Resource was created with wrong userId
2. UserId changed (e.g., after account merge)
3. Bug in authorization check

**Debug Steps:**
```sql
-- Check resource ownership in database
SELECT id, userId, name FROM CarouselProject WHERE id = 'resource-id';

-- Check if user exists
SELECT id, email FROM User WHERE id = 'user-id';
```

#### Issue: Authorization check is slow

**Symptoms:**
- API endpoint takes >1s to respond
- Database queries are slow

**Possible Causes:**
1. Missing database index on userId
2. N+1 query problem in authorization checks
3. Network latency to database

**Solutions:**
```sql
-- Add index on userId for faster lookups
CREATE INDEX idx_carousel_project_userId ON CarouselProject(userId);

-- Use batch operations instead of loops
await authorizationService.verifyBatchOwnership(userId, ids, resourceType)
```

#### Issue: Too many authorization logs

**Symptoms:**
- Logs are flooded with authorization failures
- Disk space filling up

**Possible Causes:**
1. Automated scanner/bot hitting API
2. Frontend bug making unauthorized requests
3. Actual attack in progress

**Solutions:**
```typescript
// Disable audit logging for specific checks
await authorizationService.verifyOwnership(userId, resourceId, {
  auditLog: false  // Disable logging for this check
})

// Add rate limiting to prevent abuse
// See backend/src/middleware/rate-limit.middleware.ts
```

---

## API Reference

### AuthorizationService Methods

#### Carousel Mix

```typescript
// Project authorization
async verifyCarouselProjectOwnership(
  userId: string,
  projectId: string,
  options?: AuthorizationOptions
): Promise<void>

async getAuthorizedCarouselProject(
  userId: string,
  projectId: string
): Promise<CarouselProject>

// Slide authorization
async verifyCarouselSlideOwnership(
  userId: string,
  slideId: string,
  options?: AuthorizationOptions
): Promise<void>

// Text authorization
async verifyCarouselTextOwnership(
  userId: string,
  textId: string,
  options?: AuthorizationOptions
): Promise<void>

// Generation authorization
async verifyCarouselGenerationOwnership(
  userId: string,
  generationId: string,
  options?: AuthorizationOptions
): Promise<void>
```

#### Video Mixer

```typescript
// Project authorization
async verifyVideoMixerProjectOwnership(
  userId: string,
  projectId: string,
  options?: AuthorizationOptions
): Promise<void>

// Group authorization
async verifyVideoMixerGroupOwnership(
  userId: string,
  groupId: string,
  options?: AuthorizationOptions
): Promise<void>

// Video authorization
async verifyVideoMixerVideoOwnership(
  userId: string,
  videoId: string,
  options?: AuthorizationOptions
): Promise<void>

// Generation authorization
async verifyVideoMixerGenerationOwnership(
  userId: string,
  generationId: string,
  options?: AuthorizationOptions
): Promise<void>
```

#### Looping Flow

```typescript
// Project authorization
async verifyLoopingFlowProjectOwnership(
  userId: string,
  projectId: string,
  options?: AuthorizationOptions
): Promise<void>

// Video authorization
async verifyLoopingFlowVideoOwnership(
  userId: string,
  videoId: string,
  options?: AuthorizationOptions
): Promise<void>

// Generation authorization
async verifyLoopingFlowGenerationOwnership(
  userId: string,
  generationId: string,
  options?: AuthorizationOptions
): Promise<void>

// Audio layer authorization
async verifyLoopingFlowAudioLayerOwnership(
  userId: string,
  layerId: string,
  options?: AuthorizationOptions
): Promise<void>
```

#### Batch Operations

```typescript
async verifyBatchOwnership(
  userId: string,
  resourceIds: string[],
  resourceType: ResourceType
): Promise<void>
```

### Authorization Options

```typescript
interface AuthorizationOptions {
  // If true, throws ResourceNotFoundError instead of AuthorizationError
  // Prevents information leakage (default: true)
  hideExistence?: boolean

  // If true, logs authorization failures for security auditing
  // (default: true)
  auditLog?: boolean
}
```

### Error Classes

```typescript
class ResourceNotFoundError extends Error {
  statusCode: 404
  resourceType: ResourceType
  resourceId: string

  constructor(resourceType: ResourceType, resourceId: string, message?: string)
  toJSON(): { error: string, message: string, resourceType: string, statusCode: number }
}

class AuthorizationError extends Error {
  statusCode: 403
  resourceType: ResourceType
  resourceId: string

  constructor(resourceType: ResourceType, resourceId: string, message?: string)
  toJSON(): { error: string, message: string, resourceType: string, statusCode: number }
}
```

### Helper Functions

```typescript
// Convert authorization errors to HTTP responses
function handleAuthorizationError(c: Context, error: any): Response

// Check if error is authorization-related
function isAuthorizationError(error: any): boolean
```

---

## Best Practices

### DO:

1. **Always verify ownership before operations**
   ```typescript
   async deleteResource(resourceId: string, userId: string) {
     await authService.verifyOwnership(userId, resourceId)
     await repo.delete(resourceId)
   }
   ```

2. **Use ResourceNotFoundError for privacy**
   ```typescript
   // Hides whether resource exists
   if (!resource || resource.userId !== userId) {
     throw new ResourceNotFoundError(resourceType, resourceId)
   }
   ```

3. **Add authorization to new features immediately**
   ```typescript
   // Don't leave TODO comments - implement authorization NOW
   async newFeature(resourceId: string, userId: string) {
     await authService.verifyOwnership(userId, resourceId)
     // ... implementation
   }
   ```

### DON'T:

1. **Don't skip authorization checks**
   ```typescript
   // BAD - No authorization check
   async deleteResource(resourceId: string) {
     await repo.delete(resourceId)
   }
   ```

2. **Don't return 403 for unauthorized access**
   ```typescript
   // BAD - Leaks information
   if (resource.userId !== userId) {
     return c.json({ error: 'Forbidden' }, 403)  // Reveals resource exists!
   }
   ```

3. **Don't forget batch operations**
   ```typescript
   // BAD - N+1 authorization checks
   for (const id of ids) {
     await authService.verifyOwnership(userId, id)
   }

   // GOOD - Batch check
   await authService.verifyBatchOwnership(userId, ids, resourceType)
   ```

---

## Security Checklist

For each new endpoint:

- [ ] Authentication middleware applied (`authMiddleware`)
- [ ] UserId extracted from context (`c.get('userId')`)
- [ ] Authorization check performed before operations
- [ ] Errors handled with `handleAuthorizationError()`
- [ ] Tests written for authorized and unauthorized access
- [ ] Tests verify 404 is returned (not 403)
- [ ] Audit logging enabled for sensitive operations
- [ ] No information leakage in error messages

---

## Migration Guide

See [AUTHORIZATION_MIGRATION_GUIDE.md](./AUTHORIZATION_MIGRATION_GUIDE.md) for detailed migration steps.

---

## Support

For questions or issues:
1. Check this documentation
2. Check test files for examples
3. Review security audit report
4. Contact the security team

---

**Last Updated:** 2025-10-13
**Version:** 1.0.0
**Maintainer:** Security Team
