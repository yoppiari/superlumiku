import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, X } from 'lucide-react'
import { useProjectStore } from '../store/project.store'
import { useAuthStore } from '../../../stores/authStore'
import ProjectCard from '../components/ProjectCard'
import { LoadingSpinner, EmptyState } from '../../../components/ui'
import api from '../../../lib/api'

export default function ProjectsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuthStore()
  const { projects, isLoading, fetchProjects, createProject, deleteProject, updateProject } =
    useProjectStore()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creatingProject, setCreatingProject] = useState(false)
  const [avatars, setAvatars] = useState<any[]>([])
  const [loadingAvatars, setLoadingAvatars] = useState(false)

  // Form state
  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('')

  useEffect(() => {
    fetchProjects()

    // Check if should show create modal
    if (searchParams.get('action') === 'create') {
      setShowCreateModal(true)
      loadAvatars()
    }
  }, [searchParams])

  const loadAvatars = async () => {
    setLoadingAvatars(true)
    try {
      const res = await api.get('/api/apps/avatar-creator/avatars')
      setAvatars(res.data.avatars || [])
    } catch (error) {
      console.error('Failed to load avatars:', error)
    } finally {
      setLoadingAvatars(false)
    }
  }

  const handleCreateProject = async () => {
    if (!projectName.trim() || !selectedAvatar) {
      alert('Please fill in all required fields')
      return
    }

    setCreatingProject(true)
    try {
      const avatar = avatars.find((a) => a.id === selectedAvatar)
      const project = await createProject({
        projectName: projectName.trim(),
        description: description.trim() || undefined,
        avatarImageUrl: avatar.baseImageUrl,
        avatarSource: 'AVATAR_CREATOR',
        avatarId: selectedAvatar,
      })

      // Close modal and navigate to generation page
      setShowCreateModal(false)
      setSearchParams({})
      navigate(`/apps/pose-generator/generate?project=${project.id}`)
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create project')
    } finally {
      setCreatingProject(false)
    }
  }

  const handleArchiveProject = async (id: string) => {
    try {
      await updateProject(id, { status: 'archived' })
    } catch (error) {
      console.error('Failed to archive project:', error)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">My Projects</h2>
          <p className="text-slate-600 mt-1">Manage your pose generation projects</p>
        </div>

        <button
          onClick={() => {
            setShowCreateModal(true)
            loadAvatars()
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <LoadingSpinner size="lg" text="Loading projects..." />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project to start generating poses"
          action={{
            label: 'Create Project',
            onClick: () => {
              setShowCreateModal(true)
              loadAvatars()
            },
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => navigate(`/apps/pose-generator/generate?project=${project.id}`)}
              onArchive={handleArchiveProject}
              onDelete={deleteProject}
            />
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">Create New Project</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setSearchParams({})
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Project Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="E.g., E-commerce Product Shoot"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your project..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Avatar Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Avatar *
                </label>
                {loadingAvatars ? (
                  <div className="flex items-center justify-center py-12">
                    <LoadingSpinner />
                  </div>
                ) : avatars.length === 0 ? (
                  <div className="text-center py-8 border border-slate-200 rounded-lg">
                    <p className="text-slate-600 mb-3">No avatars found</p>
                    <button
                      onClick={() => navigate('/apps/avatar-creator')}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Create Avatar First
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-3">
                    {avatars.map((avatar) => (
                      <button
                        key={avatar.id}
                        onClick={() => setSelectedAvatar(avatar.id)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          selectedAvatar === avatar.id
                            ? 'border-blue-500 ring-2 ring-blue-200'
                            : 'border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        <img
                          src={avatar.thumbnailUrl || avatar.baseImageUrl}
                          alt={avatar.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white px-2 py-1 text-xs truncate">
                          {avatar.name}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setSearchParams({})
                }}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={creatingProject || !projectName.trim() || !selectedAvatar}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creatingProject ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
