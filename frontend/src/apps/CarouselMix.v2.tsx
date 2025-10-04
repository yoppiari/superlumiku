import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCarouselMixStore } from '../stores/carouselMixStore'
import { useAuthStore } from '../stores/authStore'
import { BulkGenerator } from './carousel-mix/components/BulkGenerator'
import { Layers, Plus, ArrowLeft } from 'lucide-react'

export default function CarouselMixV2() {
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
  } = useCarouselMixStore()

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

  const handleCreateProject = async () => {
    const name = prompt('Project name:')
    if (!name?.trim()) return

    const description = prompt('Description (optional):')

    try {
      const project = await createProject(name, description || undefined)
      navigate(`/apps/carousel-mix/${project.id}`)
    } catch (error: any) {
      alert(error.message || 'Failed to create project')
    }
  }

  const handleSelectProject = (id: string) => {
    navigate(`/apps/carousel-mix/${id}`)
  }

  const handleBackToProjects = () => {
    navigate('/apps/carousel-mix')
  }

  if (isLoadingProjects) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  // Project Detail View
  if (currentProject) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToProjects}
                className="p-2 hover:bg-gray-200 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                  {currentProject.name}
                </h1>
                {currentProject.description && (
                  <p className="text-sm text-gray-600 mt-1">{currentProject.description}</p>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Credits: <span className="font-bold text-blue-600">{user?.creditBalance || 0}</span>
            </div>
          </div>

          {/* Bulk Generator (Split Panel) */}
          <BulkGenerator projectId={currentProject.id} />
        </div>
      </div>
    )
  }

  // Projects List View
  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Layers className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Carousel Mix</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              ← Back to Dashboard
            </button>
            <div className="text-sm text-gray-600">
              Credits: <span className="font-bold text-blue-600">{user?.creditBalance || 0}</span>
            </div>
          </div>
        </div>

        {/* New Project Button */}
        <button
          onClick={handleCreateProject}
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
                onClick={() => handleSelectProject(project.id)}
                className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all"
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
            ))
          )}
        </div>
      </div>
    </div>
  )
}
