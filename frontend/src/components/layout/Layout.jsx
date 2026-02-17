import { Navbar } from './Navbar'
import { Toaster } from 'sonner'

export function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <Toaster position="top-right" richColors closeButton />
    </div>
  )
}
