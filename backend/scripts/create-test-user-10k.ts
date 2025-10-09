import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Creating test user with 10,000 credits...\n')

  try {
    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
    })

    if (existing) {
      console.log('⚠️  User already exists! Adding credits instead...\n')
      
      // Get current balance
      const lastCredit = await prisma.credit.findFirst({
        where: { userId: existing.id },
        orderBy: { createdAt: 'desc' },
      })

      const currentBalance = lastCredit?.balance || 0
      const newBalance = currentBalance + 10000

      // Add 10000 credits
      await prisma.credit.create({
        data: {
          userId: existing.id,
          amount: 10000,
          balance: newBalance,
          type: 'bonus',
          description: 'Trial credits for video generation testing',
        },
      })

      console.log('✅ Credits added successfully!\n')
      console.log('📧 Email:', existing.email)
      console.log('👤 Name:', existing.name)
      console.log('💰 Previous balance:', currentBalance)
      console.log('➕ Added:', 10000)
      console.log('💰 New balance:', newBalance)
      console.log('\n🎯 You can login with:')
      console.log('   Email: test@example.com')
      console.log('   Password: password123')
      return
    }

    // Hash password
    const password = await bcrypt.hash('password123', 10)

    // Create user with 10000 credits
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password,
        name: 'Test User',
        role: 'admin',
        credits: {
          create: {
            amount: 10000,
            balance: 10000,
            type: 'bonus',
            description: 'Welcome bonus - 10,000 trial credits for video generation',
          },
        },
      },
      include: {
        credits: true,
      },
    })

    console.log('✅ Test user created successfully!\n')
    console.log('📧 Email:', user.email)
    console.log('🔑 Password: password123')
    console.log('👤 Name:', user.name)
    console.log('🎭 Role:', user.role)
    console.log('💰 Credits:', user.credits[0]?.balance || 0)
    console.log('\n🎯 You can now login at: http://localhost:5173/login')
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
