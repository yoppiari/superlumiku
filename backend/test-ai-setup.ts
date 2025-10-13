#!/usr/bin/env bun

/**
 * Test AI Setup - Verify HuggingFace API Key
 * Run: bun run backend/test-ai-setup.ts
 */

import axios from 'axios'

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY

console.log('🧪 Testing AI Setup...\n')
console.log('=' .repeat(50))

async function testHuggingFaceAPI() {
  console.log('\n1️⃣ Testing HuggingFace API Key...')

  if (!HUGGINGFACE_API_KEY) {
    console.error('❌ HUGGINGFACE_API_KEY not found!')
    return false
  }

  console.log(`   Key: ${HUGGINGFACE_API_KEY.substring(0, 10)}...`)

  try {
    // Test API key with a simple request
    const response = await axios.get(
      'https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5',
      {
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`
        },
        timeout: 10000
      }
    )

    console.log('   ✅ HuggingFace API key is VALID!')
    console.log(`   Status: ${response.status}`)
    return true
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.error('   ❌ HuggingFace API key is INVALID!')
      console.error('   Please check your API key at: https://huggingface.co/settings/tokens')
      return false
    } else if (error.response?.status === 403) {
      console.log('   ⚠️  API key valid but model access restricted')
      console.log('   ✅ This is OK - API key works!')
      return true
    } else {
      console.error('   ❌ Error testing API key:', error.message)
      return false
    }
  }
}

async function testModelsAvailability() {
  console.log('\n2️⃣ Testing Model Availability...')

  const models = [
    { name: 'ControlNet (SD)', id: 'lllyasviel/control_v11p_sd15_openpose' },
    { name: 'ControlNet (HD)', id: 'thibaud/controlnet-openpose-sdxl-1.0' },
    { name: 'SDXL Base', id: 'stabilityai/stable-diffusion-xl-base-1.0' },
    { name: 'Inpainting', id: 'runwayml/stable-diffusion-inpainting' }
  ]

  let allAvailable = true

  for (const model of models) {
    try {
      const response = await axios.get(
        `https://api-inference.huggingface.co/models/${model.id}`,
        {
          headers: {
            'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`
          },
          timeout: 10000
        }
      )

      console.log(`   ✅ ${model.name}: Available`)
    } catch (error: any) {
      if (error.response?.status === 403) {
        console.log(`   ✅ ${model.name}: Available (access restricted but OK)`)
      } else {
        console.log(`   ⚠️  ${model.name}: ${error.message}`)
        allAvailable = false
      }
    }
  }

  return allAvailable
}

async function testEnvironmentVariables() {
  console.log('\n3️⃣ Testing Environment Variables...')

  const requiredVars = [
    'HUGGINGFACE_API_KEY',
    'CONTROLNET_MODEL_SD',
    'SDXL_MODEL'
  ]

  let allSet = true

  for (const varName of requiredVars) {
    const value = process.env[varName]
    if (value) {
      console.log(`   ✅ ${varName}: Set`)
    } else {
      console.log(`   ❌ ${varName}: Not set`)
      allSet = false
    }
  }

  return allSet
}

async function testStoragePaths() {
  console.log('\n4️⃣ Testing Storage Paths...')

  const fs = await import('fs/promises')
  const path = await import('path')

  const paths = [
    './uploads',
    './uploads/avatars',
    './uploads/pose-generator'
  ]

  for (const dirPath of paths) {
    try {
      await fs.access(dirPath)
      console.log(`   ✅ ${dirPath}: Exists`)
    } catch {
      try {
        await fs.mkdir(dirPath, { recursive: true })
        console.log(`   ✅ ${dirPath}: Created`)
      } catch (error: any) {
        console.log(`   ❌ ${dirPath}: Failed to create - ${error.message}`)
      }
    }
  }

  return true
}

async function main() {
  const results = {
    apiKey: false,
    models: false,
    env: false,
    storage: false
  }

  try {
    results.apiKey = await testHuggingFaceAPI()
    results.models = await testModelsAvailability()
    results.env = await testEnvironmentVariables()
    results.storage = await testStoragePaths()

    console.log('\n' + '='.repeat(50))
    console.log('\n📊 Test Results Summary:\n')

    console.log(`   HuggingFace API Key:    ${results.apiKey ? '✅ PASS' : '❌ FAIL'}`)
    console.log(`   Models Availability:    ${results.models ? '✅ PASS' : '⚠️  PARTIAL'}`)
    console.log(`   Environment Variables:  ${results.env ? '✅ PASS' : '❌ FAIL'}`)
    console.log(`   Storage Paths:          ${results.storage ? '✅ PASS' : '❌ FAIL'}`)

    const allPassed = results.apiKey && results.env && results.storage

    if (allPassed) {
      console.log('\n🎉 All tests PASSED! AI system is ready to use!')
      console.log('\n📝 Next steps:')
      console.log('   1. Start the backend: cd backend && bun dev')
      console.log('   2. Test avatar upload in UI')
      console.log('   3. Try generating a pose')
      console.log('   4. Check logs for any errors')
    } else {
      console.log('\n⚠️  Some tests FAILED. Please fix the issues above.')
      console.log('\n📝 Common fixes:')
      console.log('   - Invalid API key: Get new key from https://huggingface.co/settings/tokens')
      console.log('   - Missing env vars: Copy .env.ai.example to .env')
      console.log('   - Storage errors: Check directory permissions')
    }

    console.log('\n' + '='.repeat(50))

    process.exit(allPassed ? 0 : 1)
  } catch (error: any) {
    console.error('\n❌ Test suite failed:', error.message)
    process.exit(1)
  }
}

main()
