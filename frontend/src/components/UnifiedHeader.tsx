import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeft,
  Home,
  Grid3x3,
  Coins,
  ChevronDown,
  Sparkles
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import ProfileDropdown from './ProfileDropdown'
import { creditsService } from '../services/creditsService'

interface App {
  id: string
  name: string
  icon: string
  color: string
  route: string
}

interface UnifiedHeaderProps {
  /** App title to display */
  title: string
  /** Optional subtitle */
  subtitle?: string
  /** App icon component */
  icon?: React.ReactNode
  /** Icon background color class */
  iconColor?: string
  /** Show back button to previous page */
  showBackButton?: boolean
  /** Custom back path (defaults to dashboard) */
  backPath?: string
  /** Current app ID for app switcher highlighting */
  currentAppId?: string
  /** Additional actions to show in header */
  actions?: React.ReactNode
}

const AVAILABLE_APPS: App[] = [
  { id: 'avatar-creator', name: 'Avatar Creator', icon: 'UserCircle', color: 'purple', route: '/apps/avatar-creator' },
  { id: 'pose-generator', name: 'Pose Generator', icon: 'Sparkles', color: 'indigo', route: '/apps/pose-generator' },
  { id: 'carousel-mix', name: 'Carousel Mix', icon: 'Layers', color: 'blue', route: '/apps/carousel-mix' },
  { id: 'video-mixer', name: 'Video Mixer', icon: 'Video', color: 'blue', route: '/apps/video-mixer' },
  { id: 'poster-editor', name: 'Poster Editor', icon: 'Image', color: 'green', route: '/apps/poster-editor' },
]

const UnifiedHeader: React.FC<UnifiedHeaderProps> = ({
  title,
  subtitle,
  icon,
  iconColor = 'bg-blue-50 text-blue-700',
  showBackButton = true,
  backPath,
  currentAppId,
  actions,
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  const [creditBalance, setCreditBalance] = useState<number>(user?.creditBalance || 0)
  const [isLoadingCredits, setIsLoadingCredits] = useState(true)
  const [showAppSwitcher, setShowAppSwitcher] = useState(false)
  const appSwitcherRef = useRef<HTMLDivElement>(null)

  // Fetch credit balance on mount and when user changes
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        setIsLoadingCredits(true)
        const balanceData = await creditsService.getBalance()

        // Log for production debugging
        console.log('[UnifiedHeader] Credit balance fetched:', balanceData)

        setCreditBalance(balanceData?.balance ?? 0)
      } catch (error) {
        console.error('[UnifiedHeader] Failed to fetch credit balance:', error)

        // Fallback to user object balance if API fails
        if (user?.creditBalance !== undefined) {
          console.log('[UnifiedHeader] Using fallback balance from user object:', user.creditBalance)
          setCreditBalance(user.creditBalance)
        }
      } finally {
        setIsLoadingCredits(false)
      }
    }
    fetchBalance()
  }, [user?.creditBalance])

  // Close app switcher on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (appSwitcherRef.current && !appSwitcherRef.current.contains(event.target as Node)) {
        setShowAppSwitcher(false)
      }
    }

    if (showAppSwitcher) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAppSwitcher])

  const handleBack = () => {
    if (backPath) {
      navigate(backPath)
    } else {
      navigate('/dashboard')
    }
  }

  const handleDashboardClick = () => {
    navigate('/dashboard')
  }

  const handleAppSwitch = (route: string) => {
    navigate(route)
    setShowAppSwitcher(false)
  }

  const handleCreditsClick = () => {
    navigate('/credits')
  }

  const currentApp = AVAILABLE_APPS.find(app => app.id === currentAppId)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="max-w-[1400px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">

          {/* Left Section: Navigation & Title */}
          <div className="flex items-center gap-4 flex-1 min-w-0">

            {/* Back Button */}
            {showBackButton && (
              <button
                onClick={handleBack}
                className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
            )}

            {/* Dashboard Home Button */}
            <button
              onClick={handleDashboardClick}
              className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
              aria-label="Go to dashboard"
              title="Dashboard"
            >
              <Home className="w-5 h-5 text-slate-600" />
            </button>

            {/* App Icon & Title */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {icon && (
                <div className={`flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0 ${iconColor}`}>
                  {icon}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-slate-900 truncate">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-slate-600 truncate">{subtitle}</p>
                )}
              </div>
            </div>

            {/* App Switcher */}
            <div className="relative hidden md:block" ref={appSwitcherRef}>
              <button
                onClick={() => setShowAppSwitcher(!showAppSwitcher)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200"
                aria-label="Switch app"
              >
                <Grid3x3 className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Apps</span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showAppSwitcher ? 'rotate-180' : ''}`} />
              </button>

              {/* App Switcher Dropdown */}
              {showAppSwitcher && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                  <div className="px-3 py-2 border-b border-slate-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Switch App</p>
                  </div>

                  <div className="py-1">
                    {AVAILABLE_APPS.map((app) => {
                      const isActive = app.id === currentAppId
                      const colorClasses = {
                        purple: 'bg-purple-50 text-purple-700',
                        indigo: 'bg-indigo-50 text-indigo-700',
                        blue: 'bg-blue-50 text-blue-700',
                        green: 'bg-green-50 text-green-700',
                      }[app.color] || 'bg-slate-50 text-slate-700'

                      return (
                        <button
                          key={app.id}
                          onClick={() => handleAppSwitch(app.route)}
                          className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 transition-colors ${
                            isActive ? 'bg-slate-100' : ''
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClasses} flex-shrink-0`}>
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-slate-900">{app.name}</p>
                          </div>
                          {isActive && (
                            <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                          )}
                        </button>
                      )
                    })}
                  </div>

                  <div className="border-t border-slate-200 mt-1 pt-1">
                    <button
                      onClick={handleDashboardClick}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 transition-colors"
                    >
                      <Home className="w-4 h-4 text-slate-600" />
                      <span className="text-sm font-medium text-slate-700">Back to Dashboard</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Section: Actions, Credits & Profile */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Custom Actions */}
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}

            {/* Credits Display */}
            <button
              onClick={handleCreditsClick}
              className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-100 transition-all cursor-pointer group"
              title="Buy credits"
            >
              <Coins className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-xs text-slate-500">Credits</span>
                {isLoadingCredits ? (
                  <span className="text-sm font-bold text-slate-400">...</span>
                ) : (
                  <span className="text-sm font-bold text-slate-900">{creditBalance.toLocaleString()}</span>
                )}
              </div>
              {isLoadingCredits ? (
                <span className="sm:hidden text-sm font-bold text-slate-400">...</span>
              ) : (
                <span className="sm:hidden text-sm font-bold text-slate-900">{creditBalance.toLocaleString()}</span>
              )}
            </button>

            {/* Profile Dropdown */}
            <ProfileDropdown />
          </div>
        </div>
      </div>
    </header>
  )
}

export default UnifiedHeader
