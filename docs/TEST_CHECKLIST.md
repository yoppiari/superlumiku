# Lumiku Platform - Comprehensive Test Checklist

> **Version:** 1.0.0
> **Last Updated:** 2025-10-14
> **Purpose:** Production-ready test suite for all Lumiku platform features

## Table of Contents
- [Quick Start](#quick-start)
- [1. User Registration & Login Flow](#1-user-registration--login-flow)
- [2. Credit System Tests](#2-credit-system-tests)
- [3. Plugin Functionality Tests](#3-plugin-functionality-tests)
- [4. API Endpoint Tests](#4-api-endpoint-tests)
- [5. Frontend User Journey Tests](#5-frontend-user-journey-tests)
- [6. Security & Performance Tests](#6-security--performance-tests)
- [7. Automated Test Execution](#7-automated-test-execution)

---

## Quick Start

### Environment Setup

```bash
# 1. Clone and navigate to project
cd "C:\Users\yoppi\Downloads\Lumiku App"

# 2. Install dependencies
bun install

# 3. Set up environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials

# 4. Run database migrations
cd backend
bun prisma:generate
bun prisma:migrate

# 5. Seed test data
bun prisma:seed

# 6. Start backend server
bun dev

# 7. In new terminal, start frontend
cd ../frontend
bun dev
```

### Test Credentials

```
Email: test@lumiku.com
Password: password123
Initial Credits: 100
```

### API Base URLs

```
Backend API: http://localhost:3000
Frontend: http://localhost:5173
```

---

## 1. User Registration & Login Flow

### 1.1 Registration Tests

#### Test 1.1.1: Successful User Registration

**Test Steps:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }'
```

**Expected Result:**
- Status: `201 Created`
- Response contains: `user` object with `id`, `email`, `name`
- Response contains: `token` (JWT)
- Response contains: `device` object
- User created in database with default 1GB storage quota
- Credit record created with welcome bonus

**Verification:**
```bash
# Check user in database
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

#### Test 1.1.2: Registration with Invalid Email

**Test Steps:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "SecurePass123!",
    "name": "Test User"
  }'
```

**Expected Result:**
- Status: `400 Bad Request`
- Error message: "Invalid email address"

---

#### Test 1.1.3: Registration with Weak Password

**Test Steps:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser2@example.com",
    "password": "123",
    "name": "Test User"
  }'
```

**Expected Result:**
- Status: `400 Bad Request`
- Error message: "Password must be at least 8 characters"

---

#### Test 1.1.4: Registration with Duplicate Email

**Test Steps:**
```bash
# First registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "duplicate@example.com",
    "password": "SecurePass123!",
    "name": "First User"
  }'

# Second registration with same email
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "duplicate@example.com",
    "password": "SecurePass123!",
    "name": "Second User"
  }'
```

**Expected Result:**
- First request: `201 Created`
- Second request: `400 Bad Request` or `409 Conflict`
- Error indicates email already exists

---

#### Test 1.1.5: Registration Rate Limiting

**Test Steps:**
```bash
# Attempt 4 registrations rapidly from same IP
for i in {1..4}; do
  curl -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"ratelimit$i@example.com\",
      \"password\": \"SecurePass123!\",
      \"name\": \"Rate Limit Test $i\"
    }"
  echo ""
done
```

**Expected Result:**
- First 3 requests: `201 Created` or `400 Bad Request` (if valid)
- 4th request: `429 Too Many Requests`
- Rate limit: 3 registrations per hour per IP

---

### 1.2 Login Tests

#### Test 1.2.1: Successful Login

**Test Steps:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }'
```

**Expected Result:**
- Status: `200 OK`
- Response contains: `user` object
- Response contains: `token` (JWT)
- Response contains: `device` object
- Session created in database
- Device fingerprint recorded

---

#### Test 1.2.2: Login with Wrong Password

**Test Steps:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "wrongpassword"
  }'
```

**Expected Result:**
- Status: `401 Unauthorized`
- Error message: "Invalid credentials" or similar
- No session created

---

#### Test 1.2.3: Login with Non-existent Email

**Test Steps:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nonexistent@example.com",
    "password": "password123"
  }'
```

**Expected Result:**
- Status: `401 Unauthorized`
- Error message: "Invalid credentials"

---

#### Test 1.2.4: Login Rate Limiting (IP-based)

**Test Steps:**
```bash
# Attempt 6 failed logins rapidly
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@lumiku.com",
      "password": "wrongpassword"
    }'
  echo ""
done
```

**Expected Result:**
- First 5 attempts: `401 Unauthorized`
- 6th attempt: `429 Too Many Requests`
- Rate limit: 5 attempts per 15 minutes per IP

---

#### Test 1.2.5: Login Rate Limiting (Account-based)

**Test Steps:**
```bash
# Attempt 11 failed logins for specific account
for i in {1..11}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -H "X-Forwarded-For: 192.168.1.$i" \
    -d '{
      "email": "test@lumiku.com",
      "password": "wrongpassword"
    }'
  echo ""
done
```

**Expected Result:**
- First 10 attempts: `401 Unauthorized`
- 11th attempt: `429 Too Many Requests`
- Account locked for 30 minutes
- Error message indicates account lockout

---

### 1.3 Session Management Tests

#### Test 1.3.1: Access Protected Endpoint with Valid Token

**Test Steps:**
```bash
# First, login to get token
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

# Access protected endpoint
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Result:**
- Status: `200 OK`
- Response contains user profile data
- Fields: `id`, `email`, `name`, `role`, `credits`, `accountType`, `subscriptionTier`

---

#### Test 1.3.2: Access Protected Endpoint without Token

**Test Steps:**
```bash
curl -X GET http://localhost:3000/api/auth/profile
```

**Expected Result:**
- Status: `401 Unauthorized`
- Error message: "Authorization token required" or similar

---

#### Test 1.3.3: Access Protected Endpoint with Invalid Token

**Test Steps:**
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer invalid_token_here"
```

**Expected Result:**
- Status: `401 Unauthorized`
- Error message: "Invalid token" or "Token verification failed"

---

#### Test 1.3.4: Token Expiration (if JWT_EXPIRES_IN < 1 hour)

**Test Steps:**
1. Login and save token
2. Wait for token expiration time
3. Try to access protected endpoint

```bash
# This test requires manual timing or adjusting JWT_EXPIRES_IN in .env
TOKEN="expired_token_from_previous_session"

curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Result:**
- Status: `401 Unauthorized`
- Error message: "Token expired"

---

### 1.4 Profile Management Tests

#### Test 1.4.1: Update Profile Name

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

curl -X PUT http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Test User"
  }'
```

**Expected Result:**
- Status: `200 OK`
- Response contains updated user profile
- Name field shows "Updated Test User"

---

#### Test 1.4.2: Change Password

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

curl -X PUT http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "password123",
    "newPassword": "NewSecurePass456!"
  }'
```

**Expected Result:**
- Status: `200 OK`
- Password updated in database (bcrypt hash)
- Can login with new password
- Cannot login with old password

---

#### Test 1.4.3: Profile Update Rate Limiting

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

# Attempt 11 rapid profile updates
for i in {1..11}; do
  curl -X PUT http://localhost:3000/api/auth/profile \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"Update Attempt $i\"
    }"
  echo ""
