import { useState, useEffect, useMemo } from 'react'
import { CheckCircle, Filter, Search, Star, Zap } from 'lucide-react'
import { designTokens, getDifficultyColor } from '../styles/design-tokens'
import '../styles/animations.css'

interface PoseTemplate {
  id: string
  category: string
  subcategory: string | null
  previewUrl: string
  difficulty: string
  tags: string
  fashionCategory: string | null
  sceneType: string | null
  professionTheme: string | null
  featured?: boolean
}

interface PoseLibraryProps {
  poses: PoseTemplate[]
  selectedPoses: string[]
  onTogglePose: (poseId: string) => void
  categoryFilter: string
  onCategoryChange: (category: string) => void
  loading?: boolean
  maxSelection?: number
}

export default function PoseLibrary({
  poses,
  selectedPoses,
  onTogglePose,
  categoryFilter,
  onCategoryChange,
  loading = false,
  maxSelection = 50,
}: PoseLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [imageLoadStates, setImageLoadStates] = useState<Record<string, boolean>>({})
  const [difficultyFilter, setDifficultyFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>()
    poses.forEach(pose => {
      if (pose.category) cats.add(pose.category)
      if (pose.fashionCategory) cats.add(pose.fashionCategory)
    })
    return Array.from(cats).sort()
  }, [poses])

  // Filter poses
  const filteredPoses = useMemo(() => {
    return poses.filter(pose => {
      // Category filter
      if (categoryFilter) {
        if (pose.category !== categoryFilter && pose.fashionCategory !== categoryFilter) {
          return false
        }
      }

      // Difficulty filter
      if (difficultyFilter && pose.difficulty !== difficultyFilter) {
        return false
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const searchableText = [
          pose.category,
          pose.subcategory,
          pose.tags,
          pose.difficulty,
          pose.fashionCategory,
          pose.sceneType,
          pose.professionTheme,
        ].filter(Boolean).join(' ').toLowerCase()

        if (!searchableText.includes(query)) {
          return false
        }
      }

      return true
    })
  }, [poses, categoryFilter, difficultyFilter, searchQuery])

  // Handle image load
  const handleImageLoad = (poseId: string) => {
    setImageLoadStates(prev => ({ ...prev, [poseId]: true }))
  }

  // Check if at max selection
  const isMaxReached = selectedPoses.length >= maxSelection

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton Header */}
        <div className="flex gap-4">
          <div className="flex-1 h-10 bg-slate-200 rounded-lg skeleton-loader" />
          <div className="w-40 h-10 bg-slate-200 rounded-lg skeleton-loader" />
        </div>

        {/* Skeleton Grid */}
        <div className="masonry-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="bg-slate-200 rounded-lg skeleton-loader"
              style={{ height: `${200 + Math.random() * 100}px` }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-3">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search poses by category, tags, difficulty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm
                       focus-premium transition-all hover-scale-sm"
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all
                       hover-scale-sm hover-glow flex items-center gap-2 ${
              showFilters
                ? 'bg-blue-500 text-white shadow-premium'
                : 'bg-white border border-slate-300 text-slate-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4 animate-fadeInDown">
            {/* Category Pills */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                Categories
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onCategoryChange('')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                             hover-scale-sm ${
                    !categoryFilter
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-premium'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => onCategoryChange(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                               hover-scale-sm ${
                      categoryFilter === cat
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-premium'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                Difficulty
              </label>
              <div className="flex gap-2">
                {['beginner', 'intermediate', 'advanced', 'expert'].map(diff => (
                  <button
                    key={diff}
                    onClick={() => setDifficultyFilter(difficultyFilter === diff ? '' : diff)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                               hover-scale-sm ${
                      difficultyFilter === diff
                        ? 'text-white shadow-premium'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    style={
                      difficultyFilter === diff
                        ? { backgroundColor: getDifficultyColor(diff).color }
                        : {}
                    }
                  >
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Selection Counter */}
        <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="text-sm">
              <span className="font-semibold text-slate-900">
                {selectedPoses.length}
              </span>
              <span className="text-slate-600"> / {maxSelection} poses selected</span>
            </div>
            {isMaxReached && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
                Maximum reached
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500">
            {filteredPoses.length} poses available
          </div>
        </div>
      </div>

      {/* Masonry Grid */}
      {filteredPoses.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No poses found</h3>
          <p className="text-slate-600 text-sm mb-4">
            Try adjusting your filters or search query
          </p>
          <button
            onClick={() => {
              setSearchQuery('')
              onCategoryChange('')
              setDifficultyFilter('')
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="masonry-grid gap-4">
          {filteredPoses.map((pose, index) => {
            const isSelected = selectedPoses.includes(pose.id)
            const isDisabled = !isSelected && isMaxReached
            const difficultyColors = getDifficultyColor(pose.difficulty)

            return (
              <div
                key={pose.id}
                className="stagger-item group relative"
                style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
              >
                <button
                  onClick={() => !isDisabled && onTogglePose(pose.id)}
                  disabled={isDisabled}
                  className={`relative w-full rounded-lg overflow-hidden border-2 transition-all
                             ${
                               isSelected
                                 ? 'border-blue-500 ring-4 ring-blue-200 shadow-premium-lg'
                                 : isDisabled
                                 ? 'border-slate-200 opacity-50 cursor-not-allowed'
                                 : 'border-slate-200 hover:border-blue-300 hover-lift hover-glow'
                             }`}
                >
                  {/* Image with Blur-up Loading */}
                  <div className="relative aspect-[3/4] bg-slate-100">
                    {!imageLoadStates[pose.id] && (
                      <div className="absolute inset-0 skeleton-loader" />
                    )}
                    <img
                      src={pose.previewUrl}
                      alt={`${pose.category} pose`}
                      onLoad={() => handleImageLoad(pose.id)}
                      className={`w-full h-full object-cover transition-all duration-500 ${
                        imageLoadStates[pose.id] ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                      }`}
                    />

                    {/* Hover Overlay */}
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent
                                 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    />

                    {/* Featured Badge */}
                    {pose.featured && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500
                                    text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-premium">
                        <Star className="w-3 h-3 fill-current" />
                        Featured
                      </div>
                    )}

                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1.5
                                    shadow-premium animate-scaleIn">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                    )}

                    {/* Difficulty Badge */}
                    <div
                      className="absolute bottom-2 left-2 px-2 py-1 rounded-full text-xs font-semibold
                               backdrop-blur-sm border shadow-premium"
                      style={{
                        backgroundColor: difficultyColors.bg,
                        color: difficultyColors.color,
                        borderColor: difficultyColors.border,
                      }}
                    >
                      {pose.difficulty}
                    </div>

                    {/* Category Badge */}
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-white/90 backdrop-blur-sm
                                  rounded-full text-xs font-medium text-slate-700 shadow-premium">
                      {pose.category}
                    </div>
                  </div>

                  {/* Hover Info Panel */}
                  <div
                    className="absolute bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-sm
                               transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"
                  >
                    <div className="space-y-1">
                      <div className="font-medium text-sm text-slate-900">{pose.category}</div>
                      {pose.subcategory && (
                        <div className="text-xs text-slate-600">{pose.subcategory}</div>
                      )}
                      {pose.tags && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {pose.tags.split(',').slice(0, 3).map((tag, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-xs"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Quick Action Bar */}
      {selectedPoses.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fadeInUp">
          <div className="bg-white rounded-2xl shadow-premium-xl border border-slate-200 px-6 py-4
                        flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full
                            flex items-center justify-center text-white font-bold">
                {selectedPoses.length}
              </div>
              <div className="text-sm">
                <div className="font-semibold text-slate-900">Poses Selected</div>
                <div className="text-slate-600">Ready to generate</div>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <button
              onClick={() => selectedPoses.forEach(id => onTogglePose(id))}
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors px-3 py-1.5
                       hover:bg-slate-100 rounded-lg"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .masonry-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }

        @media (min-width: 640px) {
          .masonry-grid {
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          }
        }

        @media (min-width: 768px) {
          .masonry-grid {
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          }
        }

        @media (min-width: 1024px) {
          .masonry-grid {
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          }
        }
      `}</style>
    </div>
  )
}
