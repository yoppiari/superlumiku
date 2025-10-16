import { useState } from 'react'
import { Check, ChevronDown, ChevronUp, Download, Image as ImageIcon } from 'lucide-react'
import { designTokens } from '../styles/design-tokens'
import '../styles/animations.css'

interface ExportFormat {
  id: string
  name: string
  width: number
  height: number
  aspectRatio: string
  category: 'social' | 'ecommerce' | 'print' | 'custom'
  platform?: string
  icon?: string
  recommended?: boolean
}

interface ExportFormatSelectorProps {
  selectedFormats: string[]
  onToggleFormat: (formatId: string) => void
  onExport?: () => void
}

const exportFormats: ExportFormat[] = [
  // Social Media
  { id: 'ig-post', name: 'Instagram Post', width: 1080, height: 1080, aspectRatio: '1:1', category: 'social', platform: 'Instagram', icon: '📷', recommended: true },
  { id: 'ig-story', name: 'Instagram Story', width: 1080, height: 1920, aspectRatio: '9:16', category: 'social', platform: 'Instagram', icon: '📱' },
  { id: 'ig-reel', name: 'Instagram Reel', width: 1080, height: 1920, aspectRatio: '9:16', category: 'social', platform: 'Instagram', icon: '🎬' },
  { id: 'tiktok', name: 'TikTok', width: 1080, height: 1920, aspectRatio: '9:16', category: 'social', platform: 'TikTok', icon: '🎵', recommended: true },
  { id: 'fb-post', name: 'Facebook Post', width: 1200, height: 630, aspectRatio: '1.91:1', category: 'social', platform: 'Facebook', icon: '👥' },
  { id: 'twitter-post', name: 'Twitter Post', width: 1200, height: 675, aspectRatio: '16:9', category: 'social', platform: 'Twitter', icon: '🐦' },
  { id: 'linkedin', name: 'LinkedIn Post', width: 1200, height: 627, aspectRatio: '1.91:1', category: 'social', platform: 'LinkedIn', icon: '💼' },
  { id: 'pinterest', name: 'Pinterest Pin', width: 1000, height: 1500, aspectRatio: '2:3', category: 'social', platform: 'Pinterest', icon: '📌' },

  // E-commerce
  { id: 'shopify', name: 'Shopify Product', width: 2048, height: 2048, aspectRatio: '1:1', category: 'ecommerce', platform: 'Shopify', icon: '🛍️', recommended: true },
  { id: 'shopee', name: 'Shopee Product', width: 1024, height: 1024, aspectRatio: '1:1', category: 'ecommerce', platform: 'Shopee', icon: '🛒' },
  { id: 'tokopedia', name: 'Tokopedia', width: 1200, height: 1200, aspectRatio: '1:1', category: 'ecommerce', platform: 'Tokopedia', icon: '🏪' },
  { id: 'lazada', name: 'Lazada', width: 1200, height: 1200, aspectRatio: '1:1', category: 'ecommerce', platform: 'Lazada', icon: '🛍️' },
  { id: 'amazon', name: 'Amazon Product', width: 2000, height: 2000, aspectRatio: '1:1', category: 'ecommerce', platform: 'Amazon', icon: '📦' },

  // Print
  { id: 'print-4x6', name: 'Print 4x6"', width: 1800, height: 1200, aspectRatio: '3:2', category: 'print', icon: '🖼️' },
  { id: 'print-5x7', name: 'Print 5x7"', width: 2100, height: 1500, aspectRatio: '7:5', category: 'print', icon: '🖼️' },
  { id: 'print-8x10', name: 'Print 8x10"', width: 3000, height: 2400, aspectRatio: '5:4', category: 'print', icon: '🖼️' },
  { id: 'print-a4', name: 'A4 Print', width: 2480, height: 3508, aspectRatio: 'A4', category: 'print', icon: '📄' },

  // Custom
  { id: 'custom-hd', name: 'HD (1920x1080)', width: 1920, height: 1080, aspectRatio: '16:9', category: 'custom', icon: '🖥️' },
  { id: 'custom-4k', name: '4K (3840x2160)', width: 3840, height: 2160, aspectRatio: '16:9', category: 'custom', icon: '📺' },
]

const categoryConfig = {
  social: { name: 'Social Media', icon: '📱', color: 'from-blue-500 to-purple-600' },
  ecommerce: { name: 'E-Commerce', icon: '🛒', color: 'from-green-500 to-emerald-600' },
  print: { name: 'Print Ready', icon: '🖨️', color: 'from-orange-500 to-red-600' },
  custom: { name: 'Custom Sizes', icon: '⚙️', color: 'from-slate-500 to-gray-600' },
}

