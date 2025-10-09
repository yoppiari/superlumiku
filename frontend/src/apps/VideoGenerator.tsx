import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { api } from '../lib/api'
import ProfileDropdown from '../components/ProfileDropdown'
import CreateProjectModal from '../components/CreateProjectModal'
import {
  Film, Plus, ArrowLeft, Coins, Sparkles, Loader2, Download,
  Trash2, Play, AlertCircle, CheckCircle, Clock
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  generations: Generation[]
}

interface Generation {
  id: string
  projectId: string
  provider: string
  modelId: string
  modelName: string
  prompt: string
  negativePrompt?: string
  resolution: string
  duration: number
  aspectRatio: string
  creditUsed: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  outputPath?: string
  thumbnailPath?: string
  errorMessage?: string
  createdAt: string
  completedAt?: string
}

interface Model {
  id: string
  name: string
  provider: string
  maxDuration: number
  defaultDuration: number
  resolutions: string[]
  aspectRatios: string[]
  supportsImageToVideo: boolean
  supportsNegativePrompt: boolean
  description?: string
}

export default function VideoGenerator() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const { user } = useAuthStore()

  // State
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [models, setModels] = useState<Model[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Generation form state
  const [prompt, setPrompt] = useState('')
  const [resolution, setResolution] = useState('720p')
  const [duration, setDuration] = useState(5)
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [isGenerating, setIsGenerating] = useState(false)
  const [creditEstimate, setCreditEstimate] = useState(500)

  // Polling state
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

  // Load projects on mount
  useEffect(() => {
    loadProjects()
    loadModels()
  }, [])

  // Load project if projectId is in URL
  useEffect(() => {
    if (projectId) {
      selectProject(projectId)
    } else {
      setCurrentProject(null)
    }
  }, [projectId])

  // Start polling for generation status when project is loaded
  useEffect(() => {
    if (currentProject) {
      // Check immediately
      checkGenerationStatuses()

      // Then poll every 5 seconds
      const interval = setInterval(() => {
        checkGenerationStatuses()
      }, 5000)

      setPollingInterval(interval)

      return () => {
        if (interval) clearInterval(interval)
      }
    } else {
      if (pollingInterval) {
        clearInterval(pollingInterval)
        setPollingInterval(null)
      }
    }
  }, [currentProject?.id])

  const loadProjects = async () => {
    try {
      setIsLoadingProjects(true)
      const res = await api.get('/api/apps/video-generator/projects')
      setProjects(res.data.projects)
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setIsLoadingProjects(false)
    }
  }

  const loadModels = async () => {
    try {
      const res = await api.get('/api/apps/video-generator/models')
      setModels(res.data.models)
    } catch (error) {
      console.error('Failed to load models:', error)
    }
  }

  const selectProject = async (id: string) => {
    try {
      const res = await api.get(`/api/apps/video-generator/projects/${id}`)
      setCurrentProject(res.data.project)
    } catch (error) {
      console.error('Failed to load project:', error)
    }
  }

  const handleCreateProject = async (name: string, description?: string) => {
    try {
      const res = await api.post('/api/apps/video-generator/projects', { name, description })
      const project = res.data.project
      await loadProjects()
      navigate(`/apps/video-generator/${project.id}`)
      setShowCreateModal(false)
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create project')
    }
  }

  const handleSelectProject = (id: string) => {
    navigate(`/apps/video-generator/${id}`)
  }

  const handleBackToProjects = () => {
    navigate('/apps/video-generator')
  }

  const handleDeleteProject = async (id: string, name: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}"?\n\nThis action cannot be undone. All video generations will be permanently deleted.`
    )

    if (!confirmed) return

    try {
      await api.delete(`/api/apps/video-generator/projects/${id}`)
      await loadProjects()
      if (currentProject?.id === id) {
        navigate('/apps/video-generator')
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete project')
    }
  }

  const handleGenerate = async () => {
    if (!currentProject || !prompt.trim()) {
      alert('Please enter a prompt')
      return
    }

    // Use first available model (wan2.2)
    const model = models[0]
    if (!model) {
      alert('No models available')
      return
    }

    try {
      setIsGenerating(true)

      const res = await api.post('/api/apps/video-generator/generate', {
        projectId: currentProject.id,
        modelId: model.id,
        prompt: prompt.trim(),
        resolution,
        duration,
        aspectRatio,
      })

      // Reload project to get new generation
      await selectProject(currentProject.id)

      // Clear prompt
      setPrompt('')

      alert('Video generation started! It will take a few minutes.')
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to start generation')
    } finally {
      setIsGenerating(false)
    }
  }

  const checkGenerationStatuses = async () => {
    if (!currentProject) return

    try {
      // Get latest project data
      const res = await api.get(`/api/apps/video-generator/projects/${currentProject.id}`)
      setCurrentProject(res.data.project)
    } catch (error) {
      console.error('Failed to check generation status:', error)
    }
  }

  const handleDownload = async (generation: Generation) => {
    if (!generation.outputPath) return

    try {
      const link = document.createElement('a')
      link.href = generation.outputPath
      link.download = `video_${generation.id}.mp4`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      alert('Failed to download video')
    }
  }

  if (isLoadingProjects) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  // Loading state: when projectId exists in URL but currentProject not loaded yet
  if (projectId && (!currentProject || currentProject.id !== projectId)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading project...</div>
      </div>
    )
  }

  // Project Detail View
  if (currentProject) {
    const activeGeneration = currentProject.generations.find(
      g => g.status === 'pending' || g.status === 'processing'
    )

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBackToProjects}
                  className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-600 hover:text-slate-900"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Film className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-[1.75rem] font-semibold text-slate-900 tracking-tighter">
                      {currentProject.name}
                    </h1>
                    {currentProject.description && (
                      <p className="text-sm md:text-[0.9375rem] text-slate-600">{currentProject.description}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 md:gap-6">
                <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-5 py-2.5 rounded-lg hover:bg-slate-100 transition-all">
                  <Coins className="w-[1.125rem] h-[1.125rem] text-slate-600" />
                  <span className="font-medium text-slate-900">{(user?.creditBalance || 0).toLocaleString()} Credits</span>
                </div>
                <ProfileDropdown />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-4 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Left Panel: Generation Form */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Generate New Video
              </h2>

              {/* Model Info */}
              {models.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm font-medium text-blue-900">Model: {models[0].name}</p>
                  <p className="text-xs text-blue-700 mt-1">{models[0].description}</p>
                </div>
              )}

              {/* Prompt */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prompt *
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the video you want to generate..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={6}
                  disabled={isGenerating || !!activeGeneration}
                />
              </div>

              {/* Settings Row */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resolution
                  </label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isGenerating || !!activeGeneration}
                  >
                    <option value="720p">720p</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (s)
                  </label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    min={1}
                    max={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isGenerating || !!activeGeneration}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aspect Ratio
                  </label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isGenerating || !!activeGeneration}
                  >
                    <option value="16:9">16:9</option>
                    <option value="9:16">9:16</option>
                  </select>
                </div>
              </div>

              {/* Credit Estimate */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                <span className="text-sm text-gray-600">Estimated Cost</span>
                <span className="text-lg font-bold text-gray-900">{creditEstimate.toLocaleString()} Credits</span>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim() || !!activeGeneration}
                className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Starting Generation...
                  </>
                ) : activeGeneration ? (
                  <>
                    <Clock className="w-5 h-5" />
                    Generation in Progress
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Generate Video
                  </>
                )}
              </button>

              {activeGeneration && (
                <p className="mt-3 text-sm text-center text-amber-600">
                  ⏳ Please wait for current generation to complete
                </p>
              )}
            </div>

            {/* Right Panel: Generation History */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Generation History</h2>

              {currentProject.generations.length === 0 ? (
                <div className="text-center py-16">
                  <Film className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No generations yet</p>
                  <p className="text-gray-400 text-sm">Start by creating your first video</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {currentProject.generations
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((gen) => (
                      <div
                        key={gen.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        {/* Status Badge */}
                        <div className="flex items-center justify-between mb-3">
                          {gen.status === 'completed' && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              Completed
                            </span>
                          )}
                          {gen.status === 'processing' && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center gap-1">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Processing
                            </span>
                          )}
                          {gen.status === 'pending' && (
                            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Pending
                            </span>
                          )}
                          {gen.status === 'failed' && (
                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              Failed
                            </span>
                          )}

                          <span className="text-xs text-gray-500">
                            {new Date(gen.createdAt).toLocaleString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        {/* Prompt */}
                        <p className="text-sm text-gray-700 mb-2 line-clamp-2">{gen.prompt}</p>

                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                          <span>{gen.resolution}</span>
                          <span>•</span>
                          <span>{gen.duration}s</span>
                          <span>•</span>
                          <span>{gen.aspectRatio}</span>
                          <span>•</span>
                          <span>{gen.creditUsed} credits</span>
                        </div>

                        {/* Error Message */}
                        {gen.errorMessage && (
                          <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                            {gen.errorMessage}
                          </div>
                        )}

                        {/* Download Button */}
                        {gen.status === 'completed' && gen.outputPath && (
                          <button
                            onClick={() => handleDownload(gen)}
                            className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm font-medium"
                          >
                            <Download className="w-4 h-4" />
                            Download Video
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Projects List View
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-[1.75rem] font-semibold text-slate-900 tracking-tighter">AI Video Generator</h1>
                  <p className="text-sm md:text-[0.9375rem] text-slate-600">Generate videos from text prompts</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 md:gap-6">
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-5 py-2.5 rounded-lg hover:bg-slate-100 transition-all">
                <Coins className="w-[1.125rem] h-[1.125rem] text-slate-600" />
                <span className="font-medium text-slate-900">{(user?.creditBalance || 0).toLocaleString()} Credits</span>
              </div>
              <ProfileDropdown />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 lg:p-8">
        {/* New Project Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="mb-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          New Project
        </button>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <Film className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No projects yet</p>
              <p className="text-gray-400 text-sm">Create your first project to get started</p>
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all relative group"
              >
                <div
                  onClick={() => handleSelectProject(project.id)}
                  className="cursor-pointer"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{project.name}</h3>
                  {project.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>
                  )}

                  {/* Generation Count */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500">
                      🎬 {project.generations.length} generation{project.generations.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-blue-600 font-medium text-sm">
                      {project.generations.filter(g => g.status === 'completed').length} completed
                    </span>
                  </div>

                  {/* Timestamps */}
                  <div className="text-xs text-gray-500 space-y-1 border-t pt-3">
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span className="font-medium">
                        {new Date(project.createdAt).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Edit:</span>
                      <span className="font-medium">
                        {new Date(project.updatedAt).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteProject(project.id, project.name)
                  }}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="Delete project"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  )
}
