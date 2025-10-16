import { useState, useEffect } from 'react'
import { ArrowLeft, ArrowRight, Check, Sparkles, AlertCircle, Coins } from 'lucide-react'
import { designTokens } from '../styles/design-tokens'
import '../styles/animations.css'

interface Step {
  id: number
  title: string
  description: string
  icon: string
}

interface GenerationWizardProps {
  currentStep: number
  totalSteps: number
  onStepChange: (step: number) => void
  onNext?: () => void
  onBack?: () => void
  onSubmit?: () => void
  canProceed?: boolean
  isSubmitting?: boolean
  creditCost?: number
  validationErrors?: string[]
  children: React.ReactNode
}

const defaultSteps: Step[] = [
  {
    id: 1,
    title: 'Select Avatar',
    description: 'Choose which avatar to use',
    icon: '👤',
  },
  {
    id: 2,
    title: 'Choose Poses',
    description: 'Pick poses from library',
    icon: '🎨',
  },
  {
    id: 3,
    title: 'Configure',
    description: 'Customize settings',
    icon: '⚙️',
  },
  {
    id: 4,
    title: 'Generate',
    description: 'Create your poses',
    icon: '✨',
  },
]

export default function GenerationWizard({
  currentStep,
  totalSteps = 4,
  onStepChange,
  onNext,
  onBack,
  onSubmit,
  canProceed = true,
  isSubmitting = false,
  creditCost = 0,
  validationErrors = [],
  children,
}: GenerationWizardProps) {
  const [animatingStep, setAnimatingStep] = useState<'in' | 'out' | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  const steps = defaultSteps.slice(0, totalSteps)
  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === totalSteps
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100

  useEffect(() => {
    if (currentStep === totalSteps && isSubmitting) {
      setShowConfetti(true)
    }
  }, [currentStep, totalSteps, isSubmitting])

  const handleNext = () => {
    if (!canProceed) {
      // Shake animation for validation errors
      const stepContent = document.getElementById('wizard-content')
      stepContent?.classList.add('animate-shake')
      setTimeout(() => {
        stepContent?.classList.remove('animate-shake')
      }, 500)
      return
    }

    setAnimatingStep('out')
    setTimeout(() => {
      if (isLastStep) {
        onSubmit?.()
      } else {
        onStepChange(currentStep + 1)
        onNext?.()
      }
      setAnimatingStep('in')
      setTimeout(() => setAnimatingStep(null), 400)
    }, 300)
  }

  const handleBack = () => {
    if (!isFirstStep) {
      setAnimatingStep('out')
      setTimeout(() => {
        onStepChange(currentStep - 1)
        onBack?.()
        setAnimatingStep('in')
        setTimeout(() => setAnimatingStep(null), 400)
      }, 300)
    }
  }

  const handleStepClick = (step: number) => {
    if (step <= currentStep) {
      onStepChange(step)
    }
  }

  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <div className="bg-white rounded-2xl shadow-premium border border-slate-200 p-6">
        <div className="space-y-6">
          {/* Step Indicators */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id
              const isClickable = step.id <= currentStep

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    onClick={() => handleStepClick(step.id)}
                    disabled={!isClickable}
                    className={`flex flex-col items-center gap-2 transition-all
                               ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                  >
                    {/* Icon Circle */}
                    <div
                      className={`relative w-14 h-14 rounded-full border-4 transition-all
                                 flex items-center justify-center text-2xl ${
                        isCompleted
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-500 scale-100'
                          : isActive
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 border-blue-500 scale-110 animate-pulse shadow-glow-blue'
                          : 'bg-white border-slate-300'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-6 h-6 text-white animate-scaleIn" />
                      ) : (
                        <span className={isActive ? 'text-white' : 'opacity-50'}>
                          {step.icon}
                        </span>
                      )}

                      {/* Active Ring */}
                      {isActive && (
                        <div className="absolute inset-0 rounded-full border-4 border-blue-500 animate-ping opacity-20" />
                      )}
                    </div>

                    {/* Label */}
                    <div className="text-center">
                      <div
                        className={`text-sm font-semibold transition-colors ${
                          isActive
                            ? 'text-blue-600'
                            : isCompleted
                            ? 'text-green-600'
                            : 'text-slate-400'
                        }`}
                      >
                        {step.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {step.description}
                      </div>
                    </div>
                  </button>

                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-1 mx-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          currentStep > step.id
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 w-full'
                            : 'bg-slate-200 w-0'
                        }`}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Overall Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">Overall Progress</span>
              <span className="text-slate-600">
                Step {currentStep} of {totalSteps}
              </span>
            </div>
            <div className="h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500
                         rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                style={{ width: `${progress}%` }}
              >
                {/* Animated shimmer */}
                <div className="absolute inset-0 shimmer" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-fadeInDown">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-900 mb-1">
                Please fix the following errors:
              </h4>
              <ul className="space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm text-red-700 flex items-start gap-2">
                    <span className="text-red-400 flex-shrink-0">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div
        id="wizard-content"
        className={`transition-all duration-300 ${
          animatingStep === 'out'
            ? 'opacity-0 transform -translate-x-4'
            : animatingStep === 'in'
            ? 'opacity-0 transform translate-x-4'
            : 'opacity-100 transform translate-x-0'
        }`}
      >
        {children}
      </div>

      {/* Navigation Footer */}
      <div className="bg-white rounded-2xl shadow-premium border border-slate-200 p-6">
        <div className="flex items-center justify-between gap-4">
          {/* Back Button */}
          <button
            onClick={handleBack}
            disabled={isFirstStep}
            className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all
                       flex items-center gap-2 ${
              isFirstStep
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover-scale-sm'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {/* Credit Cost Display */}
          {creditCost > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-50 to-orange-50
                          border border-yellow-200 rounded-lg">
              <Coins className="w-5 h-5 text-yellow-600" />
              <div className="text-sm">
                <span className="text-slate-600">Cost: </span>
                <span className="font-bold text-yellow-700">{creditCost} credits</span>
              </div>
            </div>
          )}

          {/* Next/Submit Button */}
          <button
            onClick={handleNext}
            disabled={!canProceed || isSubmitting}
            className={`px-8 py-3 rounded-xl font-semibold text-sm transition-all
                       flex items-center gap-2 relative overflow-hidden group ${
              !canProceed || isSubmitting
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-premium hover-lift hover-glow hover-shine'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : isLastStep ? (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Start Generation</span>
              </>
            ) : (
              <>
                <span>Next Step</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}

            {/* Shine effect on hover */}
            {!isSubmitting && canProceed && (
              <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0
                            transition-transform duration-500" />
            )}
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div>
              {isLastStep ? (
                <span>Review your settings and click "Start Generation" to begin</span>
              ) : (
                <span>Complete this step to continue</span>
              )}
            </div>
            <div>
              <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded text-xs">
                {isLastStep ? 'Enter' : '→'}
              </kbd>
              <span className="ml-1">to continue</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
