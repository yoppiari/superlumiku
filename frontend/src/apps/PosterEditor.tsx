import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import api from '../lib/api'
import ProfileDropdown from '../components/ProfileDropdown'
import { EditorCanvas } from './poster-editor/components/EditorCanvas'
import { UploadPanel } from './poster-editor/components/UploadPanel'
import { PostersList } from './poster-editor/components/PostersList'
import { ToolsPanel } from './poster-editor/components/ToolsPanel'
import { InpaintPanel } from './poster-editor/components/InpaintPanel'
import { AnnotationPanel } from './poster-editor/components/AnnotationPanel'
import type { Annotation } from './poster-editor/types/annotation'
import { getImageUrl } from '../lib/imageUrl'
import { Plus, FolderOpen, FileImage, Calendar, Trash2, X, Coins, ArrowLeft, Image } from 'lucide-react'

interface Project {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  posters: Poster[]
}

interface Poster {
  id: string
  originalUrl: string
  editedUrl?: string
  enhancedUrl?: string
  status: string
  createdAt: string
  ocrData?: string
}

export function PosterEditor() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', description: '' })
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [selectedPoster, setSelectedPoster] = useState<Poster | null>(null)
  const [inpaintMode, setInpaintMode] = useState(false)
  const [inpaintModeType, setInpaintModeType] = useState<'brush' | 'annotate'>('brush')
  const [maskDataUrl, setMaskDataUrl] = useState('')
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [batchProcessing, setBatchProcessing] = useState(false)

  // Load projects
  useEffect(() => {
    if (user) {
      loadProjects()
    }
  }, [user])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/apps/poster-editor/projects')
      if (response.data.success) {
        setProjects(response.data.projects)
      }
    } catch (error: any) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const createProject = async () => {
    if (!newProject.name.trim()) return

    try {
      const response = await api.post('/api/apps/poster-editor/projects', newProject)
      if (response.data.success) {
        // Ensure the project has posters array
        const newProjectData = {
          ...response.data.project,
          posters: response.data.project.posters || []
        }
        setProjects([newProjectData, ...projects])
        setNewProject({ name: '', description: '' })
        setShowCreateModal(false)
      }
    } catch (error: any) {
      console.error('Failed to create project:', error)
      alert('Failed to create project')
    }
  }

  const deleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project and all its posters?')) {
      return
    }

    try {
      await api.delete(`/api/apps/poster-editor/projects/${projectId}`)
      setProjects(projects.filter(p => p.id !== projectId))
      if (selectedProject?.id === projectId) {
        setSelectedProject(null)
      }
    } catch (error: any) {
      console.error('Failed to delete project:', error)
      alert('Failed to delete project')
    }
  }

  // Batch inpaint processing (annotate mode)
  const handleProcessAllAnnotations = async () => {
    if (!selectedPoster) return

    const readyAnnotations = annotations.filter(a => a.status === 'ready')
    if (readyAnnotations.length === 0) {
      alert('No annotations ready to process')
      return
    }

    try {
      setBatchProcessing(true)

      // Start batch inpaint with SAM mode
      const response = await api.post('/api/apps/poster-editor/inpaint-batch', {
        posterId: selectedPoster.id,
        annotations: annotations.map(ann => ({
          x: ann.x,
          y: ann.y,
          xPercent: ann.xPercent,
          yPercent: ann.yPercent,
          prompt: ann.prompt,
          maskRadius: ann.maskRadius,
          segmentationMode: 'sam', // Always use SAM for Quick Edit
          samObjectPrompt: ann.samObjectPrompt,
          samMaskBase64: ann.samMaskBase64
        }))
      })

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to start batch processing')
      }

      const newBatchId = response.data.batchId

      // Mark all ready annotations as processing
      setAnnotations(annotations.map(ann =>
        ann.status === 'ready' ? { ...ann, status: 'processing' as const } : ann
      ))

      // Poll batch status
      let pollAttempts = 0
      const maxPollAttempts = 120 // 4 minutes for multiple annotations

      const pollBatchStatus = async (): Promise<void> => {
        if (pollAttempts >= maxPollAttempts) {
          throw new Error('Batch processing timeout')
        }

        pollAttempts++
        const statusResponse = await api.get(`/api/apps/poster-editor/inpaint-batch/${newBatchId}/status`)

        if (statusResponse.data.overallStatus === 'completed') {
          // All annotations completed
          setAnnotations(annotations.map((ann) => ({
            ...ann,
            status: 'completed' as const
          })))

          // Reload poster data
          if (selectedPoster?.id) {
            const posterResponse = await api.get(`/api/apps/poster-editor/posters/${selectedPoster.id}`)
            if (posterResponse.data.success) {
              setSelectedPoster(posterResponse.data.poster)
              setSelectedProject({
                ...selectedProject!,
                posters: selectedProject!.posters.map(p =>
                  p.id === selectedPoster.id ? posterResponse.data.poster : p
                )
              })
            }
          }

          loadProjects()
          setBatchProcessing(false)
          alert('All annotations processed successfully!')
          setInpaintMode(false)
          setAnnotations([])
          return
        }

        if (statusResponse.data.overallStatus === 'processing') {
          // Update individual annotation statuses
          const jobs = statusResponse.data.jobs || []
          setAnnotations(annotations.map((ann, index) => {
            const job = jobs.find((j: any) => j.annotationIndex === index)
            if (job) {
              return { ...ann, status: job.status }
            }
            return ann
          }))

          // Continue polling
          setTimeout(pollBatchStatus, 2000)
          return
        }

        if (statusResponse.data.overallStatus === 'partial' || statusResponse.data.overallStatus === 'failed') {
          // Some failed, show error
          alert('Some annotations failed to process. Please check the annotations panel.')
          setBatchProcessing(false)
          return
        }

        // Continue polling
        setTimeout(pollBatchStatus, 2000)
      }

      await pollBatchStatus()

    } catch (error: any) {
      console.error('Batch processing error:', error)
      alert(error.response?.data?.error || error.message || 'Failed to process annotations')
      setBatchProcessing(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-green-50 text-green-700 flex items-center justify-center">
                  <Image className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-[1.75rem] font-semibold text-slate-900 tracking-tighter">
                    Smart Poster Editor
                  </h1>
                  <p className="text-sm md:text-[0.9375rem] text-slate-600">
                    AI-powered poster editing with text detection, inpainting, and multi-format export
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-slate-600">
                <Coins className="w-5 h-5" />
                <span className="font-medium text-slate-900">{(user?.creditBalance || 0).toLocaleString()} Credits</span>
              </div>
              <ProfileDropdown />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 md:px-10 py-8">
        {/* New Project Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="mb-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-lg font-medium"
        >
          <Plus className="w-5 h-5" />
          New Project
        </button>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-20">
            <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No Projects Yet</h2>
            <p className="text-slate-600 mb-6">Create your first poster editing project to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-green-300 hover:shadow-lg transition-all overflow-hidden group"
              >
                {/* Project Thumbnail */}
                <div className="h-48 bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center relative overflow-hidden">
                  {project.posters.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1 w-full h-full p-2">
                      {project.posters.slice(0, 4).map((poster) => (
                        <div key={poster.id} className="relative bg-white rounded overflow-hidden">
                          <img
                            src={poster.enhancedUrl || poster.editedUrl || poster.originalUrl}
                            alt="Poster"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <FileImage className="w-16 h-16 text-green-200" />
                  )}
                </div>

                {/* Project Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-slate-900 flex-1">
                      {project.name}
                    </h3>
                    <button
                      onClick={() => deleteProject(project.id)}
                      className="text-slate-400 hover:text-red-600 transition-colors ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {project.description && (
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-500">
                      <FileImage className="w-4 h-4" />
                      <span>{project.posters.length} posters</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(project.createdAt)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedProject(project)}
                    className="w-full mt-4 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium"
                  >
                    Open Project
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Create New Project</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="e.g., Instagram Campaign 2025"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Describe your project..."
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={createProject}
                disabled={!newProject.name.trim()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Detail View */}
      {selectedProject && (
        <div className="fixed inset-0 bg-slate-50 z-50 overflow-auto">
          {/* Header */}
          <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-600 hover:text-slate-900"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-green-50 text-green-700 flex items-center justify-center">
                      <Image className="w-5 h-5" />
                    </div>
                    <div>
                      <h1 className="text-2xl md:text-[1.75rem] font-semibold text-slate-900 tracking-tighter">
                        {selectedProject.name}
                      </h1>
                      {selectedProject.description && (
                        <p className="text-sm md:text-[0.9375rem] text-slate-600">{selectedProject.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 md:gap-6">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Coins className="w-5 h-5" />
                    <span className="font-medium text-slate-900">{(user?.creditBalance || 0).toLocaleString()} Credits</span>
                  </div>
                  <ProfileDropdown />
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-7xl mx-auto p-4 lg:p-8 pb-20">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Panel: Editor Canvas (60%) */}
              <div className="flex-1 lg:w-[60%] min-h-[600px]">
                <EditorCanvas
                  imageUrl={getImageUrl(selectedPoster?.enhancedUrl || selectedPoster?.editedUrl || selectedPoster?.originalUrl)}
                  detectedTexts={(() => {
                    try {
                      return selectedPoster?.ocrData ? JSON.parse(selectedPoster.ocrData) : []
                    } catch {
                      return []
                    }
                  })()}
                  onTextClick={(index) => console.log('Text clicked:', index)}
                  inpaintMode={inpaintMode}
                  inpaintModeType={inpaintModeType}
                  onMaskGenerated={(mask) => setMaskDataUrl(mask)}
                  annotations={annotations}
                  onAnnotationsChange={setAnnotations}
                />
              </div>

              {/* Right Panel: Upload & Management (40%) */}
              <div className="flex-1 lg:w-[40%] space-y-6">
                <UploadPanel
                  projectId={selectedProject.id}
                  onUploadSuccess={(poster) => {
                    setSelectedProject({
                      ...selectedProject,
                      posters: [poster, ...(selectedProject.posters || [])]
                    })
                    setSelectedPoster(poster)
                  }}
                />

                <ToolsPanel
                  posterId={selectedPoster?.id}
                  onOperationSuccess={async () => {
                    // Reload the selected poster to get updated data
                    if (selectedPoster?.id) {
                      try {
                        const response = await api.get(`/api/apps/poster-editor/posters/${selectedPoster.id}`)
                        if (response.data.success) {
                          setSelectedPoster(response.data.poster)
                          // Update in project list
                          setSelectedProject({
                            ...selectedProject,
                            posters: selectedProject.posters.map(p =>
                              p.id === selectedPoster.id ? response.data.poster : p
                            )
                          })
                        }
                      } catch (error) {
                        console.error('Reload poster error:', error)
                      }
                    }
                    // Reload user data for credit balance
                    loadProjects()
                  }}
                  inpaintMode={inpaintModeType}
                  onModeChange={setInpaintModeType}
                  onInpaintClick={(mode) => {
                    setInpaintModeType(mode)
                    setInpaintMode(true)
                  }}
                />

                {/* Inpaint Panel (show when in inpaint mode) */}
                {inpaintMode && selectedPoster && (
                  <>
                    {inpaintModeType === 'brush' ? (
                      <InpaintPanel
                        posterId={selectedPoster.id}
                        maskDataUrl={maskDataUrl}
                        onClose={() => {
                          setInpaintMode(false)
                          setMaskDataUrl('')
                        }}
                        onSuccess={async () => {
                          // Reload poster and project data
                          if (selectedPoster?.id) {
                            try {
                              const response = await api.get(`/api/apps/poster-editor/posters/${selectedPoster.id}`)
                              if (response.data.success) {
                                setSelectedPoster(response.data.poster)
                                setSelectedProject({
                                  ...selectedProject,
                                  posters: selectedProject.posters.map(p =>
                                    p.id === selectedPoster.id ? response.data.poster : p
                                  )
                                })
                              }
                            } catch (error) {
                              console.error('Reload poster error:', error)
                            }
                          }
                          loadProjects()
                          setInpaintMode(false)
                          setMaskDataUrl('')
                        }}
                      />
                    ) : (
                      <AnnotationPanel
                        annotations={annotations}
                        onAnnotationsChange={setAnnotations}
                        onProcessAll={handleProcessAllAnnotations}
                        isProcessing={batchProcessing}
                      />
                    )}
                  </>
                )}

                <PostersList
                  posters={selectedProject.posters || []}
                  selectedPosterId={selectedPoster?.id}
                  onSelectPoster={(poster) => setSelectedPoster(poster)}
                  onDeletePoster={async (posterId) => {
                    if (confirm('Delete this poster?')) {
                      try {
                        await api.delete(`/api/apps/poster-editor/posters/${posterId}`)
                        setSelectedProject({
                          ...selectedProject,
                          posters: selectedProject.posters.filter(p => p.id !== posterId)
                        })
                        if (selectedPoster?.id === posterId) {
                          setSelectedPoster(null)
                        }
                      } catch (error) {
                        console.error('Delete error:', error)
                        alert('Failed to delete poster')
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PosterEditor