export default function ExportFormatSelector({
  selectedFormats,
  onToggleFormat,
  onExport,
}: ExportFormatSelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['social', 'ecommerce'])

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const toggleSelectAll = (category: string) => {
    const categoryFormats = exportFormats.filter(f => f.category === category)
    const allSelected = categoryFormats.every(f => selectedFormats.includes(f.id))

    if (allSelected) {
      // Deselect all in category
      categoryFormats.forEach(f => {
        if (selectedFormats.includes(f.id)) {
          onToggleFormat(f.id)
        }
      })
    } else {
      // Select all in category
      categoryFormats.forEach(f => {
        if (!selectedFormats.includes(f.id)) {
          onToggleFormat(f.id)
        }
      })
    }
  }

  const getAspectRatioBox = (aspectRatio: string) => {
    const ratios: Record<string, { width: string; height: string }> = {
      '1:1': { width: '100%', height: '100%' },
      '9:16': { width: '56.25%', height: '100%' },
      '16:9': { width: '100%', height: '56.25%' },
      '3:2': { width: '100%', height: '66.67%' },
      '4:3': { width: '100%', height: '75%' },
      '2:3': { width: '66.67%', height: '100%' },
    }

    return ratios[aspectRatio] || { width: '100%', height: '75%' }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Export Formats</h3>
          <p className="text-sm text-slate-600 mt-1">
            Select one or more export formats for your generated poses
          </p>
        </div>
        {selectedFormats.length > 0 && onExport && (
          <button
            onClick={onExport}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white
                     rounded-lg font-medium shadow-premium hover-lift hover-glow
                     transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export ({selectedFormats.length})
          </button>
        )}
      </div>

      {/* Selection Summary */}
      {selectedFormats.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-fadeInDown">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-blue-900">
              <Check className="w-4 h-4" />
              <span className="font-semibold">{selectedFormats.length} format{selectedFormats.length !== 1 ? 's' : ''} selected</span>
            </div>
            <button
              onClick={() => selectedFormats.forEach(id => onToggleFormat(id))}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Format Categories */}
      <div className="space-y-4">
        {Object.entries(categoryConfig).map(([categoryKey, categoryInfo]) => {
          const categoryFormats = exportFormats.filter(f => f.category === categoryKey)
          const selectedCount = categoryFormats.filter(f => selectedFormats.includes(f.id)).length
          const isExpanded = expandedCategories.includes(categoryKey)
          const allSelected = categoryFormats.every(f => selectedFormats.includes(f.id))

          return (
            <div key={categoryKey} className="bg-white border border-slate-200 rounded-xl shadow-premium overflow-hidden">
              {/* Category Header */}
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleCategory(categoryKey)}
                    className="flex items-center gap-3 flex-1 text-left group"
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${categoryInfo.color}
                                  flex items-center justify-center text-white text-xl
                                  group-hover:scale-110 transition-transform`}>
                      {categoryInfo.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                        {categoryInfo.name}
                        {selectedCount > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            {selectedCount} selected
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-600">{categoryFormats.length} formats available</p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                  <button
                    onClick={() => toggleSelectAll(categoryKey)}
                    className="ml-4 text-xs text-blue-600 hover:text-blue-800 font-medium
                             px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>

              {/* Format Cards */}
              {isExpanded && (
                <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fadeInDown">
                  {categoryFormats.map((format, index) => {
                    const isSelected = selectedFormats.includes(format.id)
                    const boxDimensions = getAspectRatioBox(format.aspectRatio)

                    return (
                      <button
                        key={format.id}
                        onClick={() => onToggleFormat(format.id)}
                        className={`relative rounded-lg overflow-hidden border-2 transition-all
                                   hover-lift group stagger-item ${
                          isSelected
                            ? 'border-blue-500 ring-4 ring-blue-200 shadow-premium-lg'
                            : 'border-slate-200 hover:border-blue-300 hover-glow'
                        }`}
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        {/* Recommended Badge */}
                        {format.recommended && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-500
                                        text-white text-xs font-bold rounded-full z-10 shadow-premium">
                            ⭐ Popular
                          </div>
                        )}

                        {/* Selection Checkmark */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-blue-600 rounded-full p-1 z-10
                                        shadow-premium animate-scaleIn">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}

                        {/* Aspect Ratio Preview */}
                        <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
                          <div
                            className={`bg-white border-2 ${
                              isSelected ? 'border-blue-500' : 'border-slate-300'
                            } rounded shadow-md transition-all group-hover:scale-105`}
                            style={{
                              width: boxDimensions.width,
                              height: boxDimensions.height,
                              maxWidth: '80px',
                              maxHeight: '80px',
                            }}
                          >
                            <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">
                              {format.icon || '📷'}
                            </div>
                          </div>
                        </div>

                        {/* Format Info */}
                        <div className={`p-3 ${isSelected ? 'bg-blue-50' : 'bg-white'} transition-colors`}>
                          <div className="flex items-center gap-2 mb-1">
                            {format.icon && <span className="text-lg">{format.icon}</span>}
                            <h5 className="font-semibold text-sm text-slate-900 truncate">
                              {format.name}
                            </h5>
                          </div>
                          {format.platform && (
                            <div className="text-xs text-slate-600 mb-1">{format.platform}</div>
                          )}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600">{format.aspectRatio}</span>
                            <span className="text-slate-500">
                              {format.width}×{format.height}
                            </span>
                          </div>
                        </div>

                        {/* Hover Glow Effect */}
                        <div className={`absolute inset-0 rounded-lg transition-opacity pointer-events-none ${
                          isSelected
                            ? 'opacity-100 bg-blue-500/5'
                            : 'opacity-0 group-hover:opacity-100 bg-blue-500/5'
                        }`} />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            <span className="font-medium text-slate-900">Pro Tip:</span> Select multiple formats to export your poses
            for different platforms simultaneously
          </div>
          <button
            onClick={() => {
              // Select all recommended formats
              exportFormats.filter(f => f.recommended).forEach(f => {
                if (!selectedFormats.includes(f.id)) {
                  onToggleFormat(f.id)
                }
              })
            }}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap
                     px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Select Popular ⭐
          </button>
        </div>
      </div>
    </div>
  )
}
