import React, { useMemo } from "react";
import { ScrollView, StyleSheet, View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import {
  getGetEmployerHomeSummaryQueryOptions,
  getListWorkersQueryOptions,
  getListIncomingOffersQueryOptions,
  getListConversationsQueryOptions,
  getListOpenJobsQueryOptions,
  getGetMyBoostQueryOptions,
} from "@workspace/api-client-react";
import { Card, H1, H2, Loading, Muted } from "@/components/UI";
import { WorkerCard } from "@/components/WorkerCard";
import { JobMiniCard } from "@/components/JobMiniCard";
import { useTheme, type Theme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { offerStatusLabel, relativeTr } from "@/lib/format";
import { useAppStateRefetch } from "@/lib/useAppStateRefetch";

export default function HomeScreen() {
  const auth = useAuth();
  const role = auth.user?.role;
  if (role === "employer") return <EmployerHome />;
  if (role === "worker") return <WorkerHome />;
  return <Loading />;
}

function EmployerHome() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const router = useRouter();
  const auth = useAuth();
  const summary = useQuery(getGetEmployerHomeSummaryQueryOptions());
  const featured = useQuery(getListWorkersQueryOptions({ limit: 5 }));

  useAppStateRefetch(summary.refetch, featured.refetch);

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <H1>Merhaba{auth.user?.phone ? "" : ""}!</H1>
      <Muted>İşletmenize uygun iş arayanları keşfedin.</Muted>

      <View style={styles.statsRow}>
        <Stat
          label="Açık İlan"
          value={summary.data?.totalJobs ?? "-"}
          icon="briefcase"
          color={theme.colors.success}
          styles={styles}
        />
        <Stat
          label="İş Arayan"
          value={summary.data?.totalWorkers ?? "-"}
          icon="users"
          color={theme.colors.primary}
          styles={styles}
        />
        <Stat
          label="İş Bulan"
          value={summary.data?.jobsFound ?? "-"}
          icon="check-circle"
          color={theme.colors.accent}
          styles={styles}
        />
      </View>

      <Card style={{ gap: 10 }}>
        <H2>Hızlı eylemler</H2>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Action
            label="İş Arayan Ara"
            icon="search"
            color={theme.colors.primary}
            onPress={() => router.push("/(tabs)/workers")}
            styles={styles}
          />
          <Action
            label="Yeni İlan"
            icon="plus-circle"
            color={theme.colors.success}
            onPress={() => router.push("/job/new")}
            styles={styles}
          />
          <Action
            label="Premium"
            icon="zap"
            color={theme.colors.premium}
            onPress={() => router.push("/premium")}
            styles={styles}
          />
        </View>
      </Card>

      {summary.data?.topCategories?.length ? (
        <View style={{ gap: 10 }}>
          <H2>Popüler kategoriler</H2>
          <View style={styles.catGrid}>
            {summary.data.topCategories.map((tc) => (
              <View key={tc.category.id} style={styles.catCard}>
                <Text style={styles.catName} numberOfLines={1}>
                  {tc.category.name}
                </Text>
                <Text style={styles.catCount}>{tc.count} kişi</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <H2>Öne çıkan iş arayanlar</H2>
          <Pressable onPress={() => router.push("/(tabs)/workers")}>
            <Text style={styles.linkText}>Tümünü gör</Text>
          </Pressable>
        </View>
        {featured.isLoading ? (
          <Loading />
        ) : featured.data?.items?.length ? (
          featured.data.items.map((w) => (
            <WorkerCard
              key={w.id}
              worker={w}
              onPress={() => router.push(`/worker/${w.id}`)}
            />
          ))
        ) : (
          <Muted>Henüz iş arayan yok.</Muted>
        )}
      </View>
    </ScrollView>
  );
}

function WorkerHome() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const router = useRouter();
  const offers = useQuery(getListIncomingOffersQueryOptions());
  const conversations = useQuery(getListConversationsQueryOptions());
  const openJobs = useQuery(getListOpenJobsQueryOptions({ limit: 8 }));
  const boostQ = useQuery(getGetMyBoostQueryOptions());
  const pending = (offers.data ?? []).filter((o) => o.status === "pending");

  useAppStateRefetch(offers.refetch, conversations.refetch, openJobs.refetch);

  const boostExpiresAt = boostQ.data?.expiresAt;
  const boostActive = boostQ.data?.active ?? false;
  const boostDaysLeft = boostExpiresAt
    ? Math.max(0, Math.ceil((new Date(boostExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <H1>Merhaba!</H1>
      <Muted>Sana uygun açık ilanlar ve teklifler.</Muted>

      {boostActive ? (
        <Pressable
          onPress={() => router.push("/boost")}
          style={[styles.boostBanner, { borderColor: theme.colors.boost, backgroundColor: `${theme.colors.boost}12` }]}
        >
          <Feather name="zap" size={16} color={theme.colors.boost} />
          <Text style={[styles.boostBannerText, { color: theme.colors.boost }]}>
            Boost Aktif · {boostDaysLeft} gün kaldı
          </Text>
          <Feather name="chevron-right" size={14} color={theme.colors.boost} />
        </Pressable>
      ) : null}

      <View style={styles.statsRow}>
        <Stat
          label="Açık İlan"
          value={openJobs.data?.length ?? "-"}
          icon="briefcase"
          color={theme.colors.primary}
          onPress={() => router.push("/(tabs)/jobs")}
          styles={styles}
        />
        <Stat
          label="Bekleyen Teklif"
          value={pending.length}
          icon="mail"
          color={theme.colors.primary}
          onPress={() => router.push("/(tabs)/offers")}
          styles={styles}
        />
        <Stat
          label="Mesajlar"
          value={conversations.data?.length ?? 0}
          icon="message-circle"
          color={theme.colors.primary}
          onPress={() => router.push("/(tabs)/messages")}
          styles={styles}
        />
      </View>

      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <H2>Sana uygun ilanlar</H2>
          <Pressable onPress={() => router.push("/(tabs)/jobs")}>
            <Text style={styles.linkText}>Tümünü gör</Text>
          </Pressable>
        </View>
        {openJobs.isLoading ? (
          <Loading />
        ) : openJobs.data?.length ? (
          openJobs.data.slice(0, 5).map((j) => (
            <JobMiniCard
              key={j.id}
              job={j}
              onPress={() => router.push(`/job/${j.id}`)}
            />
          ))
        ) : (
          <Muted>Şu anda açık ilan yok.</Muted>
        )}
      </View>

      <Card style={{ gap: 10 }}>
        <H2>Profilini yükselt</H2>
        <Muted>Profilini öne çıkararak teklif sayısını artırabilirsin.</Muted>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Action
            label="Boost"
            icon="zap"
            color={theme.colors.boost}
            onPress={() => router.push("/boost")}
            styles={styles}
          />
          <Action
            label="Premium"
            icon="award"
            color={theme.colors.premium}
            onPress={() => router.push("/premium")}
            styles={styles}
          />
          <Action
            label="Görüntüleyenler"
            icon="eye"
            color={theme.colors.accent}
            onPress={() => router.push("/views")}
            styles={styles}
          />
        </View>
      </Card>

      {pending.length > 0 ? (
        <View style={{ gap: 10 }}>
          <H2>Bekleyen teklifler</H2>
          {pending.slice(0, 5).map((o) => {
            const status = offerStatusLabel(o.status);
            return (
              <Pressable
                key={o.id}
                onPress={() =>
                  router.push({ pathname: "/(tabs)/offers" })
                }
                style={styles.offerCard}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.offerTitle}>{o.employerName}</Text>
                  <Text style={styles.offerJob} numberOfLines={1}>
                    {o.jobTitle ?? "Doğrudan teklif"}
                  </Text>
                  <Text style={styles.offerMessage} numberOfLines={2}>
                    {o.message}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Text style={[styles.offerStatus, { color: status.color }]}>
                    {status.text}
                  </Text>
                  <Text style={styles.offerTime}>{relativeTr(o.createdAt)}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </ScrollView>
  );
}

function Stat({
  label,
  value,
  icon,
  color,
  onPress,
  styles,
}: {
  label: string;
  value: number | string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  onPress?: () => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.statCard, { borderTopColor: color, borderTopWidth: 2 }]}
    >
      <Feather name={icon} size={18} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Pressable>
  );
}

function Action({
  label,
  icon,
  color,
  onPress,
  styles,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.action, { borderColor: `${color}33` }]}>
      <View style={[styles.actionIcon, { backgroundColor: `${color}1A` }]}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <Text style={styles.actionLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    scroll: { padding: theme.spacing.lg, gap: 18, paddingBottom: 80 },
    statsRow: { flexDirection: "row", gap: 10 },
    statCard: {
      flex: 1,
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      gap: 4,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    statValue: { fontFamily: theme.font.bold, fontSize: 20, color: theme.colors.text },
    statLabel: { fontFamily: theme.font.medium, fontSize: 11, color: theme.colors.subtext },
    action: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 12,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      gap: 6,
    },
    actionIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    actionLabel: { fontFamily: theme.font.semibold, fontSize: 12, color: theme.colors.text },
    catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    catCard: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.md,
      padding: 10,
      width: "48%",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    catName: { fontFamily: theme.font.semibold, fontSize: 13, color: theme.colors.text },
    catCount: { fontFamily: theme.font.regular, fontSize: 11, color: theme.colors.subtext },
    linkText: { fontFamily: theme.font.semibold, color: theme.colors.primary },
    offerCard: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      flexDirection: "row",
      gap: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    offerTitle: { fontFamily: theme.font.bold, fontSize: 14, color: theme.colors.text },
    offerJob: { fontFamily: theme.font.medium, fontSize: 12, color: theme.colors.primary },
    offerMessage: { fontFamily: theme.font.regular, fontSize: 12, color: theme.colors.subtext, marginTop: 2 },
    offerStatus: { fontFamily: theme.font.semibold, fontSize: 11 },
    offerTime: { fontFamily: theme.font.regular, fontSize: 10, color: theme.colors.subtext },
    boostBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1.5,
    },
    boostBannerText: {
      flex: 1,
      fontFamily: theme.font.semibold,
      fontSize: 14,
    },
  });
}
