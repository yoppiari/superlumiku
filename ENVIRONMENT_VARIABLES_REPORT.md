# Environment Variables Status Report

## Overview

This document reports on the environment variable configuration status for the Pose Generator backend, including which variables are required, optional, and which need to be set in different environments.

## Critical Status: HUGGINGFACE_API_KEY

**Status**: NOT CURRENTLY CONFIGURED

The Pose Generator uses AI models for generating poses. The current implementation supports the following AI services:

### AI Service Configuration

The following AI API keys are OPTIONAL in the schema but may be needed depending on your implementation:

1. **HUGGINGFACE_API_KEY** - Not yet in env.ts
   - Used for: Hugging Face model inference
   - Where to get it: https://huggingface.co/settings/tokens
   - Type: Optional (only if using Hugging Face models)
   - Length: Typically 30+ characters

2. **ANTHROPIC_API_KEY** - Currently optional
   - Used for: Claude AI integration
   - Where to get it: https://console.anthropic.com/keys
   - Type: Optional

3. **OPENAI_API_KEY** - Currently optional
   - Used for: GPT model integration
   - Where to get it: https://platform.openai.com/api-keys
   - Type: Optional

4. **FLUX_API_KEY** - Currently optional
   - Used for: Flux image generation model
   - Where to get it: Via Flux API provider
   - Type: Optional

## Required Environment Variables

These MUST be set in ALL environments:

- DATABASE_URL: PostgreSQL connection string
- JWT_SECRET: 32+ character secret (auto-generated in dev if not set)
- CORS_ORIGIN: Frontend URL (http://localhost:5173 for dev)

## Production-Only Requirements

These MUST be set when NODE_ENV=production:

- REDIS_HOST: Redis server hostname
- REDIS_PASSWORD: Redis authentication password
- DUITKU_MERCHANT_CODE: Payment gateway merchant ID
- DUITKU_API_KEY: Payment gateway API key
- DUITKU_CALLBACK_URL: Must use HTTPS
- DUITKU_RETURN_URL: Must use HTTPS

## Action Items

### To Add HUGGINGFACE_API_KEY Support

If you plan to use Hugging Face models, update `backend/src/config/env.ts`:

```typescript
HUGGINGFACE_API_KEY: z
  .string()
  .optional()
  .describe('Hugging Face API key for model inference'),
```

Then add to the env export:

```typescript
HUGGINGFACE_API_KEY: validatedEnv.HUGGINGFACE_API_KEY,
```

### To Use in Code

```typescript
import { env } from '../config/env'

const hfToken = env.HUGGINGFACE_API_KEY
if (!hfToken) {
  throw new Error('Hugging Face API key is required for this feature')
}
```

## Current Environment Configuration

The backend has comprehensive environment validation at `backend/src/config/env.ts` with:

- Zod schema for all variables
- Production vs development checks
- Security validations
- Clear error messages
- Fail-fast approach for invalid configs

## Environment File Example

Create `backend/.env.local` with:

```
# Core
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/lumiku

# JWT (auto-generated in dev)
JWT_SECRET=your_super_secret_jwt_key_32_chars_minimum_here
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Redis (optional in dev)
REDIS_HOST=localhost
REDIS_PORT=6379

# File Storage
UPLOAD_PATH=./uploads
OUTPUT_PATH=./outputs

# Payment (required in prod)
DUITKU_MERCHANT_CODE=merchant_code_here
DUITKU_API_KEY=api_key_here
DUITKU_CALLBACK_URL=http://localhost:3000/api/payments/callback
DUITKU_RETURN_URL=http://localhost:5173/payment/success

# AI Services (optional)
# HUGGINGFACE_API_KEY=hf_xxxxx
# ANTHROPIC_API_KEY=sk-ant-xxxxx
# OPENAI_API_KEY=sk-xxxxx
```

## Testing Status

To verify environment configuration:

```bash
# Test environment validation
npm run dev

# Test with specific environment
NODE_ENV=test npm run test

# Check for missing variables
npm run check-env
```

## Next Steps

1. Decide which AI service to use for Pose Generator
2. Add HUGGINGFACE_API_KEY to env.ts if needed
3. Document which models require which API keys
4. Set up secure .env files for dev/staging/production
5. Configure CI/CD to validate environments