done
```

**Expected Result:**
- First 10 attempts: `200 OK`
- 11th attempt: `429 Too Many Requests`
- Rate limit: 10 updates per hour

---

## 2. Credit System Tests

### 2.1 Credit Balance Tests

#### Test 2.1.1: Get Credit Balance

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

curl -X GET http://localhost:3000/api/credits/balance \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Result:**
- Status: `200 OK`
- Response contains: `{ "balance": 100 }` (or current balance)
- Balance is integer >= 0

---

#### Test 2.1.2: Get Credit Transaction History

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

curl -X GET http://localhost:3000/api/credits/history \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Result:**
- Status: `200 OK`
- Response contains array of credit transactions
- Each transaction has: `id`, `amount`, `balance`, `type`, `description`, `createdAt`
- Transactions ordered by `createdAt DESC`

---

### 2.2 Payment Flow Tests

#### Test 2.2.1: Create Payment Request (Duitku)

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

curl -X POST http://localhost:3000/api/payment/duitku/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "packageId": "package_100",
    "credits": 100,
    "amount": 50000,
    "productName": "100 Credits Package"
  }'
```

**Expected Result:**
- Status: `200 OK`
- Response contains: `merchantOrderId`, `paymentUrl`, `reference`
- Payment record created in database with status `pending`
- `paymentUrl` redirects to Duitku payment gateway

---

#### Test 2.2.2: Payment Status Check

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

# Replace MERCHANT_ORDER_ID with actual ID from previous test
curl -X GET "http://localhost:3000/api/payment/status/MERCHANT_ORDER_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Result:**
- Status: `200 OK`
- Response contains payment details: `id`, `status`, `amount`, `creditAmount`, `createdAt`
- Status is one of: `pending`, `success`, `failed`, `expired`

---

#### Test 2.2.3: Payment Callback (Webhook Simulation)

**Test Steps:**
```bash
# Simulate Duitku success callback
# Note: In production, this endpoint has IP whitelist and signature verification

curl -X POST http://localhost:3000/api/payment/duitku/callback \
  -H "Content-Type: application/json" \
  -d '{
    "merchantOrderId": "MERCHANT_ORDER_ID_HERE",
    "amount": "50000",
    "resultCode": "00",
    "reference": "DUITKU_REFERENCE",
    "signature": "CALCULATED_SIGNATURE"
  }'
```

**Expected Result:**
- Status: `200 OK`
- Payment status updated to `success` in database
- Credits added to user account
- Credit transaction created with `type: "purchase"`
- User balance increased by purchased credits

---

### 2.3 Credit Deduction Tests

#### Test 2.3.1: Sufficient Credits - Generate Carousel

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

# Create project first
PROJECT_ID=$(curl -X POST http://localhost:3000/api/apps/carousel-mix/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "description": "Credit deduction test"
  }' | jq -r '.project.id')

# Upload slides and add text (see Plugin Tests for details)
# ...

# Generate carousel (costs 4 credits for 4 slides, 2 sets = 4 credits)
curl -X POST "http://localhost:3000/api/apps/carousel-mix/projects/$PROJECT_ID/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "numSlides": 4,
    "numSets": 2
  }'
```

**Expected Result:**
- Status: `201 Created`
- Response contains: `generation` object, `creditUsed`, `creditBalance`
- Credits deducted: `Math.ceil(4 / 2) * 2 = 4 credits`
- New balance = old balance - 4
- Credit transaction created with negative amount

---

#### Test 2.3.2: Insufficient Credits - Should Fail

**Test Steps:**
```bash
# Create user with 0 credits for testing
# Or drain existing user's credits

TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

# Attempt generation with 0 credits
curl -X POST "http://localhost:3000/api/apps/carousel-mix/projects/PROJECT_ID/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "numSlides": 4,
    "numSets": 10
  }'
```

**Expected Result:**
- Status: `402 Payment Required` or `400 Bad Request`
- Error message: "Insufficient credits" or similar
- No generation created
- Credits not deducted
- Balance unchanged

---

#### Test 2.3.3: Concurrent Credit Deduction Race Condition

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

# Send 5 generation requests simultaneously
for i in {1..5}; do
  curl -X POST "http://localhost:3000/api/apps/carousel-mix/projects/PROJECT_ID/generate" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "numSlides": 2,
      "numSets": 1
    }' &
done
wait
```

