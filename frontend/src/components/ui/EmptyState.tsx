import type { HTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

/**
 * Reusable Empty State Component
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center py-12 text-center', className)}
      {...props}
    >
      {Icon && <Icon className="w-12 h-12 md:w-16 md:h-16 text-slate-300 mb-4" />}
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      {description && <p className="text-slate-600 mb-6 max-w-md">{description}</p>}
      {action && action}
    </div>
  )
}
