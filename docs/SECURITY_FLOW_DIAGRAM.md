# Avatar Creator Security Flow Diagram

## Request Flow with Security Layers

```
┌─────────────────────────────────────────────────────────────────────┐
│                         User Request                                 │
│  POST /projects/123/avatars/generate                                │
│  POST /projects/123/avatars/upload                                  │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    LAYER 1: Authentication                           │
│                   (authMiddleware)                                   │
│                                                                      │
│  ✓ Verify JWT token                                                │
│  ✓ Extract userId                                                  │
│  ✓ Set context: c.set('userId', userId)                           │
│                                                                      │
│  ❌ Invalid token → 401 Unauthorized                                │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    LAYER 2: Rate Limiting                            │
│         (avatarGenerationLimiter / avatarUploadLimiter)             │
│                                                                      │
│  1. Generate key: rl:avatar-creator:generate:user:<userId>          │
│  2. Check Redis: current_count = redis.get(key)                     │
│  3. Increment counter: redis.incr(key)                              │
│  4. Compare: if current_count > max_limit                           │
│                                                                      │
│  ✓ Within limit → Continue                                          │
│  ❌ Exceeded limit → 429 Too Many Requests                          │
│                                                                      │
│  Response Headers:                                                   │
│    X-RateLimit-Limit: 5                                            │
│    X-RateLimit-Remaining: 3                                        │
│    X-RateLimit-Reset: 1730726400                                   │
│    Retry-After: 60                                                 │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
                    [IF UPLOAD]
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                LAYER 3: File Upload Security                         │
│                    (validateImageFile)                               │
│                                                                      │
│  STEP 1: Size Validation                                            │
│  ┌──────────────────────────────────────┐                          │
│  │ file.size > 10MB?                     │                          │
│  │ ❌ Yes → 400 "File too large"         │                          │
│  │ ✓ No → Continue                       │                          │
│  └──────────────────────────────────────┘                          │
│                                                                      │
│  STEP 2: Magic Byte Validation (CRITICAL)                          │
│  ┌──────────────────────────────────────┐                          │
│  │ Read actual file bytes               │                          │
│  │ fileTypeFromBuffer(buffer)           │                          │
│  │                                       │                          │
│  │ Detected: image/jpeg  ✓              │                          │
│  │ Detected: text/plain  ❌              │                          │
│  │ Detected: application/x-php  ❌       │                          │
│  └──────────────────────────────────────┘                          │
│                                                                      │
│  STEP 3: Extension Validation                                       │
│  ┌──────────────────────────────────────┐                          │
│  │ Extension in [.jpg, .png, .webp]?    │                          │
│  │ ❌ .php → 400 "Invalid extension"     │                          │
│  │ ✓ .jpg → Continue                     │                          │
│  └──────────────────────────────────────┘                          │
│                                                                      │
│  STEP 4: Cross-Validation                                           │
│  ┌──────────────────────────────────────┐                          │
│  │ Extension matches detected type?      │                          │
│  │ ❌ .jpg + image/png → 400 "Mismatch"  │                          │
│  │ ✓ .jpg + image/jpeg → Continue        │                          │
│  └──────────────────────────────────────┘                          │
│                                                                      │
│  STEP 5: Dimension Validation                                       │
│  ┌──────────────────────────────────────┐                          │
│  │ 256 ≤ width,height ≤ 4096?           │                          │
│  │ ❌ 100x100 → 400 "Too small"          │                          │
│  │ ❌ 5000x5000 → 400 "Too large"        │                          │
│  │ ✓ 1024x1024 → Continue                │                          │
│  └──────────────────────────────────────┘                          │
│                                                                      │
│  STEP 6: Filename Sanitization                                      │
│  ┌──────────────────────────────────────┐                          │
│  │ Input: "../../etc/passwd.jpg"         │                          │
│  │ Sanitize: path.basename()             │                          │
│  │ Replace: /[^a-zA-Z0-9._-]/g           │                          │
│  │ Output: "___etc_passwd.jpg"           │                          │
│  │                                       │                          │
│  │ Generate secure name:                 │                          │
│  │ "avatar_1730726400_k7f3x9c2.jpg"     │                          │
│  └──────────────────────────────────────┘                          │
│                                                                      │
│  ✓ All checks passed → Return validated file                        │
│  ❌ Any check failed → 400 with specific error                      │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    LAYER 4: Business Logic                           │
│                  (avatarCreatorService)                              │
│                                                                      │
│  FOR GENERATION:                                                     │
│  1. Verify project ownership                                         │
│  2. Create generation record                                         │
│  3. Queue background job (BullMQ)                                   │
│  4. Return generation ID                                             │
│                                                                      │
│  FOR UPLOAD:                                                         │
│  1. Verify project ownership                                         │
│  2. Use validated.buffer (not original file)                        │
│  3. Save with secure filename                                        │
│  4. Generate thumbnail                                               │
│  5. Create avatar record                                             │
│                                                                      │
│  ✓ Success → Return avatar/generation                                │
│  ❌ Error → Proper error handling                                    │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Response                                     │
│                                                                      │
│  SUCCESS (200 OK):                                                   │
│  {                                                                   │
│    "message": "Avatar uploaded successfully",                        │
│    "avatar": {                                                       │
│      "id": "avatar_123",                                            │
│      "baseImageUrl": "/uploads/avatar-creator/user_123/avatar_..."  │
│    }                                                                 │
│  }                                                                   │
│                                                                      │
│  RATE LIMITED (429):                                                 │
│  {                                                                   │
│    "error": "Rate limit exceeded",                                   │
│    "message": "Too many requests...",                                │
│    "retryAfter": 60                                                  │
│  }                                                                   │
│                                                                      │
│  FILE REJECTED (400):                                                │
│  {                                                                   │
│    "error": "Invalid image format. Only JPEG, PNG, WebP allowed"    │
│  }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

## Security Monitoring Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Security Event Occurs                           │
└────────────────────────┬────────────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌─────────────────────┐         ┌─────────────────────┐
│  Rate Limit         │         │  File Security      │
│  Violation          │         │  Violation          │
└──────┬──────────────┘         └──────┬──────────────┘
       │                               │
       ▼                               ▼
┌─────────────────────┐         ┌─────────────────────┐
│ logRateLimitViolation│        │logSecurityViolation │
│                      │         │                     │
│ Logs:                │         │ Logs:               │
│ - IP address         │         │ - Violation type    │
│ - Endpoint           │         │ - User ID           │
│ - Attempt count      │         │ - File details      │
│ - Max allowed        │         │ - Detection method  │
└──────┬──────────────┘         └──────┬──────────────┘
       │                               │
       └───────────────┬───────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Console / Log File                                │
│                                                                      │
│  [RATE_LIMIT_VIOLATION] 2025-01-15T10:30:00Z                       │
│  IP: 192.168.1.100                                                  │
│  Endpoint: /avatars/generate                                        │
│  Attempts: 6/5                                                      │
│                                                                      │
│  [FILE_SECURITY_VIOLATION] 2025-01-15T10:31:00Z                    │
│  Type: MIME_TYPE_SPOOFING                                           │
│  UserId: user_123                                                   │
│  Detected: application/x-php                                        │
│  Expected: image/jpeg                                               │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│            Monitoring Dashboard / Alert System                       │
│                      (Future: Sentry)                                │
└─────────────────────────────────────────────────────────────────────┘
```