**Expected Result:**
- All requests should be handled atomically
- Final balance should be: `initial_balance - (successful_requests * credit_cost)`
- No negative balance
- If insufficient credits, some requests fail with 402 error
- Database transactions prevent race conditions

---

### 2.4 Credit Transaction Integrity Tests

#### Test 2.4.1: Verify Running Balance Accuracy

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

# Get credit history
curl -X GET http://localhost:3000/api/credits/history \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Verify:
# 1. Each transaction has 'balance' field
# 2. balance = previous_balance + amount
# 3. Latest transaction balance matches current balance
```

**Expected Result:**
- All transactions have correct running balance
- No gaps or inconsistencies in balance calculations
- Latest transaction balance = current user balance

---

## 3. Plugin Functionality Tests

### 3.1 Carousel Mix Plugin

#### Test 3.1.1: Create Carousel Project

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

curl -X POST http://localhost:3000/api/apps/carousel-mix/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Carousel Project",
    "description": "Test carousel generation"
  }'
```

**Expected Result:**
- Status: `201 Created`
- Response contains project with: `id`, `name`, `description`, `defaultNumSlides`, `createdAt`
- Project stored in database

---

#### Test 3.1.2: Upload Carousel Slide (Image)

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

# Create test image
# For Windows PowerShell:
# $img = [System.Drawing.Bitmap]::new(800, 600)
# $img.Save("test-slide.png")

curl -X POST "http://localhost:3000/api/apps/carousel-mix/projects/PROJECT_ID/slides/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-slide.png" \
  -F "slidePosition=1"
```

**Expected Result:**
- Status: `201 Created`
- Response contains slide with: `id`, `fileName`, `filePath`, `fileType`, `fileSize`, `slidePosition`
- File saved in `uploads/carousel-slides/`
- User storage quota increased by file size

---

#### Test 3.1.3: Add Text Variation to Position

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

curl -X POST "http://localhost:3000/api/apps/carousel-mix/projects/PROJECT_ID/texts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Amazing Product!",
    "slidePosition": 1,
    "order": 0
  }'
```

**Expected Result:**
- Status: `201 Created`
- Response contains text with: `id`, `content`, `slidePosition`, `order`
- Text stored in database linked to project

---

#### Test 3.1.4: Update Position Text Styling

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

curl -X PUT "http://localhost:3000/api/apps/carousel-mix/projects/PROJECT_ID/positions/1/settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fontFamily": "Inter",
    "fontSize": 36,
    "fontColor": "#FFFFFF",
    "fontWeight": 700,
    "backgroundColor": "rgba(0, 0, 0, 0.7)",
    "textPosition": "center",
    "textAlignment": "center",
    "positionX": 50,
    "positionY": 50
  }'
```

**Expected Result:**
- Status: `200 OK`
- Position settings created/updated in database
- Settings apply to all text variations in that position

---

#### Test 3.1.5: Estimate Carousel Generation

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

curl -X POST "http://localhost:3000/api/apps/carousel-mix/projects/PROJECT_ID/estimate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "numSlides": 4,
    "numSets": 10
  }'
```

**Expected Result:**
- Status: `200 OK`
- Response contains: `totalCombinations`, `requestedSets`, `feasibility`, `credits`
- Credit calculation: `Math.ceil(numSlides / 2) * numSets`

---

#### Test 3.1.6: Generate Carousel Sets

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

# Ensure project has:
# - At least 4 slides uploaded
# - Text variations added to positions

curl -X POST "http://localhost:3000/api/apps/carousel-mix/projects/PROJECT_ID/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "numSlides": 4,
    "numSets": 2
  }'
```

**Expected Result:**
- Status: `201 Created`
- Response contains: `generation` with `id`, `status: "pending"`, `creditUsed`, `creditBalance`
- Generation queued for background processing
- Credits deducted immediately

---

#### Test 3.1.7: Check Generation Status

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

# Poll every 5 seconds
curl -X GET "http://localhost:3000/api/apps/carousel-mix/generations/GENERATION_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Result:**
- Status: `200 OK`
- Response contains generation with status: `pending`, `processing`, `completed`, or `failed`
- When `completed`: `outputPath` contains path to ZIP file
- When `failed`: `errorMessage` explains failure

---

#### Test 3.1.8: Download Generated Carousel

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

curl -X GET "http://localhost:3000/api/apps/carousel-mix/generations/GENERATION_ID/download" \
  -H "Authorization: Bearer $TOKEN" \
  --output carousel_output.zip
```

**Expected Result:**
- Status: `200 OK`
- Content-Type: `application/zip`
- ZIP file downloaded successfully
- ZIP contains generated carousel images (PNG format)
- Each image has text overlay at correct position with correct styling

---

### 3.2 Video Mixer Plugin

#### Test 3.2.1: Create Video Mixer Project

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

curl -X POST http://localhost:3000/api/apps/video-mixer/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Video Mix Project",
    "description": "Anti-fingerprinting video generation"
  }'
```

**Expected Result:**
- Status: `201 Created`
- Project created with `id`, `name`, `description`

---

#### Test 3.2.2: Upload Video to Project

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

# Create test video or use existing video file
curl -X POST "http://localhost:3000/api/apps/video-mixer/projects/PROJECT_ID/videos/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "video=@test-video.mp4"
```

**Expected Result:**
- Status: `201 Created`
- Video saved with: `id`, `fileName`, `filePath`, `fileSize`, `duration`, `mimeType`
- Storage quota updated

---

#### Test 3.2.3: Generate Mixed Videos

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

