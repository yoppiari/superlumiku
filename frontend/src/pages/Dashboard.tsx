import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useCredits } from '../hooks/useCredits'
import { dashboardService, generationService } from '../services'
import { handleApiError } from '../lib/errorHandler'
import UnifiedHeader from '../components/UnifiedHeader'
import GenerationCard from '../components/GenerationCard'
// UI components available if needed in future
// import { LoadingSpinner, EmptyState } from '../components/ui'
import type { GenerationItem } from '../types/generation'
import {
  FileText,
  BarChart3,
  Calendar,
  MessageSquare,
  FolderOpen,
  ArrowDown,
  ArrowUp,
  Video,
  Target,
  Briefcase,
  FolderKanban,
  LogIn,
  Film,
  Layers,
  UserCircle,
  Coins,
  Eraser
} from 'lucide-react'

interface AppData {
  appId: string
  name: string
  description: string
  icon: string
  color: string
  order: number
  beta: boolean
  comingSoon: boolean
}

const iconMap: Record<string, any> = {
  'file-text': FileText,
  'bar-chart-3': BarChart3,
  calendar: Calendar,
  'message-square': MessageSquare,
  'folder-open': FolderOpen,
  video: Video,
  film: Film,
  layers: Layers,
  'user-circle': UserCircle,
  eraser: Eraser,
}

interface DashboardStats {
  totalSpending: number
  totalWorks: number
  totalProjects: number
  lastLogin: string
}

/**
 * Safe number formatter - handles undefined/null values gracefully
 */
const formatNumber = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return '0'
  }
  return value.toLocaleString()
}

