import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCarouselMixStore } from '../stores/carouselMixStore'
import { useAuthStore } from '../stores/authStore'
import UnifiedHeader from '../components/UnifiedHeader'
import CreateProjectModal from '../components/CreateProjectModal'
import { BulkGenerator } from './carousel-mix/components/BulkGenerator'
import { Layers, Plus, CloudCheck, Loader2, Trash2 } from 'lucide-react'

export default function CarouselMix() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const { user } = useAuthStore()

  const {
    projects,
    currentProject,
    isLoadingProjects,
    loadProjects,
    createProject,
    selectProject,
    clearCurrentProject,
    deleteProject,
    isSaving,
    lastSaved,
  } = useCarouselMixStore()

  const [showSaved, setShowSaved] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Show "Saved" indicator after save completes
  useEffect(() => {
    if (!isSaving && lastSaved) {
      setShowSaved(true)
      const timer = setTimeout(() => setShowSaved(false), 5000)
      return () => clearTimeout(timer)
    } else if (isSaving) {
      // Hide saved indicator when starting new save
      setShowSaved(false)
    }
    return undefined
  }, [isSaving, lastSaved])

  // Load projects on mount
  useEffect(() => {
    loadProjects()
  }, [])

  // Load project if projectId is in URL
  useEffect(() => {
    if (projectId) {
      selectProject(projectId)
    } else {
      clearCurrentProject()
    }
  }, [projectId])

  const handleCreateProject = async (name: string, description?: string) => {
    const project = await createProject(name, description)
    navigate(`/apps/carousel-mix/${project.id}`)
  }

  const handleSelectProject = (id: string) => {
    navigate(`/apps/carousel-mix/${id}`)
  }

  const handleBackToProjects = () => {
    navigate('/apps/carousel-mix')
  }

  const handleDeleteProject = async (id: string, name: string) => {
    // Confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}"?\n\nThis action cannot be undone. All slides, texts, and generations will be permanently deleted.`
    )

    if (!confirmed) return

    try {
      await deleteProject(id)
      // Navigate back to list if currently viewing deleted project
      if (currentProject?.id === id) {
        navigate('/apps/carousel-mix')
      }
    } catch (error: any) {
      alert(error.message || 'Failed to delete project')
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
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <UnifiedHeader
          title={currentProject.name}
          subtitle={currentProject.description}
          icon={<Layers className="w-5 h-5" />}
          iconColor="bg-blue-50 text-blue-700"
          showBackButton={true}
          backPath="/apps/carousel-mix"
          currentAppId="carousel-mix"
          actions={null}
        />

        {/* Save Indicator - moved below header */}
        {(isSaving || showSaved) && (
          <div className="bg-white border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-6 md:px-10 py-3">
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-sm text-slate-600">Saving...</span>
                </div>
              ) : showSaved ? (
                <div className="flex items-center gap-2">
                  <CloudCheck className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-slate-600">Saved</span>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Bulk Generator (Split Panel) */}
        <div className="max-w-7xl mx-auto p-4 lg:p-8">
          <BulkGenerator projectId={currentProject.id} />
        </div>
      </div>
    )
  }

  // Projects List View
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <UnifiedHeader
        title="Carousel Mix"
        subtitle="Generate unique carousel combinations"
        icon={<Layers className="w-5 h-5" />}
        iconColor="bg-blue-50 text-blue-700"
        showBackButton={true}
        backPath="/dashboard"
        currentAppId="carousel-mix"
        actions={null}
      />

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
              <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
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
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <span>📸 {project.slides.length} slides</span>
                      <span>📝 {project.texts.length} texts</span>
                    </div>
                    <span className="text-blue-600 font-medium">
                      {project.generations.length} gen{project.generations.length !== 1 ? 's' : ''}
                    </span>
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
