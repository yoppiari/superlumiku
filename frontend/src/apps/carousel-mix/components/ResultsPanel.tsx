import { useState, useEffect } from 'react'
import { useCarouselMixStore, groupSlidesByPosition, groupTextsByPosition, getCombinationBreakdown } from '../../../stores/carouselMixStore'
import { useAuthStore } from '../../../stores/authStore'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Zap, Coins, AlertCircle, CheckCircle, Loader, Hash, Eye, RefreshCw, Download, Clock, FileVideo } from 'lucide-react'

// Use root path in production (Nginx will proxy), localhost in development
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? '' : 'http://localhost:3000')

interface ResultsPanelProps {
  projectId: string
}

export function ResultsPanel({}: ResultsPanelProps) {
  const navigate = useNavigate()
  const { user, token, updateCreditBalance } = useAuthStore()
  const {
    currentProject,
    generationSettings,
    combinationEstimate,
    calculateCombinations,
    generateCarousels,
    isGenerating,
    positionSettings,
    updateGenerationSettings,
  } = useCarouselMixStore()

  const [isCalculating, setIsCalculating] = useState(false)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
  const [previewSamples, setPreviewSamples] = useState<Array<{image: string, text: string, settings?: any}>>([])

  // Auto-calculate when settings change
  useEffect(() => {
    if (currentProject && currentProject.slides.length >= 2) {
      handleCalculate()
    }
  }, [
    generationSettings.numSlides,
    generationSettings.numSets,
    generationSettings.textVariation.algorithm,
    currentProject?.texts.length,
  ])

  // Auto-generate preview when project loads or changes
  useEffect(() => {
    if (currentProject && currentProject.slides.length > 0) {
      // Clear old previews first
      setPreviewSamples([])
      // Generate new preview
      setTimeout(() => handleGeneratePreview(), 100)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject?.id, currentProject?.slides.length, currentProject?.texts.length])

  // Auto-refresh generations every 5 seconds if there are processing/pending generations
  useEffect(() => {
    if (!currentProject) return

    const hasActiveGeneration = currentProject.generations?.some(
      g => g.status === 'processing' || g.status === 'pending'
    )
    if (!hasActiveGeneration) return

    const interval = setInterval(() => {
      // Reload only the current project instead of all projects
      const { selectProject } = useCarouselMixStore.getState()
      selectProject(currentProject.id)
    }, 5000)

    return () => clearInterval(interval)
  }, [currentProject?.generations, currentProject?.id])

  const handleCalculate = async () => {
    if (!currentProject) return

    setIsCalculating(true)
    try {
      await calculateCombinations(currentProject.id)
    } catch (error: any) {
      console.error('Failed to calculate:', error)
    } finally {
      setIsCalculating(false)
    }
  }

  const handleGeneratePreview = () => {
    if (!currentProject || currentProject.slides.length < 1) return

    setIsGeneratingPreview(true)

    setTimeout(() => {
      try {
        const samples = []

        // Group slides and texts by position
        const slidesByPosition = groupSlidesByPosition(currentProject.slides)
        const textsByPosition = groupTextsByPosition(currentProject.texts)

        // Get unique positions that have slides
        const positions = Object.keys(slidesByPosition).map(Number).sort((a, b) => a - b)
        const numSamples = Math.min(3, positions.length)

        // Generate sample for each position
        for (let i = 0; i < numSamples; i++) {
          const position = positions[i]
          const slidesAtPosition = slidesByPosition[position] || []
          const textsAtPosition = textsByPosition[position] || []

          if (slidesAtPosition.length === 0) continue

          // Pick random slide from THIS position
          const randomSlide = slidesAtPosition[Math.floor(Math.random() * slidesAtPosition.length)]

          // Pick random text from THIS position (if available)
          const randomText = textsAtPosition.length > 0
            ? textsAtPosition[Math.floor(Math.random() * textsAtPosition.length)]
            : null

          // Get position settings from store
          const positionSetting = positionSettings[`${currentProject.id}-${position}`]

          // Construct proper image URL - backend serves at /uploads/
          const imageUrl = `${API_BASE_URL}/uploads${randomSlide.filePath}`

          console.log(`Preview sample for position ${position}:`, {
            imageUrl,
            text: randomText?.content,
            filePath: randomSlide.filePath,
            position,
            settings: positionSetting
          })

          samples.push({
            image: imageUrl,
            text: randomText?.content || '',
            settings: positionSetting
          })
        }

        setPreviewSamples(samples)
      } finally {
        setIsGeneratingPreview(false)
      }
    }, 100)
  }

  const handleGenerate = async () => {
    if (!currentProject || !combinationEstimate?.feasible) return

    // Check credits
    if (user && user.creditBalance < combinationEstimate.credits.total) {
      alert(
        `Insufficient credits! You need ${combinationEstimate.credits.total} credits but have ${user.creditBalance}`
      )
      navigate('/dashboard')
      return
    }

    if (
      !confirm(
        `Generate ${generationSettings.numSets} carousels for ${combinationEstimate.credits.total} credits?`
      )
    ) {
      return
    }

    try {
      const generation = await generateCarousels(currentProject.id)

      // Update credit balance
      const newBalance = user!.creditBalance - combinationEstimate.credits.total
      updateCreditBalance(newBalance)

      alert(`Generation started! Generation ID: ${generation.id.slice(0, 8)}...`)
    } catch (error: any) {
      if (error.response?.status === 402) {
        alert('Insufficient credits!')
        navigate('/dashboard')
      } else {
        alert(error.message || 'Failed to generate carousels')
      }
    }
  }

  const getStrengthColor = (strength: number) => {
    if (strength === 0) return 'text-gray-500'
    if (strength <= 2) return 'text-yellow-600'
    if (strength <= 3) return 'text-blue-600'
    return 'text-green-600'
  }

  const getStrengthBgColor = (strength: number) => {
    if (strength === 0) return 'bg-gray-100'
    if (strength <= 2) return 'bg-yellow-100'
    if (strength <= 3) return 'bg-blue-100'
    return 'bg-green-100'
  }

  const handleDownload = async (generationId: string) => {
    try {
      if (!token) {
        alert('Authentication required. Please log in again.')
        return
      }

      // Fetch with auth header
      const response = await fetch(
        `${API_BASE_URL}/api/apps/carousel-mix/generations/${generationId}/download`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Download failed')
      }

      // Get blob from response
      const blob = await response.blob()

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `carousel_${generationId}.zip`
      document.body.appendChild(a)
      a.click()

      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: any) {
      console.error('Download error:', error)
      alert(`Download failed: ${error.message}`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'processing': return 'text-blue-600 bg-blue-100'
      case 'failed': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'processing': return <Loader className="w-4 h-4 animate-spin" />
      case 'failed': return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  if (!currentProject) return null

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 h-full overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6">Results & Preview</h2>

      {/* Validation Messages */}
      {currentProject.slides.length < 2 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">Not enough slides</p>
            <p className="text-sm text-yellow-700">Upload at least 2 slides to generate carousels</p>
          </div>
        </div>
      )}

      {generationSettings.numSlides > currentProject.slides.length && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">Invalid configuration</p>
            <p className="text-sm text-yellow-700">
              Cannot generate {generationSettings.numSlides}-slide carousels with only{' '}
              {currentProject.slides.length} slides
            </p>
          </div>
        </div>
      )}

      {/* Combination Counter */}
      <div className="mb-6">
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-800">Possible Combinations</h3>
          </div>

          {isCalculating ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader className="w-5 h-5 animate-spin" />
              <span>Calculating...</span>
            </div>
          ) : combinationEstimate ? (
            <div>
              <p className="text-3xl font-bold text-purple-700 mb-2">
                {combinationEstimate.totalCombinations === Infinity
                  ? '∞'
                  : combinationEstimate.totalCombinations.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                {combinationEstimate.totalCombinations === Infinity
                  ? 'Infinite unique carousels possible'
                  : 'unique carousel combinations'}
              </p>

              {/* Position Breakdown */}
              {currentProject && (
                <div className="mt-4 pt-4 border-t border-purple-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Hash className="w-4 h-4 text-purple-600" />
                    <h4 className="text-sm font-semibold text-gray-700">Position Breakdown</h4>
                  </div>
                  <div className="space-y-2">
                    {(() => {
                      const slidesByPosition = groupSlidesByPosition(currentProject.slides)
                      const textsByPosition = groupTextsByPosition(currentProject.texts)
                      const breakdown = getCombinationBreakdown(
                        generationSettings.numSlides,
                        slidesByPosition,
                        textsByPosition
                      )

                      return breakdown.map(({ position, imageCount, textCount, variations }) => (
                        <div
                          key={position}
                          className="flex items-center justify-between p-2 bg-white/60 rounded border border-purple-100"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {position}
                            </div>
                            <span className="text-sm text-gray-700">
                              {imageCount} image{imageCount !== 1 ? 's' : ''} × {textCount || 1} text{textCount !== 1 && textCount !== 0 ? 's' : ''}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-purple-700">
                            {variations} var{variations !== 1 ? 's' : ''}
                          </span>
                        </div>
                      ))
                    })()}
                  </div>
                  <div className="mt-3 text-xs text-gray-600 bg-purple-100/50 p-2 rounded">
                    <span className="font-semibold">Formula:</span> {(() => {
                      const slidesByPosition = groupSlidesByPosition(currentProject.slides)
                      const textsByPosition = groupTextsByPosition(currentProject.texts)
                      const breakdown = getCombinationBreakdown(
                        generationSettings.numSlides,
                        slidesByPosition,
                        textsByPosition
                      )
                      return breakdown.map(b => b.variations).join(' × ')
                    })()} = {combinationEstimate.totalCombinations.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Configure settings to see combinations</p>
          )}
        </div>
      </div>

      {/* Preview Results */}
      {currentProject && currentProject.slides.length > 0 && (
        <div className="mb-6">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-gray-700" />
                <h3 className="font-semibold text-gray-800">Preview Results</h3>
              </div>
              <button
                onClick={handleGeneratePreview}
                disabled={isGeneratingPreview}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-lg transition flex items-center gap-2 disabled:opacity-50"
              >
                {isGeneratingPreview ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Generate Random Preview
                  </>
                )}
              </button>
            </div>

            {previewSamples.length > 0 ? (
              <div className="grid grid-cols-3 gap-4">
                {previewSamples.map((sample, idx) => {
                  // Get settings or use defaults
                  const settings = sample.settings || {
                    fontSize: 16,               // Deprecated
                    fontSizePercent: 4.5,       // Default 4.5% of image height
                    fontColor: '#FFFFFF',
                    fontWeight: 700,
                    fontFamily: 'Arial',
                    textPosition: 'center',
                    textAlignment: 'center',
                    positionX: 50,
                    positionY: 50,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)'
                  }

                  // Calculate position based on settings
                  const getPositionStyle = () => {
                    const baseStyle: any = {
                      position: 'absolute',
                      left: `${settings.positionX}%`,
                      top: `${settings.positionY}%`,
                      transform: 'translate(-50%, -50%)',
                      textAlign: settings.textAlignment as any,
                      maxWidth: '90%'
                    }

                    return baseStyle
                  }

                  const getTextStyle = () => {
                    // Calculate font size from percentage (container is preview size, not 1080px)
                    const containerRef = document.querySelector('.aspect-square') as HTMLElement
                    const containerHeight = containerRef?.offsetHeight || 350 // Fallback to 350px
                    const actualFontSize = (settings.fontSizePercent || settings.fontSize / 350 * 100 || 4.5) / 100 * containerHeight

                    return {
                      fontSize: `${actualFontSize}px`,
                      color: settings.fontColor,
                      fontWeight: settings.fontWeight,
                      fontFamily: settings.fontFamily,
                      backgroundColor: settings.backgroundColor,
                      padding: '12px 20px',
                      borderRadius: '8px',
                      backdropFilter: 'blur(4px)',
                      whiteSpace: 'nowrap' as any,
                      overflow: 'hidden' as any,
                      textOverflow: 'ellipsis' as any
                    }
                  }

                  return (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden shadow-lg bg-gray-200">
                      <img
                        src={sample.image}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E'
                        }}
                      />
                      {sample.text && sample.text.trim() !== '' && (
                        <div style={getPositionStyle()}>
                          <div style={getTextStyle()}>
                            {sample.text}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Click "Generate Random Preview" to see sample combinations</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Anti-Fingerprinting Strength */}
      {combinationEstimate && combinationEstimate.strength !== undefined && (
        <div className="mb-6">
          <div
            className={`border-2 rounded-lg p-4 ${getStrengthBgColor(
              combinationEstimate.strength
            )} border-opacity-50`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap className={`w-5 h-5 ${getStrengthColor(combinationEstimate.strength)}`} />
              <h3 className="font-semibold text-gray-800">Anti-Fingerprinting Strength</h3>
            </div>
            <p className={`text-2xl font-bold ${getStrengthColor(combinationEstimate.strength)}`}>
              {combinationEstimate.strengthLabel}
            </p>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  combinationEstimate.strength === 0
                    ? 'bg-gray-400'
                    : combinationEstimate.strength <= 2
                    ? 'bg-yellow-500'
                    : combinationEstimate.strength <= 3
                    ? 'bg-blue-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${(combinationEstimate.strength / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Cost Summary */}
      {combinationEstimate && (
        <div className="mb-6">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Coins className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800">Cost Summary</h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Per Carousel:</span>
                <span className="font-medium text-gray-800">
                  {combinationEstimate.credits.perSet} credits
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Carousels:</span>
                <span className="font-medium text-gray-800">{generationSettings.numSets}</span>
              </div>

              {generationSettings.numSets >= 10 && (
                <div className="flex justify-between items-center text-green-600">
                  <span className="text-sm">Bulk Discount (1.5x):</span>
                  <span className="font-medium">Applied ✓</span>
                </div>
              )}

              <div className="pt-3 border-t-2 border-blue-300 flex justify-between items-center">
                <span className="font-semibold text-gray-800">Total Cost:</span>
                <span className="text-2xl font-bold text-blue-700">
                  {combinationEstimate.credits.total} credits
                </span>
              </div>

              {user && (
                <div className="pt-2 flex justify-between items-center text-sm">
                  <span className="text-gray-600">Your Balance:</span>
                  <span
                    className={`font-medium ${
                      user.creditBalance >= combinationEstimate.credits.total
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {user.creditBalance} credits
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Number of Carousels to Generate */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Number of Carousels to Generate
        </label>
        <input
          type="number"
          min="1"
          max="100"
          value={generationSettings.numSets}
          onChange={(e) => updateGenerationSettings({ numSets: parseInt(e.target.value) || 1 })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">Generate 1-100 unique carousels</p>
      </div>

      {/* Generate Button */}
      <div className="space-y-3">
        {combinationEstimate && !combinationEstimate.feasible && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{combinationEstimate.reason}</p>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={
            isGenerating ||
            !combinationEstimate ||
            !combinationEstimate.feasible ||
            (user !== null && user.creditBalance < combinationEstimate.credits.total)
          }
          className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 shadow-lg"
        >
          {isGenerating ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate {generationSettings.numSets} Carousel
              {generationSettings.numSets > 1 ? 's' : ''}
            </>
          )}
        </button>

        {combinationEstimate?.feasible && user && user.creditBalance >= combinationEstimate.credits.total && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">
              Ready to generate! You have enough credits for this generation.
            </p>
          </div>
        )}
      </div>

      {/* Generated Results Section */}
      {currentProject.generations && currentProject.generations.length > 0 && (
        <div className="mt-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileVideo className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-800">Generated Carousels</h3>
            </div>

            <div className="space-y-3">
              {currentProject.generations.map((generation) => (
                <div
                  key={generation.id}
                  className="bg-white rounded-lg border-2 border-green-100 p-4 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(generation.status)}`}>
                        {getStatusIcon(generation.status)}
                        {generation.status}
                      </div>
                      <span className="text-sm text-gray-600">
                        {new Date(generation.createdAt).toLocaleDateString()} {new Date(generation.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    {generation.status === 'completed' && (
                      <button
                        onClick={() => handleDownload(generation.id)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download ZIP
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Carousels:</span>
                      <span className="ml-2 font-semibold text-gray-800">{generation.numSetsGenerated}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Slides each:</span>
                      <span className="ml-2 font-semibold text-gray-800">{generation.numSlides}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Cost:</span>
                      <span className="ml-2 font-semibold text-gray-800">{generation.creditUsed} credits</span>
                    </div>
                  </div>

                  {generation.status === 'processing' && (
                    <div className="mt-3 text-xs text-blue-600 flex items-center gap-2">
                      <Loader className="w-3 h-3 animate-spin" />
                      Processing... This may take a few minutes.
                    </div>
                  )}

                  {generation.status === 'failed' && generation.error && (
                    <div className="mt-3 text-xs text-red-600">
                      Error: {generation.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
