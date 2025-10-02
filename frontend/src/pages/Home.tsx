import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">
          Lumiku AI Suite
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Unified platform for AI-powered content creation tools
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            to="/login"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Get Started
          </Link>
          <Link
            to="/dashboard"
            className="px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-50 transition-colors font-medium border border-blue-600"
          >
            Dashboard
          </Link>
        </div>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-4xl mb-4">🎬</div>
            <h3 className="text-lg font-semibold mb-2">Video Mix Pro</h3>
            <p className="text-gray-600 text-sm">
              Advanced video processing with AI-powered mixing
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold mb-2">Carousel Generator</h3>
            <p className="text-gray-600 text-sm">
              Create stunning carousels with AI assistance
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-lg font-semibold mb-2">More Tools</h3>
            <p className="text-gray-600 text-sm">
              Expand your toolkit with additional AI features
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}