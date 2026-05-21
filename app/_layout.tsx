import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Feather } from "@expo/vector-icons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthContext, useAuth, useAuthState } from "@/lib/auth";
import { ThemeProvider, useTheme, useThemeMode } from "@/lib/theme";
import { initializeRevenueCat, SubscriptionProvider } from "@/lib/revenuecat";
import { StatusBar } from "expo-status-bar";
import {
  customFetch,
  getListConversationsQueryOptions,
  getListIncomingOffersQueryOptions,
  useGetNotificationPreferences,
} from "@workspace/api-client-react";
import type { Conversation, Offer, NotificationPreferences } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { setBadgeCount } from "@/lib/badge";
import { BadgeFocusProvider, useBadgeFocus } from "@/lib/badge-context";
import { NotificationsProvider, useNotifications } from "@/lib/notifications-context";

SplashScreen.preventAutoHideAsync();

try {
  initializeRevenueCat();
} catch (err: unknown) {
  console.warn("[RevenueCat] Başlatılamadı:", err);
}

// ---- Push notification support (safe: silently disabled in Expo Go) ----
type AnyNotificationsModule = {
  setNotificationHandler: (h: unknown) => void;
  getPermissionsAsync: () => Promise<{ status: string }>;
  requestPermissionsAsync: () => Promise<{ status: string }>;
  getExpoPushTokenAsync: () => Promise<{ data: string }>;
  getLastNotificationResponseAsync: () => Promise<unknown>;
  addNotificationResponseReceivedListener: (cb: (r: { notification: { request: { content: { data: unknown } } } }) => void) => { remove: () => void };
  setBadgeCountAsync: (count: number) => Promise<boolean>;
  setNotificationChannelAsync?: (channelId: string, channel: {
    name: string;
    importance: number;
    sound?: string | null;
    vibrationPattern?: number[] | null;
  }) => Promise<unknown>;
};

const notifPrefsStore: Partial<NotificationPreferences> = {};

function getSoundPref(notifType: string | undefined): boolean {
  if (notifType === "newOffers") return notifPrefsStore.notifNewOffersSound !== false;
  if (notifType === "newMessages") return notifPrefsStore.notifNewMessagesSound !== false;
  if (notifType === "offerStatusChange") return notifPrefsStore.notifOfferStatusChangeSound !== false;
  return true;
}

const Notifs: AnyNotificationsModule | null = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const m = require("expo-notifications") as AnyNotificationsModule;
    m.setNotificationHandler({
      handleNotification: async (notification: { request: { content: { data?: Record<string, unknown> } } }) => {
        const notifType = notification?.request?.content?.data?.notifType as string | undefined;
        return {
          shouldShowAlert: true,
          shouldPlaySound: getSoundPref(notifType),
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      },
    });
    return m;
  } catch {
    return null;
  }
})();

async function registerPushToken(): Promise<void> {
  if (!Notifs) return;
  try {
    const { status: existing } = await Notifs.getPermissionsAsync();
    let status = existing;
    if (existing !== "granted") {
      const { status: requested } = await Notifs.requestPermissionsAsync();
      status = requested;
    }
    if (status !== "granted") return;
    const { data: pushToken } = await Notifs.getExpoPushTokenAsync();
    await customFetch("/api/me/push-token", {
      method: "POST",
      body: JSON.stringify({ token: pushToken }),
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // ignore — notifications not critical
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5_000,
    },
  },
});

function RootLayoutNav() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.bg },
        headerTitleStyle: { fontFamily: theme.font.semibold },
        headerShadowVisible: false,
        headerTintColor: theme.colors.text,
        contentStyle: { backgroundColor: theme.colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="onboard" options={{ headerShown: false }} />
      <Stack.Screen name="worker/[id]" options={{ title: "İş Arayan Profili" }} />
      <Stack.Screen name="job/new" options={{ title: "Yeni İlan" }} />
      <Stack.Screen name="job/[id]" options={{ title: "İlan" }} />
      <Stack.Screen name="chat/[id]" options={{ title: "Sohbet" }} />
      <Stack.Screen name="premium" options={{ title: "Premium Üyelik" }} />
      <Stack.Screen name="boost" options={{ title: "Profilini Öne Çıkar" }} />
      <Stack.Screen name="views" options={{ title: "Profilimi Görüntüleyenler" }} />
      <Stack.Screen name="settings" options={{ title: "Ayarlar" }} />
      <Stack.Screen name="settings/notifications" options={{ title: "Bildirimler" }} />
      <Stack.Screen name="profile/edit-worker" options={{ title: "Profili Düzenle" }} />
      <Stack.Screen name="profile/edit-employer" options={{ title: "Profili Düzenle" }} />
    </Stack>
  );
}

function navigateToNotification(
  router: ReturnType<typeof useRouter>,
  data: unknown,
) {
  if (!data || typeof data !== "object") return;
  const d = data as Record<string, unknown>;
  if (d.screen === "chat" && typeof d.conversationId === "string") {
    router.push(`/chat/${d.conversationId}`);
  } else if (d.screen === "offers" || d.screen === "messages") {
    router.push("/(tabs)/messages");
  }
}

function PushNotificationManager() {
  const auth = useAuth();
  const router = useRouter();
  const listenerRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    registerAndroidChannels();
  }, []);

  useEffect(() => {
    if (!auth.token || !Notifs) return;

    void registerPushToken();

    void Notifs.getLastNotificationResponseAsync()
      .then((res) => {
        if (!res) return;
        const r = res as { notification: { request: { content: { data: unknown } } } };
        navigateToNotification(router, r.notification.request.content.data);
      })
      .catch(() => {});

    listenerRef.current = Notifs.addNotificationResponseReceivedListener((res) => {
      navigateToNotification(router, res.notification.request.content.data);
    });

    return () => {
      listenerRef.current?.remove();
    };
  }, [auth.token, router]);

  return null;
}

