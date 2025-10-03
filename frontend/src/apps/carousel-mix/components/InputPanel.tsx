import { useState, useEffect } from 'react'
import { useCarouselMixStore } from '../../../stores/carouselMixStore'
import { SlidePositionSection } from './SlidePositionSection'
import { Upload, Plus, X, ChevronDown, ChevronUp, Image as ImageIcon, Pencil, Save, Check, Loader2 } from 'lucide-react'

interface InputPanelProps {
  projectId: string
}

export function InputPanel({ projectId }: InputPanelProps) {
  const {
    currentProject,
    updateGenerationSettings,
    generationSettings,
    isSaving,
    lastSaved,
  } = useCarouselMixStore()

  const [timeAgo, setTimeAgo] = useState('')

  useEffect(() => {
    if (!lastSaved) {
      setTimeAgo('')
      return
    }

    const updateTimeAgo = () => {
      const now = new Date()
      const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000)

      if (diff < 5) {
        setTimeAgo('just now')
      } else if (diff < 60) {
        setTimeAgo(`${diff}s ago`)
      } else if (diff < 3600) {
        const mins = Math.floor(diff / 60)
        setTimeAgo(`${mins}m ago`)
      } else {
        const hours = Math.floor(diff / 3600)
        setTimeAgo(`${hours}h ago`)
      }
    }

    updateTimeAgo()
    const interval = setInterval(updateTimeAgo, 1000)

    return () => clearInterval(interval)
  }, [lastSaved])

  if (!currentProject) return null

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold">1. Input Materials</h2>

        {/* Save Indicator */}
        <div className="flex items-center gap-2 text-sm">
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-blue-600 font-medium">Saving...</span>
            </>
          ) : lastSaved ? (
            <>
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-gray-600">Saved {timeAgo}</span>
            </>
          ) : null}
        </div>
      </div>

      {/* Project Title */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Project Title</label>
        <input
          type="text"
          value={currentProject.name}
          readOnly
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
        />
      </div>

      {/* Number of Slides Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Carousel Length ({generationSettings.numSlides} slides)
        </label>
        <input
          type="range"
          min="2"
          max="8"
          value={generationSettings.numSlides}
          onChange={(e) => updateGenerationSettings({ numSlides: parseInt(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>2 slides</span>
          <span>8 slides</span>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Select how many positions your carousel will have (2-8). Each position can have multiple image and text variations.
        </p>
      </div>

      {/* Position-Based Sections */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">
          Carousel Positions
        </h3>
        {Array.from({ length: generationSettings.numSlides }, (_, i) => i + 1).map((position) => (
          <SlidePositionSection
            key={position}
            position={position}
            projectId={projectId}
          />
        ))}
      </div>
    </div>
  )
}