curl -X POST "http://localhost:3000/api/apps/video-mixer/projects/PROJECT_ID/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "totalVideos": 5,
    "enableOrderMixing": true,
    "enableSpeedVariations": true,
    "speedMin": 0.8,
    "speedMax": 1.2,
    "videoResolution": "720p",
    "frameRate": 30
  }'
```

**Expected Result:**
- Status: `201 Created`
- Generation queued with status `pending`
- Credits deducted based on video count and settings

---

### 3.3 Looping Flow Plugin

#### Test 3.3.1: Create Looping Flow Project

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

curl -X POST http://localhost:3000/api/apps/looping-flow/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Looping Video Project"
  }'
```

**Expected Result:**
- Status: `201 Created`
- Project created successfully

---

#### Test 3.3.2: Generate Seamless Loop

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

# Upload video first, then generate loop
curl -X POST "http://localhost:3000/api/apps/looping-flow/projects/PROJECT_ID/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "VIDEO_ID",
    "targetDuration": 60,
    "loopStyle": "crossfade",
    "crossfadeDuration": 1.5
  }'
```

**Expected Result:**
- Status: `201 Created`
- Loop generation queued
- Credits deducted based on target duration

---

### 3.4 Avatar Creator Plugin

#### Test 3.4.1: Create Avatar Project

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

curl -X POST http://localhost:3000/api/apps/avatar-creator/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Avatars",
    "description": "Professional avatar collection"
  }'
```

**Expected Result:**
- Status: `201 Created`
- Project created with `id`, `name`, `description`

---

#### Test 3.4.2: Upload Avatar Image

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

curl -X POST "http://localhost:3000/api/apps/avatar-creator/projects/PROJECT_ID/avatars/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@avatar.png" \
  -F "name=Professional Avatar" \
  -F "personaName=John Doe" \
  -F "personaAge=30" \
  -F "gender=male"
```

**Expected Result:**
- Status: `201 Created`
- Avatar created with image URL and persona data
- Image stored in uploads directory

---

#### Test 3.4.3: Generate Avatar with AI (FLUX)

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

curl -X POST "http://localhost:3000/api/apps/avatar-creator/projects/PROJECT_ID/avatars/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AI Generated Avatar",
    "prompt": "Professional business woman, age 35, wearing formal attire, studio lighting, high quality portrait",
    "gender": "female",
    "ageRange": "30-40"
  }'
```

**Expected Result:**
- Status: `201 Created`
- Generation started with status `pending`
- Credits deducted for AI generation
- Background worker processes generation

---

#### Test 3.4.4: Check Avatar Generation Status

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

curl -X GET "http://localhost:3000/api/apps/avatar-creator/generations/GENERATION_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Result:**
- Status: `200 OK`
- Generation status: `pending`, `processing`, `completed`, or `failed`
- When completed: `avatarId` links to created avatar

---

#### Test 3.4.5: Get Avatar Usage History

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

curl -X GET "http://localhost:3000/api/apps/avatar-creator/avatars/AVATAR_ID/usage-history" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Result:**
- Status: `200 OK`
- Response contains usage history array
- Summary shows total usage count and last used date

---

## 4. API Endpoint Tests

### 4.1 Health Check Endpoints

#### Test 4.1.1: Basic Health Check

**Test Steps:**
```bash
curl -X GET http://localhost:3000/health
```

**Expected Result:**
- Status: `200 OK`
- Response: `{ "status": "ok", "service": "lumiku-backend", ... }`

---

#### Test 4.1.2: Database Health Check

**Test Steps:**
```bash
curl -X GET http://localhost:3000/api/health
```

**Expected Result:**
- Status: `200 OK`
- Response shows database connection status
- `database: "connected"`

---

#### Test 4.1.3: Database Schema Health Check

**Test Steps:**
```bash
curl -X GET http://localhost:3000/health/database
```

**Expected Result:**
- Status: `200 OK`
- All critical tables exist: `users`, `sessions`, `credits`
- No missing tables

---

### 4.2 App Discovery Endpoints

#### Test 4.2.1: Get All Accessible Apps

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

curl -X GET http://localhost:3000/api/apps \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Result:**
- Status: `200 OK`
- Response contains `apps` array
- Each app has: `appId`, `name`, `description`, `icon`, `enabled`, `creditCostBase`
- Only apps user can access based on subscription tier

---

#### Test 4.2.2: Get Models for Specific App

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

curl -X GET "http://localhost:3000/api/apps/video-generator/models" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Result:**
- Status: `200 OK`
- Response contains `models` array
- Models filtered by user's subscription tier
- Each model has: `modelId`, `name`, `provider`, `creditCost`, `tier`

---

### 4.3 Device Management Endpoints

#### Test 4.3.1: Get User Devices

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

curl -X GET http://localhost:3000/api/devices \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Result:**
- Status: `200 OK`
- Response contains array of devices
- Each device: `id`, `deviceName`, `deviceType`, `browser`, `os`, `lastActive`

---

### 4.4 Statistics Endpoints

#### Test 4.4.1: Get User Statistics

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

curl -X GET http://localhost:3000/api/stats \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Result:**
- Status: `200 OK`
- Statistics about user activity, generations, credits used

---

### 4.5 Subscription & Quota Endpoints (Future)

#### Test 4.5.1: Get Subscription Status

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

curl -X GET http://localhost:3000/api/subscription/status \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Result:**
- Status: `200 OK`
- Subscription details: `tier`, `status`, `startDate`, `endDate`

---

#### Test 4.5.2: Get Quota Usage

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

curl -X GET http://localhost:3000/api/quota/usage \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Result:**
- Status: `200 OK`
- Daily and monthly quota usage statistics

---

## 5. Frontend User Journey Tests

### 5.1 Landing Page Journey

#### Test 5.1.1: Landing Page Load

