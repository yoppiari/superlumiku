# JWT Security System - Testing Guide

This guide provides comprehensive testing procedures for the JWT secret management system.

---

## Overview

Testing the JWT security system involves:
1. Unit tests for validation logic
2. Integration tests for authentication flow
3. Security tests for vulnerability checks
4. Manual testing procedures
5. Production validation tests

---

## Unit Tests

### Setup

```typescript
// tests/jwt-secret-validator.test.ts
import { describe, test, expect } from 'bun:test'
import {
  validateJwtSecret,
  createValidatorConfig,
  generateSecureSecret,
  JWT_SECRET_CONSTANTS,
} from '../src/config/jwt-secret-validator'
import { randomBytes } from 'crypto'
```

### Test Suite 1: Secret Validation

```typescript
describe('JWT Secret Validation', () => {
  describe('Production Environment', () => {
    test('should reject missing secret', () => {
      expect(() => validateJwtSecret({
        environment: 'production',
        secret: undefined,
        minLength: 32,
        minEntropy: 3.5,
        allowInsecureInDev: false,
        allowGeneration: false,
      })).toThrow('JWT_SECRET environment variable is not set')
    })

    test('should reject empty secret', () => {
      expect(() => validateJwtSecret({
        environment: 'production',
        secret: '',
        minLength: 32,
        minEntropy: 3.5,
        allowInsecureInDev: false,
        allowGeneration: false,
      })).toThrow('JWT_SECRET environment variable is not set')
    })

    test('should reject short secret', () => {
      expect(() => validateJwtSecret({
        environment: 'production',
        secret: 'short',
        minLength: 32,
        minEntropy: 3.5,
        allowInsecureInDev: false,
        allowGeneration: false,
      })).toThrow('too short')
    })

    test('should reject blacklisted secret', () => {
      expect(() => validateJwtSecret({
        environment: 'production',
        secret: 'change-this-secret-key',
        minLength: 32,
        minEntropy: 3.5,
        allowInsecureInDev: false,
        allowGeneration: false,
      })).toThrow('known weak or default value')
    })

    test('should reject low entropy secret', () => {
      expect(() => validateJwtSecret({
        environment: 'production',
        secret: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', // 34 chars but no entropy
        minLength: 32,
        minEntropy: 3.5,
        allowInsecureInDev: false,
        allowGeneration: false,
      })).toThrow('insufficient entropy')
    })

    test('should accept strong secret', () => {
      const secret = randomBytes(32).toString('hex')
      const result = validateJwtSecret({
        environment: 'production',
        secret,
        minLength: 32,
        minEntropy: 3.5,
        allowInsecureInDev: false,
        allowGeneration: false,
      })

      expect(result.isSecure).toBe(true)
      expect(result.warnings).toHaveLength(0)
      expect(result.metadata.source).toBe('env')
      expect(result.metadata.length).toBe(64)
    })
  })

  describe('Development Environment', () => {
    test('should auto-generate secret when missing', () => {
      const result = validateJwtSecret({
        environment: 'development',
        secret: undefined,
        minLength: 16,
        minEntropy: 3.5,
        allowInsecureInDev: true,
        allowGeneration: true,
      })

      expect(result.secret).toBeDefined()
      expect(result.secret.length).toBeGreaterThanOrEqual(64)
      expect(result.metadata.source).toBe('generated')
      expect(result.warnings.length).toBeGreaterThan(0)
    })

    test('should warn on weak secret but continue', () => {
      const result = validateJwtSecret({
        environment: 'development',
        secret: 'weak-dev-secret',
        minLength: 16,
        minEntropy: 3.5,
        allowInsecureInDev: true,
        allowGeneration: true,
      })

      expect(result.secret).toBe('weak-dev-secret')
      expect(result.isSecure).toBe(false)
      expect(result.warnings.length).toBeGreaterThan(0)
    })

    test('should accept strong secret without warnings', () => {
      const secret = randomBytes(32).toString('hex')
      const result = validateJwtSecret({
        environment: 'development',
        secret,
        minLength: 16,
        minEntropy: 3.5,
        allowInsecureInDev: true,
        allowGeneration: true,
      })

      expect(result.isSecure).toBe(true)
      expect(result.warnings).toHaveLength(0)
    })
  })

  describe('Test Environment', () => {
    test('should behave like development', () => {
      const result = validateJwtSecret({
        environment: 'test',
        secret: undefined,
        minLength: 16,
        minEntropy: 3.5,
        allowInsecureInDev: true,
        allowGeneration: true,
      })

      expect(result.metadata.source).toBe('generated')
      expect(result.warnings.length).toBeGreaterThan(0)
    })
  })
})
```

