import type { HTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface LoadingSpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

/**
 * Reusable Loading Spinner Component
 */
export function LoadingSpinner({ size = 'md', text, className }: LoadingSpinnerProps) {
  const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={cn('animate-spin text-slate-600', sizeStyles[size])} />
      {text && <p className="text-slate-600 text-sm">{text}</p>}
    </div>
  )
}
