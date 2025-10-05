import { useState } from 'react'
import { Upload, X, Image as ImageIcon, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { useCarouselMixStore } from '../../../stores/carouselMixStore'
import { TextVariationItem } from './TextVariationItem'
import { PositionTextStyleEditor } from './PositionTextStyleEditor'

interface SlidePositionSectionProps {
  position: number
  projectId: string
}

export function SlidePositionSection({ position, projectId }: SlidePositionSectionProps) {
  const {
    currentProject,
    uploadSlide,
    deleteSlide,
    addTextVariation,
    updatePositionSettings,
    positionSettings,
    isUploading,
  } = useCarouselMixStore()

  const [isExpanded, setIsExpanded] = useState(true)
  const [newTextContent, setNewTextContent] = useState('')
  const [showTextInput, setShowTextInput] = useState(false)

  // Filter slides and texts for this position
  const slidesAtPosition = currentProject?.slides.filter(s => s.slidePosition === position) || []
  const textsAtPosition = currentProject?.texts.filter(t => t.slidePosition === position) || []

  // Get position settings
  const positionSetting = positionSettings[`${projectId}-${position}`] || null

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      // Upload all files sequentially
      for (let i = 0; i < files.length; i++) {
        console.log(`Uploading file ${i + 1}/${files.length}: ${files[i].name} to position ${position}`)
        await uploadSlide(projectId, files[i], position)
        console.log(`✓ Uploaded: ${files[i].name}`)
      }
      e.target.value = ''
      console.log('All uploads completed successfully')
    } catch (error: any) {
      console.error('Upload error details:', error)
      const errorMsg = error.response?.data?.error || error.message || 'Failed to upload slide'
      alert(`Upload failed: ${errorMsg}`)
    }
  }

  const handleAddText = async () => {
    if (!newTextContent.trim()) return

    try {
      const textData = {
        content: newTextContent,
        slidePosition: position,
        order: textsAtPosition.length,
      }

      console.log('Adding text with data:', textData)

      await addTextVariation(projectId, textData)
      setNewTextContent('')
      setShowTextInput(false)
    } catch (error: any) {
      console.error('Add text error:', error)

      // Show detailed error if available
      if (error.response?.data?.details) {
        const details = error.response.data.details
        const messages = details.map((d: any) => `${d.path.join('.')}: ${d.message}`).join('\n')
        alert(`Validation Error:\n${messages}`)
      } else {
        alert(error.response?.data?.error || error.message || 'Failed to add text')
      }
    }
  }

  const handleDeleteSlide = async (slideId: string) => {
    if (!confirm('Delete this slide?')) return
    try {
      await deleteSlide(slideId)
    } catch (error: any) {
      alert(error.message || 'Failed to delete slide')
    }
  }


  const variations = slidesAtPosition.length * Math.max(textsAtPosition.length, 1)

  return (
    <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between hover:from-blue-100 hover:to-indigo-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
            {position}
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Position {position}</h3>
            <p className="text-xs text-gray-600">
              {slidesAtPosition.length} image{slidesAtPosition.length !== 1 ? 's' : ''} × {Math.max(textsAtPosition.length, 1)} text{textsAtPosition.length !== 1 ? 's' : ''} = {variations} variation{variations !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 bg-white space-y-4">
          {/* Position Text Style Editor */}
          <PositionTextStyleEditor
            position={position}
            projectId={projectId}
            settings={positionSetting}
            onUpdate={(settings) => updatePositionSettings(projectId, position, settings)}
          />

          {/* Images Section */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Images
            </h4>

            {/* Upload Button */}
            <label className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors mb-3">
              <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
              <span className="text-sm text-gray-600">
                {isUploading ? 'Uploading...' : 'Upload Images'}
              </span>
              <p className="text-xs text-gray-500 mt-1">
                Select multiple files
              </p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg,video/mp4"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploading}
                multiple
              />
            </label>

            {/* Images List */}
            {slidesAtPosition.length > 0 && (
              <div className="space-y-1">
                {slidesAtPosition.map((slide) => (
                  <div
                    key={slide.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 group"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <ImageIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">{slide.fileName}</p>
                        <p className="text-xs text-gray-500">
                          {(slide.fileSize / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSlide(slide.id)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {slidesAtPosition.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-4">
                No images uploaded for this position
              </p>
            )}
          </div>

          {/* Texts Section */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Text Variations
            </h4>

            {/* Text List */}
            {textsAtPosition.length > 0 && (
              <div className="space-y-2 mb-3">
                {textsAtPosition.map((text) => (
                  <TextVariationItem key={text.id} text={text} />
                ))}
              </div>
            )}

            {/* Add Text Button */}
            {!showTextInput && (
              <button
                onClick={() => setShowTextInput(true)}
                className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                + Add Text Variation
              </button>
            )}

            {/* Text Input Form */}
            {showTextInput && (
              <div className="space-y-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                <textarea
                  value={newTextContent}
                  onChange={(e) => setNewTextContent(e.target.value)}
                  placeholder="Enter text content..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                  rows={2}
                  autoFocus
                />

                <div className="flex gap-2">
                  <button
                    onClick={handleAddText}
                    disabled={!newTextContent.trim()}
                    className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Add Text
                  </button>
                  <button
                    onClick={() => {
                      setShowTextInput(false)
                      setNewTextContent('')
                    }}
                    className="py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
