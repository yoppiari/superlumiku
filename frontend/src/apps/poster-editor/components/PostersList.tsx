import { FileImage, Trash2, Download, Sparkles, CheckCircle, Clock, XCircle } from 'lucide-react'
import { getImageUrl } from '../../../lib/imageUrl'

interface Poster {
  id: string
  originalUrl: string
  editedUrl?: string
  enhancedUrl?: string
  status: string
  createdAt: string
  detectedTexts?: any
}

interface PostersListProps {
  posters: Poster[]
  selectedPosterId?: string
  onSelectPoster: (poster: Poster) => void
  onDeletePoster: (posterId: string) => void
}

export function PostersList({ posters, selectedPosterId, onSelectPoster, onDeletePoster }: PostersListProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'uploaded':
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Uploaded
          </span>
        )
      case 'detected':
        return (
          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Detected
          </span>
        )
      case 'edited':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Edited
          </span>
        )
      case 'enhanced':
        return (
          <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Enhanced
          </span>
        )
      case 'failed':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Failed
          </span>
        )
      default:
        return null
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <FileImage className="w-5 h-5 text-green-600" />
          Posters ({posters.length})
        </h2>
      </div>

      <div className="divide-y divide-slate-200 max-h-[600px] overflow-y-auto">
        {posters.length === 0 ? (
          <div className="text-center py-12 px-4">
            <FileImage className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No posters yet</p>
            <p className="text-slate-400 text-xs mt-1">Upload your first poster to get started</p>
          </div>
        ) : (
          posters.map((poster) => (
            <div
              key={poster.id}
              className={`
                p-4 hover:bg-slate-50 transition-colors cursor-pointer relative group
                ${selectedPosterId === poster.id ? 'bg-green-50 border-l-4 border-green-600' : ''}
              `}
              onClick={() => onSelectPoster(poster)}
            >
              <div className="flex gap-3">
                {/* Thumbnail */}
                <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={getImageUrl(poster.enhancedUrl || poster.editedUrl || poster.originalUrl)}
                    alt="Poster"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      {getStatusBadge(poster.status)}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeletePoster(poster.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-600"
                      title="Delete poster"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 mb-1">
                    {formatDate(poster.createdAt)}
                  </p>

                  {poster.detectedTexts && (
                    <p className="text-xs text-slate-600">
                      {JSON.parse(poster.detectedTexts as any || '[]').length} text regions
                    </p>
                  )}

                  {/* Quick Actions */}
                  <div className="flex gap-2 mt-2">
                    {poster.enhancedUrl && (
                      <a
                        href={poster.enhancedUrl}
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Enhanced
                      </a>
                    )}
                    {poster.editedUrl && !poster.enhancedUrl && (
                      <a
                        href={poster.editedUrl}
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Edited
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
