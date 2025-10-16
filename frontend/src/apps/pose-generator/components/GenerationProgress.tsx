import { useState, useEffect, useRef } from 'react'
import { CheckCircle, Loader2, Sparkles, Clock, Image } from 'lucide-react'
import { designTokens } from '../styles/design-tokens'
import '../styles/animations.css'

interface GenerationProgressProps {
  generationId: string
  totalPoses: number
  completedPoses: number
  failedPoses: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  estimatedTimeRemaining?: number
  recentPoses?: Array<{
    id: string
    outputUrl: string
    success: boolean
  }>
  onComplete?: () => void
}

export default function GenerationProgress({
  generationId,
  totalPoses,
  completedPoses,
  failedPoses,
  status,
  estimatedTimeRemaining,
  recentPoses = [],
  onComplete,
}: GenerationProgressProps) {
  const [displayProgress, setDisplayProgress] = useState(0)
  const [displayCompleted, setDisplayCompleted] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  const progress = Math.round((completedPoses / totalPoses) * 100)
  const isComplete = status === 'completed'
  const isFailed = status === 'failed'

  // Animate progress counter
  useEffect(() => {
    const duration = 1000
    const startTime = Date.now()
    const startProgress = displayProgress

    const animate = () => {
      const elapsed = Date.now() - startTime
      const ratio = Math.min(elapsed / duration, 1)

      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
      const easedRatio = easeOutCubic(ratio)

      const newProgress = startProgress + (progress - startProgress) * easedRatio
      setDisplayProgress(newProgress)

      if (ratio < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [progress])

  // Animate completed count
  useEffect(() => {
    const duration = 500
    const startTime = Date.now()
    const startCount = displayCompleted

    const animate = () => {
      const elapsed = Date.now() - startTime
      const ratio = Math.min(elapsed / duration, 1)

      const newCount = Math.floor(startCount + (completedPoses - startCount) * ratio)
      setDisplayCompleted(newCount)

      if (ratio < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [completedPoses])

  // Trigger confetti on completion
  useEffect(() => {
    if (isComplete && !showConfetti) {
      setShowConfetti(true)
      onComplete?.()
      triggerConfetti()
    }
  }, [isComplete])

  // Confetti animation
  const triggerConfetti = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      color: string
      size: number
      rotation: number
      rotationSpeed: number
    }> = []

    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']

    for (let i = 0; i < 100; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10 - 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
      })
    }

    let animationId: number

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p, index) => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.2 // gravity
        p.rotation += p.rotationSpeed

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
        ctx.restore()

        // Remove particles that are off screen
        if (p.y > canvas.height) {
          particles.splice(index, 1)
        }
      })

      if (particles.length > 0) {
        animationId = requestAnimationFrame(animate)
      } else {
        setShowConfetti(false)
      }
    }

    animate()

    // Cleanup
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }

  // Calculate stroke dashoffset for circular progress
  const radius = 90
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (displayProgress / 100) * circumference

  // Estimate time color
  const getTimeColor = () => {
    if (!estimatedTimeRemaining) return designTokens.colors.neutral[500]
    if (estimatedTimeRemaining < 30) return designTokens.colors.success[500]
    if (estimatedTimeRemaining < 120) return designTokens.colors.warning[500]
    return designTokens.colors.error[500]
  }

  // Format time
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }

  return (
    <div className="relative">
      {/* Confetti Canvas */}
      {showConfetti && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none z-50"
          style={{ width: '100vw', height: '100vh' }}
        />
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-premium-lg">
        {/* Main Progress Section */}
        <div className="flex flex-col lg:flex-row gap-8 items-center">
          {/* Circular Progress Ring */}
          <div className="relative" ref={progressRef}>
            {/* Particle Effects Container */}
            {status === 'processing' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-0"
                    style={{
                      animation: `particle 2s ease-out infinite`,
                      animationDelay: `${i * 0.15}s`,
                      '--tx': `${Math.cos((i * 30 * Math.PI) / 180) * 60}px`,
                      '--ty': `${Math.sin((i * 30 * Math.PI) / 180) * 60}px`,
                    } as any}
                  />
                ))}
              </div>
            )}

            {/* SVG Progress Ring */}
            <svg width="240" height="240" className="transform -rotate-90">
              {/* Background Ring */}
              <circle
                cx="120"
                cy="120"
                r={radius}
                stroke={designTokens.colors.neutral[200]}
                strokeWidth="12"
                fill="none"
              />

              {/* Progress Ring */}
              <circle
                cx="120"
                cy="120"
                r={radius}
                stroke="url(#progressGradient)"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
                style={{
                  filter: status === 'processing' ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))' : 'none'
                }}
              />

              {/* Gradient Definition */}
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={designTokens.colors.primary[500]} />
                  <stop offset="100%" stopColor={designTokens.colors.secondary[600]} />
                </linearGradient>
              </defs>
            </svg>

            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {isComplete ? (
                <div className="text-center animate-scaleIn">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full
                                flex items-center justify-center mb-2 animate-heartbeat">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-sm font-semibold text-green-600">Complete!</div>
                </div>
              ) : isFailed ? (
                <div className="text-center animate-shake">
                  <div className="text-4xl font-bold text-red-600 mb-1">Failed</div>
                  <div className="text-sm text-slate-600">Check errors</div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600
                                bg-clip-text text-transparent mb-2 animate-countUp">
                    {Math.round(displayProgress)}%
                  </div>
                  {status === 'processing' && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Processing...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Stats and Info */}
          <div className="flex-1 space-y-6 w-full">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Total Poses */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg
                                flex items-center justify-center">
                    <Image className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{totalPoses}</div>
                    <div className="text-xs text-slate-600">Total Poses</div>
                  </div>
                </div>
              </div>

              {/* Completed */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg
                                flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600 animate-countUp">
                      {displayCompleted}
                    </div>
                    <div className="text-xs text-slate-600">Completed</div>
                  </div>
                </div>
              </div>

              {/* Failed */}
              {failedPoses > 0 && (
                <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-4 border border-red-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg
                                  flex items-center justify-center">
                      <span className="text-white font-bold">✕</span>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{failedPoses}</div>
                      <div className="text-xs text-slate-600">Failed</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Time Remaining */}
              {estimatedTimeRemaining !== undefined && status === 'processing' && (
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold" style={{ color: getTimeColor() }}>
                        {formatTime(estimatedTimeRemaining)}
                      </div>
                      <div className="text-xs text-slate-600">Est. Remaining</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">Progress</span>
                <span className="text-slate-600">
                  {completedPoses} / {totalPoses} poses
                </span>
              </div>
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full
                           transition-all duration-1000 ease-out relative overflow-hidden"
                  style={{ width: `${displayProgress}%` }}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 shimmer" />
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center justify-center">
              {status === 'processing' && (
                <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium
                              flex items-center gap-2 animate-pulse">
                  <Sparkles className="w-4 h-4" />
                  Generating your poses...
                </div>
              )}
              {isComplete && (
                <div className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium
                              flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  All poses generated successfully!
                </div>
              )}
              {isFailed && (
                <div className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                  Generation failed - please try again
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Poses Carousel */}
        {recentPoses.length > 0 && (
          <div className="mt-8 pt-8 border-t border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Recent Completions
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {recentPoses.map((pose, index) => (
                <div
                  key={pose.id}
                  className="relative flex-shrink-0 w-24 h-32 rounded-lg overflow-hidden
                           border-2 border-slate-200 shadow-premium hover-lift hover-scale-sm
                           transition-all animate-fadeIn"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <img
                    src={pose.outputUrl}
                    alt="Generated pose"
                    className="w-full h-full object-cover"
                  />
                  {pose.success && (
                    <div className="absolute top-1 right-1 bg-green-500 rounded-full p-0.5">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
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
