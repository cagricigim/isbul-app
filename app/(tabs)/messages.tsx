import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import {
  getListConversationsQueryOptions,
  getListIncomingOffersQueryOptions,
  getListSentOffersQueryOptions,
  useAcceptOffer,
  useOpenConversation,
  useRejectOffer,
} from "@workspace/api-client-react";
import { Button, Empty, Loading, Muted } from "@/components/UI";
import { useTheme, type Theme } from "@/lib/theme";
import { imageUrl } from "@/lib/auth";
import { useAuth } from "@/lib/auth";
import { offerStatusLabel, relativeTr } from "@/lib/format";
import { useBadgeFocus } from "@/lib/badge-context";

type Tab = "messages" | "offers";

const OFFER_CARD_ESTIMATED_HEIGHT = 160;

function makeScrollHandlers(listRef: React.RefObject<FlatList | null>) {
  function scrollToIdx(index: number) {
    listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.3 });
  }
  function onScrollToIndexFailed({ index, averageItemLength }: { index: number; averageItemLength: number }) {
    const offset = (averageItemLength || OFFER_CARD_ESTIMATED_HEIGHT) * index;
    listRef.current?.scrollToOffset({ offset, animated: false });
    setTimeout(() => scrollToIdx(index), 200);
  }
  return { scrollToIdx, onScrollToIndexFailed };
}

export default function MessagesTab() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const params = useLocalSearchParams<{ tab?: string; offerId?: string }>();
  const [activeTab, setActiveTab] = useState<Tab>(
    params.tab === "offers" ? "offers" : "messages",
  );
  const auth = useAuth();
  const { setSuppressedCategory } = useBadgeFocus();
  const [isFocused, setIsFocused] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      setIsFocused(true);
      return () => {
        setIsFocused(false);
        setSuppressedCategory("none");
      };
    }, [setSuppressedCategory]),
  );

  useEffect(() => {
    if (params.tab === "offers") {
      setActiveTab("offers");
    }
  }, [params.tab, params.offerId]);

  useEffect(() => {
    if (!isFocused) return;
    setSuppressedCategory(activeTab === "messages" ? "messages" : "offers");
  }, [isFocused, activeTab, setSuppressedCategory]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View style={styles.topTabBar}>
        <Pressable
          style={[styles.topTab, activeTab === "messages" && styles.topTabActive]}
          onPress={() => setActiveTab("messages")}
        >
          <Text style={[styles.topTabText, activeTab === "messages" && styles.topTabTextActive]}>
            Mesajlar
          </Text>
        </Pressable>
        <Pressable
          style={[styles.topTab, activeTab === "offers" && styles.topTabActive]}
          onPress={() => setActiveTab("offers")}
        >
          <Text style={[styles.topTabText, activeTab === "offers" && styles.topTabTextActive]}>
            Teklifler
          </Text>
          <OfferBadge styles={styles} />
        </Pressable>
      </View>

      {activeTab === "messages" ? (
        <ConversationsList styles={styles} theme={theme} />
      ) : auth.user?.role === "employer" ? (
        <SentOffers highlightOfferId={params.offerId} styles={styles} theme={theme} />
      ) : (
        <IncomingOffers highlightOfferId={params.offerId} styles={styles} theme={theme} />
      )}
    </View>
  );
}

function OfferBadge({ styles }: { styles: ReturnType<typeof makeStyles> }) {
  const auth = useAuth();
  const q = useQuery(getListIncomingOffersQueryOptions());
  if (auth.user?.role !== "worker") return null;
  const pending = (q.data ?? []).filter((o) => o.status === "pending").length;
  if (!pending) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{pending}</Text>
    </View>
  );
}

