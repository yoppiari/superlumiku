/**
 * Test script for FLUX + Realism LoRA avatar generation
 *
 * Usage:
 *   bun run src/test-flux-avatar.ts
 */

import { avatarAIService } from './apps/avatar-creator/services/avatar-ai.service'
import { hfClient } from './lib/huggingface-client'
import path from 'path'

async function testFluxAvatar() {
  console.log('🧪 Testing FLUX + Realism LoRA Avatar Generation\n')

  try {
    // 1. Check API key
    console.log('1️⃣ Checking HuggingFace API configuration...')
    const apiKey = process.env.HUGGINGFACE_API_KEY
    if (!apiKey || apiKey === 'your-production-huggingface-api-key') {
      throw new Error('HUGGINGFACE_API_KEY is not configured properly in .env file')
    }
    console.log('✅ API key configured\n')

    // 2. Test generation
    console.log('2️⃣ Generating test avatar...')
    console.log('   Prompt: "Professional Indonesian woman with modern hijab"')
    console.log('   Model: FLUX.1-dev + XLabs-AI/flux-RealismLora')
    console.log('   This may take 20-30 seconds...\n')

    const startTime = Date.now()

    const result = await avatarAIService.generateFromText({
      userId: 'test-user',
      projectId: 'test-project',
      prompt: 'Professional Indonesian woman with modern hijab, smiling, wearing formal business attire',
      name: 'Test FLUX Avatar',
      gender: 'female',
      ageRange: 'adult',
      style: 'professional',
    })

    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)

    console.log('\n✅ Generation successful!')
    console.log(`   Avatar ID: ${result.id}`)
    console.log(`   Image URL: ${result.imageUrl}`)
    console.log(`   Thumbnail URL: ${result.thumbnailUrl}`)
    console.log(`   Duration: ${duration} seconds`)

    // 3. Check if file exists
    const fullPath = path.join(process.cwd(), result.imageUrl)
    console.log(`\n3️⃣ Checking generated file...`)
    console.log(`   Path: ${fullPath}`)

    const fs = await import('fs/promises')
    const stats = await fs.stat(fullPath)
    const fileSizeKB = (stats.size / 1024).toFixed(2)
    console.log(`   File size: ${fileSizeKB} KB`)
    console.log('✅ File exists and readable\n')

    console.log('🎉 All tests passed!')
    console.log('\nYou can now test via API:')
    console.log('POST http://localhost:3000/api/avatar-creator/projects/{projectId}/avatars/generate')
    console.log('Body: {')
    console.log('  "prompt": "Professional Indonesian woman with hijab",')
    console.log('  "name": "My Avatar",')
    console.log('  "gender": "female",')
    console.log('  "ageRange": "adult",')
    console.log('  "style": "professional"')
    console.log('}')

  } catch (error: any) {
    console.error('\n❌ Test failed:')
    console.error(error.message)

    if (error.message === 'MODEL_LOADING') {
      console.error('\n💡 The model is loading. This is normal for the first request.')
      console.error('   Please wait a minute and try again.')
    } else if (error.message === 'RATE_LIMIT_EXCEEDED') {
      console.error('\n💡 Rate limit exceeded. Please wait a minute and try again.')
    } else if (error.message.includes('HUGGINGFACE_API_KEY')) {
      console.error('\n💡 Please set HUGGINGFACE_API_KEY in .env file')
    }

    process.exit(1)
  }
}

// Run test
testFluxAvatar()
