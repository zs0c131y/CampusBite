import { Navbar } from './Navbar'
import { Toaster } from 'sonner'
import { cn } from '@/lib/utils'

export function Layout({ children, hideNavbar = false, fluid = false }) {
  return (
    <div className="min-h-screen bg-background">
      {!hideNavbar && <Navbar />}
      <main
        className={cn(
          fluid
            ? 'w-full'
            : 'mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8'
        )}
      >
        {children}
      </main>
      <Toaster position="top-right" richColors closeButton />
    </div>
  )
}
