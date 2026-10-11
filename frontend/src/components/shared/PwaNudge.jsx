import { useEffect, useState } from "react";
import { Download, RefreshCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PwaNudge() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    const onBeforeInstallPrompt = (event) => {
      if (typeof event.prompt !== "function") return;
      setDeferredPrompt(event);
      setShowInstall(true);
    };

    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setShowInstall(false);
    };

    const onUpdateReady = (event) => {
      const worker = event.detail?.registration?.waiting;
      if (worker) {
        setWaitingWorker(worker);
        setShowUpdate(true);
      }
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    window.addEventListener("campusbite:pwa-update-ready", onUpdateReady);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      window.removeEventListener("campusbite:pwa-update-ready", onUpdateReady);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome !== "accepted") {
      setShowInstall(false);
    }
    setDeferredPrompt(null);
  };

  const handleUpdate = () => {
    if (!waitingWorker) return;
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
    setShowUpdate(false);
  };

  if (!showInstall && !showUpdate) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showInstall && (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleInstall}
            title="Add CampusBite to your home screen"
          >
            <Download className="h-4 w-4" />
            Install app
          </Button>
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
      )}

      {showUpdate && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleUpdate}
          title="Reload to use the latest version"
        >
          <RefreshCcw className="h-4 w-4" />
          Update app
        </Button>
      )}
    </div>
  );
}
