import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react'
import { useProjectStore } from '../store/project.store'
import { usePoseLibraryStore } from '../store/pose-library.store'
import { useGenerationStore } from '../store/generation.store'
import { useWebSocketStore } from '../store/websocket.store'
import PoseCard from '../components/PoseCard'
import GenerationProgress from '../components/GenerationProgress'
import ResultsGallery from '../components/ResultsGallery'
import { LoadingSpinner } from '../../../components/ui'

export default function GeneratePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('project')

  const { currentProject, fetchProjectById } = useProjectStore()
  const { poses, selectedPoses, fetchPoses, togglePose } = usePoseLibraryStore()
  const {
    currentGeneration,
    generationResults,
    progress,
    startGeneration,
    fetchGenerationResults,
  } = useGenerationStore()
  const { connect, disconnect, isConnected } = useWebSocketStore()

  const [step, setStep] = useState(1) // 1: Select Poses, 2: Configure, 3: Progress/Results
  const [batchSize, setBatchSize] = useState(4)
  const [useBackground, setUseBackground] = useState(false)
  const [backgroundPrompt, setBackgroundPrompt] = useState('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (projectId) {
      fetchProjectById(projectId)
    }
    fetchPoses({ limit: 50 })
  }, [projectId])

  useEffect(() => {
    // Connect to WebSocket when generation starts
    if (currentGeneration && currentGeneration.status === 'processing') {
      connect(currentGeneration.id)
    }

    return () => {
      disconnect()
    }
  }, [currentGeneration?.id, currentGeneration?.status])

  const handleStartGeneration = async () => {
    if (!projectId || selectedPoses.length === 0) {
      alert('Please select at least one pose')
      return
    }

    setGenerating(true)
    try {
      const generationId = await startGeneration({
        projectId,
        generationType: 'GALLERY_REFERENCE',
        selectedPoseIds: selectedPoses,
        batchSize,
        useBackgroundChanger: useBackground,
        backgroundMode: useBackground ? 'ai_generate' : undefined,
        backgroundPrompt: useBackground ? backgroundPrompt : undefined,
      })

      setStep(3)
      setGenerating(false)
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to start generation')
      setGenerating(false)
    }
  }

  if (!projectId) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 mb-4">No project selected</p>
        <button
          onClick={() => navigate('/apps/pose-generator/projects')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go to Projects
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/apps/pose-generator/projects')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {currentProject?.projectName || 'Generate Poses'}
          </h2>
          <p className="text-slate-600 mt-1">Select poses and configure generation settings</p>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-4 mb-8">
        {[
          { num: 1, label: 'Select Poses' },
          { num: 2, label: 'Configure' },
          { num: 3, label: 'Generate' },
        ].map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div
              className={`flex items-center gap-2 ${
                step === s.num ? 'text-blue-600' : 'text-slate-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  step === s.num
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {s.num}
              </div>
              <span className="text-sm font-medium">{s.label}</span>
            </div>
            {i < 2 && (
              <div className={`w-12 h-0.5 mx-2 ${step > s.num ? 'bg-blue-600' : 'bg-slate-300'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      {step === 1 && (
        <div>
          <div className="mb-4">
            <p className="text-slate-700">
              Selected: <strong>{selectedPoses.length}</strong> poses
            </p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 mb-6">
            {poses.slice(0, 50).map((pose) => (
              <PoseCard
                key={pose.id}
                pose={pose}
                isSelected={selectedPoses.includes(pose.id)}
                onSelect={togglePose}
              />
            ))}
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={selectedPoses.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="max-w-2xl">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            {/* Batch Size */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Variations per Pose
              </label>
              <select
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value={1}>1 variation</option>
                <option value={2}>2 variations</option>
                <option value={4}>4 variations</option>
                <option value={6}>6 variations</option>
              </select>
            </div>

            {/* Background */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useBackground}
                  onChange={(e) => setUseBackground(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm font-medium text-slate-700">AI Background Generation</span>
              </label>

              {useBackground && (
                <textarea
                  value={backgroundPrompt}
                  onChange={(e) => setBackgroundPrompt(e.target.value)}
                  placeholder="Describe the background..."
                  rows={3}
                  className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg resize-none"
                />
              )}
            </div>

            {/* Summary */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-medium text-slate-900 mb-2">Generation Summary</h3>
              <ul className="space-y-1 text-sm text-slate-600">
                <li>Poses: {selectedPoses.length}</li>
                <li>Variations per pose: {batchSize}</li>
                <li>Total images: {selectedPoses.length * batchSize}</li>
                <li>Est. credits: {selectedPoses.length * batchSize * 30}</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
            >
              Back
            </button>
            <button
              onClick={handleStartGeneration}
              disabled={generating}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Start Generation
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          {/* Progress */}
          {progress && (
            <GenerationProgress progress={progress} completedPoses={generationResults} />
          )}

          {/* Results */}
          {currentGeneration?.status === 'completed' && generationResults.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Generated Poses</h3>
              <ResultsGallery poses={generationResults} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
