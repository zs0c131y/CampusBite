import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      {Icon && (
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
          <Icon className="h-8 w-8 text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-sm mb-6">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
      {actionLabel && actionHref && !onAction && (
        <Button asChild>
          <a href={actionHref}>{actionLabel}</a>
        </Button>
      )}
    </div>
  )
}
