# Background Remover Pro - API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URL & Headers](#base-url--headers)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [Core Endpoints](#core-endpoints)
7. [Batch Endpoints](#batch-endpoints)
8. [Subscription Endpoints](#subscription-endpoints)
9. [Integration Endpoints](#integration-endpoints)
10. [Admin Endpoints](#admin-endpoints)

---

## Overview

The Background Remover Pro API provides RESTful endpoints for:
- Single image background removal
- Batch processing (up to 500 images)
- Subscription management
- Cross-app integrations
- Usage analytics

**API Version**: v1
**Protocol**: HTTPS only
**Response Format**: JSON
**Request Format**: JSON or multipart/form-data (for file uploads)

---

## Authentication

All endpoints require JWT authentication except public health checks.

### JWT Token Format

```typescript
interface JWTPayload {
  userId: string
  email: string
  role: 'user' | 'admin'
  iat: number // Issued at
  exp: number // Expires at
}
```

### Authentication Header

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Example Login Flow

```typescript
// 1. Login to get token
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
})

const { token } = await loginResponse.json()

// 2. Use token in subsequent requests
const response = await fetch('/api/background-remover/remove', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'
  },
  body: formData
})
```

---

## Base URL & Headers

### Production
```
https://api.lumiku.com/v1
```

### Development
```
http://localhost:3000/api
```

### Required Headers

| Header | Value | Required | Description |
|--------|-------|----------|-------------|
| `Authorization` | Bearer {token} | Yes* | JWT auth token (*except health) |
| `Content-Type` | application/json | Conditional | For JSON payloads |
| `Content-Type` | multipart/form-data | Conditional | For file uploads |
| `Accept` | application/json | No | Response format preference |

---

## Error Handling

### Error Response Format

All errors return consistent JSON structure:

```typescript
interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
    timestamp: string
    requestId?: string
  }
}
```

### Example Error Response

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "You need 15 credits but only have 8 available",
    "details": {
      "required": 15,
      "available": 8,
      "tier": "professional"
    },
    "timestamp": "2025-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

### HTTP Status Codes

| Status | Description | Common Errors |
|--------|-------------|---------------|
| 200 | Success | - |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input, validation errors |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side errors |
| 503 | Service Unavailable | Maintenance mode |

### Common Error Codes

```typescript
enum ErrorCode {
  // Authentication
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',

  // Authorization
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Validation
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',

  // Business Logic
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  TIER_NOT_ALLOWED = 'TIER_NOT_ALLOWED',
  BATCH_TOO_LARGE = 'BATCH_TOO_LARGE',

  // System
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}
```

---

## Rate Limiting

### Limits by Endpoint Type

| Endpoint Type | Limit | Window | Burst |
|---------------|-------|--------|-------|
| Single Remove | 30 req/min | 1 min | 10 |
| Batch Start | 5 req/hour | 1 hour | 2 |
| Status Check | 120 req/min | 1 min | 30 |
| Subscription | 10 req/min | 1 min | 5 |

### Rate Limit Headers

```http
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1642248000
```

### Rate Limit Error

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 45 seconds",
    "details": {
      "retryAfter": 45,
      "limit": 30,
      "window": "1 minute"
    }
  }
}
```

---

## Core Endpoints

### 1. Remove Single Image Background

Remove background from a single image.

**Endpoint**: `POST /background-remover/remove`

**Request**:
```typescript
// multipart/form-data
interface RemoveSingleRequest {
  image: File          // Required: Image file (max 10MB)
  tier: RemovalTier    // Required: 'basic' | 'standard' | 'professional' | 'industry'
}
```

**cURL Example**:
```bash
curl -X POST https://api.lumiku.com/v1/background-remover/remove \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/image.jpg" \
  -F "tier=professional"
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "jobId": "job_abc123",
    "originalUrl": "/uploads/background-remover/user_123/original.jpg",
    "processedUrl": "/processed/background-remover/user_123/removed.png",
    "creditsUsed": 15,
    "pricingType": "credits",
    "processingTimeMs": 3245,
    "tier": "professional",
    "metadata": {
      "originalSize": 2457600,
      "processedSize": 1823400,
      "width": 1920,
      "height": 1080,
      "format": "png"
    }
  }
}
```

**Errors**:
- `400`: Invalid tier, file too large (>10MB), unsupported format
- `402`: Insufficient credits
- `403`: Tier not allowed in subscription plan
- `429`: Daily quota exceeded

---

### 2. Start Batch Processing

Process multiple images (2-500) in a batch.

**Endpoint**: `POST /background-remover/batch`

**Request**:
```typescript
// multipart/form-data
interface BatchRemovalRequest {
  images: File[]      // Required: 2-500 image files
  tier: RemovalTier   // Required
}
```

**cURL Example**:
```bash
curl -X POST https://api.lumiku.com/v1/background-remover/batch \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "tier=standard" \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg" \
  -F "images=@image3.jpg"
