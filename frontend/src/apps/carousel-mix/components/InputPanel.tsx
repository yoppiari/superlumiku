import { useEffect, useState, useCallback } from 'react'
import { useCarouselMixStore } from '../../../stores/carouselMixStore'
import { SlidePositionSection } from './SlidePositionSection'

interface InputPanelProps {
  projectId: string
}

export function InputPanel({ projectId }: InputPanelProps) {
  const {
    currentProject,
    updateGenerationSettings,
    generationSettings,
    updateProject,
  } = useCarouselMixStore()

  // Local state for editing
  const [localName, setLocalName] = useState('')
  const [localDescription, setLocalDescription] = useState('')

  // Initialize local state when project loads
  useEffect(() => {
    if (currentProject) {
      setLocalName(currentProject.name)
      setLocalDescription(currentProject.description || '')
    }
  }, [currentProject?.id])

  // Stable callback for saving
  const saveProjectName = useCallback((projectId: string, name: string) => {
    console.log('Saving project name:', name)
    updateProject(projectId, { name })
  }, [updateProject])

  const saveProjectDescription = useCallback((projectId: string, description: string) => {
    console.log('Saving project description:', description)
    updateProject(projectId, { description })
  }, [updateProject])

  // Debounced save for name
  useEffect(() => {
    if (!currentProject || localName === currentProject.name) return

    const timer = setTimeout(() => {
      saveProjectName(currentProject.id, localName)
    }, 500)

    return () => clearTimeout(timer)
  }, [localName, currentProject?.id, currentProject?.name, saveProjectName])

  // Debounced save for description
  useEffect(() => {
    if (!currentProject || localDescription === (currentProject.description || '')) return

    const timer = setTimeout(() => {
      saveProjectDescription(currentProject.id, localDescription)
    }, 500)

    return () => clearTimeout(timer)
  }, [localDescription, currentProject?.id, currentProject?.description, saveProjectDescription])

  if (!currentProject) return null

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 h-full overflow-y-auto">
      <div className="mb-8 border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold">1. Input Materials</h2>
      </div>

      {/* Project Title */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Project Title</label>
        <input
          type="text"
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Project Description */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
        <textarea
          value={localDescription}
          onChange={(e) => setLocalDescription(e.target.value)}
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          placeholder="Add a description for your project..."
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
