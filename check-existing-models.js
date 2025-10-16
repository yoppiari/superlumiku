// Check existing AI models in production database
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkModels() {
  console.log('🔍 Checking existing AI models...\n')

  try {
    // Get all AI models
    const allModels = await prisma.aIModel.findMany({
      orderBy: [{ appId: 'asc' }, { tier: 'asc' }],
    })

    console.log(`📊 Total AI models in database: ${allModels.length}\n`)

    // Group by appId
    const byApp = {}
    allModels.forEach((model) => {
      if (!byApp[model.appId]) byApp[model.appId] = []
      byApp[model.appId].push(model)
    })

    // Display by app
    Object.keys(byApp).forEach((appId) => {
      console.log(`\n🎨 ${appId}:`)
      console.log(`   Models: ${byApp[appId].length}`)
      byApp[appId].forEach((model) => {
        console.log(`   - ${model.name} (${model.tier}) - ${model.creditCost} credits`)
        console.log(`     Model ID: ${model.modelId}`)
        console.log(`     Model Key: ${model.modelKey}`)
        console.log(`     Enabled: ${model.enabled}`)
      })
    })

    // Check specifically for avatar-creator
    console.log('\n\n🔍 AVATAR CREATOR MODELS:')
    const avatarModels = await prisma.aIModel.findMany({
      where: { appId: 'avatar-creator' },
      orderBy: { tier: 'asc' },
    })

    if (avatarModels.length === 0) {
      console.log('❌ NO MODELS FOUND for avatar-creator')
      console.log('   This is why Avatar Creator is not showing in dashboard!')
    } else {
      console.log(`✅ Found ${avatarModels.length} models for avatar-creator:`)
      avatarModels.forEach((model, i) => {
        console.log(`\n${i + 1}. ${model.name}`)
        console.log(`   Tier: ${model.tier}`)
        console.log(`   Cost: ${model.creditCost} credits`)
        console.log(`   Model ID: ${model.modelId}`)
        console.log(`   Model Key: ${model.modelKey}`)
        console.log(`   Enabled: ${model.enabled}`)
        console.log(`   Created: ${model.createdAt}`)

        // Parse capabilities
        if (model.capabilities) {
          const caps = JSON.parse(model.capabilities)
          console.log(`   Capabilities:`)
          console.log(`     - Size: ${caps.width}x${caps.height}`)
          console.log(`     - Steps: ${caps.numInferenceSteps}`)
          console.log(`     - Guidance: ${caps.guidanceScale}`)
          if (caps.loraModel) {
            console.log(`     - LoRA: ${caps.loraModel}`)
            console.log(`     - LoRA Scale: ${caps.loraScale}`)
          }
        }
      })
    }
  } catch (error) {
    console.error('❌ Error checking models:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkModels()
