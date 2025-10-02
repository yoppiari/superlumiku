import prisma from './src/db/client'

async function addCredits() {
  try {
    // Get the first user (assuming you're the only user)
    const user = await prisma.user.findFirst()

    if (!user) {
      console.error('❌ No user found')
      return
    }

    console.log(`👤 User found: ${user.email}`)

    // Get current credit balance
    const currentCredit = await prisma.credit.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })

    const currentBalance = currentCredit?.balance || 0
    console.log(`💰 Current balance: ${currentBalance} credits`)

    // Add credits to make total 1000
    const creditsToAdd = 1000 - currentBalance

    if (creditsToAdd <= 0) {
      console.log(`✅ User already has ${currentBalance} credits (>= 1000)`)
      return
    }

    // Create new credit transaction
    await prisma.credit.create({
      data: {
        userId: user.id,
        amount: creditsToAdd,
        balance: 1000,
        type: 'topup',
        description: 'Manual credit addition',
      }
    })

    console.log(`✅ Added ${creditsToAdd} credits`)
    console.log(`💰 New balance: 1000 credits`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addCredits()
