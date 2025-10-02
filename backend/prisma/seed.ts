import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 10)

  const user = await prisma.user.upsert({
    where: { email: 'test@lumiku.com' },
    update: {},
    create: {
      email: 'test@lumiku.com',
      password: hashedPassword,
      name: 'Test User',
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
  })

  // Get credit balance
  const credits = await prisma.credit.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })

  console.log('💰 Credit balance:', credits?.balance || 0)
  console.log('\n✨ Seed completed!')
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