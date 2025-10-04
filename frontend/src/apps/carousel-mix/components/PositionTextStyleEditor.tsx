import { useState, useEffect } from 'react'
import { Type, Palette, Move, Check } from 'lucide-react'

export interface PositionSettings {
  id?: string
  projectId: string
  slidePosition: number
  fontFamily: string
  fontSize: number             // Deprecated - kept for backward compatibility
  fontSizePercent: number      // Font size as % of image height (NEW)
  fontColor: string
  fontWeight: number
  backgroundColor: string
  textPosition: string
  textAlignment: string
  positionX: number
  positionY: number
  textShadow?: string
  textOutline?: string
  paddingData?: string
}

interface PositionTextStyleEditorProps {
  position: number
  projectId: string
  settings: PositionSettings | null
  onUpdate: (settings: Partial<PositionSettings>) => void
}

const TEXT_STYLE_PRESETS = [
  {
    id: 'modern-tebal',
    name: 'Modern (Tebal)',
    settings: {
      fontFamily: 'Inter',
      fontSize: 40,
      fontWeight: 900,
      fontColor: '#FFFFFF',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      textShadow: JSON.stringify({ offsetX: 2, offsetY: 2, blur: 4, color: 'rgba(0,0,0,0.5)' })
    },
    buttonStyle: {
      background: 'linear-gradient(135deg, #1e1e1e 0%, #000000 100%)',
      color: '#FFFFFF',
      fontWeight: '900',
    }
  },
  {
    id: 'modern-text',
    name: 'Modern Text',
    settings: {
      fontFamily: 'Inter',
      fontSize: 36,
      fontWeight: 700,
      fontColor: '#1F2937',
      backgroundColor: 'rgba(243, 244, 246, 0.95)',
      textShadow: JSON.stringify({ offsetX: 0, offsetY: 1, blur: 2, color: 'rgba(0,0,0,0.1)' })
    },
    buttonStyle: {
      background: '#F3F4F6',
      color: '#1F2937',
      fontWeight: '700',
      border: '2px solid #E5E7EB'
    }
  },
  {
    id: 'tiktok-outline',
    name: 'TikTok (Outline)',
    settings: {
      fontFamily: 'Arial Black, Arial',
      fontSize: 44,
      fontWeight: 900,
      fontColor: '#000000',
      backgroundColor: 'transparent',
      textOutline: JSON.stringify({ width: 3, color: '#FFFFFF' }),
      textShadow: JSON.stringify({ offsetX: 3, offsetY: 3, blur: 0, color: '#FF0050' })
    },
    buttonStyle: {
      background: '#000000',
      color: '#FFFFFF',
      fontWeight: '900',
      textShadow: '3px 3px 0 #FF0050',
    }
  },
  {
    id: 'instagram-latar',
    name: 'Instagram (Latar)',
    settings: {
      fontFamily: 'Arial',
      fontSize: 38,
      fontWeight: 700,
      fontColor: '#FFFFFF',
      backgroundColor: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
      textShadow: JSON.stringify({ offsetX: 0, offsetY: 2, blur: 4, color: 'rgba(0,0,0,0.3)' })
    },
    buttonStyle: {
      background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
      color: '#FFFFFF',
      fontWeight: '700',
    }
  },
  {
    id: 'minimalis',
    name: 'Minimalis',
    settings: {
      fontFamily: 'Inter',
      fontSize: 32,
      fontWeight: 400,
      fontColor: '#374151',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      textShadow: JSON.stringify({ offsetX: 0, offsetY: 1, blur: 3, color: 'rgba(0,0,0,0.1)' })
    },
    buttonStyle: {
      background: '#FFFFFF',
      color: '#374151',
      fontWeight: '400',
      border: '1px solid #E5E7EB'
    }
  },
  {
    id: 'neon-glow',
    name: 'Neon Glow',
    settings: {
      fontFamily: 'Arial Black, Arial',
      fontSize: 42,
      fontWeight: 900,
      fontColor: '#00F0FF',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      textShadow: JSON.stringify({ offsetX: 0, offsetY: 0, blur: 20, color: '#00F0FF' })
    },
    buttonStyle: {
      background: '#000000',
      color: '#00F0FF',
      fontWeight: '900',
      textShadow: '0 0 10px #00F0FF, 0 0 20px #00F0FF',
      border: '2px solid #00F0FF'
    }
  },
]

