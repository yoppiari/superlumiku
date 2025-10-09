import prisma from '../src/db/client'

async function checkVideoGenerations() {
  const generations = await prisma.videoGeneration.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      project: {
        select: {
          name: true,
        },
      },
    },
  })

  console.log('\n📹 Recent Video Generations:\n')
  generations.forEach((gen) => {
    console.log(`ID: ${gen.id}`)
    console.log(`Project: ${gen.project.name}`)
    console.log(`Status: ${gen.status}`)
    console.log(`Model: ${gen.modelName}`)
    console.log(`Prompt: ${gen.prompt.substring(0, 50)}...`)
    console.log(`Credits: ${gen.creditUsed}`)
    console.log(`Provider Job ID: ${gen.providerJobId || 'N/A'}`)
    console.log(`Error: ${gen.errorMessage || 'None'}`)
    console.log(`Created: ${gen.createdAt}`)
    console.log('---')
  })

  await prisma.$disconnect()
}

checkVideoGenerations()
