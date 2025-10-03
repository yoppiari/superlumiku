import type { TextPosition } from '../../../stores/carouselMixStore'
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react'

interface TextPositionEditorProps {
  position: TextPosition
  onChange: (position: TextPosition) => void
}

type PositionPreset = TextPosition['preset']

const POSITION_PRESETS: Array<{
  value: PositionPreset
  label: string
  x: number
  y: number
  align: TextPosition['align']
  verticalAlign: TextPosition['verticalAlign']
}> = [
  { value: 'top-left', label: 'TL', x: 10, y: 10, align: 'left', verticalAlign: 'top' },
  { value: 'top-center', label: 'TC', x: 50, y: 10, align: 'center', verticalAlign: 'top' },
  { value: 'top-right', label: 'TR', x: 90, y: 10, align: 'right', verticalAlign: 'top' },
  { value: 'middle-left', label: 'ML', x: 10, y: 50, align: 'left', verticalAlign: 'middle' },
  { value: 'center', label: 'C', x: 50, y: 50, align: 'center', verticalAlign: 'middle' },
  { value: 'middle-right', label: 'MR', x: 90, y: 50, align: 'right', verticalAlign: 'middle' },
  { value: 'bottom-left', label: 'BL', x: 10, y: 90, align: 'left', verticalAlign: 'bottom' },
  { value: 'bottom-center', label: 'BC', x: 50, y: 90, align: 'center', verticalAlign: 'bottom' },
  { value: 'bottom-right', label: 'BR', x: 90, y: 90, align: 'right', verticalAlign: 'bottom' },
]

export function TextPositionEditor({ position, onChange }: TextPositionEditorProps) {
  const handlePresetClick = (preset: typeof POSITION_PRESETS[0]) => {
    onChange({
      ...position,
      preset: preset.value,
      x: preset.x,
      y: preset.y,
      align: preset.align,
      verticalAlign: preset.verticalAlign,
    })
  }

  const handleCustomPosition = (updates: Partial<TextPosition>) => {
    onChange({
      ...position,
      ...updates,
      preset: 'custom',
    })
  }

  return (
    <div className="space-y-4">
      {/* Position Presets Grid */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Quick Position</label>
        <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          {POSITION_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handlePresetClick(preset)}
              className={`aspect-square flex items-center justify-center text-xs font-medium rounded-lg border-2 transition ${
                position.preset === preset.value
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              }`}
              title={preset.value}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {position.preset !== 'custom'
            ? `Selected: ${position.preset.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`
            : 'Custom position'}
        </p>
      </div>

      {/* Fine-tune X/Y Position */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Fine-tune Position
        </label>

        {/* X Position */}
        <div className="mb-3">
          <label className="block text-xs text-gray-600 mb-1">
            Horizontal (X): {position.x}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={position.x}
            onChange={(e) => handleCustomPosition({ x: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Left</span>
            <span>Center</span>
            <span>Right</span>
          </div>
        </div>

        {/* Y Position */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">
            Vertical (Y): {position.y}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={position.y}
            onChange={(e) => handleCustomPosition({ y: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Top</span>
            <span>Middle</span>
            <span>Bottom</span>
          </div>
        </div>
      </div>

      {/* Text Alignment */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Text Alignment</label>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => onChange({ ...position, align: 'left' })}
            className={`p-2 flex items-center justify-center rounded-lg border transition ${
              position.align === 'left'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
            }`}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onChange({ ...position, align: 'center' })}
            className={`p-2 flex items-center justify-center rounded-lg border transition ${
              position.align === 'center'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
            }`}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => onChange({ ...position, align: 'right' })}
            className={`p-2 flex items-center justify-center rounded-lg border transition ${
              position.align === 'right'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
            }`}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onChange({ ...position, align: 'justify' })}
            className={`p-2 flex items-center justify-center rounded-lg border transition ${
              position.align === 'justify'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
            }`}
            title="Justify"
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Vertical Alignment */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Vertical Alignment</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onChange({ ...position, verticalAlign: 'top' })}
            className={`px-3 py-2 text-xs rounded-lg border transition ${
              position.verticalAlign === 'top'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
            }`}
          >
            Top
          </button>
          <button
            onClick={() => onChange({ ...position, verticalAlign: 'middle' })}
            className={`px-3 py-2 text-xs rounded-lg border transition ${
              position.verticalAlign === 'middle'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
            }`}
          >
            Middle
          </button>
          <button
            onClick={() => onChange({ ...position, verticalAlign: 'bottom' })}
            className={`px-3 py-2 text-xs rounded-lg border transition ${
              position.verticalAlign === 'bottom'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
            }`}
          >
            Bottom
          </button>
        </div>
      </div>

      {/* Padding */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Padding (px)</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Top</label>
            <input
              type="number"
              min="0"
              max="100"
              value={position.padding.top}
              onChange={(e) => onChange({
                ...position,
                padding: { ...position.padding, top: parseInt(e.target.value) || 0 }
              })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Bottom</label>
            <input
              type="number"
              min="0"
              max="100"
              value={position.padding.bottom}
              onChange={(e) => onChange({
                ...position,
                padding: { ...position.padding, bottom: parseInt(e.target.value) || 0 }
              })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Left</label>
            <input
              type="number"
              min="0"
              max="100"
              value={position.padding.left}
              onChange={(e) => onChange({
                ...position,
                padding: { ...position.padding, left: parseInt(e.target.value) || 0 }
              })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Right</label>
            <input
              type="number"
              min="0"
              max="100"
              value={position.padding.right}
              onChange={(e) => onChange({
                ...position,
                padding: { ...position.padding, right: parseInt(e.target.value) || 0 }
              })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