### Test Suite 2: Entropy Calculation

```typescript
describe('Entropy Calculation', () => {
  // Import the function or expose it for testing
  // For now, test via validation results

  test('should detect zero entropy (repeating characters)', () => {
    expect(() => validateJwtSecret({
      environment: 'production',
      secret: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      minLength: 32,
      minEntropy: 3.5,
      allowInsecureInDev: false,
      allowGeneration: false,
    })).toThrow('insufficient entropy')
  })

  test('should detect low entropy (dictionary word)', () => {
    expect(() => validateJwtSecret({
      environment: 'production',
      secret: 'passwordpasswordpasswordpassword',
      minLength: 32,
      minEntropy: 3.5,
      allowInsecureInDev: false,
      allowGeneration: false,
    })).toThrow()
  })

  test('should accept high entropy (random hex)', () => {
    const secret = randomBytes(32).toString('hex')
    const result = validateJwtSecret({
      environment: 'production',
      secret,
      minLength: 32,
      minEntropy: 3.5,
      allowInsecureInDev: false,
      allowGeneration: false,
    })

    expect(result.metadata.entropy).toBeGreaterThanOrEqual(3.5)
  })
})
```

### Test Suite 3: Secret Generation

```typescript
describe('Secret Generation', () => {
  test('should generate 64-character hex string', () => {
    const secret = generateSecureSecret(32)
    expect(secret).toHaveLength(64)
    expect(secret).toMatch(/^[0-9a-f]+$/)
  })

  test('should generate different secrets each time', () => {
    const secret1 = generateSecureSecret(32)
    const secret2 = generateSecureSecret(32)
    expect(secret1).not.toBe(secret2)
  })

  test('should generate high entropy secrets', () => {
    const secret = generateSecureSecret(32)
    const result = validateJwtSecret({
      environment: 'production',
      secret,
      minLength: 32,
      minEntropy: 3.5,
      allowInsecureInDev: false,
      allowGeneration: false,
    })

    expect(result.metadata.entropy).toBeGreaterThanOrEqual(3.5)
  })
})
```

### Test Suite 4: Configuration Creation

```typescript
describe('Configuration Creation', () => {
  test('should create production config', () => {
    const config = createValidatorConfig('production', 'test-secret')

    expect(config.environment).toBe('production')
    expect(config.minLength).toBe(32)
    expect(config.allowInsecureInDev).toBe(false)
    expect(config.allowGeneration).toBe(false)
  })

  test('should create development config', () => {
    const config = createValidatorConfig('development', 'test-secret')

    expect(config.environment).toBe('development')
    expect(config.minLength).toBe(16)
    expect(config.allowInsecureInDev).toBe(true)
    expect(config.allowGeneration).toBe(true)
  })

  test('should normalize environment strings', () => {
    expect(createValidatorConfig('prod').environment).toBe('production')
    expect(createValidatorConfig('PRODUCTION').environment).toBe('production')
    expect(createValidatorConfig('dev').environment).toBe('development')
    expect(createValidatorConfig('testing').environment).toBe('test')
  })
})
```

---

## Integration Tests

### Setup

```typescript
// tests/jwt-auth.test.ts
import { describe, test, expect, beforeAll } from 'bun:test'
import { signToken, verifyToken } from '../src/lib/jwt'
import jwt from 'jsonwebtoken'
import { randomBytes } from 'crypto'
```

