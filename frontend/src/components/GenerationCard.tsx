import { Download, Trash2, Eye, Video, FolderOpen } from 'lucide-react'
import type { GenerationItem } from '../types/generation'

interface GenerationCardProps {
  generation: GenerationItem
  onPreview?: (generation: GenerationItem) => void
  onDownload?: (generation: GenerationItem) => void
  onDelete?: (generation: GenerationItem) => void
  compact?: boolean
}

const APP_COLORS = {
  'video-mixer': 'bg-purple-50 text-purple-700 border-purple-200',
  'carousel-mix': 'bg-blue-50 text-blue-700 border-blue-200',
}

const STATUS_COLORS = {
  completed: 'bg-green-50 text-green-700',
  processing: 'bg-blue-50 text-blue-700 animate-pulse',
  pending: 'bg-orange-50 text-orange-700',
  failed: 'bg-red-50 text-red-700',
}

const STATUS_LABELS = {
  completed: 'Completed',
  processing: 'Processing',
  pending: 'Pending',
  failed: 'Failed',
}

export default function GenerationCard({
  generation,
  onPreview,
  onDownload,
  onDelete,
  compact = false,
}: GenerationCardProps) {
  const Icon = generation.appIcon === 'video' ? Video : FolderOpen

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  const formatSize = (bytes?: number) => {
    if (!bytes) return ''
    const mb = bytes / (1024 * 1024)
    if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`
    if (mb < 1000) return `${mb.toFixed(1)} MB`
    return `${(mb / 1024).toFixed(2)} GB`
  }

  if (compact) {
    return (
      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer">
        <div className={`w-12 h-12 rounded-xl ${APP_COLORS[generation.appId]} flex items-center justify-center flex-shrink-0 border`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-slate-900 mb-1 truncate">{generation.projectName}</h4>
          <p className="text-xs text-slate-600">{formatDate(generation.createdAt)}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-xs text-slate-500">{generation.fileCount} file{generation.fileCount > 1 ? 's' : ''}</span>
          <span className={`px-3 py-1 rounded-md text-xs font-medium ${STATUS_COLORS[generation.status]}`}>
            {STATUS_LABELS[generation.status]}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-soft transition-all overflow-hidden">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-slate-100">
        {generation.thumbnailUrl ? (
          <img
            src={generation.thumbnailUrl}
            alt={generation.projectName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon className="w-12 h-12 text-slate-300" />
          </div>
        )}
        <div className={`absolute top-2 left-2 px-2.5 py-1 rounded-md text-xs font-medium ${APP_COLORS[generation.appId]} border backdrop-blur-sm`}>
          <Icon className="w-3 h-3 inline mr-1" />
          {generation.appName}
        </div>
        <div className={`absolute top-2 right-2 px-2.5 py-1 rounded-md text-xs font-medium ${STATUS_COLORS[generation.status]}`}>
          {STATUS_LABELS[generation.status]}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-base font-semibold text-slate-900 mb-2 truncate">{generation.projectName}</h3>

        <div className="flex items-center gap-4 text-xs text-slate-600 mb-4">
          <span>{formatDate(generation.createdAt)}</span>
          <span>•</span>
          <span>{generation.fileCount} file{generation.fileCount > 1 ? 's' : ''}</span>
          {generation.totalSize && (
            <>
              <span>•</span>
              <span>{formatSize(generation.totalSize)}</span>
            </>
          )}
        </div>

        {generation.status === 'completed' && (
          <div className="flex items-center gap-2">
            {onPreview && (
              <button
                onClick={() => onPreview(generation)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 hover:border-slate-300 transition-all"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
            )}
            {onDownload && (
              <button
                onClick={() => onDownload(generation)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-all"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(generation)}
                className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
