# Error Handling System - Architecture Diagrams

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           LUMIKU APPLICATION                             │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐              ┌──────────────────────────────┐
│       BACKEND            │              │         FRONTEND             │
│    (Node.js/Hono)        │◄────────────►│      (React/Vite)            │
└──────────────────────────┘   REST API   └──────────────────────────────┘

        │                                            │
        │                                            │
        ▼                                            ▼

┌──────────────────────────┐              ┌──────────────────────────────┐
│   ERROR HANDLING CORE    │              │   ERROR HANDLING CORE        │
├──────────────────────────┤              ├──────────────────────────────┤
│                          │              │                              │
│  • BaseAppError          │              │  • AppError                  │
│  • Error Classes         │              │  • Error Factory Methods     │
│  • Error Handler         │              │  • Error Boundary            │
│  • Error Logger          │              │  • Error Logger              │
│  • Error Messages        │              │  • Error Messages            │
│                          │              │  • Error Utils               │
└──────────────────────────┘              └──────────────────────────────┘

        │                                            │
        │                                            │
        ▼                                            ▼

┌──────────────────────────┐              ┌──────────────────────────────┐
│   MONITORING SERVICES    │◄─────────────┤   MONITORING SERVICES        │
├──────────────────────────┤              ├──────────────────────────────┤
│                          │              │                              │
│  • Sentry                │              │  • LogRocket                 │
│  • DataDog               │              │  • Sentry                    │
│  • CloudWatch            │              │  • Custom Analytics          │
│  • Custom Services       │              │                              │
└──────────────────────────┘              └──────────────────────────────┘
```

---

## Backend Error Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. ERROR OCCURS                                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │   Route Handler                   │
        │   (wrapped with asyncHandler)     │
        └───────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. ERROR NORMALIZATION                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   BaseAppError? ────────Yes────► Use as-is                      │
│        │                                                         │
│        No                                                        │
│        │                                                         │
│        ├─► ZodError? ──Yes──► ValidationError                   │
│        │                                                         │
│        ├─► PrismaError? ─Yes─► DatabaseError                    │
│        │                         NotFoundError                   │
│        │                         ConflictError                   │
│        │                                                         │
│        └─► Error? ───Yes──► UnhandledError                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. CONTEXT ENRICHMENT                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Add metadata:                                                  │
│   • userId                                                       │
│   • requestId                                                    │
│   • path, method                                                 │
│   • timestamp                                                    │
│   • custom context                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. ERROR LOGGING                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ErrorLogger.logError()                                         │
│   │                                                              │
│   ├─► Console (with severity-based formatting)                  │
│   │                                                              │
│   └─► Monitoring Services                                        │
│       ├─► Sentry                                                 │
│       ├─► DataDog                                                │
│       └─► Custom Services                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. ERROR RESPONSE                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Generate JSON response:                                        │
│   {                                                              │
│     "success": false,                                            │
│     "error": {                                                   │
│       "message": "User-friendly message",                        │
│       "code": "ERROR_CODE",                                      │
│       "statusCode": 400,                                         │
│       "details": {...},        // if applicable                  │
│       "retryable": true        // if applicable                  │
│     },                                                           │
│     "timestamp": "2025-10-14T10:30:00Z",                         │
│     "requestId": "req-123"                                       │
│   }                                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
                      Send to Client
```

---

## Frontend Error Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. ERROR OCCURS                                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
            ┌───────────────┴──────────────┐
            │                               │
            ▼                               ▼
    ┌──────────────┐              ┌──────────────┐
    │   API Error  │              │ Render Error │
    │  (Axios)     │              │   (React)    │
    └──────────────┘              └──────────────┘
            │                               │
            ▼                               ▼
    ┌──────────────┐              ┌──────────────┐
    │  Try-Catch   │              │    Error     │
    │   Handler    │              │   Boundary   │
    └──────────────┘              └──────────────┘
            │                               │
            └───────────────┬───────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. ERROR CONVERSION                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   AppError.fromUnknownError()                                    │
