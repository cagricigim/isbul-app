import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, type Theme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/lib/notifications-context";

function BellButton() {
  const theme = useTheme();
  const styles = useMemo(() => makeBellStyles(theme), [theme]);
  const router = useRouter();
  const { unreadCount } = useNotifications();
  return (
    <Pressable
      onPress={() => router.push("/(tabs)/notifications")}
      style={styles.wrap}
      hitSlop={10}
    >
      <Feather name="bell" size={22} color={theme.colors.text} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function makeBellStyles(theme: Theme) {
  return StyleSheet.create({
    wrap: { marginRight: 14, position: "relative" },
    badge: {
      position: "absolute",
      top: -5,
      right: -7,
      backgroundColor: theme.colors.primary,
      borderRadius: 99,
      minWidth: 16,
      height: 16,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 3,
    },
    badgeText: { fontFamily: theme.font.bold, fontSize: 9, color: "#fff" },
  });
}

export default function TabLayout() {
  const auth = useAuth();
  const theme = useTheme();
  const role = auth.user?.role ?? null;
  const insets = useSafeAreaInsets();

  const tabBarHeight = 56 + (Platform.OS === "android" ? insets.bottom : 0);
  const tabBarPaddingBottom = Platform.OS === "android" ? insets.bottom + 6 : 8;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.subtext,
        tabBarLabelStyle: { fontFamily: theme.font.medium, fontSize: 11 },
        headerStyle: { backgroundColor: theme.colors.bg },
        headerTitleStyle: { fontFamily: theme.font.semibold },
        headerShadowVisible: false,
        tabBarStyle: {
          borderTopColor: theme.colors.border,
          height: tabBarHeight,
          paddingTop: 6,
          paddingBottom: tabBarPaddingBottom,
          backgroundColor: theme.colors.bg,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Ana Sayfa",
          tabBarIcon: ({ color, size }) => <Feather name="home" size={size ?? 22} color={color} />,
          headerRight: () => <BellButton />,
        }}
      />
      <Tabs.Screen
        name="workers"
        options={{
          title: "İşine Bak",
          tabBarIcon: ({ color, size }) => <Feather name="users" size={size ?? 22} color={color} />,
          href: role === "employer" ? "/(tabs)/workers" : null,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: role === "employer" ? "İlanlarım" : "İlanlar",
          tabBarIcon: ({ color, size }) => <Feather name="briefcase" size={size ?? 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="offers"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Mesajlar",
          tabBarIcon: ({ color, size }) => <Feather name="message-circle" size={size ?? 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Bildirimler",
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => <Feather name="user" size={size ?? 22} color={color} />,
        }}
      />
    </Tabs>
  );
}