### Test Suite 1: Token Signing and Verification

```typescript
describe('JWT Authentication Flow', () => {
  test('should sign and verify valid token', () => {
    const payload = { userId: 'test-123', email: 'test@example.com' }
    const token = signToken(payload)

    expect(token).toBeDefined()
    expect(typeof token).toBe('string')

    const verified = verifyToken(token)
    expect(verified.userId).toBe('test-123')
    expect(verified.email).toBe('test@example.com')
  })

  test('should include expiration in token', () => {
    const payload = { userId: 'test-123', email: 'test@example.com' }
    const token = signToken(payload)

    const decoded = jwt.decode(token) as any
    expect(decoded.exp).toBeDefined()
    expect(decoded.exp).toBeGreaterThan(Date.now() / 1000)
  })

  test('should reject expired token', () => {
    // Create token that expires immediately
    const payload = { userId: 'test-123', email: 'test@example.com' }
    const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '0s' })

    // Wait a bit to ensure expiration
    setTimeout(() => {
      expect(() => verifyToken(token)).toThrow('Invalid or expired token')
    }, 100)
  })

  test('should reject token signed with wrong secret', () => {
    const payload = { userId: 'fake', email: 'fake@example.com' }
    const fakeSecret = randomBytes(32).toString('hex')
    const fakeToken = jwt.sign(payload, fakeSecret)

    expect(() => verifyToken(fakeToken)).toThrow('Invalid or expired token')
  })

  test('should reject malformed token', () => {
    expect(() => verifyToken('not-a-valid-token')).toThrow()
    expect(() => verifyToken('header.payload.signature')).toThrow()
    expect(() => verifyToken('')).toThrow()
  })
})
```

### Test Suite 2: Token Payload

```typescript
describe('JWT Payload', () => {
  test('should preserve payload data', () => {
    const payload = {
      userId: 'user-456',
      email: 'user@example.com',
    }

    const token = signToken(payload)
    const verified = verifyToken(token)

    expect(verified.userId).toBe(payload.userId)
    expect(verified.email).toBe(payload.email)
  })

  test('should not include sensitive data in payload', () => {
    const payload = { userId: 'test', email: 'test@test.com' }
    const token = signToken(payload)
    const decoded = jwt.decode(token) as any

    // JWT payload is base64 encoded, not encrypted
    // Should not contain sensitive data like passwords
    expect(decoded.password).toBeUndefined()
  })
})
```

---

## Security Tests

### Test Suite 1: Secret Exposure Prevention

```typescript
describe('Security - Secret Exposure', () => {
  test('should not expose secret in error messages', () => {
    const weakSecret = 'test123'

    try {
      validateJwtSecret({
        environment: 'production',
        secret: weakSecret,
        minLength: 32,
        minEntropy: 3.5,
        allowInsecureInDev: false,
        allowGeneration: false,
      })
    } catch (error: any) {
      expect(error.message).not.toContain(weakSecret)
    }
  })

  test('should not expose secret in logs', () => {
    // This would require mocking console.log
    // Manual verification: check that logJwtSecretStatus
    // never logs the actual secret value
  })

  test('should provide safe metadata only', () => {
    const secret = randomBytes(32).toString('hex')
    const result = validateJwtSecret({
      environment: 'production',
      secret,
      minLength: 32,
      minEntropy: 3.5,
      allowInsecureInDev: false,
      allowGeneration: false,
    })

    // Metadata should not contain the actual secret
    expect(result.metadata).not.toHaveProperty('secret')
    expect(JSON.stringify(result.metadata)).not.toContain(secret)
  })
})
```

### Test Suite 2: Brute Force Resistance

