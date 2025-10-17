import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import api from '../lib/api'
import {
  ArrowLeft,
  Bell,
  Moon,
  Sun,
  Globe,
  Shield,
  Eye,
  Mail,
  Smartphone,
  Check,
  Save,
  Monitor,
  Tablet,
  Trash2,
  AlertCircle
} from 'lucide-react'

interface Device {
  id: string
  deviceId: string
  deviceName: string
  deviceType: string
  browser: string | null
  os: string | null
  ipAddress: string | null
  lastActive: string
  createdAt: string
}

export default function Settings() {
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [devices, setDevices] = useState<Device[]>([])
  const [loadingDevices, setLoadingDevices] = useState(false)

  // Settings state
  const [settings, setSettings] = useState({
    // Notifications
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: false,
    projectUpdates: true,
    creditAlerts: true,

    // Appearance
    theme: 'light', // 'light', 'dark', 'system'
    language: 'id', // 'id', 'en'

    // Privacy
    profileVisibility: 'public', // 'public', 'private'
    showEmail: false,
    analyticsTracking: true,
  })

  const loadDevices = async () => {
    try {
      setLoadingDevices(true)
      const response = await api.get('/api/devices')
      setDevices(response.data.devices)
    } catch (error) {
      console.error('Failed to load devices:', error)
    } finally {
      setLoadingDevices(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    // Load settings from localStorage
    const savedSettings = localStorage.getItem('user-settings')
    if (savedSettings) {
      setSettings((prev) => ({ ...prev, ...JSON.parse(savedSettings) }))
    }

    // Load devices
    loadDevices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, navigate])

  const handleRemoveDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to remove this device? You will need to log in again on that device.')) {
      return
    }

    try {
      await api.delete(`/api/devices/${deviceId}`)
      await loadDevices()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to remove device')
    }
  }

  const handleToggle = (key: string) => {
    setSettings({
      ...settings,
      [key]: !settings[key as keyof typeof settings],
    })
    setSuccess(false)
  }

  const handleSelect = (key: string, value: string) => {
    setSettings({
      ...settings,
      [key]: value,
    })
    setSuccess(false)
  }

  const handleSave = () => {
    setLoading(true)

    // Save to localStorage (in production, save to backend)
    localStorage.setItem('user-settings', JSON.stringify(settings))

    setTimeout(() => {
      setLoading(false)
      setSuccess(true)

      // Apply theme
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }, 500)
  }

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="w-5 h-5 text-slate-600" />
      case 'tablet':
        return <Tablet className="w-5 h-5 text-slate-600" />
      default:
        return <Monitor className="w-5 h-5 text-slate-600" />
    }
  }

  const formatLastActive = (date: string) => {
    const now = new Date()
    const lastActive = new Date(date)
    const diff = now.getTime() - lastActive.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 5) return 'Active now'
    if (minutes < 60) return `${minutes} minutes ago`
    if (hours < 24) return `${hours} hours ago`
    return `${days} days ago`
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </button>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tighter">
            Settings
          </h1>
          <p className="text-slate-600 mt-1">Manage your preferences and configurations</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-800">
            <Check className="w-5 h-5" />
            <span className="font-medium">Settings saved successfully!</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Notifications */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
                <p className="text-sm text-slate-600">Manage how you receive updates</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Email Notifications */}
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="font-medium text-slate-900">Email Notifications</div>
                    <div className="text-sm text-slate-600">Receive updates via email</div>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('emailNotifications')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.emailNotifications ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Push Notifications */}
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="font-medium text-slate-900">Push Notifications</div>
                    <div className="text-sm text-slate-600">Get notified on your device</div>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('pushNotifications')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.pushNotifications ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Project Updates */}
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div>
                  <div className="font-medium text-slate-900">Project Updates</div>
                  <div className="text-sm text-slate-600">Notify when projects are completed</div>
                </div>
                <button
                  onClick={() => handleToggle('projectUpdates')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.projectUpdates ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.projectUpdates ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Credit Alerts */}
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div>
                  <div className="font-medium text-slate-900">Credit Alerts</div>
                  <div className="text-sm text-slate-600">Alert when credits are low</div>
                </div>
                <button
                  onClick={() => handleToggle('creditAlerts')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.creditAlerts ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.creditAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Marketing Emails */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium text-slate-900">Marketing Emails</div>
                  <div className="text-sm text-slate-600">Receive promotional content</div>
                </div>
                <button
                  onClick={() => handleToggle('marketingEmails')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.marketingEmails ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.marketingEmails ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Moon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Appearance</h2>
                <p className="text-sm text-slate-600">Customize how Lumiku looks</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Theme Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleSelect('theme', 'light')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      settings.theme === 'light'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Sun className="w-6 h-6 mx-auto mb-2 text-slate-700" />
                    <div className="text-sm font-medium text-slate-900">Light</div>
                  </button>
                  <button
                    onClick={() => handleSelect('theme', 'dark')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      settings.theme === 'dark'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Moon className="w-6 h-6 mx-auto mb-2 text-slate-700" />
                    <div className="text-sm font-medium text-slate-900">Dark</div>
                  </button>
                  <button
                    onClick={() => handleSelect('theme', 'system')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      settings.theme === 'system'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Smartphone className="w-6 h-6 mx-auto mb-2 text-slate-700" />
                    <div className="text-sm font-medium text-slate-900">System</div>
                  </button>
                </div>
              </div>

              {/* Language Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  <Globe className="w-4 h-4 inline mr-2" />
                  Language
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => handleSelect('language', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>

          {/* Privacy & Security */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Privacy & Security</h2>
                <p className="text-sm text-slate-600">Control your data and visibility</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Profile Visibility */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  <Eye className="w-4 h-4 inline mr-2" />
                  Profile Visibility
                </label>
                <select
                  value={settings.profileVisibility}
                  onChange={(e) => handleSelect('profileVisibility', e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="public">Public - Anyone can see</option>
                  <option value="private">Private - Only you</option>
                </select>
              </div>

              {/* Show Email */}
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div>
                  <div className="font-medium text-slate-900">Show Email on Profile</div>
                  <div className="text-sm text-slate-600">Display your email publicly</div>
                </div>
                <button
                  onClick={() => handleToggle('showEmail')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.showEmail ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.showEmail ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Analytics Tracking */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium text-slate-900">Analytics Tracking</div>
                  <div className="text-sm text-slate-600">Help us improve your experience</div>
                </div>
                <button
                  onClick={() => handleToggle('analyticsTracking')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.analyticsTracking ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.analyticsTracking ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Device Management */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <Monitor className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Connected Devices</h2>
                <p className="text-sm text-slate-600">Manage devices that can access your account (Max 3)</p>
              </div>
            </div>

            {loadingDevices ? (
              <div className="py-8 text-center text-slate-600">Loading devices...</div>
            ) : devices.length === 0 ? (
              <div className="py-8 text-center text-slate-600">No devices found</div>
            ) : (
              <div className="space-y-3">
                {devices.length >= 3 && (
                  <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg mb-4">
                    <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-orange-900">Device Limit Reached</div>
                      <div className="text-sm text-orange-700 mt-1">
                        You've reached the maximum of 3 connected devices. Remove a device to add a new one.
                      </div>
                    </div>
                  </div>
                )}

                {devices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {getDeviceIcon(device.deviceType)}
                      <div>
                        <div className="font-medium text-slate-900">{device.deviceName}</div>
                        <div className="text-sm text-slate-600">
                          {device.ipAddress && `${device.ipAddress} • `}
                          {formatLastActive(device.lastActive)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveDevice(device.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove device"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}

                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1 text-sm text-blue-900">
                      <div className="font-medium mb-1">Security Notice</div>
                      <div className="text-blue-700">
                        If you see a device you don't recognize, remove it immediately and change your password.
                        When you remove a device, you'll need to log in again on that device.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 transition-colors font-medium"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
