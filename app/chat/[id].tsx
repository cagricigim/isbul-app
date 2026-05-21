import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import {
  getListConversationsQueryOptions,
  getListMessagesQueryOptions,
  useSendMessage,
  useMarkConversationRead,
  type Message,
  type Conversation,
} from "@workspace/api-client-react";
import { useTheme, type Theme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { formatTimeTr } from "@/lib/format";

export default function ChatScreen() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const auth = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const send = useSendMessage();
  const markRead = useMarkConversationRead();
  const [text, setText] = useState("");
  const listRef = useRef<FlatList<Message>>(null);
  const inputRef = useRef<TextInput>(null);
  const markReadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevLengthRef = useRef(0);

  const convsQ = useQuery(getListConversationsQueryOptions());
  const convCtx = convsQ.data?.find((c) => c.id === String(id));

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const timer = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(timer);
  }, []);

  const queryOpts = useMemo(
    () => getListMessagesQueryOptions(String(id)),
    [id],
  );

  const q = useQuery({
    ...queryOpts,
    refetchInterval: 3500,
  });

  useEffect(() => {
    const convQueryKey = getListConversationsQueryOptions().queryKey;
    qc.setQueryData(convQueryKey, (prev: Conversation[] | undefined) => {
      if (!prev) return prev;
      return prev.map((c) =>
        c.id === String(id) ? { ...c, unreadCount: 0 } : c,
      );
    });

    if (q.data?.length) {
      if (markReadTimerRef.current !== null) {
        clearTimeout(markReadTimerRef.current);
      }
      markReadTimerRef.current = setTimeout(() => {
        markReadTimerRef.current = null;
        markRead.mutateAsync({ conversationId: String(id) }).then(() => {
          void qc.invalidateQueries({ queryKey: convQueryKey });
        }).catch(() => {});
      }, 1000);
    }

    return () => {
      if (markReadTimerRef.current !== null) {
        clearTimeout(markReadTimerRef.current);
        markReadTimerRef.current = null;
      }
    };
  }, [q.data?.length, id]);

  useEffect(() => {
    const len = q.data?.length ?? 0;
    if (len > prevLengthRef.current) {
      prevLengthRef.current = len;
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }, [q.data?.length]);

  const onSend = async () => {
    const t = text.trim();
    if (!t) return;
    setText("");
    try {
      await send.mutateAsync({ conversationId: String(id), data: { text: t } });
      await qc.invalidateQueries({ queryKey: queryOpts.queryKey });
    } catch (e: unknown) {
      setText(t);
      const apiMsg = (e as { data?: { error?: string } } | null)?.data?.error;
      Alert.alert("Hata", apiMsg || "Mesaj gönderilemedi. Lütfen tekrar deneyin.");
    }
  };

  const renderItem = useCallback(({ item }: { item: Message }) => {
    const mine = item.senderUserId === auth.user?.id;
    return (
      <View style={[styles.bubbleWrap, mine ? styles.bubbleRight : styles.bubbleLeft]}>
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={[styles.bubbleText, mine && { color: "#fff" }]}>{item.text}</Text>
          <Text style={[styles.bubbleTime, mine && { color: "rgba(255,255,255,0.7)" }]}>
            {formatTimeTr(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  }, [auth.user?.id, styles]);

  const handleProfilePress = () => {
    if (!convCtx) return;
    Keyboard.dismiss();
    if (convCtx.otherRole === "employer") {
      if (convCtx.jobId) {
        router.push(`/job/${convCtx.jobId}` as never);
      }
    } else {
      router.push(`/worker/${convCtx.otherUserId}` as never);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : Platform.OS === "android" ? "height" : undefined}
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 120 : Platform.OS === "android" ? 88 : 0}
    >
      {convCtx ? (
        <Pressable onPress={handleProfilePress} style={styles.contextStrip}>
          {convCtx.otherPhotoUrl ? (
            <Image source={{ uri: convCtx.otherPhotoUrl }} style={styles.ctxAvatar} />
          ) : (
            <View style={[styles.ctxAvatar, styles.ctxAvatarPh]}>
              <Feather name="user" size={18} color={theme.colors.subtext} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={styles.ctxName} numberOfLines={1}>
                {convCtx.otherDisplayName}
              </Text>
              {convCtx.otherIsPremium ? (
                <View style={styles.ctxPremiumDot}>
                  <Feather name="check" size={8} color="#fff" />
                </View>
              ) : null}
            </View>
            {convCtx.jobTitle ? (
              <Text style={styles.ctxJob} numberOfLines={1}>
                {convCtx.jobTitle}
              </Text>
            ) : null}
          </View>
          {convCtx.offerCount > 0 ? (
            <View style={styles.ctxOfferBadge}>
              <Text style={styles.ctxOfferBadgeText}>{convCtx.offerCount} teklif</Text>
            </View>
          ) : null}
          <Feather name="chevron-right" size={16} color={theme.colors.subtext} />
        </Pressable>
      ) : null}
      <FlatList
        ref={listRef}
        data={q.data ?? []}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        renderItem={renderItem}
        removeClippedSubviews={Platform.OS === "android"}
        maxToRenderPerBatch={20}
        windowSize={10}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: "center" }}>
            <Text style={{ color: theme.colors.subtext, fontFamily: theme.font.medium }}>
              Sohbet başlatmak için ilk mesajınızı yazın.
            </Text>
          </View>
        }
      />
      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder="Mesaj yaz..."
          placeholderTextColor={theme.colors.subtext}
          style={styles.input}
          multiline
          autoFocus={Platform.OS !== "android"}
        />
        <Pressable onPress={onSend} style={styles.sendBtn}>
          <Feather name="send" size={18} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    list: { padding: theme.spacing.md, gap: 6, flexGrow: 1 },
    bubbleWrap: { marginVertical: 2 },
    bubbleLeft: { alignItems: "flex-start" },
    bubbleRight: { alignItems: "flex-end" },
    bubble: { maxWidth: "80%", padding: 10, borderRadius: 14 },
    bubbleMine: { backgroundColor: theme.colors.primary, borderBottomRightRadius: 4 },
    bubbleTheirs: {
      backgroundColor: theme.colors.card,
      borderBottomLeftRadius: 4,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    bubbleText: { fontFamily: theme.font.regular, fontSize: 14, color: theme.colors.text },
    bubbleTime: {
      fontFamily: theme.font.regular,
      fontSize: 10,
      color: theme.colors.subtext,
      marginTop: 4,
      alignSelf: "flex-end",
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      paddingHorizontal: 8,
      paddingTop: 8,
      paddingBottom: 24,
      gap: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },
    input: {
      flex: 1,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: theme.isDark ? theme.colors.bg : "#F2F4F7",
      borderRadius: 20,
      fontFamily: theme.font.regular,
      color: theme.colors.text,
      maxHeight: 120,
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    contextStrip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: theme.colors.card,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    ctxAvatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
    },
    ctxAvatarPh: {
      backgroundColor: theme.isDark ? "#333" : "#EEE",
      alignItems: "center",
      justifyContent: "center",
    },
    ctxName: {
      fontFamily: theme.font.semibold,
      fontSize: 14,
      color: theme.colors.text,
    },
    ctxJob: {
      fontFamily: theme.font.regular,
      fontSize: 12,
      color: theme.colors.primary,
      marginTop: 1,
    },
    ctxPremiumDot: {
      backgroundColor: theme.colors.premium,
      width: 14,
      height: 14,
      borderRadius: 7,
      alignItems: "center",
      justifyContent: "center",
    },
    ctxOfferBadge: {
      backgroundColor: `${theme.colors.primary}18`,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    ctxOfferBadgeText: {
      fontFamily: theme.font.medium,
      fontSize: 11,
      color: theme.colors.primary,
    },
  });
}
