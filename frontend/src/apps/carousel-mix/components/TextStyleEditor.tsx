import { useState } from 'react'
import type { TextStyle } from '../../../stores/carouselMixStore'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface TextStyleEditorProps {
  style: TextStyle
  onChange: (style: TextStyle) => void
}

// Popular web-safe fonts
const FONT_FAMILIES = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Montserrat',
  'Playfair Display',
  'Lato',
  'Poppins',
  'Oswald',
  'Raleway',
  'Arial',
  'Helvetica',
  'Georgia',
  'Times New Roman',
]

const FONT_WEIGHTS: Array<{value: 300 | 400 | 500 | 700 | 900, label: string}> = [
  { value: 300, label: 'Light' },
  { value: 400, label: 'Regular' },
  { value: 500, label: 'Medium' },
  { value: 700, label: 'Bold' },
  { value: 900, label: 'Black' },
]

export function TextStyleEditor({ style, onChange }: TextStyleEditorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleStyleChange = (updates: Partial<TextStyle>) => {
    onChange({ ...style, ...updates })
  }

  return (
    <div className="space-y-4">
      {/* Font Family */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Font Family</label>
        <select
          value={style.fontFamily}
          onChange={(e) => handleStyleChange({ fontFamily: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
          style={{ fontFamily: style.fontFamily }}
        >
          {FONT_FAMILIES.map((font) => (
            <option key={font} value={font} style={{ fontFamily: font }}>
              {font}
            </option>
          ))}
        </select>
      </div>

      {/* Font Size */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Font Size: {style.fontSize}px
        </label>
        <input
          type="range"
          min="12"
          max="120"
          value={style.fontSize}
          onChange={(e) => handleStyleChange({ fontSize: parseInt(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>12px</span>
          <span>120px</span>
        </div>
      </div>

      {/* Font Weight */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Font Weight</label>
        <div className="grid grid-cols-5 gap-2">
          {FONT_WEIGHTS.map(({value, label}) => (
            <button
              key={value}
              onClick={() => handleStyleChange({ fontWeight: value })}
              className={`px-2 py-2 text-xs rounded-lg border transition ${
                style.fontWeight === value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }`}
              style={{ fontWeight: value }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Text Color */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Text Color</label>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={style.color}
            onChange={(e) => handleStyleChange({ color: e.target.value })}
            className="w-12 h-10 rounded cursor-pointer border border-gray-300"
          />
          <input
            type="text"
            value={style.color}
            onChange={(e) => handleStyleChange({ color: e.target.value })}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono"
            placeholder="#FFFFFF"
          />
        </div>
      </div>

      {/* Background Color (Optional) */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-gray-700">Background Color</label>
          <button
            onClick={() => handleStyleChange({ backgroundColor: style.backgroundColor ? undefined : 'rgba(0,0,0,0.5)' })}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            {style.backgroundColor ? 'Remove' : 'Add'}
          </button>
        </div>
        {style.backgroundColor && (
          <div className="flex gap-2 items-center">
            <div
              className="w-12 h-10 rounded border border-gray-300"
              style={{ backgroundColor: style.backgroundColor }}
            />
            <input
              type="text"
              value={style.backgroundColor}
              onChange={(e) => handleStyleChange({ backgroundColor: e.target.value })}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono"
              placeholder="rgba(0,0,0,0.5)"
            />
          </div>
        )}
      </div>

      {/* Advanced Options (Collapsible) */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition text-sm"
        >
          <span className="font-medium text-gray-700">Advanced Effects</span>
          {showAdvanced ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-4 pl-3 border-l-2 border-gray-200">
            {/* Text Shadow */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-700">Text Shadow</label>
                <button
                  onClick={() => handleStyleChange({
                    shadow: style.shadow ? undefined : { offsetX: 2, offsetY: 2, blur: 4, color: '#000000' }
                  })}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  {style.shadow ? 'Remove' : 'Add'}
                </button>
              </div>

              {style.shadow && (
                <div className="space-y-2 pl-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600">Offset X</label>
                      <input
                        type="number"
                        value={style.shadow.offsetX}
                        onChange={(e) => handleStyleChange({
                          shadow: { ...style.shadow!, offsetX: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Offset Y</label>
                      <input
                        type="number"
                        value={style.shadow.offsetY}
                        onChange={(e) => handleStyleChange({
                          shadow: { ...style.shadow!, offsetY: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Blur</label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={style.shadow.blur}
                      onChange={(e) => handleStyleChange({
                        shadow: { ...style.shadow!, blur: parseInt(e.target.value) }
                      })}
                      className="w-full h-1 bg-gray-200 rounded accent-blue-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={style.shadow.color}
                        onChange={(e) => handleStyleChange({
                          shadow: { ...style.shadow!, color: e.target.value }
                        })}
                        className="w-10 h-8 rounded cursor-pointer border border-gray-300"
                      />
                      <input
                        type="text"
                        value={style.shadow.color}
                        onChange={(e) => handleStyleChange({
                          shadow: { ...style.shadow!, color: e.target.value }
                        })}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Text Outline */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-700">Text Outline</label>
                <button
                  onClick={() => handleStyleChange({
                    outline: style.outline ? undefined : { width: 2, color: '#000000' }
                  })}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  {style.outline ? 'Remove' : 'Add'}
                </button>
              </div>

              {style.outline && (
                <div className="space-y-2 pl-2">
                  <div>
                    <label className="text-xs text-gray-600">Width</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={style.outline.width}
                      onChange={(e) => handleStyleChange({
                        outline: { ...style.outline!, width: parseInt(e.target.value) }
                      })}
                      className="w-full h-1 bg-gray-200 rounded accent-blue-600"
                    />
                    <div className="text-xs text-gray-500 text-center">{style.outline.width}px</div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={style.outline.color}
                        onChange={(e) => handleStyleChange({
                          outline: { ...style.outline!, color: e.target.value }
                        })}
                        className="w-10 h-8 rounded cursor-pointer border border-gray-300"
                      />
                      <input
                        type="text"
                        value={style.outline.color}
                        onChange={(e) => handleStyleChange({
                          outline: { ...style.outline!, color: e.target.value }
                        })}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