const POSITION_PRESETS = [
  { label: 'Center', value: 'center', x: 50, y: 50 },
  { label: 'Top', value: 'top-center', x: 50, y: 15 },
  { label: 'Bottom', value: 'bottom-center', x: 50, y: 85 },
  { label: 'Top Left', value: 'top-left', x: 15, y: 15 },
  { label: 'Bottom Right', value: 'bottom-right', x: 85, y: 85 },
]

export function PositionTextStyleEditor({ position, projectId, settings, onUpdate }: PositionTextStyleEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)

  const currentSettings = settings || {
    projectId,
    slidePosition: position,
    fontFamily: 'Inter',
    fontSize: 32,               // Deprecated
    fontSizePercent: 4.5,       // Default 4.5% of image height
    fontColor: '#FFFFFF',
    fontWeight: 700,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    textPosition: 'center',
    textAlignment: 'center',
    positionX: 50,
    positionY: 50,
  }

  // Load selected preset from localStorage on mount
  useEffect(() => {
    const storageKey = `preset-${projectId}-${position}`
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      setSelectedPresetId(saved)
    }
  }, [projectId, position])

  const isPresetActive = (preset: typeof TEXT_STYLE_PRESETS[0]) => {
    return selectedPresetId === preset.id
  }

  const applyStylePreset = (preset: typeof TEXT_STYLE_PRESETS[0]) => {
    // Save to localStorage
    const storageKey = `preset-${projectId}-${position}`
    localStorage.setItem(storageKey, preset.id)
    setSelectedPresetId(preset.id)

    // Apply settings
    onUpdate({
      fontFamily: preset.settings.fontFamily,
      fontSize: preset.settings.fontSize,
      fontColor: preset.settings.fontColor,
      fontWeight: preset.settings.fontWeight,
      backgroundColor: preset.settings.backgroundColor,
      textShadow: preset.settings.textShadow,
      textOutline: preset.settings.textOutline,
    })
  }

  const applyPositionPreset = (preset: typeof POSITION_PRESETS[0]) => {
    onUpdate({
      textPosition: preset.value,
      positionX: preset.x,
      positionY: preset.y,
    })
  }

  return (
    <div className="mb-4 border border-blue-200 rounded-lg overflow-hidden bg-blue-50/50">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center justify-between hover:bg-blue-100/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">Text Style Settings (for all text variations)</span>
        </div>
        <span className="text-xs text-gray-500">
          {isExpanded ? '−' : '+'}
        </span>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4 bg-white">
          {/* Text Style Presets */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Text Style</label>
            <div className="grid grid-cols-2 gap-3">
              {TEXT_STYLE_PRESETS.map((preset) => {
                const isActive = isPresetActive(preset)
                return (
                  <div key={preset.id} className="relative">
                    {isActive && (
                      <div className="absolute inset-0 bg-blue-600 rounded-md"></div>
                    )}
                    <button
                      onClick={() => applyStylePreset(preset)}
                      className={`relative w-full h-12 rounded-md transition-all ${
                        isActive
                          ? 'm-[3px]'
                          : 'border border-gray-200 hover:border-gray-400'
                      }`}
                      style={{
                        ...preset.buttonStyle,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        padding: '8px',
                        fontWeight: preset.buttonStyle.fontWeight === '900' ? '700' : preset.buttonStyle.fontWeight,
                      }}
                    >
                      <span>{preset.name}</span>
                      {isActive && (
                        <Check className="w-4 h-4 ml-2 text-current" strokeWidth={3} />
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Font Size: {currentSettings.fontSizePercent?.toFixed(1) || '4.5'}%
            </label>
            <input
              type="range"
              min="1"
              max="15"
              step="0.1"
              value={currentSettings.fontSizePercent || 4.5}
              onChange={(e) => onUpdate({ fontSizePercent: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1% (Small)</span>
              <span>15% (Large)</span>
            </div>
          </div>


          {/* Position Presets */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Position Presets</label>
            <div className="grid grid-cols-3 gap-2">
              {POSITION_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => applyPositionPreset(preset)}
                  className={`px-3 py-2 text-xs border rounded-lg transition-colors ${
                    currentSettings.textPosition === preset.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Alignment */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Text Alignment</label>
            <div className="flex gap-2">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => onUpdate({ textAlignment: align })}
                  className={`flex-1 px-3 py-2 text-xs border rounded-lg transition-colors capitalize ${
                    currentSettings.textAlignment === align
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {align}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
