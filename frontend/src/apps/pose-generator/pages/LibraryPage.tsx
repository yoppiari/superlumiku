import { useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { usePoseLibraryStore } from '../store/pose-library.store'
import PoseCard from '../components/PoseCard'
import PoseFilters from '../components/PoseFilters'
import { LoadingSpinner, EmptyState } from '../../../components/ui'

export default function LibraryPage() {
  const {
    poses,
    categories,
    selectedPoses,
    currentPage,
    totalPages,
    hasMore,
    isLoading,
    filters,
    fetchPoses,
    fetchCategories,
    setFilters,
    clearFilters,
    togglePose,
    setPage,
  } = usePoseLibraryStore()

  useEffect(() => {
    fetchPoses()
    fetchCategories()
  }, [])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar Filters */}
      <div className="lg:col-span-1">
        <div className="sticky top-24">
          <PoseFilters
            categories={categories}
            filters={filters}
            onFilterChange={setFilters}
            onClearFilters={clearFilters}
          />

          {/* Selected Count */}
          {selectedPoses.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                {selectedPoses.length} pose{selectedPoses.length !== 1 ? 's' : ''} selected
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Ready to use in your next generation
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Poses Grid */}
      <div className="lg:col-span-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <LoadingSpinner size="lg" text="Loading poses..." />
          </div>
        ) : poses.length === 0 ? (
          <EmptyState
            title="No poses found"
            description="Try adjusting your filters or search query"
            action={{
              label: 'Clear Filters',
              onClick: clearFilters,
            }}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
              {poses.map((pose) => (
                <PoseCard
                  key={pose.id}
                  pose={pose}
                  isSelected={selectedPoses.includes(pose.id)}
                  onSelect={togglePose}
                  showDetails
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <span className="text-sm text-slate-600">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setPage(currentPage + 1)}
                  disabled={!hasMore}
                  className="p-2 rounded-lg border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