```

**Response**: `201 Created`
```json
{
  "success": true,
  "data": {
    "batchId": "batch_xyz789",
    "totalImages": 100,
    "tier": "standard",
    "pricing": {
      "baseCreditsPerImage": 8,
      "baseTotal": 800,
      "discountPercentage": 10,
      "discountAmount": 80,
      "finalTotal": 720,
      "creditsPerImageAfterDiscount": 7.2
    },
    "estimatedCompletionMinutes": 15,
    "status": "pending",
    "createdAt": "2025-01-15T10:00:00Z"
  }
}
```

**Errors**:
- `400`: Too few (<2) or too many (>500) images, total size >2GB
- `402`: Insufficient credits
- `429`: Batch limit exceeded (max 5 per hour)

---

### 3. Get Batch Status

Get real-time progress of a batch.

**Endpoint**: `GET /background-remover/batch/:batchId`

**Request**:
```bash
curl https://api.lumiku.com/v1/background-remover/batch/batch_xyz789 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "batchId": "batch_xyz789",
    "status": "processing",
    "progress": {
      "totalImages": 100,
      "processedImages": 67,
      "failedImages": 2,
      "percentage": 69
    },
    "pricing": {
      "totalCredits": 720,
      "discountPercentage": 10
    },
    "timing": {
      "startedAt": "2025-01-15T10:00:00Z",
      "estimatedCompletionAt": "2025-01-15T10:15:00Z"
    },
    "zipUrl": null
  }
}
```

**When Completed**:
```json
{
  "success": true,
  "data": {
    "batchId": "batch_xyz789",
    "status": "completed",
    "progress": {
      "totalImages": 100,
      "processedImages": 98,
      "failedImages": 2,
      "percentage": 100
    },
    "zipUrl": "/batches/batch_xyz789.zip",
    "zipSizeBytes": 157286400,
    "completedAt": "2025-01-15T10:12:00Z"
  }
}
```

---

### 4. Download Batch ZIP

Download ZIP file containing all processed images.

**Endpoint**: `GET /background-remover/batch/:batchId/download`

**Request**:
```bash
curl https://api.lumiku.com/v1/background-remover/batch/batch_xyz789/download \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -O batch.zip
```

**Response**: `200 OK`
- Content-Type: `application/zip`
- Content-Disposition: `attachment; filename="batch_xyz789.zip"`
- Binary ZIP file

**ZIP Structure**:
```
batch_xyz789.zip
├── removed-image1.png
├── removed-image2.png
├── removed-image3.png
└── ... (up to 500 files)
```

---

### 5. Get Job Details

Get details of a single removal job.

**Endpoint**: `GET /background-remover/jobs/:jobId`

**Request**:
```bash
curl https://api.lumiku.com/v1/background-remover/jobs/job_abc123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "job_abc123",
    "status": "completed",
    "tier": "professional",
    "originalUrl": "/uploads/background-remover/user_123/original.jpg",
    "processedUrl": "/processed/background-remover/user_123/removed.png",
    "creditsUsed": 15,
    "pricingType": "credits",
    "processingTimeMs": 3245,
    "aiProvider": "segmind",
    "modelName": "birefnet-general",
    "metadata": {
      "fileSizeBytes": 2457600,
      "width": 1920,
      "height": 1080,
      "format": "jpg"
    },
    "createdAt": "2025-01-15T10:00:00Z",
    "completedAt": "2025-01-15T10:00:03Z"
  }
}
```

---

### 6. Get User's Job History

List all jobs for authenticated user with pagination.

**Endpoint**: `GET /background-remover/jobs`

**Query Parameters**:
```typescript
interface JobsQuery {
  page?: number          // Default: 1
  limit?: number         // Default: 20, max: 100
  status?: JobStatus     // Filter by status
  tier?: RemovalTier     // Filter by tier
  startDate?: string     // ISO date
  endDate?: string       // ISO date
  sortBy?: 'createdAt' | 'creditsUsed'
  sortOrder?: 'asc' | 'desc'
}
```

**Request**:
```bash
curl "https://api.lumiku.com/v1/background-remover/jobs?page=1&limit=20&status=completed" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "job_001",
        "tier": "professional",
        "status": "completed",
        "creditsUsed": 15,
        "createdAt": "2025-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

