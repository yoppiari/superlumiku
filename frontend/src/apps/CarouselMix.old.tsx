import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/authStore'
import { Layers, Plus, Upload, Download, FileText, Image as ImageIcon } from 'lucide-react'

interface Project {
  id: string
  name: string
  description?: string
  slides: Slide[]
  texts: TextOverlay[]
  generations: Generation[]
  createdAt: string
}

interface Slide {
  id: string
  fileName: string
  filePath: string
  fileType: string
  order: number
}

interface TextOverlay {
  id: string
  content: string
  position: string
  alignment: string
  fontSize: number
  fontColor: string
  fontWeight: string
  order: number
}

interface Generation {
  id: string
  status: string
  numSlides: number
  numSetsGenerated: number
  creditUsed: number
  outputPath?: string
  createdAt: string
  completedAt?: string
}

export default function CarouselMix() {
  const navigate = useNavigate()
  const { user, updateCreditBalance } = useAuthStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewProject, setShowNewProject] = useState(false)
  const [showAddText, setShowAddText] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Form states
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  const [newText, setNewText] = useState({
    content: '',
    position: 'center',
    alignment: 'center',
    fontSize: 24,
    fontColor: '#FFFFFF',
    fontWeight: 'normal',
    order: 0,
  })
  const [generateSettings, setGenerateSettings] = useState({
    numSlides: 4,
    numSets: 5,
  })
  const [combinations, setCombinations] = useState<any>(null)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const res = await api.get('/api/apps/carousel-mix/projects')
      setProjects(res.data.projects)
    } catch (error: any) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await api.post('/api/apps/carousel-mix/projects', {
        name: newProjectName,
        description: newProjectDesc,
      })
      setProjects([res.data.project, ...projects])
      setNewProjectName('')
      setNewProjectDesc('')
      setShowNewProject(false)
      alert('Project created!')
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create project')
    }
  }

  const handleUploadSlide = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedProject || !e.target.files?.[0]) return

    setUploading(true)
    const file = e.target.files[0]
    const formData = new FormData()
    formData.append('file', file)

    try {
      await api.post(
        `/api/apps/carousel-mix/projects/${selectedProject.id}/slides/upload`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )

      // Reload project
      const projectRes = await api.get(`/api/apps/carousel-mix/projects/${selectedProject.id}`)
      setSelectedProject(projectRes.data.project)
      alert('Slide uploaded!')
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to upload slide')
    } finally {
      setUploading(false)
    }
  }

  const handleAddText = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject) return

    try {
      await api.post(`/api/apps/carousel-mix/projects/${selectedProject.id}/texts`, newText)

      // Reload project
      const projectRes = await api.get(`/api/apps/carousel-mix/projects/${selectedProject.id}`)
      setSelectedProject(projectRes.data.project)

      setShowAddText(false)
      setNewText({
        content: '',
        position: 'center',
        alignment: 'center',
        fontSize: 24,
        fontColor: '#FFFFFF',
        fontWeight: 'normal',
        order: 0,
      })
      alert('Text added!')
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to add text')
    }
  }

  const handleCalculateCombinations = async () => {
    if (!selectedProject) return

    try {
      const res = await api.get(
        `/api/apps/carousel-mix/projects/${selectedProject.id}/combinations?numSlides=${generateSettings.numSlides}&numSets=${generateSettings.numSets}`
      )
      setCombinations(res.data.data)
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to calculate combinations')
    }
  }

  const handleGenerate = async () => {
    if (!selectedProject) return

    if (!combinations || !combinations.feasibility.feasible) {
      alert('Please calculate combinations first')
      return
    }

    if (user && user.creditBalance < combinations.credits.total) {
      alert(`Insufficient credits! You need ${combinations.credits.total} credits but have ${user.creditBalance}`)
      navigate('/dashboard')
      return
    }

    try {
      const res = await api.post(
        `/api/apps/carousel-mix/projects/${selectedProject.id}/generate`,
        generateSettings
      )

      updateCreditBalance(res.data.creditBalance)

      // Reload project to show new generation
      const projectRes = await api.get(`/api/apps/carousel-mix/projects/${selectedProject.id}`)
      setSelectedProject(projectRes.data.project)

      alert(`Generation started! Used ${res.data.creditUsed} credits`)
    } catch (error: any) {
      if (error.response?.status === 402) {
        alert('Insufficient credits!')
        navigate('/dashboard')
      } else {
        alert(error.response?.data?.error || 'Failed to generate')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!selectedProject) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Layers className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold">Carousel Mix</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                ← Back to Dashboard
              </button>
              <div className="text-sm text-gray-600">
                Credits: <span className="font-bold">{user?.creditBalance || 0}</span>
              </div>
            </div>
          </div>

          {/* New Project Button */}
          <button
            onClick={() => setShowNewProject(true)}
            className="mb-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>

          {/* New Project Form */}
          {showNewProject && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Create New Project</h2>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <input
                  type="text"
                  placeholder="Project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
                <textarea
                  placeholder="Description (optional)"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewProject(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 py-12">
                No projects yet. Create your first one!
              </div>
            ) : (
              projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition"
                >
                  <h3 className="text-lg font-bold mb-2">{project.name}</h3>
                  {project.description && (
                    <p className="text-sm text-gray-600 mb-4">{project.description}</p>
                  )}
                  <div className="text-sm text-gray-500 space-y-1">
                    <div>📸 {project.slides.length} slides</div>
                    <div>📝 {project.texts.length} texts</div>
                    <div>🎨 {project.generations.length} generations</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  // Project Detail View
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedProject(null)}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold">{selectedProject.name}</h1>
          </div>
          <div className="text-sm text-gray-600">
            Credits: <span className="font-bold">{user?.creditBalance || 0}</span>
          </div>
        </div>

        {/* Slides Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Slides ({selectedProject.slides.length}/8)</h2>
            <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer flex items-center gap-2">
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Upload Slide'}
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleUploadSlide}
                className="hidden"
                disabled={uploading || selectedProject.slides.length >= 8}
              />
            </label>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {selectedProject.slides.map((slide) => (
              <div key={slide.id} className="border rounded-lg p-4 text-center">
                {slide.fileType === 'image' ? (
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                ) : (
                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                )}
                <p className="text-xs text-gray-600 truncate">{slide.fileName}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Texts Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Text Overlays ({selectedProject.texts.length})</h2>
            <button
              onClick={() => setShowAddText(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Text
            </button>
          </div>

          {showAddText && (
            <form onSubmit={handleAddText} className="mb-4 p-4 border rounded-lg space-y-3">
              <input
                type="text"
                placeholder="Text content"
                value={newText.content}
                onChange={(e) => setNewText({ ...newText, content: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={newText.position}
                  onChange={(e) => setNewText({ ...newText, position: e.target.value })}
                  className="px-3 py-2 border rounded"
                >
                  <option value="top-left">Top Left</option>
                  <option value="top-center">Top Center</option>
                  <option value="top-right">Top Right</option>
                  <option value="center-left">Center Left</option>
                  <option value="center">Center</option>
                  <option value="center-right">Center Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-center">Bottom Center</option>
                  <option value="bottom-right">Bottom Right</option>
                </select>
                <input
                  type="number"
                  placeholder="Font size"
                  value={newText.fontSize}
                  onChange={(e) => setNewText({ ...newText, fontSize: parseInt(e.target.value) })}
                  className="px-3 py-2 border rounded"
                  min="8"
                  max="200"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddText(false)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {selectedProject.texts.map((text) => (
              <div key={text.id} className="p-3 border rounded flex justify-between items-center">
                <div>
                  <p className="font-medium">{text.content}</p>
                  <p className="text-sm text-gray-500">
                    {text.position} · {text.fontSize}px · Slide {text.order + 1}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Generation Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Generate Carousels</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Slides per carousel</label>
                <input
                  type="number"
                  value={generateSettings.numSlides}
                  onChange={(e) => setGenerateSettings({ ...generateSettings, numSlides: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded"
                  min="2"
                  max="8"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Number of sets</label>
                <input
                  type="number"
                  value={generateSettings.numSets}
                  onChange={(e) => setGenerateSettings({ ...generateSettings, numSets: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded"
                  min="1"
                  max="100"
                />
              </div>
            </div>

            <button
              onClick={handleCalculateCombinations}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Calculate Combinations
            </button>

            {combinations && (
              <div className="p-4 bg-blue-50 rounded">
                <p className="font-medium">Possible Combinations: {combinations.totalCombinations}</p>
                <p className="text-sm text-gray-600">
                  Cost: {combinations.credits.total} credits ({combinations.credits.perSet} per set)
                </p>
                {!combinations.feasibility.feasible && (
                  <p className="text-sm text-red-600 mt-2">{combinations.feasibility.reason}</p>
                )}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!combinations || !combinations.feasibility.feasible}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Generate Carousels
            </button>
          </div>
        </div>

        {/* Generations History */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Generation History</h2>
          <div className="space-y-2">
            {selectedProject.generations.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No generations yet</p>
            ) : (
              selectedProject.generations.map((gen) => (
                <div key={gen.id} className="p-4 border rounded flex justify-between items-center">
                  <div>
                    <p className="font-medium">
                      {gen.numSetsGenerated} sets × {gen.numSlides} slides
                    </p>
                    <p className="text-sm text-gray-500">
                      Status: {gen.status} · {gen.creditUsed} credits used
                    </p>
                  </div>
                  {gen.status === 'completed' && gen.outputPath && (
                    <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