│   │                                                              │
│   ├─► AppError? ──────Yes───► Use as-is                         │
│   │                                                              │
│   ├─► AxiosError? ────Yes───► fromApiError()                    │
│   │                            • Parse API response              │
│   │                            • Extract error code              │
│   │                            • Map status to category          │
│   │                                                              │
│   ├─► Network Error? ──Yes───► fromNetworkError()               │
│   │                            • Mark as retryable               │
│   │                                                              │
│   └─► Unknown ────────────────► Generic AppError                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. ERROR LOGGING                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ErrorLogger.logError()                                         │
│   │                                                              │
│   ├─► Console (development)                                      │
│   │    • Detailed error info                                     │
│   │    • Stack traces                                            │
│   │                                                              │
│   ├─► Backend API (production)                                   │
│   │    • Batched errors (10 errors / 5 seconds)                 │
│   │    • Redacted sensitive data                                 │
│   │                                                              │
│   └─► Monitoring Services (optional)                             │
│       ├─► LogRocket                                              │
│       ├─► Sentry                                                 │
│       └─► Custom Analytics                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. USER FEEDBACK                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Error Boundary Level?                                          │
│   │                                                              │
│   ├─► App Level                                                  │
│   │    • Full-screen error page                                  │
│   │    • "Something went wrong"                                  │
│   │    • Try Again / Reload / Go Home buttons                    │
│   │                                                              │
│   ├─► Page Level                                                 │
│   │    • Inline error banner                                     │
│   │    • Error message + context                                 │
│   │    • Retry / Go to Dashboard buttons                         │
│   │                                                              │
│   └─► Component Level                                            │
│        • Minimal inline error                                    │
│        • "Failed to load. Try again" link                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. ERROR RECOVERY (if applicable)                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Is error retryable?                                            │
│   │                                                              │
│   ├─► Yes                                                        │
│   │    ├─► Network Error? ──► Auto-retry after 3s               │
│   │    ├─► Service Error? ──► Auto-retry after 5s               │
│   │    └─► User Action ─────► Manual retry button               │
│   │                                                              │
│   └─► No                                                         │
│        └─► Show error + guidance                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Error Boundary Hierarchy

```
┌──────────────────────────────────────────────────────────────────┐
│                     App (Root)                                    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │          ErrorBoundary (level="app")                     │    │
│  │                                                          │    │
│  │  ┌───────────────────────────────────────────────────┐  │    │
│  │  │      BrowserRouter                                 │  │    │
│  │  │                                                    │  │    │
│  │  │  ┌─────────────────────────────────────────────┐  │  │    │
│  │  │  │   Route: /dashboard                          │  │  │    │
│  │  │  │                                              │  │  │    │
│  │  │  │   ┌──────────────────────────────────────┐  │  │  │    │
│  │  │  │   │  ErrorBoundary (level="page")        │  │  │  │    │
│  │  │  │   │                                      │  │  │  │    │
│  │  │  │   │  ┌────────────────────────────────┐ │  │  │  │    │
│  │  │  │   │  │  Dashboard Component           │ │  │  │  │    │
│  │  │  │   │  │                                │ │  │  │  │    │
│  │  │  │   │  │  ┌─────────────────────────┐  │ │  │  │  │    │
│  │  │  │   │  │  │ ErrorBoundary           │  │ │  │  │  │    │
│  │  │  │   │  │  │ (level="component")     │  │ │  │  │  │    │
│  │  │  │   │  │  │                         │  │ │  │  │  │    │
│  │  │  │   │  │  │  ┌──────────────────┐   │  │ │  │  │  │    │
│  │  │  │   │  │  │  │  Widget 1        │   │  │ │  │  │  │    │
│  │  │  │   │  │  │  └──────────────────┘   │  │ │  │  │  │    │
│  │  │  │   │  │  └─────────────────────────┘  │ │  │  │  │    │
│  │  │  │   │  │                                │ │  │  │  │    │
│  │  │  │   │  │  ┌─────────────────────────┐  │ │  │  │  │    │
│  │  │  │   │  │  │ ErrorBoundary           │  │ │  │  │  │    │
│  │  │  │   │  │  │ (level="component")     │  │ │  │  │  │    │
│  │  │  │   │  │  │                         │  │ │  │  │  │    │
│  │  │  │   │  │  │  ┌──────────────────┐   │  │ │  │  │  │    │
│  │  │  │   │  │  │  │  Widget 2        │   │  │ │  │  │  │    │
│  │  │  │   │  │  │  └──────────────────┘   │  │ │  │  │  │    │
│  │  │  │   │  │  └─────────────────────────┘  │ │  │  │  │    │
│  │  │  │   │  └────────────────────────────────┘ │  │  │  │    │
│  │  │  │   └──────────────────────────────────────┘  │  │  │    │
│  │  │  └─────────────────────────────────────────────┘  │  │    │
│  │  └───────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘

Error Propagation:
─────────────────

Widget 2 Error ──► Component Boundary catches ──► Shows inline error
                   (Widget 1 continues working)

Component Boundary Error ──► Page Boundary catches ──► Shows banner
                              (Navigation still works)

Page Boundary Error ──► App Boundary catches ──► Shows full-screen error
```

