import prisma from '../../src/db/client'

export const seedSubscriptionPlans = async () => {
  console.log('🌱 Seeding subscription plans...')

  const plans = [
    {
      planId: 'free-forever',
      tier: 'free',
      name: 'Free Forever',
      description: 'Perfect for trying out Lumiku',
      price: 0,
      billingCycle: 'monthly',
      dailyQuota: 10,
      monthlyQuota: 300,
      maxModelTier: 'free',
      features: JSON.stringify({
        freeModelsOnly: true,
        basicSupport: true
      }),
      isActive: true,
      displayOrder: 0
    },
    {
      planId: 'basic-monthly',
      tier: 'basic',
      name: 'Basic Monthly',
      description: 'Great for individuals and small projects',
      price: 99000,
      billingCycle: 'monthly',
      dailyQuota: 50,
      monthlyQuota: 1500,
      maxModelTier: 'basic',
      features: JSON.stringify({
        basicModels: true,
        emailSupport: true,
        noWatermark: true
      }),
      isActive: true,
      displayOrder: 1
    },
    {
      planId: 'pro-monthly',
      tier: 'pro',
      name: 'Pro Monthly',
      description: 'Perfect for professionals and agencies',
      price: 299000,
      billingCycle: 'monthly',
      dailyQuota: 100,
      monthlyQuota: 3000,
      maxModelTier: 'pro',
      features: JSON.stringify({
        proModels: true,
        prioritySupport: true,
        apiAccess: true,
        customBranding: true
      }),
      isActive: true,
      displayOrder: 2
    },
    {
      planId: 'enterprise-monthly',
      tier: 'enterprise',
      name: 'Enterprise Monthly',
      description: 'Unlimited power for large teams',
      price: 999000,
      billingCycle: 'monthly',
      dailyQuota: 500,
      monthlyQuota: 15000,
      maxModelTier: 'enterprise',
      features: JSON.stringify({
        allModels: true,
        dedicatedSupport: true,
        apiAccess: true,
        customBranding: true,
        sla: true,
        onPremise: true
      }),
      isActive: true,
      displayOrder: 3
    },
    {
      planId: 'pro-yearly',
      tier: 'pro',
      name: 'Pro Yearly',
      description: 'Save 20% with annual billing',
      price: 2870000, // 299k * 12 * 0.8
      billingCycle: 'yearly',
      dailyQuota: 100,
      monthlyQuota: 3000,
      maxModelTier: 'pro',
      features: JSON.stringify({
        proModels: true,
        prioritySupport: true,
        apiAccess: true,
        customBranding: true,
        yearlyDiscount: true
      }),
      isActive: true,
      displayOrder: 4
    }
  ]

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { planId: plan.planId },
      update: plan,
      create: plan
    })
  }

  console.log(`✅ Seeded ${plans.length} subscription plans`)
}
