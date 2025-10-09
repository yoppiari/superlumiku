import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, ImagePlus, Loader2, AlertCircle } from 'lucide-react'
import api from '../../../lib/api'

interface UploadPanelProps {
  projectId: string
  onUploadSuccess: (poster: any) => void
}

export function UploadPanel({ projectId, onUploadSuccess }: UploadPanelProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed')
      return
    }

    setError(null)
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectId', projectId)

      const response = await api.post('/api/apps/poster-editor/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        onUploadSuccess(response.data.poster)
      } else {
        setError(response.data.error || 'Upload failed')
      }
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.response?.data?.error || 'Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }, [projectId, onUploadSuccess])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    multiple: false,
    disabled: isUploading
  })

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <ImagePlus className="w-5 h-5 text-green-600" />
        Upload Poster
      </h2>

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${isDragActive ? 'border-green-500 bg-green-50' : 'border-slate-300 hover:border-green-400 hover:bg-slate-50'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />

        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
            <p className="text-sm text-slate-600">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-green-50 rounded-xl flex items-center justify-center">
              <Upload className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                {isDragActive ? 'Drop image here...' : 'Drag & drop image here'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                or click to browse
              </p>
            </div>
            <p className="text-xs text-slate-400">
              PNG, JPG, WebP • Max 10MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-4 text-xs text-slate-500">
        <p className="font-medium mb-1">💡 Tips:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Use high-quality images for best results</li>
          <li>Poster will be automatically analyzed for text</li>
          <li>You can upload multiple posters per project</li>
        </ul>
      </div>
    </div>
  )
}
