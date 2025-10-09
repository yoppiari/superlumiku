/**
 * Format Presets Library
 * Defines all available print and social media formats
 */

export interface FormatDefinition {
  name: string
  width: number
  height: number
  dpi?: number
  category: 'print' | 'social' | 'custom'
  aspectRatio: string
  description: string
}

// ========================================
// Print Formats (ISO A Series at 300 DPI)
// ========================================

export const PRINT_FORMATS: Record<string, FormatDefinition> = {
  A0: {
    name: 'A0',
    width: 9933,
    height: 14043,
    dpi: 300,
    category: 'print',
    aspectRatio: '1:1.41',
    description: 'A0 (841×1189mm) - Billboard, large poster',
  },
  A1: {
    name: 'A1',
    width: 7016,
    height: 9933,
    dpi: 300,
    category: 'print',
    aspectRatio: '1:1.41',
    description: 'A1 (594×841mm) - Large poster',
  },
  A2: {
    name: 'A2',
    width: 4961,
    height: 7016,
    dpi: 300,
    category: 'print',
    aspectRatio: '1:1.41',
    description: 'A2 (420×594mm) - Poster, menu board',
  },
  A3: {
    name: 'A3',
    width: 3508,
    height: 4961,
    dpi: 300,
    category: 'print',
    aspectRatio: '1:1.41',
    description: 'A3 (297×420mm) - Large flyer, small poster',
  },
  A4: {
    name: 'A4',
    width: 2480,
    height: 3508,
    dpi: 300,
    category: 'print',
    aspectRatio: '1:1.41',
    description: 'A4 (210×297mm) - Standard document, menu',
  },
  A5: {
    name: 'A5',
    width: 1748,
    height: 2480,
    dpi: 300,
    category: 'print',
    aspectRatio: '1:1.41',
    description: 'A5 (148×210mm) - Flyer, handout',
  },

  // US Paper Sizes (at 300 DPI)
  LETTER: {
    name: 'Letter',
    width: 2550,
    height: 3300,
    dpi: 300,
    category: 'print',
    aspectRatio: '1:1.29',
    description: 'Letter (8.5×11in) - US standard',
  },
  LEGAL: {
    name: 'Legal',
    width: 2550,
    height: 4200,
    dpi: 300,
    category: 'print',
    aspectRatio: '1:1.65',
    description: 'Legal (8.5×14in) - US legal document',
  },
  TABLOID: {
    name: 'Tabloid',
    width: 3300,
    height: 5100,
    dpi: 300,
    category: 'print',
    aspectRatio: '1:1.55',
    description: 'Tabloid (11×17in) - Newspaper, poster',
  },

  // Large Format
  POSTER_24x36: {
    name: '24×36 Poster',
    width: 7200,
    height: 10800,
    dpi: 300,
    category: 'print',
    aspectRatio: '2:3',
    description: '24×36 inches - Movie poster size',
  },
  BILLBOARD: {
    name: 'Billboard',
    width: 14400,
    height: 4800,
    dpi: 150,
    category: 'print',
    aspectRatio: '3:1',
    description: '48×16 feet - Large billboard',
  },
}

// ========================================
// Social Media Formats
// ========================================

