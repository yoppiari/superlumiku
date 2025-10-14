import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated'
}

/**
 * Reusable Card Component
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', className, children, ...props }, ref) => {
    const baseStyles = 'bg-white rounded-xl'

    const variantStyles = {
      default: 'border border-slate-200',
      bordered: 'border-2 border-slate-200',
      elevated: 'shadow-lg',
    }

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('p-6 border-b border-slate-200', className)}
        {...props}
      />
    )
  }
)

CardHeader.displayName = 'CardHeader'

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn('text-xl font-semibold text-slate-900 tracking-tighter', className)}
        {...props}
      />
    )
  }
)

CardTitle.displayName = 'CardTitle'

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('p-6', className)} {...props} />
  }
)

CardContent.displayName = 'CardContent'

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('p-6 border-t border-slate-200', className)}
        {...props}
      />
    )
  }
)

CardFooter.displayName = 'CardFooter'