```typescript
describe('Security - Brute Force Resistance', () => {
  test('should generate secrets with high complexity', () => {
    const iterations = 100
    const secrets = new Set()

    for (let i = 0; i < iterations; i++) {
      const secret = generateSecureSecret(32)
      secrets.add(secret)

      // Check uniqueness
      expect(secrets.size).toBe(i + 1)

      // Check length
      expect(secret.length).toBe(64)

      // Check character variety (hex should use 0-9, a-f)
      expect(secret).toMatch(/^[0-9a-f]+$/)
    }
  })

  test('should have sufficient entropy to resist brute force', () => {
    const secret = generateSecureSecret(32)
    const result = validateJwtSecret({
      environment: 'production',
      secret,
      minLength: 32,
      minEntropy: 3.5,
      allowInsecureInDev: false,
      allowGeneration: false,
    })

    // High entropy makes brute force infeasible
    expect(result.metadata.entropy).toBeGreaterThanOrEqual(3.5)
    expect(result.metadata.length).toBeGreaterThanOrEqual(64)
  })
})
```

### Test Suite 3: Blacklist Effectiveness

```typescript
describe('Security - Blacklist', () => {
  const blacklistedSecrets = [
    'change-this-secret-key',
    'your-secret-key-here',
    'secret',
    'jwt-secret',
    'password',
    'admin',
    '12345678',
  ]

  blacklistedSecrets.forEach(weakSecret => {
    test(`should reject blacklisted secret: ${weakSecret}`, () => {
      expect(() => validateJwtSecret({
        environment: 'production',
        secret: weakSecret,
        minLength: 32,
        minEntropy: 3.5,
        allowInsecureInDev: false,
        allowGeneration: false,
      })).toThrow()
    })
  })

  test('should reject secrets containing blacklisted terms', () => {
    expect(() => validateJwtSecret({
      environment: 'production',
      secret: 'my-secret-key-for-production-use',
      minLength: 32,
      minEntropy: 3.5,
      allowInsecureInDev: false,
      allowGeneration: false,
    })).toThrow()
  })
})
```

---

## Manual Testing Procedures

### Test 1: Development Startup Without Secret

**Steps**:
```bash
cd backend
# Remove JWT_SECRET from .env or unset it
unset JWT_SECRET
bun run dev
```

**Expected Result**:
- Application starts successfully
- Console shows auto-generated secret warning
- Console shows temporary secret message
- Status shows ✅ SECURE or ⚠️ WEAK

### Test 2: Production Startup Without Secret

**Steps**:
```bash
cd backend
unset JWT_SECRET
NODE_ENV=production bun run start
```

**Expected Result**:
- Application fails to start
- Error message: "CRITICAL SECURITY ERROR: JWT_SECRET environment variable is not set"
- Instructions on how to fix
- Process exits with code 1

### Test 3: Production Startup With Weak Secret

**Steps**:
```bash
cd backend
JWT_SECRET="weak" NODE_ENV=production bun run start
```

**Expected Result**:
- Application fails to start
- Error message about secret being too short
- Instructions on generating secure secret
- Process exits with code 1

### Test 4: Production Startup With Strong Secret

**Steps**:
```bash
cd backend
JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" NODE_ENV=production bun run start
```

**Expected Result**:
- Application starts successfully
- Console shows JWT configuration
- Status: ✅ SECURE
- No warnings
- Application runs normally

### Test 5: Authentication Flow

**Steps**:
```bash
# 1. Start server
bun run dev

# 2. Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# 3. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# 4. Use token from response
curl -H "Authorization: Bearer TOKEN_HERE" \
  http://localhost:3000/api/user/profile
```

**Expected Result**:
- Register returns success
- Login returns JWT token
- Profile request with token returns user data
- Profile request without token returns 401

### Test 6: Token Forgery Attempt

**Steps**:
```bash
# Create fake token with wrong secret
node -e "
const jwt = require('jsonwebtoken');
const fakeToken = jwt.sign(
  { userId: 'admin', email: 'admin@test.com' },
  'wrong-secret'
);
console.log(fakeToken);
"

# Try to use fake token
curl -H "Authorization: Bearer FAKE_TOKEN_HERE" \
  http://localhost:3000/api/user/profile
```

**Expected Result**:
- Request returns 401 Unauthorized
- Error message: "Invalid or expired token"
- Access denied

