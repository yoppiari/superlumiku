# Error Handling System - Real-World Examples

This document provides comprehensive, real-world examples of using the error handling system in the Lumiku App.

## Table of Contents

1. [Backend Examples](#backend-examples)
2. [Frontend Examples](#frontend-examples)
3. [Integration Examples](#integration-examples)
4. [Advanced Patterns](#advanced-patterns)

---

## Backend Examples

### Example 1: Complete CRUD Route with Error Handling

```typescript
// File: backend/src/routes/projects.routes.ts

import { Hono } from 'hono'
import { authMiddleware } from '@/middleware/auth.middleware'
import {
  asyncHandler,
  sendSuccess,
  ValidationError,
  ResourceNotFoundError,
  ResourceForbiddenError,
  DuplicateResourceError,
} from '@/core/errors'
import prisma from '@/db/client'
import { z } from 'zod'

const app = new Hono()

// Validation schema
const CreateProjectSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  type: z.enum(['avatar', 'video', 'carousel']),
})

const UpdateProjectSchema = CreateProjectSchema.partial()

// ============================================================================
// LIST PROJECTS
// ============================================================================
app.get('/', authMiddleware, asyncHandler(async (c) => {
  const userId = c.get('userId')

  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { generations: true }
      }
    }
  })

  return sendSuccess(c, { projects })
}, 'List Projects'))

// ============================================================================
// GET PROJECT BY ID
// ============================================================================
app.get('/:id', authMiddleware, asyncHandler(async (c) => {
  const projectId = c.req.param('id')
  const userId = c.get('userId')

  // Fetch project
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      generations: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  })

  // Not found - returns 404
  if (!project) {
    throw new ResourceNotFoundError('Project', projectId)
  }

  // Authorization check - returns 404 to prevent information leakage
  if (project.userId !== userId) {
    throw new ResourceNotFoundError('Project', projectId)
  }

  return sendSuccess(c, { project })
}, 'Get Project'))

// ============================================================================
// CREATE PROJECT
// ============================================================================
app.post('/', authMiddleware, asyncHandler(async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json()

  // Validate input (Zod errors automatically converted to ValidationError)
  const data = CreateProjectSchema.parse(body)

  // Check for duplicate name
  const existingProject = await prisma.project.findFirst({
    where: {
      userId,
      name: data.name,
    }
  })

  if (existingProject) {
    throw new DuplicateResourceError('Project', 'name')
  }

  // Create project
  const project = await prisma.project.create({
    data: {
      ...data,
      userId,
    }
  })

  return sendSuccess(c, { project }, 'Project created successfully', 201)
}, 'Create Project'))

// ============================================================================
// UPDATE PROJECT
// ============================================================================
app.patch('/:id', authMiddleware, asyncHandler(async (c) => {
  const projectId = c.req.param('id')
  const userId = c.get('userId')
  const body = await c.req.json()

  // Validate input
  const data = UpdateProjectSchema.parse(body)

  // Fetch and verify ownership
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  })

  if (!project) {
    throw new ResourceNotFoundError('Project', projectId)
  }

  if (project.userId !== userId) {
    throw new ResourceForbiddenError('Project', projectId)
  }

  // Check for duplicate name if name is being updated
  if (data.name && data.name !== project.name) {
    const duplicate = await prisma.project.findFirst({
      where: {
        userId,
        name: data.name,
        id: { not: projectId }
      }
    })

    if (duplicate) {
      throw new DuplicateResourceError('Project', 'name')
    }
  }

  // Update project
  const updatedProject = await prisma.project.update({
    where: { id: projectId },
    data
  })

  return sendSuccess(c, { project: updatedProject }, 'Project updated successfully')
}, 'Update Project'))

// ============================================================================
// DELETE PROJECT
// ============================================================================
app.delete('/:id', authMiddleware, asyncHandler(async (c) => {
  const projectId = c.req.param('id')
  const userId = c.get('userId')

  // Fetch and verify ownership
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  })

  if (!project) {
    throw new ResourceNotFoundError('Project', projectId)
  }

  if (project.userId !== userId) {
    throw new ResourceForbiddenError('Project', projectId)
  }

  // Delete project (cascade will delete related records)
  await prisma.project.delete({
    where: { id: projectId }
  })

  return sendSuccess(c, null, 'Project deleted successfully', 204)
}, 'Delete Project'))

export default app
```

### Example 2: AI Generation with Credit Checking

```typescript
// File: backend/src/routes/avatar-generation.routes.ts

import { Hono } from 'hono'
import { authMiddleware } from '@/middleware/auth.middleware'
import {
  asyncHandler,
  sendSuccess,
  ValidationError,
  InsufficientCreditsError,
  ResourceNotFoundError,
  AIProviderError,
} from '@/core/errors'
import prisma from '@/db/client'
import { huggingFaceClient } from '@/lib/huggingface-client'
import { z } from 'zod'

const app = new Hono()

const GenerateAvatarSchema = z.object({
  modelId: z.string(),
  prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
  negativePrompt: z.string().optional(),
  steps: z.number().min(1).max(50).default(20),
})

app.post('/', authMiddleware, asyncHandler(async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json()

  // Validate input
  const data = GenerateAvatarSchema.parse(body)

  // Get model
  const model = await prisma.avatarModel.findUnique({
    where: { id: data.modelId }
  })

  if (!model) {
    throw new ResourceNotFoundError('Model', data.modelId)
  }

  // Check if model is active
  if (!model.isActive) {
    throw new ValidationError('Model is not currently available', {
      field: 'modelId',
      modelId: data.modelId,
      reason: 'Model is inactive'
    })
  }

  // Get user's credit balance
  const credit = await prisma.credit.findUnique({
    where: { userId }
  })

  const cost = model.creditCost
  const balance = credit?.amount || 0

  // Check if user has enough credits
  if (balance < cost) {
    throw new InsufficientCreditsError(cost, balance)
  }

  // Deduct credits
  await prisma.credit.update({
    where: { userId },
    data: {
      amount: {
        decrement: cost
      }
    }
  })

  // Create generation record
  const generation = await prisma.generation.create({
    data: {
      userId,
      modelId: model.id,
      prompt: data.prompt,
      negativePrompt: data.negativePrompt,
      steps: data.steps,
      status: 'processing',
      creditCost: cost,
    }
  })

  // Generate image with AI provider
  try {
    const result = await huggingFaceClient.generateImage({
      model: model.huggingfaceModelId,
      prompt: data.prompt,
      negativePrompt: data.negativePrompt,
      steps: data.steps,
    })

    // Update generation with result
    const updatedGeneration = await prisma.generation.update({
      where: { id: generation.id },
      data: {
        status: 'completed',
        outputUrl: result.imageUrl,
        completedAt: new Date(),
      }
    })

    return sendSuccess(c, { generation: updatedGeneration }, 'Image generated successfully')

  } catch (error) {
    // Refund credits on failure
    await prisma.credit.update({
      where: { userId },
      data: {
        amount: {
          increment: cost
        }
      }
    })

    // Update generation status
    await prisma.generation.update({
      where: { id: generation.id },
      data: {
        status: 'failed',
        error: error.message,
      }
    })

    // Throw appropriate error
    throw new AIProviderError(
      'HuggingFace',
      'Failed to generate image. Your credits have been refunded.',
      {
        modelId: model.id,
        generationId: generation.id,
        originalError: error.message,
      }
    ).asRetryable(30) // Suggest retry after 30 seconds
  }
}, 'Generate Avatar'))

export default app
```

### Example 3: Payment Processing with Security

```typescript
// File: backend/src/routes/payment-callback.routes.ts

import { Hono } from 'hono'
import {
  asyncHandler,
  sendSuccess,
  PaymentVerificationError,
  ResourceNotFoundError,
} from '@/core/errors'
import { securityLogger } from '@/lib/security-logger'
import prisma from '@/db/client'
import crypto from 'crypto'

const app = new Hono()

// Helper to verify signature
function verifySignature(
  merchantCode: string,
  amount: string,
  merchantOrderId: string,
  signature: string
): boolean {
  const merchantKey = process.env.DUITKU_MERCHANT_KEY!
  const expectedSignature = crypto
    .createHash('md5')
    .update(`${merchantCode}${amount}${merchantOrderId}${merchantKey}`)
    .digest('hex')

  return signature === expectedSignature
}

app.post('/callback', asyncHandler(async (c) => {
  const body = await c.req.json()
  const clientIP = c.req.header('x-forwarded-for') || c.req.header('x-real-ip')

  const {
    merchantCode,
    amount,
    merchantOrderId,
    productDetail,
    resultCode,
    signature,
  } = body

  // Log callback received
  console.log('[Payment Callback] Received:', {
    merchantOrderId,
    amount,
    resultCode,
    ip: clientIP,
  })

  // Verify signature
  if (!verifySignature(merchantCode, amount, merchantOrderId, signature)) {
    // Log security event
    securityLogger.logInvalidSignature({
      merchantOrderId,
      amount: parseFloat(amount),
      ip: clientIP,
      receivedSignature: signature,
    })

    throw new PaymentVerificationError('Invalid signature', {
      merchantOrderId,
      reason: 'Signature verification failed',
    })
  }

  // Find payment
  const payment = await prisma.payment.findUnique({
    where: { merchantOrderId }
  })

  if (!payment) {
    securityLogger.logPaymentNotFound({
      merchantOrderId,
      ip: clientIP,
    })

    throw new ResourceNotFoundError('Payment', merchantOrderId)
  }

  // Check if already processed
  if (payment.status === 'success') {
    console.warn('[Payment Callback] Duplicate callback:', merchantOrderId)
    return sendSuccess(c, null, 'Payment already processed')
  }

  // Update payment status
  const status = resultCode === '00' ? 'success' : 'failed'

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status,
      paidAt: status === 'success' ? new Date() : undefined,
      callbackData: body,
    }
  })

  // If successful, add credits to user
  if (status === 'success') {
    await prisma.credit.update({
      where: { userId: payment.userId },
      data: {
        amount: {
          increment: payment.creditAmount
        }
      }
    })

    // Create transaction record
    await prisma.creditTransaction.create({
      data: {
        userId: payment.userId,
        amount: payment.creditAmount,
        type: 'purchase',
        description: `Credit purchase: ${payment.creditAmount} credits`,
        metadata: {
          paymentId: payment.id,
          merchantOrderId,
        }
      }
    })

    // Log successful payment
    securityLogger.logPaymentSuccess({
      merchantOrderId,
      amount: payment.amount,
      ip: clientIP,
      userId: payment.userId,
    })
  } else {
    // Log failed payment
    securityLogger.logPaymentFailure({
      reason: `Payment failed with result code: ${resultCode}`,
      merchantOrderId,
      amount: payment.amount,
      ip: clientIP,
    })
  }

  return sendSuccess(c, null, 'Payment processed successfully')
}, 'Payment Callback'))

export default app
```

---

## Frontend Examples

### Example 1: Complete Page with Error Handling

```typescript
// File: frontend/src/pages/Dashboard.tsx

import { useState, useEffect } from 'react'
import { ErrorBoundary } from '@/core/errors'
import { handleApiError, retryWithBackoff } from '@/core/errors'
import { api } from '@/lib/api'
import { LoadingSpinner } from '@/components/ui'
import { toast } from '@/components/ui/toast'

interface DashboardData {
  apps: App[]
  credits: number
  recentGenerations: Generation[]
}

function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    setLoading(true)
    setError(null)

    try {
      // Use retry logic for network resilience
      const response = await retryWithBackoff(
        () => api.get<DashboardData>('/api/dashboard'),
        {
          maxRetries: 3,
          initialDelay: 1000,
          onRetry: (attempt) => {
            console.log(`Retrying dashboard load (${attempt}/3)...`)
            toast.info(`Retrying... (${attempt}/3)`)
          }
        }
      )

      setData(response.data)
    } catch (err) {
      const appError = handleApiError(err, 'Load Dashboard')
      setError(appError.message)
      toast.error(appError.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg m-4">
        <h2 className="text-lg font-semibold text-red-900 mb-2">
          Failed to Load Dashboard
        </h2>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={loadDashboard}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Credits Display */}
      <ErrorBoundary level="component">
        <CreditsCard balance={data.credits} />
      </ErrorBoundary>

      {/* Apps Grid */}
      <ErrorBoundary level="component">
        <AppsGrid apps={data.apps} />
      </ErrorBoundary>

      {/* Recent Generations */}
      <ErrorBoundary level="component">
        <RecentGenerations generations={data.recentGenerations} />
      </ErrorBoundary>
    </div>
  )
}

// Wrap main content with page-level error boundary
export default function Dashboard() {
  return (
    <ErrorBoundary
      level="page"
      onError={(error, errorInfo) => {
        console.error('Dashboard error:', error, errorInfo)
      }}
      onReset={() => {
        console.log('Dashboard reset, reloading...')
        window.location.reload()
      }}
    >
      <DashboardContent />
    </ErrorBoundary>
  )
}
```

### Example 2: Form with Validation and Error Handling

```typescript
// File: frontend/src/components/CreateProjectForm.tsx

import { useState } from 'react'
import { ErrorBoundary } from '@/core/errors'
import { handleApiError, AppError } from '@/core/errors'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/toast'

interface FormErrors {
  name?: string
  description?: string
  type?: string
}

export function CreateProjectForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'avatar' as 'avatar' | 'video' | 'carousel',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSubmitting(true)

    try {
      await api.post('/api/projects', formData)

      toast.success('Project created successfully!')
      onSuccess()

    } catch (err) {
      const appError = handleApiError(err, 'Create Project')

      // Handle validation errors
      if (appError.code === 'VALIDATION_ERROR') {
        const validationErrors = appError.metadata.details as Record<string, string[]>

        if (validationErrors) {
          const formErrors: FormErrors = {}

          Object.entries(validationErrors).forEach(([field, messages]) => {
            formErrors[field as keyof FormErrors] = messages[0]
          })

          setErrors(formErrors)
        }

        toast.error('Please fix the validation errors')
      }
      // Handle duplicate error
      else if (appError.code === 'DUPLICATE_RESOURCE') {
        setErrors({ name: 'A project with this name already exists' })
        toast.error('A project with this name already exists')
      }
      // Handle other errors
      else {
        toast.error(appError.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ErrorBoundary level="component">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Field */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Project Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full px-3 py-2 border rounded ${
              errors.name ? 'border-red-500' : 'border-slate-300'
            }`}
            disabled={submitting}
          />
          {errors.name && (
            <p className="text-sm text-red-600 mt-1">{errors.name}</p>
          )}
        </div>

        {/* Description Field */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded"
            rows={3}
            disabled={submitting}
          />
        </div>

        {/* Type Field */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Project Type *
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            className="w-full px-3 py-2 border border-slate-300 rounded"
            disabled={submitting}
          >
            <option value="avatar">Avatar</option>
            <option value="video">Video</option>
            <option value="carousel">Carousel</option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Creating...' : 'Create Project'}
        </button>
      </form>
    </ErrorBoundary>
  )
}
```

### Example 3: Custom Error Boundary with Recovery

```typescript
// File: frontend/src/components/ImageGallery.tsx

import { useState } from 'react'
import { ErrorBoundary } from '@/core/errors'
import { AppError } from '@/core/errors'

interface ImageGalleryProps {
  images: string[]
}

// Error fallback component
function GalleryErrorFallback({ error, reset }: { error: AppError; reset: () => void }) {
  return (
    <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-start gap-3">
        <span className="text-2xl">⚠️</span>
        <div className="flex-1">
          <h3 className="font-semibold text-yellow-900 mb-1">
            Gallery Error
          </h3>
          <p className="text-yellow-800 mb-3">
            {error.message}
          </p>
          <div className="flex gap-2">
            <button
              onClick={reset}
              className="px-3 py-1.5 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1.5 bg-slate-200 text-slate-700 text-sm rounded hover:bg-slate-300"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ImageGalleryContent({ images }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  // Simulate error for testing
  if (images.length === 0) {
    throw new Error('No images to display')
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {images.map((image, index) => (
        <div
          key={index}
          className="aspect-square bg-slate-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80"
          onClick={() => setSelectedImage(image)}
        >
          <img
            src={image}
            alt={`Image ${index + 1}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Handle individual image errors
              e.currentTarget.src = '/placeholder-image.png'
            }}
          />
        </div>
      ))}

      {/* Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Full size"
            className="max-w-full max-h-full"
          />
        </div>
      )}
    </div>
  )
}

export function ImageGallery({ images }: ImageGalleryProps) {
  return (
    <ErrorBoundary
      level="component"
      fallback={(error, reset) => (
        <GalleryErrorFallback error={error} reset={reset} />
      )}
      resetKeys={[images]} // Reset when images change
      onError={(error, errorInfo) => {
        console.error('Gallery error:', error, errorInfo)
      }}
    >
      <ImageGalleryContent images={images} />
    </ErrorBoundary>
  )
}
```

---

## Integration Examples

### Example: Complete Feature with Full Error Handling

This example shows a complete avatar generation feature with comprehensive error handling on both frontend and backend.

**Backend Route:**
```typescript
// backend/src/apps/avatar-generator/routes.ts
// (Already shown in Example 2 above)
```

**Frontend Component:**
```typescript
// frontend/src/apps/AvatarGenerator.tsx

import { useState } from 'react'
import { ErrorBoundary } from '@/core/errors'
import { handleApiError, AppError, retryWithBackoff } from '@/core/errors'
import { getErrorMessage } from '@/core/errors'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/toast'

interface Generation {
  id: string
  prompt: string
  outputUrl?: string
  status: 'processing' | 'completed' | 'failed'
  error?: string
}

function AvatarGeneratorContent() {
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generation, setGeneration] = useState<Generation | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt')
      return
    }

    setGenerating(true)
    setGeneration(null)

    try {
      const response = await api.post('/api/avatar/generate', {
        modelId: 'default-model-id',
        prompt: prompt.trim(),
        steps: 20,
      })

      setGeneration(response.data.generation)
      toast.success('Generation started!')

      // Poll for completion
      pollGenerationStatus(response.data.generation.id)

    } catch (err) {
      const appError = handleApiError(err, 'Generate Avatar')

      // Handle specific error types
      if (appError.code === 'INSUFFICIENT_CREDITS') {
        const message = getErrorMessage(appError.code)

        toast.error(message.message, {
          action: {
            label: 'Buy Credits',
            onClick: () => window.location.href = '/credits'
          }
        })
      } else if (appError.code === 'AI_PROVIDER_ERROR') {
        toast.error(appError.message, {
          action: appError.isRetryable() ? {
            label: 'Retry',
            onClick: () => handleGenerate()
          } : undefined
        })
      } else {
        toast.error(appError.message)
      }
    } finally {
      setGenerating(false)
    }
  }

  const pollGenerationStatus = async (generationId: string) => {
    try {
      const response = await retryWithBackoff(
        async () => {
          const res = await api.get(`/api/generations/${generationId}`)
          const gen = res.data.generation

          // Continue polling if still processing
          if (gen.status === 'processing') {
            throw new Error('Still processing')
          }

          return res
        },
        {
          maxRetries: 30,
          initialDelay: 2000,
          backoffMultiplier: 1.1,
          onRetry: (attempt) => {
            console.log(`Checking generation status... (${attempt}/30)`)
          }
        }
      )

      setGeneration(response.data.generation)

      if (response.data.generation.status === 'completed') {
        toast.success('Avatar generated successfully!')
      } else {
        toast.error('Generation failed: ' + response.data.generation.error)
      }

    } catch (err) {
      toast.error('Failed to check generation status')
      console.error(err)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Avatar Generator</h1>

      {/* Generation Form */}
      <ErrorBoundary level="component">
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">
              Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the avatar you want to generate..."
              className="w-full px-3 py-2 border border-slate-300 rounded"
              rows={4}
              disabled={generating}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate Avatar'}
          </button>
        </div>
      </ErrorBoundary>

      {/* Generation Result */}
      {generation && (
        <ErrorBoundary level="component">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded">
            <h3 className="font-semibold mb-2">Generation Status</h3>

            {generation.status === 'processing' && (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                <span>Processing...</span>
              </div>
            )}

            {generation.status === 'completed' && generation.outputUrl && (
              <div>
                <img
                  src={generation.outputUrl}
                  alt="Generated avatar"
                  className="w-full rounded mb-2"
                />
                <p className="text-sm text-slate-600">
                  Prompt: {generation.prompt}
                </p>
              </div>
            )}

            {generation.status === 'failed' && (
              <div className="text-red-600">
                Failed: {generation.error}
              </div>
            )}
          </div>
        </ErrorBoundary>
      )}
    </div>
  )
}

export default function AvatarGenerator() {
  return (
    <ErrorBoundary level="page">
      <AvatarGeneratorContent />
    </ErrorBoundary>
  )
}
```

---

## Advanced Patterns

### Pattern 1: Transactional Operations with Rollback

```typescript
// Backend: Handle complex operations with automatic rollback on error

import { asyncHandler, DatabaseError } from '@/core/errors'
import prisma from '@/db/client'

app.post('/purchase-credits', authMiddleware, asyncHandler(async (c) => {
  const { packageId } = await c.req.json()
  const userId = c.get('userId')

  // Start transaction
  return await prisma.$transaction(async (tx) => {
    // Get package
    const package = await tx.creditPackage.findUnique({
      where: { id: packageId }
    })

    if (!package) {
      throw new ResourceNotFoundError('Credit Package', packageId)
    }

    // Create payment record
    const payment = await tx.payment.create({
      data: {
        userId,
        amount: package.price,
        creditAmount: package.credits,
        status: 'pending',
        merchantOrderId: generateOrderId(),
      }
    })

    // Create payment with gateway
    const paymentUrl = await createDuitkuPayment(payment)

    // Return payment URL
    return sendSuccess(c, { paymentUrl, payment })
  })
  // If any error occurs, all database operations are rolled back automatically
}, 'Purchase Credits'))
```

### Pattern 2: Retry Logic with Exponential Backoff

```typescript
// Frontend: Advanced retry with custom logic

import { retryWithBackoff, AppError } from '@/core/errors'

async function reliableFetch<T>(url: string): Promise<T> {
  return await retryWithBackoff(
    async () => {
      const response = await api.get<T>(url)
      return response.data
    },
    {
      maxRetries: 5,
      initialDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      onRetry: (attempt, error) => {
        const appError = AppError.fromUnknownError(error)

        // Only retry on network errors or 5xx errors
        if (!appError.isRetryable() && appError.metadata.statusCode < 500) {
          throw error // Stop retrying
        }

        console.log(`Retry attempt ${attempt}`, appError.message)
      }
    }
  )
}
```

### Pattern 3: Error Context Enrichment

```typescript
// Backend: Add rich context to errors for better debugging

import { asyncHandler, ResourceNotFoundError } from '@/core/errors'

app.delete('/projects/:id', authMiddleware, asyncHandler(async (c) => {
  const projectId = c.req.param('id')
  const userId = c.get('userId')

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      _count: {
        select: {
          generations: true,
          collaborators: true
        }
      }
    }
  })

  if (!project) {
    throw new ResourceNotFoundError('Project', projectId)
      .withMetadata({
        attemptedBy: userId,
        timestamp: new Date().toISOString(),
        action: 'delete',
      })
  }

  // Check if project has dependencies
  if (project._count.generations > 0) {
    throw new ValidationError(
      'Cannot delete project with existing generations',
      {
        projectId,
        generationCount: project._count.generations,
        suggestion: 'Delete all generations first or archive the project'
      }
    )
  }

  // ... rest of deletion logic
}, 'Delete Project'))
```

---

These examples demonstrate real-world usage patterns that you can adapt to your specific needs. Remember to:

1. Always use specific error classes
2. Provide rich context in metadata
3. Use Error Boundaries at appropriate levels
4. Handle retryable errors appropriately
5. Give users clear, actionable feedback

For more information, see the full documentation in `docs/ERROR_HANDLING_SYSTEM.md`.