**Manual Test Steps:**
1. Open browser to `http://localhost:5173`
2. Verify landing page loads without errors
3. Check browser console for errors

**Expected Result:**
- Page loads in < 3 seconds
- No console errors
- Hero section visible
- "Get Started" CTA button present

---

#### Test 5.1.2: Navigate to Login

**Manual Test Steps:**
1. From landing page, click "Login" button
2. Verify redirect to `/login`

**Expected Result:**
- Redirects to login page
- Login form visible with email and password fields

---

### 5.2 Authentication Journey

#### Test 5.2.1: User Registration Flow

**Manual Test Steps:**
1. Navigate to registration page (if separate) or login page
2. Click "Sign Up" or "Create Account"
3. Enter email: `uitest@example.com`
4. Enter password: `TestPass123!`
5. Enter name: `UI Test User`
6. Click "Register" button

**Expected Result:**
- Form validation works (email format, password length)
- On success: Redirect to dashboard
- User logged in automatically
- Welcome message or toast notification

---

#### Test 5.2.2: User Login Flow

**Manual Test Steps:**
1. Navigate to `/login`
2. Enter email: `test@lumiku.com`
3. Enter password: `password123`
4. Click "Login" button

**Expected Result:**
- On success: Redirect to `/dashboard`
- User session established
- Auth token stored in localStorage/sessionStorage
- Profile dropdown shows user name/email

---

#### Test 5.2.3: Login Error Handling

**Manual Test Steps:**
1. Navigate to `/login`
2. Enter email: `test@lumiku.com`
3. Enter wrong password: `wrongpassword`
4. Click "Login" button

**Expected Result:**
- Error message displayed: "Invalid credentials"
- No redirect
- Form not cleared (email remains)
- Password field cleared

---

#### Test 5.2.4: Logout Flow

**Manual Test Steps:**
1. Log in as `test@lumiku.com`
2. Click profile dropdown (top right)
3. Click "Logout"

**Expected Result:**
- Redirect to landing page or login page
- Session cleared
- Token removed from storage
- Cannot access protected routes

---

### 5.3 Dashboard Journey

#### Test 5.3.1: Dashboard Load

**Manual Test Steps:**
1. Log in as `test@lumiku.com`
2. View dashboard at `/dashboard`

**Expected Result:**
- Dashboard loads with app cards
- Credit balance visible in header
- All available apps shown:
  - Video Mixer
  - Carousel Mix
  - Looping Flow
  - Avatar Creator
  - etc.
- Each app card has: name, description, icon, "Open App" button

---

#### Test 5.3.2: App Navigation

**Manual Test Steps:**
1. From dashboard, click "Carousel Mix" app card
2. Verify navigation

**Expected Result:**
- Redirects to `/apps/carousel-mix`
- App interface loads
- Project list or create project prompt shown

---

#### Test 5.3.3: Credit Display

**Manual Test Steps:**
1. View dashboard
2. Check header for credit display

**Expected Result:**
- Credit balance visible (e.g., "100 Credits")
- Balance is current and accurate
- Clicking balance may open credit purchase modal

---

### 5.4 Profile & Settings Journey

#### Test 5.4.1: View Profile

**Manual Test Steps:**
1. Log in
2. Click profile dropdown
3. Click "Profile" or navigate to `/profile`

**Expected Result:**
- Profile page loads
- Shows: email, name, account type, subscription tier
- Shows storage usage

---

#### Test 5.4.2: Edit Profile

**Manual Test Steps:**
1. Navigate to `/profile`
2. Click "Edit" or find editable fields
3. Change name to "Updated Test User"
4. Save changes

**Expected Result:**
- Success message displayed
- Profile updated in database
- New name visible in profile dropdown

---

#### Test 5.4.3: Change Password

**Manual Test Steps:**
1. Navigate to `/settings` or `/profile`
2. Find "Change Password" section
3. Enter current password: `password123`
4. Enter new password: `NewPass456!`
5. Confirm new password: `NewPass456!`
6. Save changes

**Expected Result:**
- Success message
- Can log out and log in with new password
- Cannot log in with old password

---

### 5.5 Credit Purchase Journey

#### Test 5.5.1: View Credit Packages

**Manual Test Steps:**
1. Log in
2. Navigate to `/credits` or click "Buy Credits"

**Expected Result:**
- Credit packages displayed
- Each package shows: credits amount, price, "Buy Now" button
- Example: "100 Credits - Rp 50,000"

---

#### Test 5.5.2: Purchase Flow (Duitku Integration)

**Manual Test Steps:**
1. Navigate to credit purchase page
2. Select package: "100 Credits - Rp 50,000"
3. Click "Buy Now"
4. Verify redirect to Duitku payment page

**Expected Result:**
- Payment request created
- Redirects to Duitku payment gateway
- Payment URL is valid
- Merchant order ID generated

---

#### Test 5.5.3: Payment Success Handling

**Manual Test Steps:**
1. Complete payment on Duitku (or simulate callback)
2. Return to Lumiku platform

**Expected Result:**
- Credits added to account
- Credit balance updated in UI
- Transaction appears in credit history
- Success notification shown

---

### 5.6 Carousel Mix App Journey

#### Test 5.6.1: Create New Carousel Project

**Manual Test Steps:**
1. Navigate to `/apps/carousel-mix`
2. Click "New Project" or "Create Project"
3. Enter project name: "Test Carousel"
4. Enter description: "Testing carousel generation"
5. Click "Create"

**Expected Result:**
- Project created successfully
- Redirects to project editor: `/apps/carousel-mix/PROJECT_ID`
- Empty project with upload prompts

---

#### Test 5.6.2: Upload Slides to Positions

**Manual Test Steps:**
1. In carousel project editor
2. For Position 1, click "Upload Image"
3. Select image file
4. Wait for upload
5. Repeat for Positions 2, 3, 4

