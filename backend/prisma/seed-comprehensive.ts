/**
 * COMPREHENSIVE SEED DATA FOR LUMIKU APPLICATION
 *
 * This seed file creates a complete test environment covering ALL features:
 * - Multiple user types (PAYG, Subscription, different tiers)
 * - Credit transactions and payment history
 * - Subscription records with various statuses
 * - Projects and generations for all apps (VideoMixer, Carousel, LoopingFlow, Avatar)
 * - AI Models and usage tracking
 * - Edge cases and realistic test scenarios
 *
 * Usage:
 *   npm run seed:comprehensive
 *   or
 *   npx tsx backend/prisma/seed-comprehensive.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { addDays, addMonths, subDays, subMonths } from 'date-fns'

const prisma = new PrismaClient()

// ============================================================================
// CONFIGURATION
// ============================================================================

const TEST_PASSWORD = 'Test123!'
const HASH_ROUNDS = 10

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, HASH_ROUNDS)
}

function log(section: string, message: string) {
  console.log(`[${section}] ${message}`)
}

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

async function seedSubscriptionPlans() {
  log('PLANS', 'Seeding subscription plans...')

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
    }
  ]

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { planId: plan.planId },
      update: plan,
      create: plan
    })
  }

  log('PLANS', `✓ Seeded ${plans.length} subscription plans`)
}

async function seedAIModels() {
  log('MODELS', 'Seeding AI models...')

  const models = [
    // Video Generator Models
    {
      appId: 'video-generator',
      modelId: 'wan2.2',
      modelKey: 'video-generator:wan2.2',
      name: 'Wan 2.2 T2V (Free)',
      description: 'Text-to-Video Ultra - Fast and efficient',
      provider: 'modelslab',
      tier: 'free',
      creditCost: 5,
      creditPerSecond: 1.0,
      quotaCost: 1,
      capabilities: JSON.stringify({
        maxDuration: 6,
        resolutions: ['720p'],
        aspectRatios: ['16:9', '9:16']
      }),
      enabled: true,
      beta: false
    },
    {
      appId: 'video-generator',
      modelId: 'veo2',
      modelKey: 'video-generator:veo2',
      name: 'Google Veo 2',
      description: 'Advanced video generation',
      provider: 'edenai',
      tier: 'basic',
      creditCost: 10,
      creditPerSecond: 2.0,
      quotaCost: 1,
      capabilities: JSON.stringify({
        maxDuration: 10,
        resolutions: ['720p', '1080p'],
        aspectRatios: ['16:9', '9:16', '1:1']
      }),
      enabled: true,
      beta: false
    },
    {
      appId: 'video-generator',
      modelId: 'kling-2.5',
      modelKey: 'video-generator:kling-2.5',
      name: 'Kling 2.5 Pro',
      description: 'Professional video generation',
      provider: 'edenai',
      tier: 'pro',
      creditCost: 20,
      creditPerSecond: 3.0,
      quotaCost: 2,
      capabilities: JSON.stringify({
        maxDuration: 10,
        resolutions: ['720p', '1080p', '4k'],
        aspectRatios: ['16:9', '9:16', '1:1', '4:5']
      }),
      enabled: true,
      beta: false
    },
    // Avatar Creator Models
    {
      appId: 'avatar-creator',
      modelId: 'flux-dev-standard',
      modelKey: 'avatar-creator:flux-dev-standard',
      name: 'FLUX.1-dev Standard',
      description: 'Text-to-image avatar generation',
      provider: 'huggingface',
      tier: 'free',
      creditCost: 10,
      creditPerPixel: null,
      quotaCost: 1,
      capabilities: JSON.stringify({
        model: 'black-forest-labs/FLUX.1-dev',
        resolution: '512x512',
        photoRealistic: true
      }),
      enabled: true,
      beta: false
    },
    // Video Mixer Model
    {
      appId: 'video-mixer',
      modelId: 'ffmpeg-standard',
      modelKey: 'video-mixer:ffmpeg-standard',
      name: 'FFmpeg Standard',
      description: 'Standard video mixing',
      provider: 'local',
      tier: 'free',
      creditCost: 2,
      creditPerSecond: null,
      quotaCost: 1,
      capabilities: JSON.stringify({
        maxVideos: 100,
        formats: ['mp4', 'webm']
      }),
      enabled: true,
      beta: false
    },
    // Carousel Mix Model
    {
      appId: 'carousel-mix',
      modelId: 'canvas-standard',
      modelKey: 'carousel-mix:canvas-standard',
      name: 'Canvas Standard',
      description: 'Standard carousel generation',
      provider: 'local',
      tier: 'free',
      creditCost: 1,
      creditPerSecond: null,
      quotaCost: 1,
      capabilities: JSON.stringify({
        maxSlides: 8,
        formats: ['png', 'jpg']
      }),
      enabled: true,
      beta: false
    },
    // Looping Flow Model
    {
      appId: 'looping-flow',
      modelId: 'ffmpeg-loop',
      modelKey: 'looping-flow:ffmpeg-loop',
      name: 'FFmpeg Loop',
      description: 'Video looping with FFmpeg',
      provider: 'local',
      tier: 'free',
      creditCost: 2,
      creditPerSecond: null,
      quotaCost: 1,
      capabilities: JSON.stringify({
        maxDuration: 300,
        crossfade: true
      }),
      enabled: true,
      beta: false
    }
  ]

  for (const model of models) {
    await prisma.aIModel.upsert({
      where: { modelKey: model.modelKey },
      update: model,
      create: model
    })
  }

  log('MODELS', `✓ Seeded ${models.length} AI models`)
}

async function seedApps() {
  log('APPS', 'Seeding app registry...')

  const apps = [
    {
      appId: 'video-mixer',
      name: 'Video Mixer',
      description: 'Create unique video variations by mixing and matching clips',
      icon: 'Film',
      enabled: true,
      beta: false,
      creditCostBase: 2,
      dashboardOrder: 1,
      dashboardColor: 'blue',
      totalUsage: 0,
      activeUsers: 0
    },
    {
      appId: 'carousel-mix',
      name: 'Carousel Mix',
      description: 'Generate carousel posts with text variations',
      icon: 'LayoutGrid',
      enabled: true,
      beta: false,
      creditCostBase: 1,
      dashboardOrder: 2,
      dashboardColor: 'purple',
      totalUsage: 0,
      activeUsers: 0
    },
    {
      appId: 'looping-flow',
      name: 'Looping Flow',
      description: 'Create seamless video loops with audio layers',
      icon: 'Repeat',
      enabled: true,
      beta: false,
      creditCostBase: 2,
      dashboardOrder: 3,
      dashboardColor: 'green',
      totalUsage: 0,
      activeUsers: 0
    },
    {
      appId: 'avatar-creator',
      name: 'Avatar Creator',
      description: 'Generate AI avatars for your content',
      icon: 'User',
      enabled: true,
      beta: false,
      creditCostBase: 10,
      dashboardOrder: 4,
      dashboardColor: 'orange',
      totalUsage: 0,
      activeUsers: 0
    }
  ]

  for (const app of apps) {
    await prisma.app.upsert({
      where: { appId: app.appId },
      update: app,
      create: app
    })
  }

  log('APPS', `✓ Seeded ${apps.length} apps`)
}

async function seedUsers() {
  log('USERS', 'Seeding test users...')

  const hashedPassword = await hashPassword(TEST_PASSWORD)
  const users = []

  // 1. PAYG User - Free tier (just started)
  const paygFreeUser = await prisma.user.upsert({
    where: { email: 'payg-free@lumiku.test' },
    update: {},
    create: {
      email: 'payg-free@lumiku.test',
      password: hashedPassword,
      name: 'PAYG Free User',
      role: 'user',
      accountType: 'payg',
      subscriptionTier: 'free',
      storageUsed: 0,
      credits: {
        create: {
          amount: 100,
          balance: 100,
          type: 'bonus',
          description: 'Welcome bonus - 100 free credits'
        }
      }
    }
  })
  users.push(paygFreeUser)
  log('USERS', `  ✓ Created PAYG Free User (${paygFreeUser.email})`)

  // 2. PAYG User - Active with payment history
  const paygActiveUser = await prisma.user.upsert({
    where: { email: 'payg-active@lumiku.test' },
    update: {},
    create: {
      email: 'payg-active@lumiku.test',
      password: hashedPassword,
      name: 'PAYG Active User',
      role: 'user',
      accountType: 'payg',
      subscriptionTier: 'free',
      storageUsed: 524288000, // 500 MB
      credits: {
        create: [
          {
            amount: 100,
            balance: 100,
            type: 'bonus',
            description: 'Welcome bonus',
            createdAt: subMonths(new Date(), 2)
          },
          {
            amount: 1000,
            balance: 1100,
            type: 'purchase',
            description: 'Purchased 1000 credits',
            paymentId: 'PAYMENT-TEST-001',
            createdAt: subMonths(new Date(), 1)
          },
          {
            amount: -250,
            balance: 850,
            type: 'usage',
            description: 'Video generation usage',
            createdAt: subDays(new Date(), 15)
          },
          {
            amount: -180,
            balance: 670,
            type: 'usage',
            description: 'Avatar creation usage',
            createdAt: subDays(new Date(), 5)
          }
        ]
      }
    }
  })
  users.push(paygActiveUser)
  log('USERS', `  ✓ Created PAYG Active User (${paygActiveUser.email})`)

  // 3. Subscription User - Basic tier (active)
  const basicSubUser = await prisma.user.upsert({
    where: { email: 'sub-basic@lumiku.test' },
    update: {},
    create: {
      email: 'sub-basic@lumiku.test',
      password: hashedPassword,
      name: 'Basic Subscriber',
      role: 'user',
      accountType: 'subscription',
      subscriptionTier: 'basic',
      storageUsed: 314572800, // 300 MB
    }
  })
  users.push(basicSubUser)
  log('USERS', `  ✓ Created Basic Subscriber (${basicSubUser.email})`)

  // 4. Subscription User - Pro tier (active)
  const proSubUser = await prisma.user.upsert({
    where: { email: 'sub-pro@lumiku.test' },
    update: {},
    create: {
      email: 'sub-pro@lumiku.test',
      password: hashedPassword,
      name: 'Pro Subscriber',
      role: 'user',
      accountType: 'subscription',
      subscriptionTier: 'pro',
      storageUsed: 838860800, // 800 MB
    }
  })
  users.push(proSubUser)
  log('USERS', `  ✓ Created Pro Subscriber (${proSubUser.email})`)

  // 5. Subscription User - Enterprise tier
  const enterpriseUser = await prisma.user.upsert({
    where: { email: 'sub-enterprise@lumiku.test' },
    update: {},
    create: {
      email: 'sub-enterprise@lumiku.test',
      password: hashedPassword,
      name: 'Enterprise User',
      role: 'user',
      accountType: 'subscription',
      subscriptionTier: 'enterprise',
      userTags: JSON.stringify(['enterprise_unlimited', 'priority_support']),
      storageUsed: 5368709120, // 5 GB
    }
  })
  users.push(enterpriseUser)
  log('USERS', `  ✓ Created Enterprise User (${enterpriseUser.email})`)

  // 6. Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@lumiku.test' },
    update: {},
    create: {
      email: 'admin@lumiku.test',
      password: hashedPassword,
      name: 'Admin User',
      role: 'admin',
      accountType: 'subscription',
      subscriptionTier: 'enterprise',
      userTags: JSON.stringify(['admin', 'full_access']),
      credits: {
        create: {
          amount: 10000,
          balance: 10000,
          type: 'bonus',
          description: 'Admin account credits'
        }
      }
    }
  })
  users.push(adminUser)
  log('USERS', `  ✓ Created Admin User (${adminUser.email})`)

  log('USERS', `✓ Created ${users.length} test users`)
  return users
}

async function seedSubscriptions(users: any[]) {
  log('SUBSCRIPTIONS', 'Seeding subscriptions...')

  const basicUser = users.find(u => u.email === 'sub-basic@lumiku.test')
  const proUser = users.find(u => u.email === 'sub-pro@lumiku.test')
  const enterpriseUser = users.find(u => u.email === 'sub-enterprise@lumiku.test')
  const adminUser = users.find(u => u.email === 'admin@lumiku.test')

  // Basic subscription (active)
  await prisma.subscription.create({
    data: {
      userId: basicUser.id,
      planId: 'basic-monthly',
      status: 'active',
      startDate: subMonths(new Date(), 1),
      endDate: addMonths(new Date(), 0),
      billingCycle: 'monthly',
      autoRenew: true,
      nextBillingDate: addMonths(new Date(), 1)
    }
  })
  log('SUBSCRIPTIONS', '  ✓ Created Basic subscription')

  // Pro subscription (active)
  await prisma.subscription.create({
    data: {
      userId: proUser.id,
      planId: 'pro-monthly',
      status: 'active',
      startDate: subMonths(new Date(), 3),
      endDate: addDays(new Date(), 15),
      billingCycle: 'monthly',
      autoRenew: true,
      nextBillingDate: addDays(new Date(), 15)
    }
  })
  log('SUBSCRIPTIONS', '  ✓ Created Pro subscription')

  // Enterprise subscription (active)
  await prisma.subscription.create({
    data: {
      userId: enterpriseUser.id,
      planId: 'enterprise-monthly',
      status: 'active',
      startDate: subMonths(new Date(), 6),
      endDate: addMonths(new Date(), 1),
      billingCycle: 'monthly',
      autoRenew: true,
      nextBillingDate: addMonths(new Date(), 1)
    }
  })
  log('SUBSCRIPTIONS', '  ✓ Created Enterprise subscription')

  // Admin subscription
  await prisma.subscription.create({
    data: {
      userId: adminUser.id,
      planId: 'enterprise-monthly',
      status: 'active',
      startDate: subMonths(new Date(), 12),
      endDate: addMonths(new Date(), 12),
      billingCycle: 'monthly',
      autoRenew: true,
      nextBillingDate: addMonths(new Date(), 1)
    }
  })
  log('SUBSCRIPTIONS', '  ✓ Created Admin subscription')

  log('SUBSCRIPTIONS', '✓ Created 4 subscriptions')
}

async function seedQuotaUsages(users: any[]) {
  log('QUOTA', 'Seeding quota usages...')

  const today = new Date().toISOString().split('T')[0]
  const tomorrow = addDays(new Date(), 1)
  tomorrow.setHours(0, 0, 0, 0)

  const subscribedUsers = users.filter(u => u.accountType === 'subscription')

  for (const user of subscribedUsers) {
    const dailyLimit = user.subscriptionTier === 'enterprise' ? 500 :
                       user.subscriptionTier === 'pro' ? 100 : 50

    await prisma.quotaUsage.create({
      data: {
        userId: user.id,
        quotaType: 'daily',
        period: today,
        usageCount: Math.floor(dailyLimit * 0.3), // 30% used
        quotaLimit: dailyLimit,
        resetAt: tomorrow,
        modelBreakdown: JSON.stringify({
          'wan2.2': Math.floor(dailyLimit * 0.2),
          'ffmpeg-standard': Math.floor(dailyLimit * 0.1)
        })
      }
    })
  }

  log('QUOTA', `✓ Created quota records for ${subscribedUsers.length} users`)
}

async function seedVideoMixerProjects(users: any[]) {
  log('VIDEO-MIXER', 'Seeding video mixer projects...')

  const activeUser = users.find(u => u.email === 'payg-active@lumiku.test')
  const proUser = users.find(u => u.email === 'sub-pro@lumiku.test')

  // Project 1: Complete project with videos and generations
  const project1 = await prisma.videoMixerProject.create({
    data: {
      userId: activeUser.id,
      name: 'Marketing Campaign Videos',
      description: 'Product showcase videos for Q4 campaign',
      createdAt: subDays(new Date(), 20)
    }
  })

  // Add videos to project 1
  await prisma.videoMixerVideo.createMany({
    data: [
      {
        projectId: project1.id,
        fileName: 'intro.mp4',
        filePath: '/uploads/videos/intro.mp4',
        fileSize: 15728640,
        duration: 5.2,
        mimeType: 'video/mp4',
        order: 0
      },
      {
        projectId: project1.id,
        fileName: 'product-demo.mp4',
        filePath: '/uploads/videos/product-demo.mp4',
        fileSize: 31457280,
        duration: 10.5,
        mimeType: 'video/mp4',
        order: 1
      },
      {
        projectId: project1.id,
        fileName: 'testimonial.mp4',
        filePath: '/uploads/videos/testimonial.mp4',
        fileSize: 26214400,
        duration: 8.3,
        mimeType: 'video/mp4',
        order: 2
      },
      {
        projectId: project1.id,
        fileName: 'cta.mp4',
        filePath: '/uploads/videos/cta.mp4',
        fileSize: 10485760,
        duration: 3.5,
        mimeType: 'video/mp4',
        order: 3
      }
    ]
  })

  // Add generation history
  await prisma.videoMixerGeneration.createMany({
    data: [
      {
        projectId: project1.id,
        userId: activeUser.id,
        totalVideos: 10,
        settings: JSON.stringify({ shuffle: true, speed: 1.0 }),
        creditUsed: 20,
        status: 'completed',
        outputPaths: JSON.stringify(['/outputs/mix-1.mp4', '/outputs/mix-2.mp4']),
        createdAt: subDays(new Date(), 15),
        completedAt: subDays(new Date(), 15)
      },
      {
        projectId: project1.id,
        userId: activeUser.id,
        totalVideos: 5,
        settings: JSON.stringify({ shuffle: true, speed: 1.2 }),
        creditUsed: 10,
        status: 'completed',
        createdAt: subDays(new Date(), 10),
        completedAt: subDays(new Date(), 10)
      }
    ]
  })

  // Project 2: Pro user project
  const project2 = await prisma.videoMixerProject.create({
    data: {
      userId: proUser.id,
      name: 'Tutorial Series',
      description: 'Educational content for YouTube',
      createdAt: subDays(new Date(), 30)
    }
  })

  log('VIDEO-MIXER', '✓ Created 2 projects with videos and generations')
}

async function seedCarouselProjects(users: any[]) {
  log('CAROUSEL', 'Seeding carousel projects...')

  const activeUser = users.find(u => u.email === 'payg-active@lumiku.test')
  const basicUser = users.find(u => u.email === 'sub-basic@lumiku.test')

  // Project 1: Marketing carousel
  const project1 = await prisma.carouselProject.create({
    data: {
      userId: activeUser.id,
      name: 'Instagram Marketing Posts',
      description: 'Product launch carousel posts',
      defaultNumSlides: 4,
      createdAt: subDays(new Date(), 25)
    }
  })

  // Add slides
  await prisma.carouselSlide.createMany({
    data: [
      {
        projectId: project1.id,
        slidePosition: 1,
        fileName: 'cover.jpg',
        filePath: '/uploads/carousel/cover.jpg',
        fileType: 'image',
        fileSize: 2097152,
        width: 1080,
        height: 1080,
        order: 0
      },
      {
        projectId: project1.id,
        slidePosition: 2,
        fileName: 'feature1.jpg',
        filePath: '/uploads/carousel/feature1.jpg',
        fileType: 'image',
        fileSize: 1835008,
        width: 1080,
        height: 1080,
        order: 0
      },
      {
        projectId: project1.id,
        slidePosition: 3,
        fileName: 'feature2.jpg',
        filePath: '/uploads/carousel/feature2.jpg',
        fileType: 'image',
        fileSize: 1966080,
        width: 1080,
        height: 1080,
        order: 0
      },
      {
        projectId: project1.id,
        slidePosition: 4,
        fileName: 'cta.jpg',
        filePath: '/uploads/carousel/cta.jpg',
        fileType: 'image',
        fileSize: 1572864,
        width: 1080,
        height: 1080,
        order: 0
      }
    ]
  })

  // Add text variations
  await prisma.carouselText.createMany({
    data: [
      {
        projectId: project1.id,
        slidePosition: 1,
        content: 'New Product Launch!',
        order: 0
      },
      {
        projectId: project1.id,
        slidePosition: 1,
        content: 'Exciting New Release!',
        order: 1
      },
      {
        projectId: project1.id,
        slidePosition: 2,
        content: 'Feature: Fast Performance',
        order: 0
      },
      {
        projectId: project1.id,
        slidePosition: 3,
        content: 'Feature: Easy to Use',
        order: 0
      },
      {
        projectId: project1.id,
        slidePosition: 4,
        content: 'Get 20% Off Now!',
        order: 0
      }
    ]
  })

  // Add generation
  await prisma.carouselGeneration.create({
    data: {
      projectId: project1.id,
      userId: activeUser.id,
      status: 'completed',
      numSlides: 4,
      numSetsGenerated: 10,
      creditUsed: 10,
      outputPath: '/outputs/carousel-set-1.zip',
      createdAt: subDays(new Date(), 20),
      completedAt: subDays(new Date(), 20)
    }
  })

  log('CAROUSEL', '✓ Created 1 project with slides, texts, and generations')
}

async function seedLoopingFlowProjects(users: any[]) {
  log('LOOPING-FLOW', 'Seeding looping flow projects...')

  const proUser = users.find(u => u.email === 'sub-pro@lumiku.test')

  const project = await prisma.loopingFlowProject.create({
    data: {
      userId: proUser.id,
      name: 'Background Video Loops',
      description: 'Seamless loops for website backgrounds',
      createdAt: subDays(new Date(), 18)
    }
  })

  // Add video
  const video = await prisma.loopingFlowVideo.create({
    data: {
      projectId: project.id,
      fileName: 'particles.mp4',
      filePath: '/uploads/looping/particles.mp4',
      fileSize: 20971520,
      duration: 8.5,
      mimeType: 'video/mp4'
    }
  })

  // Add generation
  await prisma.loopingFlowGeneration.create({
    data: {
      projectId: project.id,
      userId: proUser.id,
      videoId: video.id,
      targetDuration: 30,
      creditUsed: 6,
      status: 'completed',
      outputPath: '/outputs/loop-1.mp4',
      loopStyle: 'crossfade',
      crossfadeDuration: 1.5,
      createdAt: subDays(new Date(), 17),
      completedAt: subDays(new Date(), 17)
    }
  })

  log('LOOPING-FLOW', '✓ Created 1 project with video and generation')
}

async function seedAvatarProjects(users: any[]) {
  log('AVATAR', 'Seeding avatar projects...')

  const enterpriseUser = users.find(u => u.email === 'sub-enterprise@lumiku.test')
  const proUser = users.find(u => u.email === 'sub-pro@lumiku.test')

  // Project 1: Enterprise user avatars
  const project1 = await prisma.avatarProject.create({
    data: {
      userId: enterpriseUser.id,
      name: 'Company Team Avatars',
      description: 'Professional avatars for team members',
      createdAt: subDays(new Date(), 40)
    }
  })

  // Add avatars
  await prisma.avatar.createMany({
    data: [
      {
        userId: enterpriseUser.id,
        projectId: project1.id,
        name: 'CEO Avatar',
        baseImageUrl: '/avatars/ceo.png',
        thumbnailUrl: '/avatars/thumbnails/ceo.jpg',
        gender: 'male',
        ageRange: '40-50',
        style: 'professional',
        sourceType: 'text_to_image',
        generationPrompt: 'Professional male CEO in business suit',
        usageCount: 25,
        lastUsedAt: subDays(new Date(), 2)
      },
      {
        userId: enterpriseUser.id,
        projectId: project1.id,
        name: 'Marketing Manager',
        baseImageUrl: '/avatars/marketing.png',
        thumbnailUrl: '/avatars/thumbnails/marketing.jpg',
        gender: 'female',
        ageRange: '30-40',
        style: 'professional',
        sourceType: 'text_to_image',
        generationPrompt: 'Professional female marketing manager',
        usageCount: 18,
        lastUsedAt: subDays(new Date(), 5)
      }
    ]
  })

  // Add avatar presets
  await prisma.avatarPreset.createMany({
    data: [
      {
        name: 'Business Professional',
        previewImageUrl: '/presets/business.jpg',
        category: 'business',
        personaTemplate: JSON.stringify({ formal: true, professional: true }),
        visualAttributes: JSON.stringify({ attire: 'suit', background: 'office' }),
        generationPrompt: 'Professional business person in formal attire',
        isPublic: true,
        usageCount: 150
      },
      {
        name: 'Creative Designer',
        previewImageUrl: '/presets/creative.jpg',
        category: 'creative',
        personaTemplate: JSON.stringify({ creative: true, modern: true }),
        visualAttributes: JSON.stringify({ attire: 'casual', background: 'studio' }),
        generationPrompt: 'Creative designer in modern casual wear',
        isPublic: true,
        usageCount: 89
      }
    ]
  })

  log('AVATAR', '✓ Created avatar projects, avatars, and presets')
}

async function seedModelUsages(users: any[]) {
  log('MODEL-USAGE', 'Seeding model usage history...')

  const activeUser = users.find(u => u.email === 'payg-active@lumiku.test')
  const proUser = users.find(u => u.email === 'sub-pro@lumiku.test')

  // PAYG user model usage (credit-based)
  await prisma.modelUsage.createMany({
    data: [
      {
        userId: activeUser.id,
        appId: 'video-mixer',
        modelKey: 'video-mixer:ffmpeg-standard',
        usageType: 'credit',
        creditUsed: 20,
        quotaUsed: null,
        action: 'generate_mix',
        metadata: JSON.stringify({ videos: 10, duration: 45 }),
        createdAt: subDays(new Date(), 15)
      },
      {
        userId: activeUser.id,
        appId: 'avatar-creator',
        modelKey: 'avatar-creator:flux-dev-standard',
        usageType: 'credit',
        creditUsed: 10,
        quotaUsed: null,
        action: 'generate_avatar',
        metadata: JSON.stringify({ resolution: '512x512' }),
        createdAt: subDays(new Date(), 5)
      }
    ]
  })

  // Pro user model usage (quota-based)
  await prisma.modelUsage.createMany({
    data: [
      {
        userId: proUser.id,
        appId: 'video-mixer',
        modelKey: 'video-mixer:ffmpeg-standard',
        usageType: 'quota',
        creditUsed: null,
        quotaUsed: 5,
        action: 'generate_mix',
        metadata: JSON.stringify({ videos: 15, duration: 60 }),
        createdAt: subDays(new Date(), 10)
      },
      {
        userId: proUser.id,
        appId: 'looping-flow',
        modelKey: 'looping-flow:ffmpeg-loop',
        usageType: 'quota',
        creditUsed: null,
        quotaUsed: 3,
        action: 'create_loop',
        metadata: JSON.stringify({ duration: 30 }),
        createdAt: subDays(new Date(), 8)
      }
    ]
  })

  log('MODEL-USAGE', '✓ Created model usage records')
}

async function seedPayments(users: any[]) {
  log('PAYMENTS', 'Seeding payment history...')

  const activeUser = users.find(u => u.email === 'payg-active@lumiku.test')

  await prisma.payment.createMany({
    data: [
      {
        userId: activeUser.id,
        merchantOrderId: 'ORDER-2025-10-001',
        reference: 'DUITKU-TEST-001',
        amount: 100000,
        creditAmount: 1000,
        status: 'success',
        paymentMethod: 'credit_card',
        paymentUrl: 'https://duitku.com/payment/test-001',
        duitkuData: JSON.stringify({ transactionId: 'TXN-001' }),
        createdAt: subMonths(new Date(), 1)
      },
      {
        userId: activeUser.id,
        merchantOrderId: 'ORDER-2025-10-002',
        reference: 'DUITKU-TEST-002',
        amount: 50000,
        creditAmount: 500,
        status: 'success',
        paymentMethod: 'bank_transfer',
        paymentUrl: 'https://duitku.com/payment/test-002',
        duitkuData: JSON.stringify({ transactionId: 'TXN-002' }),
        createdAt: subDays(new Date(), 20)
      },
      {
        userId: activeUser.id,
        merchantOrderId: 'ORDER-2025-10-003',
        reference: 'DUITKU-TEST-003',
        amount: 200000,
        creditAmount: 2000,
        status: 'pending',
        paymentMethod: 'qris',
        paymentUrl: 'https://duitku.com/payment/test-003',
        createdAt: subDays(new Date(), 1)
      }
    ]
  })

  log('PAYMENTS', '✓ Created payment records')
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function main() {
  console.log('')
  console.log('================================================================================')
  console.log('🌱 COMPREHENSIVE SEED DATA FOR LUMIKU')
  console.log('================================================================================')
  console.log('')

  try {
    // Clear existing data (optional - comment out if you want to keep existing data)
    log('CLEANUP', 'Clearing existing test data...')
    await prisma.modelUsage.deleteMany({})
    await prisma.quotaUsage.deleteMany({})
    await prisma.subscription.deleteMany({})
    await prisma.avatarUsageHistory.deleteMany({})
    await prisma.avatarGeneration.deleteMany({})
    await prisma.avatar.deleteMany({})
    await prisma.avatarProject.deleteMany({})
    await prisma.avatarPreset.deleteMany({})
    await prisma.loopingFlowAudioLayer.deleteMany({})
    await prisma.loopingFlowGeneration.deleteMany({})
    await prisma.loopingFlowVideo.deleteMany({})
    await prisma.loopingFlowProject.deleteMany({})
    await prisma.carouselGeneration.deleteMany({})
    await prisma.carouselPositionSettings.deleteMany({})
    await prisma.carouselText.deleteMany({})
    await prisma.carouselSlide.deleteMany({})
    await prisma.carouselProject.deleteMany({})
    await prisma.videoMixerGeneration.deleteMany({})
    await prisma.videoMixerVideo.deleteMany({})
    await prisma.videoMixerGroup.deleteMany({})
    await prisma.videoMixerProject.deleteMany({})
    await prisma.appUsage.deleteMany({})
    await prisma.payment.deleteMany({})
    await prisma.credit.deleteMany({})
    await prisma.device.deleteMany({})
    await prisma.session.deleteMany({})
    await prisma.user.deleteMany({ where: { email: { endsWith: '@lumiku.test' } } })
    log('CLEANUP', '✓ Cleared existing test data')
    console.log('')

    // Seed in order
    await seedSubscriptionPlans()
    await seedAIModels()
    await seedApps()
    const users = await seedUsers()
    await seedSubscriptions(users)
    await seedQuotaUsages(users)
    await seedPayments(users)
    await seedVideoMixerProjects(users)
    await seedCarouselProjects(users)
    await seedLoopingFlowProjects(users)
    await seedAvatarProjects(users)
    await seedModelUsages(users)

    console.log('')
    console.log('================================================================================')
    console.log('✅ COMPREHENSIVE SEED COMPLETED SUCCESSFULLY')
    console.log('================================================================================')
    console.log('')
    console.log('Test Credentials:')
    console.log('  Password for all users: ' + TEST_PASSWORD)
    console.log('')
    console.log('Test Accounts:')
    console.log('  1. payg-free@lumiku.test      - PAYG Free user (100 credits)')
    console.log('  2. payg-active@lumiku.test    - PAYG Active user (670 credits, payment history)')
    console.log('  3. sub-basic@lumiku.test      - Basic subscription (active)')
    console.log('  4. sub-pro@lumiku.test        - Pro subscription (active)')
    console.log('  5. sub-enterprise@lumiku.test - Enterprise subscription (active)')
    console.log('  6. admin@lumiku.test          - Admin user (10000 credits)')
    console.log('')
    console.log('Test Data Includes:')
    console.log('  ✓ Subscription plans (free, basic, pro, enterprise)')
    console.log('  ✓ AI models for all apps')
    console.log('  ✓ Credit transactions and payment history')
    console.log('  ✓ Active subscriptions with quota tracking')
    console.log('  ✓ Video Mixer projects with videos and generations')
    console.log('  ✓ Carousel projects with slides and text variations')
    console.log('  ✓ Looping Flow projects with video loops')
    console.log('  ✓ Avatar projects with generated avatars')
    console.log('  ✓ Model usage history (credit & quota based)')
    console.log('  ✓ Payment records (success, pending, failed)')
    console.log('')
    console.log('================================================================================')
    console.log('')
  } catch (error) {
    console.error('❌ Seed failed:', error)
    throw error
  }
}

// Run the seed
main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
