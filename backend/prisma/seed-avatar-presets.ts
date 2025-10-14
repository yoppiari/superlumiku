import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Avatar Presets Seed Data
 *
 * Preset avatars matching AvatarPreset schema
 * Fields: name, previewImageUrl, category, personaTemplate, visualAttributes, generationPrompt, isPublic, usageCount
 */

// Helper function to create preset data matching AvatarPreset schema
function createPreset(data: {
  name: string
  category: string
  generationPrompt: string
  personaName?: string
  personaAge?: number
  personaPersonality?: string[]
  personaBackground?: string
  gender?: string
  ageRange?: string
  ethnicity?: string
  bodyType?: string
  hairStyle?: string
  hairColor?: string
  eyeColor?: string
  skinTone?: string
  style?: string
}) {
  return {
    name: data.name,
    previewImageUrl: `/presets/avatar-creator/${data.name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
    category: data.category,
    personaTemplate: JSON.stringify({
      name: data.personaName,
      age: data.personaAge,
      personality: data.personaPersonality,
      background: data.personaBackground
    }),
    visualAttributes: JSON.stringify({
      gender: data.gender,
      ageRange: data.ageRange,
      ethnicity: data.ethnicity,
      bodyType: data.bodyType,
      hairStyle: data.hairStyle,
      hairColor: data.hairColor,
      eyeColor: data.eyeColor,
      skinTone: data.skinTone,
      style: data.style
    }),
    generationPrompt: data.generationPrompt,
    isPublic: true,
    usageCount: 0
  }
}

const presets = [
  // ========================================
  // PROFESSIONAL (5 presets)
  // ========================================
  createPreset({
    name: 'Professional Business Woman',
    category: 'professional',
    generationPrompt: 'professional portrait of confident Asian business woman in elegant blazer, modern office setting',
    personaName: 'Sarah Chen',
    personaAge: 32,
    personaPersonality: ['professional', 'confident', 'approachable'],
    personaBackground: 'Senior Marketing Executive with 10 years experience',
    gender: 'female',
    ageRange: 'adult',
    ethnicity: 'east-asian',
    style: 'professional',
  }),
  createPreset({
    name: 'Professional Business Man',
    category: 'professional',
    generationPrompt: 'professional headshot of charismatic Caucasian businessman in navy suit and tie, corporate environment',
    personaName: 'James Anderson',
    personaAge: 38,
    personaPersonality: ['charismatic', 'strategic', 'professional'],
    personaBackground: 'Tech startup CEO and entrepreneur',
    gender: 'male',
    ageRange: 'adult',
    ethnicity: 'caucasian',
    style: 'formal',
  }),
  createPreset({
    name: 'Professional Hijabi Woman',
    category: 'professional',
    generationPrompt: 'professional portrait of elegant Indonesian woman with modern pastel hijab, wearing professional blazer, warm smile',
    personaName: 'Aisha Rahman',
    personaAge: 28,
    personaPersonality: ['professional', 'friendly', 'innovative'],
    personaBackground: 'Digital marketing specialist and content creator',
    gender: 'female',
    ageRange: 'young',
    ethnicity: 'southeast-asian',
    hairStyle: 'hijab',
    style: 'professional',
  }),
  createPreset({
    name: 'Healthcare Professional',
    category: 'professional',
    generationPrompt: 'professional portrait of Hispanic female doctor in white coat, stethoscope, warm caring expression, medical office',
    personaName: 'Dr. Sofia Martinez',
    personaAge: 35,
    personaPersonality: ['caring', 'professional', 'knowledgeable'],
    personaBackground: 'General practitioner with focus on family medicine',
    gender: 'female',
    ageRange: 'adult',
    ethnicity: 'hispanic',
    style: 'medical',
  }),
  createPreset({
    name: 'Creative Professional',
    category: 'professional',
    generationPrompt: 'professional portrait of African American creative designer in modern casual attire, artistic studio backdrop',
    personaName: 'Maya Johnson',
    personaAge: 29,
    personaPersonality: ['creative', 'expressive', 'innovative'],
    personaBackground: 'UX/UI designer and digital artist',
    gender: 'female',
    ageRange: 'young',
    ethnicity: 'african',
    style: 'creative-casual',
  }),

  // ========================================
  // CASUAL (5 presets)
  // ========================================
  createPreset({
    name: 'Casual Young Man',
    category: 'casual',
    generationPrompt: 'casual portrait of friendly Caucasian young man in t-shirt and jeans, relaxed smile, outdoor setting',
    personaName: 'Alex Thompson',
    personaAge: 24,
    personaPersonality: ['friendly', 'laid-back', 'sociable'],
    personaBackground: 'College graduate and aspiring entrepreneur',
    gender: 'male',
    ageRange: 'young',
    ethnicity: 'caucasian',
    style: 'casual',
  }),
  createPreset({
    name: 'Casual Young Woman',
    category: 'casual',
    generationPrompt: 'casual portrait of cheerful Asian young woman in cozy sweater, genuine smile, natural lighting',
    personaName: 'Emily Park',
    personaAge: 22,
    personaPersonality: ['cheerful', 'energetic', 'friendly'],
    personaBackground: 'University student and part-time barista',
    gender: 'female',
    ageRange: 'young',
    ethnicity: 'east-asian',
    style: 'casual',
  }),
  createPreset({
    name: 'Casual Hijabi Student',
    category: 'casual',
    generationPrompt: 'casual portrait of cheerful Indonesian student with colorful hijab, casual sweater, friendly smile, campus backdrop',
    personaName: 'Dina Kartika',
    personaAge: 20,
    personaPersonality: ['cheerful', 'studious', 'friendly'],
    personaBackground: 'Computer science student and tech enthusiast',
    gender: 'female',
    ageRange: 'young',
    ethnicity: 'southeast-asian',
    hairStyle: 'hijab',
    style: 'casual',
  }),
  createPreset({
    name: 'Casual Artist',
    category: 'casual',
    generationPrompt: 'casual portrait of creative Hispanic woman artist in bohemian style, long flowing hair, artistic expression',
    personaName: 'Isabella Rodriguez',
    personaAge: 30,
    personaPersonality: ['creative', 'free-spirited', 'artistic'],
    personaBackground: 'Freelance illustrator and painter',
    gender: 'female',
    ageRange: 'adult',
    ethnicity: 'hispanic',
    style: 'bohemian',
  }),
  createPreset({
    name: 'Casual Retiree',
    category: 'casual',
    generationPrompt: 'casual portrait of active Caucasian senior woman in comfortable cardigan, warm smile, natural outdoor lighting',
    personaName: 'Helen White',
    personaAge: 65,
    personaPersonality: ['warm', 'active', 'nurturing'],
    personaBackground: 'Retired teacher and volunteer community organizer',
    gender: 'female',
    ageRange: 'mature',
    ethnicity: 'caucasian',
    style: 'casual-comfortable',
  }),

  // ========================================
  // SPORTS (3 presets)
  // ========================================
  createPreset({
    name: 'Athletic Runner',
    category: 'sports',
    generationPrompt: 'athletic portrait of fit Asian male runner in running gear, determined expression, outdoor athletic setting',
    personaName: 'Ken Tanaka',
    personaAge: 28,
    personaPersonality: ['determined', 'disciplined', 'energetic'],
    personaBackground: 'Marathon runner and fitness coach',
    gender: 'male',
    ageRange: 'young',
    ethnicity: 'east-asian',
    bodyType: 'athletic',
    style: 'athletic',
  }),
  createPreset({
    name: 'Fitness Instructor',
    category: 'sports',
    generationPrompt: 'athletic portrait of strong Hispanic female fitness instructor in gym wear, confident pose, gym environment',
    personaName: 'Carmen Silva',
    personaAge: 31,
    personaPersonality: ['motivated', 'strong', 'inspiring'],
    personaBackground: 'Personal trainer and nutrition coach',
    gender: 'female',
    ageRange: 'adult',
    ethnicity: 'hispanic',
    bodyType: 'athletic-toned',
    style: 'athletic',
  }),
  createPreset({
    name: 'Yoga Instructor',
    category: 'sports',
    generationPrompt: 'serene portrait of Indian female yoga instructor in yoga attire, peaceful expression, studio setting',
    personaName: 'Priya Sharma',
    personaAge: 34,
    personaPersonality: ['calm', 'balanced', 'mindful'],
    personaBackground: 'Certified yoga instructor and wellness coach',
    gender: 'female',
    ageRange: 'adult',
    ethnicity: 'south-asian',
    bodyType: 'athletic',
    style: 'athletic-yoga',
  }),

  // ========================================
  // FASHION (3 presets)
  // ========================================
  createPreset({
    name: 'Fashion Model',
    category: 'fashion',
    generationPrompt: 'high fashion portrait of elegant Caucasian female model in designer clothing, professional makeup, studio lighting',
    personaName: 'Victoria Sterling',
    personaAge: 25,
    personaPersonality: ['confident', 'elegant', 'poised'],
    personaBackground: 'International fashion model and brand ambassador',
    gender: 'female',
    ageRange: 'young',
    ethnicity: 'caucasian',
    bodyType: 'slim-tall',
    style: 'high-fashion',
  }),
  createPreset({
    name: 'Street Fashion',
    category: 'fashion',
    generationPrompt: 'trendy portrait of Korean young man in street fashion, modern hairstyle, urban backdrop',
    personaName: 'Jae Park',
    personaAge: 23,
    personaPersonality: ['trendy', 'confident', 'creative'],
    personaBackground: 'Fashion blogger and style influencer',
    gender: 'male',
    ageRange: 'young',
    ethnicity: 'east-asian',
    bodyType: 'slim',
    style: 'street-fashion',
  }),
  createPreset({
    name: 'Modest Fashion',
    category: 'fashion',
    generationPrompt: 'elegant portrait of Middle Eastern woman in designer modest fashion, luxury hijab, sophisticated style',
    personaName: 'Amira Al-Farsi',
    personaAge: 27,
    personaPersonality: ['elegant', 'sophisticated', 'confident'],
    personaBackground: 'Modest fashion designer and influencer',
    gender: 'female',
    ageRange: 'young',
    ethnicity: 'middle-eastern',
    hairStyle: 'hijab-luxury',
    style: 'modest-luxury',
  }),

  // ========================================
  // TRADITIONAL (3 presets)
  // ========================================
  createPreset({
    name: 'Traditional Indonesian',
    category: 'traditional',
    generationPrompt: 'elegant portrait of Indonesian woman in traditional batik kebaya, graceful expression, cultural backdrop',
    personaName: 'Siti Nurhaliza',
    personaAge: 35,
    personaPersonality: ['graceful', 'cultured', 'elegant'],
    personaBackground: 'Traditional dance instructor and cultural ambassador',
    gender: 'female',
    ageRange: 'adult',
    ethnicity: 'southeast-asian',
    style: 'traditional-indonesian',
  }),
  createPreset({
    name: 'Traditional Indian',
    category: 'traditional',
    generationPrompt: 'elegant portrait of Indian woman in traditional silk saree, jewelry, graceful pose, cultural setting',
    personaName: 'Lakshmi Devi',
    personaAge: 32,
    personaPersonality: ['graceful', 'traditional', 'elegant'],
    personaBackground: 'Classical dancer and cultural educator',
    gender: 'female',
    ageRange: 'adult',
    ethnicity: 'south-asian',
    style: 'traditional-indian',
  }),
  createPreset({
    name: 'Traditional Japanese',
    category: 'traditional',
    generationPrompt: 'elegant portrait of Japanese woman in traditional kimono, graceful expression, serene Japanese garden backdrop',
    personaName: 'Yuki Nakamura',
    personaAge: 30,
    personaPersonality: ['serene', 'graceful', 'traditional'],
    personaBackground: 'Tea ceremony master and cultural preservationist',
    gender: 'female',
    ageRange: 'adult',
    ethnicity: 'east-asian',
    style: 'traditional-japanese',
  }),
]

async function seedAvatarPresets() {
  console.log('🌱 Starting avatar presets seed...')

  try {
    // Check if presets already exist
    const existingCount = await prisma.avatarPreset.count()

    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing presets`)
      console.log('⚠️  Skipping seed to avoid duplicates')
      console.log('💡 To re-seed, delete existing presets first:')
      console.log('   npx prisma studio -> Delete all AvatarPreset records')
      return
    }

    // Insert all presets
    console.log(`📦 Inserting ${presets.length} preset avatars...`)

    for (const preset of presets) {
      await prisma.avatarPreset.create({
        data: preset,
      })
      console.log(`  ✅ ${preset.name} (${preset.category})`)
    }

    console.log('\n✨ Avatar presets seed completed!')
    console.log(`📊 Total presets: ${presets.length}`)
    console.log('📊 By category:')
    console.log(`   Professional: ${presets.filter(p => p.category === 'professional').length}`)
    console.log(`   Casual: ${presets.filter(p => p.category === 'casual').length}`)
    console.log(`   Sports: ${presets.filter(p => p.category === 'sports').length}`)
    console.log(`   Fashion: ${presets.filter(p => p.category === 'fashion').length}`)
    console.log(`   Traditional: ${presets.filter(p => p.category === 'traditional').length}`)

    console.log('\n⚠️  Note: Preset images are placeholders')
    console.log('   Generate real images by running:')
    console.log('   npm run generate-preset-images')

  } catch (error) {
    console.error('❌ Error seeding presets:', error)
    throw error
  }
}

// Run seed
seedAvatarPresets()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