**Expected Result:**
- Images upload successfully
- Thumbnails visible in position slots
- Storage quota updated
- Can delete and re-upload

---

#### Test 5.6.3: Add Text Variations

**Manual Test Steps:**
1. In position 1, click "Add Text"
2. Enter text: "Amazing Product!"
3. Click "Add Variation"
4. Enter text: "Best Quality!"
5. Save

**Expected Result:**
- Text variations added
- Visible in text list for position
- Can edit and delete variations

---

#### Test 5.6.4: Style Text

**Manual Test Steps:**
1. Select position 1
2. Open text styling panel
3. Change font: "Inter"
4. Change size: 40px
5. Change color: White (#FFFFFF)
6. Change position: Center
7. Save styles

**Expected Result:**
- Styles applied to position settings
- Preview shows styled text
- Styles apply to all variations in position

---

#### Test 5.6.5: Generate Carousels

**Manual Test Steps:**
1. With 4 positions filled (slides + text)
2. Click "Generate" button
3. Select: 4 slides, 5 sets
4. Review credit cost: 10 credits
5. Confirm generation

**Expected Result:**
- Credit confirmation modal
- On confirm: Credits deducted
- Generation started
- Redirects to results/status page

---

#### Test 5.6.6: Monitor Generation Progress

**Manual Test Steps:**
1. View generation status page
2. Watch progress indicator

**Expected Result:**
- Status starts as "Pending" or "Processing"
- Progress bar or spinner shown
- Auto-refreshes every 5-10 seconds
- Eventually shows "Completed" status

---

#### Test 5.6.7: Download Generated Carousels

**Manual Test Steps:**
1. Once generation completed
2. Click "Download" button

**Expected Result:**
- ZIP file downloads
- Filename: `carousel_PROJECT_ID_GENERATION_ID.zip`
- ZIP contains PNG images
- Images have correct text overlays with styling

---

### 5.7 My Work Journey

#### Test 5.7.1: View All Projects

**Manual Test Steps:**
1. Navigate to `/my-work`
2. View project list

**Expected Result:**
- All user projects displayed across all apps
- Projects grouped by app type
- Each project shows: name, thumbnail, last modified date
- Can filter by app type

---

#### Test 5.7.2: Search Projects

**Manual Test Steps:**
1. On My Work page
2. Enter search term: "Test"
3. View filtered results

**Expected Result:**
- Only projects matching search shown
- Search covers project name and description

---

#### Test 5.7.3: Delete Project

**Manual Test Steps:**
1. Find project in list
2. Click delete icon or "Delete" button
3. Confirm deletion

**Expected Result:**
- Confirmation modal appears
- On confirm: Project deleted from database
- All related assets deleted
- Storage quota freed
- Project removed from list

---

### 5.8 Error Handling & Edge Cases

#### Test 5.8.1: Network Error Handling

**Manual Test Steps:**
1. Disconnect internet or stop backend
2. Try to perform action (e.g., create project)

**Expected Result:**
- Error message displayed
- User-friendly message: "Network error. Please check your connection."
- No app crash

---

#### Test 5.8.2: Unauthorized Access

**Manual Test Steps:**
1. Log out
2. Try to navigate directly to `/dashboard` or `/apps/carousel-mix`

**Expected Result:**
- Redirect to `/login`
- Error message: "Please log in to continue"

---

#### Test 5.8.3: Expired Session Handling

**Manual Test Steps:**
1. Log in
2. Wait for token expiration (or manually expire token)
3. Try to perform authenticated action

**Expected Result:**
- Error: "Session expired"
- Redirect to login page
- Can log in again successfully

---

## 6. Security & Performance Tests

### 6.1 Security Tests

#### Test 6.1.1: SQL Injection Prevention

**Test Steps:**
```bash
# Attempt SQL injection in login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com OR 1=1--",
    "password": "anything"
  }'
```

**Expected Result:**
- Status: `401 Unauthorized`
- No database breach
- Prisma ORM prevents SQL injection

---

#### Test 6.1.2: XSS Prevention

**Manual Test Steps:**
1. Create carousel project with name: `<script>alert('XSS')</script>`
2. View project in UI

**Expected Result:**
- Script tag rendered as text, not executed
- No alert box appears
- React escapes HTML by default

---

#### Test 6.1.3: CSRF Protection

**Test Steps:**
```bash
# Attempt CSRF without proper origin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://evil-site.com" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }'
```

**Expected Result:**
- CORS policy blocks request if CORS_ORIGIN doesn't match
- Status: `403 Forbidden` or CORS error

---

#### Test 6.1.4: File Upload Security

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

# Attempt to upload malicious file (PHP, EXE, etc.)
curl -X POST "http://localhost:3000/api/apps/carousel-mix/projects/PROJECT_ID/slides/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@malicious.php" \
  -F "slidePosition=1"
```

**Expected Result:**
- Status: `400 Bad Request`
- Error: "Invalid file type"
- Only allowed types: JPG, PNG, MP4

---

#### Test 6.1.5: JWT Secret Validation

**Test Steps:**
1. Set weak JWT_SECRET in .env: `JWT_SECRET="weak"`
2. Restart server

**Expected Result:**
- Server fails to start
- Error message: "JWT_SECRET must be at least 32 characters"
- Validation in `config/env.ts`

---

### 6.2 Performance Tests

#### Test 6.2.1: API Response Time

**Test Steps:**
```bash
# Test login endpoint response time
time curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }'
```

**Expected Result:**
- Response time < 500ms
- Consistent across multiple requests

---

#### Test 6.2.2: Database Query Performance

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

# Time complex query
time curl -X GET http://localhost:3000/api/credits/history \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Result:**
- Response time < 1 second
- Proper database indexes used
- No N+1 query problems

---

#### Test 6.2.3: Concurrent Request Handling

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

# Send 10 concurrent requests
for i in {1..10}; do
  curl -X GET http://localhost:3000/api/credits/balance \
    -H "Authorization: Bearer $TOKEN" &
done
wait
```

