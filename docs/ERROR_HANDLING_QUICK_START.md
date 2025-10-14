# Error Handling Quick Start Guide

## 5-Minute Setup

### Backend Setup

1. **Import the error system in your route file:**

```typescript
import { asyncHandler, sendSuccess } from '@/core/errors'
import {
  ValidationError,
  NotFoundError,
  ResourceNotFoundError,
  InsufficientCreditsError,
} from '@/core/errors'
```

2. **Wrap your route handlers with `asyncHandler`:**

```typescript
app.get('/users/:id', authMiddleware, asyncHandler(async (c) => {
  const id = c.req.param('id')
  const user = await prisma.user.findUnique({ where: { id } })

  if (!user) {
    throw new ResourceNotFoundError('User', id)
  }

  return sendSuccess(c, { user })
}, 'Get User'))
```

3. **Register global error handlers in your main app file:**

```typescript
// In backend/src/app.ts
import { globalErrorHandler, notFoundHandler } from './core/errors'

// At the end of your route definitions
app.onError(globalErrorHandler)
app.notFound(notFoundHandler)
```

That's it! Your backend now has comprehensive error handling.

---

### Frontend Setup

1. **Wrap your app with Error Boundary:**

```typescript
// In App.tsx
import { ErrorBoundary } from '@/core/errors'

function App() {
  return (
    <ErrorBoundary level="app">
      <BrowserRouter>
        <Routes>
          {/* Your routes */}
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
```

2. **Wrap pages with page-level boundaries:**

```typescript
<Route
  path="/dashboard"
  element={
    <ErrorBoundary level="page">
      <Dashboard />
    </ErrorBoundary>
  }
/>
```

3. **Handle API errors in your API calls:**

```typescript
import { handleApiError } from '@/core/errors'
import { toast } from '@/components/ui/toast'

async function fetchData() {
  try {
    const response = await api.get('/users')
    return response.data
  } catch (error) {
    const appError = handleApiError(error, 'Fetch Users')
    toast.error(appError.message)
    throw appError
  }
}
```

Done! Your frontend now has error boundaries and API error handling.

---

## Common Error Patterns

### Pattern 1: Simple Validation

```typescript
// Backend
if (!email) {
  throw new ValidationError('Email is required', { field: 'email' })
}

if (!isValidEmail(email)) {
  throw new ValidationError('Invalid email format', { field: 'email', value: email })
}
```

### Pattern 2: Resource Not Found

```typescript
// Backend
const project = await prisma.project.findUnique({ where: { id: projectId } })

if (!project) {
  throw new ResourceNotFoundError('Project', projectId)
}
```

### Pattern 3: Authorization Check

```typescript
// Backend
if (project.userId !== userId) {
  throw new ResourceForbiddenError('Project', projectId)
}
```

### Pattern 4: Insufficient Credits

```typescript
// Backend
if (balance < cost) {
  throw new InsufficientCreditsError(cost, balance)
}
```

### Pattern 5: External Service Error

```typescript
// Backend
try {
  return await aiProvider.generate(prompt)
} catch (error) {
  throw new AIProviderError('OpenAI', error.message)
    .asRetryable(60) // Retry after 60 seconds
}
```

---

## Quick Reference: Error Classes

| Scenario | Error Class | HTTP Status |
|----------|-------------|-------------|
| Missing field | `MissingRequiredFieldError` | 400 |
| Invalid input | `ValidationError` | 400 |
| Wrong credentials | `InvalidCredentialsError` | 401 |
| Token expired | `TokenExpiredError` | 401 |
| No permission | `InsufficientPermissionsError` | 403 |
| Resource forbidden | `ResourceForbiddenError` | 403 |
| Not found | `ResourceNotFoundError` | 404 |
| Already exists | `DuplicateResourceError` | 409 |
| Too many requests | `RateLimitError` | 429 |
| Insufficient credits | `InsufficientCreditsError` | 402 |
| Payment failed | `PaymentFailedError` | 402 |
| Database error | `DatabaseError` | 500 |
| AI service error | `AIProviderError` | 502 |
| Service unavailable | `ServiceUnavailableError` | 503 |

---

## Frontend Error Boundary Cheat Sheet

### App Level (Full Screen)
```typescript
<ErrorBoundary level="app">
  <App />
</ErrorBoundary>
```

### Page Level (Banner)
```typescript
<ErrorBoundary level="page">
  <Dashboard />
</ErrorBoundary>
```

### Component Level (Inline)
```typescript
<ErrorBoundary level="component">
  <Widget />
</ErrorBoundary>
```

### With Custom Fallback
```typescript
<ErrorBoundary
  level="page"
  fallback={(error, reset) => (
    <div>
      <p>Error: {error.message}</p>
      <button onClick={reset}>Retry</button>
    </div>
  )}
>
  <Component />
</ErrorBoundary>
```

### With Reset Keys
```typescript
<ErrorBoundary resetKeys={[userId, projectId]}>
  <Component />
</ErrorBoundary>
```

---

## Testing Your Error Handling

### Backend Tests

```typescript
// Test validation error
it('should throw validation error for missing email', async () => {
  await expect(
    createUser({ name: 'John' }) // missing email
  ).rejects.toThrow(ValidationError)
})

// Test not found error
it('should throw not found error for invalid user ID', async () => {
  await expect(
    getUser('invalid-id')
  ).rejects.toThrow(ResourceNotFoundError)
})

// Test authorization error
it('should throw forbidden error for unauthorized access', async () => {
  await expect(
    deleteProject('project-123', 'wrong-user-id')
  ).rejects.toThrow(ResourceForbiddenError)
})
```

### Frontend Tests

```typescript
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from '@/core/errors'

const ThrowError = () => {
  throw new Error('Test error')
}

it('should catch and display error', () => {
  render(
    <ErrorBoundary level="component">
      <ThrowError />
    </ErrorBoundary>
  )

  expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
})
```

---

## Monitoring Setup (Optional)

### Sentry Integration

1. **Install Sentry:**
```bash
npm install @sentry/node @sentry/tracing
```

2. **Set environment variable:**
```env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

3. **Initialize (already configured):**
The monitoring service will automatically initialize if `SENTRY_DSN` is set.

---

## Troubleshooting

### Errors not being caught?

✅ Make sure you're using `asyncHandler`:
```typescript
app.get('/users', asyncHandler(async (c) => {
  // Your code
}, 'Get Users'))
```

### Zod errors not formatted?

✅ Zod errors are automatically converted. Just use `asyncHandler`:
```typescript
app.post('/users', asyncHandler(async (c) => {
  const data = schema.parse(body) // Auto-handled
  // ...
}, 'Create User'))
```

### Error boundary not catching?

✅ Error boundaries only catch render errors. For event handlers, use try-catch:
```typescript
const handleClick = async () => {
  try {
    await doSomething()
  } catch (error) {
    errorLogger.logError(error)
    toast.error('Failed')
  }
}
```

---

## Next Steps

1. Read the full documentation: `docs/ERROR_HANDLING_SYSTEM.md`
2. Review the examples in your codebase
3. Gradually migrate existing error handling
4. Set up monitoring (Sentry, DataDog, etc.)
5. Configure custom error messages for your domain

---

## Help & Support

- **Full Documentation**: See `docs/ERROR_HANDLING_SYSTEM.md`
- **Examples**: Check existing route handlers for patterns
- **Issues**: Contact the development team

Happy error handling! 🎉