export default function Dashboard() {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [apps, setApps] = useState<AppData[]>([])
  const [loadingApps, setLoadingApps] = useState(true)
  const [recentGenerations, setRecentGenerations] = useState<GenerationItem[]>([])
  const [loadingGenerations, setLoadingGenerations] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalSpending: 0,
    totalWorks: 0,
    totalProjects: 0,
    lastLogin: new Date().toISOString(),
  })
  const [loadingStats, setLoadingStats] = useState(true)

  // Use centralized credit balance hook - no need for local state
  const { balance: creditBalance } = useCredits()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    // Verify token exists before making API calls
    const token = localStorage.getItem('token')
    if (!token) {
      console.warn('[Dashboard] No token found, redirecting to login')
      navigate('/login')
      return
    }

    const fetchDashboardData = async () => {
      // Credit balance is now handled by useCredits hook - no need to fetch here

      try {
        // Fetch apps
        const appsData = await dashboardService.getApps()
        setApps(appsData.apps || [])
      } catch (err) {
        const error = err as any
        if (error?.response?.status !== 401) {
          handleApiError(err, 'Fetch apps')
        }
      } finally {
        setLoadingApps(false)
      }

      try {
        // Fetch recent generations
        const generationsData = await generationService.getRecentGenerations(5)
        setRecentGenerations(generationsData.generations || [])
      } catch (err) {
        const error = err as any
        if (error?.response?.status !== 401) {
          handleApiError(err, 'Fetch recent generations')
        }
      } finally {
        setLoadingGenerations(false)
      }

      try {
        // Fetch dashboard stats
        const statsData = await dashboardService.getStats()
        setStats({
          totalSpending: statsData?.totalSpending ?? 0,
          totalWorks: statsData?.totalWorks ?? 0,
          totalProjects: statsData?.totalProjects ?? 0,
          lastLogin: statsData?.lastLogin ?? new Date().toISOString(),
        })
      } catch (err) {
        const error = err as any
        if (error?.response?.status !== 401) {
          handleApiError(err, 'Fetch dashboard stats')
        }
        // Keep default values on error
      } finally {
        setLoadingStats(false)
      }
    }

    fetchDashboardData()
  }, [isAuthenticated, navigate])

  const formatLastLogin = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const dashboardStats = [
    {
      icon: Coins,
      value: loadingStats ? '...' : formatNumber(stats.totalSpending),
      label: 'Spending (This Month)',
      color: 'bg-purple-50 text-purple-700',
      suffix: ' Credits'
    },
    {
      icon: Briefcase,
      value: loadingStats ? '...' : `${stats.totalWorks ?? 0}`,
      label: 'Total Works (This Month)',
      color: 'bg-blue-50 text-blue-700',
      suffix: ''
    },
    {
      icon: FolderKanban,
      value: loadingStats ? '...' : `${stats.totalProjects ?? 0}`,
      label: 'Total Projects (This Month)',
      color: 'bg-green-50 text-green-700',
      suffix: ''
    },
    {
      icon: LogIn,
      value: loadingStats ? '...' : formatLastLogin(stats.lastLogin ?? new Date().toISOString()),
      label: 'Last Login',
      color: 'bg-orange-50 text-orange-700',
      suffix: ''
    },
  ]

  const handleAppClick = (appId: string) => {
    navigate(`/apps/${appId}`)
  }

  const handleDownload = (generation: GenerationItem) => {
    // Download first file or create ZIP for multiple files
    if (generation.outputPaths.length === 1) {
      window.open(generation.outputPaths[0], '_blank')
    } else {
      // TODO: Implement bulk download
      alert('Bulk download coming soon')
    }
  }

  const handleNavigateToMyWork = () => {
    navigate('/my-work')
  }

  // Early return: Don't render dashboard if not authenticated
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <UnifiedHeader
        title="Central Hub Dashboard"
        subtitle="Selamat datang kembali! Kelola semua tools dan aplikasi Anda di satu tempat"
        showBackButton={false}
        currentAppId={undefined}
        actions={null}
      />

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-6 md:px-10 py-8 md:py-12">
        {/* Quick Stats */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10 md:mb-14">
          {dashboardStats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <div key={i} className="bg-white p-5 md:p-7 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-soft transition-all">
                <div className="flex items-center justify-between mb-5">
                  <div className={`w-11 h-11 rounded-xl ${stat.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl md:text-[2rem] font-semibold text-slate-900 mb-1 tracking-tighter">
                  {stat.value}
                  {stat.suffix && !loadingStats && <span className="text-sm text-slate-500">{stat.suffix}</span>}
                </div>
                <div className="text-sm text-slate-600">{stat.label}</div>
              </div>
            )
          })}
        </section>

        {/* Apps & Tools */}
        <section className="mb-10 md:mb-14">
          <div className="flex items-center justify-between mb-7">
            <h2 className="text-xl md:text-[1.375rem] font-semibold text-slate-900 tracking-tighter">Apps & Tools</h2>
            <button className="px-5 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all">
              View All
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {loadingApps ? (
              <div className="col-span-full text-center py-12 text-slate-600">
                Loading apps...
              </div>
            ) : apps.length === 0 ? (
              <div className="col-span-full text-center py-12 text-slate-600">
                No apps available yet
              </div>
            ) : (
              apps.map((app) => {
                const Icon = iconMap[app.icon] || Target
                const colorClasses = {
                  blue: 'bg-blue-50 text-blue-700',
                  green: 'bg-green-50 text-green-700',
                  purple: 'bg-purple-50 text-purple-700',
                  orange: 'bg-orange-50 text-orange-700',
                  red: 'bg-red-50 text-red-700',
                }[app.color] || 'bg-slate-50 text-slate-700'

                return (
                  <div
                    key={app.appId}
                    onClick={() => !app.comingSoon && handleAppClick(app.appId)}
                    className={`bg-white p-6 md:p-8 rounded-xl border border-slate-200 hover:border-slate-700 hover:shadow-soft-md transition-all ${
                      app.comingSoon ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                    } text-center relative`}
                  >
                    {app.beta && (
                      <span className="absolute top-3 right-3 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                        Beta
                      </span>
                    )}
                    {app.comingSoon && (
                      <span className="absolute top-3 right-3 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                        Coming Soon
                      </span>
                    )}
                    <div className={`w-16 h-16 mx-auto mb-5 rounded-xl ${colorClasses} flex items-center justify-center`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-slate-900 mb-2">{app.name}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed hidden md:block">{app.description}</p>
                  </div>
                )
              })
            )}
          </div>
        </section>

        {/* Recent Work */}
        <section className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 mb-10 md:mb-14">
          <div className="flex items-center justify-between mb-7">
            <h2 className="text-xl md:text-[1.375rem] font-semibold text-slate-900 tracking-tighter">Recent Work</h2>
            <button
              onClick={handleNavigateToMyWork}
              className="px-5 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {loadingGenerations ? (
              <div className="text-center py-8 text-slate-600">
                Loading recent work...
              </div>
            ) : recentGenerations.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 mb-1">No recent work yet</p>
                <p className="text-sm text-slate-500">Start creating with the apps above</p>
              </div>
            ) : (
              recentGenerations.map((generation) => (
                <GenerationCard
                  key={generation.id}
                  generation={generation}
                  onDownload={handleDownload}
                  compact
                />
              ))
            )}
          </div>
        </section>

        {/* Billing */}
        <section className="bg-white p-6 md:p-8 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-[1.375rem] font-semibold text-slate-900 tracking-tighter">Billing & Payments</h2>
            <button className="px-5 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all">
              Manage
            </button>
          </div>

          {/* Card */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 md:p-8 rounded-xl mb-8 md:mb-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48"></div>
            <div className="relative">
              <div className="w-12 h-9 bg-gradient-to-br from-slate-400 to-slate-500 rounded-md mb-6 md:mb-8"></div>
              <div className="text-lg md:text-[1.125rem] tracking-[0.125em] mb-6 md:mb-7 font-medium">•••• •••• •••• 4532</div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-xs opacity-70 mb-1 uppercase tracking-wide">Card Holder</div>
                  <div className="text-sm md:text-[0.9375rem] font-medium">{user?.name || 'John Doe'}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs opacity-70 mb-1 uppercase tracking-wide">Expires</div>
                  <div className="text-sm md:text-[0.9375rem] font-medium">12/25</div>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions */}
          <h3 className="text-lg md:text-[1.25rem] font-semibold text-slate-900 mb-6 tracking-tighter">Recent Transactions</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 md:p-[1.125rem] bg-slate-50 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                  <ArrowDown className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-900 mb-0.5">Credit Purchase</h4>
                  <p className="text-xs md:text-[0.8125rem] text-slate-600">Jan 15, 2024</p>
                </div>
              </div>
              <div className="text-sm md:text-[0.9375rem] font-semibold text-green-600">+500 Credits</div>
            </div>
            <div className="flex items-center justify-between p-4 md:p-[1.125rem] bg-slate-50 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                  <ArrowUp className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-900 mb-0.5">Project Usage</h4>
                  <p className="text-xs md:text-[0.8125rem] text-slate-600">Jan 14, 2024</p>
                </div>
              </div>
              <div className="text-sm md:text-[0.9375rem] font-semibold text-red-600">-150 Credits</div>
            </div>
            <div className="flex items-center justify-between p-4 md:p-[1.125rem] bg-slate-50 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                  <ArrowDown className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-900 mb-0.5">Monthly Bonus</h4>
                  <p className="text-xs md:text-[0.8125rem] text-slate-600">Jan 1, 2024</p>
                </div>
              </div>
              <div className="text-sm md:text-[0.9375rem] font-semibold text-green-600">+100 Credits</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}