import { useState } from 'react'
import { Clock, CheckCircle, Loader2, XCircle, ChevronRight, Image as ImageIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { designTokens, getStatusColor } from '../styles/design-tokens'
import '../styles/animations.css'

interface Generation {
  id: string
  avatarId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  totalPoses: number
  successfulPoses: number
  failedPoses: number
  createdAt: string
  thumbnails?: string[]
}

interface RecentGenerationsWidgetProps {
  generations: Generation[]
  maxItems?: number
}

export default function RecentGenerationsWidget({
  generations,
  maxItems = 5,
}: RecentGenerationsWidgetProps) {
  const navigate = useNavigate()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin" />
      case 'failed':
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const recentGenerations = generations.slice(0, maxItems)

  if (recentGenerations.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-premium border border-slate-200 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Generations Yet</h3>
          <p className="text-slate-600 text-sm mb-6">
            Start generating professional poses with AI
          </p>
          <button
            onClick={() => navigate('/apps/pose-generator')}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white
                     rounded-lg font-medium shadow-premium hover-lift transition-all"
          >
            Create First Generation
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-premium border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Recent Generations</h3>
            <p className="text-sm text-slate-600 mt-1">Track your pose generation history</p>
          </div>
          <button
            onClick={() => navigate('/apps/pose-generator?tab=results')}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium
                     flex items-center gap-1 hover:gap-2 transition-all"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-[52px] top-0 bottom-0 w-0.5 bg-slate-200" />

        {/* Generation Items */}
        <div className="divide-y divide-slate-100">
          {recentGenerations.map((generation, index) => {
            const statusColor = getStatusColor(generation.status)
            const isHovered = hoveredId === generation.id

            return (
              <div
                key={generation.id}
                className="relative p-6 hover:bg-slate-50 transition-all cursor-pointer
                         animate-fadeInUp group"
                style={{ animationDelay: `${index * 100}ms` }}
                onMouseEnter={() => setHoveredId(generation.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => navigate(`/apps/pose-generator?generation=${generation.id}`)}
              >
                <div className="flex gap-4">
                  {/* Timeline Node */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div
                      className="w-10 h-10 rounded-full border-4 border-white shadow-premium
                               flex items-center justify-center transition-all
                               group-hover:scale-110"
                      style={{
                        backgroundColor: statusColor.bg,
                        color: statusColor.color,
                      }}
                    >
                      {getStatusIcon(generation.status)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-900">
                            Generation #{generation.id.slice(0, 8)}
                          </h4>
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium border"
                            style={{
                              backgroundColor: statusColor.bg,
                              color: statusColor.color,
                              borderColor: statusColor.border,
                            }}
                          >
                            {generation.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-600">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(generation.createdAt)}
                          </span>
                          <span>•</span>
                          <span>{generation.totalPoses} poses</span>
                          {generation.status === 'completed' && (
                            <>
                              <span>•</span>
                              <span className="text-green-600 font-medium">
                                {generation.successfulPoses} successful
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200
                                 flex items-center justify-center transition-all
                                 opacity-0 group-hover:opacity-100"
                      >
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>

                    {/* Progress Bar (for processing) */}
                    {generation.status === 'processing' && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                          <span>Progress</span>
                          <span className="font-medium">{generation.progress}%</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-600
                                     rounded-full transition-all duration-500 relative overflow-hidden"
                            style={{ width: `${generation.progress}%` }}
                          >
                            {/* Shimmer effect */}
                            <div className="absolute inset-0 shimmer" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Thumbnail Preview */}
                    {generation.thumbnails && generation.thumbnails.length > 0 && (
                      <div className="flex gap-2 overflow-hidden">
                        {generation.thumbnails.slice(0, 5).map((thumb, i) => (
                          <div
                            key={i}
                            className="w-12 h-12 rounded-lg overflow-hidden border-2 border-slate-200
                                     shadow-sm hover-scale transition-all flex-shrink-0"
                            style={{
                              transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                              transitionDelay: `${i * 50}ms`,
                            }}
                          >
                            <img
                              src={thumb}
                              alt={`Pose ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {generation.thumbnails.length > 5 && (
                          <div className="w-12 h-12 rounded-lg bg-slate-100 border-2 border-slate-200
                                        flex items-center justify-center text-xs font-semibold text-slate-600">
                            +{generation.thumbnails.length - 5}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Stats Summary (for completed) */}
                    {generation.status === 'completed' && !generation.thumbnails && (
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="text-slate-600">
                            {generation.successfulPoses} successful
                          </span>
                        </div>
                        {generation.failedPoses > 0 && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                            <span className="text-slate-600">
                              {generation.failedPoses} failed
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Hover Effect Border */}
                <div
                  className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600
                           transition-all duration-300 ${
                    isHovered ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-200">
        <button
          onClick={() => navigate('/apps/pose-generator')}
          className="w-full py-2.5 bg-white border border-slate-300 rounded-lg
                   text-sm font-medium text-slate-700 hover:bg-slate-50
                   hover:border-blue-300 transition-all hover-scale-sm"
        >
          Start New Generation
        </button>
      </div>
    </div>
  )
}
