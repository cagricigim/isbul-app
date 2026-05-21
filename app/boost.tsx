import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import {
  getGetMyBoostQueryOptions,
  usePurchaseBoost,
} from "@workspace/api-client-react";
import { Button, Card, H1, H2, Muted } from "@/components/UI";
import { useTheme, type Theme } from "@/lib/theme";
import { formatDateTr } from "@/lib/format";

const PLANS = [
  { days: 1, price: "₺39,99" },
  { days: 2, price: "₺69,99", badge: "Popüler" },
  { days: 3, price: "₺99,99" },
] as const;

function remainingDays(expiresAt: string | undefined): number {
  if (!expiresAt) return 0;
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

export default function BoostScreen() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const qc = useQueryClient();
  const q = useQuery(getGetMyBoostQueryOptions());
  const buy = usePurchaseBoost();
  const [selected, setSelected] = useState<1 | 2 | 3>(2);

  const purchase = async () => {
    try {
      await buy.mutateAsync({ data: { durationDays: selected } });
      await qc.invalidateQueries({ queryKey: getGetMyBoostQueryOptions().queryKey });
      Alert.alert("Başarılı", "Profilin öne çıkarıldı!");
    } catch {
      Alert.alert("Hata", "İşlem başarısız.");
    }
  };

  const days = remainingDays(q.data?.expiresAt);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Feather name="zap" size={32} color="#fff" />
        <H1 style={{ color: "#fff" }}>Profilini Öne Çıkar</H1>
        <Text style={styles.heroSub}>
          İşveren akışlarında en üst sırada görün, daha fazla teklif al.
        </Text>
      </View>

      {q.data?.active ? (
        <Card style={{ borderColor: theme.colors.boost, borderWidth: 1.5, gap: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Feather name="zap" size={16} color={theme.colors.boost} />
            <H2 style={{ color: theme.colors.boost }}>Boost Aktif</H2>
          </View>
          <Text style={styles.boostRemaining}>{days} gün kaldı</Text>
          <Muted>Bitiş: {formatDateTr(q.data.expiresAt)}</Muted>
          <Muted style={{ fontSize: 12 }}>
            Yeni boost satın alırsan mevcut süreye eklenir.
          </Muted>
        </Card>
      ) : null}

      <View style={{ gap: 10 }}>
        <H2>Süre seç</H2>
        {PLANS.map((p) => (
          <Pressable
            key={p.days}
            onPress={() => setSelected(p.days)}
            style={[
              styles.plan,
              selected === p.days && styles.planSelected,
            ]}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <Text style={styles.planTitle}>{p.days} gün</Text>
                {("badge" in p) && p.badge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{p.badge}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.planPrice}>{p.price}</Text>
            </View>
            <Feather
              name={selected === p.days ? "check-circle" : "circle"}
              size={22}
              color={selected === p.days ? theme.colors.boost : theme.colors.border}
            />
          </Pressable>
        ))}
      </View>

      <Button title={`${selected} günlük boost al`} onPress={purchase} loading={buy.isPending} />
      <Muted style={{ textAlign: "center" }}>
        Boost tek seferlik bir satın almadır. Birden fazla boost birbirine eklenir.
      </Muted>
    </ScrollView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: { padding: theme.spacing.lg, gap: 14, paddingBottom: 80 },
    hero: {
      backgroundColor: theme.colors.boost,
      padding: theme.spacing.xl,
      borderRadius: theme.radius.xl,
      alignItems: "center",
      gap: 8,
    },
    heroSub: { color: "#fff", opacity: 0.9, textAlign: "center", fontFamily: theme.font.regular },
    boostRemaining: {
      fontFamily: theme.font.bold,
      fontSize: 22,
      color: theme.colors.boost,
    },
    plan: {
      backgroundColor: theme.colors.card,
      padding: theme.spacing.lg,
      borderRadius: theme.radius.lg,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
    },
    planSelected: { borderColor: theme.colors.boost },
    planTitle: { fontFamily: theme.font.bold, fontSize: 16, color: theme.colors.text },
    planPrice: { fontFamily: theme.font.semibold, color: theme.colors.boost, fontSize: 14 },
    badge: {
      backgroundColor: `${theme.colors.boost}1A`,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: theme.radius.full,
    },
    badgeText: { color: theme.colors.boost, fontSize: 10, fontFamily: theme.font.bold },
  });
}