**Expected Result:**
- All requests succeed
- No timeout errors
- Responses consistent

---

#### Test 6.2.4: Large File Upload Performance

**Test Steps:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lumiku.com",
    "password": "password123"
  }' | jq -r '.data.token')

# Upload 20MB video
time curl -X POST "http://localhost:3000/api/apps/video-mixer/projects/PROJECT_ID/videos/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "video=@large-video-20mb.mp4"
```

**Expected Result:**
- Upload completes successfully
- Time proportional to file size and network speed
- No timeout (server timeout set appropriately)
- Storage quota updated correctly

---

#### Test 6.2.5: Memory Leak Check

**Manual Test Steps:**
1. Start backend server
2. Run load test with 1000 requests
3. Monitor memory usage with `top` or Task Manager

**Expected Result:**
- Memory usage stable
- No continuous memory growth
- Garbage collection working properly

---

## 7. Automated Test Execution

### 7.1 Backend API Test Script

Create file: `backend/tests/api-tests.sh`

```bash
#!/bin/bash

# Lumiku Backend API Test Suite
# Usage: bash backend/tests/api-tests.sh

BASE_URL="http://localhost:3000"
FAILED=0
PASSED=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=================================="
echo "  Lumiku API Test Suite"
echo "=================================="
echo ""

# Test function
test_endpoint() {
  local name="$1"
  local method="$2"
  local endpoint="$3"
  local data="$4"
  local expected_status="$5"
  local token="$6"

  echo -n "Testing: $name... "

  if [ "$method" == "POST" ]; then
    if [ -z "$token" ]; then
      response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" \
        -H "Content-Type: application/json" \
        -d "$data")
    else
      response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d "$data")
    fi
  else
    if [ -z "$token" ]; then
      response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL$endpoint")
    else
      response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL$endpoint" \
        -H "Authorization: Bearer $token")
    fi
  fi

  status=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)

  if [ "$status" == "$expected_status" ]; then
    echo -e "${GREEN}PASS${NC} (Status: $status)"
    ((PASSED++))
  else
    echo -e "${RED}FAIL${NC} (Expected: $expected_status, Got: $status)"
    echo "Response: $body"
    ((FAILED++))
  fi
}

# 1. Health Check
echo "=== Health Check Tests ==="
test_endpoint "Basic health check" "GET" "/health" "" "200"
test_endpoint "Database health check" "GET" "/api/health" "" "200"
echo ""

# 2. Authentication Tests
echo "=== Authentication Tests ==="

# Register new user
RANDOM_EMAIL="test_$(date +%s)@example.com"
test_endpoint "Register new user" "POST" "/api/auth/register" \
  "{\"email\":\"$RANDOM_EMAIL\",\"password\":\"TestPass123!\",\"name\":\"Test User\"}" "201"

# Login
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@lumiku.com","password":"password123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
  echo -e "${GREEN}✓${NC} Login successful, token obtained"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} Login failed, no token"
  ((FAILED++))
fi

test_endpoint "Login with wrong password" "POST" "/api/auth/login" \
  "{\"email\":\"test@lumiku.com\",\"password\":\"wrongpass\"}" "401"

test_endpoint "Get profile (authenticated)" "GET" "/api/auth/profile" "" "200" "$TOKEN"
test_endpoint "Get profile (no token)" "GET" "/api/auth/profile" "" "401"

echo ""

# 3. Credit System Tests
echo "=== Credit System Tests ==="
test_endpoint "Get credit balance" "GET" "/api/credits/balance" "" "200" "$TOKEN"
test_endpoint "Get credit history" "GET" "/api/credits/history" "" "200" "$TOKEN"
echo ""

# 4. Plugin Tests (basic)
echo "=== Plugin Tests ==="
test_endpoint "Get available apps" "GET" "/api/apps" "" "200" "$TOKEN"
echo ""

# Summary
echo "=================================="
echo "  Test Results"
echo "=================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "=================================="

if [ $FAILED -eq 0 ]; then
  exit 0
else
  exit 1
fi
```

**Usage:**
```bash
cd backend
bash tests/api-tests.sh
```

---

### 7.2 Frontend E2E Test Script (Playwright/Cypress)

Create file: `frontend/tests/e2e/auth.spec.ts` (Playwright example)

```typescript
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Authentication Flow', () => {

  test('should load landing page', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/Lumiku/);
    await expect(page.locator('text=Get Started')).toBeVisible();
  });

  test('should login successfully', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Fill login form
    await page.fill('input[type="email"]', 'test@lumiku.com');
    await page.fill('input[type="password"]', 'password123');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL(`${BASE_URL}/dashboard`);

    // Verify dashboard loaded
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    await page.fill('input[type="email"]', 'test@lumiku.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Error message should appear
    await expect(page.locator('text=/Invalid.*credentials/i')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'test@lumiku.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`);

    // Logout
    await page.click('button:has-text("Profile")'); // Profile dropdown
    await page.click('text=Logout');

    // Should redirect to landing or login
    await page.waitForURL(/\/(login)?$/);
  });

});
```

**Setup & Run:**
```bash
cd frontend
npm install -D @playwright/test
npx playwright install

# Run tests
npx playwright test
```

---

### 7.3 Load Testing Script (Artillery)

Create file: `tests/load/api-load-test.yml`

```yaml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"
  processor: "./processor.js"