function BadgeManager() {
  const auth = useAuth();
  const isWorker = auth.user?.role === "worker";
  const { suppressedCategory } = useBadgeFocus();
  const { unreadCount: unreadNotifications } = useNotifications();

  const conversations = useQuery({
    ...getListConversationsQueryOptions(),
    refetchInterval: 30_000,
    enabled: !!auth.token,
  });

  const offers = useQuery({
    ...getListIncomingOffersQueryOptions(),
    refetchInterval: 30_000,
    enabled: !!auth.token && isWorker,
  });

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (!auth.token) return;
    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (appStateRef.current !== "active" && nextState === "active") {
        void conversations.refetch();
        if (isWorker) void offers.refetch();
      }
      appStateRef.current = nextState;
    });
    return () => subscription.remove();
  }, [auth.token, isWorker, conversations.refetch, offers.refetch]);

  useEffect(() => {
    if (!auth.token) {
      setBadgeCount(0);
      return;
    }
    const unreadMessages =
      suppressedCategory === "messages"
        ? 0
        : (conversations.data as Conversation[] | undefined ?? []).reduce(
            (sum, c) => sum + (c.unreadCount ?? 0),
            0,
          );
    const pendingOffers =
      !isWorker || suppressedCategory === "offers"
        ? 0
        : (offers.data as Offer[] | undefined ?? []).filter(
            (o) => o.status === "pending",
          ).length;
    setBadgeCount(unreadMessages + pendingOffers + unreadNotifications);
  }, [
    auth.token,
    conversations.data,
    offers.data,
    isWorker,
    suppressedCategory,
    unreadNotifications,
  ]);

  return null;
}

function registerAndroidChannels() {
  if (!Notifs?.setNotificationChannelAsync) return;
  const types = [
    { key: "new-offers", name: "Yeni Teklifler" },
    { key: "new-messages", name: "Yeni Mesajlar" },
    { key: "offer-status-change", name: "Teklif Sonuçları" },
  ];
  const variants: Array<{ suffix: string; sound: string | null; vibrationPattern: number[] | null }> = [
    { suffix: "sv", sound: "default", vibrationPattern: [0, 250, 250, 250] },
    { suffix: "s", sound: "default", vibrationPattern: null },
    { suffix: "v", sound: null, vibrationPattern: [0, 250, 250, 250] },
    { suffix: "silent", sound: null, vibrationPattern: null },
  ];
  for (const type of types) {
    for (const variant of variants) {
      void Notifs!.setNotificationChannelAsync!(`${type.key}-${variant.suffix}`, {
        name: `${type.name}`,
        importance: 4,
        sound: variant.sound,
        vibrationPattern: variant.vibrationPattern,
      }).catch(() => {});
    }
  }
}

async function syncTimezone(token: string | null): Promise<void> {
  if (!token) return;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    await customFetch("/api/me/timezone", {
      method: "PATCH",
      body: JSON.stringify({ timezone: tz }),
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // non-critical — ignore failures silently
  }
}

function TimezoneSync() {
  const auth = useAuth();
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    void syncTimezone(auth.token);
  }, [auth.token]);

  useEffect(() => {
    if (!auth.token) return;
    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (appStateRef.current !== "active" && nextState === "active") {
        void syncTimezone(auth.token);
      }
      appStateRef.current = nextState;
    });
    return () => subscription.remove();
  }, [auth.token]);

  return null;
}

function NotificationPrefsSync() {
  const auth = useAuth();
  const { data: prefs } = useGetNotificationPreferences({ query: { enabled: !!auth.token, queryKey: ["notif-prefs"] } });
  useEffect(() => {
    if (!prefs) return;
    Object.assign(notifPrefsStore, prefs);
  }, [prefs]);
  return null;
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const auth = useAuthState();
  return (
    <AuthContext.Provider value={auth}>
      <BadgeFocusProvider>
        <NotificationsProvider enabled={!!auth.token}>
          <PushNotificationManager />
          <BadgeManager />
          <TimezoneSync />
          <NotificationPrefsSync />
          {children}
        </NotificationsProvider>
      </BadgeFocusProvider>
    </AuthContext.Provider>
  );
}

function ThemedRoot() {
  const theme = useTheme();
  const { isDark } = useThemeMode();
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <AuthGate>
        <StatusBar style={isDark ? "light" : "dark"} backgroundColor={theme.colors.bg} translucent={false} />
        <RootLayoutNav />
      </AuthGate>
    </GestureHandlerRootView>
  );
}

function ThemedSafeAreaProvider({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <SafeAreaProvider style={{ backgroundColor: theme.colors.bg }}>
      {children}
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  // Android is case-sensitive for font family names. The Feather.ttf has embedded
  // name 'Feather' (capital F), but @expo/vector-icons createIconSet registers it
  // as 'feather' (lowercase) for fontFamily. On Android these must match exactly.
  // We load the font directly from local assets (no pnpm symlinks) with the explicit
  // key 'feather' so Android's font registry lookup succeeds.
  const [iconsReady, setIconsReady] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      feather: require("../assets/fonts/Feather.ttf"),
    })
      .then(() => setIconsReady(true))
      .catch(() => setIconsReady(true));
  }, []);

  const ready = (fontsLoaded || !!fontError) && iconsReady;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) return null;

  return (
    <ThemeProvider>
      <ThemedSafeAreaProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <SubscriptionProvider>
              <ThemedRoot />
            </SubscriptionProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </ThemedSafeAreaProvider>
    </ThemeProvider>
  );
}
