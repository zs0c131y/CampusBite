import { Navbar } from './Navbar'
import { Toaster } from 'sonner'
import { cn } from '@/lib/utils'

export function Layout({ children, hideNavbar = false, fluid = false }) {
  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-24 left-[6%] h-56 w-56 rounded-full bg-orange-200/18 blur-3xl" />
        <div className="absolute bottom-[-6rem] right-[4%] h-64 w-64 rounded-full bg-amber-300/14 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        {!hideNavbar && <Navbar />}
        <main
          className={cn(
            'flex-1',
            fluid
              ? 'w-full'
              : 'mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8'
          )}
        >
          {children}
        </main>
        <footer className="border-t border-border/80 bg-white/70">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-center px-4 py-5 text-sm sm:px-6 lg:px-8">
            <p className="text-muted-foreground">
              Built by{' '}
              <a
                href="https://adarshg.dev"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-foreground underline-offset-4 transition-colors hover:text-orange-700 hover:underline"
              >
                Adarsh Gupta
              </a>
            </p>
          </div>
        </footer>
      </div>
      <Toaster position="top-right" richColors closeButton />
    </div>
  )
}
