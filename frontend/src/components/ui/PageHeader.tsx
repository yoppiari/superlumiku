import { ArrowLeft, type LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/utils'

export interface PageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  iconColor?: string
  backButton?: boolean
  backPath?: string
  actions?: React.ReactNode
  className?: string
}

/**
 * Reusable Page Header Component
 * Provides consistent header styling across pages
 */
export function PageHeader({
  title,
  description,
  icon: Icon,
  iconColor = 'bg-blue-50 text-blue-700',
  backButton = false,
  backPath,
  actions,
  className,
}: PageHeaderProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (backPath) {
      navigate(backPath)
    } else {
      navigate(-1)
    }
  }

  return (
    <div className={cn('bg-white border-b border-slate-200 sticky top-0 z-50', className)}>
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {backButton && (
              <button
                onClick={handleBack}
                className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-600 hover:text-slate-900"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center gap-3">
              {Icon && (
                <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', iconColor)}>
                  <Icon className="w-5 h-5" />
                </div>
              )}
              <div>
                <h1 className="text-2xl md:text-[1.75rem] font-semibold text-slate-900 tracking-tighter">
                  {title}
                </h1>
                {description && (
                  <p className="text-sm md:text-[0.9375rem] text-slate-600">{description}</p>
                )}
              </div>
            </div>
          </div>

          {actions && <div className="flex items-center gap-4">{actions}</div>}
        </div>
      </div>
    </div>
  )
}
