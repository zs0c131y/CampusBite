import { Toaster } from "sonner";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { Check, X, Info, TriangleAlert, LoaderCircle } from "lucide-react";

export function CampusToaster() {
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches,
  );
  const { pathname } = useLocation();
  const { getItemCount } = useCart();
  const hasCartDock = /^\/stores\/[^/]+$/.test(pathname) && getItemCount() > 0;
  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = (event) => setIsMobile(event.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return (
    <Toaster
      className="campus-toaster"
      theme="light"
      position={isMobile ? "top-center" : "bottom-right"}
      offset={
        isMobile
          ? {
              top: "calc(96px + env(safe-area-inset-top))",
              left: 16,
              right: 16,
            }
          : { bottom: hasCartDock ? 104 : 24, right: 24 }
      }
      mobileOffset={{
        top: "calc(96px + env(safe-area-inset-top))",
        left: 16,
        right: 16,
      }}
      visibleToasts={3}
      gap={12}
      duration={4500}
      closeButton
      icons={{
        success: <Check size={18} strokeWidth={2.5} />,
        error: <X size={18} strokeWidth={2.5} />,
        info: <Info size={18} />,
        warning: <TriangleAlert size={18} />,
        loading: <LoaderCircle size={18} className="animate-spin" />,
        close: <X size={14} />,
      }}
      toastOptions={{
        classNames: {
          toast: "campus-toast",
          title: "campus-toast-title",
          description: "campus-toast-description",
        },
        closeButtonAriaLabel: "Dismiss notification",
      }}
    />
  );
}
