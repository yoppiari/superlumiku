# Payment Security Documentation

## Overview

This document describes the comprehensive security measures implemented for the Superlumiku payment callback system. The system processes payment notifications from Duitku payment gateway and must be protected against fraud, replay attacks, and other security threats.

## Table of Contents

- [Security Architecture](#security-architecture)
- [Threat Model](#threat-model)
- [Security Layers](#security-layers)
- [Implementation Details](#implementation-details)
- [Configuration](#configuration)
- [Monitoring & Alerting](#monitoring--alerting)
- [Testing](#testing)
- [Incident Response](#incident-response)
- [Compliance](#compliance)

## Security Architecture

### Defense in Depth

The payment callback system implements multiple layers of security:

```
┌─────────────────────────────────────────────────────────┐
│                     INTERNET                            │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 1: Rate Limiting                                 │
│  - Max 100 requests per 15 minutes per IP               │
│  - Prevents DDoS attacks                                │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 2: IP Whitelist                                  │
│  - Only accept from Duitku IPs                          │
│  - Production: 10 whitelisted IPs                       │
│  - Sandbox: 4 whitelisted IPs                           │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 3: Request Validation                            │
│  - Verify all required fields present                   │
│  - Validate data types                                  │
│  - Sanitize inputs                                      │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 4: Signature Verification                        │
│  - Verify MD5 signature (Duitku requirement)            │
│  - Timing-safe comparison (prevents timing attacks)     │
│  - Correct formula: MD5(code+amount+orderId+key)        │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 5: Idempotency Check                             │
│  - Prevent duplicate callbacks (replay attacks)         │
│  - Track processed callbacks                            │
│  - 24-hour window                                       │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 6: Business Logic Validation                     │
│  - Verify payment exists in database                    │
│  - Verify amount matches                                │
│  - Update payment status                                │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 7: Audit Logging                                 │
│  - Log all verification attempts                        │
│  - Track success and failure events                     │
│  - Enable fraud detection                               │
└─────────────────────────────────────────────────────────┘
```

## Threat Model

### Threats Mitigated

| Threat | Impact | Mitigation |
|--------|--------|------------|
| **Forged Callbacks** | CRITICAL - Attackers grant themselves free credits | Signature verification + IP whitelist |
| **Replay Attacks** | HIGH - Old callbacks reused to duplicate credits | Idempotency checking |
| **Timing Attacks** | MEDIUM - Signature discovery via timing analysis | Timing-safe comparison |
| **Amount Tampering** | CRITICAL - Modify payment amount after verification | Amount validation |
| **DDoS Attacks** | HIGH - Overwhelm callback endpoint | Rate limiting |
| **Enumeration** | MEDIUM - Discover valid order IDs | Generic error messages |

### Attack Scenarios

#### Scenario 1: Forged Payment Callback

**Without Security:**
```javascript
// Attacker sends fake callback
POST /api/payments/callback
{
  "merchantOrderId": "USER123_CREDIT_1000",
  "amount": 1000000,
  "resultCode": "00",
  "signature": "forged-signature"
}

// ❌ User gets 1M credits without paying
```

**With Security:**
- IP whitelist blocks non-Duitku IPs
- Signature verification fails (invalid signature)
- Security event logged for fraud detection
- No credits granted

#### Scenario 2: Replay Attack

**Without Security:**
```javascript
// Attacker captures legitimate callback
// Replays it multiple times
// ❌ User gets credits multiple times for single payment
```

**With Security:**
- First callback processes successfully
- Subsequent callbacks detected as duplicates
- Idempotency check prevents duplicate processing
- Security event logged

#### Scenario 3: Timing Attack

**Without Security:**
```javascript
// Attacker measures response times
// Discovers signature byte-by-byte
// ❌ Eventually discovers valid signature
```

**With Security:**
- Timing-safe comparison (constant time)
- Response time identical for all invalid signatures
- Attack infeasible

## Security Layers

### Layer 1: Rate Limiting

**Purpose:** Prevent DDoS attacks on callback endpoint

**Implementation:**
```typescript
// backend/src/middleware/payment-security.middleware.ts
export const paymentCallbackRateLimitConfig = {
  windowMs: 15 * 60 * 1000,  // 15 minutes
  limit: 100,                 // Max 100 requests per window
}
```

**Configuration:**
- Window: 15 minutes
- Limit: 100 requests per IP
- Allows Duitku's retry mechanism (max 5 attempts)
- Generous margin for legitimate traffic

### Layer 2: IP Whitelist

**Purpose:** Only accept callbacks from Duitku servers

**Implementation:**
```typescript
// Production IPs (from Duitku documentation)
const DUITKU_PRODUCTION_IPS = [
  '182.23.85.8', '182.23.85.9', '182.23.85.10',
  '182.23.85.13', '182.23.85.14',
  '103.177.101.184', '103.177.101.185', '103.177.101.186',
  '103.177.101.189', '103.177.101.190',
]

// Sandbox IPs
const DUITKU_SANDBOX_IPS = [
  '182.23.85.11', '182.23.85.12',
  '103.177.101.187', '103.177.101.188',
]
```

**Configuration:**
```bash
# .env
PAYMENT_IP_WHITELIST_ENABLED=true  # NEVER disable in production
DUITKU_ENV=production              # Uses production IPs
```

**Testing/Development:**
```bash
# Local development only
PAYMENT_IP_WHITELIST_ENABLED=false
```

**⚠️ WARNING:** Never disable IP whitelist in production!

### Layer 3: Request Validation

**Purpose:** Ensure all required fields present and valid

**Implementation:**
```typescript
const requiredFields = [
  'merchantOrderId',
  'amount',
  'merchantCode',
  'signature',
  'resultCode',
]

// Validates:
// - All required fields present
// - Data types correct
// - Amount is numeric
```

### Layer 4: Signature Verification

**Purpose:** Verify callback authenticity using cryptographic signature

**Implementation:**
```typescript
// CORRECT Duitku signature formula
const signatureString = `${merchantCode}${amount}${merchantOrderId}${apiKey}`
const expectedSignature = crypto.createHash('md5').update(signatureString).digest('hex')

// Timing-safe comparison (constant-time)
const expectedBuffer = Buffer.from(expectedSignature, 'hex')
const receivedBuffer = Buffer.from(callbackSignature, 'hex')

if (!timingSafeEqual(expectedBuffer, receivedBuffer)) {
  throw new InvalidSignatureError()
}
```

**⚠️ Critical Bug Fixed:**
- **Old (WRONG):** `MD5(merchantCode + amount + merchantCode + reference)`
- **New (CORRECT):** `MD5(merchantCode + amount + merchantOrderId + apiKey)`

**MD5 Usage:**
- MD5 is cryptographically broken (collision attacks)
- Required by Duitku's legacy API (cannot change)
- Compensating controls implemented:
  - IP whitelist (only Duitku IPs)
  - Timing-safe comparison
  - Idempotency checking
  - Amount verification
  - Audit logging

**Technical Debt:**
- Track migration to more secure payment provider
- Consider Duitku SNAP API (uses SHA256withRSA)

### Layer 5: Idempotency Check

**Purpose:** Prevent replay attacks by tracking processed callbacks

**Implementation:**
```typescript
// In-memory store (replace with Redis in production)
const callbackIdempotencyStore = new Map<string, string>()

// Check if callback already processed
if (existingSignature === signature) {
  throw new DuplicateCallbackError()
}

// Store for 24 hours
callbackIdempotencyStore.set(merchantOrderId, signature)
```

**Production Recommendation:**
```typescript
// Use Redis with TTL for multi-instance deployments
await redis.setex(`payment:callback:${merchantOrderId}`, 86400, signature)
```

### Layer 6: Business Logic Validation

**Purpose:** Verify payment data integrity

**Validations:**
1. Payment exists in database
2. Amount matches stored amount (within 0.01 tolerance)
3. Payment not already processed
4. Status transition valid

**Implementation:**
```typescript
// Verify amount matches (prevent tampering)
if (Math.abs(payment.amount - normalizedAmount) > 0.01) {
  throw new PaymentVerificationError('Amount mismatch')
}
```

### Layer 7: Audit Logging

**Purpose:** Track all security events for monitoring and incident response

**Events Logged:**
```typescript
// Success
PAYMENT_CALLBACK_SUCCESS      // Payment verified and processed

// Security failures (CRITICAL)
PAYMENT_SIGNATURE_INVALID     // Invalid signature (fraud attempt)
PAYMENT_IP_UNAUTHORIZED       // Unauthorized IP (attack)
PAYMENT_DUPLICATE_CALLBACK    // Replay attack detected
PAYMENT_CALLBACK_EXPIRED      // Expired callback

// Business failures
PAYMENT_NOT_FOUND            // Payment doesn't exist
PAYMENT_CALLBACK_FAILED      // General failure
```

**Log Format:**
```typescript
{
  event: 'PAYMENT_SIGNATURE_INVALID',
  severity: 'CRITICAL',
  message: 'Invalid payment signature detected',
  timestamp: '2025-10-14T10:30:00Z',
  ip: '1.2.3.4',
  merchantOrderId: 'LUMIKU-123',
  amount: 100000,
  metadata: {
    receivedSignaturePreview: '1234abcd...'
  }
}
```

## Configuration

### Environment Variables

```bash
# Duitku Configuration
DUITKU_MERCHANT_CODE="your-merchant-code"
DUITKU_API_KEY="your-api-key"
DUITKU_ENV="production"  # or "sandbox"
DUITKU_CALLBACK_URL="https://api.lumiku.com/api/payments/callback"
DUITKU_RETURN_URL="https://lumiku.com/payments/status"

# Security Configuration
PAYMENT_IP_WHITELIST_ENABLED="true"  # NEVER disable in production
```

### Security Checklist

**Before Production Deployment:**

- [ ] `DUITKU_ENV=production` (uses production IPs)
- [ ] `PAYMENT_IP_WHITELIST_ENABLED=true` (CRITICAL)
- [ ] `DUITKU_API_KEY` is strong and secret
- [ ] Callback URL uses HTTPS
- [ ] Monitoring and alerting configured
- [ ] Log aggregation enabled
- [ ] Incident response plan documented
- [ ] Team trained on security procedures

## Monitoring & Alerting

### Key Metrics

**Security Metrics:**
- Invalid signature attempts (fraud indicator)
- Unauthorized IP attempts (attack indicator)
- Duplicate callback attempts (replay attacks)
- Rate limit violations (DDoS attempts)

**Business Metrics:**
- Successful payments processed
- Failed payment callbacks
- Average callback processing time
- Payment status distribution

### Alerting Rules

**CRITICAL Alerts (immediate response):**
```
- Invalid signature rate > 5 per hour
- Unauthorized IP attempts > 10 per hour
- Duplicate callback rate > 5 per hour
```

**HIGH Alerts (investigate within 1 hour):**
```
- Rate limit violations > 100 per hour
- Payment not found rate > 10 per hour
- Callback processing errors > 5%
```

**MEDIUM Alerts (investigate within 24 hours):**
```
- Callback processing time > 5 seconds
- Failed payment rate > 10%
```

### Integration Examples

**Sentry (Error Tracking):**
```typescript
if (entry.severity === SecuritySeverity.CRITICAL) {
  Sentry.captureMessage(entry.message, {
    level: 'error',
    tags: { event: entry.event, severity: entry.severity },
    extra: entry,
  })
}
```

**Slack (Team Alerts):**
```typescript
if (entry.severity === SecuritySeverity.CRITICAL) {
  await fetch(SLACK_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({
      text: `🚨 CRITICAL: ${entry.message}`,
      attachments: [{ text: JSON.stringify(entry, null, 2) }],
    }),
  })
}
```

## Testing

### Running Tests

```bash
# Run all payment security tests
bun test backend/src/services/__tests__/payment.service.test.ts

# Run specific test suite
bun test --grep "Signature Verification"
```

### Test Coverage

- ✅ Valid signature acceptance
- ✅ Invalid signature rejection
- ✅ Timing attack resistance
- ✅ Replay attack prevention
- ✅ Amount tampering detection
- ✅ Missing field handling
- ✅ Status code handling
- ✅ Error handling

### Manual Testing

**Test Invalid Signature:**
```bash
curl -X POST http://localhost:3000/api/payments/callback \
  -H "Content-Type: application/json" \
  -d '{
    "merchantCode": "TEST123",
    "merchantOrderId": "LUMIKU-123",
    "amount": 100000,
    "signature": "invalid-signature",
    "resultCode": "00"
  }'

# Expected: 400 Bad Request
# Expected log: [SECURITY] PAYMENT_SIGNATURE_INVALID
```

**Test Duplicate Callback:**
```bash
# Send same callback twice
curl -X POST http://localhost:3000/api/payments/callback \
  -H "Content-Type: application/json" \
  -d @valid_callback.json

curl -X POST http://localhost:3000/api/payments/callback \
  -H "Content-Type: application/json" \
  -d @valid_callback.json

# Expected: Second call fails with "Duplicate callback"
```

## Incident Response

### Incident Types

**1. Fraud Attempt Detected**
- **Indicators:** Multiple invalid signatures, unauthorized IPs
- **Response:**
  1. Review security logs for attack pattern
  2. Block attacker IP if not already blocked
  3. Verify no successful fraud occurred
  4. Review and update monitoring rules
  5. Document incident for future reference

**2. Replay Attack Detected**
- **Indicators:** Duplicate callback attempts
- **Response:**
  1. Verify idempotency check is working
  2. Check if any duplicate processing occurred
  3. Review affected user accounts
  4. Refund/correct any duplicate credits
  5. Update monitoring for similar patterns

**3. Legitimate Callback Blocked**
- **Indicators:** Valid Duitku callback rejected
- **Response:**
  1. Check if Duitku IP whitelist needs update
  2. Verify callback signature formula
  3. Check for Duitku API changes
  4. Manually process valid callback if needed
  5. Update IP whitelist if required

### Contact Information

**Duitku Support:**
- Email: support@duitku.com
- Phone: +62 21 2222 0996
- Documentation: https://docs.duitku.com/

**Internal Team:**
- Security Team: security@lumiku.com
- On-call: [Your on-call system]

## Compliance

### PCI-DSS Requirements

While Lumiku doesn't directly handle credit card data (Duitku does), we must ensure:

- ✅ Secure communication (HTTPS)
- ✅ Access control (IP whitelist)
- ✅ Audit logging (all events logged)
- ✅ Monitoring (fraud detection)
- ✅ Incident response (documented procedures)

### Data Privacy

**Logged Data:**
- Transaction IDs (merchantOrderId)
- Amounts (for fraud detection)
- IP addresses (for security)
- Timestamps (for audit trail)

**NOT Logged:**
- Full signatures (only preview)
- API keys (never logged)
- User personal data (only IDs)

### Retention Policy

**Security Logs:**
- Retention: 90 days minimum
- Storage: Secure log aggregation system
- Access: Security team only

**Payment Records:**
- Retention: 7 years (regulatory requirement)
- Backup: Daily encrypted backups
- Access: Authorized personnel only

## Additional Resources

- [Duitku API Documentation](https://docs.duitku.com/api/en/)
- [OWASP Payment Card Industry Data Security Standard](https://owasp.org/www-project-proactive-controls/)
- [Node.js Crypto Module Documentation](https://nodejs.org/api/crypto.html)
- [Timing Attack Prevention](https://en.wikipedia.org/wiki/Timing_attack)

## Changelog

### 2025-10-14 - Critical Security Fix
- Fixed incorrect signature formula (was using wrong parameters)
- Implemented timing-safe comparison
- Added IP whitelist
- Added idempotency checking
- Implemented comprehensive audit logging
- Created security tests
- Documented all security measures

### Previous
- Initial payment integration (INSECURE - DO NOT USE)

## Support

For questions or security concerns:
- Create issue in GitHub repository
- Email: security@lumiku.com
- Emergency hotline: [Your hotline]

---

**Last Updated:** 2025-10-14
**Version:** 2.0.0
**Status:** Production Ready
