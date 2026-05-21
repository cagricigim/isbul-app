import React, { useMemo } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getListIncomingOffersQueryOptions,
  getListSentOffersQueryOptions,
  useAcceptOffer,
  useOpenConversation,
  useRejectOffer,
} from "@workspace/api-client-react";
import { Button, Empty, Loading, Muted } from "@/components/UI";
import { useTheme, type Theme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { offerStatusLabel, relativeTr } from "@/lib/format";

export default function OffersTab() {
  const auth = useAuth();
  if (auth.user?.role === "employer") return <SentOffers />;
  return <IncomingOffers />;
}

function IncomingOffers() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const router = useRouter();
  const qc = useQueryClient();
  const q = useQuery(getListIncomingOffersQueryOptions());
  const accept = useAcceptOffer();
  const reject = useRejectOffer();
  const open = useOpenConversation();

  const items = q.data ?? [];

  const onAccept = async (id: string) => {
    try {
      await accept.mutateAsync({ offerId: id });
      await qc.invalidateQueries({ queryKey: getListIncomingOffersQueryOptions().queryKey });
    } catch {
      Alert.alert("Hata", "Teklif kabul edilemedi.");
    }
  };

  const onReject = async (id: string) => {
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
  };

  const onMessage = async (employerUserId?: string) => {
    if (!employerUserId) {
      Alert.alert("Hata", "İşveren bulunamadı.");
      return;
    }
    try {
      const conv = await open.mutateAsync({ data: { participantUserId: employerUserId } });
      router.push(`/chat/${conv.id}`);
    } catch {
      Alert.alert("Hata", "Sohbet açılamadı.");
    }
  };

  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        q.isLoading ? <Loading /> : <Empty title="Henüz teklif yok" subtitle="İşverenler size doğrudan teklif gönderecek." />
      }
      refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} />}
      renderItem={({ item }) => {
        const status = offerStatusLabel(item.status);
        return (
          <View style={styles.card}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={styles.title}>{item.employerName}</Text>
              <Text style={[styles.status, { color: status.color }]}>{status.text}</Text>
            </View>
            {item.jobTitle ? <Text style={styles.job}>{item.jobTitle}</Text> : null}
            <Text style={styles.message}>{item.message}</Text>
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
              <Button
                title="Mesaj gönder"
                variant="secondary"
                onPress={() => onMessage(item.employerUserId)}
                style={{ marginTop: 8 }}
              />
            ) : null}
          </View>
        );
      }}
    />
  );
}

function SentOffers() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const q = useQuery(getListSentOffersQueryOptions());
  const items = q.data ?? [];
  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        q.isLoading ? <Loading /> : <Empty title="Henüz teklif yok" subtitle="İş arayanlara mesaj göndererek teklif yapabilirsiniz." />
      }
      refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} />}
      renderItem={({ item }) => {
        const status = offerStatusLabel(item.status);
        return (
          <View style={styles.card}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={styles.title}>{item.workerName ?? "İş Arayan"}</Text>
              <Text style={[styles.status, { color: status.color }]}>{status.text}</Text>
            </View>
            {item.jobTitle ? <Text style={styles.job}>{item.jobTitle}</Text> : null}
            <Text style={styles.message}>{item.message}</Text>
            <Muted>{relativeTr(item.createdAt)}</Muted>
          </View>
        );
      }}
    />
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    list: { padding: theme.spacing.lg, gap: 10, paddingBottom: 100 },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      gap: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      marginBottom: 10,
    },
    title: { fontFamily: theme.font.bold, fontSize: 15, color: theme.colors.text },
    job: { fontFamily: theme.font.medium, fontSize: 13, color: theme.colors.primary },
    message: { fontFamily: theme.font.regular, fontSize: 14, color: theme.colors.text },
    status: { fontFamily: theme.font.semibold, fontSize: 12 },
  });
}
