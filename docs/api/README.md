# API Documentation

---
**Last Updated:** 2025-10-14
**Version:** 1.0.0
**Base URL (Production):** `https://api.lumiku.com`
**Base URL (Development):** `http://localhost:3000`
**Total Endpoints:** 114+
---

## Overview

The Lumiku API is a RESTful API built with Express.js and Hono framework. All endpoints return JSON responses and require proper authentication where indicated.

## Authentication

**Method:** JWT (JSON Web Token) Bearer Authentication

**Header Format:**
```http
Authorization: Bearer {jwt_token}
```

**Obtaining Token:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "user": {...},
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "statusCode": 400
  }
}
```

## HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (duplicate) |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

## Rate Limiting

### Authentication Endpoints
- **Login:** 5 attempts per 15 minutes per IP
- **Register:** 3 attempts per hour per IP
- **Password Reset:** 3 attempts per hour per IP
- **Account Lockout:** 10 failed logins in 1 hour = 30 min lockout

### Other Endpoints
- **Profile Updates:** 10 per hour
- **Global Auth:** 1000 requests per minute (system-wide)

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1697123456
```

---

## API Endpoints by Category

## Core Authentication (`/api/auth`)

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer {token}
```

### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "currentPassword": "oldpass",
  "newPassword": "newpass123"
}
```

---

## Credits Management (`/api/credits`, `/api/credit`)

### Get Credit Balance
```http
GET /api/credits/balance
Authorization: Bearer {token}

Response:
{
  "balance": 150,
  "lastTransaction": {
    "amount": -5,
    "type": "usage",
    "description": "Video Mixer generation"
  }
}
```

### Get Credit History
```http
GET /api/credits/history?limit=20&offset=0
Authorization: Bearer {token}

Response:
{
  "transactions": [
    {
      "id": "clx...",
      "amount": -5,
      "balance": 145,
      "type": "usage",
      "description": "Video Mixer generation",
      "createdAt": "2025-10-14T08:30:00Z"
    }
  ],
  "total": 45
}
```

### Purchase Credits (initiates payment)
```http
POST /api/credits/purchase
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 100,
  "creditAmount": 100
}
```

---

## Subscription Management (`/api/subscriptions`)

### Get Available Plans
```http
GET /api/subscriptions/plans
Authorization: Bearer {token}

Response:
{
  "plans": [
    {
      "id": "clx...",
      "planId": "pro-monthly",
      "name": "Pro Monthly",
      "tier": "pro",
      "price": 300000,
      "dailyQuota": 200,
      "billingCycle": "monthly"
    }
  ]
}
```

### Create Subscription
```http
POST /api/subscriptions/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "planId": "pro-monthly"
}

Response:
{
  "subscriptionId": "clx...",
  "paymentUrl": "https://passport.duitku.com/...",
  "expiresAt": "2025-10-14T10:00:00Z"
}
```

### Get Current Subscription
```http
GET /api/subscriptions/current
Authorization: Bearer {token}
```

### Cancel Subscription
```http
POST /api/subscriptions/cancel
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Too expensive"
}
```

---

## Quota Management (`/api/quotas`)

### Get Quota Usage
```http
GET /api/quotas/usage?period=2025-10-14
Authorization: Bearer {token}

Response:
{
  "quotaType": "daily",
  "period": "2025-10-14",
  "usageCount": 45,
  "quotaLimit": 200,
  "remaining": 155,
  "modelBreakdown": {
    "video-generator:veo3": 20,
    "poster-editor:flux-dev": 15
  },
  "resetAt": "2025-10-15T00:00:00Z"
}
```

### Check Quota Availability
```http
POST /api/quotas/check
Authorization: Bearer {token}
Content-Type: application/json

{
  "modelKey": "video-generator:veo3",
  "quotaRequired": 2
}

Response:
{
  "available": true,
  "remaining": 155,
  "quotaLimit": 200
}
```

---

## Payment Processing (`/api/payments`)

### Duitku Callback (Webhook)
```http
POST /api/payments/callback
Content-Type: application/json
X-Forwarded-For: {duitku_ip}

{
  "merchantOrderId": "ORD-123",
  "reference": "DT-REF-456",
  "amount": 100000,
  "statusCode": "00",
  "signature": "..."
}
```

**Note:** This endpoint is called by Duitku servers, not directly by clients.

### Get Payment Status
```http
GET /api/payments/status/{merchantOrderId}
Authorization: Bearer {token}

Response:
{
  "payment": {
    "id": "clx...",
    "merchantOrderId": "ORD-123",
    "status": "success",
    "amount": 100000,
    "creditAmount": 100,
    "createdAt": "2025-10-14T08:00:00Z"
  }
}
```

