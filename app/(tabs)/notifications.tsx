import React, { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useTheme, type Theme } from "@/lib/theme";
import { relativeTr } from "@/lib/format";
import { useNotifications, type AppNotification } from "@/lib/notifications-context";
import { Empty, Loading } from "@/components/UI";

function notificationIcon(
  type: AppNotification["type"],
  theme: Theme,
): {
  name: React.ComponentProps<typeof Feather>["name"];
  color: string;
  bg: string;
} {
  switch (type) {
    case "newOffer":
      return { name: "briefcase", color: theme.colors.primary, bg: theme.isDark ? `${theme.colors.primary}25` : "#FFF0E6" };
    case "newMessage":
      return { name: "message-circle", color: theme.colors.accent, bg: theme.isDark ? `${theme.colors.accent}25` : "#E6EDF5" };
    case "offerAccepted":
      return { name: "check-circle", color: theme.colors.success, bg: theme.isDark ? `${theme.colors.success}25` : "#E6F7EF" };
    case "offerRejected":
      return { name: "x-circle", color: theme.colors.danger, bg: theme.isDark ? `${theme.colors.danger}25` : "#FEE9E7" };
    default:
      return { name: "bell", color: theme.colors.subtext, bg: theme.isDark ? theme.colors.border : "#F2F4F7" };
  }
}

export default function NotificationsTab() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { notifications, loading, loadingMore, hasMore, refresh, loadMore, markAllRead } =
    useNotifications();
  const router = useRouter();

  useFocusEffect(
    React.useCallback(() => {
      const timer = setTimeout(() => {
        void markAllRead();
      }, 1500);
      return () => clearTimeout(timer);
    }, [markAllRead]),
  );

  function handlePress(notif: AppNotification) {
    if (!notif.data) return;
    const d = notif.data;
    if (d.screen === "chat" && typeof d.conversationId === "string") {
      router.push(`/chat/${d.conversationId}`);
    } else if (d.screen === "offers") {
      router.push({
        pathname: "/(tabs)/messages",
        params: {
          tab: "offers",
          ...(typeof d.offerId === "string" ? { offerId: d.offerId } : {}),
        },
      });
    }
  }

  return (
    <FlatList
      data={notifications}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={refresh}
          tintColor={theme.colors.primary}
        />
      }
      onEndReached={hasMore ? loadMore : undefined}
      onEndReachedThreshold={0.3}
      ListEmptyComponent={
        loading ? (
          <Loading />
        ) : (
          <Empty
            title="Henüz bildirim yok"
            subtitle="Yeni teklifler, mesajlar ve teklif sonuçları burada görünecek."
          />
        )
      }
      ListFooterComponent={
        loadingMore ? (
          <View style={styles.footer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        ) : null
      }
      renderItem={({ item }) => {
        const icon = notificationIcon(item.type, theme);
        return (
          <Pressable
            onPress={() => handlePress(item)}
            style={[styles.row, !item.read && styles.rowUnread]}
          >
            <View style={[styles.iconWrap, { backgroundColor: icon.bg }]}>
              <Feather name={icon.name} size={20} color={icon.color} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={styles.titleRow}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.title}
                </Text>
                {!item.read && <View style={styles.dot} />}
              </View>
              <Text style={styles.body} numberOfLines={2}>
                {item.body}
              </Text>
              <Text style={styles.time}>{relativeTr(item.createdAt)}</Text>
            </View>
          </Pressable>
        );
      }}
    />
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    list: {
      padding: theme.spacing.md,
      paddingBottom: 100,
      gap: 8,
      flexGrow: 1,
    },
    row: {
      backgroundColor: theme.colors.card,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    rowUnread: {
      borderColor: theme.colors.primary + "40",
      backgroundColor: theme.isDark ? `${theme.colors.primary}12` : "#FFFAF7",
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    title: {
      fontFamily: theme.font.semibold,
      fontSize: 14,
      color: theme.colors.text,
      flex: 1,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
      flexShrink: 0,
    },
    body: {
      fontFamily: theme.font.regular,
      fontSize: 13,
      color: theme.colors.subtext,
      lineHeight: 18,
    },
    time: {
      fontFamily: theme.font.regular,
      fontSize: 11,
      color: theme.colors.subtext,
      marginTop: 2,
    },
    footer: {
      paddingVertical: 16,
      alignItems: "center",
    },
  });
}
