import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BellOff, CheckCheck, Trash2, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/contexts/NotificationContext";

/** Returns a relative time string like "just now", "2m ago", "1h ago". */
function relativeTime(timestamp) {
  if (!timestamp) return "";
  const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (diff < 10) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const TYPE_ICON = {
  order_update: "🛍️",
};

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    connected,
    markAllRead,
    markOneRead,
    clearAll,
  } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleToggle = () => {
    setOpen((prev) => {
      if (!prev && unreadCount > 0) markAllRead();
      return !prev;
    });
  };

  const handleNotificationClick = (n) => {
    markOneRead(n.id);
    if (n.type === "order_update" && n.data?.orderId) {
      navigate(`/orders/${n.data.orderId}`);
    }
    setOpen(false);
  };

  return (
    <div className="relative">
      {/* Bell button */}
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        className="relative rounded-full border border-transparent hover:border-border/80"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-orange-600 text-[10px] font-bold text-white leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border/80 bg-card/97 shadow-xl z-50 backdrop-blur-sm overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-foreground" />
              <span className="text-sm font-semibold text-foreground">
                Notifications
              </span>
              {/* Connection status pill */}
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                  connected
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {connected ? (
                  <Wifi className="h-2.5 w-2.5" />
                ) : (
                  <WifiOff className="h-2.5 w-2.5" />
                )}
                {connected ? "Live" : "Reconnecting"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={markAllRead}
                    title="Mark all read"
                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={clearAll}
                    title="Clear all"
                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border/40">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <BellOff className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No notifications yet
                </p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">
                  Order updates will appear here in real time
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent/50 ${
                    !n.read ? "bg-orange-50/60" : ""
                  }`}
                >
                  {/* Icon */}
                  <span className="text-xl shrink-0 mt-0.5 leading-none">
                    {TYPE_ICON[n.type] ?? "🔔"}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-sm leading-snug ${!n.read ? "font-semibold text-foreground" : "font-medium text-foreground/90"}`}
                      >
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="shrink-0 mt-1 h-2 w-2 rounded-full bg-orange-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                    {n.data?.orderNumber && (
                      <p className="text-[11px] text-orange-600 font-medium mt-1">
                        Order #{n.data.orderNumber}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {relativeTime(n.timestamp)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