---

## Error Class Hierarchy

```
BaseAppError (Abstract)
│
├── ValidationError (400)
│   ├── InvalidInputError
│   └── MissingRequiredFieldError
│
├── AuthenticationError (401)
│   ├── InvalidCredentialsError
│   ├── TokenExpiredError
│   └── TokenInvalidError
│
├── AuthorizationError (403)
│   ├── InsufficientPermissionsError
│   └── ResourceForbiddenError
│
├── NotFoundError (404)
│   └── ResourceNotFoundError
│
├── ConflictError (409)
│   └── DuplicateResourceError
│
├── RateLimitError (429)
│   └── QuotaExceededError
│
├── BusinessLogicError (400/422)
│   ├── InsufficientCreditsError
│   ├── InsufficientQuotaError
│   ├── OperationNotAllowedError
│   └── InvalidStateError
│
├── PaymentError (402)
│   ├── PaymentFailedError
│   └── PaymentVerificationError
│
├── DatabaseError (500)
│   ├── DatabaseConnectionError
│   └── DatabaseQueryError
│
├── ExternalServiceError (502/503)
│   ├── AIProviderError
│   ├── PaymentGatewayError
│   └── ServiceUnavailableError
│
└── InternalError (500)
    ├── ConfigurationError
    └── UnhandledError
```

---

## Error Metadata Structure

```
ErrorMetadata
├── Request Context
│   ├── userId: string
│   ├── requestId: string
│   ├── path: string
│   └── method: string
│
├── Resource Context
│   ├── resourceType: string
│   ├── resourceId: string
│   └── field: string
│
├── Validation Context
│   └── validationErrors: Record<string, string[]>
│
├── Retry Context
│   ├── retryable: boolean
│   └── retryAfter: number
│
├── Technical Context
│   ├── stackTrace: string
│   ├── cause: Error
│   └── query: string
│
└── Custom Context
    └── [key: string]: any
```

---

## Error Severity Matrix

```
┌──────────────┬─────────┬──────────┬─────────────────────────────────┐
│ Severity     │ Level   │ Action   │ Examples                        │
├──────────────┼─────────┼──────────┼─────────────────────────────────┤
│ CRITICAL     │ 3       │ Alert    │ • Security breach               │
│              │         │ Page     │ • Data corruption               │
│              │         │          │ • Payment fraud                 │
│              │         │          │ • System crash                  │
├──────────────┼─────────┼──────────┼─────────────────────────────────┤
│ HIGH         │ 2       │ Log      │ • Database connection failure   │
│              │         │ Monitor  │ • External service down         │
│              │         │          │ • Unhandled exceptions          │
│              │         │          │ • Programming errors            │
├──────────────┼─────────┼──────────┼─────────────────────────────────┤
│ MEDIUM       │ 1       │ Log      │ • Authentication failures       │
│              │         │          │ • Authorization denials         │
│              │         │          │ • Business rule violations      │
│              │         │          │ • External service errors       │
├──────────────┼─────────┼──────────┼─────────────────────────────────┤
│ LOW          │ 0       │ Info     │ • Validation errors             │
│              │         │          │ • Not found errors              │
│              │         │          │ • Duplicate resources           │
│              │         │          │ • Rate limiting                 │
└──────────────┴─────────┴──────────┴─────────────────────────────────┘
```

