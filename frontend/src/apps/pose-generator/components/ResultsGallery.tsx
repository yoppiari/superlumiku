import { Download, ExternalLink, Heart, RefreshCw, Share2 } from 'lucide-react'
import { useState } from 'react'
import type { GeneratedPose } from '../types'
import { getAbsoluteImageUrl } from '../../../lib/api'
import { triggerDownload } from '../utils/websocket'

interface ResultsGalleryProps {
  poses: GeneratedPose[]
  onDownload?: (pose: GeneratedPose) => void
  onRegenerateExport?: (pose: GeneratedPose, format: string) => void
}

export default function ResultsGallery({
  poses,
  onDownload,
  onRegenerateExport,
}: ResultsGalleryProps) {
  const [selectedPose, setSelectedPose] = useState<GeneratedPose | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const handleDownload = (pose: GeneratedPose) => {
    const imageUrl = getAbsoluteImageUrl(pose.outputImageUrl)
    if (imageUrl) {
      triggerDownload(imageUrl, `pose-${pose.id}.png`)
      onDownload?.(pose)
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 text-sm rounded-lg ${
              viewMode === 'grid'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 text-sm rounded-lg ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            List
          </button>
        </div>

        <div className="text-sm text-slate-600">
          {poses.length} pose{poses.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {poses.map((pose) => {
            const imageUrl = getAbsoluteImageUrl(pose.thumbnailUrl || pose.outputImageUrl)
            return (
              <div
                key={pose.id}
                className="group relative rounded-lg overflow-hidden border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSelectedPose(pose)}
              >
                <div className="aspect-square bg-slate-100">
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt="Generated pose"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}
                </div>

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownload(pose)
                      }}
                      className="p-2 bg-white rounded-full hover:bg-blue-50 transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4 text-slate-700" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        const url = getAbsoluteImageUrl(pose.outputImageUrl)
                        if (url) window.open(url, '_blank')
                      }}
                      className="p-2 bg-white rounded-full hover:bg-blue-50 transition-colors"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-4 h-4 text-slate-700" />
                    </button>
                  </div>
                </div>

                {/* Status Badge */}
                {pose.status === 'failed' && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-red-600 text-white text-xs font-medium rounded">
                    Failed
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {poses.map((pose) => {
            const imageUrl = getAbsoluteImageUrl(pose.thumbnailUrl || pose.outputImageUrl)
            return (
              <div
                key={pose.id}
                className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
              >
                {/* Thumbnail */}
                <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt="Generated pose"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-900 mb-1">Pose {pose.id.slice(0, 8)}</h4>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <span>Status: {pose.status}</span>
                    {pose.generationTime && (
                      <span>{pose.generationTime.toFixed(1)}s generation time</span>
                    )}
                    {pose.downloadCount > 0 && (
                      <span>{pose.downloadCount} downloads</span>
                    )}
                  </div>

                  {/* Export Formats */}
                  {pose.exportFormats && Object.keys(pose.exportFormats).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Object.keys(pose.exportFormats).map((format) => (
                        <span
                          key={format}
                          className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded"
                        >
                          {format.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleDownload(pose)}
                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      const url = getAbsoluteImageUrl(pose.outputImageUrl)
                      if (url) window.open(url, '_blank')
                    }}
                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {poses.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-600 mb-2">No poses generated yet</p>
          <p className="text-sm text-slate-500">
            Start a generation to see your results here
          </p>
        </div>
      )}
    </div>
  )
}