## Attack Prevention Examples

### Example 1: MIME Spoofing Attack (BLOCKED)

```
Attacker Action:
┌────────────────────────────────────┐
│ 1. Create malicious.php:           │
│    <?php system($_GET['cmd']); ?>  │
│                                     │
│ 2. Rename to image.jpg             │
│                                     │
│ 3. Upload via API                   │
└────────────────┬───────────────────┘
                 │
                 ▼
System Response:
┌────────────────────────────────────┐
│ validateImageFile():                │
│                                     │
│ 1. Read file bytes                  │
│    First bytes: <?php              │
│                                     │
│ 2. fileTypeFromBuffer()            │
│    Detected: text/plain            │
│                                     │
│ 3. Compare with allowed:           │
│    text/plain NOT IN               │
│    [image/jpeg, image/png]         │
│                                     │
│ 4. REJECT: 400 Bad Request         │
│    "Invalid image format"          │
│                                     │
│ 5. Log security violation          │
└────────────────────────────────────┘
Result: ❌ Attack BLOCKED
```

### Example 2: Path Traversal Attack (SANITIZED)

```
Attacker Action:
┌────────────────────────────────────┐
│ Upload valid image with filename:   │
│ "../../etc/passwd.jpg"              │
└────────────────┬───────────────────┘
                 │
                 ▼
System Response:
┌────────────────────────────────────┐
│ sanitizeFilename():                 │
│                                     │
│ 1. Input: "../../etc/passwd.jpg"   │
│                                     │
│ 2. path.basename()                 │
│    Result: "passwd.jpg"            │
│                                     │
│ 3. Replace unsafe chars             │
│    Result: "passwd.jpg"            │
│                                     │
│ generateSecureFilename():          │
│                                     │
│ 4. Generate random name:           │
│    "avatar_1730726400_k7f3x9c.jpg" │
│                                     │
│ 5. Save to:                        │
│    uploads/avatar-creator/         │
│    user_123/                       │
│    avatar_1730726400_k7f3x9c.jpg   │
└────────────────────────────────────┘
Result: ✓ File saved safely
        ❌ Path traversal PREVENTED
```

