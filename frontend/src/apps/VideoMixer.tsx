import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/authStore'
import ProfileDropdown from '../components/ProfileDropdown'
import {
  Video, Plus, Trash2, FolderPlus, Upload, Shuffle,
  ArrowLeft, Settings, Grid3x3, List, Film, Clock, HardDrive,
  Download, RotateCw, Info, Volume2,
  Archive, ChevronLeft, ChevronRight, Coins
} from 'lucide-react'

// Download Section Component
const DownloadSection = ({
  generationId,
  outputPaths,
  onDownload,
  onDownloadAll,
  isDownloading
}: {
  generationId: string
  outputPaths: string[]
  onDownload: (genId: string, index: number) => void
  onDownloadAll: (genId: string) => void
  isDownloading: boolean
}) => {
  const [currentPage, setCurrentPage] = useState(0)
  const videosPerPage = 5
  const totalPages = Math.ceil(outputPaths.length / videosPerPage)
  const startIndex = currentPage * videosPerPage
  const endIndex = Math.min(startIndex + videosPerPage, outputPaths.length)
  const currentVideos = outputPaths.slice(startIndex, endIndex)

  return (
    <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
      {/* Download All Button */}
      <button
        onClick={() => onDownloadAll(generationId)}
        disabled={isDownloading}
        className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition flex items-center justify-center gap-2 font-semibold shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isDownloading ? (
          <>
            <RotateCw className="w-5 h-5 animate-spin" />
            Preparing ZIP... ({outputPaths.length} videos)
          </>
        ) : (
          <>
            <Archive className="w-5 h-5" />
            Download All ({outputPaths.length} videos) as ZIP
          </>
        )}
      </button>

      {/* Individual Downloads with Pagination */}
      <div>
        <div className="text-xs font-medium text-gray-600 mb-2">Or download individual videos:</div>
        <div className="grid grid-cols-2 gap-2">
          {currentVideos.map((_, index) => {
            const actualIndex = startIndex + index
            return (
              <button
                key={actualIndex}
                onClick={() => onDownload(generationId, actualIndex)}
                className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition flex items-center justify-center gap-2 text-xs font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                Video {actualIndex + 1}
              </button>
            )
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1"
            >
              <ChevronLeft className="w-3 h-3" />
              Prev
            </button>
            <span className="text-xs text-gray-600">
              Page {currentPage + 1} of {totalPages} ({startIndex + 1}-{endIndex} of {outputPaths.length})
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

interface Project {
  id: string
  name: string
  description?: string
  createdAt: string
  videos: VideoFile[]
  groups: Group[]
}

interface Group {
  id: string
  name: string
  order: number
  videos: VideoFile[]
}

interface VideoFile {
  id: string
  fileName: string
  duration: number
  fileSize: number
  groupId?: string
  order: number
}

interface Generation {
  id: string
  totalVideos: number
  creditUsed: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  outputPaths?: string
  createdAt: string
  completedAt?: string

  // Quality Settings
  videoResolution: string
  frameRate: number
  aspectRatio: string
  videoBitrate: string
  metadataSource: string

  // Anti-Fingerprinting
  enableOrderMixing: boolean
  enableDifferentStart: boolean
  fixedStartVideoId?: string
  enableGroupMixing: boolean
  groupMixingMode: string
  enableSpeedVariations: boolean
  speedMin: number
  speedMax: number

  // Duration
  durationType: string
  fixedDuration?: number
  smartDistribution: boolean
  distributionMode: string

  // Audio
  audioOption: string
}

interface GenerationSettings {
  // Mixing Options (Anti-Fingerprinting)
  enableOrderMixing: boolean
  enableDifferentStart: boolean
  fixedStartVideoId?: string
  enableGroupMixing: boolean
  groupMixingMode: 'sequential' | 'random'
  enableSpeedVariations: boolean
  speedMin: number
  speedMax: number

  // Quality Settings
  metadataSource: 'capcut' | 'tiktok' | 'instagram' | 'youtube'
  videoBitrate: 'low' | 'medium' | 'high'
  videoResolution: '480p' | '720p' | '1080p' | '4k'
  frameRate: 24 | 30 | 60
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5'

  // Duration Settings
  durationType: 'original' | 'fixed'
  fixedDuration?: number
  smartDistribution: boolean
  distributionMode: 'proportional' | 'equal' | 'weighted'

  // Audio
  audioOption: 'keep' | 'mute'
}

export default function VideoMixer() {
  const navigate = useNavigate()
  const { user, updateCreditBalance, updateStorageUsed } = useAuthStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', description: '' })
  const [newGroupName, setNewGroupName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [generations, setGenerations] = useState<Generation[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [settings, setSettings] = useState<GenerationSettings>({
    // Mixing Options
    enableOrderMixing: true,
    enableDifferentStart: false,
    fixedStartVideoId: undefined,
    enableGroupMixing: false,
    groupMixingMode: 'sequential',
    enableSpeedVariations: false,
    speedMin: 0.5,
    speedMax: 2.0,

    // Quality Settings
    metadataSource: 'capcut',
    videoBitrate: 'medium',
    videoResolution: '720p',
    frameRate: 30,
    aspectRatio: '16:9',

    // Duration Settings
    durationType: 'original',
    fixedDuration: 30,
    smartDistribution: false,
    distributionMode: 'proportional',

    // Audio
    audioOption: 'keep',
  })
  const [videosToGenerate, setVideosToGenerate] = useState(5)

  // Calculated values
  const [possibleCombinations, setPossibleCombinations] = useState(0)
  const [totalCost, setTotalCost] = useState(0)
  const [strengthScore, setStrengthScore] = useState(0)

  useEffect(() => {
    loadProjects()
  }, [])

  // Real-time calculations
  useEffect(() => {
    if (selectedProject) {
      calculateAllMetrics()
    }
  }, [settings, videosToGenerate, selectedProject])

  const calculateAllMetrics = () => {
    if (!selectedProject || !selectedProject.videos || selectedProject.videos.length === 0) {
      setPossibleCombinations(0)
      setTotalCost(0)
      setStrengthScore(0)
      return
    }

    // Calculate strength
    let strength = 0
    if (settings.enableOrderMixing) strength += 1
    if (settings.enableDifferentStart) strength += 1
    if (settings.enableGroupMixing) {
      strength += settings.groupMixingMode === 'random' ? 2 : 1
    }
    if (settings.enableSpeedVariations) strength += 1
    setStrengthScore(Math.min(strength, 5))

    // Calculate combinations
    const totalVideos = selectedProject.videos.length
    const groupCount = selectedProject.groups?.length || 0
    let combinations = 1

    if (totalVideos > 10) {
      combinations = Infinity
    } else {
      for (let i = 2; i <= totalVideos; i++) {
        combinations *= i
      }
      if (settings.enableGroupMixing && groupCount > 1 && groupCount <= 10) {
        let groupPerms = 1
        for (let i = 2; i <= groupCount; i++) {
          groupPerms *= i
        }
        combinations *= groupPerms
      }
    }
    setPossibleCombinations(combinations)

    // Calculate cost
    let costPerVideo = 1 // base

    // Mixing
    if (settings.enableOrderMixing) costPerVideo += 1
    if (settings.enableGroupMixing && settings.groupMixingMode === 'random') costPerVideo += 2
    if (settings.enableSpeedVariations) costPerVideo += 1

    // Quality
    const resolutionCosts: Record<string, number> = { '480p': 0, '720p': 2, '1080p': 5, '4k': 10 }
    costPerVideo += resolutionCosts[settings.videoResolution] || 0
    if (settings.videoBitrate === 'high') costPerVideo += 2
    if (settings.frameRate === 60) costPerVideo += 3

    // Duration
    if (settings.smartDistribution) costPerVideo += 1

    setTotalCost(costPerVideo * videosToGenerate)
  }

  const loadProjects = async () => {
    try {
      const res = await api.get('/api/apps/video-mixer/projects')
      setProjects(res.data.projects)
    } catch (error: any) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProjectDetail = async (projectId: string) => {
    try {
      const res = await api.get(`/api/apps/video-mixer/projects/${projectId}`)
      setSelectedProject(res.data.project)
      loadGenerations(projectId)
    } catch (error: any) {
      alert('Failed to load project details')
    }
  }

  const loadGenerations = async (projectId: string) => {
    try {
      const res = await api.get(`/api/apps/video-mixer/projects/${projectId}/generations`)
      setGenerations(res.data.generations || [])
    } catch (error: any) {
      console.error('Failed to load generations:', error)
    }
  }

  // Auto-poll for in-progress generations
  useEffect(() => {
    if (!selectedProject) return

    const inProgressGens = generations.filter(g =>
      g.status === 'pending' || g.status === 'processing'
    )

    if (inProgressGens.length === 0) return

    // Poll every 3 seconds
    const interval = setInterval(() => {
      loadGenerations(selectedProject.id)
    }, 3000)

    return () => clearInterval(interval)
  }, [selectedProject, generations])

  // Download handler
  const handleDownload = async (generationId: string, fileIndex: number) => {
    try {
      const res = await api.get(
        `/api/apps/video-mixer/download/${generationId}/${fileIndex}`,
        { responseType: 'blob' }
      )

      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `generated_video_${fileIndex + 1}.mp4`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      alert('Download failed: ' + (error.response?.data?.error || error.message))
    }
  }

  // Download all as ZIP handler
  const [downloadingZip, setDownloadingZip] = useState<Record<string, boolean>>({})

  const handleDownloadAll = async (generationId: string) => {
    setDownloadingZip(prev => ({ ...prev, [generationId]: true }))
    try {
      const res = await api.get(
        `/api/apps/video-mixer/download-all/${generationId}`,
        { responseType: 'blob' }
      )

      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `generation_${generationId}.zip`
      link.click()
      window.URL.revokeObjectURL(url)

      // Show success message briefly
      setTimeout(() => {
        setDownloadingZip(prev => ({ ...prev, [generationId]: false }))
      }, 1000)
    } catch (error: any) {
      setDownloadingZip(prev => ({ ...prev, [generationId]: false }))
      alert('Download failed: ' + (error.response?.data?.error || error.message))
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProject.name.trim()) return

    setCreating(true)
    try {
      const res = await api.post('/api/apps/video-mixer/projects', newProject)
      setProjects([res.data.project, ...projects])
      setNewProject({ name: '', description: '' })
      setShowNewProject(false)
      loadProjectDetail(res.data.project.id)
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Delete this project?')) return

    try {
      await api.delete(`/api/apps/video-mixer/projects/${id}`)
      setProjects(projects.filter(p => p.id !== id))
      if (selectedProject?.id === id) setSelectedProject(null)
    } catch (error: any) {
      alert('Failed to delete project')
    }
  }

  const handleCreateGroup = async () => {
    if (!selectedProject || !newGroupName.trim()) return

    try {
      await api.post('/api/apps/video-mixer/groups', {
        projectId: selectedProject.id,
        name: newGroupName,
      })
      setNewGroupName('')
      loadProjectDetail(selectedProject.id)
    } catch (error: any) {
      alert('Failed to create group')
    }
  }

  const handleGenerate = async () => {
    if (!selectedProject) return
    if (!confirm(`Generate ${videosToGenerate} videos? This will cost ${totalCost} credits.`)) return

    try {
      const res = await api.post('/api/apps/video-mixer/generate', {
        projectId: selectedProject.id,
        totalVideos: videosToGenerate,
        settings,
      })
      updateCreditBalance(res.data.creditBalance)

      // Reload generations to show new one
      if (selectedProject) {
        loadGenerations(selectedProject.id)
      }

      alert(`Generation started! Used ${res.data.creditUsed} credits. Check Generation History below.`)
    } catch (error: any) {
      if (error.response?.status === 402) {
        alert('Insufficient credits!')
        navigate('/credits')
      } else {
        alert(error.response?.data?.error || 'Failed to generate')
      }
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedProject || !e.target.files || e.target.files.length === 0) return

    const files = Array.from(e.target.files)
    const maxSize = 100 * 1024 * 1024 // 100MB

    // Validate all files first
    for (const file of files) {
      if (file.size > maxSize) {
        alert(`File "${file.name}" exceeds 100MB limit`)
        return
      }
      if (!file.type.startsWith('video/')) {
        alert(`File "${file.name}" is not a video file`)
        return
      }
    }

    setUploading(true)

    try {
      let successCount = 0
      let failedCount = 0

      // Upload files one by one
      for (const file of files) {
        try {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('projectId', selectedProject.id)

          const res = await api.post('/api/apps/video-mixer/videos/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          })

          // Update storage used in auth store
          if (res.data.storageUsed !== undefined) {
            updateStorageUsed(res.data.storageUsed)
          }

          successCount++
        } catch (error: any) {
          console.error(`Failed to upload ${file.name}:`, error)

          // Handle storage quota exceeded (413 error)
          if (error.response?.status === 413) {
            const data = error.response.data
            const usedMB = (data.used / 1024 / 1024).toFixed(1)
            const quotaMB = (data.quota / 1024 / 1024).toFixed(0)
            const availableMB = (data.available / 1024 / 1024).toFixed(1)

            alert(
              `Storage quota exceeded!\n\n` +
                `Used: ${usedMB} MB / ${quotaMB} MB\n` +
                `Available: ${availableMB} MB\n` +
                `File size: ${(data.fileSize / 1024 / 1024).toFixed(1)} MB\n\n` +
                `Please delete some files or upgrade your plan.`
            )
            break // Stop uploading remaining files
          }

          failedCount++
        }
      }

      // Reload project to show new videos
      loadProjectDetail(selectedProject.id)

      // Show summary
      if (failedCount === 0) {
        alert(`Successfully uploaded ${successCount} video${successCount > 1 ? 's' : ''}!`)
      } else {
        alert(`Uploaded ${successCount} video(s), ${failedCount} failed`)
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to upload videos')
    } finally {
      setUploading(false)
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleAssignToGroup = async (videoId: string, groupId: string | null) => {
    try {
      await api.put(`/api/apps/video-mixer/videos/${videoId}`, { groupId })

      // Reload project to update video list
      if (selectedProject) {
        loadProjectDetail(selectedProject.id)
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to assign video to group')
    }
  }

  const handleDeleteVideo = async (videoId: string, fileName: string) => {
    if (!confirm(`Delete "${fileName}"?`)) return

    try {
      await api.delete(`/api/apps/video-mixer/videos/${videoId}`)

      // Reload project to update video list
      if (selectedProject) {
        loadProjectDetail(selectedProject.id)
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete video')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; icon: string; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '🟡', label: 'Pending' },
      processing: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '🔵', label: 'Processing' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', icon: '✅', label: 'Completed' },
      failed: { bg: 'bg-red-100', text: 'text-red-700', icon: '❌', label: 'Failed' },
    }
    return configs[status] || configs.pending
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-6 md:px-10 py-8">
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
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-[1.75rem] font-semibold text-slate-900 tracking-tighter">Video Mixer</h1>
                  <p className="text-sm md:text-[0.9375rem] text-slate-600">Mix & generate video combinations</p>
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

      <div className="max-w-[1920px] mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Projects Sidebar */}
          <div className="col-span-3">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
                <button
                  onClick={() => setShowNewProject(!showNewProject)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600 hover:text-gray-900"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {showNewProject && (
                <form onSubmit={handleCreateProject} className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <input
                    type="text"
                    placeholder="Project name"
                    value={newProject.name}
                    onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={newProject.description}
                    onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={creating}
                      className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition text-sm font-medium shadow-sm"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewProject(false)}
                      className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                {projects.map(project => (
                  <div
                    key={project.id}
                    className={`p-4 rounded-xl cursor-pointer transition border ${
                      selectedProject?.id === project.id
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                    onClick={() => loadProjectDetail(project.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">{project.name}</h3>
                        {project.description && (
                          <p className="text-xs text-gray-500 line-clamp-1">{project.description}</p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteProject(project.id)
                        }}
                        className="text-gray-400 hover:text-red-500 transition ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Film className="w-3 h-3" />
                        {project.videos?.length || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <FolderPlus className="w-3 h-3" />
                        {project.groups?.length || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-6">
            {selectedProject ? (
              <div className="space-y-6">
                {/* Upload Section */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Videos</h3>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition cursor-pointer"
                  >
                    {uploading ? (
                      <>
                        <RotateCw className="w-12 h-12 text-blue-500 mx-auto mb-3 animate-spin" />
                        <p className="text-gray-700 mb-1">Uploading...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-700 mb-1">Drag & drop videos here</p>
                        <p className="text-sm text-gray-500">or click to browse (Max 100MB)</p>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      multiple
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Videos List */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Videos ({selectedProject.videos?.length || 0})
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
                      >
                        <Grid3x3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {selectedProject.videos && selectedProject.videos.length > 0 ? (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-2'}>
                      {selectedProject.videos.map((video) => (
                        <div
                          key={video.id}
                          className="group bg-gray-50 hover:bg-gray-100 rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                              <Video className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate mb-1">{video.fileName}</h4>
                              <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDuration(video.duration)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <HardDrive className="w-3 h-3" />
                                  {formatFileSize(video.fileSize)}
                                </span>
                              </div>
                              {/* Group Assignment */}
                              <select
                                value={video.groupId || ''}
                                onChange={(e) => handleAssignToGroup(video.id, e.target.value || null)}
                                className="w-full text-xs px-2 py-1 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">No Group (Default)</option>
                                {selectedProject.groups?.map(group => (
                                  <option key={group.id} value={group.id}>
                                    {group.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <button
                              onClick={() => handleDeleteVideo(video.id, video.fileName)}
                              className="opacity-0 group-hover:opacity-100 transition text-gray-400 hover:text-red-500"
                              title="Delete video"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Film className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No videos uploaded yet</p>
                    </div>
                  )}
                </div>

                {/* Groups */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Groups</h3>

                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      placeholder="New group name"
                      value={newGroupName}
                      onChange={e => setNewGroupName(e.target.value)}
                      className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleCreateGroup}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition flex items-center gap-2 shadow-sm"
                    >
                      <FolderPlus className="w-4 h-4" />
                      Add
                    </button>
                  </div>

                  {selectedProject.groups && selectedProject.groups.length > 0 ? (
                    <div className="space-y-2">
                      {selectedProject.groups.map(group => (
                        <div key={group.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{group.name}</h4>
                              <p className="text-sm text-gray-500">{group.videos?.length || 0} videos</p>
                            </div>
                            <button className="text-gray-400 hover:text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FolderPlus className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No groups created</p>
                    </div>
                  )}
                </div>

                {/* Generation History */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Generation History</h3>

                  {generations && generations.length > 0 ? (
                    <div className="space-y-3">
                      {generations.map((gen) => {
                        const statusConfig = getStatusConfig(gen.status)
                        return (
                          <div
                            key={gen.id}
                            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                          >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-3">
                              <span className={`inline-flex items-center gap-2 px-3 py-1 ${statusConfig.bg} ${statusConfig.text} rounded-full text-xs font-medium`}>
                                {statusConfig.icon} {statusConfig.label}
                              </span>
                              <span className="text-xs text-gray-500">{formatDate(gen.createdAt)}</span>
                            </div>

                            {/* Summary */}
                            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                              <div className="text-gray-600">
                                <span className="font-medium text-gray-900">{gen.totalVideos}</span> videos generated
                              </div>
                              <div className="text-gray-600">
                                <span className="font-medium text-gray-900">{gen.creditUsed}</span> credits used
                              </div>
                            </div>

                            {/* Settings Details */}
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="text-xs font-medium text-gray-700 mb-2">Settings Used:</div>

                              {/* Quality Settings */}
                              <div className="mb-2">
                                <div className="text-xs text-gray-500 font-medium mb-1">Quality</div>
                                <div className="flex flex-wrap gap-1.5">
                                  <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                                    {gen.videoResolution}
                                  </span>
                                  <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                                    {gen.frameRate} FPS
                                  </span>
                                  <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                                    {gen.aspectRatio}
                                  </span>
                                  <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                                    {gen.videoBitrate} bitrate
                                  </span>
                                </div>
                              </div>

                              {/* Anti-Fingerprinting */}
                              <div className="mb-2">
                                <div className="text-xs text-gray-500 font-medium mb-1">Anti-Fingerprinting</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {gen.enableOrderMixing && (
                                    <span className="inline-flex items-center px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">
                                      ✓ Order Mixing
                                    </span>
                                  )}
                                  {gen.enableDifferentStart && (
                                    <span className="inline-flex items-center px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">
                                      ✓ Different Start
                                    </span>
                                  )}
                                  {gen.enableGroupMixing && (
                                    <span className="inline-flex items-center px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">
                                      ✓ Group Mix ({gen.groupMixingMode})
                                    </span>
                                  )}
                                  {gen.enableSpeedVariations && (
                                    <span className="inline-flex items-center px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">
                                      ✓ Speed {gen.speedMin}x-{gen.speedMax}x
                                    </span>
                                  )}
                                  {gen.smartDistribution && (
                                    <span className="inline-flex items-center px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">
                                      ✓ Smart Distribution ({gen.distributionMode})
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Audio & Duration */}
                              <div>
                                <div className="text-xs text-gray-500 font-medium mb-1">Other</div>
                                <div className="flex flex-wrap gap-1.5">
                                  <span className="inline-flex items-center px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">
                                    Audio: {gen.audioOption === 'keep' ? 'Keep Original' : 'Muted'}
                                  </span>
                                  <span className="inline-flex items-center px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">
                                    Duration: {gen.durationType === 'original' ? 'Original' : `Fixed ${gen.fixedDuration}s`}
                                  </span>
                                  <span className="inline-flex items-center px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">
                                    Metadata: {gen.metadataSource}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            {gen.status === 'completed' && gen.outputPaths && (
                              <DownloadSection
                                generationId={gen.id}
                                outputPaths={JSON.parse(gen.outputPaths)}
                                onDownload={handleDownload}
                                onDownloadAll={handleDownloadAll}
                                isDownloading={downloadingZip[gen.id] || false}
                              />
                            )}
                            {gen.status === 'processing' && (
                              <div className="flex items-center justify-center gap-2 text-blue-600 text-sm font-medium mt-2">
                                <RotateCw className="w-4 h-4 animate-spin" />
                                Processing...
                              </div>
                            )}
                            {gen.status === 'failed' && (
                              <div className="text-red-600 text-sm text-center mt-2">
                                Generation failed. Please try again.
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Film className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">No generations yet</p>
                      <p className="text-xs text-gray-400 mt-1">Click "Start Processing" to create your first generation</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center h-full flex items-center justify-center">
                <div>
                  <Video className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Project Selected</h3>
                  <p className="text-gray-500 mb-6">Create or select a project to get started</p>
                  <button
                    onClick={() => setShowNewProject(true)}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition inline-flex items-center gap-2 shadow-sm"
                  >
                    <Plus className="w-5 h-5" />
                    Create New Project
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Settings Panel */}
          <div className="col-span-3">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-700" />
                  <h3 className="text-lg font-semibold text-gray-900">Processing Settings</h3>
                </div>
              </div>

              <div className="p-6 space-y-8">
                {/* Mixing Options */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Shuffle className="w-5 h-5 text-gray-700" />
                    <h4 className="text-base font-semibold text-gray-900">Mixing Options</h4>
                  </div>

                  {/* Info Banner */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-semibold text-blue-900 mb-1 text-sm">Anti-Fingerprinting Protection</h5>
                        <p className="text-sm text-blue-700">
                          Each option adds unique variations to prevent duplicate detection. The more options enabled, the more unique each video becomes!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Order Mixing */}
                    <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-gray-200">
                      <input
                        type="checkbox"
                        checked={settings.enableOrderMixing}
                        onChange={(e) => setSettings({...settings, enableOrderMixing: e.target.checked})}
                        className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">Order Mixing</div>
                        <div className="text-xs text-gray-600">Randomize video sequence</div>
                      </div>
                      <div className="text-xs font-medium text-gray-500">+1 credit/video</div>
                    </label>

                    {/* Different Starting Video */}
                    <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-gray-200">
                      <input
                        type="checkbox"
                        checked={settings.enableDifferentStart}
                        onChange={(e) => setSettings({...settings, enableDifferentStart: e.target.checked})}
                        className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">Different Starting Video</div>
                        <div className="text-xs text-gray-600">Each variant starts uniquely</div>
                      </div>
                      <div className="text-xs font-medium text-green-600">FREE</div>
                    </label>

                    {/* Group-Based Mixing */}
                    <div className="border border-gray-200 rounded-lg p-3">
                      <label className="flex items-center gap-3 cursor-pointer mb-3">
                        <input
                          type="checkbox"
                          checked={settings.enableGroupMixing}
                          onChange={(e) => setSettings({...settings, enableGroupMixing: e.target.checked})}
                          className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm">Group-Based Mixing</div>
                          <div className="text-xs text-gray-600">Mix videos from groups</div>
                        </div>
                      </label>

                      {settings.enableGroupMixing && (
                        <div className="ml-8 space-y-2">
                          <p className="text-xs text-gray-600 mb-2">Select mixing mode:</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSettings({...settings, groupMixingMode: 'sequential'})}
                              className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                                settings.groupMixingMode === 'sequential'
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Strict Order (Group 1→2→3)
                            </button>
                            <button
                              onClick={() => setSettings({...settings, groupMixingMode: 'random'})}
                              className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                                settings.groupMixingMode === 'random'
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Random (Any order)
                            </button>
                          </div>
                          {settings.groupMixingMode === 'random' && (
                            <p className="text-xs text-blue-600 mt-2">+2 credits/video</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Speed Variations */}
                    <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-gray-200">
                      <input
                        type="checkbox"
                        checked={settings.enableSpeedVariations}
                        onChange={(e) => setSettings({...settings, enableSpeedVariations: e.target.checked})}
                        className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">Speed Variations</div>
                        <div className="text-xs text-gray-600">Apply random playback speeds</div>
                      </div>
                      <div className="text-xs font-medium text-gray-500">+1 credit/video</div>
                    </label>
                  </div>

                  {/* Strength Indicator */}
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200">
                    <span className="text-sm text-gray-600">Anti-Fingerprinting Strength:</span>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < strengthScore ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {['None', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][strengthScore]}
                    </span>
                  </div>
                </div>

                {/* Video Quality & Format */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Video className="w-5 h-5 text-gray-700" />
                    <h4 className="text-base font-semibold text-gray-900">Video Quality & Format</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Metadata Source */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">Metadata Source</label>
                      <select
                        value={settings.metadataSource}
                        onChange={(e) => setSettings({...settings, metadataSource: e.target.value as any})}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="capcut">CapCut</option>
                        <option value="tiktok">TikTok</option>
                        <option value="instagram">Instagram</option>
                        <option value="youtube">YouTube</option>
                      </select>
                    </div>

                    {/* Video Bitrate */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">Kualitas Video (Bitrate)</label>
                      <select
                        value={settings.videoBitrate}
                        onChange={(e) => setSettings({...settings, videoBitrate: e.target.value as any})}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="low">Low (Kecil)</option>
                        <option value="medium">Medium (Seimbang)</option>
                        <option value="high">High (+2 credits)</option>
                      </select>
                    </div>

                    {/* Resolution */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">Resolusi Video</label>
                      <select
                        value={settings.videoResolution}
                        onChange={(e) => setSettings({...settings, videoResolution: e.target.value as any})}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="480p">SD (480p)</option>
                        <option value="720p">HD (720p) +2</option>
                        <option value="1080p">Full HD (1080p) +5</option>
                        <option value="4k">4K Ultra HD +10</option>
                      </select>
                    </div>

                    {/* Frame Rate */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">Frame Rate (FPS)</label>
                      <select
                        value={settings.frameRate}
                        onChange={(e) => setSettings({...settings, frameRate: Number(e.target.value) as any})}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="24">24 FPS (Cinematic)</option>
                        <option value="30">30 FPS (Standard)</option>
                        <option value="60">60 FPS (+3 credits)</option>
                      </select>
                    </div>
                  </div>

                  {/* Aspect Ratio */}
                  <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-700 mb-2">Aspect Ratio (Platform Optimization)</label>
                    <select
                      value={settings.aspectRatio}
                      onChange={(e) => setSettings({...settings, aspectRatio: e.target.value as any})}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="16:9">16:9 (YouTube Landscape)</option>
                      <option value="9:16">9:16 (TikTok Vertical)</option>
                      <option value="1:1">1:1 (Instagram Square)</option>
                      <option value="4:5">4:5 (Instagram Portrait)</option>
                    </select>
                  </div>
                </div>

                {/* Video Duration */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-gray-700" />
                    <h4 className="text-base font-semibold text-gray-900">Video Duration</h4>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-gray-200">
                      <input
                        type="radio"
                        name="durationType"
                        checked={settings.durationType === 'original'}
                        onChange={() => setSettings({...settings, durationType: 'original'})}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-900">Original/Random (Follow mixed video length)</span>
                    </label>

                    <div className="border border-gray-200 rounded-lg p-3">
                      <label className="flex items-center gap-3 cursor-pointer mb-3">
                        <input
                          type="radio"
                          name="durationType"
                          checked={settings.durationType === 'fixed'}
                          onChange={() => setSettings({...settings, durationType: 'fixed'})}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-900 font-medium">Fixed Duration</span>
                      </label>

                      {settings.durationType === 'fixed' && (
                        <div className="ml-7 space-y-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="5"
                              max="300"
                              value={settings.fixedDuration}
                              onChange={(e) => setSettings({...settings, fixedDuration: Number(e.target.value)})}
                              className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-lg text-center font-medium"
                            />
                            <span className="text-sm text-gray-600">seconds</span>
                          </div>
                          <div className="flex gap-2">
                            {[15, 30, 60].map(sec => (
                              <button
                                key={sec}
                                onClick={() => setSettings({...settings, fixedDuration: sec})}
                                className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                              >
                                {sec}s
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Smart Distribution */}
                    <div className="border border-gray-200 rounded-lg p-3">
                      <label className="flex items-center gap-3 cursor-pointer mb-3">
                        <input
                          type="checkbox"
                          checked={settings.smartDistribution}
                          onChange={(e) => setSettings({...settings, smartDistribution: e.target.checked})}
                          className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm">Smart Duration Distribution</div>
                          <div className="text-xs text-gray-600">Intelligently distribute duration across clips</div>
                        </div>
                        <div className="text-xs font-medium text-gray-500">+1 credit/video</div>
                      </label>

                      {settings.smartDistribution && (
                        <div className="ml-8">
                          <label className="block text-xs font-medium text-gray-700 mb-2">Distribution Mode:</label>
                          <select
                            value={settings.distributionMode}
                            onChange={(e) => setSettings({...settings, distributionMode: e.target.value as any})}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="proportional">Proportional - Maintain relative durations</option>
                            <option value="equal">Equal - Same duration for each clip</option>
                            <option value="weighted">Weighted - Prioritize first & last clips</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Audio Options */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Volume2 className="w-5 h-5 text-gray-700" />
                    <h4 className="text-base font-semibold text-gray-900">Audio Options</h4>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-gray-200">
                      <input
                        type="radio"
                        name="audioOption"
                        checked={settings.audioOption === 'keep'}
                        onChange={() => setSettings({...settings, audioOption: 'keep'})}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-900">Keep Original Audio</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-gray-200">
                      <input
                        type="radio"
                        name="audioOption"
                        checked={settings.audioOption === 'mute'}
                        onChange={() => setSettings({...settings, audioOption: 'mute'})}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-900">Mute All (Remove Audio)</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Choose whether to keep original audio or remove all audio from output videos</p>
                </div>

                {/* Generation Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
                  {/* Combinations */}
                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-1">Estimated Variants</div>
                    <div className="text-3xl font-bold text-blue-600">
                      {possibleCombinations === Infinity ? '∞' : possibleCombinations} {possibleCombinations !== Infinity && 'possible'} combination{possibleCombinations !== 1 && 's'}
                    </div>
                  </div>

                  {/* Generate Count & Cost */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">Generate Count</label>
                      <input
                        type="number"
                        min="1"
                        max={possibleCombinations === Infinity ? 100 : possibleCombinations}
                        value={videosToGenerate}
                        onChange={(e) => setVideosToGenerate(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-center font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">Total Cost</label>
                      <div className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-center">
                        <span className="font-bold text-gray-900 text-sm">{totalCost} credits</span>
                      </div>
                    </div>
                  </div>

                  {/* Strength & Balance */}
                  <div className="flex justify-between text-xs text-gray-600 pt-3 border-t border-blue-200">
                    <span>Anti-fingerprinting: <span className="font-semibold">{['None', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][strengthScore]}</span></span>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={!selectedProject || !selectedProject.videos || selectedProject.videos.length === 0}
                    className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    Start Processing
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
