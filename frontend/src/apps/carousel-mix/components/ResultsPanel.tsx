import { useState, useEffect } from 'react'
import { useCarouselMixStore, groupSlidesByPosition, groupTextsByPosition, getCombinationBreakdown } from '../../../stores/carouselMixStore'
import { useAuthStore } from '../../../stores/authStore'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Zap, Coins, AlertCircle, CheckCircle, Loader, Hash, Check, Loader2 } from 'lucide-react'

interface ResultsPanelProps {
  projectId: string
}

export function ResultsPanel({ projectId }: ResultsPanelProps) {
  const navigate = useNavigate()
  const { user, updateCreditBalance } = useAuthStore()
  const {
    currentProject,
    generationSettings,
    combinationEstimate,
    calculateCombinations,
    generateCarousels,
    isGenerating,
    isSaving,
    lastSaved,
  } = useCarouselMixStore()

  const [isCalculating, setIsCalculating] = useState(false)
  const [timeAgo, setTimeAgo] = useState('')

  useEffect(() => {
    if (!lastSaved) {
      setTimeAgo('')
      return
    }

    const updateTimeAgo = () => {
      const now = new Date()
      const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000)

      if (diff < 5) {
        setTimeAgo('just now')
      } else if (diff < 60) {
        setTimeAgo(`${diff}s ago`)
      } else if (diff < 3600) {
        const mins = Math.floor(diff / 60)
        setTimeAgo(`${mins}m ago`)
      } else {
        const hours = Math.floor(diff / 3600)
        setTimeAgo(`${hours}h ago`)
      }
    }

    updateTimeAgo()
    const interval = setInterval(updateTimeAgo, 1000)

    return () => clearInterval(interval)
  }, [lastSaved])

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

      {/* Save Button */}
      <div className="space-y-3">
        <button
          disabled={isSaving}
          className={`w-full px-6 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
            isSaving
              ? 'bg-blue-50 border-2 border-blue-200 text-blue-600 cursor-wait'
              : lastSaved
              ? 'bg-gray-100 border-2 border-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gray-100 border-2 border-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              {lastSaved ? `Saved ${timeAgo}` : 'No changes to save'}
            </>
          )}
        </button>

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
            (user && user.creditBalance < combinationEstimate.credits.total)
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
    </div>
  )
}
