import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Credits from './pages/Credits'
import MyWork from './pages/MyWork'
import VideoMixer from './apps/VideoMixer'
import CarouselMix from './apps/CarouselMix'
import LoopingFlow from './apps/LoopingFlow'
import VideoGenerator from './apps/VideoGenerator'
import { PosterEditor } from './apps/PosterEditor'
import AvatarGenerator from './apps/AvatarGenerator'
import AvatarCreator from './apps/AvatarCreator'
import PoseGenerator from './apps/PoseGenerator'
import { setupSSOListeners, extractSSOFromURL } from './lib/sso'
import { useAuthStore } from './stores/authStore'

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
      <Route path="/apps/pose-generator" element={<PoseGenerator />} />
    </Routes>
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