## Subscription Endpoints

### 7. Get Subscription Status

Get current subscription plan and quota usage.

**Endpoint**: `GET /background-remover/subscription`

**Request**:
```bash
curl https://api.lumiku.com/v1/background-remover/subscription \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "hasSubscription": true,
    "plan": "pro",
    "status": "active",
    "pricing": {
      "monthlyPrice": 299000,
      "currency": "IDR"
    },
    "quotas": {
      "daily": {
        "limit": 200,
        "used": 47,
        "remaining": 153,
        "resetsAt": "2025-01-16T00:00:00Z"
      },
      "professionalTier": {
        "limit": 50,
        "used": 12,
        "remaining": 38
      }
    },
    "allowedTiers": ["basic", "standard", "professional"],
    "billing": {
      "nextBillingDate": "2025-02-15T00:00:00Z",
      "subscribedAt": "2025-01-15T00:00:00Z"
    }
  }
}
```

**No Subscription**:
```json
{
  "success": true,
  "data": {
    "hasSubscription": false,
    "availablePlans": [
      {
        "name": "starter",
        "price": 99000,
        "dailyQuota": 50,
        "allowedTiers": ["basic", "standard"]
      },
      {
        "name": "pro",
        "price": 299000,
        "dailyQuota": 200,
        "allowedTiers": ["basic", "standard", "professional"],
        "professionalQuota": 50
      }
    ]
  }
}
```

---

### 8. Subscribe to Plan

Create or upgrade subscription.

**Endpoint**: `POST /background-remover/subscription`

**Request**:
```json
{
  "plan": "pro",
  "paymentMethodId": "pm_abc123"
}
```

**Response**: `201 Created`
```json
{
  "success": true,
  "data": {
    "subscriptionId": "sub_xyz789",
    "plan": "pro",
    "status": "active",
    "nextBillingDate": "2025-02-15T00:00:00Z",
    "amountCharged": 299000
  }
}
```

---

### 9. Cancel Subscription

Cancel active subscription (ends at billing cycle).

**Endpoint**: `DELETE /background-remover/subscription`

**Request**:
```bash
curl -X DELETE https://api.lumiku.com/v1/background-remover/subscription \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "message": "Subscription cancelled successfully",
    "expiresAt": "2025-02-15T00:00:00Z",
    "remainingDays": 30
  }
}
```

---

## Integration Endpoints

### 10. Avatar Creator Integration

Batch remove backgrounds from all avatars in a project.

**Endpoint**: `POST /background-remover/integrations/avatar-creator/batch`

**Request**:
```json
{
  "projectId": "proj_abc123",
  "tier": "professional"
}
```

**Response**: `201 Created`
```json
{
  "success": true,
  "data": {
    "batchId": "batch_integration_001",
    "projectId": "proj_abc123",
    "totalAvatars": 12,
    "totalCredits": 162,
    "discountPercentage": 0
  }
}
```

---

### 11. Pose Generator Integration

Auto-remove background after pose generation.

**Endpoint**: `POST /background-remover/integrations/pose-generator/auto-remove`

**Request**:
```json
{
  "generatedImageId": "pose_gen_001",
  "tier": "standard"
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "jobId": "job_pose_001",
    "generatedImageId": "pose_gen_001",
    "processedUrl": "/processed/pose_gen_001-removed.png",
    "creditsUsed": 8
  }
}
```

---

## Admin Endpoints

### 12. Get Platform Statistics

Admin-only endpoint for analytics.

**Endpoint**: `GET /background-remover/admin/stats`

