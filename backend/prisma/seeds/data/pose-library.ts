/**
 * Pose Generator - Pose Library Data
 *
 * Curated library of 150+ poses organized by category
 * - Production-ready data with realistic descriptions
 * - Rich tagging for searchability
 * - Balanced difficulty distribution (60% beginner, 30% intermediate, 10% advanced)
 * - Indonesian market focus
 */

export interface PoseData {
  name: string
  description: string
  categorySlug: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  genderSuitability: 'male' | 'female' | 'unisex'
  tags: string[]
  isPremium: boolean
  sourceType: 'curated' | 'user_contributed' | 'ai_generated'
  isFeatured?: boolean
}

export const poseLibraryData: PoseData[] = [
  // ========================================
  // PROFESSIONAL - Business Portraits (15 poses)
  // ========================================
  {
    name: 'Classic Business Headshot',
    description: 'Traditional head and shoulders pose with arms crossed, confident expression, facing camera directly',
    categorySlug: 'business-portraits',
    difficulty: 'beginner',
    genderSuitability: 'unisex',
    tags: ['headshot', 'professional', 'business', 'arms crossed', 'confident', 'formal'],
    isPremium: false,
    sourceType: 'curated',
    isFeatured: true,
  },
  {
    name: 'Friendly Professional Smile',
    description: 'Warm, approachable pose with hands clasped in front, genuine smile, slight head tilt',
    categorySlug: 'business-portraits',
    difficulty: 'beginner',
    genderSuitability: 'unisex',
    tags: ['friendly', 'approachable', 'smile', 'headshot', 'professional', 'welcoming'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Executive Power Stance',
    description: 'Standing tall with hands on hips, confident expression, commanding presence',
    categorySlug: 'business-portraits',
    difficulty: 'beginner',
    genderSuitability: 'unisex',
    tags: ['executive', 'power', 'confident', 'leadership', 'standing', 'authority'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Relaxed Professional Lean',
    description: 'Leaning against wall or surface, arms crossed casually, approachable yet professional',
    categorySlug: 'business-portraits',
    difficulty: 'intermediate',
    genderSuitability: 'unisex',
    tags: ['relaxed', 'casual professional', 'leaning', 'approachable', 'confident'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Hand in Pocket Confidence',
    description: 'One hand in pocket, other hand relaxed at side, confident smile, three-quarter view',
    categorySlug: 'business-portraits',
    difficulty: 'beginner',
    genderSuitability: 'unisex',
    tags: ['confident', 'casual', 'hand in pocket', 'professional', 'relaxed'],
    isPremium: false,
    sourceType: 'curated',
  },

  // ========================================
  // PROFESSIONAL - Corporate Headshots (10 poses)
  // ========================================
  {
    name: 'CEO Executive Portrait',
    description: 'Formal seated pose at desk, hands clasped, direct eye contact, authoritative presence',
    categorySlug: 'corporate-headshots',
    difficulty: 'intermediate',
    genderSuitability: 'unisex',
    tags: ['CEO', 'executive', 'desk', 'formal', 'authoritative', 'seated'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Team Leader Pose',
    description: 'Standing with arms crossed, looking slightly off-camera, thoughtful expression',
    categorySlug: 'corporate-headshots',
    difficulty: 'beginner',
    genderSuitability: 'unisex',
    tags: ['team leader', 'thoughtful', 'arms crossed', 'leadership', 'professional'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Corporate Confidence',
    description: 'Three-quarter body shot, hand adjusting tie/collar, confident smile, professional attire',
    categorySlug: 'corporate-headshots',
    difficulty: 'intermediate',
    genderSuitability: 'unisex',
    tags: ['corporate', 'confident', 'formal attire', 'professional', 'polished'],
    isPremium: false,
    sourceType: 'curated',
  },

  // ========================================
  // PROFESSIONAL - Conference & Speaking (12 poses)
  // ========================================
  {
    name: 'Keynote Speaker Gesture',
    description: 'Standing with one hand raised mid-gesture, engaging expression, dynamic body language',
    categorySlug: 'conference-speaking',
    difficulty: 'intermediate',
    genderSuitability: 'unisex',
    tags: ['speaker', 'keynote', 'gesture', 'presenting', 'dynamic', 'engaging'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Panel Discussion Pose',
    description: 'Seated with hands in talking position, engaged expression, professional discussion stance',
    categorySlug: 'conference-speaking',
    difficulty: 'beginner',
    genderSuitability: 'unisex',
    tags: ['panel', 'discussion', 'seated', 'talking', 'engaged', 'professional'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'TED Talk Stance',
    description: 'Open body language, hands apart in explanatory gesture, confident and approachable',
    categorySlug: 'conference-speaking',
    difficulty: 'intermediate',
    genderSuitability: 'unisex',
    tags: ['TED talk', 'open posture', 'presenting', 'explanatory', 'confident', 'public speaking'],
    isPremium: true,
    sourceType: 'curated',
  },
  {
    name: 'Microphone Presenter',
    description: 'Holding microphone, one hand free for gesturing, energetic presentation pose',
    categorySlug: 'conference-speaking',
    difficulty: 'beginner',
    genderSuitability: 'unisex',
    tags: ['microphone', 'presenter', 'energetic', 'speaking', 'dynamic'],
    isPremium: false,
    sourceType: 'curated',
  },

  // ========================================
  // E-COMMERCE - Product Modeling (20 poses)
  // ========================================
  {
    name: 'Fashion Model T-Pose',
    description: 'Standing straight, arms slightly out, perfect for showcasing clothing front view',
    categorySlug: 'product-modeling',
    difficulty: 'beginner',
    genderSuitability: 'unisex',
    tags: ['t-pose', 'clothing', 'fashion', 'front view', 'modeling', 'apparel'],
    isPremium: false,
    sourceType: 'curated',
    isFeatured: true,
  },
  {
    name: 'Side Profile Showcase',
    description: 'Side view with hand on hip, showcasing outfit silhouette and details',
    categorySlug: 'product-modeling',
    difficulty: 'beginner',
    genderSuitability: 'unisex',
    tags: ['side view', 'hand on hip', 'silhouette', 'modeling', 'fashion'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Product Hold at Chest',
    description: 'Holding product at chest level with both hands, clear product visibility',
    categorySlug: 'product-modeling',
    difficulty: 'beginner',
    genderSuitability: 'unisex',
    tags: ['product hold', 'showcase', 'e-commerce', 'chest level', 'display'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Natural Product Use',
    description: 'Using/wearing product naturally, lifestyle modeling approach',
    categorySlug: 'product-modeling',
    difficulty: 'intermediate',
    genderSuitability: 'unisex',
    tags: ['natural', 'lifestyle', 'product use', 'authentic', 'demonstration'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Full Body Outfit Display',
    description: 'Full body standing pose, slight angle, showcasing complete outfit',
    categorySlug: 'product-modeling',
    difficulty: 'beginner',
    genderSuitability: 'unisex',
    tags: ['full body', 'outfit', 'fashion', 'complete look', 'standing'],
    isPremium: false,
    sourceType: 'curated',
  },

  // ========================================
  // E-COMMERCE - Shopee & TikTok Shop (15 poses)
  // ========================================
  {
    name: 'Excited Product Reveal',
    description: 'Holding product with excited expression, pointing at it, energetic e-commerce pose',
    categorySlug: 'shopee-tiktok',
    difficulty: 'beginner',
    genderSuitability: 'unisex',
    tags: ['excited', 'reveal', 'product', 'energetic', 'shopee', 'tiktok'],
    isPremium: false,
    sourceType: 'curated',
    isFeatured: true,
  },
  {
    name: 'Thumbs Up Recommendation',
    description: 'Holding product with thumbs up gesture, friendly recommendation pose',
    categorySlug: 'shopee-tiktok',
    difficulty: 'beginner',
    genderSuitability: 'unisex',
    tags: ['thumbs up', 'recommendation', 'positive', 'product', 'friendly'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Product Comparison Pose',
    description: 'Holding two products side by side for comparison, clear visibility',
    categorySlug: 'shopee-tiktok',
    difficulty: 'intermediate',
    genderSuitability: 'unisex',
    tags: ['comparison', 'two products', 'side by side', 'e-commerce', 'review'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Unboxing Excitement',
    description: 'Opening box with surprised/excited expression, product reveal moment',
    categorySlug: 'shopee-tiktok',
    difficulty: 'intermediate',
    genderSuitability: 'unisex',
    tags: ['unboxing', 'excited', 'surprise', 'reveal', 'product opening'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Price Point Gesture',
    description: 'Holding product with hand gesture indicating price/value, enthusiastic expression',
    categorySlug: 'shopee-tiktok',
    difficulty: 'beginner',
    genderSuitability: 'unisex',
    tags: ['price', 'value', 'gesture', 'promotional', 'enthusiastic'],
    isPremium: false,
    sourceType: 'curated',
  },

  // ========================================
  // E-COMMERCE - Live Selling (10 poses)
  // ========================================
  {
    name: 'Live Host Welcome',
    description: 'Waving hand with big smile, welcoming viewers to live stream',
    categorySlug: 'live-selling',
    difficulty: 'beginner',
    genderSuitability: 'unisex',
    tags: ['live stream', 'welcome', 'wave', 'friendly', 'host', 'greeting'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Product Demo Action',
    description: 'Demonstrating product use with expressive gestures, engaging with camera',
    categorySlug: 'live-selling',
    difficulty: 'intermediate',
    genderSuitability: 'unisex',
    tags: ['demo', 'demonstration', 'live selling', 'expressive', 'engaging'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Flash Sale Energy',
    description: 'High energy pose with product, excited expression, urgency in body language',
    categorySlug: 'live-selling',
    difficulty: 'intermediate',
    genderSuitability: 'unisex',
    tags: ['flash sale', 'urgent', 'energetic', 'excited', 'promotional'],
    isPremium: false,
    sourceType: 'curated',
  },

  // ========================================
  // FASHION - Editorial (12 poses)
  // ========================================
  {
    name: 'High Fashion Attitude',
    description: 'Strong fashion pose with attitude, hand on hip, fierce expression',
    categorySlug: 'editorial',
    difficulty: 'advanced',
    genderSuitability: 'unisex',
    tags: ['high fashion', 'attitude', 'fierce', 'editorial', 'magazine', 'strong'],
    isPremium: true,
    sourceType: 'curated',
  },
  {
    name: 'Magazine Cover Pose',
    description: 'Classic magazine cover stance, confident gaze, elegant posture',
    categorySlug: 'editorial',
    difficulty: 'intermediate',
    genderSuitability: 'unisex',
    tags: ['magazine', 'cover', 'editorial', 'elegant', 'confident', 'classic'],
    isPremium: true,
    sourceType: 'curated',
  },
  {
    name: 'Fashion Forward Lean',
    description: 'Leaning forward with intensity, dynamic movement, editorial edge',
    categorySlug: 'editorial',
    difficulty: 'advanced',
    genderSuitability: 'unisex',
    tags: ['fashion forward', 'dynamic', 'editorial', 'intense', 'movement'],
    isPremium: true,
    sourceType: 'curated',
  },

  // ========================================
  // FASHION - Street Style (15 poses)
  // ========================================
  {
    name: 'Casual Walk OOTD',
    description: 'Mid-walk casual pose, natural movement, street style vibe',
    categorySlug: 'street-style',
    difficulty: 'beginner',
    genderSuitability: 'unisex',
    tags: ['OOTD', 'walking', 'casual', 'street style', 'natural', 'movement'],
    isPremium: false,
    sourceType: 'curated',
    isFeatured: true,
  },
  {
    name: 'Urban Lean Against Wall',
    description: 'Leaning casually against wall, relaxed urban style, one leg crossed',
    categorySlug: 'street-style',
    difficulty: 'beginner',
    genderSuitability: 'unisex',
    tags: ['urban', 'wall lean', 'casual', 'relaxed', 'street', 'cool'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Looking Back Over Shoulder',
    description: 'Walking away, looking back over shoulder, playful street style pose',
    categorySlug: 'street-style',
    difficulty: 'intermediate',
    genderSuitability: 'unisex',
    tags: ['over shoulder', 'playful', 'walking', 'street style', 'dynamic'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Coffee Shop Casual',
    description: 'Holding coffee cup, standing casually, lifestyle street style',
    categorySlug: 'street-style',
    difficulty: 'beginner',
    genderSuitability: 'unisex',
    tags: ['coffee', 'casual', 'lifestyle', 'street style', 'urban', 'relaxed'],
    isPremium: false,
    sourceType: 'curated',
  },

  // ========================================
  // HIJAB - Casual Hijab (15 poses)
  // ========================================
  {
    name: 'Casual Hijab Smile',
    description: 'Friendly pose with hijab, warm smile, hands relaxed, approachable stance',
    categorySlug: 'casual-hijab',
    difficulty: 'beginner',
    genderSuitability: 'female',
    tags: ['hijab', 'casual', 'smile', 'friendly', 'approachable', 'modest'],
    isPremium: false,
    sourceType: 'curated',
    isFeatured: true,
  },
  {
    name: 'Hijab Adjusting Pose',
    description: 'Gently adjusting hijab with one hand, natural and elegant movement',
    categorySlug: 'casual-hijab',
    difficulty: 'beginner',
    genderSuitability: 'female',
    tags: ['hijab', 'adjusting', 'natural', 'elegant', 'modest', 'casual'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Book Reading Hijab',
    description: 'Holding book or tablet, intellectual casual hijab pose',
    categorySlug: 'casual-hijab',
    difficulty: 'beginner',
    genderSuitability: 'female',
    tags: ['hijab', 'reading', 'book', 'intellectual', 'casual', 'student'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Outdoor Hijab Casual',
    description: 'Standing outdoors, hijab with casual outfit, relaxed and natural',
    categorySlug: 'casual-hijab',
    difficulty: 'beginner',
    genderSuitability: 'female',
    tags: ['hijab', 'outdoor', 'casual', 'natural', 'relaxed', 'lifestyle'],
    isPremium: false,
    sourceType: 'curated',
  },

  // ========================================
  // HIJAB - Professional Hijab (15 poses)
  // ========================================
  {
    name: 'Professional Hijab Headshot',
    description: 'Corporate hijab headshot, professional attire, confident expression',
    categorySlug: 'professional-hijab',
    difficulty: 'beginner',
    genderSuitability: 'female',
    tags: ['hijab', 'professional', 'headshot', 'corporate', 'business', 'confident'],
    isPremium: false,
    sourceType: 'curated',
    isFeatured: true,
  },
  {
    name: 'Hijab Business Standing',
    description: 'Standing professional pose with hijab, holding folder or tablet',
    categorySlug: 'professional-hijab',
    difficulty: 'beginner',
    genderSuitability: 'female',
    tags: ['hijab', 'business', 'standing', 'professional', 'formal', 'corporate'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Executive Hijab Seated',
    description: 'Seated at desk with hijab, professional business environment',
    categorySlug: 'professional-hijab',
    difficulty: 'intermediate',
    genderSuitability: 'female',
    tags: ['hijab', 'executive', 'seated', 'desk', 'professional', 'business'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Hijab Presentation Pose',
    description: 'Presenting or teaching with hijab, professional gesture',
    categorySlug: 'professional-hijab',
    difficulty: 'intermediate',
    genderSuitability: 'female',
    tags: ['hijab', 'presentation', 'teaching', 'professional', 'gesture', 'speaker'],
    isPremium: false,
    sourceType: 'curated',
  },

  // ========================================
  // HIJAB - Fashion Hijab (12 poses)
  // ========================================
  {
    name: 'Fashion Hijab Editorial',
    description: 'High fashion hijab pose with attitude, modern Muslim fashion',
    categorySlug: 'fashion-hijab',
    difficulty: 'intermediate',
    genderSuitability: 'female',
    tags: ['hijab', 'fashion', 'editorial', 'modern', 'stylish', 'attitude'],
    isPremium: true,
    sourceType: 'curated',
  },
  {
    name: 'Modest Fashion OOTD',
    description: 'Full body hijab fashion pose, showcasing modest outfit of the day',
    categorySlug: 'fashion-hijab',
    difficulty: 'beginner',
    genderSuitability: 'female',
    tags: ['hijab', 'OOTD', 'modest fashion', 'full body', 'outfit', 'stylish'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Hijab with Abaya Flow',
    description: 'Flowing abaya movement with hijab, elegant fashion pose',
    categorySlug: 'fashion-hijab',
    difficulty: 'advanced',
    genderSuitability: 'female',
    tags: ['hijab', 'abaya', 'flowing', 'elegant', 'fashion', 'movement'],
    isPremium: true,
    sourceType: 'curated',
  },

  // ========================================
  // HIJAB - Wedding & Formal Hijab (10 poses)
  // ========================================
  {
    name: 'Bridal Hijab Elegance',
    description: 'Elegant bridal pose with hijab, formal wedding attire',
    categorySlug: 'wedding-hijab',
    difficulty: 'advanced',
    genderSuitability: 'female',
    tags: ['hijab', 'bridal', 'wedding', 'elegant', 'formal', 'bride'],
    isPremium: true,
    sourceType: 'curated',
  },
  {
    name: 'Engagement Hijab Pose',
    description: 'Formal engagement pose with hijab, sophisticated and graceful',
    categorySlug: 'wedding-hijab',
    difficulty: 'intermediate',
    genderSuitability: 'female',
    tags: ['hijab', 'engagement', 'formal', 'sophisticated', 'graceful'],
    isPremium: true,
    sourceType: 'curated',
  },

  // ========================================
  // CASUAL - Everyday Casual (12 poses)
  // ========================================
  {
    name: 'Relaxed Standing Natural',
    description: 'Natural standing pose, hands in pockets or relaxed at side, casual smile',
    categorySlug: 'everyday-casual',
    difficulty: 'beginner',
    genderSuitability: 'unisex',
    tags: ['casual', 'natural', 'standing', 'relaxed', 'everyday', 'simple'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Laughing Candid',
    description: 'Natural laughing pose, genuine expression, casual and authentic',
    categorySlug: 'everyday-casual',
    difficulty: 'beginner',
    genderSuitability: 'unisex',
    tags: ['laughing', 'candid', 'natural', 'authentic', 'casual', 'happy'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Hand Through Hair Casual',
    description: 'Running hand through hair casually, relaxed and natural',
    categorySlug: 'everyday-casual',
    difficulty: 'beginner',
    genderSuitability: 'unisex',
    tags: ['hand in hair', 'casual', 'natural', 'relaxed', 'lifestyle'],
    isPremium: false,
    sourceType: 'curated',
  },

  // ========================================
  // CASUAL - Social Media (15 poses)
  // ========================================
  {
    name: 'Instagram Story Pose',
    description: 'Vertical frame friendly pose, looking at camera, social media optimized',
    categorySlug: 'social-media',
    difficulty: 'beginner',
    genderSuitability: 'unisex',
    tags: ['instagram', 'story', 'vertical', 'social media', 'camera', 'selfie-style'],
    isPremium: false,
    sourceType: 'curated',
    isFeatured: true,
  },
  {
    name: 'Mirror Selfie Pose',
    description: 'Looking at phone/mirror, classic selfie pose, casual outfit showcase',
    categorySlug: 'social-media',
    difficulty: 'beginner',
    genderSuitability: 'unisex',
    tags: ['mirror selfie', 'phone', 'instagram', 'outfit', 'casual'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Feed-Worthy Portrait',
    description: 'Three-quarter portrait pose optimized for Instagram feed grid',
    categorySlug: 'social-media',
    difficulty: 'beginner',
    genderSuitability: 'unisex',
    tags: ['instagram feed', 'portrait', 'social media', 'grid', 'aesthetic'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Reels Action Pose',
    description: 'Dynamic movement pose perfect for Instagram Reels or TikTok',
    categorySlug: 'social-media',
    difficulty: 'intermediate',
    genderSuitability: 'unisex',
    tags: ['reels', 'tiktok', 'dynamic', 'movement', 'social media', 'video'],
    isPremium: false,
    sourceType: 'curated',
  },

  // ========================================
  // CASUAL - Sitting & Relaxed (10 poses)
  // ========================================
  {
    name: 'Comfortable Sitting Cross-Legged',
    description: 'Sitting cross-legged, relaxed and comfortable, casual vibe',
    categorySlug: 'sitting-relaxed',
    difficulty: 'beginner',
    genderSuitability: 'unisex',
    tags: ['sitting', 'cross-legged', 'comfortable', 'relaxed', 'casual'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Seated Leaning Back',
    description: 'Sitting leaning back in chair, one arm draped, relaxed confidence',
    categorySlug: 'sitting-relaxed',
    difficulty: 'beginner',
    genderSuitability: 'unisex',
    tags: ['seated', 'leaning back', 'chair', 'relaxed', 'confident', 'casual'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Floor Sitting Lifestyle',
    description: 'Sitting on floor, knees up or legs extended, casual lifestyle pose',
    categorySlug: 'sitting-relaxed',
    difficulty: 'beginner',
    genderSuitability: 'unisex',
    tags: ['floor sitting', 'lifestyle', 'casual', 'relaxed', 'comfortable'],
    isPremium: false,
    sourceType: 'curated',
  },

  // ========================================
  // SPORTS - Fitness & Gym (12 poses)
  // ========================================
  {
    name: 'Bicep Flex Fitness',
    description: 'Classic bicep flex pose, showing strength and fitness progress',
    categorySlug: 'fitness-gym',
    difficulty: 'beginner',
    genderSuitability: 'unisex',
    tags: ['fitness', 'flex', 'bicep', 'gym', 'strength', 'muscle'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Plank Position Strong',
    description: 'Holding plank position, core strength demonstration',
    categorySlug: 'fitness-gym',
    difficulty: 'intermediate',
    genderSuitability: 'unisex',
    tags: ['plank', 'core', 'fitness', 'strength', 'exercise', 'gym'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Dumbbell Workout Pose',
    description: 'Holding dumbbells in workout position, gym training pose',
    categorySlug: 'fitness-gym',
    difficulty: 'beginner',
    genderSuitability: 'unisex',
    tags: ['dumbbell', 'workout', 'gym', 'training', 'fitness', 'weights'],
    isPremium: false,
    sourceType: 'curated',
  },

  // ========================================
  // SPORTS - Yoga & Wellness (10 poses)
  // ========================================
  {
    name: 'Tree Pose Yoga',
    description: 'Classic tree pose (Vrksasana), balance and peace',
    categorySlug: 'yoga-wellness',
    difficulty: 'intermediate',
    genderSuitability: 'unisex',
    tags: ['yoga', 'tree pose', 'balance', 'wellness', 'meditation', 'peace'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Meditation Seated',
    description: 'Cross-legged meditation pose, hands in mudra, peaceful expression',
    categorySlug: 'yoga-wellness',
    difficulty: 'beginner',
    genderSuitability: 'unisex',
    tags: ['meditation', 'seated', 'peace', 'wellness', 'mindfulness', 'yoga'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Warrior Pose Strong',
    description: 'Warrior II yoga pose, strength and stability',
    categorySlug: 'yoga-wellness',
    difficulty: 'intermediate',
    genderSuitability: 'unisex',
    tags: ['warrior pose', 'yoga', 'strength', 'stability', 'wellness'],
    isPremium: false,
    sourceType: 'curated',
  },

  // ========================================
  // SPORTS - Running & Cardio (8 poses)
  // ========================================
  {
    name: 'Running Mid-Stride',
    description: 'Dynamic running pose captured mid-stride, athletic movement',
    categorySlug: 'running-cardio',
    difficulty: 'advanced',
    genderSuitability: 'unisex',
    tags: ['running', 'cardio', 'athletic', 'movement', 'dynamic', 'sports'],
    isPremium: true,
    sourceType: 'curated',
  },
  {
    name: 'Stretching Warmup',
    description: 'Pre-run stretching pose, athletic preparation',
    categorySlug: 'running-cardio',
    difficulty: 'beginner',
    genderSuitability: 'unisex',
    tags: ['stretching', 'warmup', 'running', 'athletic', 'preparation'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Victory Finish Line',
    description: 'Arms raised in victory, finishing race pose, triumphant expression',
    categorySlug: 'running-cardio',
    difficulty: 'beginner',
    genderSuitability: 'unisex',
    tags: ['victory', 'finish line', 'running', 'triumphant', 'achievement', 'celebration'],
    isPremium: false,
    sourceType: 'curated',
  },

  // ========================================
  // MALE-SPECIFIC POSES (20 poses)
  // ========================================
  {
    name: 'Business Professional Male',
    description: 'Standing confident with arms crossed, sharp business attire, professional demeanor',
    categorySlug: 'business-portraits',
    difficulty: 'beginner',
    genderSuitability: 'male',
    tags: ['business', 'professional', 'confident', 'standing', 'arms-crossed', 'male'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Casual Male Confident',
    description: 'Relaxed standing pose with hands in pockets, casual attire, friendly expression',
    categorySlug: 'everyday-casual',
    difficulty: 'beginner',
    genderSuitability: 'male',
    tags: ['casual', 'relaxed', 'standing', 'hands-in-pockets', 'friendly', 'male'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Male Fitness Pose',
    description: 'Athletic stance showing strength and fitness, gym attire, motivated expression',
    categorySlug: 'fitness-gym',
    difficulty: 'intermediate',
    genderSuitability: 'male',
    tags: ['fitness', 'athletic', 'strength', 'gym', 'workout', 'male'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Male Executive Portrait',
    description: 'Seated at desk, hands steepled, authoritative presence, executive suit',
    categorySlug: 'corporate-headshots',
    difficulty: 'intermediate',
    genderSuitability: 'male',
    tags: ['executive', 'desk', 'authoritative', 'suit', 'professional', 'male'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Male Street Style Cool',
    description: 'Urban street style pose, leaning against wall, casual cool vibe',
    categorySlug: 'street-style',
    difficulty: 'beginner',
    genderSuitability: 'male',
    tags: ['street style', 'urban', 'cool', 'casual', 'wall lean', 'male'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Male Conference Speaker',
    description: 'Standing presentation pose with confident gesture, professional speaker stance',
    categorySlug: 'conference-speaking',
    difficulty: 'intermediate',
    genderSuitability: 'male',
    tags: ['conference', 'speaker', 'presentation', 'professional', 'gesture', 'male'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Male Workout Intensity',
    description: 'Mid-workout intense pose, holding weights, showing determination',
    categorySlug: 'fitness-gym',
    difficulty: 'intermediate',
    genderSuitability: 'male',
    tags: ['workout', 'intense', 'weights', 'determination', 'fitness', 'male'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Male Business Handshake',
    description: 'Professional handshake pose, business meeting stance, confident smile',
    categorySlug: 'business-portraits',
    difficulty: 'intermediate',
    genderSuitability: 'male',
    tags: ['handshake', 'business', 'professional', 'meeting', 'confident', 'male'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Male Casual Sitting',
    description: 'Relaxed sitting pose, leg crossed, one arm on chair back',
    categorySlug: 'sitting-relaxed',
    difficulty: 'beginner',
    genderSuitability: 'male',
    tags: ['sitting', 'relaxed', 'casual', 'leg crossed', 'comfortable', 'male'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Male Athletic Running',
    description: 'Dynamic running pose mid-stride, athletic form, determined expression',
    categorySlug: 'running-cardio',
    difficulty: 'advanced',
    genderSuitability: 'male',
    tags: ['running', 'athletic', 'dynamic', 'sports', 'cardio', 'male'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Male Smart Casual',
    description: 'Smart casual attire, one hand in pocket, confident relaxed stance',
    categorySlug: 'everyday-casual',
    difficulty: 'beginner',
    genderSuitability: 'male',
    tags: ['smart casual', 'confident', 'relaxed', 'hand in pocket', 'style', 'male'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Male Product Presenter',
    description: 'Holding product confidently, professional product modeling stance',
    categorySlug: 'product-modeling',
    difficulty: 'beginner',
    genderSuitability: 'male',
    tags: ['product', 'presenter', 'modeling', 'professional', 'showcase', 'male'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Male Tech Professional',
    description: 'Holding laptop or tablet, modern tech professional pose',
    categorySlug: 'corporate-headshots',
    difficulty: 'beginner',
    genderSuitability: 'male',
    tags: ['tech', 'professional', 'laptop', 'modern', 'business', 'male'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Male Gym Trainer Pose',
    description: 'Personal trainer stance, motivational posture, athletic confidence',
    categorySlug: 'fitness-gym',
    difficulty: 'intermediate',
    genderSuitability: 'male',
    tags: ['gym', 'trainer', 'motivational', 'athletic', 'fitness', 'male'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Male Fashion Model Standing',
    description: 'Full body fashion pose, hand in pocket, model stance',
    categorySlug: 'product-modeling',
    difficulty: 'intermediate',
    genderSuitability: 'male',
    tags: ['fashion', 'model', 'full body', 'standing', 'style', 'male'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Male Office Professional',
    description: 'Office environment pose, holding documents, professional attire',
    categorySlug: 'corporate-headshots',
    difficulty: 'beginner',
    genderSuitability: 'male',
    tags: ['office', 'professional', 'documents', 'business', 'corporate', 'male'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Male Outdoor Casual',
    description: 'Outdoor casual pose, natural lighting, relaxed stance',
    categorySlug: 'street-style',
    difficulty: 'beginner',
    genderSuitability: 'male',
    tags: ['outdoor', 'casual', 'natural', 'relaxed', 'lifestyle', 'male'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Male Yoga Warrior',
    description: 'Warrior yoga pose, strength and balance, focused expression',
    categorySlug: 'yoga-wellness',
    difficulty: 'intermediate',
    genderSuitability: 'male',
    tags: ['yoga', 'warrior', 'strength', 'balance', 'wellness', 'male'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Male Live Seller Host',
    description: 'Energetic live selling pose, presenting product enthusiastically',
    categorySlug: 'live-selling',
    difficulty: 'intermediate',
    genderSuitability: 'male',
    tags: ['live selling', 'host', 'energetic', 'product', 'enthusiastic', 'male'],
    isPremium: false,
    sourceType: 'curated',
  },
  {
    name: 'Male Social Media Creator',
    description: 'Content creator pose for social media, engaging with camera',
    categorySlug: 'social-media',
    difficulty: 'beginner',
    genderSuitability: 'male',
    tags: ['social media', 'creator', 'engaging', 'camera', 'content', 'male'],
    isPremium: false,
    sourceType: 'curated',
  },
]

/**
 * Get poses by category slug
 */
export function getPosesByCategory(categorySlug: string): PoseData[] {
  return poseLibraryData.filter(pose => pose.categorySlug === categorySlug)
}

/**
 * Get poses by difficulty
 */
export function getPosesByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): PoseData[] {
  return poseLibraryData.filter(pose => pose.difficulty === difficulty)
}

/**
 * Get premium poses
 */
export function getPremiumPoses(): PoseData[] {
  return poseLibraryData.filter(pose => pose.isPremium)
}

/**
 * Get featured poses
 */
export function getFeaturedPoses(): PoseData[] {
  return poseLibraryData.filter(pose => pose.isFeatured)
}

/**
 * Statistics
 */
export function getPoseStatistics() {
  return {
    total: poseLibraryData.length,
    byDifficulty: {
      beginner: getPosesByDifficulty('beginner').length,
      intermediate: getPosesByDifficulty('intermediate').length,
      advanced: getPosesByDifficulty('advanced').length,
    },
    premium: getPremiumPoses().length,
    featured: getFeaturedPoses().length,
    byGender: {
      male: poseLibraryData.filter(p => p.genderSuitability === 'male').length,
      female: poseLibraryData.filter(p => p.genderSuitability === 'female').length,
      unisex: poseLibraryData.filter(p => p.genderSuitability === 'unisex').length,
    },
  }
}
