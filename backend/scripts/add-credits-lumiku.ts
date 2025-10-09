import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('💰 Adding credits to test@lumiku.com...\n')

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: 'test@lumiku.com' },
    })

    if (!user) {
      console.error('❌ User not found: test@lumiku.com')
      console.log('\nℹ️  Please make sure you are logged in with this email first.')
      process.exit(1)
    }

    // Get current balance
    const lastCredit = await prisma.credit.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    const currentBalance = lastCredit?.balance || 0
    const creditsToAdd = 10000
    const newBalance = currentBalance + creditsToAdd

    // Add credits
    await prisma.credit.create({
      data: {
        userId: user.id,
        amount: creditsToAdd,
        balance: newBalance,
        type: 'bonus',
        description: 'Trial credits for video generation testing',
      },
    })

    console.log('✅ Credits added successfully!\n')
    console.log('📧 Email:', user.email)
    console.log('👤 Name:', user.name)
    console.log('💰 Previous balance:', currentBalance)
    console.log('➕ Added:', creditsToAdd)
    console.log('💰 New balance:', newBalance)

    // Delete test@example.com user
    console.log('\n🗑️  Deleting test@example.com user...')
    
    const testUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
    })

    if (testUser) {
      // Delete credits first
      await prisma.credit.deleteMany({
        where: { userId: testUser.id },
      })

      // Delete sessions
      await prisma.session.deleteMany({
        where: { userId: testUser.id },
      })

      // Delete user
      await prisma.user.delete({
        where: { id: testUser.id },
      })

      console.log('✅ Deleted test@example.com successfully')
    } else {
      console.log('ℹ️  test@example.com not found (may already be deleted)')
    }

    console.log('\n✨ All done!')
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
