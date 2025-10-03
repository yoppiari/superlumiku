import { useState } from 'react'
import { Wand2, AlertCircle } from 'lucide-react'
import type { TextStyle, TextPosition } from '../../../stores/carouselMixStore'

interface GlobalTextSettingsProps {
  onApplyToAll: (style: TextStyle, position?: Partial<TextPosition>) => Promise<void>
  textCount: number
}

export function GlobalTextSettings({ onApplyToAll, textCount }: GlobalTextSettingsProps) {
  const [isApplying, setIsApplying] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [globalSettings, setGlobalSettings] = useState({
    position: 'center' as TextPosition['preset'],
    align: 'center' as TextPosition['align'],
    fontSize: 32,
    color: '#FFFFFF',
  })

  const handleApplyToAll = async () => {
    if (textCount === 0) return

    setIsApplying(true)
    try {
      // Convert global settings to TextStyle
      const style: Partial<TextStyle> = {
        fontSize: globalSettings.fontSize,
        color: globalSettings.color,
      }

      const position: Partial<TextPosition> = {
        preset: globalSettings.position,
        align: globalSettings.align,
      }

      await onApplyToAll(style as TextStyle, position)
      setShowConfirm(false)
      alert('✅ Global settings applied to all texts!')
    } catch (error: any) {
      alert(error.message || 'Failed to apply global settings')
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200">
      <div className="flex items-center gap-2 mb-3">
        <Wand2 className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-800">Global Text Settings</h3>
        <span className="ml-auto px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">
          Apply to {textCount} texts
        </span>
      </div>

      <p className="text-xs text-gray-600 mb-4">
        Quick apply settings to all existing text variations at once
      </p>

      <div className="space-y-3">
        {/* Position Preset */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Position</label>
          <select
            value={globalSettings.position}
            onChange={(e) => setGlobalSettings({ ...globalSettings, position: e.target.value as any })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
          >
            <option value="top-center">Top Center</option>
            <option value="center">Center</option>
            <option value="bottom-center">Bottom Center</option>
            <option value="top-left">Top Left</option>
            <option value="top-right">Top Right</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="bottom-right">Bottom Right</option>
          </select>
        </div>

        {/* Alignment */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Text Alignment</label>
          <select
            value={globalSettings.align}
            onChange={(e) => setGlobalSettings({ ...globalSettings, align: e.target.value as any })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
            <option value="justify">Justify</option>
          </select>
        </div>

        {/* Font Size */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Font Size: {globalSettings.fontSize}px
          </label>
          <input
            type="range"
            min="16"
            max="72"
            value={globalSettings.fontSize}
            onChange={(e) => setGlobalSettings({ ...globalSettings, fontSize: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>16px</span>
            <span>72px</span>
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Text Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={globalSettings.color}
              onChange={(e) => setGlobalSettings({ ...globalSettings, color: e.target.value })}
              className="w-16 h-10 rounded-lg border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={globalSettings.color}
              onChange={(e) => setGlobalSettings({ ...globalSettings, color: e.target.value })}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono"
              placeholder="#FFFFFF"
            />
          </div>
        </div>
      </div>

      {/* Warning & Apply Button */}
      <div className="mt-4 space-y-2">
        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            disabled={textCount === 0}
            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                     disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2
                     transition-all hover:shadow-md"
          >
            <Wand2 className="w-4 h-4" />
            Apply to All Texts
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800">
                <p className="font-semibold mb-1">This will override existing settings!</p>
                <p>Position, alignment, font size, and color will be updated for all {textCount} text variations.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyToAll}
                disabled={isApplying}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                         disabled:opacity-50 font-medium"
              >
                {isApplying ? 'Applying...' : 'Confirm'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
