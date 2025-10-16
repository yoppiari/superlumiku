import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, FolderOpen, Image, TrendingUp, Plus, ArrowRight } from 'lucide-react'
import { useProjectStore } from '../store/project.store'
import { poseGeneratorApi } from '../utils/api'
import type { PoseStatsResponse } from '../types'
import ProjectCard from '../components/ProjectCard'
import { LoadingSpinner } from '../../../components/ui'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { projects, isLoading, fetchProjects, deleteProject, updateProject } = useProjectStore()
  const [stats, setStats] = useState<PoseStatsResponse | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    fetchProjects({ limit: 6, status: 'active' })
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await poseGeneratorApi.getUserStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  const handleArchiveProject = async (id: string) => {
    try {
      await updateProject(id, { status: 'archived' })
    } catch (error) {
      console.error('Failed to archive project:', error)
    }
  }

  const handleDeleteProject = async (id: string) => {
    try {
      await deleteProject(id)
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {loadingStats ? '...' : stats?.totalPosesGenerated || 0}
            </div>
          </div>
          <p className="text-sm text-slate-600">Total Poses Generated</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {loadingStats ? '...' : stats?.totalProjects || 0}
            </div>
          </div>
          <p className="text-sm text-slate-600">Total Projects</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {loadingStats ? '...' : stats?.recentGenerations || 0}
            </div>
          </div>
          <p className="text-sm text-slate-600">Last 7 Days</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Image className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {loadingStats ? '...' : stats?.creditUsage.last30Days || 0}
            </div>
          </div>
          <p className="text-sm text-slate-600">Credits Used (30d)</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/apps/pose-generator/library')}
          className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Image className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Browse Pose Library</h3>
          <p className="text-sm text-blue-100">Explore 1000+ professional poses</p>
        </button>

        <button
          onClick={() => navigate('/apps/pose-generator/projects?action=create')}
          className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Plus className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Create New Project</h3>
          <p className="text-sm text-purple-100">Start generating poses from your avatar</p>
        </button>

        <button
          onClick={() => navigate('/apps/pose-generator/projects')}
          className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <FolderOpen className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="text-lg font-semibold mb-1">My Projects</h3>
          <p className="text-sm text-green-100">View and manage all your projects</p>
        </button>
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Recent Projects</h2>
          <button
            onClick={() => navigate('/apps/pose-generator/projects')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">No projects yet</p>
            <button
              onClick={() => navigate('/apps/pose-generator/projects?action=create')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.slice(0, 6).map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => navigate(`/apps/pose-generator/generate?project=${project.id}`)}
                onArchive={handleArchiveProject}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        )}
      </div>

      {/* Top Used Poses */}
      {stats && stats.topUsedPoses.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Your Popular Poses</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {stats.topUsedPoses.map((pose) => (
              <div key={pose.poseId} className="group">
                <div className="aspect-square rounded-lg overflow-hidden border border-slate-200 mb-2">
                  <img
                    src={pose.previewUrl}
                    alt={pose.poseName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <p className="text-sm text-slate-900 font-medium truncate">{pose.poseName}</p>
                <p className="text-xs text-slate-500">{pose.usageCount} uses</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
