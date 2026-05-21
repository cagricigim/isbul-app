import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { customFetch } from "@workspace/api-client-react";

export type AppNotification = {
  id: string;
  type: "newOffer" | "newMessage" | "offerAccepted" | "offerRejected";
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
};

type ApiResponse = {
  notifications: AppNotification[];
  unreadCount: number;
  nextCursor: string | null;
};

type NotificationsContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  loadingMore: false,
  hasMore: false,
  refresh: async () => {},
  loadMore: async () => {},
  markAllRead: async () => {},
});

export function NotificationsProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const nextCursorRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const safeClearInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const fetchFirstPage = useCallback(
    async (replace: boolean): Promise<void> => {
      if (!enabled) return;
      try {
        const result = await customFetch<ApiResponse>("/api/notifications");
        setUnreadCount(result.unreadCount);
        if (replace) {
          nextCursorRef.current = result.nextCursor;
          setHasMore(result.nextCursor !== null);
          setNotifications(result.notifications);
        } else {
          setNotifications((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const newItems = result.notifications.filter((n) => !existingIds.has(n.id));
            if (newItems.length === 0) return prev;
            return [...newItems, ...prev];
          });
        }
      } catch {
        // silently ignore
      }
    },
    [enabled],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchFirstPage(true);
    setLoading(false);
  }, [fetchFirstPage]);

  const loadMore = useCallback(async () => {
    if (!enabled || loadingMore || !nextCursorRef.current) return;
    setLoadingMore(true);
    try {
      const cursor = encodeURIComponent(nextCursorRef.current);
      const result = await customFetch<ApiResponse>(`/api/notifications?cursor=${cursor}`);
      nextCursorRef.current = result.nextCursor;
      setHasMore(result.nextCursor !== null);
      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const newItems = result.notifications.filter((n) => !existingIds.has(n.id));
        return [...prev, ...newItems];
      });
    } catch {
      // silently ignore
    } finally {
      setLoadingMore(false);
    }
  }, [enabled, loadingMore]);

  const markAllRead = useCallback(async () => {
    try {
      await customFetch("/api/notifications/read-all", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      safeClearInterval();
      setNotifications([]);
      setUnreadCount(0);
      setHasMore(false);
      nextCursorRef.current = null;
      return;
    }
    void refresh();
    safeClearInterval();
    intervalRef.current = setInterval(() => {
      void fetchFirstPage(false);
    }, 30_000);
    return () => {
      safeClearInterval();
    };
  }, [enabled, refresh, fetchFirstPage, safeClearInterval]);

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, loading, loadingMore, hasMore, refresh, loadMore, markAllRead }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
