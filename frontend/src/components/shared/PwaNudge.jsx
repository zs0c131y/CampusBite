import { useEffect, useState } from 'react'
import { Download, RefreshCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PwaNudge() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState(null)
  const [showUpdate, setShowUpdate] = useState(false)

  useEffect(() => {
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault()
      setDeferredPrompt(event)
      setShowInstall(true)
    }

    const onAppInstalled = () => {
      setDeferredPrompt(null)
      setShowInstall(false)
    }

    const onUpdateReady = (event) => {
      const worker = event.detail?.registration?.waiting
      if (worker) {
        setWaitingWorker(worker)
        setShowUpdate(true)
      }
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)
    window.addEventListener('campusbite:pwa-update-ready', onUpdateReady)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
      window.removeEventListener('campusbite:pwa-update-ready', onUpdateReady)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const result = await deferredPrompt.userChoice
    if (result.outcome !== 'accepted') {
      setShowInstall(false)
    }
    setDeferredPrompt(null)
  }

  const handleUpdate = () => {
    if (!waitingWorker) return
    waitingWorker.postMessage({ type: 'SKIP_WAITING' })
    setShowUpdate(false)
  }

  if (!showInstall && !showUpdate) return null

  return (
    <div className="fixed bottom-4 right-4 z-[70] w-[min(92vw,22rem)] space-y-2">
      {showInstall && (
        <div className="rounded-2xl border border-border/80 bg-card/95 p-3.5 shadow-xl backdrop-blur-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">Install CampusBite</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add to home screen for a faster app-like experience.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowInstall(false)}
              aria-label="Dismiss install prompt"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Button className="mt-3 w-full gap-2" onClick={handleInstall}>
            <Download className="h-4 w-4" />
            Install App
          </Button>
        </div>
      )}

      {showUpdate && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50/95 p-3.5 shadow-xl backdrop-blur-sm">
          <p className="text-sm font-semibold text-orange-900">Update Available</p>
          <p className="text-xs text-orange-800 mt-0.5">
            A newer version is ready. Reload to apply updates.
          </p>
          <Button className="mt-3 w-full gap-2" onClick={handleUpdate}>
            <RefreshCcw className="h-4 w-4" />
            Update Now
          </Button>
        </div>
      )}
    </div>
  )
}
