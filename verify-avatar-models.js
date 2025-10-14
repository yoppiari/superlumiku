/**
 * Avatar Creator AI Models - Verification Script
 *
 * Run this script to verify the AI models are properly configured
 * Usage: node verify-avatar-models.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function verifyAIModels() {
  console.log('🔍 Verifying Avatar Creator AI Models...\n')

  try {
    // 1. Check if AI models exist
    const models = await prisma.aIModel.findMany({
      where: {
        appId: 'avatar-creator',
      },
      orderBy: [
        { tier: 'asc' },
        { creditCost: 'asc' },
      ],
    })

    if (models.length === 0) {
      console.error('❌ ERROR: No AI models found for Avatar Creator')
      console.error('   Run: npm run seed\n')
      process.exit(1)
    }

    console.log(`✅ Found ${models.length} AI models for Avatar Creator\n`)

    // 2. Display models
    console.log('📋 AI Models Configuration:\n')
    console.log('┌────────────────────────────────────────────────────────────────────────────┐')
    console.log('│ Model Name                        │ Tier   │ Credits │ LoRA  │ Resolution │')
    console.log('├────────────────────────────────────────────────────────────────────────────┤')

    for (const model of models) {
      const caps = model.capabilities ? JSON.parse(model.capabilities) : {}
      const name = model.name.padEnd(35)
      const tier = model.tier.padEnd(8)
      const credits = model.creditCost.toString().padEnd(9)
      const lora = (caps.useLoRA ? 'Yes' : 'No').padEnd(7)
      const resolution = `${caps.width}x${caps.height}`.padEnd(12)

      console.log(`│ ${name}│ ${tier}│ ${credits}│ ${lora}│ ${resolution}│`)
    }

    console.log('└────────────────────────────────────────────────────────────────────────────┘')
    console.log('')

    // 3. Verify required models
    const requiredModels = [
      'avatar-creator:flux-dev-base',
      'avatar-creator:flux-dev-realism',
      'avatar-creator:flux-dev-hd-realism',
      'avatar-creator:flux-schnell-fast',
    ]

    console.log('✅ Required Models Check:\n')
    for (const modelKey of requiredModels) {
      const model = models.find(m => m.modelKey === modelKey)
      if (model) {
        console.log(`   ✓ ${modelKey}`)
      } else {
        console.error(`   ✗ ${modelKey} - MISSING`)
      }
    }
    console.log('')

    // 4. Verify capabilities
    console.log('🔧 Model Capabilities Check:\n')
    for (const model of models) {
      const caps = model.capabilities ? JSON.parse(model.capabilities) : {}

      console.log(`   ${model.name}:`)
      console.log(`      - Model ID: ${caps.modelId || 'NOT SET'}`)
      console.log(`      - LoRA Model: ${caps.loraModel || 'None'}`)
      console.log(`      - LoRA Scale: ${caps.loraScale || 'N/A'}`)
      console.log(`      - Resolution: ${caps.width}x${caps.height}`)
      console.log(`      - Steps: ${caps.numInferenceSteps}`)
      console.log(`      - Guidance: ${caps.guidanceScale}`)
      console.log(`      - Processing Time: ${caps.processingTime}`)
      console.log('')
    }

    // 5. Verify tier access
    console.log('🎯 Tier Access Matrix:\n')
    const tiers = ['free', 'basic', 'pro', 'enterprise']
    const tierHierarchy = {
      free: ['free'],
      basic: ['free', 'basic'],
      pro: ['free', 'basic', 'pro'],
      enterprise: ['free', 'basic', 'pro', 'enterprise'],
    }

    for (const tier of tiers) {
      const accessibleModels = models.filter(m =>
        tierHierarchy[tier].includes(m.tier)
      )
      console.log(`   ${tier.toUpperCase()} tier: ${accessibleModels.length} models accessible`)
      accessibleModels.forEach(m => {
        console.log(`      - ${m.name} (${m.creditCost} credits)`)
      })
      console.log('')
    }

    // 6. Environment check
    console.log('🌍 Environment Variables Check:\n')

    const envVars = [
      'DATABASE_URL',
      'HUGGINGFACE_API_KEY',
      'FLUX_MODEL',
      'FLUX_LORA_MODEL',
      'REDIS_URL',
    ]

    for (const envVar of envVars) {
      const value = process.env[envVar]
      if (value) {
        const displayValue = envVar.includes('KEY') || envVar.includes('URL')
          ? value.substring(0, 20) + '...'
          : value
        console.log(`   ✓ ${envVar}: ${displayValue}`)
      } else {
        if (envVar === 'HUGGINGFACE_API_KEY') {
          console.error(`   ✗ ${envVar}: NOT SET (REQUIRED)`)
        } else {
          console.log(`   ⚠ ${envVar}: NOT SET (optional)`)
        }
      }
    }
    console.log('')

    // 7. Check Avatar Creator app
    console.log('📱 Avatar Creator App Check:\n')
    const app = await prisma.app.findUnique({
      where: { appId: 'avatar-creator' },
    })

    if (app) {
      console.log(`   ✓ App found: ${app.name}`)
      console.log(`   ✓ Enabled: ${app.enabled}`)
      console.log(`   ✓ Beta: ${app.beta}`)
      console.log(`   ✓ Base credit cost: ${app.creditCostBase}`)
    } else {
      console.error('   ✗ Avatar Creator app not found in database')
      console.error('   Run full seed to create app entries')
    }
    console.log('')

    // Summary
    console.log('═══════════════════════════════════════════════════════════════════════════')
    console.log('✅ VERIFICATION COMPLETE')
    console.log('═══════════════════════════════════════════════════════════════════════════')
    console.log('')
    console.log('Next steps:')
    console.log('1. Ensure HUGGINGFACE_API_KEY is set in .env')
    console.log('2. Restart backend: pm2 restart backend')
    console.log('3. Restart worker: pm2 restart worker')
    console.log('4. Test avatar generation with free user')
    console.log('5. Test avatar generation with basic user (should use LoRA)')
    console.log('')
    console.log('For testing commands, see: AVATAR_CREATOR_AI_MODELS_SETUP.md')
    console.log('')

  } catch (error) {
    console.error('❌ Verification failed:', error.message)
    console.error('')
    console.error('Stack trace:')
    console.error(error.stack)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run verification
verifyAIModels()
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
