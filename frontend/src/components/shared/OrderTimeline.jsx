import { CheckCircle2, Circle, Clock, Package, ChefHat, Bell, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'

const ORDER_STEPS = [
  { key: 'placed', label: 'Placed', icon: Clock },
  { key: 'accepted', label: 'Accepted', icon: Package },
  { key: 'preparing', label: 'Preparing', icon: ChefHat },
  { key: 'ready', label: 'Ready', icon: Bell },
  { key: 'picked_up', label: 'Picked Up', icon: ShoppingBag },
]

function getStepIndex(status) {
  const index = ORDER_STEPS.findIndex((step) => step.key === status)
  return index >= 0 ? index : -1
}

export function OrderTimeline({ currentStatus }) {
  const isCancelled = currentStatus === 'cancelled' || currentStatus === 'rejected'
  const currentIndex = getStepIndex(currentStatus)

  return (
    <div className="w-full">
      {isCancelled ? (
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center space-x-2 text-red-600">
            <Circle className="h-5 w-5 fill-red-600" />
            <span className="text-sm font-medium capitalize">
              Order {currentStatus}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between w-full">
          {ORDER_STEPS.map((step, index) => {
            const isCompleted = index < currentIndex
            const isCurrent = index === currentIndex
            const isFuture = index > currentIndex
            const StepIcon = step.icon

            return (
              <div key={step.key} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'flex items-center justify-center h-10 w-10 rounded-full border-2 transition-colors',
                      isCompleted && 'bg-green-500 border-green-500 text-white',
                      isCurrent && 'bg-primary border-primary text-primary-foreground',
                      isFuture && 'bg-gray-100 border-gray-300 text-gray-400'
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      'mt-2 text-xs font-medium text-center',
                      isCompleted && 'text-green-600',
                      isCurrent && 'text-primary',
                      isFuture && 'text-gray-400'
                    )}
                  >
                    {step.label}
                  </span>
                </div>

                {index < ORDER_STEPS.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-2 mt-[-1.25rem]',
                      index < currentIndex ? 'bg-green-500' : 'bg-gray-200'
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