function ConversationsList({ styles, theme }: { styles: ReturnType<typeof makeStyles>; theme: Theme }) {
  const router = useRouter();
  const q = useQuery({
    ...getListConversationsQueryOptions(),
    refetchInterval: 5000,
  });
  const items = q.data ?? [];

  const renderItem = useCallback(
    ({ item }: { item: typeof items[number] }) => (
      <Pressable onPress={() => router.push(`/chat/${item.id}`)} style={styles.row}>
        {item.otherPhotoUrl ? (
          <Image source={{ uri: imageUrl(item.otherPhotoUrl) }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPh]}>
            <Feather name="user" size={20} color={theme.colors.subtext} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={styles.name} numberOfLines={1}>
              {item.otherDisplayName}
            </Text>
            {item.otherIsPremium ? (
              <View style={styles.premiumDot}>
                <Feather name="check" size={8} color="#fff" />
              </View>
            ) : null}
            {item.offerCount > 0 ? (
              <View style={styles.offerBadgeSmall}>
                <Text style={styles.offerBadgeSmallText}>{item.offerCount} teklif</Text>
              </View>
            ) : null}
          </View>
          {item.jobTitle ? (
            <Text style={styles.jobLabel} numberOfLines={1}>
              {item.jobTitle}
            </Text>
          ) : null}
          <Text style={styles.preview} numberOfLines={1}>
            {item.lastMessage ?? "Henüz mesaj yok"}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          {item.lastMessageAt ? (
            <Text style={styles.time}>{relativeTr(item.lastMessageAt)}</Text>
          ) : null}
          {item.unreadCount > 0 ? (
            <View style={styles.unread}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    ),
    [router, styles, theme],
  );

  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.id}
      contentContainerStyle={styles.list}
      renderItem={renderItem}
      maxToRenderPerBatch={10}
      initialNumToRender={10}
      windowSize={10}
      ListEmptyComponent={
        q.isLoading ? (
          <Loading />
        ) : (
          <Empty
            title="Henüz mesaj yok"
            subtitle="Yeni bir sohbet başlatmak için iş arayanlara veya işverenlere mesaj gönderin."
          />
        )
      }
    />
  );
}

function IncomingOffers({ highlightOfferId, styles, theme }: { highlightOfferId?: string; styles: ReturnType<typeof makeStyles>; theme: Theme }) {
  const router = useRouter();
  const qc = useQueryClient();
  const q = useQuery(getListIncomingOffersQueryOptions());
  const accept = useAcceptOffer();
  const reject = useRejectOffer();
  const open = useOpenConversation();
  const items = q.data ?? [];
  const listRef = useRef<FlatList>(null);
  const scrolledRef = useRef(false);
  const { scrollToIdx, onScrollToIndexFailed } = makeScrollHandlers(listRef);

  const scrollToHighlight = useCallback(() => {
    if (!highlightOfferId || scrolledRef.current || items.length === 0) return;
    const idx = items.findIndex((i) => i.id === highlightOfferId);
    if (idx === -1) return;
    scrolledRef.current = true;
    scrollToIdx(idx);
  }, [highlightOfferId, items]);

  useEffect(() => { scrolledRef.current = false; }, [highlightOfferId]);
  useEffect(() => { if (items.length > 0) scrollToHighlight(); }, [items, scrollToHighlight]);

  const onAccept = useCallback(async (id: string) => {
    try {
      await accept.mutateAsync({ offerId: id });
      await qc.invalidateQueries({ queryKey: getListIncomingOffersQueryOptions().queryKey });
    } catch {
      Alert.alert("Hata", "Teklif kabul edilemedi.");
    }
  }, [accept, qc]);

  const onReject = useCallback(async (id: string) => {
    Alert.alert("Reddet", "Bu teklifi reddetmek istediğinizden emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Reddet",
        style: "destructive",
        onPress: async () => {
          await reject.mutateAsync({ offerId: id });
          await qc.invalidateQueries({ queryKey: getListIncomingOffersQueryOptions().queryKey });
        },
      },
    ]);
  }, [reject, qc]);

  const onMessage = useCallback(async (employerUserId?: string) => {
    if (!employerUserId) { Alert.alert("Hata", "İşveren bulunamadı."); return; }
    try {
      const conv = await open.mutateAsync({ data: { participantUserId: employerUserId } });
      router.push(`/chat/${conv.id}`);
    } catch {
      Alert.alert("Hata", "Sohbet açılamadı.");
    }
  }, [open, router]);

  const renderItem = useCallback(
    ({ item }: { item: typeof items[number] }) => {
      const status = offerStatusLabel(item.status);
      const isHighlighted = item.id === highlightOfferId;
      return (
        <View style={[styles.card, isHighlighted && styles.cardHighlighted]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={styles.cardTitle}>{item.employerName}</Text>
            <Text style={[styles.cardStatus, { color: status.color }]}>{status.text}</Text>
          </View>
          {item.jobTitle ? <Text style={styles.cardJob}>{item.jobTitle}</Text> : null}
          <Text style={styles.cardMessage}>{item.message}</Text>
          <Muted>{relativeTr(item.createdAt)}</Muted>
          {item.status === "pending" ? (
            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              <View style={{ flex: 1 }}>
                <Button title="Kabul et" onPress={() => onAccept(item.id)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Reddet" variant="ghost" onPress={() => onReject(item.id)} />
              </View>
            </View>
          ) : null}
          {item.status === "accepted" ? (
            <Button title="Mesaj gönder" variant="secondary" onPress={() => onMessage(item.employerUserId)} style={{ marginTop: 8 }} />
          ) : null}
        </View>
      );
    },
    [highlightOfferId, styles, onAccept, onReject, onMessage],
  );

  return (
    <FlatList
      ref={listRef}
      data={items}
      keyExtractor={(i) => i.id}
      contentContainerStyle={styles.offerList}
      onScrollToIndexFailed={onScrollToIndexFailed}
      renderItem={renderItem}
      maxToRenderPerBatch={10}
      initialNumToRender={8}
      windowSize={8}
      ListEmptyComponent={
        q.isLoading ? <Loading /> : <Empty title="Henüz teklif yok" subtitle="İşverenler size doğrudan teklif gönderecek." />
      }
      refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} />}
    />
  );
}