scenarios:
  - name: "Login and browse"
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test@lumiku.com"
            password: "password123"
          capture:
            - json: "$.data.token"
              as: "token"
      - get:
          url: "/api/credits/balance"
          headers:
            Authorization: "Bearer {{ token }}"
      - get:
          url: "/api/apps"
          headers:
            Authorization: "Bearer {{ token }}"
```

**Run Load Test:**
```bash
npm install -g artillery
artillery run tests/load/api-load-test.yml
```

---

### 7.4 Continuous Integration Test Script

Create file: `.github/workflows/test.yml` (GitHub Actions)

```yaml
name: Lumiku Test Suite

on:
  push:
    branches: [ main, development ]
  pull_request:
    branches: [ main, development ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: lumiku
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: lumiku_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: |
          cd backend
          bun install

      - name: Run Prisma migrations
        env:
          DATABASE_URL: postgresql://lumiku:testpass@localhost:5432/lumiku_test
        run: |
          cd backend
          bun prisma:generate
          bun prisma migrate deploy

      - name: Start backend server
        env:
          DATABASE_URL: postgresql://lumiku:testpass@localhost:5432/lumiku_test
          JWT_SECRET: test_jwt_secret_minimum_32_characters_long
        run: |
          cd backend
          bun dev &
          sleep 10

      - name: Run API tests
        run: |
          cd backend
          bash tests/api-tests.sh

  frontend-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd frontend
          npm install

      - name: Run Playwright tests
        run: |
          cd frontend
          npx playwright install --with-deps
          npx playwright test
```

---

## 8. Test Reporting & Documentation

### 8.1 Test Coverage Report

Run all tests and generate coverage report:

```bash
# Backend coverage (if using test framework)
cd backend
bun test --coverage

# Frontend coverage
cd frontend
npm run test:coverage
```

---

### 8.2 Test Results Log Template

After running test suite, document results:

```markdown
# Test Execution Report

**Date:** 2025-10-14
**Tester:** QA Team
**Environment:** Development
**Backend Version:** 1.0.0
**Frontend Version:** 1.0.0

## Summary

- Total Tests: 85
- Passed: 82
- Failed: 3
- Skipped: 0
- Success Rate: 96.5%

## Failed Tests

1. **Test 2.3.3: Concurrent Credit Deduction**
   - Status: FAILED
   - Error: Race condition detected
   - Action: Add database transaction locking

2. **Test 3.1.8: Download Generated Carousel**
   - Status: FAILED
   - Error: File not found
   - Action: Verify worker completion status

3. **Test 6.2.4: Large File Upload**
   - Status: FAILED
   - Error: Timeout after 30s
   - Action: Increase upload timeout

## Notes

- All authentication tests passed
- Credit system working correctly
- Minor issues with async operations
```

---

## 9. Troubleshooting Common Test Failures

### Issue: "Database connection failed"

**Solution:**
```bash
# Check if PostgreSQL is running
# Windows:
sc query postgresql

# Start PostgreSQL
# Update DATABASE_URL in .env
# Run migrations again
cd backend
bun prisma migrate deploy
```

---

### Issue: "JWT token expired"

**Solution:**
```bash
# Re-login to get fresh token
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@lumiku.com","password":"password123"}' | jq -r '.data.token')
```

---

### Issue: "CORS error in browser"

**Solution:**
- Check `CORS_ORIGIN` in `backend/.env`
- Should match frontend URL: `http://localhost:5173`
- Restart backend after changing

---

### Issue: "Redis connection failed"

**Solution:**
```bash
# Check if Redis is running
redis-cli ping

# If not, start Redis (or disable in .env)
# For development without Redis:
# Background jobs run synchronously
```

---

## 10. Maintenance & Updates

### Update Test Credentials

If test user credentials change, update in:
- This document (section 1)
- Seed script: `backend/prisma/seed.ts`
- Test scripts: `backend/tests/api-tests.sh`
- E2E tests: `frontend/tests/e2e/auth.spec.ts`

---

### Add New Plugin Tests

When adding new plugin, create section in "3. Plugin Functionality Tests":

```markdown
### 3.X New Plugin Name

#### Test 3.X.1: Create Project
...

#### Test 3.X.2: Core Functionality
...
```

---

## Appendix A: Test Data

### Sample Images for Upload

```bash
# Create test images (ImageMagick)
convert -size 800x600 xc:blue test-slide-1.png
convert -size 800x600 xc:red test-slide-2.png
convert -size 800x600 xc:green test-slide-3.png
convert -size 800x600 xc:yellow test-slide-4.png
```

---

### Sample Video for Upload

```bash
# Create test video (FFmpeg)
ffmpeg -f lavfi -i testsrc=duration=10:size=1280x720:rate=30 \
  -pix_fmt yuv420p test-video.mp4
```

---

## Appendix B: Quick Reference

### Common cURL Commands

```bash
# Save token to variable
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@lumiku.com","password":"password123"}' | jq -r '.data.token')

# Use token in subsequent requests
curl -X GET http://localhost:3000/api/credits/balance \
  -H "Authorization: Bearer $TOKEN"

# Pretty print JSON response
curl -X GET http://localhost:3000/api/apps \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

---

### Required Tools

- **cURL** - API testing
- **jq** - JSON parsing
- **Postman** (optional) - API testing GUI
- **Playwright/Cypress** - E2E testing
- **Artillery** - Load testing
- **FFmpeg** - Video processing
- **ImageMagick** - Image generation

---

## Conclusion

This comprehensive test checklist covers all critical paths and edge cases for the Lumiku platform. Execute tests regularly:

- **Before deployment** - Full test suite
- **After major changes** - Affected areas + regression tests
- **Weekly** - Smoke tests
- **Monthly** - Full security audit

For questions or issues, contact the development team.

---

**Document Version:** 1.0.0
**Last Updated:** 2025-10-14
**Next Review:** 2025-11-14
