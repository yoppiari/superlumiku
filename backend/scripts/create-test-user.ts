import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Creating test user...\n')

  try {
    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
    })

    if (existing) {
      console.log('⚠️  User already exists!')
      console.log(`   Email: ${existing.email}`)
      console.log(`   Name: ${existing.name}`)
      console.log(`   Role: ${existing.role}`)

      // Get credit balance
      const credits = await prisma.credit.findFirst({
        where: { userId: existing.id },
        orderBy: { createdAt: 'desc' },
      })

      console.log(`   Credits: ${credits?.balance || 0}`)
      console.log('\n✅ You can login with:')
      console.log('   Email: test@example.com')
      console.log('   Password: password123')
      return
    }

    // Hash password
    const password = await bcrypt.hash('password123', 10)

    // Create user with initial credits
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password,
        name: 'Test User',
        role: 'admin',
        credits: {
          create: {
            amount: 1000,
            balance: 1000,
            type: 'bonus',
            description: 'Welcome bonus - Initial credits',
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
    console.error('❌ Error creating user:', error.message)
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
