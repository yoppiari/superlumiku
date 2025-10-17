import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { generationService } from '../services'
import { handleApiError } from '../lib/errorHandler'
import UnifiedHeader from '../components/UnifiedHeader'
import GenerationCard from '../components/GenerationCard'
// UI components available if needed in future
// import { LoadingSpinner, EmptyState } from '../components/ui'
import type { GenerationItem } from '../types/generation'
import {
  Search,
  Grid3x3,
  List,
  Download,
  Trash2,
  FolderOpen
} from 'lucide-react'

type ViewMode = 'grid' | 'list'
type FilterApp = 'all' | 'video-mixer' | 'carousel-mix'
type SortOption = 'latest' | 'oldest' | 'name'

export default function MyWork() {
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const [generations, setGenerations] = useState<GenerationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filterApp, setFilterApp] = useState<FilterApp>('all')
  const [sortOption, setSortOption] = useState<SortOption>('latest')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    fetchGenerations()
  }, [isAuthenticated, navigate, filterApp, sortOption])

  const fetchGenerations = async () => {
    setLoading(true)
    try {
      const params: any = { limit: 100, sort: sortOption }
      if (filterApp !== 'all') {
        params.app = filterApp
      }

      const response = await generationService.getGenerations(params)
      setGenerations(response.generations || [])
    } catch (err) {
      handleApiError(err, 'Fetch generations')
    } finally {
      setLoading(false)
    }
  }

  const filteredGenerations = generations.filter((gen) =>
    gen.projectName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDownload = (generation: GenerationItem) => {
    if (generation.outputPaths.length === 1) {
      window.open(generation.outputPaths[0], '_blank')
    } else {
      alert('Bulk download coming soon')
    }
  }

  const handleDelete = async (generation: GenerationItem) => {
    if (!confirm(`Are you sure you want to delete "${generation.projectName}"?`)) {
      return
    }

    try {
      await generationService.deleteGeneration(generation.id, generation.appId)
      setGenerations(generations.filter((g) => g.id !== generation.id))
    } catch (error) {
      handleApiError(error, 'Delete generation')
      alert('Failed to delete generation')
    }
  }

  const handleBulkDownload = () => {
    alert('Bulk download coming soon')
  }

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return

    if (!confirm(`Delete ${selectedItems.size} items?`)) {
      return
    }

    try {
      for (const id of selectedItems) {
        const generation = generations.find((g) => g.id === id)
        if (generation) {
          await generationService.deleteGeneration(id, generation.appId)
        }
      }
      setGenerations(generations.filter((g) => !selectedItems.has(g.id)))
      setSelectedItems(new Set())
    } catch (error) {
      handleApiError(error, 'Bulk delete generations')
      alert('Failed to delete some items')
    }
  }

  const toggleSelectItem = (id: string) => {
    const newSet = new Set(selectedItems)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedItems(newSet)
  }

  // Bulk select helper (can be used for future "Select All" checkbox)
  // const selectAll = () => {
  //   if (selectedItems.size === filteredGenerations.length) {
  //     setSelectedItems(new Set())
  //   } else {
  //     setSelectedItems(new Set(filteredGenerations.map((g) => g.id)))
  //   }
  // }

  const appCounts = {
    all: generations.length,
    'video-mixer': generations.filter((g) => g.appId === 'video-mixer').length,
    'carousel-mix': generations.filter((g) => g.appId === 'carousel-mix').length,
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <UnifiedHeader
        title="My Work"
        subtitle="All your generated content in one place"
        icon={null}
        showBackButton={true}
        backPath="/dashboard"
        currentAppId={undefined}
        actions={null}
      />

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-6 md:px-10 py-8 md:py-12">
        {/* Filters & Controls */}
        <div className="mb-8 space-y-4">
          {/* Search & View Toggle */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-3">
              {selectedItems.size > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-sm font-medium text-blue-700">{selectedItems.size} selected</span>
                  <button
                    onClick={handleBulkDownload}
                    className="p-1.5 hover:bg-blue-100 rounded transition-all"
                    title="Download selected"
                  >
                    <Download className="w-4 h-4 text-blue-700" />
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="p-1.5 hover:bg-red-100 rounded transition-all"
                    title="Delete selected"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'} transition-all`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'} transition-all`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Filter Tabs & Sort */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterApp('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterApp === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                All ({appCounts.all})
              </button>
              <button
                onClick={() => setFilterApp('video-mixer')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterApp === 'video-mixer'
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Video Mixer ({appCounts['video-mixer']})
              </button>
              <button
                onClick={() => setFilterApp('carousel-mix')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterApp === 'carousel-mix'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Carousel Mix ({appCounts['carousel-mix']})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Sort:</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              >
                <option value="latest">Latest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Project Name</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Grid/List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            <p className="mt-4 text-slate-600">Loading your work...</p>
          </div>
        ) : filteredGenerations.length === 0 ? (
          <div className="text-center py-20">
            <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {searchQuery ? 'No results found' : 'No work yet'}
            </h3>
            <p className="text-slate-600 mb-6">
              {searchQuery ? 'Try adjusting your search' : 'Start creating with the apps on your dashboard'}
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all"
            >
              Go to Dashboard
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGenerations.map((generation) => (
              <div key={generation.id} className="relative">
                {generation.status === 'completed' && (
                  <input
                    type="checkbox"
                    checked={selectedItems.has(generation.id)}
                    onChange={() => toggleSelectItem(generation.id)}
                    className="absolute top-3 left-3 z-10 w-5 h-5 rounded border-2 border-white shadow-lg"
                  />
                )}
                <GenerationCard
                  generation={generation}
                  onDownload={handleDownload}
                  onDelete={handleDelete}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGenerations.map((generation) => (
              <div key={generation.id} className="flex items-center gap-3">
                {generation.status === 'completed' && (
                  <input
                    type="checkbox"
                    checked={selectedItems.has(generation.id)}
                    onChange={() => toggleSelectItem(generation.id)}
                    className="w-5 h-5 rounded"
                  />
                )}
                <div className="flex-1">
                  <GenerationCard
                    generation={generation}
                    onDownload={handleDownload}
                    onDelete={handleDelete}
                    compact
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
