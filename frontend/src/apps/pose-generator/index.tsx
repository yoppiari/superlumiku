import { useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import ProfileDropdown from '../../components/ProfileDropdown'

// P1-2 FIX: Error Boundary for graceful error handling
import PoseGeneratorErrorBoundary from './components/PoseGeneratorErrorBoundary'

// Pages
import DashboardPage from './pages/DashboardPage'
import LibraryPage from './pages/LibraryPage'
import ProjectsPage from './pages/ProjectsPage'
import GeneratePage from './pages/GeneratePage'

/**
 * Pose Generator App - Main Component
 *
 * Features:
 * - Browse pose library with filters
 * - Create and manage projects
 * - Generate poses using gallery or text mode
 * - Real-time progress updates via WebSocket
 * - Download results in multiple formats
 *
 * P1-2: Wrapped with Error Boundary for graceful error handling
 */
function PoseGeneratorIndex() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  if (!isAuthenticated) {
    return null
  }

  const isRootPath = location.pathname === '/apps/pose-generator' || location.pathname === '/apps/pose-generator/'

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!isRootPath && (
                <button
                  onClick={() => navigate('/apps/pose-generator')}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Pose Generator</h1>
                  <p className="text-sm text-slate-600">AI-Powered Professional Poses</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Navigation */}
              <nav className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => navigate('/apps/pose-generator')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isRootPath
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigate('/apps/pose-generator/library')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname.includes('/library')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Library
                </button>
                <button
                  onClick={() => navigate('/apps/pose-generator/projects')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname.includes('/projects')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Projects
                </button>
              </nav>

              {/* Credit Balance */}
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-sm font-medium text-slate-900">
                  {user?.creditBalance?.toLocaleString() || 0} Credits
                </span>
              </div>

              {/* Profile */}
              <ProfileDropdown />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-6 py-8">
        <Routes>
          <Route index element={<DashboardPage />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="generate" element={<GeneratePage />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-12">
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Pose Generator v1.0</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="hover:text-slate-900 transition-colors"
              >
                Back to Dashboard
              </button>
              <a href="#" className="hover:text-slate-900 transition-colors">
                Help & Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

/**
 * P1-2: Export wrapped component with Error Boundary
 */
export default function PoseGeneratorApp() {
  return (
    <PoseGeneratorErrorBoundary>
      <PoseGeneratorIndex />
    </PoseGeneratorErrorBoundary>
  )
}
