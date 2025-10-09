import { useState } from 'react'
import { Scan, Sparkles, Download, Loader2, Paintbrush, MousePointer2 } from 'lucide-react'
import api from '../../../lib/api'

export type InpaintMode = 'brush' | 'annotate'

interface ToolsPanelProps {
  posterId: string | undefined
  onOperationSuccess: () => void
  onInpaintClick?: (mode: InpaintMode) => void
  inpaintMode?: InpaintMode
  onModeChange?: (mode: InpaintMode) => void
}

export function ToolsPanel({ posterId, onOperationSuccess, onInpaintClick, inpaintMode = 'brush', onModeChange }: ToolsPanelProps) {
  const [isDetecting, setIsDetecting] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showModeSelector, setShowModeSelector] = useState(false)

  const handleDetectText = async () => {
    if (!posterId) {
      alert('Please select a poster first')
      return
    }

    try {
      setIsDetecting(true)
      const response = await api.post('/api/apps/poster-editor/detect-text', {
        posterId
      })

      if (response.data.success) {
        alert(`Text detection complete! Found ${response.data.detectedTexts.length} text regions. Credits used: ${response.data.creditsUsed}`)
        onOperationSuccess()
      }
    } catch (error: any) {
      console.error('Text detection error:', error)
      alert(error.response?.data?.error || 'Failed to detect text')
    } finally {
      setIsDetecting(false)
    }
  }

  const handleEnhance = async () => {
    if (!posterId) {
      alert('Please select a poster first')
      return
    }

    try {
      setIsEnhancing(true)
      const response = await api.post('/api/apps/poster-editor/enhance', {
        posterId,
        model: 'esrgan'
      })

      if (response.data.success) {
        alert(`Enhancement complete! Credits used: ${response.data.creditsUsed}`)
        onOperationSuccess()
      }
    } catch (error: any) {
      console.error('Enhancement error:', error)
      alert(error.response?.data?.error || 'Failed to enhance poster')
    } finally {
      setIsEnhancing(false)
    }
  }

  const handleExport = async (preset: string, format: string) => {
    if (!posterId) {
      alert('Please select a poster first')
      return
    }

    try {
      const response = await api.post('/api/apps/poster-editor/resize', {
        posterId,
        preset,
        format
      })

      if (response.data.success) {
        // Get the export URL from response
        const exportUrl = `http://localhost:3001${response.data.export.url}`

        // Create download link
        const link = document.createElement('a')
        link.href = exportUrl
        link.setAttribute('download', `poster-${preset}.${format}`)
        link.setAttribute('target', '_blank')
        document.body.appendChild(link)
        link.click()
        link.remove()

        setShowExportModal(false)
        alert('Export complete! File downloaded.')
        onOperationSuccess()
      }
    } catch (error: any) {
      console.error('Export error:', error)
      alert(error.response?.data?.error || 'Failed to export poster')
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Tools</h3>

        <div className="space-y-3">
          {/* Detect Text Button */}
          <button
            onClick={handleDetectText}
            disabled={!posterId || isDetecting}
            className="w-full px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDetecting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Detecting...
              </>
            ) : (
              <>
                <Scan className="w-5 h-5" />
                Detect Text (50 credits)
              </>
            )}
          </button>

          {/* AI Inpaint Section */}
          <div className="border border-purple-200 rounded-lg p-4 bg-purple-50/50">
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-purple-900 mb-2">AI Inpaint Mode:</h4>

              {/* Mode Selection */}
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-purple-300 transition-colors">
                  <input
                    type="radio"
                    name="inpaintMode"
                    value="brush"
                    checked={inpaintMode === 'brush'}
                    onChange={() => onModeChange?.('brush')}
                    className="w-4 h-4 text-purple-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Paintbrush className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-slate-900">Brush Mode</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Draw custom mask with brush</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-purple-300 transition-colors">
                  <input
                    type="radio"
                    name="inpaintMode"
                    value="annotate"
                    checked={inpaintMode === 'annotate'}
                    onChange={() => onModeChange?.('annotate')}
                    className="w-4 h-4 text-purple-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <MousePointer2 className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-slate-900">Quick Edit</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Click & type to edit areas</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={() => onInpaintClick?.(inpaintMode)}
              disabled={!posterId}
              className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              {inpaintMode === 'brush' ? <Paintbrush className="w-5 h-5" /> : <MousePointer2 className="w-5 h-5" />}
              Start AI Inpaint (400+ credits)
            </button>
          </div>

          {/* Enhance Button */}
          <button
            onClick={handleEnhance}
            disabled={!posterId || isEnhancing}
            className="w-full px-4 py-3 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isEnhancing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enhancing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Enhance Quality (150 credits)
              </>
            )}
          </button>

          {/* Export Button */}
          <button
            onClick={() => setShowExportModal(true)}
            disabled={!posterId}
            className="w-full px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export to Formats
          </button>
        </div>

        {!posterId && (
          <p className="text-sm text-slate-500 mt-4 text-center">
            Upload or select a poster to use tools
          </p>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Export to Formats</h2>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Instagram Post */}
              <div className="border border-slate-200 rounded-lg p-4 hover:border-green-300 transition-colors">
                <h3 className="font-semibold text-slate-900 mb-2">Instagram Post</h3>
                <p className="text-sm text-slate-600 mb-3">1080 x 1080 (Square)</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExport('instagram-post', 'jpg')}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                  >
                    JPG
                  </button>
                  <button
                    onClick={() => handleExport('instagram-post', 'png')}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                  >
                    PNG
                  </button>
                </div>
              </div>

              {/* Instagram Story */}
              <div className="border border-slate-200 rounded-lg p-4 hover:border-green-300 transition-colors">
                <h3 className="font-semibold text-slate-900 mb-2">Instagram Story</h3>
                <p className="text-sm text-slate-600 mb-3">1080 x 1920 (Vertical)</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExport('instagram-story', 'jpg')}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                  >
                    JPG
                  </button>
                  <button
                    onClick={() => handleExport('instagram-story', 'png')}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                  >
                    PNG
                  </button>
                </div>
              </div>

              {/* Facebook Post */}
              <div className="border border-slate-200 rounded-lg p-4 hover:border-green-300 transition-colors">
                <h3 className="font-semibold text-slate-900 mb-2">Facebook Post</h3>
                <p className="text-sm text-slate-600 mb-3">1200 x 630</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExport('facebook-post', 'jpg')}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                  >
                    JPG
                  </button>
                  <button
                    onClick={() => handleExport('facebook-post', 'png')}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                  >
                    PNG
                  </button>
                </div>
              </div>

              {/* Twitter Post */}
              <div className="border border-slate-200 rounded-lg p-4 hover:border-green-300 transition-colors">
                <h3 className="font-semibold text-slate-900 mb-2">Twitter Post</h3>
                <p className="text-sm text-slate-600 mb-3">1200 x 675</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExport('twitter-post', 'jpg')}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                  >
                    JPG
                  </button>
                  <button
                    onClick={() => handleExport('twitter-post', 'png')}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                  >
                    PNG
                  </button>
                </div>
              </div>

              {/* LinkedIn Post */}
              <div className="border border-slate-200 rounded-lg p-4 hover:border-green-300 transition-colors">
                <h3 className="font-semibold text-slate-900 mb-2">LinkedIn Post</h3>
                <p className="text-sm text-slate-600 mb-3">1200 x 627</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExport('linkedin-post', 'jpg')}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                  >
                    JPG
                  </button>
                  <button
                    onClick={() => handleExport('linkedin-post', 'png')}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                  >
                    PNG
                  </button>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-600 mt-6 text-center">
              💡 Single exports are FREE. Batch export (all formats) costs 50 credits.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
