# Error Handling System - Migration Checklist

This checklist helps you integrate the new error handling system into the Lumiku App systematically.

---

## Phase 1: Setup & Configuration (Day 1)

### Backend Setup

- [ ] **1.1 Register Global Error Handlers**
  ```typescript
  // In backend/src/app.ts
  import { globalErrorHandler, notFoundHandler } from './core/errors'

  // Add at the end of route definitions
  app.onError(globalErrorHandler)
  app.notFound(notFoundHandler)
  ```
  **Test**: Visit a non-existent route and verify 404 response format

- [ ] **1.2 Configure Environment Variables**
  ```env
  # .env
  LOG_LEVEL=info
  LOG_FORMAT=console
  ERROR_LOG_LEVEL=MEDIUM
  NODE_ENV=development
  ```
  **Test**: Check console logs for proper formatting

- [ ] **1.3 Verify Logging**
  - [ ] Console logs appear with correct formatting
  - [ ] Error severity affects log output
  - [ ] Stack traces appear in development
  - [ ] Sensitive data is not logged

### Frontend Setup

- [ ] **1.4 Wrap Root App with Error Boundary**
  ```typescript
  // In frontend/src/App.tsx
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
  **Test**: Throw an error in a component and verify full-screen error page

- [ ] **1.5 Configure Frontend Error Logger**
  ```typescript
  // In frontend/src/main.tsx
  import { initializeErrorLogger } from '@/core/errors'

  initializeErrorLogger({
    logToConsole: true,
    logToBackend: import.meta.env.PROD,
    includeStackTrace: import.meta.env.DEV,
  })
  ```
  **Test**: Trigger an error and verify console logging

- [ ] **1.6 Test Basic Error Handling**
  - [ ] App-level error boundary shows full-screen error
  - [ ] Error details visible in development
  - [ ] "Try Again" button works
  - [ ] "Reload Page" button works
  - [ ] "Go to Dashboard" button works

---

## Phase 2: High-Priority Routes (Week 1)

### Critical Backend Routes

- [ ] **2.1 Authentication Routes**
  - [ ] `/api/auth/login` - Use `InvalidCredentialsError`, `ValidationError`
  - [ ] `/api/auth/register` - Use `ValidationError`, `DuplicateResourceError`
  - [ ] `/api/auth/refresh` - Use `TokenExpiredError`, `TokenInvalidError`

  **Test**: Try invalid credentials, duplicate email, expired tokens

- [ ] **2.2 User Routes**
  - [ ] `/api/users/:id` - Use `ResourceNotFoundError`, `ResourceForbiddenError`
  - [ ] `/api/users` - Use `ValidationError`

  **Test**: Access non-existent user, other user's profile

- [ ] **2.3 Credit Routes**
  - [ ] `/api/credits/balance` - Use `AuthenticationError`
  - [ ] `/api/credits/purchase` - Use `ValidationError`

  **Test**: Access without auth, invalid purchase data

### Critical Frontend Pages

- [ ] **2.4 Dashboard Page**
  ```typescript
  // Wrap with page-level boundary
  <Route
    path="/dashboard"
    element={
      <ErrorBoundary level="page">
        <Dashboard />
      </ErrorBoundary>
    }
  />
  ```
  **Test**: Force error in dashboard and verify inline error banner

- [ ] **2.5 Login Page**
  ```typescript
  // Update error handling in login form
  try {
    await authService.login(credentials)
  } catch (error) {
    const appError = handleApiError(error, 'Login')
    if (appError.code === 'INVALID_CREDENTIALS') {
      setError('Invalid email or password')
    }
  }
  ```
  **Test**: Try invalid credentials, verify user-friendly message

- [ ] **2.6 Profile Page**
  - [ ] Wrap with page-level error boundary
  - [ ] Handle API errors in update form

  **Test**: Submit invalid data, force network error

---

## Phase 3: Medium-Priority Routes (Week 2)

### Backend API Routes

- [ ] **3.1 Project Routes**
  - [ ] GET `/api/projects` - Use `asyncHandler`
  - [ ] GET `/api/projects/:id` - Use `ResourceNotFoundError`
  - [ ] POST `/api/projects` - Use `ValidationError`, `DuplicateResourceError`
  - [ ] PATCH `/api/projects/:id` - Use `ResourceForbiddenError`
  - [ ] DELETE `/api/projects/:id` - Use `ResourceForbiddenError`

- [ ] **3.2 Generation Routes**
  - [ ] POST `/api/generations` - Use `InsufficientCreditsError`, `ValidationError`
  - [ ] GET `/api/generations/:id` - Use `ResourceNotFoundError`
  - [ ] Use `AIProviderError` for external service failures

- [ ] **3.3 Payment Routes**
  - [ ] POST `/api/payment/create` - Use `PaymentError`, `ValidationError`
  - [ ] POST `/api/payment/callback` - Use `PaymentVerificationError`
  - [ ] Add security logging for payment errors

### Frontend Components

- [ ] **3.4 Project Management**
  - [ ] Project list page - page-level boundary
  - [ ] Create project form - handle validation errors
  - [ ] Edit project form - handle not found, forbidden errors
  - [ ] Delete confirmation - handle authorization errors

- [ ] **3.5 Generation Components**
  - [ ] Generation form - component-level boundary
  - [ ] Handle insufficient credits error with "Buy Credits" action
  - [ ] Handle AI provider errors with retry logic
  - [ ] Show generation progress with error recovery

- [ ] **3.6 Payment Components**
  - [ ] Payment form - validation error handling
  - [ ] Payment status - handle verification errors
  - [ ] Credit purchase - handle payment gateway errors

---

## Phase 4: Remaining Routes (Week 3)

### Backend Routes

- [ ] **4.1 Avatar Generator Routes**
  - [ ] Wrap all routes with `asyncHandler`
  - [ ] Use specific error classes
  - [ ] Add retry logic for external services

- [ ] **4.2 Video Mixer Routes**
  - [ ] Update error handling
  - [ ] Handle large file errors
  - [ ] Add progress error handling

- [ ] **4.3 Carousel Mix Routes**
  - [ ] Update validation errors
  - [ ] Handle image processing errors
  - [ ] Add batch operation error handling

- [ ] **4.4 Admin Routes**
  - [ ] Add authorization checks
  - [ ] Use `InsufficientPermissionsError`
  - [ ] Handle bulk operation errors

### Frontend Pages & Components

- [ ] **4.5 App-Specific Pages**
  - [ ] Avatar Generator - page-level boundary
  - [ ] Video Mixer - page-level boundary
  - [ ] Carousel Mix - page-level boundary
  - [ ] Poster Editor - page-level boundary

- [ ] **4.6 Complex Components**
  - [ ] Image gallery - component-level boundary
  - [ ] Video player - component-level boundary
  - [ ] Editor canvas - component-level boundary
  - [ ] File upload - error recovery

- [ ] **4.7 Settings & Profile**
  - [ ] Settings page - page-level boundary
  - [ ] Profile update - validation handling
  - [ ] Password change - error handling
  - [ ] Account deletion - confirmation with error handling

---

## Phase 5: Enhancement & Optimization (Week 4)

### Backend Enhancements

- [ ] **5.1 Add Request ID Middleware**
  ```typescript
  // Generate unique request ID for each request
  app.use('*', async (c, next) => {
    c.set('requestId', crypto.randomUUID())
    await next()
  })
  ```

- [ ] **5.2 Add Performance Logging**
  ```typescript
  // Log slow operations
  const startTime = Date.now()
  const result = await operation()
  const duration = Date.now() - startTime

  if (duration > threshold) {
    errorLogger.logPerformance('Operation Name', duration, threshold)
  }
  ```

- [ ] **5.3 Add Error Metrics**
  - [ ] Track error counts by code
  - [ ] Track error rates by endpoint
  - [ ] Set up alerts for critical errors

### Frontend Enhancements

- [ ] **5.4 Add Error Analytics**
  ```typescript
  // Track error occurrences
  onError: (error) => {
    analytics.track('Error Occurred', {
      code: error.code,
      category: error.category,
      page: window.location.pathname,
    })
  }
  ```

- [ ] **5.5 Implement Retry Logic**
  ```typescript
  // Add retry with exponential backoff
  const data = await retryWithBackoff(
    () => api.get('/data'),
    {
      maxRetries: 3,
      onRetry: (attempt) => {
        toast.info(`Retrying... (${attempt}/3)`)
      }
    }
  )
  ```

- [ ] **5.6 Add Custom Error Fallbacks**
  - [ ] Create custom fallback components for specific error types
  - [ ] Add illustrations/icons for different error states
  - [ ] Implement error state animations

### Monitoring Setup (Optional)

- [ ] **5.7 Sentry Integration**
  - [ ] Install Sentry SDK
  - [ ] Configure `SENTRY_DSN`
  - [ ] Test error reporting
  - [ ] Set up alerts

- [ ] **5.8 Custom Monitoring**
  - [ ] Implement custom monitoring service
  - [ ] Add to error logger
  - [ ] Configure dashboards
  - [ ] Set up notifications

---

## Phase 6: Testing & Documentation (Week 5)

### Testing

- [ ] **6.1 Backend Tests**
  - [ ] Test error normalization (Zod, Prisma errors)
  - [ ] Test specific error classes
  - [ ] Test error logging
  - [ ] Test error responses
  - [ ] Test error metadata

- [ ] **6.2 Frontend Tests**
  - [ ] Test Error Boundary rendering
  - [ ] Test error recovery
  - [ ] Test API error handling
  - [ ] Test retry logic
  - [ ] Test error logging

- [ ] **6.3 Integration Tests**
  - [ ] Test complete error flows
  - [ ] Test error propagation
  - [ ] Test monitoring integration
  - [ ] Test error recovery strategies

### Documentation

- [ ] **6.4 Update API Documentation**
  - [ ] Document error responses for each endpoint
  - [ ] Include error codes
  - [ ] Add error examples

- [ ] **6.5 Create Team Guidelines**
  - [ ] Error handling best practices
  - [ ] When to use which error class
  - [ ] How to add new error types
  - [ ] Testing guidelines

- [ ] **6.6 Update README**
  - [ ] Link to error handling docs
  - [ ] Add troubleshooting section
  - [ ] Include migration notes

---

## Phase 7: Production Deployment (Week 6)

### Pre-Deployment Checklist

- [ ] **7.1 Verify All Tests Pass**
  - [ ] Unit tests
  - [ ] Integration tests
  - [ ] E2E tests

- [ ] **7.2 Review Configuration**
  - [ ] Production environment variables
  - [ ] Logging configuration
  - [ ] Monitoring setup
  - [ ] Alert configuration

- [ ] **7.3 Security Review**
  - [ ] No sensitive data in logs
  - [ ] Stack traces disabled in production
  - [ ] Error messages don't leak information
  - [ ] Rate limiting on error logging

### Deployment

- [ ] **7.4 Deploy to Staging**
  - [ ] Verify error handling works
  - [ ] Test error recovery
  - [ ] Check monitoring integration
  - [ ] Review error logs

- [ ] **7.5 Gradual Production Rollout**
  - [ ] Deploy backend changes
  - [ ] Monitor error rates
  - [ ] Deploy frontend changes
  - [ ] Monitor user experience

- [ ] **7.6 Post-Deployment Verification**
  - [ ] Check error logs for issues
  - [ ] Verify monitoring alerts work
  - [ ] Test error recovery in production
  - [ ] Gather user feedback

### Monitoring & Maintenance

- [ ] **7.7 Set Up Monitoring Dashboards**
  - [ ] Error rate by endpoint
  - [ ] Error distribution by code
  - [ ] Error severity trends
  - [ ] User-affected error count

- [ ] **7.8 Configure Alerts**
  - [ ] Critical error threshold
  - [ ] Error rate spike
  - [ ] Specific error codes
  - [ ] Service degradation

- [ ] **7.9 Regular Review**
  - [ ] Weekly error log review
  - [ ] Identify common errors
  - [ ] Improve error messages
  - [ ] Update documentation

---

## Cleanup Phase (Ongoing)

### Remove Old Error Handling

- [ ] **8.1 Identify Old Error Patterns**
  ```typescript
  // Old pattern to remove
  return c.json({ error: 'Message' }, 500)

  // New pattern
  throw new InternalError('Message')
  ```

- [ ] **8.2 Remove Deprecated Error Handlers**
  - [ ] Old try-catch blocks without asyncHandler
  - [ ] Custom error response formatting
  - [ ] Inconsistent error logging

- [ ] **8.3 Consolidate Error Messages**
  - [ ] Move hardcoded messages to error classes
  - [ ] Use error message system
  - [ ] Ensure consistency

### Continuous Improvement

- [ ] **8.4 Analyze Error Patterns**
  - [ ] Most common errors
  - [ ] User pain points
  - [ ] Performance bottlenecks

- [ ] **8.5 Improve Error Messages**
  - [ ] Based on user feedback
  - [ ] Add more actionable guidance
  - [ ] Improve clarity

- [ ] **8.6 Enhance Error Recovery**
  - [ ] Add auto-recovery for more scenarios
  - [ ] Improve retry logic
  - [ ] Better user guidance

---

## Success Criteria

### Backend

- ✅ All routes use `asyncHandler` or proper error handling
- ✅ Specific error classes used instead of generic errors
- ✅ No hardcoded error responses
- ✅ Error logs include proper context
- ✅ Monitoring integrated and working

### Frontend

- ✅ All pages wrapped with Error Boundaries
- ✅ API errors handled consistently
- ✅ User-friendly error messages displayed
- ✅ Error recovery strategies in place
- ✅ Error logging to backend working

### Testing

- ✅ Error handling tested for all critical paths
- ✅ Edge cases covered
- ✅ Error recovery tested
- ✅ Monitoring alerts tested

### Documentation

- ✅ Complete API error documentation
- ✅ Team guidelines created
- ✅ Examples provided
- ✅ README updated

### Production

- ✅ Error rates within acceptable range
- ✅ No sensitive data leakage
- ✅ Monitoring dashboards set up
- ✅ Alerts configured and working
- ✅ User experience improved

---

## Progress Tracking

Use this table to track your progress:

| Phase | Tasks | Completed | Status |
|-------|-------|-----------|--------|
| Phase 1: Setup | 6 | 0 | Not Started |
| Phase 2: High-Priority | 6 | 0 | Not Started |
| Phase 3: Medium-Priority | 6 | 0 | Not Started |
| Phase 4: Remaining | 7 | 0 | Not Started |
| Phase 5: Enhancement | 6 | 0 | Not Started |
| Phase 6: Testing | 6 | 0 | Not Started |
| Phase 7: Production | 9 | 0 | Not Started |
| Phase 8: Cleanup | 6 | 0 | Not Started |
| **TOTAL** | **52** | **0** | **0%** |

---

## Notes & Issues

Use this section to track any issues or notes during migration:

```
Date: ______
Issue: ____________________________________________________________________
Solution: __________________________________________________________________
___________________________________________________________________________

Date: ______
Issue: ____________________________________________________________________
Solution: __________________________________________________________________
___________________________________________________________________________

Date: ______
Issue: ____________________________________________________________________
Solution: __________________________________________________________________
___________________________________________________________________________
```

---

## Resources

- **Full Documentation**: `docs/ERROR_HANDLING_SYSTEM.md`
- **Quick Start**: `docs/ERROR_HANDLING_QUICK_START.md`
- **Examples**: `docs/ERROR_HANDLING_EXAMPLES.md`
- **Architecture**: `docs/ERROR_HANDLING_ARCHITECTURE.md`
- **Backend Code**: `backend/src/core/errors/`
- **Frontend Code**: `frontend/src/core/errors/`

---

**Remember**: Migration can be done gradually. Both old and new error handling can coexist during the transition. Focus on high-priority routes first, then systematically migrate the rest of the codebase.

Good luck with the migration! 🚀
