import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import api from '../lib/api'
import { ArrowLeft, Upload, UserCircle, Trash2, Loader2, Sparkles } from 'lucide-react'

interface Avatar {
  id: string
  name: string
  baseImageUrl: string
  thumbnailUrl: string | null
  gender: string | null
  ageRange: string | null
  style: string | null
  ethnicity: string | null
  usageCount: number
  createdAt: string
}

interface AvatarStats {
  totalAvatars: number
  recentUploads: number
  totalUsage: number
  averageUsage: number
}

export default function AvatarCreator() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [avatars, setAvatars] = useState<Avatar[]>([])
  const [stats, setStats] = useState<AvatarStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  // Form state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createMode, setCreateMode] = useState<'upload' | 'ai'>('upload') // NEW: tab mode
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    ageRange: '',
    style: '',
    ethnicity: ''
  })

  // AI Generation state
  const [aiFormData, setAiFormData] = useState({
    prompt: '',
    name: '',
    gender: 'female',
    ageRange: 'adult',
    style: 'professional'
  })
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    loadAvatars()
    loadStats()
  }, [isAuthenticated, navigate])

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

  const loadStats = async () => {
    try {
      const res = await api.get('/api/apps/avatar-creator/stats')
      setStats(res.data.stats)
    } catch (error: any) {
      console.error('Failed to load stats:', error)
    }
  }

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

  const handleCreateAvatar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      alert('Please select an image')
      return
    }

    if (!formData.name) {
      alert('Please enter avatar name')
      return
    }

    setUploading(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('image', selectedFile)
      formDataToSend.append('name', formData.name)
      if (formData.gender) formDataToSend.append('gender', formData.gender)
      if (formData.ageRange) formDataToSend.append('ageRange', formData.ageRange)
      if (formData.style) formDataToSend.append('style', formData.style)
      if (formData.ethnicity) formDataToSend.append('ethnicity', formData.ethnicity)

      await api.post('/api/apps/avatar-creator/avatars', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      alert('Avatar created successfully!')

      // Reset form
      setShowCreateForm(false)
      setSelectedFile(null)
      setPreviewUrl(null)
      setFormData({
        name: '',
        gender: '',
        ageRange: '',
        style: '',
        ethnicity: ''
      })

      // Reload data
      loadAvatars()
      loadStats()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create avatar')
    } finally {
      setUploading(false)
    }
  }

  const handleGenerateAI = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!aiFormData.prompt || aiFormData.prompt.length < 10) {
      alert('Please enter a detailed prompt (at least 10 characters)')
      return
    }

    if (!aiFormData.name) {
      alert('Please enter avatar name')
      return
    }

    setGenerating(true)

    try {
      await api.post('/api/apps/avatar-creator/avatars/generate', {
        prompt: aiFormData.prompt,
        name: aiFormData.name,
        gender: aiFormData.gender,
        ageRange: aiFormData.ageRange,
        style: aiFormData.style,
      })

      alert('Avatar generated successfully! This may take 30-60 seconds to complete.')

      // Reset form
      setShowCreateForm(false)
      setAiFormData({
        prompt: '',
        name: '',
        gender: 'female',
        ageRange: 'adult',
        style: 'professional'
      })

      // Reload data
      loadAvatars()
      loadStats()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to generate avatar')
    } finally {
      setGenerating(false)
    }
  }

  const handleDeleteAvatar = async (id: string) => {
    if (!confirm('Delete this avatar? This cannot be undone.')) return

    try {
      await api.delete(`/api/apps/avatar-creator/avatars/${id}`)
      alert('Avatar deleted successfully')
      loadAvatars()
      loadStats()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete avatar')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
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
              <h1 className="text-2xl font-bold text-slate-900">Avatar Creator</h1>
              <p className="text-sm text-slate-600 mt-1">Create and manage AI avatars for pose generation</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowCreateForm(true)
                  setCreateMode('upload')
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Avatar
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(true)
                  setCreateMode('ai')
                }}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Generate with AI
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="text-sm text-slate-600 mb-1">Total Avatars</div>
              <div className="text-3xl font-bold text-slate-900">{stats.totalAvatars}</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="text-sm text-slate-600 mb-1">Recent Uploads</div>
              <div className="text-3xl font-bold text-purple-600">{stats.recentUploads}</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="text-sm text-slate-600 mb-1">Total Usage</div>
              <div className="text-3xl font-bold text-slate-900">{stats.totalUsage}</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="text-sm text-slate-600 mb-1">Avg Usage</div>
              <div className="text-3xl font-bold text-slate-900">{stats.averageUsage}</div>
            </div>
          </div>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-200 mb-6">
              <button
                type="button"
                onClick={() => setCreateMode('upload')}
                className={`pb-3 px-2 font-medium transition-colors border-b-2 ${
                  createMode === 'upload'
                    ? 'text-purple-600 border-purple-600'
                    : 'text-slate-500 border-transparent hover:text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Photo
                </div>
              </button>
              <button
                type="button"
                onClick={() => setCreateMode('ai')}
                className={`pb-3 px-2 font-medium transition-colors border-b-2 ${
                  createMode === 'ai'
                    ? 'text-purple-600 border-purple-600'
                    : 'text-slate-500 border-transparent hover:text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Generate with AI
                </div>
              </button>
            </div>

            {/* Upload Form */}
            {createMode === 'upload' && (
              <form onSubmit={handleCreateAvatar} className="space-y-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Avatar Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="My Avatar"
                    required
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="unisex">Unisex</option>
                  </select>
                </div>

                {/* Age Range */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Age Range</label>
                  <select
                    value={formData.ageRange}
                    onChange={(e) => setFormData({ ...formData, ageRange: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select age range</option>
                    <option value="young">Young</option>
                    <option value="adult">Adult</option>
                    <option value="mature">Mature</option>
                  </select>
                </div>

                {/* Style */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Style</label>
                  <select
                    value={formData.style}
                    onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select style</option>
                    <option value="casual">Casual</option>
                    <option value="formal">Formal</option>
                    <option value="sporty">Sporty</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Create Avatar
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
            )}

            {/* AI Generation Form */}
            {createMode === 'ai' && (
              <form onSubmit={handleGenerateAI} className="space-y-4">
                {/* AI Prompt */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Describe Your Avatar *
                  </label>
                  <textarea
                    value={aiFormData.prompt}
                    onChange={(e) => setAiFormData({ ...aiFormData, prompt: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    placeholder="Example: Professional Indonesian woman with modern hijab, smiling, wearing formal business attire, professional photography style, studio lighting"
                    rows={4}
                    required
                    minLength={10}
                    maxLength={500}
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    Be specific! Include details like: appearance, clothing style, expression, background, photography style
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Avatar Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Avatar Name *</label>
                    <input
                      type="text"
                      value={aiFormData.name}
                      onChange={(e) => setAiFormData({ ...aiFormData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="My AI Avatar"
                      required
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
                    <select
                      value={aiFormData.gender}
                      onChange={(e) => setAiFormData({ ...aiFormData, gender: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="unisex">Unisex</option>
                    </select>
                  </div>

                  {/* Age Range */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Age Range</label>
                    <select
                      value={aiFormData.ageRange}
                      onChange={(e) => setAiFormData({ ...aiFormData, ageRange: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="young">Young (18-30)</option>
                      <option value="adult">Adult (30-50)</option>
                      <option value="mature">Mature (50+)</option>
                    </select>
                  </div>

                  {/* Style */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Style</label>
                    <select
                      value={aiFormData.style}
                      onChange={(e) => setAiFormData({ ...aiFormData, style: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="formal">Formal</option>
                      <option value="traditional">Traditional</option>
                      <option value="sporty">Sporty</option>
                    </select>
                  </div>
                </div>

                {/* Generation Info */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-purple-900 mb-1">AI Generation</h4>
                      <p className="text-sm text-purple-700">
                        First generation may take 30-60 seconds. Subsequent generations are faster (~20-40 seconds).
                        The AI will create a 1024x1024 high-quality avatar based on your prompt.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={generating}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating... (30-60s)
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Avatar
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    disabled={generating}
                    className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Avatars Grid */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Your Avatars</h2>

          {avatars.length === 0 ? (
            <div className="text-center py-12">
              <UserCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 mb-2">No avatars yet</p>
              <p className="text-sm text-slate-500">Upload your first avatar to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {avatars.map((avatar) => (
                <div key={avatar.id} className="bg-slate-50 rounded-lg overflow-hidden border border-slate-200 hover:border-purple-300 transition-colors">
                  <div className="aspect-square bg-white">
                    <img
                      src={avatar.thumbnailUrl || avatar.baseImageUrl}
                      alt={avatar.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-900 mb-1">{avatar.name}</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {avatar.gender && (
                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                          {avatar.gender}
                        </span>
                      )}
                      {avatar.ageRange && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {avatar.ageRange}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-600 mb-3">
                      <span>Used {avatar.usageCount} times</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate('/apps/pose-generator', { state: { avatarId: avatar.id } })}
                        className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                      >
                        Generate Poses
                      </button>
                      <button
                        onClick={() => handleDeleteAvatar(avatar.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
      </main>
    </div>
  )
}
