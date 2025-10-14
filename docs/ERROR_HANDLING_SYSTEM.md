# Comprehensive Error Handling System

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Backend Error Handling](#backend-error-handling)
4. [Frontend Error Handling](#frontend-error-handling)
5. [Integration Guide](#integration-guide)
6. [Usage Examples](#usage-examples)
7. [Best Practices](#best-practices)
8. [Monitoring & Logging](#monitoring--logging)
9. [Troubleshooting](#troubleshooting)

---

## Overview

This centralized error handling system provides comprehensive, production-ready error management for the Lumiku App. It ensures consistent error handling, logging, and user experience across both backend and frontend.

### Key Features

**Backend:**
- Comprehensive error class hierarchy for different error types
- Automatic error normalization (Zod, Prisma, custom errors)
- Structured error logging with context
- Integration points for external monitoring services (Sentry, DataDog, etc.)
- Environment-specific behavior
- Security-focused error responses (no sensitive data leakage)

**Frontend:**
- React Error Boundaries with multiple levels (app, page, component)
- Automatic error recovery strategies
- User-friendly error messages with actionable guidance
- Error logging to backend
- Network error handling and retry logic
- Integration-ready for frontend monitoring tools

### Benefits

1. **Consistency**: Uniform error structure across the entire application
2. **Debugging**: Rich context and structured logs for faster problem resolution
3. **User Experience**: Clear, actionable error messages for users
4. **Monitoring**: Ready for integration with monitoring services
5. **Security**: Prevents sensitive data exposure in error responses
6. **Maintainability**: Single source of truth for error handling logic

---

## Architecture

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                        Application                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐                    ┌──────────────┐       │
│  │   Backend    │                    │   Frontend   │       │
│  │              │                    │              │       │
│  │  ┌────────┐  │                    │  ┌────────┐  │       │
│  │  │ Error  │  │                    │  │ Error  │  │       │
│  │  │ Classes│  │                    │  │ Classes│  │       │
│  │  └───┬────┘  │                    │  └───┬────┘  │       │
│  │      │       │                    │      │       │       │
│  │  ┌───▼────┐  │                    │  ┌───▼────┐  │       │
│  │  │ Error  │  │                    │  │ Error  │  │       │
│  │  │Handler │──┼────────────────────┼──│Boundary│  │       │
│  │  └───┬────┘  │    API Response    │  └───┬────┘  │       │
│  │      │       │                    │      │       │       │
│  │  ┌───▼────┐  │                    │  ┌───▼────┐  │       │
│  │  │ Error  │  │                    │  │ Error  │  │       │
│  │  │ Logger │  │                    │  │ Logger │  │       │
│  │  └───┬────┘  │                    │  └───┬────┘  │       │
│  │      │       │                    │      │       │       │
│  └──────┼───────┘                    └──────┼───────┘       │
│         │                                   │               │
│         │                                   │               │
└─────────┼───────────────────────────────────┼───────────────┘
          │                                   │
          └───────────┬───────────────────────┘
                      │
          ┌───────────▼───────────┐
          │   Monitoring Services  │
          │                        │
          │  • Sentry             │
          │  • LogRocket          │
          │  • DataDog            │
          │  • Custom Services    │
          └────────────────────────┘
```

### Error Flow

1. **Error Occurs**: Exception thrown in backend route handler or frontend component
2. **Error Normalization**: Converted to standardized error class (BaseAppError/AppError)
3. **Error Enrichment**: Context added (user ID, request ID, metadata)
4. **Error Logging**: Logged with appropriate level to console and monitoring services
5. **Error Response**: Consistent JSON response sent to client (backend) or UI displayed (frontend)
6. **Error Recovery**: Retry logic or fallback UI triggered if applicable

---

## Backend Error Handling

### Error Class Hierarchy

All errors extend from `BaseAppError` which implements `IAppError`:

```typescript
// Location: backend/src/core/errors/

BaseAppError (abstract base)
├── ValidationError              // 400 - Input validation failures
│   ├── InvalidInputError
│   └── MissingRequiredFieldError
├── AuthenticationError          // 401 - Auth failures
│   ├── InvalidCredentialsError
│   ├── TokenExpiredError
│   └── TokenInvalidError
├── AuthorizationError           // 403 - Permission denied
│   ├── InsufficientPermissionsError
│   └── ResourceForbiddenError
├── NotFoundError               // 404 - Resource not found
│   └── ResourceNotFoundError
├── ConflictError               // 409 - Resource conflicts
│   └── DuplicateResourceError
├── RateLimitError              // 429 - Rate limiting
│   └── QuotaExceededError
├── BusinessLogicError          // 400/422 - Business rules
│   ├── InsufficientCreditsError
│   ├── InsufficientQuotaError
│   ├── OperationNotAllowedError
│   └── InvalidStateError
├── PaymentError                // 402 - Payment failures
│   ├── PaymentFailedError
│   └── PaymentVerificationError
├── DatabaseError               // 500 - Database issues
│   ├── DatabaseConnectionError
│   └── DatabaseQueryError
├── ExternalServiceError        // 502/503 - External services
│   ├── AIProviderError
│   ├── PaymentGatewayError
│   └── ServiceUnavailableError
└── InternalError               // 500 - Internal errors
    ├── ConfigurationError
    └── UnhandledError
```

### Error Properties

Each error includes:

```typescript
{
  name: string              // Error class name
  message: string           // User-friendly message
  httpStatus: StatusCode    // HTTP status code
  code: ErrorCode           // Machine-readable error code
  category: ErrorCategory   // Error category
  severity: ErrorSeverity   // LOW, MEDIUM, HIGH, CRITICAL
  metadata: ErrorMetadata   // Additional context
  isOperational: boolean    // Operational vs programming error
  timestamp: string         // ISO timestamp
}
```

### Error Codes

Standardized error codes for client-side handling:

```typescript
// Location: backend/src/core/errors/types.ts

export enum ErrorCode {
  // Validation (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Authentication (401)
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // Authorization (403)
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // ... and many more
}
```

### Error Metadata

Rich contextual information for debugging:

```typescript
interface ErrorMetadata {
  userId?: string           // User who triggered the error
  requestId?: string        // Unique request identifier
  path?: string            // API endpoint path
  method?: string          // HTTP method
  resourceType?: string    // Type of resource involved
  resourceId?: string      // Resource identifier
  field?: string           // Field name for validation errors
  retryable?: boolean      // Can operation be retried?
  retryAfter?: number      // Seconds to wait before retry
  [key: string]: any       // Additional custom metadata
}
```

---

## Frontend Error Handling

### Frontend Error Classes

```typescript
// Location: frontend/src/core/errors/

AppError
├── Properties:
│   ├── code: ErrorCode
│   ├── message: string
│   ├── category: ErrorCategory
│   ├── severity: ErrorSeverity
│   ├── metadata: ErrorMetadata
│   └── timestamp: Date
└── Factory Methods:
    ├── fromApiError(AxiosError)
    ├── fromNetworkError(Error)
    ├── fromRenderError(Error, component?)
    └── fromUnknownError(unknown)
```

### Error Boundary Levels

Three levels of error boundaries for different scopes:

1. **App Level** (`level="app"`)
   - Full-screen error page
   - Used at root of application
   - Catches all unhandled errors

2. **Page Level** (`level="page"`)
   - Inline error banner
   - Used for individual pages/routes
   - Allows navigation to other pages

3. **Component Level** (`level="component"`)
   - Minimal inline error message
   - Used for individual components
   - Isolated error handling

### Error Recovery Strategies

The Error Boundary supports automatic recovery:

- **Auto-reset**: Automatically retry transient errors (network, external services)
- **Reset keys**: Reset when specific props change
- **Manual reset**: User-triggered retry
- **Error count tracking**: Prevent infinite retry loops

---

## Integration Guide

### Backend Integration

#### 1. Import Error System

```typescript
// In your route files
import {
  asyncHandler,
  ValidationError,
  AuthenticationError,
  NotFoundError,
  // ... other error classes
} from '@/core/errors'
```

#### 2. Update Hono App Configuration

```typescript
// In app.ts
import { globalErrorHandler, notFoundHandler } from '@/core/errors'

// Register global error handler
app.onError(globalErrorHandler)

// Register 404 handler
app.notFound(notFoundHandler)
```

#### 3. Use in Route Handlers

**Option 1: Using asyncHandler wrapper (Recommended)**

```typescript
import { asyncHandler, sendSuccess } from '@/core/errors'
import { ValidationError, NotFoundError } from '@/core/errors'

app.get('/users/:id', authMiddleware, asyncHandler(async (c) => {
  const id = c.req.param('id')

  // Validation
  if (!id) {
    throw new ValidationError('User ID is required', { field: 'id' })
  }

  // Fetch user
  const user = await prisma.user.findUnique({ where: { id } })

  // Not found
  if (!user) {
    throw new ResourceNotFoundError('User', id)
  }

  return sendSuccess(c, { user })
}, 'Get User'))
```

**Option 2: Manual try-catch**

```typescript
import { handleError, sendSuccess } from '@/core/errors'
import { ValidationError } from '@/core/errors'

app.post('/users', authMiddleware, async (c) => {
  try {
    const body = await c.req.json()

    // Validation
    if (!body.email) {
      throw new ValidationError('Email is required', { field: 'email' })
    }

    // Create user
    const user = await prisma.user.create({ data: body })

    return sendSuccess(c, { user }, 'User created', 201)
  } catch (error) {
    return handleError(c, error, 'Create User')
  }
})
```

#### 4. Initialize Monitoring Services (Optional)

```typescript
// In app.ts or index.ts
import { errorLogger } from '@/core/errors'
import { sentryService } from '@/core/errors/monitoring/SentryService'

// Add Sentry (when configured)
errorLogger.addMonitoringService(sentryService)
```

### Frontend Integration

#### 1. Wrap App with Error Boundary

```typescript
// In App.tsx
import { ErrorBoundary } from '@/core/errors'

function App() {
  return (
    <ErrorBoundary level="app">
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ErrorBoundary>
  )
}
```

#### 2. Wrap Pages with Error Boundaries

```typescript
// In App.tsx or individual page files
import { ErrorBoundary } from '@/core/errors'

<Route
  path="/dashboard"
  element={
    <ErrorBoundary level="page">
      <Dashboard />
    </ErrorBoundary>
  }
/>
```

#### 3. Wrap Components with Error Boundaries

```typescript
import { ErrorBoundary } from '@/core/errors'

function MyPage() {
  return (
    <div>
      <ErrorBoundary level="component">
        <ComplexWidget />
      </ErrorBoundary>

      <ErrorBoundary level="component">
        <AnotherWidget />
      </ErrorBoundary>
    </div>
  )
}
```

#### 4. Handle API Errors

```typescript
import { handleApiError, AppError } from '@/core/errors'
import { api } from '@/lib/api'

async function fetchUsers() {
  try {
    const response = await api.get('/users')
    return response.data
  } catch (error) {
    const appError = handleApiError(error, 'Fetch Users')

    // Show error to user
    toast.error(appError.message)

    throw appError
  }
}
```

#### 5. Use Error Logger

```typescript
import { errorLogger } from '@/core/errors'

try {
  // Some operation
} catch (error) {
  errorLogger.logError(error, { component: 'MyComponent', action: 'saveData' })
  // Error is automatically sent to backend if configured
}
```

---

## Usage Examples

### Backend Examples

#### Example 1: Validation Error

```typescript
import { asyncHandler, ValidationError } from '@/core/errors'
import { z } from 'zod'

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
})

app.post('/users', asyncHandler(async (c) => {
  const body = await c.req.json()

  // Zod validation (automatically converted to ValidationError)
  const data = CreateUserSchema.parse(body)

  // Additional business logic validation
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  })

  if (existingUser) {
    throw new DuplicateResourceError('User', 'email')
  }

  const user = await prisma.user.create({ data })

  return sendSuccess(c, { user }, 'User created', 201)
}, 'Create User'))
```

#### Example 2: Authorization Check

```typescript
import { asyncHandler, ResourceForbiddenError } from '@/core/errors'

app.delete('/projects/:id', authMiddleware, asyncHandler(async (c) => {
  const projectId = c.req.param('id')
  const userId = c.get('userId')

  // Fetch project
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  })

  if (!project) {
    throw new ResourceNotFoundError('Project', projectId)
  }

  // Check ownership
  if (project.userId !== userId) {
    throw new ResourceForbiddenError('Project', projectId)
  }

  // Delete project
  await prisma.project.delete({ where: { id: projectId } })

  return sendSuccess(c, null, 'Project deleted', 204)
}, 'Delete Project'))
```

#### Example 3: External Service Error

```typescript
import { asyncHandler, AIProviderError } from '@/core/errors'

app.post('/generate', authMiddleware, asyncHandler(async (c) => {
  const { prompt } = await c.req.json()

  try {
    const result = await huggingFaceClient.generate(prompt)
    return sendSuccess(c, { result })
  } catch (error) {
    // Wrap external service errors
    throw new AIProviderError(
      'HuggingFace',
      'Failed to generate image',
      { prompt, originalError: error.message }
    ).asRetryable(60) // Retry after 60 seconds
  }
}, 'Generate Image'))
```

#### Example 4: Business Logic Error

```typescript
import { asyncHandler, InsufficientCreditsError } from '@/core/errors'

app.post('/avatar/generate', authMiddleware, asyncHandler(async (c) => {
  const userId = c.get('userId')
  const { modelId } = await c.req.json()

  // Get model cost
  const model = await prisma.avatarModel.findUnique({
    where: { id: modelId }
  })

  const cost = model.creditCost

  // Check balance
  const balance = await prisma.credit.findUnique({
    where: { userId }
  })

  if (balance.amount < cost) {
    throw new InsufficientCreditsError(cost, balance.amount)
  }

  // Proceed with generation...

  return sendSuccess(c, { generationId })
}, 'Generate Avatar'))
```

### Frontend Examples

#### Example 1: Custom Error Boundary Fallback

```typescript
import { ErrorBoundary, AppError } from '@/core/errors'

function Dashboard() {
  return (
    <ErrorBoundary
      level="page"
      fallback={(error: AppError, reset: () => void) => (
        <div className="p-4 bg-red-50 rounded">
          <h2 className="font-bold text-red-900">Dashboard Error</h2>
          <p className="text-red-700">{error.message}</p>
          <button
            onClick={reset}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded"
          >
            Retry
          </button>
        </div>
      )}
    >
      <DashboardContent />
    </ErrorBoundary>
  )
}
```

#### Example 2: Error Recovery with Reset Keys

```typescript
import { ErrorBoundary } from '@/core/errors'
import { useState } from 'react'

function UserProfile() {
  const [userId, setUserId] = useState('123')

  return (
    <ErrorBoundary
      level="component"
      resetKeys={[userId]} // Reset error when userId changes
      onError={(error) => {
        console.error('Profile error:', error)
      }}
      onReset={() => {
        console.log('Profile reset')
      }}
    >
      <ProfileContent userId={userId} />
    </ErrorBoundary>
  )
}
```

#### Example 3: Handling API Errors with Retry

```typescript
import { retryWithBackoff, AppError } from '@/core/errors'
import { api } from '@/lib/api'

async function fetchWithRetry() {
  try {
    const data = await retryWithBackoff(
      () => api.get('/users'),
      {
        maxRetries: 3,
        initialDelay: 1000,
        backoffMultiplier: 2,
        onRetry: (attempt, error) => {
          console.log(`Retry attempt ${attempt}:`, error)
          toast.info(`Retrying... (${attempt}/3)`)
        }
      }
    )
    return data
  } catch (error) {
    const appError = AppError.fromUnknownError(error)
    toast.error(appError.message)
    throw appError
  }
}
```

#### Example 4: Using Error Messages

```typescript
import { AppError, getErrorMessage, formatErrorMessage } from '@/core/errors'

function handleError(error: unknown) {
  const appError = AppError.fromUnknownError(error)

  // Get structured error message
  const errorMessage = getErrorMessage(appError.code)

  // Show to user
  showNotification({
    title: errorMessage.title,
    message: errorMessage.message,
    action: errorMessage.action,
    type: 'error'
  })

  // Or format with context
  const formattedMessage = formatErrorMessage(appError.code, appError.metadata)
  console.error(formattedMessage)
}
```

---

## Best Practices

### Backend

1. **Always use specific error classes**
   ```typescript
   // Good
   throw new ResourceNotFoundError('User', userId)

   // Avoid
   throw new Error('User not found')
   ```

2. **Provide rich metadata**
   ```typescript
   throw new ValidationError('Invalid email format', {
     field: 'email',
     value: email,
     expectedFormat: 'user@example.com'
   })
   ```

3. **Use asyncHandler for consistent error handling**
   ```typescript
   // Wraps route handler and automatically catches errors
   app.get('/users', authMiddleware, asyncHandler(async (c) => {
     // Route logic
   }, 'Get Users'))
   ```

4. **Mark retryable errors appropriately**
   ```typescript
   throw new ServiceUnavailableError('AI Provider', 60)
     .asRetryable(60) // Retry after 60 seconds
   ```

5. **Don't expose sensitive information**
   ```typescript
   // Good
   throw new AuthenticationError('Invalid credentials')

   // Avoid
   throw new AuthenticationError(`User ${email} not found in database`)
   ```

### Frontend

1. **Wrap application with multiple error boundary levels**
   ```typescript
   // App level (root)
   <ErrorBoundary level="app">
     {/* Page level */}
     <ErrorBoundary level="page">
       {/* Component level */}
       <ErrorBoundary level="component">
         <Widget />
       </ErrorBoundary>
     </ErrorBoundary>
   </ErrorBoundary>
   ```

2. **Always handle API errors**
   ```typescript
   try {
     await api.post('/users', data)
   } catch (error) {
     const appError = handleApiError(error, 'Create User')
     // Show error to user
     toast.error(appError.message)
   }
   ```

3. **Use error recovery strategies**
   ```typescript
   <ErrorBoundary
     resetKeys={[userId, projectId]}
     onError={(error) => {
       // Log or notify monitoring service
     }}
     onReset={() => {
       // Clean up or refetch data
     }}
   >
     <Component />
   </ErrorBoundary>
   ```

4. **Provide user-friendly messages**
   ```typescript
   // Use error message system
   const message = getErrorMessage(error.code)
   showNotification({
     title: message.title,
     message: message.message,
     action: message.action
   })
   ```

---

## Monitoring & Logging

### Backend Logging

The error logger automatically logs all errors with structured data:

```typescript
{
  timestamp: '2025-10-14T10:30:00.000Z',
  severity: 'HIGH',
  category: 'DATABASE',
  code: 'DATABASE_QUERY_ERROR',
  message: 'Failed to fetch user',
  httpStatus: 500,
  metadata: {
    userId: 'user-123',
    requestId: 'req-456',
    path: '/api/users/123',
    method: 'GET',
    query: 'SELECT * FROM users WHERE id = $1',
    stackTrace: '...'
  },
  environment: 'production'
}
```

### Log Levels

Errors are logged based on severity:

- **CRITICAL**: Always logged, immediate attention required
- **HIGH**: Always logged in production
- **MEDIUM**: Logged in production (configurable)
- **LOW**: Only logged in development

### Integrating Monitoring Services

#### Sentry Integration

1. Install Sentry:
   ```bash
   npm install @sentry/node @sentry/tracing
   ```

2. Configure Sentry service (see `backend/src/core/errors/monitoring/SentryService.ts`)

3. Initialize:
   ```typescript
   import { errorLogger } from '@/core/errors'
   import { sentryService } from '@/core/errors/monitoring/SentryService'

   errorLogger.addMonitoringService(sentryService)
   ```

#### Custom Monitoring Service

Implement `IMonitoringService` interface:

```typescript
import { IMonitoringService, ErrorMetadata } from '@/core/errors'

class CustomMonitoringService implements IMonitoringService {
  captureError(error: Error, context?: ErrorMetadata): void {
    // Send to your monitoring service
  }

  captureMessage(message: string, level: string, context?: ErrorMetadata): void {
    // Send message to your monitoring service
  }

  setUser(userId: string, email?: string, username?: string): void {
    // Set user context
  }

  addBreadcrumb(message: string, category: string, data?: any): void {
    // Add breadcrumb for context
  }
}

// Register service
errorLogger.addMonitoringService(new CustomMonitoringService())
```

### Frontend Logging

Frontend errors are automatically sent to the backend endpoint (`/api/logs/frontend-error`) if configured.

**Backend endpoint to receive frontend errors:**

```typescript
// In your backend routes
app.post('/api/logs/frontend-error', authMiddleware, asyncHandler(async (c) => {
  const { errors, batch } = await c.req.json()

  // Log to your monitoring service
  for (const errorEntry of errors) {
    console.error('[Frontend Error]', errorEntry)

    // Send to Sentry or other service
    // Sentry.captureException(errorEntry)
  }

  return sendSuccess(c, null, 'Errors logged')
}, 'Log Frontend Errors'))
```

---

## Troubleshooting

### Common Issues

#### Issue 1: Errors not being caught by asyncHandler

**Problem**: Errors thrown in route handlers aren't being handled properly.

**Solution**: Ensure you're using `asyncHandler` and that your route handler is `async`:

```typescript
// Correct
app.get('/users', asyncHandler(async (c) => {
  // async function
  const users = await getUsers()
  return sendSuccess(c, { users })
}, 'Get Users'))

// Incorrect - missing asyncHandler
app.get('/users', async (c) => {
  const users = await getUsers()
  return sendSuccess(c, { users })
})
```

#### Issue 2: Zod errors not being formatted properly

**Problem**: Zod validation errors show raw error messages instead of formatted validation errors.

**Solution**: Zod errors are automatically converted to `ValidationError` by the error handler. Ensure you're using `asyncHandler` or `handleError`:

```typescript
import { z } from 'zod'
import { asyncHandler } from '@/core/errors'

const schema = z.object({
  email: z.string().email('Invalid email format'),
  age: z.number().min(18, 'Must be 18 or older')
})

app.post('/users', asyncHandler(async (c) => {
  const body = await c.req.json()

  // This will automatically be caught and converted to ValidationError
  const data = schema.parse(body)

  // ...
}, 'Create User'))
```

#### Issue 3: Error Boundary not catching errors

**Problem**: React errors are not being caught by Error Boundary.

**Solution**: Error Boundaries only catch errors during rendering, in lifecycle methods, and in constructors. They don't catch:
- Event handler errors
- Async errors
- Server-side rendering errors

For event handlers, use try-catch:

```typescript
function MyComponent() {
  const handleClick = async () => {
    try {
      await doSomething()
    } catch (error) {
      // Handle error or throw to parent error boundary
      errorLogger.logError(error)
      toast.error('Failed to complete action')
    }
  }

  return <button onClick={handleClick}>Click me</button>
}
```

#### Issue 4: Stack traces not showing in production

**Problem**: Error stack traces are missing in production logs.

**Solution**: This is by design for security. Stack traces are only included in development. To enable in production (not recommended for client-facing errors):

```typescript
// Backend
const errorLogger = ErrorLogger.getInstance({
  includeStackTrace: true // Force enable
})

// Frontend
const errorLogger = ErrorLogger.getInstance({
  includeStackTrace: true
})
```

#### Issue 5: Frontend errors not being sent to backend

**Problem**: Frontend errors aren't appearing in backend logs.

**Solution**: Ensure:
1. Error logger is configured to send to backend (default in production)
2. Backend endpoint exists at `/api/logs/frontend-error`
3. User is authenticated (if endpoint requires auth)

```typescript
// Frontend configuration
import { initializeErrorLogger } from '@/core/errors'

initializeErrorLogger({
  logToBackend: true,
  backendEndpoint: '/api/logs/frontend-error'
})
```

---

## Migration from Existing Error Handling

### Step 1: Update Existing Route Handlers

**Before:**
```typescript
app.get('/users/:id', async (c) => {
  try {
    const user = await getUser(c.req.param('id'))
    return c.json({ user })
  } catch (error) {
    return c.json({ error: 'Failed to fetch user' }, 500)
  }
})
```

**After:**
```typescript
import { asyncHandler, sendSuccess, ResourceNotFoundError } from '@/core/errors'

app.get('/users/:id', asyncHandler(async (c) => {
  const user = await getUser(c.req.param('id'))

  if (!user) {
    throw new ResourceNotFoundError('User', c.req.param('id'))
  }

  return sendSuccess(c, { user })
}, 'Get User'))
```

### Step 2: Replace Custom Error Classes

**Before:**
```typescript
// Old custom error
class NotFoundError extends Error {
  statusCode = 404
}

throw new NotFoundError('User not found')
```

**After:**
```typescript
import { ResourceNotFoundError } from '@/core/errors'

throw new ResourceNotFoundError('User', userId)
```

### Step 3: Update Error Responses

**Before:**
```typescript
return c.json({
  error: 'Invalid input',
  details: validationErrors
}, 400)
```

**After:**
```typescript
import { sendError } from '@/core/errors'

return sendError(
  c,
  'Invalid input',
  400,
  ErrorCode.VALIDATION_ERROR,
  validationErrors
)
```

### Step 4: Update Frontend Error Handling

**Before:**
```typescript
try {
  await api.get('/users')
} catch (error) {
  console.error(error)
  toast.error('Failed to load users')
}
```

**After:**
```typescript
import { handleApiError } from '@/core/errors'

try {
  await api.get('/users')
} catch (error) {
  const appError = handleApiError(error, 'Load Users')
  toast.error(appError.message)
}
```

---

## Configuration

### Backend Configuration

Environment variables:

```env
# Error logging
LOG_LEVEL=info              # debug, info, warn, error
LOG_FORMAT=console          # console or json
ERROR_LOG_LEVEL=MEDIUM      # LOW, MEDIUM, HIGH, CRITICAL

# Monitoring
SENTRY_DSN=https://...      # Sentry DSN (optional)
NODE_ENV=production         # Environment
```

### Frontend Configuration

```typescript
// In main.tsx or app initialization
import { initializeErrorLogger } from '@/core/errors'

initializeErrorLogger({
  logToConsole: true,
  logToBackend: import.meta.env.PROD,
  backendEndpoint: '/api/logs/frontend-error',
  includeStackTrace: import.meta.env.DEV,
  batchErrors: import.meta.env.PROD,
  batchSize: 10,
  batchInterval: 5000
})
```

---

## Summary

This comprehensive error handling system provides:

✅ **Consistent error structure** across backend and frontend
✅ **Rich error context** for debugging
✅ **User-friendly messages** with actionable guidance
✅ **Automatic error logging** with structured data
✅ **Integration-ready** for monitoring services
✅ **Security-focused** error responses
✅ **Environment-aware** behavior
✅ **Error recovery** strategies
✅ **Type-safe** error handling with TypeScript

The system is production-ready and can be gradually adopted in existing codebases while maintaining backward compatibility.

For questions or issues, please refer to the troubleshooting section or contact the development team.