### Example 3: Rate Limit Spam (BLOCKED)

```
Attacker Action:
┌────────────────────────────────────┐
│ Send 10 generation requests        │
│ in rapid succession                 │
│ (trying to rack up API costs)      │
└────────────────┬───────────────────┘
                 │
                 ▼
System Response:
┌────────────────────────────────────┐
│ Request 1: ✓ 200 OK (count: 1)    │
│ Request 2: ✓ 200 OK (count: 2)    │
│ Request 3: ✓ 200 OK (count: 3)    │
│ Request 4: ✓ 200 OK (count: 4)    │
│ Request 5: ✓ 200 OK (count: 5)    │
│                                     │
│ Request 6: ❌ 429 Rate Limited     │
│ Request 7: ❌ 429 Rate Limited     │
│ Request 8: ❌ 429 Rate Limited     │
│ Request 9: ❌ 429 Rate Limited     │
│ Request 10: ❌ 429 Rate Limited    │
│                                     │
│ Log violation:                     │
│ [RATE_LIMIT_VIOLATION]             │
│ User: user_123                     │
│ Endpoint: /avatars/generate        │
│ Attempts: 10/5                     │
│                                     │
│ Wait 60 seconds...                 │
│ Counter resets                     │
│ User can make 5 more requests      │
└────────────────────────────────────┘
Result: ✓ 5 requests processed
        ❌ 5 requests blocked
        Cost exposure: LIMITED
```

## Redis Rate Limit Storage

```
Redis Keys Structure:
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  Key Pattern:                                               │
│  rl:<app>:<endpoint>:user:<userId>                         │
│                                                              │
│  Examples:                                                   │
│  rl:avatar-creator:generate:user:user_123  →  5            │
│  rl:avatar-creator:upload:user:user_123    →  3            │
│  rl:avatar-creator:preset:user:user_456    →  2            │
│                                                              │
│  TTL: Automatically expires after window (60 seconds)       │
│                                                              │
│  Operations:                                                 │
│  1. INCR key          → Increment counter                   │
│  2. EXPIRE key TTL    → Set expiration                      │
│  3. GET key           → Check current count                 │
│  4. DEL key           → Manual reset (admin)                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## File Storage Structure

```
File System Layout:
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  uploads/                                                    │
│  └── avatar-creator/                                        │
│      ├── user_123/                                          │
│      │   ├── avatar_1730726400_k7f3x9c2.jpg  (original)    │
│      │   ├── avatar_1730726400_k7f3x9c2_thumb.jpg          │
│      │   ├── avatar_1730726405_m9d2k5n8.png               │
│      │   └── avatar_1730726405_m9d2k5n8_thumb.png         │
│      │                                                      │
│      └── user_456/                                          │
│          ├── avatar_1730726410_p3h8r1t4.jpg               │
│          └── avatar_1730726410_p3h8r1t4_thumb.jpg         │
│                                                              │
│  Security Features:                                          │
│  ✓ User isolation (separate directories)                   │
│  ✓ Random filenames (no collisions)                        │
│  ✓ No user-provided names in filesystem                    │
│  ✓ No path traversal possible                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Legend

```
✓  = Success / Allowed
❌ = Blocked / Rejected
→  = Flow direction
┌─┐ = Component/Step
│  │
└─┘
```

This diagram shows the complete security flow from request to response, including all validation layers and attack prevention mechanisms.