function SentOffers({ highlightOfferId, styles, theme: _theme }: { highlightOfferId?: string; styles: ReturnType<typeof makeStyles>; theme: Theme }) {
  const q = useQuery(getListSentOffersQueryOptions());
  const items = q.data ?? [];
  const listRef = useRef<FlatList>(null);
  const scrolledRef = useRef(false);
  const { scrollToIdx, onScrollToIndexFailed } = makeScrollHandlers(listRef);

  const scrollToHighlight = useCallback(() => {
    if (!highlightOfferId || scrolledRef.current || items.length === 0) return;
    const idx = items.findIndex((i) => i.id === highlightOfferId);
    if (idx === -1) return;
    scrolledRef.current = true;
    scrollToIdx(idx);
  }, [highlightOfferId, items]);

  useEffect(() => { scrolledRef.current = false; }, [highlightOfferId]);
  useEffect(() => { if (items.length > 0) scrollToHighlight(); }, [items, scrollToHighlight]);

  const renderItem = useCallback(
    ({ item }: { item: typeof items[number] }) => {
      const status = offerStatusLabel(item.status);
      const isHighlighted = item.id === highlightOfferId;
      return (
        <View style={[styles.card, isHighlighted && styles.cardHighlighted]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={styles.cardTitle}>{item.workerName ?? "İş Arayan"}</Text>
            <Text style={[styles.cardStatus, { color: status.color }]}>{status.text}</Text>
          </View>
          {item.jobTitle ? <Text style={styles.cardJob}>{item.jobTitle}</Text> : null}
          <Text style={styles.cardMessage}>{item.message}</Text>
          <Muted>{relativeTr(item.createdAt)}</Muted>
        </View>
      );
    },
    [highlightOfferId, styles],
  );

  return (
    <FlatList
      ref={listRef}
      data={items}
      keyExtractor={(i) => i.id}
      contentContainerStyle={styles.offerList}
      onScrollToIndexFailed={onScrollToIndexFailed}
      renderItem={renderItem}
      maxToRenderPerBatch={10}
      initialNumToRender={8}
      windowSize={8}
      ListEmptyComponent={
        q.isLoading ? <Loading /> : <Empty title="Henüz teklif yok" subtitle="İş arayanlara mesaj göndererek teklif yapabilirsiniz." />
      }
      refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} />}
    />
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    topTabBar: {
      flexDirection: "row",
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.bg,
    },
    topTab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    topTabActive: { borderBottomColor: theme.colors.primary },
    topTabText: { fontFamily: theme.font.medium, fontSize: 14, color: theme.colors.subtext },
    topTabTextActive: { color: theme.colors.primary, fontFamily: theme.font.semibold },
    badge: {
      backgroundColor: theme.colors.danger,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      paddingHorizontal: 4,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeText: { color: "#fff", fontFamily: theme.font.bold, fontSize: 10 },
    list: { padding: theme.spacing.md },
    offerList: { padding: theme.spacing.lg, gap: 10, paddingBottom: 100 },
    row: {
      backgroundColor: theme.colors.card,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      marginBottom: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.colors.border },
    avatarPh: { alignItems: "center", justifyContent: "center" },
    name: { fontFamily: theme.font.semibold, fontSize: 14, color: theme.colors.text },
    preview: { fontFamily: theme.font.regular, fontSize: 13, color: theme.colors.subtext, marginTop: 2 },
    time: { fontFamily: theme.font.regular, fontSize: 11, color: theme.colors.subtext },
    unread: {
      backgroundColor: theme.colors.primary,
      minWidth: 20,
      height: 20,
      paddingHorizontal: 6,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    unreadText: { color: "#fff", fontFamily: theme.font.bold, fontSize: 11 },
    premiumDot: {
      backgroundColor: theme.colors.premium,
      width: 14,
      height: 14,
      borderRadius: 7,
      alignItems: "center",
      justifyContent: "center",
    },
    jobLabel: {
      fontFamily: theme.font.regular,
      fontSize: 12,
      color: theme.colors.primary,
      marginTop: 1,
    },
    offerBadgeSmall: {
      backgroundColor: `${theme.colors.primary}18`,
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 6,
    },
    offerBadgeSmallText: {
      fontFamily: theme.font.medium,
      fontSize: 10,
      color: theme.colors.primary,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      gap: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      marginBottom: 10,
    },
    cardHighlighted: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.isDark ? `${theme.colors.primary}15` : "#FFFAF7",
    },
    cardTitle: { fontFamily: theme.font.bold, fontSize: 15, color: theme.colors.text },
    cardJob: { fontFamily: theme.font.medium, fontSize: 13, color: theme.colors.primary },
    cardMessage: { fontFamily: theme.font.regular, fontSize: 14, color: theme.colors.text },
    cardStatus: { fontFamily: theme.font.semibold, fontSize: 12 },
  });
}