---

## Device Management (`/api/devices`)

### List User Devices
```http
GET /api/devices
Authorization: Bearer {token}

Response:
{
  "devices": [
    {
      "id": "clx...",
      "deviceName": "Chrome on Windows",
      "deviceType": "desktop",
      "browser": "Chrome",
      "os": "Windows 10",
      "lastActive": "2025-10-14T08:30:00Z"
    }
  ]
}
```

### Revoke Device
```http
DELETE /api/devices/{deviceId}
Authorization: Bearer {token}
```

---

## Statistics & Analytics (`/api/stats`, `/api/model-stats`)

### Get User Statistics
```http
GET /api/stats/user
Authorization: Bearer {token}

Response:
{
  "totalGenerations": 150,
  "creditsUsed": 500,
  "quotaUsed": 45,
  "favoriteApps": ["video-mixer", "carousel-mix"],
  "activityByDay": {...}
}
```

### Get Model Usage Stats
```http
GET /api/model-stats?appId=video-generator
Authorization: Bearer {token}

Response:
{
  "models": [
    {
      "modelKey": "video-generator:veo3",
      "name": "Google Veo 3",
      "usageCount": 20,
      "lastUsed": "2025-10-14T08:30:00Z"
    }
  ]
}
```

---

## Admin Operations (`/api/admin`)

**Note:** All admin endpoints require `role: admin`

### List All Users
```http
GET /api/admin/users?limit=50&offset=0
Authorization: Bearer {admin_token}
```

### Update User Role
```http
PUT /api/admin/users/{userId}/role
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "role": "admin"
}
```

### Get System Stats
```http
GET /api/admin/stats
Authorization: Bearer {admin_token}

Response:
{
  "totalUsers": 1250,
  "activeSubscriptions": 150,
  "totalRevenue": 15000000,
  "systemHealth": "healthy"
}
```

---

## App-Specific APIs

### Video Mixer (`/api/apps/video-mixer`)

**Create Project:**
```http
POST /api/apps/video-mixer/projects
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "My Video Mix",
  "description": "Tutorial video mix"
}
```

**Upload Video:**
```http
POST /api/apps/video-mixer/projects/{projectId}/videos
Authorization: Bearer {token}
Content-Type: multipart/form-data

video: (binary)
groupId: (optional)
```

**Generate Videos:**
```http
POST /api/apps/video-mixer/projects/{projectId}/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "totalVideos": 10,
  "settings": {
    "enableOrderMixing": true,
    "videoResolution": "720p",
    "videoBitrate": "medium",
    "metadataSource": "capcut"
  }
}
```

---

### Carousel Mix (`/api/apps/carousel-mix`)

**Create Project:**
```http
POST /api/apps/carousel-mix/projects
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Instagram Carousel",
  "defaultNumSlides": 4
}
```

**Upload Slide:**
```http
POST /api/apps/carousel-mix/projects/{projectId}/slides
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: (binary)
slidePosition: 1
```

**Add Text:**
```http
POST /api/apps/carousel-mix/projects/{projectId}/texts
Authorization: Bearer {token}
Content-Type: application/json

{
  "slidePosition": 1,
  "content": "Your text here"
}
```

**Generate Carousels:**
```http
POST /api/apps/carousel-mix/projects/{projectId}/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "numSlides": 4,
  "numSetsGenerated": 10
}
```

---

### Looping Flow (`/api/apps/looping-flow`)

**Create Project:**
```http
POST /api/apps/looping-flow/projects
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Seamless Loop",
  "description": "Background video"
}
```

**Upload Video:**
```http
POST /api/apps/looping-flow/projects/{projectId}/videos
Authorization: Bearer {token}
Content-Type: multipart/form-data

video: (binary)
```

**Generate Loop:**
```http
POST /api/apps/looping-flow/projects/{projectId}/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "videoId": "clx...",
  "targetDuration": 60,
  "loopStyle": "crossfade",
  "crossfadeDuration": 1.0
}
```

---

### Avatar Creator (`/api/apps/avatar-creator`)

**Create Project:**
```http
POST /api/apps/avatar-creator/projects
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Business Avatars"
}
```

**Generate Avatar (Text-to-Image):**
```http
POST /api/apps/avatar-creator/avatars/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "projectId": "clx...",
  "prompt": "Professional businessman, 35 years old, wearing suit",
  "name": "John Business",
  "persona": {
    "personaName": "John Smith",
    "personaAge": 35,
    "personaPersonality": ["professional", "confident"],
    "personaBackground": "CEO of tech startup"
  }
}
```

