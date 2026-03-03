import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getAccessToken } from "@/lib/authStorage";

const NotificationContext = createContext(null);

const MAX_NOTIFICATIONS = 50;
const BASE_RECONNECT_DELAY_MS = 1_500;
const MAX_RECONNECT_DELAY_MS = 30_000;

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [connected, setConnected] = useState(false);
  /** Most recent order_update event — watched by OrderTrackingPage for instant refresh */
  const [latestOrderEvent, setLatestOrderEvent] = useState(null);

  const eventSourceRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const mountedRef = useRef(true);

  const addNotification = useCallback((payload) => {
    setNotifications((prev) =>
      [
        { ...payload, id: `${Date.now()}-${Math.random()}`, read: false },
        ...prev,
      ].slice(0, MAX_NOTIFICATIONS),
    );
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    const token = getAccessToken();
    if (!token) return;

    // Close any existing connection before opening a new one
    eventSourceRef.current?.close();

    const url = `/api/notifications/subscribe?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);

    es.onopen = () => {
      if (!mountedRef.current) return;
      setConnected(true);
      reconnectAttemptsRef.current = 0;
    };

    es.onmessage = (event) => {
      if (!mountedRef.current) return;
      let payload;
      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }

      if (payload.type === "connected") return;

      addNotification(payload);

      if (payload.type === "order_update") {
        setLatestOrderEvent(payload);
        toast(payload.title, {
          description: payload.message,
          duration: 5000,
        });
      }
    };

    es.onerror = () => {
      if (!mountedRef.current) return;
      es.close();
      setConnected(false);

      const delay = Math.min(
        MAX_RECONNECT_DELAY_MS,
        BASE_RECONNECT_DELAY_MS * 2 ** reconnectAttemptsRef.current,
      );
      reconnectAttemptsRef.current += 1;

      reconnectTimerRef.current = setTimeout(() => {
        if (mountedRef.current && isAuthenticated) connect();
      }, delay);
    };

    eventSourceRef.current = es;
  }, [isAuthenticated, addNotification]);

  useEffect(() => {
    mountedRef.current = true;
    if (isAuthenticated) {
      connect();
    } else {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      clearTimeout(reconnectTimerRef.current);
      setConnected(false);
      setNotifications([]);
    }

    return () => {
      mountedRef.current = false;
      eventSourceRef.current?.close();
      clearTimeout(reconnectTimerRef.current);
    };
  }, [isAuthenticated, connect]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markOneRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        connected,
        latestOrderEvent,
        markAllRead,
        markOneRead,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context)
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  return context;
};
