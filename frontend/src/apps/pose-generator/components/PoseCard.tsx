import { CheckCircle2, Star } from 'lucide-react'
import type { PoseLibraryItem } from '../types'
import { getAbsoluteImageUrl } from '../../../lib/api'

interface PoseCardProps {
  pose: PoseLibraryItem
  isSelected?: boolean
  onSelect?: (poseId: string) => void
  showDetails?: boolean
}

export default function PoseCard({ pose, isSelected, onSelect, showDetails }: PoseCardProps) {
  const difficultyColors = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
  }

  const imageUrl = getAbsoluteImageUrl(pose.thumbnailUrl || pose.previewImageUrl)

  return (
    <div
      className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-200 shadow-md'
          : 'border-slate-200 hover:border-blue-300 hover:shadow-sm'
      }`}
      onClick={() => onSelect?.(pose.id)}
    >
      {/* Image */}
      <div className="aspect-square bg-slate-100 relative overflow-hidden">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={pose.name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        )}

        {/* Selection Overlay */}
        {isSelected && (
          <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
            <div className="bg-blue-600 text-white rounded-full p-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        )}

        {/* Featured Badge */}
        {pose.isFeatured && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" />
            Featured
          </div>
        )}

        {/* Premium Badge */}
        {pose.isPremium && (
          <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs font-medium px-2 py-1 rounded-full">
            Premium
          </div>
        )}
      </div>

      {/* Details */}
      {showDetails && (
        <div className="p-3 bg-white">
          <h3 className="font-medium text-slate-900 text-sm mb-1 truncate">{pose.name}</h3>

          <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
            <span className={`px-2 py-0.5 rounded ${difficultyColors[pose.difficulty]}`}>
              {pose.difficulty}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 capitalize">
              {pose.genderSuitability}
            </span>
          </div>

          {/* Tags */}
          {pose.tags && pose.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {pose.tags.slice(0, 3).map((tag, i) => (
                <span key={i} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                  {tag}
                </span>
              ))}
              {pose.tags.length > 3 && (
                <span className="text-xs text-slate-500">+{pose.tags.length - 3}</span>
              )}
            </div>
          )}

          {/* Usage count */}
          <div className="mt-2 text-xs text-slate-500">
            Used {pose.usageCount.toLocaleString()} times
          </div>
        </div>
      )}
    </div>
  )
}
