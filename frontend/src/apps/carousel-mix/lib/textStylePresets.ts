import type { TextStyle } from '../../../stores/carouselMixStore'

export interface TextStylePreset {
  id: string
  name: string
  preview: {
    text: string
    bgGradient?: string
    bgColor?: string
    textColor: string
  }
  style: TextStyle
}

export const TEXT_STYLE_PRESETS: TextStylePreset[] = [
  {
    id: 'modern-tebal',
    name: 'Modern (Tebal)',
    preview: {
      text: 'Modern Text',
      bgColor: '#4A5568',
      textColor: '#FFFFFF'
    },
    style: {
      fontFamily: 'Inter',
      fontSize: 48,
      fontWeight: 900,
      color: '#FFFFFF',
      shadow: {
        offsetX: 0,
        offsetY: 4,
        blur: 8,
        color: 'rgba(0,0,0,0.3)'
      }
    }
  },
  {
    id: 'tiktok-outline',
    name: 'TikTok (Outline)',
    preview: {
      text: 'VIRAL TEXT',
      bgColor: '#000000',
      textColor: '#FFFFFF'
    },
    style: {
      fontFamily: 'Impact',
      fontSize: 56,
      fontWeight: 900,
      color: '#000000',
      outline: {
        width: 6,
        color: '#FFFFFF'
      }
    }
  },
  {
    id: 'instagram-latar',
    name: 'Instagram (Latar)',
    preview: {
      text: 'IG Story',
      bgGradient: 'linear-gradient(135deg, #E91E63 0%, #FF9800 100%)',
      textColor: '#FFFFFF'
    },
    style: {
      fontFamily: 'Poppins',
      fontSize: 44,
      fontWeight: 700,
      color: '#FFFFFF',
      backgroundColor: 'rgba(0,0,0,0.3)',
      shadow: {
        offsetX: 0,
        offsetY: 2,
        blur: 6,
        color: 'rgba(0,0,0,0.4)'
      }
    }
  },
  {
    id: 'minimalis',
    name: 'Minimalis',
    preview: {
      text: 'Clean Text',
      bgColor: '#F7FAFC',
      textColor: '#2D3748'
    },
    style: {
      fontFamily: 'Inter',
      fontSize: 36,
      fontWeight: 500,
      color: '#2D3748'
    }
  },
  {
    id: 'neon-glow',
    name: 'Neon Glow',
    preview: {
      text: 'NEON',
      bgColor: '#1A202C',
      textColor: '#00FFF0'
    },
    style: {
      fontFamily: 'Montserrat',
      fontSize: 52,
      fontWeight: 700,
      color: '#00FFF0',
      shadow: {
        offsetX: 0,
        offsetY: 0,
        blur: 20,
        color: '#00FFF0'
      }
    }
  },
  {
    id: 'elegant',
    name: 'Elegant',
    preview: {
      text: 'Elegant',
      bgColor: '#FFFFFF',
      textColor: '#1A1A1A'
    },
    style: {
      fontFamily: 'Playfair Display',
      fontSize: 42,
      fontWeight: 700,
      color: '#1A1A1A',
      shadow: {
        offsetX: 1,
        offsetY: 1,
        blur: 2,
        color: 'rgba(0,0,0,0.1)'
      }
    }
  },
  {
    id: 'playful',
    name: 'Playful',
    preview: {
      text: 'Fun Text!',
      bgColor: '#FEF3C7',
      textColor: '#F59E0B'
    },
    style: {
      fontFamily: 'Poppins',
      fontSize: 48,
      fontWeight: 700,
      color: '#F59E0B',
      shadow: {
        offsetX: 2,
        offsetY: 2,
        blur: 0,
        color: '#DC2626'
      }
    }
  },
  {
    id: 'retro',
    name: 'Retro',
    preview: {
      text: 'RETRO',
      bgColor: '#FEF3C7',
      textColor: '#DC2626'
    },
    style: {
      fontFamily: 'Oswald',
      fontSize: 54,
      fontWeight: 700,
      color: '#DC2626',
      outline: {
        width: 4,
        color: '#FBBF24'
      },
      shadow: {
        offsetX: 3,
        offsetY: 3,
        blur: 0,
        color: '#000000'
      }
    }
  }
]