**Request**:
```bash
curl "https://api.lumiku.com/v1/background-remover/admin/stats?period=30d" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "period": "30d",
    "jobs": {
      "total": 125000,
      "completed": 122500,
      "failed": 2500,
      "successRate": 98.0
    },
    "usage": {
      "totalCreditsUsed": 1875000,
      "totalRevenue": 187500000,
      "avgCreditsPerJob": 15
    },
    "tierBreakdown": {
      "basic": { "count": 50000, "percentage": 40 },
      "standard": { "count": 45000, "percentage": 36 },
      "professional": { "count": 25000, "percentage": 20 },
      "industry": { "count": 5000, "percentage": 4 }
    },
    "subscriptions": {
      "active": 1250,
      "starter": 800,
      "pro": 450,
      "mrr": 186750000
    }
  }
}
```

---

## Pricing Calculator

### 13. Calculate Batch Price

Calculate price before starting batch.

**Endpoint**: `POST /background-remover/pricing/calculate`

**Request**:
```json
{
  "imageCount": 100,
  "tier": "standard"
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "imageCount": 100,
    "tier": "standard",
    "baseCreditsPerImage": 8,
    "baseTotal": 800,
    "discountPercentage": 10,
    "discountAmount": 80,
    "finalTotal": 720,
    "creditsPerImageAfterDiscount": 7.2,
    "breakdown": {
      "costInIDR": 72000,
      "costInUSD": 4.8,
      "savingsIDR": 8000
    }
  }
}
```

---

## WebSocket Real-Time Updates

For real-time batch progress, use WebSocket connection.

**Endpoint**: `ws://api.lumiku.com/v1/background-remover/ws`

**Connect**:
```typescript
const ws = new WebSocket('wss://api.lumiku.com/v1/background-remover/ws')

ws.on('open', () => {
  // Authenticate
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'YOUR_JWT_TOKEN'
  }))

  // Subscribe to batch updates
  ws.send(JSON.stringify({
    type: 'subscribe',
    batchId: 'batch_xyz789'
  }))
})

ws.on('message', (data) => {
  const update = JSON.parse(data)
  console.log('Progress:', update.progress)
})
```

**Message Types**:
```typescript
// Progress update
{
  "type": "progress",
  "batchId": "batch_xyz789",
  "processedImages": 67,
  "totalImages": 100,
  "percentage": 67,
  "status": "processing"
}

// Completion
{
  "type": "completed",
  "batchId": "batch_xyz789",
  "zipUrl": "/batches/batch_xyz789.zip",
  "processedImages": 98,
  "failedImages": 2
}

// Error
{
  "type": "error",
  "batchId": "batch_xyz789",
  "error": "Processing failed"
}
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import { BackgroundRemoverClient } from '@lumiku/sdk'

const client = new BackgroundRemoverClient({
  apiKey: 'YOUR_API_KEY',
  baseUrl: 'https://api.lumiku.com/v1'
})

// Single removal
const result = await client.removeSingle({
  image: fileInput.files[0],
  tier: 'professional'
})

// Batch processing with progress callback
const batch = await client.startBatch({
  images: Array.from(fileInput.files),
  tier: 'standard',
  onProgress: (progress) => {
    console.log(`${progress.percentage}% complete`)
  }
})

// Wait for completion
await batch.waitForCompletion()
const zipUrl = batch.getDownloadUrl()
```

### Python

```python
from lumiku import BackgroundRemoverClient

client = BackgroundRemoverClient(api_key='YOUR_API_KEY')

# Single removal
with open('image.jpg', 'rb') as f:
    result = client.remove_single(
        image=f,
        tier='professional'
    )
    print(f"Processed URL: {result.processed_url}")

# Batch processing
batch = client.start_batch(
    images=['img1.jpg', 'img2.jpg', 'img3.jpg'],
    tier='standard'
)

# Poll for progress
while not batch.is_complete():
    progress = batch.get_progress()
    print(f"Progress: {progress.percentage}%")
    time.sleep(2)

# Download ZIP
batch.download_zip('output.zip')
```

---

## Summary

**Total Endpoints**: 13 public + 3 admin = 16 endpoints

**Key Features**:
- RESTful design with consistent error handling
- Real-time progress via WebSocket
- Comprehensive pagination and filtering
- Volume discounts calculated automatically
- Subscription quota tracking
- Cross-app integrations

**Next Steps**: See PRICING_LOGIC.md for detailed pricing calculations.