**Upload Avatar:**
```http
POST /api/apps/avatar-creator/avatars/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

image: (binary)
projectId: clx...
name: Avatar Name
```

**Get Avatar Usage History:**
```http
GET /api/apps/avatar-creator/avatars/{avatarId}/usage
Authorization: Bearer {token}
```

---

### Avatar Generator (`/api/apps/avatar-generator`)

**Generate Avatar Variation:**
```http
POST /api/apps/avatar-generator/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "prompt": "Same person but smiling",
  "referenceImageUrl": "https://..."
}
```

---

## Generation Tracking (`/api/generation`)

### Get Generation Status
```http
GET /api/generation/{generationId}/status
Authorization: Bearer {token}

Response:
{
  "generation": {
    "id": "clx...",
    "status": "processing",
    "progress": 45,
    "estimatedTimeRemaining": 120
  }
}
```

### List User Generations
```http
GET /api/generation?appId=video-mixer&limit=20
Authorization: Bearer {token}
```

---

## Pose Templates (`/api/pose-template`)

### List Pose Templates
```http
GET /api/pose-template
Authorization: Bearer {token}

Response:
{
  "templates": [
    {
      "id": "clx...",
      "name": "Standing Confident",
      "category": "business",
      "previewUrl": "https://..."
    }
  ]
}
```

---

## Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `INVALID_CREDENTIALS` | Wrong email/password | Check credentials |
| `USER_NOT_FOUND` | User doesn't exist | Verify user ID |
| `INSUFFICIENT_CREDITS` | Not enough credits | Purchase more credits |
| `QUOTA_EXCEEDED` | Daily quota reached | Wait for reset or upgrade plan |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Wait and retry |
| `UNAUTHORIZED` | Invalid/missing token | Re-authenticate |
| `FORBIDDEN` | Insufficient permissions | Check user role |
| `VALIDATION_ERROR` | Invalid request data | Fix request body |
| `RESOURCE_NOT_FOUND` | Resource doesn't exist | Verify resource ID |
| `DUPLICATE_RESOURCE` | Resource already exists | Use different identifier |
| `PAYMENT_FAILED` | Payment processing failed | Retry payment |
| `GENERATION_FAILED` | Content generation failed | Check error details |

---

## Pagination

Endpoints that return lists support pagination:

```http
GET /api/endpoint?limit=20&offset=40
```

**Parameters:**
- `limit`: Number of items per page (default: 20, max: 100)
- `offset`: Number of items to skip (default: 0)

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 40,
    "hasMore": true
  }
}
```

---

## Filtering & Sorting

**Common Query Parameters:**
- `sortBy`: Field to sort by
- `sortOrder`: `asc` or `desc`
- `filter`: JSON string with filter criteria
- `search`: Text search query

**Example:**
```http
GET /api/projects?sortBy=createdAt&sortOrder=desc&search=tutorial
```

---

## Webhooks

### Payment Callback (Duitku)
**Endpoint:** `POST /api/payments/callback`
**Source:** Duitku payment gateway
**Authentication:** IP whitelist + signature verification

### Expected Payloads
Refer to [Payment Security Documentation](../security/payment-security.md)

---

## SDKs & Client Libraries

Currently, no official SDKs are provided. Use standard HTTP clients:

**JavaScript/TypeScript:**
```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: 'https://api.lumiku.com',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})

const response = await api.get('/api/auth/profile')
```

**cURL:**
```bash
curl -X GET https://api.lumiku.com/api/auth/profile \
  -H "Authorization: Bearer ${TOKEN}"
```

---

## API Versioning

**Current Version:** v1 (implicit, no version prefix)

Future versions will use URL versioning:
- v1: `/api/endpoint`
- v2: `/api/v2/endpoint`

---

## Testing

### Development Environment
```
Base URL: http://localhost:3000
```

### Sandbox (Duitku Payments)
```
DUITKU_ENV=sandbox
```

### Production
```
Base URL: https://api.lumiku.com
```

---

## Support & Contact

- **Documentation:** https://docs.lumiku.com
- **Issues:** https://github.com/lumiku/app/issues
- **Email:** support@lumiku.com

---

## Related Documentation

- **[Architecture Overview](../architecture/overview.md)** - System architecture
- **[Subscription System](../architecture/subscription-system.md)** - PAYG vs Subscription
- **[Authentication](../security/authorization-system.md)** - Auth details
- **[Rate Limiting](../RATE_LIMITING.md)** - Rate limit configuration
- **[Payment Security](../security/payment-security.md)** - Payment integration

---

**Document Status:** Current
**Last Updated:** 2025-10-14
**API Version:** v1
**Maintainer:** Technical Team
