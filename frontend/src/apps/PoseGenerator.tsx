import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import api from '../lib/api'
import { ArrowLeft, Sparkles, Loader2, CheckCircle, XCircle, Image as ImageIcon } from 'lucide-react'

interface Avatar {
  id: string
  name: string
  baseImageUrl: string
  thumbnailUrl: string | null
}

interface PoseTemplate {
  id: string
  category: string
  subcategory: string | null
  previewUrl: string
  difficulty: string
  tags: string
  fashionCategory: string | null
  sceneType: string | null
  professionTheme: string | null
}

interface Generation {
  id: string
  avatarId: string
  status: string
  progress: number
  totalPoses: number
  successfulPoses: number
  failedPoses: number
  createdAt: string
}

interface GeneratedPose {
  id: string
  outputUrl: string
  success: boolean
  poseTemplate?: PoseTemplate
}

export default function PoseGenerator() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuthStore()

  // Step state
  const [currentStep, setCurrentStep] = useState(1)

  // Data
  const [avatars, setAvatars] = useState<Avatar[]>([])
  const [poseTemplates, setPoseTemplates] = useState<PoseTemplate[]>([])
  const [generations, setGenerations] = useState<Generation[]>([])
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null)
  const [generatedPoses, setGeneratedPoses] = useState<GeneratedPose[]>([])

  // Form state
  const [selectedAvatar, setSelectedAvatar] = useState<string>('')
  const [selectedPoses, setSelectedPoses] = useState<string[]>([])
  const [quality, setQuality] = useState<'sd' | 'hd'>('sd')
  const [categoryFilter, setCategoryFilter] = useState<string>('')

  // Loading states
  const [loading, setLoading] = useState(true)
  const [loadingPoses, setLoadingPoses] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    loadAvatars()
    loadPoseTemplates()
    loadGenerations()

    // Check if avatar was passed from Avatar Creator
    if (location.state?.avatarId) {
      setSelectedAvatar(location.state.avatarId)
      setCurrentStep(2)
    }
  }, [isAuthenticated, navigate, location])

  const loadAvatars = async () => {
    try {
      const res = await api.get('/api/apps/avatar-creator/avatars')
      setAvatars(res.data.avatars || [])
    } catch (error: any) {
      console.error('Failed to load avatars:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPoseTemplates = async () => {
    try {
      const res = await api.get('/api/poses')
      setPoseTemplates(res.data.data || [])
    } catch (error: any) {
      console.error('Failed to load pose templates:', error)
    } finally {
      setLoadingPoses(false)
    }
  }

  const loadGenerations = async () => {
    try {
      const res = await api.get('/api/apps/pose-generator/generations')
      setGenerations(res.data.generations || [])
    } catch (error: any) {
      console.error('Failed to load generations:', error)
    }
  }

  const loadGeneratedPoses = async (generationId: string) => {
    try {
      const res = await api.get(`/api/apps/pose-generator/generations/${generationId}/poses`)
      setGeneratedPoses(res.data.poses || [])
    } catch (error: any) {
      console.error('Failed to load poses:', error)
    }
  }

  const handleTogglePose = (poseId: string) => {
    if (selectedPoses.includes(poseId)) {
      setSelectedPoses(selectedPoses.filter(id => id !== poseId))
    } else {
      if (selectedPoses.length < 50) {
        setSelectedPoses([...selectedPoses, poseId])
      } else {
        alert('Maximum 50 poses can be selected')
      }
    }
  }

  const handleGenerate = async () => {
    if (!selectedAvatar) {
      alert('Please select an avatar')
      return
    }

    if (selectedPoses.length === 0) {
      alert('Please select at least one pose')
      return
    }

    setGenerating(true)

    try {
      const res = await api.post('/api/apps/pose-generator/generate', {
        avatarId: selectedAvatar,
        selectedPoseIds: selectedPoses,
        quality
      })

      alert('Generation started! Check the results tab.')
      setCurrentStep(4)
      loadGenerations()

      // Poll for updates
      const generationId = res.data.generation.id
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await api.get(`/api/apps/pose-generator/generations/${generationId}`)
          const gen = statusRes.data.generation

          if (gen.status === 'completed' || gen.status === 'failed') {
            clearInterval(pollInterval)
            loadGenerations()
            if (gen.status === 'completed') {
              setSelectedGeneration(gen)
              loadGeneratedPoses(generationId)
            }
          }
        } catch (error) {
          clearInterval(pollInterval)
        }
      }, 2000)

    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to start generation')
    } finally {
      setGenerating(false)
    }
  }

  const filteredPoseTemplates = poseTemplates.filter(pose => {
    if (!categoryFilter) return true
    return pose.category === categoryFilter || pose.fashionCategory === categoryFilter
  })

  const categories = Array.from(new Set(poseTemplates.map(p => p.category)))

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">Pose Generator</h1>
              <p className="text-sm text-slate-600 mt-1">Generate professional poses with AI using your avatars</p>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-center gap-4">
            {[
              { num: 1, label: 'Select Avatar' },
              { num: 2, label: 'Choose Poses' },
              { num: 3, label: 'Configure' },
              { num: 4, label: 'Results' }
            ].map((step, index) => (
              <div key={step.num} className="flex items-center">
                <div
                  className={`flex items-center gap-2 cursor-pointer ${
                    currentStep === step.num ? 'text-blue-600' : 'text-slate-400'
                  }`}
                  onClick={() => setCurrentStep(step.num)}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    currentStep === step.num
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-300 bg-white text-slate-400'
                  }`}>
                    {step.num}
                  </div>
                  <span className="text-sm font-medium">{step.label}</span>
                </div>
                {index < 3 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    currentStep > step.num ? 'bg-blue-600' : 'bg-slate-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Step 1: Select Avatar */}
        {currentStep === 1 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Select Avatar</h2>

            {avatars.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">No avatars found</p>
                <button
                  onClick={() => navigate('/apps/avatar-creator')}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Create Avatar First
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
                  {avatars.map((avatar) => (
                    <button
                      key={avatar.id}
                      onClick={() => setSelectedAvatar(avatar.id)}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                        selectedAvatar === avatar.id
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="aspect-square">
                        <img
                          src={avatar.thumbnailUrl || avatar.baseImageUrl}
                          alt={avatar.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {selectedAvatar === avatar.id && (
                        <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white px-2 py-1 text-xs">
                        {avatar.name}
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => selectedAvatar && setCurrentStep(2)}
                  disabled={!selectedAvatar}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next: Choose Poses
                </button>
              </>
            )}
          </div>
        )}

        {/* Step 2: Choose Poses */}
        {currentStep === 2 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Choose Poses ({selectedPoses.length}/50)
              </h2>
              <div className="flex gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {loadingPoses ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 mb-6 max-h-[500px] overflow-y-auto">
                  {filteredPoseTemplates.map((pose) => (
                    <button
                      key={pose.id}
                      onClick={() => handleTogglePose(pose.id)}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                        selectedPoses.includes(pose.id)
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="aspect-square bg-slate-100">
                        <img
                          src={pose.previewUrl}
                          alt={pose.category}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {selectedPoses.includes(pose.id) && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-blue-600 bg-white rounded-full" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => selectedPoses.length > 0 && setCurrentStep(3)}
                    disabled={selectedPoses.length === 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next: Configure
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 3: Configure */}
        {currentStep === 3 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Configure Generation</h2>

            <div className="space-y-4 mb-6">
              {/* Quality */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Quality</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setQuality('sd')}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                      quality === 'sd'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-white border-slate-300 text-slate-700'
                    }`}
                  >
                    SD (512x512)
                    <div className="text-xs mt-1">Fast generation</div>
                  </button>
                  <button
                    onClick={() => setQuality('hd')}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-colors ${
                      quality === 'hd'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-white border-slate-300 text-slate-700'
                    }`}
                  >
                    HD (1024x1024)
                    <div className="text-xs mt-1">Higher quality</div>
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-medium text-slate-900 mb-2">Generation Summary</h3>
                <ul className="space-y-1 text-sm text-slate-600">
                  <li>• Avatar: Selected</li>
                  <li>• Poses: {selectedPoses.length} selected</li>
                  <li>• Quality: {quality.toUpperCase()}</li>
                  <li>• Estimated time: ~{selectedPoses.length * 3} seconds</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
              >
                Back
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
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

        {/* Step 4: Results */}
        {currentStep === 4 && (
          <div className="space-y-6">
            {/* Recent Generations */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Generations</h2>

              {generations.length === 0 ? (
                <div className="text-center py-8 text-slate-600">
                  No generations yet
                </div>
              ) : (
                <div className="space-y-3">
                  {generations.slice(0, 5).map((gen) => (
                    <div
                      key={gen.id}
                      className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedGeneration(gen)
                        loadGeneratedPoses(gen.id)
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-900">
                          Generation {gen.id.slice(0, 8)}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          gen.status === 'completed' ? 'bg-green-100 text-green-700' :
                          gen.status === 'failed' ? 'bg-red-100 text-red-700' :
                          gen.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {gen.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span>{gen.totalPoses} poses</span>
                        <span>{gen.successfulPoses} successful</span>
                        {gen.status === 'processing' && (
                          <span>{gen.progress}% complete</span>
                        )}
                      </div>
                      {gen.status === 'processing' && (
                        <div className="mt-2 bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-600 h-full transition-all duration-300"
                            style={{ width: `${gen.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Generated Poses */}
            {selectedGeneration && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Generated Poses ({generatedPoses.length})
                </h2>

                {generatedPoses.length === 0 ? (
                  <div className="text-center py-8 text-slate-600">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Generating poses...
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {generatedPoses.map((pose) => (
                      <div key={pose.id} className="rounded-lg overflow-hidden border border-slate-200">
                        <div className="aspect-square bg-slate-100">
                          <img
                            src={pose.outputUrl}
                            alt="Generated pose"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-2 bg-white flex items-center justify-center">
                          {pose.success ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
