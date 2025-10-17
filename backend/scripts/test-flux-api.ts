/**
 * Test FLUX API with HuggingFace
 * Verifies API key and model access
 */

import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'

const API_KEY = process.env.HUGGINGFACE_API_KEY || 'YOUR_HUGGINGFACE_API_KEY_HERE'

async function testFluxModel(modelId: string, params: any) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`Testing: ${modelId}`)
  console.log(`${'='.repeat(60)}`)

  const requestBody = {
    inputs: "A professional headshot of a 25-year-old woman with brown hair",
    parameters: params
  }

  console.log('Request:', JSON.stringify(requestBody, null, 2))

  try {
    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${modelId}`,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer',
        timeout: 180000
      }
    )

    console.log(`✅ SUCCESS!`)
    console.log(`   Status: ${response.status}`)
    console.log(`   Content-Type: ${response.headers['content-type']}`)
    console.log(`   Size: ${response.data.byteLength} bytes`)

    // Save test image
    const outputDir = path.join(process.cwd(), 'test-outputs')
    await fs.mkdir(outputDir, { recursive: true })
    const filename = `${modelId.replace(/\//g, '_')}_test.jpg`
    const filepath = path.join(outputDir, filename)
    await fs.writeFile(filepath, Buffer.from(response.data))
    console.log(`   Saved: ${filepath}`)

    return true
  } catch (error: any) {
    console.log(`❌ FAILED`)
    console.log(`   Status: ${error.response?.status}`)
    console.log(`   Status Text: ${error.response?.statusText}`)

    // Try to parse error data
    if (error.response?.data) {
      if (error.response.data instanceof ArrayBuffer || Buffer.isBuffer(error.response.data)) {
        try {
          const errorText = Buffer.from(error.response.data).toString('utf-8')
          console.log(`   Error Response:`, errorText)
        } catch (e) {
          console.log(`   Error Response: [Could not parse]`)
        }
      } else {
        console.log(`   Error Response:`, error.response.data)
      }
    }

    console.log(`   Error Message: ${error.message}`)
    return false
  }
}

async function main() {
  console.log('🧪 FLUX API Test Suite')
  console.log(`API Key: ${API_KEY.substring(0, 10)}...`)

  // Test 1: FLUX.1-schnell (Free tier - should work)
  const schnellResult = await testFluxModel(
    'black-forest-labs/FLUX.1-schnell',
    {
      width: 512,
      height: 512,
      num_inference_steps: 4,
      guidance_scale: 0
    }
  )

  // Test 2: FLUX.1-dev without LoRA (May require PRO)
  const devResult = await testFluxModel(
    'black-forest-labs/FLUX.1-dev',
    {
      width: 512,
      height: 512,
      num_inference_steps: 20,
      guidance_scale: 3.5
    }
  )

  // Test 3: FLUX.1-dev with negative prompt
  const devWithNegativeResult = await testFluxModel(
    'black-forest-labs/FLUX.1-dev',
    {
      width: 512,
      height: 512,
      num_inference_steps: 20,
      guidance_scale: 3.5,
      negative_prompt: "ugly, blurry, low quality"
    }
  )

  console.log(`\n${'='.repeat(60)}`)
  console.log(`SUMMARY`)
  console.log(`${'='.repeat(60)}`)
  console.log(`FLUX.1-schnell (free):          ${schnellResult ? '✅ WORKS' : '❌ FAILED'}`)
  console.log(`FLUX.1-dev (base):              ${devResult ? '✅ WORKS' : '❌ FAILED'}`)
  console.log(`FLUX.1-dev (with negative):     ${devWithNegativeResult ? '✅ WORKS' : '❌ FAILED'}`)

  console.log(`\n📋 RECOMMENDATIONS:`)
  if (schnellResult && !devResult) {
    console.log(`   ⚠️  Your API key does not have access to FLUX.1-dev`)
    console.log(`   💡 Use FLUX.1-schnell (free tier) or upgrade to HuggingFace PRO`)
    console.log(`   🔧 Update .env: FLUX_MODEL=black-forest-labs/FLUX.1-schnell`)
  } else if (devResult) {
    console.log(`   ✅ Your API key has access to FLUX.1-dev`)
    console.log(`   💡 Keep using FLUX.1-dev for best quality`)
  } else if (!schnellResult && !devResult) {
    console.log(`   ❌ API key may be invalid or expired`)
    console.log(`   💡 Verify your API key at https://huggingface.co/settings/tokens`)
  }
}

main().catch(console.error)
