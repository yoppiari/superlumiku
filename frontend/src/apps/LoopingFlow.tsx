import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/authStore'
import ProfileDropdown from '../components/ProfileDropdown'
import {
  Film, Trash2, FolderPlus, Upload, ArrowLeft, Coins, Download, RotateCw, Clock, Info, X,
  Music, Settings
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description?: string
  videos: Video[]
  generations: Generation[]
  createdAt: string
  updatedAt: string
}

interface Video {
  id: string
  fileName: string
  filePath: string
  fileSize: number
  duration: number
  mimeType: string
  createdAt: string
}

interface Generation {
  id: string
  targetDuration: number
  creditUsed: number
  status: string
  outputPath?: string
  errorMessage?: string
  createdAt: string
  completedAt?: string
  loopStyle?: string
  crossfadeDuration?: number
  videoCrossfade?: boolean
  audioCrossfade?: boolean
}

interface AudioLayer {
  id: string
  generationId: string
  layerIndex: number
  fileName: string
  filePath: string
  fileSize: number
  duration: number
  volume: number
  muted: boolean
  fadeIn: number
  fadeOut: number
}

export default function LoopingFlow() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const { user, updateCreditBalance } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const [newProjectName, setNewProjectName] = useState('')
  const [showNewProject, setShowNewProject] = useState(false)
  const [targetDuration, setTargetDuration] = useState(1) // in minutes
  const [creditEstimate, setCreditEstimate] = useState(0)

  // Loop settings (Package 1)
  const [loopStyle, setLoopStyle] = useState<'simple' | 'crossfade' | 'boomerang'>('crossfade')
  const [crossfadeDuration, setCrossfadeDuration] = useState(1.0)
  const [videoCrossfade, setVideoCrossfade] = useState(true)
  const [audioCrossfade, setAudioCrossfade] = useState(true)

  // Audio layers (Package 2)
  const [audioLayers, setAudioLayers] = useState<AudioLayer[]>([])
  const [masterVolume, setMasterVolume] = useState(100)
  const [audioFadeIn, setAudioFadeIn] = useState(2.0)
  const [audioFadeOut, setAudioFadeOut] = useState(2.0)
  const [muteOriginal, setMuteOriginal] = useState(false)
  const [uploadingAudio, setUploadingAudio] = useState(false)
  const audioInputRef = useRef<HTMLInputElement>(null)

  // Pagination for generation history
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (projectId && projects.length > 0) {
      const project = projects.find(p => p.id === projectId)
      if (project) {
        setCurrentProject(project)
      }
    }
  }, [projectId, projects])

  useEffect(() => {
    // Calculate credit estimate using new formula:
    // Base: 2 credits per 10 minutes (minimum 2 credits)
    // Bonus for very long videos (>5 hours): +2 credits per hour after hour 5
    const minutes = targetDuration
    const durationInSeconds = targetDuration * 60

    // Base: 2 credits per 10 minutes (minimum 2)
    const baseCost = Math.max(2, Math.ceil(minutes / 10) * 2)

    // Bonus for very long videos (> 5 hours)
    if (minutes > 300) { // 5 hours = 300 minutes
      const hours = durationInSeconds / 3600
      const extraHours = Math.ceil(hours - 5)
      setCreditEstimate(baseCost + (extraHours * 2))
    } else {
      setCreditEstimate(baseCost)
    }
  }, [targetDuration])

  // Auto-refresh project when there are pending/processing generations
  useEffect(() => {
    if (!currentProject) return

    const hasActiveGenerations = currentProject.generations.some(
      gen => gen.status === 'pending' || gen.status === 'processing'
    )

    if (!hasActiveGenerations) return

    // Poll every 3 seconds
    const interval = setInterval(async () => {
      try {
        const projectRes = await api.get(`/api/apps/looping-flow/projects/${currentProject.id}`)
        setCurrentProject(projectRes.data.project)
        setProjects(projects.map(p => p.id === currentProject.id ? projectRes.data.project : p))
      } catch (error) {
        console.error('Failed to refresh project:', error)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [currentProject, projects])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/apps/looping-flow/projects')
      setProjects(res.data.projects)
    } catch (error: any) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const createProject = async () => {
    if (!newProjectName.trim()) return
    try {
      const res = await api.post('/api/apps/looping-flow/projects', {
        name: newProjectName,
      })
      setProjects([res.data.project, ...projects])
      setCurrentProject(res.data.project)  // Set current project immediately
      setNewProjectName('')
      setShowNewProject(false)
      navigate(`/apps/looping-flow/${res.data.project.id}`)
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create project')
    }
  }

  const deleteProject = async (id: string) => {
    if (!confirm('Delete this project and all its data?')) return
    try {
      await api.delete(`/api/apps/looping-flow/projects/${id}`)
      setProjects(projects.filter(p => p.id !== id))
      if (currentProject?.id === id) {
        setCurrentProject(null)
        navigate('/apps/looping-flow')
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete project')
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentProject) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('projectId', currentProject.id)

    try {
      setUploading(true)
      await api.post('/api/apps/looping-flow/videos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      // Refresh current project
      const projectRes = await api.get(`/api/apps/looping-flow/projects/${currentProject.id}`)
      setCurrentProject(projectRes.data.project)
      setProjects(projects.map(p => p.id === currentProject.id ? projectRes.data.project : p))
    } catch (error: any) {
      if (error.response?.status === 413) {
        alert('Storage quota exceeded! Please delete some files or upgrade your plan.')
      } else {
        alert(error.response?.data?.error || 'Failed to upload video')
      }
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const deleteVideo = async (videoId: string) => {
    if (!confirm('Delete this video?')) return
    try {
      await api.delete(`/api/apps/looping-flow/videos/${videoId}`)

      // Refresh current project
      if (currentProject) {
        const projectRes = await api.get(`/api/apps/looping-flow/projects/${currentProject.id}`)
        setCurrentProject(projectRes.data.project)
        setProjects(projects.map(p => p.id === currentProject.id ? projectRes.data.project : p))
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete video')
    }
  }

  const generateLoop = async () => {
    if (!currentProject || currentProject.videos.length === 0) return

    try {
      setGenerating(true)
      const durationInSeconds = targetDuration * 60
      const res = await api.post('/api/apps/looping-flow/generate', {
        projectId: currentProject.id,
        videoId: currentProject.videos[0]?.id,
        targetDuration: durationInSeconds,
        // Package 1: Loop settings
        loopStyle,
        crossfadeDuration,
        videoCrossfade,
        audioCrossfade,
        // Package 2: Audio settings
        masterVolume,
        audioFadeIn,
        audioFadeOut,
        muteOriginal,
      })

      updateCreditBalance(res.data.creditBalance)

      // Refresh generations
      const projectRes = await api.get(`/api/apps/looping-flow/projects/${currentProject.id}`)
      setCurrentProject(projectRes.data.project)
      setProjects(projects.map(p => p.id === currentProject.id ? projectRes.data.project : p))

      alert(`Loop generation started! Used ${res.data.creditUsed} credits.`)
    } catch (error: any) {
      if (error.response?.status === 402) {
        alert('Insufficient credits! Please purchase more credits.')
      } else {
        alert(error.response?.data?.error || 'Failed to generate loop')
      }
    } finally {
      setGenerating(false)
    }
  }

  const downloadGeneration = async (generationId: string) => {
    try {
      const res = await api.get(`/api/apps/looping-flow/download/${generationId}`, {
        responseType: 'blob',
      })

      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `looped-video-${generationId}.mp4`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error: any) {
      alert('Failed to download video')
    }
  }

  const cancelGeneration = async (generationId: string) => {
    if (!confirm('Cancel this generation?')) return
    try {
      await api.post(`/api/apps/looping-flow/generations/${generationId}/cancel`)

      // Refresh current project
      if (currentProject) {
        const projectRes = await api.get(`/api/apps/looping-flow/projects/${currentProject.id}`)
        setCurrentProject(projectRes.data.project)
        setProjects(projects.map(p => p.id === currentProject.id ? projectRes.data.project : p))
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to cancel generation')
    }
  }

  // Audio layer management (Package 2)
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentProject || currentProject.generations.length === 0) return

    const lastGeneration = currentProject.generations[0]
    if (!lastGeneration || lastGeneration.status !== 'pending') {
      alert('Can only add audio layers to pending generations')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('layerIndex', audioLayers.length.toString())
    formData.append('volume', '100')
    formData.append('fadeIn', audioFadeIn.toString())
    formData.append('fadeOut', audioFadeOut.toString())

    try {
      setUploadingAudio(true)
      const res = await api.post(
        `/api/apps/looping-flow/generations/${lastGeneration.id}/audio-layers`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      setAudioLayers([...audioLayers, res.data.audioLayer])
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to upload audio layer')
    } finally {
      setUploadingAudio(false)
      if (audioInputRef.current) {
        audioInputRef.current.value = ''
      }
    }
  }

  const updateAudioLayer = async (layerId: string, updates: Partial<AudioLayer>) => {
    try {
      await api.patch(`/api/apps/looping-flow/audio-layers/${layerId}`, updates)
      setAudioLayers(audioLayers.map(layer =>
        layer.id === layerId ? { ...layer, ...updates } : layer
      ))
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update audio layer')
    }
  }

  const deleteAudioLayer = async (layerId: string) => {
    if (!confirm('Delete this audio layer?')) return
    try {
      await api.delete(`/api/apps/looping-flow/audio-layers/${layerId}`)
      setAudioLayers(audioLayers.filter(layer => layer.id !== layerId))
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete audio layer')
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RotateCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Sticky */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => currentProject ? navigate('/apps/looping-flow') : navigate('/dashboard')}
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
                    {currentProject ? currentProject.name : 'Looping Flow'}
                  </h1>
                  <p className="text-sm md:text-[0.9375rem] text-slate-600">
                    {currentProject ? (currentProject.description || 'Seamless video looping') : 'Loop short videos into longer seamless videos'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 md:gap-6">
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-5 py-2.5 rounded-lg hover:bg-slate-100 transition-all">
                <Coins className="w-[1.125rem] h-[1.125rem] text-slate-600" />
                <span className="font-medium text-slate-900">
                  {(user?.creditBalance || 0).toLocaleString()} Credits
                </span>
              </div>
              <ProfileDropdown />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        {!currentProject ? (
          // Projects List View
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Your Projects</h2>
              <button
                onClick={() => setShowNewProject(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                <FolderPlus className="w-4 h-4" />
                New Project
              </button>
            </div>

            {showNewProject && (
              <div className="mb-6 p-4 bg-white rounded-xl border border-slate-200">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Project name..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg mb-3"
                  onKeyDown={(e) => e.key === 'Enter' && createProject()}
                />
                <div className="flex gap-2">
                  <button
                    onClick={createProject}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => { setShowNewProject(false); setNewProjectName('') }}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-xl border border-slate-200 p-6 hover:border-slate-300 hover:shadow-md transition cursor-pointer"
                  onClick={() => navigate(`/apps/looping-flow/${project.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Film className="w-5 h-5" />
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteProject(project.id) }}
                      className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">{project.name}</h3>
                  <p className="text-sm text-slate-600">
                    {project.videos.length} video{project.videos.length !== 1 ? 's' : ''} • {project.generations.length} generation{project.generations.length !== 1 ? 's' : ''}
                  </p>
                </div>
              ))}
            </div>

            {projects.length === 0 && !showNewProject && (
              <div className="text-center py-12">
                <Film className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">No projects yet</p>
                <button
                  onClick={() => setShowNewProject(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  Create Your First Project
                </button>
              </div>
            )}
          </div>
        ) : (
          // Project Detail View
          <div className="space-y-6">
            {/* Upload Section */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Upload Video</h3>

              {currentProject.videos.length === 0 ? (
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600 mb-4">Upload a short video to loop</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Choose Video'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentProject.videos.map((video) => (
                    <div key={video.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-blue-100 text-blue-600 flex items-center justify-center">
                          <Film className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{video.fileName}</p>
                          <p className="text-sm text-slate-600">
                            {formatDuration(video.duration)} • {formatFileSize(video.fileSize)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteVideo(video.id)}
                        className="p-2 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Loop Settings - Enhanced */}
            {currentProject.videos.length > 0 && (
              <>
                {/* Basic Settings */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Loop Settings
                  </h3>

                  <div className="space-y-4">
                    {/* Target Duration */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Target Duration (minutes)
                      </label>
                      <input
                        type="number"
                        value={targetDuration}
                        onChange={(e) => setTargetDuration(parseInt(e.target.value) || 0)}
                        min="1"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>

                    {/* Loop Style */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Loop Style
                      </label>
                      <select
                        value={loopStyle}
                        onChange={(e) => setLoopStyle(e.target.value as any)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="simple">Simple Loop (Fast)</option>
                        <option value="crossfade">Blend Overlay (Recommended)</option>
                        <option value="boomerang">Boomerang (Hypnotic)</option>
                      </select>
                      <p className="text-xs text-slate-500 mt-1">
                        {loopStyle === 'simple' && 'Best for: Quick previews, any video type with acceptable hard cuts'}
                        {loopStyle === 'crossfade' && 'Best for: Nature scenes, meditation, ambience videos (clouds, water, trees, abstract patterns)'}
                        {loopStyle === 'boomerang' && 'Best for: Symmetrical content, hypnotic patterns, kaleidoscope effects, trance meditation'}
                      </p>
                    </div>

                    {/* Blend Overlay Controls */}
                    {loopStyle === 'crossfade' && (
                      <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Blend Transition Duration: {crossfadeDuration}s
                          </label>
                          <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={crossfadeDuration}
                            onChange={(e) => setCrossfadeDuration(parseFloat(e.target.value))}
                            className="w-full"
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            How long the blend transition lasts at loop points (shorter = subtle, longer = more visible)
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={videoCrossfade}
                              onChange={(e) => setVideoCrossfade(e.target.checked)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm text-slate-700">Video Blend</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={audioCrossfade}
                              onChange={(e) => setAudioCrossfade(e.target.checked)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm text-slate-700">Audio Blend</span>
                          </label>
                        </div>
                      </div>
                    )}

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-900 mb-2">
                        <Info className="w-5 h-5" />
                        <span className="font-medium">Credit Estimate</span>
                      </div>
                      <p className="text-blue-700 font-semibold text-lg">
                        {creditEstimate} credit{creditEstimate !== 1 ? 's' : ''}
                      </p>
                      <p className="text-sm text-blue-700 mt-0.5">
                        for {targetDuration} minute{targetDuration !== 1 ? 's' : ''} video
                      </p>
                      <p className="text-xs text-blue-600 mt-2">
                        2 credits per 10 min{targetDuration > 300 && ' + bonus'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Audio Layers Manager */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Music className="w-5 h-5" />
                    Audio Layers
                  </h3>

                  <div className="space-y-4">
                    {/* Original Audio Control */}
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-slate-700">Original Video Audio</span>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={muteOriginal}
                            onChange={(e) => setMuteOriginal(e.target.checked)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-slate-600">Mute</span>
                        </label>
                      </div>
                      {!muteOriginal && (
                        <div>
                          <label className="block text-xs text-slate-600 mb-1">
                            Master Volume: {masterVolume}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={masterVolume}
                            onChange={(e) => setMasterVolume(parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>

                    {/* Audio Layer List */}
                    {audioLayers.map((layer) => (
                      <div key={layer.id} className="p-4 bg-purple-50 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Music className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-medium text-slate-900">{layer.fileName}</span>
                          </div>
                          <button
                            onClick={() => deleteAudioLayer(layer.id)}
                            className="p-1 hover:bg-red-100 rounded text-slate-400 hover:text-red-600 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={layer.muted}
                                onChange={(e) => updateAudioLayer(layer.id, { muted: e.target.checked })}
                                className="w-4 h-4"
                              />
                              <span className="text-xs text-slate-600">Mute</span>
                            </label>
                          </div>

                          {!layer.muted && (
                            <div>
                              <label className="block text-xs text-slate-600 mb-1">
                                Volume: {layer.volume}%
                              </label>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={layer.volume}
                                onChange={(e) => updateAudioLayer(layer.id, { volume: parseInt(e.target.value) })}
                                className="w-full"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Add Audio Layer Button */}
                    {audioLayers.length < 3 && (
                      <div>
                        <input
                          ref={audioInputRef}
                          type="file"
                          accept="audio/*"
                          onChange={handleAudioUpload}
                          className="hidden"
                        />
                        <button
                          onClick={() => audioInputRef.current?.click()}
                          disabled={uploadingAudio}
                          className="w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition text-slate-600 hover:text-purple-700 font-medium"
                        >
                          {uploadingAudio ? 'Uploading...' : '+ Add Audio Layer'}
                        </button>
                      </div>
                    )}

                    {/* Audio Fade Settings */}
                    <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">
                          Fade In: {audioFadeIn}s
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="0.5"
                          value={audioFadeIn}
                          onChange={(e) => setAudioFadeIn(parseFloat(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-600 mb-1">
                          Fade Out: {audioFadeOut}s
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="0.5"
                          value={audioFadeOut}
                          onChange={(e) => setAudioFadeOut(parseFloat(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={generateLoop}
                  disabled={generating || targetDuration < 1}
                  className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold disabled:opacity-50 text-lg shadow-lg"
                >
                  {generating ? (
                    <span className="flex items-center justify-center gap-2">
                      <RotateCw className="w-5 h-5 animate-spin" />
                      Generating...
                    </span>
                  ) : (
                    `Generate Loop (${creditEstimate} credits)`
                  )}
                </button>
              </>
            )}

            {/* Generation History */}
            {currentProject.generations.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">Generation History</h3>
                  <span className="text-sm text-slate-500">
                    {currentProject.generations.length} total
                  </span>
                </div>

                <div className="space-y-3">
                  {currentProject.generations
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((gen) => {
                    const getStatusInfo = () => {
                      switch (gen.status) {
                        case 'completed':
                          return {
                            color: 'bg-green-500',
                            label: 'Completed',
                            textColor: 'text-green-700',
                            bgColor: 'bg-green-50',
                          }
                        case 'processing':
                          return {
                            color: 'bg-blue-500',
                            label: 'Processing',
                            textColor: 'text-blue-700',
                            bgColor: 'bg-blue-50',
                          }
                        case 'failed':
                          return {
                            color: 'bg-red-500',
                            label: 'Failed',
                            textColor: 'text-red-700',
                            bgColor: 'bg-red-50',
                          }
                        case 'cancelled':
                          return {
                            color: 'bg-slate-500',
                            label: 'Cancelled',
                            textColor: 'text-slate-700',
                            bgColor: 'bg-slate-50',
                          }
                        default:
                          return {
                            color: 'bg-yellow-500',
                            label: 'Pending',
                            textColor: 'text-yellow-700',
                            bgColor: 'bg-yellow-50',
                          }
                      }
                    }

                    const statusInfo = getStatusInfo()
                    const targetMinutes = Math.ceil(gen.targetDuration / 60)
                    const estimatedTime = Math.ceil(targetMinutes / 10) * 2 // Rough estimate: 2 min per 10 min of video

                    return (
                      <div key={gen.id} className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${statusInfo.color} ${
                              gen.status === 'processing' ? 'animate-pulse' : ''
                            }`} />
                            <span className="font-medium text-slate-900">
                              {formatDuration(gen.targetDuration)} loop
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          {gen.status === 'completed' && gen.outputPath && (
                            <button
                              onClick={() => downloadGeneration(gen.id)}
                              className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                          <div className="flex items-center gap-1.5">
                            <Coins className="w-3.5 h-3.5" />
                            <span>{gen.creditUsed} credits</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{new Date(gen.createdAt).toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Loop Settings Detail */}
                        <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Settings className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-xs font-medium text-slate-700">Loop Settings</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                            <div>
                              <span className="font-medium">Style:</span>{' '}
                              {gen.loopStyle === 'simple' && 'Simple Loop'}
                              {gen.loopStyle === 'crossfade' && 'Blend Overlay'}
                              {gen.loopStyle === 'boomerang' && 'Boomerang'}
                              {!gen.loopStyle && 'Default'}
                            </div>
                            {gen.loopStyle === 'crossfade' && gen.crossfadeDuration && (
                              <div>
                                <span className="font-medium">Blend:</span> {gen.crossfadeDuration}s
                              </div>
                            )}
                            {gen.loopStyle === 'crossfade' && (
                              <>
                                <div>
                                  <span className="font-medium">Video Blend:</span> {gen.videoCrossfade ? 'Yes' : 'No'}
                                </div>
                                <div>
                                  <span className="font-medium">Audio Blend:</span> {gen.audioCrossfade ? 'Yes' : 'No'}
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {(gen.status === 'pending' || gen.status === 'processing') && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-blue-900">
                                {gen.status === 'pending' ? 'Queued for processing' : 'Processing video...'}
                              </span>
                              <div className="flex items-center gap-2">
                                {gen.status === 'processing' && (
                                  <RotateCw className="w-4 h-4 text-blue-600 animate-spin" />
                                )}
                                <button
                                  onClick={() => cancelGeneration(gen.id)}
                                  className="p-1 hover:bg-red-100 rounded text-slate-500 hover:text-red-600 transition"
                                  title="Cancel generation"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-blue-700">
                              Estimated time: ~{estimatedTime} minutes
                            </p>
                            {gen.status === 'processing' && (
                              <div className="mt-2 w-full bg-blue-200 rounded-full h-1.5">
                                <div className="bg-blue-600 h-1.5 rounded-full animate-pulse" style={{ width: '45%' }} />
                              </div>
                            )}
                          </div>
                        )}

                        {gen.status === 'failed' && gen.errorMessage && (
                          <div className="mt-3 p-3 bg-red-50 rounded-lg">
                            <p className="text-sm text-red-700 font-medium">Error:</p>
                            <p className="text-sm text-red-600 mt-1">{gen.errorMessage}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Pagination Controls */}
                {currentProject.generations.length > itemsPerPage && (
                  <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
                    <div className="text-sm text-slate-600">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                      {Math.min(currentPage * itemsPerPage, currentProject.generations.length)} of{' '}
                      {currentProject.generations.length} generations
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-300 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                      >
                        Previous
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.ceil(currentProject.generations.length / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                              currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'border border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setCurrentPage(Math.min(Math.ceil(currentProject.generations.length / itemsPerPage), currentPage + 1))}
                        disabled={currentPage === Math.ceil(currentProject.generations.length / itemsPerPage)}
                        className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-300 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
