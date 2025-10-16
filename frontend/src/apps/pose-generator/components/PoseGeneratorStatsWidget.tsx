import { useState, useEffect } from 'react'
import { Sparkles, TrendingUp, Image as ImageIcon, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { designTokens } from '../styles/design-tokens'
import '../styles/animations.css'

interface PoseGeneratorStatsWidgetProps {
  totalGenerations: number
  totalPoses: number
  recentPoses?: Array<{
    id: string
    outputUrl: string
    createdAt: string
  }>
  generationTrend?: number[]
}

export default function PoseGeneratorStatsWidget({
  totalGenerations,
  totalPoses,
  recentPoses = [],
  generationTrend = [],
}: PoseGeneratorStatsWidgetProps) {
  const navigate = useNavigate()
  const [displayCount, setDisplayCount] = useState(0)

  // Animated counter
  useEffect(() => {
    const duration = 2000
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const ratio = Math.min(elapsed / duration, 1)

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - ratio, 3)
      const newCount = Math.floor(totalPoses * easeOut)
      setDisplayCount(newCount)

      if (ratio < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [totalPoses])

  // Calculate sparkline path
  const generateSparkline = () => {
    if (generationTrend.length === 0) return ''

    const width = 120
    const height = 40
    const max = Math.max(...generationTrend, 1)
    const min = Math.min(...generationTrend, 0)
    const range = max - min || 1

    const points = generationTrend.map((value, index) => {
      const x = (index / (generationTrend.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return `${x},${y}`
    })

    return `M ${points.join(' L ')}`
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500
                  rounded-2xl shadow-premium-xl animate-scaleIn group hover-lift">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-grid-white" />
      </div>

      {/* Glass Morphism Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-sm" />

      {/* Shine Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute top-0 -left-full h-full w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent
                      transform skew-x-12 group-hover:animate-shine" />
      </div>

      {/* Content */}
      <div className="relative p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center
                          shadow-premium animate-pulse">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Pose Generator</h3>
              <p className="text-white/80 text-xs">AI-powered pose creation</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/apps/pose-generator')}
            className="w-8 h-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg
                     flex items-center justify-center transition-all hover-scale"
          >
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Main Stat */}
        <div className="flex items-end gap-4">
          <div>
            <div className="text-5xl font-bold text-white tracking-tight animate-countUp">
              {displayCount.toLocaleString()}
            </div>
            <div className="text-white/80 text-sm font-medium mt-1">
              Total Poses Generated
            </div>
          </div>

          {/* Sparkline Chart */}
          {generationTrend.length > 0 && (
            <div className="flex-1 flex items-center justify-end">
              <svg width="120" height="40" className="opacity-80">
                <path
                  d={generateSparkline()}
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="drop-shadow-lg"
                />
                {/* Filled area under line */}
                <path
                  d={`${generateSparkline()} L 120,40 L 0,40 Z`}
                  fill="url(#sparklineGradient)"
                  opacity="0.3"
                />
                <defs>
                  <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="white" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          )}
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <div className="flex items-center gap-2 mb-1">
              <ImageIcon className="w-4 h-4 text-white/80" />
              <span className="text-white/80 text-xs font-medium">Generations</span>
            </div>
            <div className="text-2xl font-bold text-white">{totalGenerations}</div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-white/80" />
              <span className="text-white/80 text-xs font-medium">This Week</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {generationTrend.length > 0 ? generationTrend[generationTrend.length - 1] : 0}
            </div>
          </div>
        </div>

        {/* Recent Poses Preview */}
        {recentPoses.length > 0 && (
          <div className="space-y-2">
            <div className="text-white/80 text-xs font-medium">Recent Creations</div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {recentPoses.slice(0, 4).map((pose, index) => (
                <div
                  key={pose.id}
                  className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden
                           border-2 border-white/30 shadow-premium hover-scale
                           transition-all cursor-pointer animate-fadeIn"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <img
                    src={pose.outputUrl}
                    alt="Recent pose"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {recentPoses.length > 4 && (
                <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-white/10 backdrop-blur-sm
                              border-2 border-white/30 flex items-center justify-center
                              text-white text-xs font-semibold hover-scale transition-all cursor-pointer">
                  +{recentPoses.length - 4}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={() => navigate('/apps/pose-generator')}
          className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white
                   rounded-xl py-3 px-4 font-semibold text-sm transition-all
                   border border-white/30 hover-lift flex items-center justify-center gap-2
                   hover-shine relative overflow-hidden group"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate New Poses</span>
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0
                        transition-transform duration-300" />
        </button>
      </div>

      <style jsx>{`
        @keyframes shine {
          to {
            left: 200%;
          }
        }
        .animate-shine {
          animation: shine 1s ease-out;
        }
        .bg-grid-white {
          background-image:
            linear-gradient(white 1px, transparent 1px),
            linear-gradient(90deg, white 1px, transparent 1px);
          background-size: 20px 20px;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