export const SOCIAL_FORMATS: Record<string, FormatDefinition> = {
  // Instagram
  IG_POST: {
    name: 'Instagram Post',
    width: 1080,
    height: 1080,
    category: 'social',
    aspectRatio: '1:1',
    description: 'Instagram square post',
  },
  IG_PORTRAIT: {
    name: 'Instagram Portrait',
    width: 1080,
    height: 1350,
    category: 'social',
    aspectRatio: '4:5',
    description: 'Instagram portrait post',
  },
  IG_STORY: {
    name: 'Instagram Story',
    width: 1080,
    height: 1920,
    category: 'social',
    aspectRatio: '9:16',
    description: 'Instagram story / reel',
  },
  IG_REEL: {
    name: 'Instagram Reel',
    width: 1080,
    height: 1920,
    category: 'social',
    aspectRatio: '9:16',
    description: 'Instagram reel video',
  },

  // Facebook
  FB_POST: {
    name: 'Facebook Post',
    width: 1200,
    height: 630,
    category: 'social',
    aspectRatio: '1.91:1',
    description: 'Facebook link preview',
  },
  FB_COVER: {
    name: 'Facebook Cover',
    width: 820,
    height: 312,
    category: 'social',
    aspectRatio: '2.63:1',
    description: 'Facebook page cover',
  },
  FB_AD: {
    name: 'Facebook Ad',
    width: 1200,
    height: 628,
    category: 'social',
    aspectRatio: '1.91:1',
    description: 'Facebook ad image',
  },

  // Twitter/X
  X_POST: {
    name: 'X/Twitter Post',
    width: 1200,
    height: 675,
    category: 'social',
    aspectRatio: '16:9',
    description: 'Twitter/X post image',
  },
  X_HEADER: {
    name: 'X/Twitter Header',
    width: 1500,
    height: 500,
    category: 'social',
    aspectRatio: '3:1',
    description: 'Twitter/X profile header',
  },

  // LinkedIn
  LI_POST: {
    name: 'LinkedIn Post',
    width: 1200,
    height: 627,
    category: 'social',
    aspectRatio: '1.91:1',
    description: 'LinkedIn post image',
  },
  LI_COVER: {
    name: 'LinkedIn Cover',
    width: 1584,
    height: 396,
    category: 'social',
    aspectRatio: '4:1',
    description: 'LinkedIn profile cover',
  },

  // TikTok
  TIKTOK: {
    name: 'TikTok',
    width: 1080,
    height: 1920,
    category: 'social',
    aspectRatio: '9:16',
    description: 'TikTok video thumbnail',
  },

  // YouTube
  YT_THUMBNAIL: {
    name: 'YouTube Thumbnail',
    width: 1280,
    height: 720,
    category: 'social',
    aspectRatio: '16:9',
    description: 'YouTube video thumbnail',
  },
  YT_BANNER: {
    name: 'YouTube Banner',
    width: 2560,
    height: 1440,
    category: 'social',
    aspectRatio: '16:9',
    description: 'YouTube channel banner',
  },
}

// ========================================
// Preset Packs
// ========================================

export interface PresetPack {
  name: string
  formats: string[]
  description: string
  category: 'social' | 'print' | 'mixed'
}

export const PRESET_PACKS: Record<string, PresetPack> = {
  SOCIAL_PACK: {
    name: 'Social Media Pack',
    formats: ['IG_POST', 'IG_STORY', 'FB_POST'],
    description: 'Perfect for social media marketing',
    category: 'social',
  },
  PRINT_PACK: {
    name: 'Print Pack',
    formats: ['A4', 'A3', 'POSTER_24x36'],
    description: 'Ready for professional printing',
    category: 'print',
  },
  RESTAURANT_PACK: {
    name: 'Restaurant Pack',
    formats: ['A4', 'IG_POST', 'IG_STORY'],
    description: 'Menu boards + social media',
    category: 'mixed',
  },
  COMPLETE_PACK: {
    name: 'Complete Marketing Pack',
    formats: ['A4', 'A3', 'IG_POST', 'IG_STORY', 'FB_POST', 'X_POST'],
    description: 'Everything for omnichannel marketing',
    category: 'mixed',
  },
}

// ========================================
// Combined Format Registry
// ========================================

export const ALL_FORMATS: Record<string, FormatDefinition> = {
  ...PRINT_FORMATS,
  ...SOCIAL_FORMATS,
}

// ========================================
// Helper Functions
// ========================================

export function getFormatByName(name: string): FormatDefinition | undefined {
  return ALL_FORMATS[name]
}

export function getFormatsByCategory(category: 'print' | 'social'): FormatDefinition[] {
  return Object.values(ALL_FORMATS).filter((format) => format.category === category)
}

export function getPresetPackFormats(packName: string): FormatDefinition[] {
  const pack = PRESET_PACKS[packName]
  if (!pack) return []

  return pack.formats.map((formatName) => ALL_FORMATS[formatName]).filter(Boolean)
}

export function calculateAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
  const divisor = gcd(width, height)
  return `${width / divisor}:${height / divisor}`
}

export function findClosestFormat(width: number, height: number): FormatDefinition | null {
  const targetRatio = width / height
  let closest: FormatDefinition | null = null
  let minDiff = Infinity

  for (const format of Object.values(ALL_FORMATS)) {
    const formatRatio = format.width / format.height
    const diff = Math.abs(targetRatio - formatRatio)

    if (diff < minDiff) {
      minDiff = diff
      closest = format
    }
  }

  return closest
}
