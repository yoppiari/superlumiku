import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = 'test@example.com'
  const creditsToAdd = 10000

  console.log('💰 Adding credits...\n')

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      console.error('❌ User not found:', email)
      process.exit(1)
    }

    // Get current balance
    const currentCredit = await prisma.credit.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    const currentBalance = currentCredit?.balance || 0
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
    console.log('📧 Email:', email)
    console.log('💰 Previous balance:', currentBalance)
    console.log('➕ Credits added:', creditsToAdd)
    console.log('💰 New balance:', newBalance)
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
