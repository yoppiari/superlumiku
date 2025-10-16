import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { seedSubscriptionPlans } from './seeds/subscription-plans.seed'
import { seedAIModels } from './seeds/ai-models.seed'
import { migrateExistingUsers } from './seeds/migrate-users.seed'
import seedPoseGenerator from './seeds/pose-generator.seed'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')
  console.log('=====================================\n')

  // 1. Seed Subscription Plans
  await seedSubscriptionPlans()
  console.log('')

  // 2. Seed AI Models
  await seedAIModels()
  console.log('')

  // 3. Migrate Existing Users
  await migrateExistingUsers()
  console.log('')

  // 4. Seed Pose Generator (Categories and Poses)
  await seedPoseGenerator()
  console.log('')

  // 5. Create test user (existing logic)
  console.log('🌱 Creating test user...')
  const hashedPassword = await bcrypt.hash('password123', 10)

  const user = await prisma.user.upsert({
    where: { email: 'test@lumiku.com' },
    update: {},
    create: {
      email: 'test@lumiku.com',
      password: hashedPassword,
      name: 'Test User',
      accountType: 'payg',
      subscriptionTier: 'free',
      credits: {
        create: {
          amount: 100,
          balance: 100,
          type: 'bonus',
          description: 'Welcome bonus - 100 free credits',
        },
      },
    },
  })

  console.log('✅ Created test user:', {
    id: user.id,
    email: user.email,
    name: user.name,
    accountType: user.accountType,
    tier: user.subscriptionTier
  })

  // Get credit balance
  const credits = await prisma.credit.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })

  console.log('💰 Credit balance:', credits?.balance || 0)

  console.log('')
  console.log('=====================================')
  console.log('✅ Database seeding completed successfully!')
  console.log('\nTest credentials:')
  console.log('Email: test@lumiku.com')
  console.log('Password: password123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
