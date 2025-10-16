import { Search, X, Filter } from 'lucide-react'
import { useState } from 'react'
import type { PoseCategory, PoseLibraryFilters } from '../types'

interface PoseFiltersProps {
  categories: PoseCategory[]
  filters: PoseLibraryFilters
  onFilterChange: (filters: Partial<PoseLibraryFilters>) => void
  onClearFilters: () => void
}

export default function PoseFilters({
  categories,
  filters,
  onFilterChange,
  onClearFilters,
}: PoseFiltersProps) {
  const [searchQuery, setSearchQuery] = useState(filters.search || '')
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    // Debounce search
    const timer = setTimeout(() => {
      onFilterChange({ search: value || undefined })
    }, 500)
    return () => clearTimeout(timer)
  }

  const hasActiveFilters =
    filters.category ||
    filters.difficulty ||
    filters.genderSuitability ||
    filters.search ||
    filters.featured

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search poses by name or tags..."
          className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('')
              onFilterChange({ search: undefined })
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Mobile Filter Toggle */}
      <button
        onClick={() => setShowMobileFilters(!showMobileFilters)}
        className="md:hidden w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-50"
      >
        <Filter className="w-4 h-4" />
        Filters
        {hasActiveFilters && (
          <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
            Active
          </span>
        )}
      </button>

      {/* Filters Container */}
      <div className={`space-y-4 ${showMobileFilters ? 'block' : 'hidden md:block'}`}>
        {/* Quick Actions */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-900">Filters</h3>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Featured Toggle */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.featured || false}
              onChange={(e) => onFilterChange({ featured: e.target.checked || undefined })}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">Featured poses only</span>
          </label>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
          <select
            value={filters.category || ''}
            onChange={(e) => onFilterChange({ category: e.target.value || undefined })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.displayName} ({cat.poseCount})
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Difficulty</label>
          <div className="space-y-2">
            {['beginner', 'intermediate', 'advanced'].map((level) => (
              <label key={level} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="difficulty"
                  checked={filters.difficulty === level}
                  onChange={() =>
                    onFilterChange({
                      difficulty: level as 'beginner' | 'intermediate' | 'advanced',
                    })
                  }
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700 capitalize">{level}</span>
              </label>
            ))}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="difficulty"
                checked={!filters.difficulty}
                onChange={() => onFilterChange({ difficulty: undefined })}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">All Levels</span>
            </label>
          </div>
        </div>

        {/* Gender Suitability Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
          <div className="space-y-2">
            {['male', 'female', 'unisex'].map((gender) => (
              <label key={gender} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  checked={filters.genderSuitability === gender}
                  onChange={() =>
                    onFilterChange({
                      genderSuitability: gender as 'male' | 'female' | 'unisex',
                    })
                  }
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700 capitalize">{gender}</span>
              </label>
            ))}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="gender"
                checked={!filters.genderSuitability}
                onChange={() => onFilterChange({ genderSuitability: undefined })}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">All</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