---

## Load Testing

### Test 1: Token Generation Performance

```typescript
describe('Performance - Token Generation', () => {
  test('should generate tokens quickly', () => {
    const iterations = 1000
    const start = Date.now()

    for (let i = 0; i < iterations; i++) {
      signToken({ userId: `user-${i}`, email: `user${i}@test.com` })
    }

    const duration = Date.now() - start
    const avgTime = duration / iterations

    // Should generate 1000 tokens in reasonable time
    expect(duration).toBeLessThan(1000) // 1 second for 1000 tokens
    console.log(`Average token generation time: ${avgTime.toFixed(2)}ms`)
  })
})
```

### Test 2: Token Verification Performance

```typescript
describe('Performance - Token Verification', () => {
  test('should verify tokens quickly', () => {
    // Pre-generate tokens
    const tokens = Array.from({ length: 1000 }, (_, i) =>
      signToken({ userId: `user-${i}`, email: `user${i}@test.com` })
    )

    const start = Date.now()

    for (const token of tokens) {
      verifyToken(token)
    }

    const duration = Date.now() - start
    const avgTime = duration / tokens.length

    expect(duration).toBeLessThan(2000) // 2 seconds for 1000 verifications
    console.log(`Average token verification time: ${avgTime.toFixed(2)}ms`)
  })
})
```

---

## Production Validation Tests

### Test 1: Health Check

```bash
# Check application health
curl http://your-app.com/api/health

# Should return JWT metadata (not the secret)
{
  "status": "healthy",
  "jwt": {
    "isConfigured": true,
    "isSecure": true,
    "source": "env",
    "environment": "production",
    "length": 64,
    "entropy": 4.0
  }
}
```

### Test 2: Authentication Endpoint

```bash
# Test login
curl -X POST https://your-app.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Should return JWT token
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

### Test 3: Protected Endpoint

```bash
# Test with valid token
curl -H "Authorization: Bearer VALID_TOKEN" \
  https://your-app.com/api/user/profile

# Should return user data

# Test without token
curl https://your-app.com/api/user/profile

# Should return 401 Unauthorized
```

---

## Continuous Integration Tests

### GitHub Actions Example

```yaml
# .github/workflows/jwt-tests.yml
name: JWT Security Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: cd backend && bun install

      - name: Run JWT validation tests
        run: cd backend && bun test tests/jwt-secret-validator.test.ts

      - name: Run JWT auth tests
        run: cd backend && bun test tests/jwt-auth.test.ts
        env:
          JWT_SECRET: ${{ secrets.TEST_JWT_SECRET }}

      - name: Test production startup (should fail without secret)
        run: |
          cd backend
          ! NODE_ENV=production bun run start
        # ! inverts exit code - we expect this to fail
```

---

## Test Coverage Goals

| Component | Target Coverage | Priority |
|-----------|----------------|----------|
| jwt-secret-validator.ts | 95%+ | HIGH |
| env.ts | 90%+ | HIGH |
| jwt.ts | 90%+ | HIGH |
| Authentication routes | 85%+ | MEDIUM |

---

## Running All Tests

```bash
# Run all tests
cd backend
bun test

# Run specific test file
bun test tests/jwt-secret-validator.test.ts

# Run with coverage
bun test --coverage

# Run in watch mode
bun test --watch
```

---

## Test Documentation Checklist

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All security tests pass
- [ ] Manual testing completed
- [ ] Load testing completed
- [ ] Production validation passed
- [ ] Test coverage meets goals
- [ ] CI/CD pipeline configured
- [ ] Test documentation up to date

---

## Next Steps

1. Implement these test suites
2. Run tests locally
3. Set up CI/CD pipeline
4. Achieve target coverage
5. Document any failures
6. Regular security audits

---

For questions about testing, see:
- Implementation: `src/config/jwt-secret-validator.ts`
- Documentation: `docs/JWT_SECRET_SETUP.md`
- Security Analysis: `docs/JWT_SECURITY_ANALYSIS.md`
