import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Credits from './pages/Credits'
import VideoMixer from './apps/VideoMixer'
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
      <Route path="/profile" element={<Profile />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/credits" element={<Credits />} />
      <Route path="/apps/video-mixer" element={<VideoMixer />} />
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