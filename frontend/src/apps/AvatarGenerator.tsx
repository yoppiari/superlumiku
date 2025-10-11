import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import api from '../lib/api'
import { ArrowLeft, Upload, Sparkles, Image as ImageIcon, Loader2 } from 'lucide-react'

interface PoseTemplate {
  id: string
  name: string
  category: string
  imageUrl: string
  difficulty: string
}

interface Generation {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  inputImageUrl: string
  outputImageUrl?: string
  poseTemplate: PoseTemplate
  createdAt: string
}

export default function AvatarGenerator() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [poseTemplates, setPoseTemplates] = useState<PoseTemplate[]>([])
  const [selectedPose, setSelectedPose] = useState<string | null>(null)
  const [quality, setQuality] = useState<'sd' | 'hd'>('sd')
  const [loading, setLoading] = useState(false)
  const [generations, setGenerations] = useState<Generation[]>([])
  const [loadingPoses, setLoadingPoses] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    // Fetch pose templates
    api.get('/api/poses')
      .then((res) => {
        setPoseTemplates(res.data.data || [])
        setLoadingPoses(false)
      })
      .catch((err) => {
        console.error('Failed to fetch poses:', err)
        setLoadingPoses(false)
      })

    // Fetch user generations
    fetchGenerations()
  }, [isAuthenticated, navigate])

  const fetchGenerations = () => {
    api.get('/api/apps/avatar-generator/generations?limit=10')
      .then((res) => {
        setGenerations(res.data.data || [])
      })
      .catch((err) => console.error('Failed to fetch generations:', err))
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGenerate = async () => {
    if (!selectedImage || !selectedPose) {
      alert('Please select an image and a pose')
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('image', selectedImage)
    formData.append('poseTemplateId', selectedPose)
    formData.append('quality', quality)

    try {
      await api.post('/api/apps/avatar-generator/generate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      alert('Avatar generation started! Check your results below.')
      setSelectedImage(null)
      setImagePreview(null)
      setSelectedPose(null)

      // Refresh generations after a delay
      setTimeout(() => {
        fetchGenerations()
      }, 2000)
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to generate avatar')
    } finally {
      setLoading(false)
    }
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
              <h1 className="text-2xl font-bold text-slate-900">Avatar & Pose Generator</h1>
              <p className="text-sm text-slate-600 mt-1">Generate custom avatars with AI-powered poses</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Upload Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Upload Your Photo</h2>

            <div className="mb-6">
              <label className="block w-full">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
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

            {/* Quality Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Quality</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setQuality('sd')}
                  className={`flex-1 py-2 px-4 rounded-lg border font-medium transition-colors ${
                    quality === 'sd'
                      ? 'bg-purple-50 border-purple-500 text-purple-700'
                      : 'bg-white border-slate-300 text-slate-700'
                  }`}
                >
                  SD (512x512)
                </button>
                <button
                  onClick={() => setQuality('hd')}
                  className={`flex-1 py-2 px-4 rounded-lg border font-medium transition-colors ${
                    quality === 'hd'
                      ? 'bg-purple-50 border-purple-500 text-purple-700'
                      : 'bg-white border-slate-300 text-slate-700'
                  }`}
                >
                  HD (1024x1024)
                </button>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!selectedImage || !selectedPose || loading}
              className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Avatar
                </>
              )}
            </button>
          </div>

          {/* Pose Selection */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Select Pose Template</h2>

            {loadingPoses ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-3" />
                <p className="text-slate-600">Loading poses...</p>
              </div>
            ) : poseTemplates.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600">No pose templates available</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 max-h-[500px] overflow-y-auto">
                {poseTemplates.slice(0, 24).map((pose) => (
                  <button
                    key={pose.id}
                    onClick={() => setSelectedPose(pose.id)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedPose === pose.id
                        ? 'border-purple-500 ring-2 ring-purple-200'
                        : 'border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    <img
                      src={pose.imageUrl}
                      alt={pose.name}
                      className="w-full h-full object-cover"
                    />
                    {selectedPose === pose.id && (
                      <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                        <div className="bg-purple-600 text-white rounded-full p-2">
                          <Sparkles className="w-4 h-4" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Generations */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Generations</h2>

          {generations.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">No generations yet</p>
              <p className="text-sm text-slate-500 mt-1">Upload a photo and select a pose to get started</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {generations.map((gen) => (
                <div key={gen.id} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <div className="aspect-square bg-white rounded-lg mb-3 overflow-hidden">
                    {gen.status === 'completed' && gen.outputImageUrl ? (
                      <img src={gen.outputImageUrl} alt="Generated" className="w-full h-full object-cover" />
                    ) : gen.status === 'processing' || gen.status === 'pending' ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-2" />
                          <p className="text-xs text-slate-600">Processing...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-red-50">
                        <p className="text-xs text-red-600">Failed</p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 text-center">{gen.poseTemplate?.name || 'Unknown Pose'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
