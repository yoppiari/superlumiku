import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { TEXT_STYLE_PRESETS, type TextStylePreset } from '../lib/textStylePresets'
import type { TextStyle } from '../../../stores/carouselMixStore'

interface TextStylePresetSelectorProps {
  onSelect: (style: TextStyle) => void
  currentPresetId?: string
}

export function TextStylePresetSelector({ onSelect, currentPresetId }: TextStylePresetSelectorProps) {
  const [showPresets, setShowPresets] = useState(false)
  const [selectedPresetId, setSelectedPresetId] = useState(currentPresetId || TEXT_STYLE_PRESETS[0]?.id || '')
  const selectedPreset = TEXT_STYLE_PRESETS.find(p => p.id === selectedPresetId) || TEXT_STYLE_PRESETS[0]

  if (!selectedPreset) {
    return null // Safety check in case TEXT_STYLE_PRESETS is empty
  }

  const handleSelectPreset = (preset: TextStylePreset) => {
    console.log('Preset selected:', preset.name)
    setSelectedPresetId(preset.id)
    onSelect(preset.style)
    setShowPresets(false)
  }

  return (
    <div className="relative mb-4">
      <label className="block text-sm font-semibold text-gray-900 mb-2">
        Text Style Preset
      </label>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setShowPresets(!showPresets)
        }}
        className="w-full px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-400 rounded-lg
                   flex items-center justify-between hover:from-blue-100 hover:to-indigo-100 hover:border-blue-600 transition-all
                   focus:outline-none focus:ring-4 focus:ring-blue-300 shadow-md hover:shadow-lg cursor-pointer"
      >
        <div className="flex items-center gap-3">
          {/* Preview of selected preset */}
          <div
            className="px-4 py-2 rounded-lg text-sm font-bold min-w-[120px] text-center shadow-md"
            style={{
              background: selectedPreset.preview.bgGradient || selectedPreset.preview.bgColor,
              color: selectedPreset.preview.textColor,
              fontFamily: selectedPreset.style.fontFamily,
              textShadow: selectedPreset.style.outline
                ? `0 0 ${selectedPreset.style.outline.width}px ${selectedPreset.style.outline.color}`
                : selectedPreset.style.shadow
                ? `${selectedPreset.style.shadow.offsetX}px ${selectedPreset.style.shadow.offsetY}px ${selectedPreset.style.shadow.blur}px ${selectedPreset.style.shadow.color}`
                : 'none'
            }}
          >
            {selectedPreset.preview.text}
          </div>
          <span className="font-semibold text-gray-900">{selectedPreset.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-blue-700">Click to select</span>
          {showPresets ? (
            <ChevronUp className="w-6 h-6 text-blue-700 font-bold" />
          ) : (
            <ChevronDown className="w-6 h-6 text-blue-700 font-bold" />
          )}
        </div>
      </button>

      {/* Dropdown List */}
      {showPresets && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => {
              console.log('Backdrop clicked')
              setShowPresets(false)
            }}
          />

          {/* Dropdown */}
          <div className="absolute z-[101] mt-2 w-full max-h-96 overflow-y-auto
                          bg-white border-2 border-blue-200 rounded-lg shadow-2xl">
            {TEXT_STYLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={(e) => {
                  console.log('Button clicked:', preset.name)
                  e.preventDefault()
                  e.stopPropagation()
                  handleSelectPreset(preset)
                }}
                className={`w-full px-4 py-3 hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 flex items-center gap-3
                           transition-all border-b border-gray-200 last:border-0 text-left cursor-pointer
                           ${selectedPreset.id === preset.id ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-600 shadow-sm' : ''}`}
              >
                {/* Visual Preview */}
                <div
                  className="px-4 py-2 rounded-lg text-sm font-bold min-w-[120px] text-center shadow-md"
                  style={{
                    background: preset.preview.bgGradient || preset.preview.bgColor,
                    color: preset.preview.textColor,
                    fontFamily: preset.style.fontFamily,
                    textShadow: preset.style.outline
                      ? `0 0 ${preset.style.outline.width}px ${preset.style.outline.color}`
                      : preset.style.shadow
                      ? `${preset.style.shadow.offsetX}px ${preset.style.shadow.offsetY}px ${preset.style.shadow.blur}px ${preset.style.shadow.color}`
                      : 'none'
                  }}
                >
                  {preset.preview.text}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{preset.name}</div>
                  <div className="text-xs text-gray-600">{preset.style.fontFamily} • {preset.style.fontSize}px</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
