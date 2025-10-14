import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { LoadingSpinner } from './components/ui'
import { setupSSOListeners, extractSSOFromURL } from './lib/sso'
import { useAuthStore } from './stores/authStore'
import { ErrorBoundary } from './components/ErrorBoundary'

// Eager-load critical pages
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

// Lazy-load non-critical pages and apps for better performance
const Profile = lazy(() => import('./pages/Profile'))
const Settings = lazy(() => import('./pages/Settings'))
const Credits = lazy(() => import('./pages/Credits'))
const MyWork = lazy(() => import('./pages/MyWork'))
const VideoMixer = lazy(() => import('./apps/VideoMixer'))
const CarouselMix = lazy(() => import('./apps/CarouselMix'))
const LoopingFlow = lazy(() => import('./apps/LoopingFlow'))
const VideoGenerator = lazy(() => import('./apps/VideoGenerator'))
const PosterEditor = lazy(() => import('./apps/PosterEditor').then((m) => ({ default: m.PosterEditor })))
const AvatarCreator = lazy(() => import('./apps/AvatarCreator'))
const PoseGenerator = lazy(() => import('./apps/PoseGenerator'))

function AppContent() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  useEffect(() => {
    // Extract SSO token from URL if present
    const ssoData = extractSSOFromURL()
    if (ssoData) {
      console.log('SSO login detected:', ssoData.user.email)
    }

    // Setup SSO listeners for cross-tab logout
    setupSSOListeners(() => {
      logout()
      navigate('/')
    })
  }, [logout, navigate])

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <LoadingSpinner size="lg" text="Loading..." />
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ErrorBoundary level="page">
              <Dashboard />
            </ErrorBoundary>
          }
        />
        <Route
          path="/my-work"
          element={
            <ErrorBoundary level="page">
              <MyWork />
            </ErrorBoundary>
          }
        />
        <Route
          path="/profile"
          element={
            <ErrorBoundary level="page">
              <Profile />
            </ErrorBoundary>
          }
        />
        <Route
          path="/settings"
          element={
            <ErrorBoundary level="page">
              <Settings />
            </ErrorBoundary>
          }
        />
        <Route
          path="/credits"
          element={
            <ErrorBoundary level="page">
              <Credits />
            </ErrorBoundary>
          }
        />
        <Route
          path="/apps/video-mixer"
          element={
            <ErrorBoundary level="page">
              <VideoMixer />
            </ErrorBoundary>
          }
        />
        <Route
          path="/apps/carousel-mix"
          element={
            <ErrorBoundary level="page">
              <CarouselMix />
            </ErrorBoundary>
          }
        />
        <Route
          path="/apps/carousel-mix/:projectId"
          element={
            <ErrorBoundary level="page">
              <CarouselMix />
            </ErrorBoundary>
          }
        />
        <Route
          path="/apps/looping-flow"
          element={
            <ErrorBoundary level="page">
              <LoopingFlow />
            </ErrorBoundary>
          }
        />
        <Route
          path="/apps/looping-flow/:projectId"
          element={
            <ErrorBoundary level="page">
              <LoopingFlow />
            </ErrorBoundary>
          }
        />
        <Route
          path="/apps/video-generator"
          element={
            <ErrorBoundary level="page">
              <VideoGenerator />
            </ErrorBoundary>
          }
        />
        <Route
          path="/apps/video-generator/:projectId"
          element={
            <ErrorBoundary level="page">
              <VideoGenerator />
            </ErrorBoundary>
          }
        />
        <Route
          path="/apps/poster-editor"
          element={
            <ErrorBoundary level="page">
              <PosterEditor />
            </ErrorBoundary>
          }
        />
        <Route
          path="/apps/avatar-creator"
          element={
            <ErrorBoundary level="page">
              <AvatarCreator />
            </ErrorBoundary>
          }
        />
        <Route
          path="/apps/avatar-creator/:projectId"
          element={
            <ErrorBoundary level="page">
              <AvatarCreator />
            </ErrorBoundary>
          }
        />
        <Route
          path="/apps/pose-generator"
          element={
            <ErrorBoundary level="page">
              <PoseGenerator />
            </ErrorBoundary>
          }
        />
      </Routes>
    </Suspense>
  )
}

function App() {
  return (
    <ErrorBoundary level="app">
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App