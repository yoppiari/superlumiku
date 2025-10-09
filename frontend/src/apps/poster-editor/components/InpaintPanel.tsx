import { useState } from 'react'
import { Sparkles, Loader2, X, Check } from 'lucide-react'
import api from '../../../lib/api'

interface InpaintPanelProps {
  posterId: string
  maskDataUrl: string
  onClose: () => void
  onSuccess: () => void
}

export function InpaintPanel({ posterId, maskDataUrl, onClose, onSuccess }: InpaintPanelProps) {
  const [prompt, setPrompt] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt describing what you want to edit')
      return
    }

    if (!maskDataUrl) {
      setError('Please mark the area you want to edit on the canvas')
      return
    }

    try {
      setIsProcessing(true)
      setError('')
      setProgress('Starting AI inpainting...')

      // Start inpaint job
      const response = await api.post('/api/apps/poster-editor/inpaint', {
        posterId,
        prompt: prompt.trim(),
        maskDataUrl
      })

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to start inpaint job')
      }

      const jobId = response.data.jobId
      setProgress('Processing... This may take 10-30 seconds')

      // Poll for status
      let attempts = 0
      const maxAttempts = 60 // 2 minutes max

      const pollStatus = async (): Promise<void> => {
        if (attempts >= maxAttempts) {
          throw new Error('Processing timeout. Please try again.')
        }

        attempts++
        const statusResponse = await api.get(`/api/apps/poster-editor/inpaint/${jobId}/status`)

        if (statusResponse.data.status === 'completed') {
          // Download and save the result
          setProgress('Saving result...')

          const outputUrl = statusResponse.data.outputUrl
          if (!outputUrl) {
            throw new Error('No output URL received from server')
          }

          // Save the inpainted result
          const saveResponse = await api.post(`/api/apps/poster-editor/inpaint/${jobId}/save`, {
            posterId,
            outputUrl
          })

          if (!saveResponse.data.success) {
            throw new Error(saveResponse.data.error || 'Failed to save result')
          }

          setProgress('Completed!')
          setTimeout(() => {
            onSuccess()
            onClose()
          }, 1000)
          return
        }

        if (statusResponse.data.status === 'failed') {
          throw new Error(statusResponse.data.error || 'Inpainting failed')
        }

        // Still processing, poll again
        setTimeout(pollStatus, 2000)
      }

      await pollStatus()

    } catch (err: any) {
      console.error('Inpaint error:', err)
      setError(err.response?.data?.error || err.message || 'Failed to process inpainting')
      setIsProcessing(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          AI Inpainting
        </h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors"
          disabled={isProcessing}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Prompt Input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            What do you want to edit?
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g., 'a beautiful sunset sky', 'modern building', 'green trees'..."
            rows={4}
            disabled={isProcessing}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Progress Message */}
        {progress && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm text-purple-700 flex items-center gap-2">
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {progress}
            </p>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isProcessing || !prompt.trim() || !maskDataUrl}
          className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate with AI (400 credits)
            </>
          )}
        </button>

        {/* Info */}
        <div className="text-xs text-slate-500 space-y-1">
          <p>💡 <span className="font-medium">Tips:</span></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Be specific in your prompt for best results</li>
            <li>Mark the area you want to change on the canvas above</li>
            <li>Processing takes 10-30 seconds</li>
            <li>Cost: 400 credits per generation</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
