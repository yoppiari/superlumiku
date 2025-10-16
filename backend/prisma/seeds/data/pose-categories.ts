/**
 * Pose Generator - Category Hierarchy
 *
 * Hierarchical category structure with:
 * - Top-level categories (6 main categories)
 * - Sub-categories (2-4 per top category)
 * - Indonesian market focus with hijab and e-commerce categories
 */

export interface CategoryData {
  name: string
  displayName: string
  slug: string
  description: string
  icon: string
  displayOrder: number
  color: string
  parentSlug?: string
  isActive: boolean
}

export const categoryHierarchy: CategoryData[] = [
  // ========================================
  // TOP LEVEL 1: Professional
  // ========================================
  {
    name: 'professional',
    displayName: 'Professional',
    slug: 'professional',
    description: 'Professional poses for business, corporate, and formal occasions',
    icon: 'briefcase',
    displayOrder: 0,
    color: '#3B82F6',
    isActive: true,
  },
  {
    name: 'business-portraits',
    displayName: 'Business Portraits',
    slug: 'business-portraits',
    description: 'Classic business headshots and portraits for LinkedIn, company websites, and professional profiles',
    icon: 'user-circle',
    displayOrder: 0,
    color: '#3B82F6',
    parentSlug: 'professional',
    isActive: true,
  },
  {
    name: 'corporate-headshots',
    displayName: 'Corporate Headshots',
    slug: 'corporate-headshots',
    description: 'Formal corporate headshots with clean backgrounds, ideal for executives and team pages',
    icon: 'building',
    displayOrder: 10,
    color: '#3B82F6',
    parentSlug: 'professional',
    isActive: true,
  },
  {
    name: 'conference-speaking',
    displayName: 'Conference & Speaking',
    slug: 'conference-speaking',
    description: 'Poses for speakers, presenters, and conference professionals',
    icon: 'mic',
    displayOrder: 20,
    color: '#3B82F6',
    parentSlug: 'professional',
    isActive: true,
  },
  {
    name: 'office-workspace',
    displayName: 'Office & Workspace',
    slug: 'office-workspace',
    description: 'Working poses in office environments - at desk, in meetings, collaborating',
    icon: 'laptop',
    displayOrder: 30,
    color: '#3B82F6',
    parentSlug: 'professional',
    isActive: true,
  },

  // ========================================
  // TOP LEVEL 2: E-Commerce
  // ========================================
  {
    name: 'e-commerce',
    displayName: 'E-Commerce',
    slug: 'e-commerce',
    description: 'Poses optimized for online selling platforms (Shopee, Tokopedia, TikTok Shop)',
    icon: 'shopping-bag',
    displayOrder: 10,
    color: '#EF4444',
    isActive: true,
  },
  {
    name: 'product-modeling',
    displayName: 'Product Modeling',
    slug: 'product-modeling',
    description: 'Modeling poses for showcasing products - clothing, accessories, beauty products',
    icon: 'package',
    displayOrder: 0,
    color: '#EF4444',
    parentSlug: 'e-commerce',
    isActive: true,
  },
  {
    name: 'shopee-tiktok',
    displayName: 'Shopee & TikTok Shop',
    slug: 'shopee-tiktok',
    description: 'Optimized poses for Shopee and TikTok Shop product listings - dynamic and engaging',
    icon: 'smartphone',
    displayOrder: 10,
    color: '#EF4444',
    parentSlug: 'e-commerce',
    isActive: true,
  },
  {
    name: 'before-after',
    displayName: 'Before & After',
    slug: 'before-after',
    description: 'Poses for showcasing product transformations, comparisons, and results',
    icon: 'refresh-cw',
    displayOrder: 20,
    color: '#EF4444',
    parentSlug: 'e-commerce',
    isActive: true,
  },
  {
    name: 'live-selling',
    displayName: 'Live Selling',
    slug: 'live-selling',
    description: 'Energetic poses for live streaming sales on TikTok, Shopee Live, Instagram Live',
    icon: 'video',
    displayOrder: 30,
    color: '#EF4444',
    parentSlug: 'e-commerce',
    isActive: true,
  },

  // ========================================
  // TOP LEVEL 3: Fashion & Style
  // ========================================
  {
    name: 'fashion',
    displayName: 'Fashion & Style',
    slug: 'fashion',
    description: 'Fashion-forward poses for editorial, runway, and street style photography',
    icon: 'sparkles',
    displayOrder: 20,
    color: '#8B5CF6',
    isActive: true,
  },
  {
    name: 'editorial',
    displayName: 'Editorial',
    slug: 'editorial',
    description: 'High-fashion editorial poses for magazines, lookbooks, and campaigns',
    icon: 'book-open',
    displayOrder: 0,
    color: '#8B5CF6',
    parentSlug: 'fashion',
    isActive: true,
  },
  {
    name: 'street-style',
    displayName: 'Street Style',
    slug: 'street-style',
    description: 'Casual urban fashion poses for everyday style and OOTD (Outfit of the Day)',
    icon: 'map-pin',
    displayOrder: 10,
    color: '#8B5CF6',
    parentSlug: 'fashion',
    isActive: true,
  },
  {
    name: 'runway-catwalk',
    displayName: 'Runway & Catwalk',
    slug: 'runway-catwalk',
    description: 'Professional runway and catwalk poses with confident attitude',
    icon: 'trending-up',
    displayOrder: 20,
    color: '#8B5CF6',
    parentSlug: 'fashion',
    isActive: true,
  },

  // ========================================
  // TOP LEVEL 4: Hijab & Modest Fashion
  // ========================================
  {
    name: 'hijab',
    displayName: 'Hijab & Modest Fashion',
    slug: 'hijab',
    description: 'Elegant poses for hijab fashion and modest styling - Indonesian market specialty',
    icon: 'heart',
    displayOrder: 30,
    color: '#EC4899',
    isActive: true,
  },
  {
    name: 'casual-hijab',
    displayName: 'Casual Hijab',
    slug: 'casual-hijab',
    description: 'Relaxed, everyday hijab poses for casual wear and lifestyle content',
    icon: 'coffee',
    displayOrder: 0,
    color: '#EC4899',
    parentSlug: 'hijab',
    isActive: true,
  },
  {
    name: 'professional-hijab',
    displayName: 'Professional Hijab',
    slug: 'professional-hijab',
    description: 'Formal hijab poses for business, corporate, and professional settings',
    icon: 'briefcase',
    displayOrder: 10,
    color: '#EC4899',
    parentSlug: 'hijab',
    isActive: true,
  },
  {
    name: 'fashion-hijab',
    displayName: 'Fashion Hijab',
    slug: 'fashion-hijab',
    description: 'Stylish hijab fashion poses for modern Muslim women',
    icon: 'sparkles',
    displayOrder: 20,
    color: '#EC4899',
    parentSlug: 'hijab',
    isActive: true,
  },
  {
    name: 'wedding-hijab',
    displayName: 'Wedding & Formal Hijab',
    slug: 'wedding-hijab',
    description: 'Elegant hijab poses for weddings, engagements, and formal occasions',
    icon: 'crown',
    displayOrder: 30,
    color: '#EC4899',
    parentSlug: 'hijab',
    isActive: true,
  },

  // ========================================
  // TOP LEVEL 5: Casual & Lifestyle
  // ========================================
  {
    name: 'casual',
    displayName: 'Casual & Lifestyle',
    slug: 'casual',
    description: 'Relaxed, natural poses for everyday life and social media content',
    icon: 'smile',
    displayOrder: 40,
    color: '#10B981',
    isActive: true,
  },
  {
    name: 'everyday-casual',
    displayName: 'Everyday Casual',
    slug: 'everyday-casual',
    description: 'Natural, relaxed poses for daily life and casual social media posts',
    icon: 'sun',
    displayOrder: 0,
    color: '#10B981',
    parentSlug: 'casual',
    isActive: true,
  },
  {
    name: 'social-media',
    displayName: 'Social Media',
    slug: 'social-media',
    description: 'Instagram-worthy poses for stories, reels, and feed posts',
    icon: 'instagram',
    displayOrder: 10,
    color: '#10B981',
    parentSlug: 'casual',
    isActive: true,
  },
  {
    name: 'outdoor-lifestyle',
    displayName: 'Outdoor & Lifestyle',
    slug: 'outdoor-lifestyle',
    description: 'Poses for outdoor settings - parks, cafes, urban environments',
    icon: 'tree-pine',
    displayOrder: 20,
    color: '#10B981',
    parentSlug: 'casual',
    isActive: true,
  },
  {
    name: 'sitting-relaxed',
    displayName: 'Sitting & Relaxed',
    slug: 'sitting-relaxed',
    description: 'Comfortable sitting and lounging poses for casual content',
    icon: 'armchair',
    displayOrder: 30,
    color: '#10B981',
    parentSlug: 'casual',
    isActive: true,
  },

  // ========================================
  // TOP LEVEL 6: Sports & Active
  // ========================================
  {
    name: 'sports',
    displayName: 'Sports & Active',
    slug: 'sports',
    description: 'Dynamic poses for fitness, sports, and active lifestyle content',
    icon: 'zap',
    displayOrder: 50,
    color: '#F59E0B',
    isActive: true,
  },
  {
    name: 'fitness-gym',
    displayName: 'Fitness & Gym',
    slug: 'fitness-gym',
    description: 'Athletic poses for gym, workout, and fitness content',
    icon: 'dumbbell',
    displayOrder: 0,
    color: '#F59E0B',
    parentSlug: 'sports',
    isActive: true,
  },
  {
    name: 'yoga-wellness',
    displayName: 'Yoga & Wellness',
    slug: 'yoga-wellness',
    description: 'Peaceful yoga and wellness poses for health and mindfulness content',
    icon: 'heart-pulse',
    displayOrder: 10,
    color: '#F59E0B',
    parentSlug: 'sports',
    isActive: true,
  },
  {
    name: 'running-cardio',
    displayName: 'Running & Cardio',
    slug: 'running-cardio',
    description: 'Active running and cardio poses for athletic content',
    icon: 'activity',
    displayOrder: 20,
    color: '#F59E0B',
    parentSlug: 'sports',
    isActive: true,
  },
]

/**
 * Get top-level categories only
 */
export function getTopLevelCategories(): CategoryData[] {
  return categoryHierarchy.filter(cat => !cat.parentSlug)
}

/**
 * Get sub-categories for a parent slug
 */
export function getSubCategories(parentSlug: string): CategoryData[] {
  return categoryHierarchy.filter(cat => cat.parentSlug === parentSlug)
}

/**
 * Get category by slug
 */
export function getCategoryBySlug(slug: string): CategoryData | undefined {
  return categoryHierarchy.find(cat => cat.slug === slug)
}
