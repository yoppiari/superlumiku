import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'test@lumiku.com' },
    include: {
      credits: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  })

  if (!user) {
    console.log('❌ User not found')
    return
  }

  const lastCredit = user.credits[0]
  
  console.log('\n📊 Credit Status:')
  console.log('==================')
  console.log('User:', user.email)
  console.log('Current Balance:', lastCredit?.balance || 0)
  console.log('\nRecent Transactions:')
  user.credits.forEach((credit, i) => {
    console.log(`${i + 1}. ${credit.type} - ${credit.amount > 0 ? '+' : ''}${credit.amount} (Balance: ${credit.balance}) - ${credit.description}`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
