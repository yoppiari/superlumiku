#!/usr/bin/env bun

/**
 * Create Enterprise Users Script
 *
 * Creates 4 enterprise users with unlimited access to all apps
 * WITHOUT any credit charges
 *
 * Users will have:
 * - Account Type: Subscription (NOT PAYG)
 * - Subscription Tier: Enterprise (highest tier)
 * - Daily Quota: 500 (very high)
 * - Access to ALL apps and models
 * - NO credit deduction
 *
 * Run: bun run backend/scripts/create-enterprise-users.ts
 */

import prisma from '../src/db/client'
import bcrypt from 'bcryptjs'
import { addDays } from 'date-fns'

interface UserData {
  email: string
  name: string
  password: string
}

const ENTERPRISE_USERS: UserData[] = [
  {
    email: 'ardianfaisal.id@gmail.com',
    name: 'Ardian Faisal',
    password: 'Lumiku2025!' // Default password, bisa diganti nanti
  },
  {
    email: 'iqbal.elvo@gmail.com',
    name: 'Iqbal Elvo',
    password: 'Lumiku2025!'
  },
  {
    email: 'galuh.inteko@gmail.com',
    name: 'Galuh Inteko',
    password: 'Lumiku2025!'
  },
  {
    email: 'dilla.inteko@gmail.com',
    name: 'Dilla Inteko',
    password: 'Lumiku2025!'
  }
]

async function createEnterpriseUsers() {
  console.log('🚀 Creating Enterprise Users...\n')

  // 1. Check if Enterprise plan exists, create if not
  console.log('📋 Step 1: Checking Enterprise Subscription Plan...')

  let enterprisePlan = await prisma.subscriptionPlan.findUnique({
    where: { planId: 'enterprise-monthly' }
  })

  if (!enterprisePlan) {
    console.log('   Creating Enterprise plan...')
    enterprisePlan = await prisma.subscriptionPlan.create({
      data: {
        planId: 'enterprise-monthly',
        tier: 'enterprise',
        name: 'Enterprise Monthly',
        description: 'Full access to all features and models',
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
          unlimitedStorage: true
        }),
        isActive: true,
        displayOrder: 10
      }
    })
    console.log('   ✅ Enterprise plan created')
  } else {
    console.log('   ✅ Enterprise plan exists')
  }

  console.log('')

  // 2. Create users and subscriptions
  for (const userData of ENTERPRISE_USERS) {
    console.log(`👤 Creating user: ${userData.email}`)

    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      })

      if (existingUser) {
        console.log(`   ⚠️  User already exists: ${userData.email}`)

        // Update to enterprise subscription
        console.log('   🔄 Updating to Enterprise subscription...')

        // Update user account type
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            accountType: 'subscription',
            subscriptionTier: 'enterprise'
          }
        })

        // Check if subscription exists
        const existingSub = await prisma.subscription.findUnique({
          where: { userId: existingUser.id }
        })

        if (existingSub) {
          // Update existing subscription
          await prisma.subscription.update({
            where: { userId: existingUser.id },
            data: {
              planId: enterprisePlan.planId,
              status: 'active',
              startDate: new Date(),
              endDate: addDays(new Date(), 365), // 1 year
              billingCycle: 'monthly',
              autoRenew: true,
              nextBillingDate: addDays(new Date(), 30)
            }
          })
        } else {
          // Create new subscription
          await prisma.subscription.create({
            data: {
              userId: existingUser.id,
              planId: enterprisePlan.planId,
              status: 'active',
              startDate: new Date(),
              endDate: addDays(new Date(), 365), // 1 year
              billingCycle: 'monthly',
              autoRenew: true,
              nextBillingDate: addDays(new Date(), 30)
            }
          })
        }

        // Initialize quota
        const today = new Date().toISOString().split('T')[0]
        const tomorrow = addDays(new Date(), 1)
        tomorrow.setHours(0, 0, 0, 0)

        await prisma.quotaUsage.upsert({
          where: {
            userId_period_quotaType: {
              userId: existingUser.id,
              period: today,
              quotaType: 'daily'
            }
          },
          update: {
            quotaLimit: 500,
            usageCount: 0
          },
          create: {
            userId: existingUser.id,
            quotaType: 'daily',
            period: today,
            usageCount: 0,
            quotaLimit: 500,
            resetAt: tomorrow
          }
        })

        console.log('   ✅ Updated to Enterprise subscription')
        continue
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10)

      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          password: hashedPassword,
          role: 'user',
          accountType: 'subscription', // NOT PAYG!
          subscriptionTier: 'enterprise', // Highest tier
          storageQuota: 10737418240, // 10GB
          storageUsed: 0
        }
      })

      console.log('   ✅ User created')

      // Create subscription
      const subscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          planId: enterprisePlan.planId,
          status: 'active',
          startDate: new Date(),
          endDate: addDays(new Date(), 365), // 1 year from now
          billingCycle: 'monthly',
          autoRenew: true,
          nextBillingDate: addDays(new Date(), 30) // Next month
        }
      })

      console.log('   ✅ Subscription created (expires: 1 year)')

      // Initialize daily quota
      const today = new Date().toISOString().split('T')[0]
      const tomorrow = addDays(new Date(), 1)
      tomorrow.setHours(0, 0, 0, 0)

      await prisma.quotaUsage.create({
        data: {
          userId: user.id,
          quotaType: 'daily',
          period: today,
          usageCount: 0,
          quotaLimit: 500, // 500 generations per day
          resetAt: tomorrow
        }
      })

      console.log('   ✅ Daily quota initialized (500/day)')

      // Add some welcome credits as backup (just in case)
      await prisma.credit.create({
        data: {
          userId: user.id,
          amount: 1000,
          balance: 1000,
          type: 'bonus',
          description: 'Welcome bonus credits'
        }
      })

      console.log('   ✅ Bonus credits added (1000 credits backup)')
      console.log('   📧 Email:', userData.email)
      console.log('   🔑 Password:', userData.password)
      console.log('')

    } catch (error) {
      console.error(`   ❌ Error creating user ${userData.email}:`, error)
      console.log('')
    }
  }

  console.log('✅ All enterprise users created!\n')
  console.log('📊 Summary:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Account Type: Subscription (NO credit deduction)')
  console.log('Tier: Enterprise (access to ALL apps and models)')
  console.log('Daily Quota: 500 generations per day')
  console.log('Quota Reset: Every day at 00:00 UTC')
  console.log('Subscription: Active for 1 year')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  console.log('🎯 What they can do:')
  console.log('✅ Use Video Mixer - FREE (no credits)')
  console.log('✅ Use Carousel Mix - FREE (no credits)')
  console.log('✅ Use Looping Flow - FREE (no credits)')
  console.log('✅ Use Video Generator - FREE (quota-based)')
  console.log('✅ Use Poster Editor - FREE (quota-based)')
  console.log('✅ Access ALL AI models (including Pro & Enterprise)')
  console.log('')
  console.log('📧 Login credentials:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  ENTERPRISE_USERS.forEach(user => {
    console.log(`Email: ${user.email}`)
    console.log(`Password: ${user.password}`)
    console.log('---')
  })
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  console.log('⚠️  IMPORTANT: Share these credentials securely!')
  console.log('💡 Users should change their password after first login')
  console.log('')
}

// Run the script
createEnterpriseUsers()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