---

## Monitoring Integration Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    APPLICATION ERRORS                             │
└──────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                     ERROR LOGGER                                  │
├──────────────────────────────────────────────────────────────────┤
│  • Structured logging                                             │
│  • Context enrichment                                             │
│  • Sensitive data redaction                                       │
│  • Severity filtering                                             │
└──────────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
    ┌───────────────────┐   ┌───────────────────┐
    │  Console Logging  │   │  Monitoring       │
    │                   │   │  Services         │
    │  • Development    │   │                   │
    │  • Local debug    │   │  • Production     │
    │  • Quick feedback │   │  • Analytics      │
    └───────────────────┘   │  • Alerting       │
                            └───────────────────┘
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            │                         │                         │
            ▼                         ▼                         ▼
    ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
    │   Sentry     │        │   DataDog    │        │   Custom     │
    ├──────────────┤        ├──────────────┤        ├──────────────┤
    │ • Error      │        │ • Metrics    │        │ • Business   │
    │   tracking   │        │ • Logs       │        │   metrics    │
    │ • Stack      │        │ • Traces     │        │ • Webhooks   │
    │   traces     │        │ • APM        │        │ • Slack/     │
    │ • Releases   │        │ • Dashboards │        │   Discord    │
    │ • Alerts     │        │              │        │              │
    └──────────────┘        └──────────────┘        └──────────────┘
```

---

## Error Recovery Decision Tree

```
                    ┌─────────────┐
                    │ Error Occurs│
                    └──────┬──────┘
                           │
                           ▼
                  ┌────────────────┐
                  │  Is Operational │
                  │     Error?      │
                  └────────┬────────┘
                           │
                    ┌──────┴───────┐
                    │              │
                   Yes            No
                    │              │
                    ▼              ▼
          ┌─────────────┐   ┌──────────────┐
          │Is Retryable?│   │ Log Critical │
          └──────┬──────┘   │ Show Generic │
                 │          │    Error     │
          ┌──────┴──────┐   └──────────────┘
          │             │
         Yes           No
          │             │
          ▼             ▼
   ┌─────────────┐  ┌────────────┐
   │ Auto Retry? │  │ Show Error │
   └──────┬──────┘  │  + Action  │
          │         └────────────┘
   ┌──────┴──────┐
   │             │
  Yes           No
   │             │
   ▼             ▼
┌────────┐  ┌─────────────┐
│Schedule│  │ Show Retry  │
│ Retry  │  │   Button    │
└────────┘  └─────────────┘
```

---

## Data Flow: Error to User Feedback

```
Backend Error                    Frontend Error
     │                                │
     ▼                                ▼
┌─────────────┐              ┌──────────────┐
│ BaseAppError│              │   AppError   │
└─────┬───────┘              └──────┬───────┘
      │                             │
      ▼                             ▼
┌─────────────┐              ┌──────────────┐
│   toJSON()  │              │ Error        │
│             │              │ Boundary     │
│ {           │              │ Catches      │
│   success:  │              └──────┬───────┘
│     false,  │                     │
│   error: {  │                     ▼
│     message,│              ┌──────────────┐
│     code,   │              │ Get Error    │
│     ...     │              │ Message      │
│   }         │              └──────┬───────┘
│ }           │                     │
└─────┬───────┘                     ▼
      │                      ┌──────────────┐
      │                      │ Render UI    │
      │                      │              │
      │                      │ • Title      │
      │                      │ • Message    │
      │                      │ • Action     │
      │                      │ • Recovery   │
      ▼                      └──────────────┘
┌─────────────┐                     │
│   HTTP      │                     ▼
│  Response   │              ┌──────────────┐
│             │              │ User Sees:   │
│ Status: 400 │◄─────────────┤              │
│ Body: {...} │              │ "Failed to   │
└─────────────┘              │  save. Try   │
                             │  again."     │
                             └──────────────┘
```

---

This architecture provides a robust, scalable, and maintainable error handling system that ensures consistent error management across the entire application stack.
