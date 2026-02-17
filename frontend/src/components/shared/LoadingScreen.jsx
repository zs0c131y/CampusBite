import { Spinner } from '@/components/ui/spinner'
import { ChefHat } from 'lucide-react'

export function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="flex items-center space-x-2 mb-6">
        <ChefHat className="h-10 w-10 text-primary" />
        <span className="text-2xl font-bold text-primary">CampusBite</span>
      </div>
      <Spinner size="lg" />
      <p className="mt-4 text-sm text-gray-500">Loading...</p>
    </div>
  )
}
