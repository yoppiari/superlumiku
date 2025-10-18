import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAvatarCreatorStore } from '../stores/avatarCreatorStore'
import { useAuthStore } from '../stores/authStore'
import UnifiedHeader from '../components/UnifiedHeader'
import CreateProjectModal from '../components/CreateProjectModal'
import UsageHistoryModal from '../components/UsageHistoryModal'
import { handleError } from '../utils/errorHandler'
import { UserCircle, Plus, Trash2, Loader2, Upload, Sparkles, History, Clock, Calendar, Grid, X, ZoomIn } from 'lucide-react'

export default function AvatarCreator() {
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
    uploadAvatar,
    generateAvatar,
    deleteAvatar,
    isUploading,
    isGenerating,
    activeGenerations,
    loadPresets,
    createAvatarFromPreset,
    presets,
    isLoadingPresets,
  } = useAvatarCreatorStore()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [showPresetsModal, setShowPresetsModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null)

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
    navigate(`/apps/avatar-creator/${project.id}`)
  }

  const handleSelectProject = (id: string) => {
    navigate(`/apps/avatar-creator/${id}`)
  }

  const handleBackToProjects = () => {
    navigate('/apps/avatar-creator')
  }

  const handleDeleteProject = async (id: string, name: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}"?\n\nThis action cannot be undone. All avatars will be permanently deleted.`
    )

    if (!confirmed) return

    try {
      await deleteProject(id)
      if (currentProject?.id === id) {
        navigate('/apps/avatar-creator')
      }
    } catch (error: any) {
      alert(error.message || 'Failed to delete project')
    }
  }

  const handleDeleteAvatar = async (id: string, name: string) => {
    const confirmed = window.confirm(`Delete "${name}"? This cannot be undone.`)
    if (!confirmed) return

    try {
      await deleteAvatar(id)
    } catch (error: any) {
      alert(error.message || 'Failed to delete avatar')
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
          subtitle={currentProject.description || undefined}
          icon={<UserCircle className="w-5 h-5" />}
          iconColor="bg-purple-50 text-purple-700"
          showBackButton={true}
          backPath="/apps/avatar-creator"
          currentAppId="avatar-creator"
          actions={null}
        />

        {/* Action Buttons */}
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-6">
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => {
                loadPresets()
                setShowPresetsModal(true)
              }}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center gap-2 shadow-lg transition"
            >
              <Grid className="w-5 h-5" />
              Browse Presets
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 shadow-lg transition"
            >
              <Upload className="w-5 h-5" />
              Upload Avatar
            </button>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 flex items-center gap-2 shadow-lg transition"
            >
              <Sparkles className="w-5 h-5" />
              Generate with AI
            </button>
          </div>
        </div>

        {/* Active Generations */}
        {Object.values(activeGenerations).filter(g => g.projectId === currentProject.id).length > 0 && (
          <div className="max-w-7xl mx-auto px-6 md:px-10 pb-6">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                Generating Avatars
              </h2>
              <div className="space-y-3">
                {Object.values(activeGenerations)
                  .filter(g => g.projectId === currentProject.id)
                  .map((generation) => (
                    <div key={generation.id} className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 mb-1">
                            {generation.prompt.substring(0, 60)}{generation.prompt.length > 60 ? '...' : ''}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              generation.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              generation.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                              generation.status === 'completed' ? 'bg-green-100 text-green-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {generation.status === 'pending' && 'Waiting...'}
                              {generation.status === 'processing' && 'Generating...'}
                              {generation.status === 'completed' && 'Completed'}
                              {generation.status === 'failed' && 'Failed'}
                            </span>
                            {generation.errorMessage && (
                              <span className="text-xs text-red-600">{generation.errorMessage}</span>
                            )}
                          </div>
                        </div>
                        {(generation.status === 'pending' || generation.status === 'processing') && (
                          <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Avatars Grid */}
        <div className="max-w-7xl mx-auto px-6 md:px-10 pb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Your Avatars</h2>

            {currentProject.avatars.length === 0 ? (
              <div className="text-center py-16">
                <UserCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-2">No avatars yet</p>
                <p className="text-sm text-slate-500">Upload or generate your first avatar to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {currentProject.avatars.map((avatar) => (
                  <div key={avatar.id} className="bg-white rounded-lg overflow-hidden border border-slate-200 hover:border-purple-300 transition-all shadow-sm hover:shadow-md">
                    <div
                      className="aspect-square bg-slate-50 relative group cursor-pointer"
                      onClick={() => setPreviewImage({ url: avatar.baseImageUrl, name: avatar.name })}
                    >
                      <img
                        src={avatar.thumbnailUrl || avatar.baseImageUrl}
                        alt={avatar.name}
                        className="w-full h-full object-cover"
                      />
                      {/* Zoom overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
                          <ZoomIn className="w-6 h-6 text-slate-700" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-slate-900 flex-1">{avatar.name}</h3>
                        {avatar.sourceType === 'text_to_image' && (
                          <span title="AI Generated">
                            <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0 ml-2" />
                          </span>
                        )}
                      </div>

                      {/* Attributes */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {avatar.gender && (
                          <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                            {avatar.gender}
                          </span>
                        )}
                        {avatar.ageRange && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                            {avatar.ageRange}
                          </span>
                        )}
                        {avatar.style && (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                            {avatar.style}
                          </span>
                        )}
                        {avatar.ethnicity && (
                          <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                            {avatar.ethnicity}
                          </span>
                        )}
                      </div>

                      {/* Timestamps */}
                      <div className="space-y-1.5 mb-3 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Created {new Date(avatar.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        {avatar.lastUsedAt && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Used {new Date(avatar.lastUsedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{avatar.usageCount} time{avatar.usageCount !== 1 ? 's' : ''} used</span>
                          <button
                            onClick={() => {
                              setSelectedAvatarId(avatar.id)
                              setShowHistoryModal(true)
                            }}
                            className="p-1 hover:bg-slate-100 rounded transition-colors"
                            title="View usage history"
                          >
                            <History className="w-3.5 h-3.5 text-slate-500" />
                          </button>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate('/apps/pose-generator', { state: { avatarId: avatar.id } })}
                          className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                        >
                          Generate Poses
                        </button>
                        <button
                          onClick={() => handleDeleteAvatar(avatar.id, avatar.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete avatar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <UploadAvatarModal
            projectId={currentProject.id}
            onClose={() => setShowUploadModal(false)}
            onUpload={uploadAvatar}
            isUploading={isUploading}
          />
        )}

        {/* Generate Modal */}
        {showGenerateModal && (
          <GenerateAvatarModal
            projectId={currentProject.id}
            onClose={() => setShowGenerateModal(false)}
            onGenerate={generateAvatar}
            isGenerating={isGenerating}
          />
        )}

        {/* Presets Gallery Modal */}
        {showPresetsModal && (
          <PresetsGalleryModal
            presets={presets}
            isLoading={isLoadingPresets}
            onClose={() => setShowPresetsModal(false)}
            onSelect={async (presetId, customName) => {
              await createAvatarFromPreset(currentProject.id, presetId, customName)
              alert('Avatar generation from preset started! It will appear in 30-60 seconds.')
              setShowPresetsModal(false)
            }}
          />
        )}

        {/* Usage History Modal */}
        {showHistoryModal && selectedAvatarId && (
          <UsageHistoryModal
            avatarId={selectedAvatarId}
            onClose={() => {
              setShowHistoryModal(false)
              setSelectedAvatarId(null)
            }}
          />
        )}

        {/* Image Preview Modal */}
        {previewImage && (
          <ImagePreviewModal
            imageUrl={previewImage.url}
            imageName={previewImage.name}
            onClose={() => setPreviewImage(null)}
          />
        )}
      </div>
    )
  }

  // Projects List View
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <UnifiedHeader
        title="Avatar Creator"
        subtitle="Create and manage AI avatars for pose generation"
        icon={<UserCircle className="w-5 h-5" />}
        iconColor="bg-purple-50 text-purple-700"
        showBackButton={true}
        backPath="/dashboard"
        currentAppId="avatar-creator"
        actions={null}
      />

      <div className="max-w-6xl mx-auto p-4 lg:p-8">
        {/* New Project Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="mb-6 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          New Project
        </button>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <UserCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
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
                    <span>👤 {project.avatars.length} avatars</span>
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

// ===== Upload Avatar Modal =====
function UploadAvatarModal({
  projectId,
  onClose,
  onUpload,
  isUploading,
}: {
  projectId: string
  onClose: () => void
  onUpload: (projectId: string, file: File, metadata: any) => Promise<any>
  isUploading: boolean
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    ageRange: '',
    style: '',
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !formData.name) {
      alert('Please select an image and enter a name')
      return
    }

    try {
      await onUpload(projectId, selectedFile, formData)
      alert('Avatar uploaded successfully!')
      onClose()
    } catch (error: any) {
      handleError('Avatar Upload', error, 'Failed to upload avatar')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">Upload Avatar</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Avatar Image</label>
              <label className="block w-full cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600">Click to upload or drag and drop</p>
                      <p className="text-sm text-slate-500 mt-2">PNG, JPG up to 10MB</p>
                    </>
                  )}
                </div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Avatar Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="unisex">Unisex</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Age Range</label>
                <select
                  value={formData.ageRange}
                  onChange={(e) => setFormData({ ...formData, ageRange: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select age range</option>
                  <option value="young">Young</option>
                  <option value="adult">Adult</option>
                  <option value="mature">Mature</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Style</label>
                <select
                  value={formData.style}
                  onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select style</option>
                  <option value="casual">Casual</option>
                  <option value="formal">Formal</option>
                  <option value="sporty">Sporty</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isUploading}
                className="flex-1 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Uploading...
                  </>
                ) : (
                  'Upload Avatar'
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ===== Generate Avatar Modal =====
function GenerateAvatarModal({
  projectId,
  onClose,
  onGenerate,
  isGenerating,
}: {
  projectId: string
  onClose: () => void
  onGenerate: (projectId: string, prompt: string, metadata: any) => Promise<any>
  isGenerating: boolean
}) {
  const [formData, setFormData] = useState({
    prompt: '',
    name: '',
    gender: 'female',
    ageRange: 'adult',
    style: 'professional',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.prompt || !formData.name) {
      alert('Please enter a prompt and name')
      return
    }

    try {
      await onGenerate(projectId, formData.prompt, {
        name: formData.name,
        gender: formData.gender,
        ageRange: formData.ageRange,
        style: formData.style,
      })
      alert('Avatar generation started! It will appear in 30-60 seconds.')
      onClose()
    } catch (error: any) {
      handleError('Avatar Generation', error, 'Failed to start generation')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Generate Avatar with AI
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Describe Your Avatar *
              </label>
              <textarea
                value={formData.prompt}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none"
                placeholder="Example: Professional Indonesian woman with modern hijab, smiling, wearing formal business attire"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Avatar Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="unisex">Unisex</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Age Range</label>
                <select
                  value={formData.ageRange}
                  onChange={(e) => setFormData({ ...formData, ageRange: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="young">Young (18-30)</option>
                  <option value="adult">Adult (30-50)</option>
                  <option value="mature">Mature (50+)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Style</label>
                <select
                  value={formData.style}
                  onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="formal">Formal</option>
                  <option value="traditional">Traditional</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isGenerating}
                className="flex-1 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Generating... (30-60s)
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 inline mr-2" />
                    Generate Avatar
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isGenerating}
                className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ===== Image Preview Modal =====
function ImagePreviewModal({
  imageUrl,
  imageName,
  onClose,
}: {
  imageUrl: string
  imageName: string
  onClose: () => void
}) {
  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 animate-fadeIn backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 px-4">
          <h3 className="text-white text-xl font-semibold drop-shadow-lg">{imageName}</h3>
          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-sm group"
            title="Close (ESC)"
          >
            <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Image Container */}
        <div
          className="flex-1 flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={imageUrl}
            alt={imageName}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-scaleIn"
          />
        </div>

        {/* Download Button */}
        <div className="mt-4 flex justify-center gap-3">
          <a
            href={imageUrl}
            download={`${imageName}.png`}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all shadow-lg flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Upload className="w-5 h-5 rotate-180" />
            Download Image
          </a>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all backdrop-blur-sm"
          >
            Close
          </button>
        </div>

        {/* Instruction */}
        <p className="text-center text-white/60 text-sm mt-4">
          Click outside or press ESC to close
        </p>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

// ===== Presets Gallery Modal =====
function PresetsGalleryModal({
  presets,
  isLoading,
  onClose,
  onSelect,
}: {
  presets: any[]
  isLoading: boolean
  onClose: () => void
  onSelect: (presetId: string, customName?: string) => Promise<void>
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)
  const [customName, setCustomName] = useState('')

  const categories = ['all', 'professional', 'casual', 'sports', 'fashion', 'traditional']

  const filteredPresets = selectedCategory === 'all'
    ? presets
    : presets.filter(p => p.category === selectedCategory)

  const handleSelect = async () => {
    if (!selectedPresetId) {
      alert('Please select a preset')
      return
    }

    try {
      await onSelect(selectedPresetId, customName || undefined)
    } catch (error: any) {
      handleError('Preset Avatar Creation', error, 'Failed to create avatar from preset')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Grid className="w-6 h-6 text-blue-600" />
              Browse Preset Avatars
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition">✕</button>
          </div>

          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg transition whitespace-nowrap ${
                  selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {isLoading && (
            <div className="text-center py-16">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-slate-600">Loading presets...</p>
            </div>
          )}

          {!isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
              {filteredPresets.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => {
                    setSelectedPresetId(preset.id)
                    setCustomName(preset.name)
                  }}
                  className={`cursor-pointer rounded-lg overflow-hidden border-2 transition ${
                    selectedPresetId === preset.id ? 'border-blue-600 shadow-lg' : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center relative">
                    <UserCircle className="w-16 h-16 text-slate-400" />
                    <span className="absolute bottom-2 right-2 text-xs bg-black/50 text-white px-2 py-1 rounded">Placeholder</span>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm text-slate-900 mb-1">{preset.name}</h3>
                    <p className="text-xs text-slate-600 line-clamp-2">{preset.description}</p>
                    <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{preset.category}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && filteredPresets.length === 0 && (
            <div className="text-center py-16">
              <UserCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No presets found in this category</p>
            </div>
          )}

          {selectedPresetId && (
            <div className="border-t border-slate-200 pt-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Custom Name (Optional)</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Leave empty to use preset name"
                />
              </div>

              <div className="flex gap-3">
                <button onClick={handleSelect} className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Generate from Preset
                </button>
                <button onClick={onClose} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
