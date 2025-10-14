import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { LoadingSpinner } from './components/ui'
import { setupSSOListeners, extractSSOFromURL } from './lib/sso'
import { useAuthStore } from './stores/authStore'

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
const AvatarGenerator = lazy(() => import('./apps/AvatarGenerator'))
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
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/my-work" element={<MyWork />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/credits" element={<Credits />} />
        <Route path="/apps/video-mixer" element={<VideoMixer />} />
        <Route path="/apps/carousel-mix" element={<CarouselMix />} />
        <Route path="/apps/carousel-mix/:projectId" element={<CarouselMix />} />
        <Route path="/apps/looping-flow" element={<LoopingFlow />} />
        <Route path="/apps/looping-flow/:projectId" element={<LoopingFlow />} />
        <Route path="/apps/video-generator" element={<VideoGenerator />} />
        <Route path="/apps/video-generator/:projectId" element={<VideoGenerator />} />
        <Route path="/apps/poster-editor" element={<PosterEditor />} />
        <Route path="/apps/avatar-generator" element={<AvatarGenerator />} />
        <Route path="/apps/avatar-creator" element={<AvatarCreator />} />
        <Route path="/apps/avatar-creator/:projectId" element={<AvatarCreator />} />
        <Route path="/apps/pose-generator" element={<PoseGenerator />} />
      </Routes>
    </Suspense>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App