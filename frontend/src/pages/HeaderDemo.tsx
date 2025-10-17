import React, { useState } from 'react'
import UnifiedHeader from '../components/UnifiedHeader'
import { UserCircle, Sparkles, Layers, Video, Image } from 'lucide-react'

/**
 * Demo page untuk testing UnifiedHeader component
 * Menampilkan berbagai konfigurasi header yang akan dipakai di semua aplikasi
 */
export default function HeaderDemo() {
  const [selectedDemo, setSelectedDemo] = useState<string>('avatar-creator')

  const demos = [
    {
      id: 'avatar-creator',
      title: 'Avatar Creator',
      subtitle: 'Create and manage AI avatars',
      icon: <UserCircle className="w-5 h-5" />,
      iconColor: 'bg-purple-50 text-purple-700',
      currentAppId: 'avatar-creator',
      showBackButton: true,
      backPath: '/dashboard',
      actions: null,
    },
    {
      id: 'pose-generator',
      title: 'Pose Generator',
      subtitle: 'AI-Powered Professional Poses',
      icon: <Sparkles className="w-5 h-5" />,
      iconColor: 'bg-indigo-50 text-indigo-700',
      currentAppId: 'pose-generator',
      showBackButton: true,
      backPath: '/dashboard',
      actions: null,
    },
    {
      id: 'carousel-mix',
      title: 'Carousel Mix',
      subtitle: 'Generate unique carousel combinations',
      icon: <Layers className="w-5 h-5" />,
      iconColor: 'bg-blue-50 text-blue-700',
      currentAppId: 'carousel-mix',
      showBackButton: true,
      backPath: '/dashboard',
      actions: null,
    },
    {
      id: 'video-mixer',
      title: 'Video Mixer',
      subtitle: 'Mix & generate video combinations',
      icon: <Video className="w-5 h-5" />,
      iconColor: 'bg-blue-50 text-blue-700',
      currentAppId: 'video-mixer',
      showBackButton: true,
      backPath: '/dashboard',
      actions: null,
    },
    {
      id: 'poster-editor',
      title: 'Smart Poster Editor',
      subtitle: 'AI-powered poster editing with text detection',
      icon: <Image className="w-5 h-5" />,
      iconColor: 'bg-green-50 text-green-700',
      currentAppId: 'poster-editor',
      showBackButton: true,
      backPath: '/dashboard',
      actions: null,
    },
    {
      id: 'dashboard',
      title: 'Central Hub Dashboard',
      subtitle: 'Welcome back! Select an app to get started',
      icon: null,
      iconColor: '',
      currentAppId: undefined,
      showBackButton: false,
      backPath: undefined,
      actions: null,
    },
  ]

  const currentDemo = demos.find(d => d.id === selectedDemo) || demos[0]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Unified Header Demo */}
      <UnifiedHeader
        title={currentDemo.title}
        subtitle={currentDemo.subtitle}
        icon={currentDemo.icon}
        iconColor={currentDemo.iconColor}
        showBackButton={currentDemo.showBackButton}
        backPath={currentDemo.backPath}
        currentAppId={currentDemo.currentAppId}
        actions={currentDemo.actions}
      />

      {/* Demo Content */}
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Control Panel */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Header Demo Control Panel</h2>
          <p className="text-sm text-slate-600 mb-6">
            Pilih aplikasi di bawah untuk melihat bagaimana header akan terlihat di masing-masing aplikasi.
            Header ini seamless dan konsisten di semua aplikasi. Demo ini fokus pada navigasi header (Home, Back, App Switcher, Credits, Profile) tanpa menampilkan action buttons app-specific.
          </p>

          {/* Demo Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {demos.map((demo) => (
              <button
                key={demo.id}
                onClick={() => setSelectedDemo(demo.id)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedDemo === demo.id
                    ? 'border-blue-600 bg-blue-50 shadow-md'
                    : 'border-slate-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  {demo.icon && (
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${demo.iconColor}`}>
                      {demo.icon}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{demo.title}</h3>
                  </div>
                  {selectedDemo === demo.id && (
                    <div className="w-3 h-3 bg-blue-600 rounded-full flex-shrink-0" />
                  )}
                </div>
                {demo.subtitle && (
                  <p className="text-xs text-slate-600 line-clamp-2">{demo.subtitle}</p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Feature Explanation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">1</span>
              Navigasi Mudah ke Dashboard
            </h3>
            <p className="text-sm text-slate-600 mb-3">
              Tombol <strong>Home</strong> di kiri header selalu ada untuk kembali ke dashboard dengan 1 klik.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>💡 Tip:</strong> Klik ikon Home untuk langsung ke Central Hub Dashboard
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">2</span>
              App Switcher Terintegrasi
            </h3>
            <p className="text-sm text-slate-600 mb-3">
              Tombol <strong>Apps</strong> memungkinkan pindah antar aplikasi tanpa harus kembali ke dashboard.
            </p>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-xs text-purple-800">
                <strong>💡 Tip:</strong> Klik tombol "Apps" untuk melihat dropdown semua aplikasi
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-green-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">3</span>
              Credit Display Terintegrasi
            </h3>
            <p className="text-sm text-slate-600 mb-3">
              Credit balance selalu visible dan <strong>clickable</strong> untuk langsung ke halaman pembelian credits.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-800">
                <strong>💡 Tip:</strong> Klik badge credits untuk langsung beli credits
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">4</span>
              Profile Menu Konsisten
            </h3>
            <p className="text-sm text-slate-600 mb-3">
              ProfileDropdown di kanan atas dengan akses ke Profile, Settings, Buy Credits, dan Logout.
            </p>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
              <p className="text-xs text-indigo-800">
                <strong>💡 Tip:</strong> Klik avatar untuk menu lengkap user actions
              </p>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-4">Technical Specifications</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-slate-800 mb-2 text-sm">Header Properties</h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li><strong>Position:</strong> Sticky top-0 z-50</li>
                <li><strong>Max Width:</strong> 1400px (konsisten semua apps)</li>
                <li><strong>Background:</strong> White dengan border-bottom</li>
                <li><strong>Padding:</strong> px-6 py-4 (responsive)</li>
                <li><strong>Layout:</strong> Flexbox justify-between</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 mb-2 text-sm">Component Features</h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li>✅ Reusable & customizable</li>
                <li>✅ Auto-fetch credit balance</li>
                <li>✅ Click-outside detection</li>
                <li>✅ Responsive design (mobile-friendly)</li>
                <li>✅ Smooth animations</li>
                <li>✅ TypeScript types</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 mb-2 text-sm">Navigation Elements</h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li>🏠 <strong>Home Button:</strong> Back to dashboard</li>
                <li>⬅️ <strong>Back Button:</strong> Previous page (optional)</li>
                <li>🎯 <strong>App Icon:</strong> Visual identity</li>
                <li>🔄 <strong>App Switcher:</strong> Quick app navigation</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 mb-2 text-sm">Right Section</h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li>🎬 <strong>Custom Actions:</strong> Optional app-specific buttons (not shown in demo)</li>
                <li>💰 <strong>Credits Badge:</strong> Balance + buy link</li>
                <li>👤 <strong>Profile Menu:</strong> User options</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Usage Example */}
        <div className="bg-slate-900 text-slate-100 rounded-xl p-6 mt-8">
          <h3 className="font-bold mb-3 text-white">Usage Example</h3>
          <pre className="text-xs overflow-x-auto">
            <code>{`import UnifiedHeader from '../components/UnifiedHeader'
import { UserCircle, Plus } from 'lucide-react'

// Basic usage (navigation only - recommended for most apps):
<UnifiedHeader
  title="Avatar Creator"
  subtitle="Create and manage AI avatars"
  icon={<UserCircle className="w-5 h-5" />}
  iconColor="bg-purple-50 text-purple-700"
  showBackButton={true}
  backPath="/dashboard"
  currentAppId="avatar-creator"
  actions={null}
/>

// Advanced usage with custom actions (optional, use sparingly):
<UnifiedHeader
  title="Avatar Creator"
  subtitle="Create and manage AI avatars"
  icon={<UserCircle className="w-5 h-5" />}
  iconColor="bg-purple-50 text-purple-700"
  showBackButton={true}
  backPath="/dashboard"
  currentAppId="avatar-creator"
  actions={
    <button className="px-4 py-2 bg-purple-600 text-white rounded-lg">
      <Plus className="w-4 h-4" />
      New Project
    </button>
  }
/>`}</code>
          </pre>
        </div>

        {/* Best Practices */}
        <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-6 mt-8">
          <h3 className="font-bold text-amber-900 mb-3">Best Practices for Custom Actions</h3>
          <ul className="space-y-2 text-sm text-amber-800">
            <li className="flex gap-3">
              <span className="flex-shrink-0">✅</span>
              <span><strong>Recommended:</strong> Use actions={null} for most apps to keep header clean and focused on navigation</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0">⚠️</span>
              <span><strong>Use sparingly:</strong> Only add custom action buttons if absolutely necessary for the app workflow</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0">📱</span>
              <span><strong>Mobile consideration:</strong> Action buttons take valuable space on small screens</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0">🎯</span>
              <span><strong>User focus:</strong> Header demo showcases navigation elements (Home, Back, App Switcher, Credits, Profile)</span>
            </li>
          </ul>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6 mt-8">
          <h3 className="font-bold text-slate-900 mb-3">📋 Next Steps untuk Implementation</h3>
          <ol className="space-y-2 text-sm text-slate-700">
            <li className="flex gap-3">
              <span className="font-bold text-blue-600 flex-shrink-0">1.</span>
              <span>Test header ini di lokal dengan berbagai konfigurasi</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600 flex-shrink-0">2.</span>
              <span>Refactor semua app components untuk menggunakan UnifiedHeader</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600 flex-shrink-0">3.</span>
              <span>Test di mobile, tablet, dan desktop</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600 flex-shrink-0">4.</span>
              <span>Deploy ke dev.lumiku.com untuk staging test</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-blue-600 flex-shrink-0">5.</span>
              <span>Production deployment setelah approval</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
