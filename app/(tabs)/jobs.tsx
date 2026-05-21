import React, { useCallback, useState, useMemo } from "react";
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
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import {
  getListCategoriesQueryOptions,
  getListMyJobsQueryOptions,
  getListOpenJobsQueryOptions,
  getAdminListJobsQueryOptions,
  useAdminUpdateJobStatus,
  useDeleteJob,
} from "@workspace/api-client-react";
import { Badge, Button, Empty, Loading, Muted } from "@/components/UI";
import { SelectPicker } from "@/components/SelectPicker";
import { JobMiniCard } from "@/components/JobMiniCard";
import { useTheme, type Theme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { employmentTypeLabel, formatWorkDate, relativeTr } from "@/lib/format";
import { CITY_NAMES, getDistrictsForCity } from "@/lib/turkey-locations";
import { useAppStateRefetch } from "@/lib/useAppStateRefetch";

type JobTab = "all" | "daily";
type MyJobTab = "pending_review" | "active" | "ended";

const STATUS_BADGE: Record<string, { text: string; color: string }> = {
  pending_review: { text: "İncelemede", color: "#F59E0B" },
  active: { text: "Yayında", color: "#10B981" },
  ended: { text: "Bitti", color: "#6B7280" },
  rejected: { text: "Reddedildi", color: "#EF4444" },
};

export default function JobsTab() {
  const auth = useAuth();
  if (auth.user?.isAdmin) return <AdminJobs />;
  if (auth.user?.role === "employer") return <EmployerJobs />;
  return <WorkerJobs />;
}

function EmployerJobs() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const router = useRouter();
  const qc = useQueryClient();
  const q = useQuery(getListMyJobsQueryOptions());
  const del = useDeleteJob();
  const [myTab, setMyTab] = useState<MyJobTab>("active");

  useAppStateRefetch(q.refetch);

  const allItems = q.data ?? [];
  const filteredItems = useMemo(() => {
    if (myTab === "ended") return allItems.filter((i) => i.status === "ended" || i.status === "rejected");
    return allItems.filter((i) => i.status === myTab);
  }, [allItems, myTab]);

  const onDelete = useCallback((id: string) => {
    Alert.alert("İlanı sil", "Bu ilanı silmek istediğinizden emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          await del.mutateAsync({ jobId: id });
          await qc.invalidateQueries({ queryKey: getListMyJobsQueryOptions().queryKey });
        },
      },
    ]);
  }, [del, qc]);

  const myTabHeader = (
    <View style={styles.myTabRow}>
      {(["pending_review", "active", "ended"] as MyJobTab[]).map((t) => {
        const labels: Record<MyJobTab, string> = {
          pending_review: "İncelemede",
          active: "Yayında",
          ended: "Bitti",
        };
        return (
          <Pressable
            key={t}
            onPress={() => setMyTab(t)}
            style={[styles.myTab, myTab === t && styles.myTabActive]}
          >
            <Text style={[styles.myTabText, myTab === t && styles.myTabTextActive]}>
              {labels[t]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  const renderItem = useCallback(({ item }: { item: typeof allItems[0] }) => {
    const badge = STATUS_BADGE[item.status] ?? STATUS_BADGE.active;
    return (
      <Pressable
        onPress={() => router.push(`/job/${item.id}`)}
        style={[styles.card, item.employmentType === "daily" && styles.dailyCard]}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Badge text={badge.text} color={badge.color} />
        </View>
        <Text style={styles.cardSub}>{item.position}</Text>
        <View style={styles.metaRow}>
          <MetaItem icon="map-pin" text={`${item.city}${item.district ? ", " + item.district : ""}`} theme={theme} />
          <MetaItem icon="clock" text={employmentTypeLabel(item.employmentType)} theme={theme} />
        </View>
        {item.employmentType === "daily" ? (
          <View style={styles.metaRow}>
            {item.workDate ? <MetaItem icon="calendar" text={formatWorkDate(item.workDate)} color={theme.colors.primary} theme={theme} /> : null}
            {item.dailyWage ? <MetaItem icon="dollar-sign" text={`${item.dailyWage} TL/gün`} color={theme.colors.success} theme={theme} /> : null}
            {item.workersNeeded ? <MetaItem icon="users" text={`${item.workersNeeded} kişi`} theme={theme} /> : null}
          </View>
        ) : item.salaryMin || item.salaryMax ? (
          <Text style={styles.salary}>
            {item.salaryMin ? `${item.salaryMin}` : ""}
            {item.salaryMin && item.salaryMax ? " - " : ""}
            {item.salaryMax ? `${item.salaryMax}` : ""} TL
          </Text>
        ) : null}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
          <Muted>{relativeTr(item.createdAt)}</Muted>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable onPress={() => router.push(`/job/${item.id}`)} hitSlop={8}>
              <Feather name="edit-2" size={18} color={theme.colors.subtext} />
            </Pressable>
            <Pressable onPress={() => onDelete(item.id)} hitSlop={8}>
              <Feather name="trash-2" size={18} color={theme.colors.danger} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  }, [allItems, router, theme, onDelete]);

  const emptyMessages: Record<MyJobTab, { title: string; subtitle: string }> = {
    pending_review: { title: "İnceleme bekleyen ilan yok", subtitle: "Yeni ilan oluşturduğunuzda burada görünür." },
    active: { title: "Yayında ilan yok", subtitle: "Onaylanan ilanlarınız burada listelenir." },
    ended: { title: "Bitmiş ilan yok", subtitle: "Sona eren veya reddedilen ilanlar burada görünür." },
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={filteredItems}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={myTabHeader}
        renderItem={renderItem}
        ListEmptyComponent={
          q.isLoading
            ? <Loading />
            : <Empty title={emptyMessages[myTab].title} subtitle={emptyMessages[myTab].subtitle} />
        }
        refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} />}
      />
      {myTab === "pending_review" && (
        <View style={styles.fabWrap}>
          <Button title="+ Yeni İlan" onPress={() => router.push("/job/new")} />
        </View>
      )}
    </View>
  );
}

function AdminJobs() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const qc = useQueryClient();
  const [adminTab, setAdminTab] = useState<"pending_review" | "active" | "ended">("pending_review");

  // For "Bitti" tab, fetch both ended and rejected and merge them
  const singleQ = useQuery({
    ...getAdminListJobsQueryOptions({ status: adminTab }),
    enabled: adminTab !== "ended",
  });
  const endedRejectedQs = useQueries({
    queries: [
      { ...getAdminListJobsQueryOptions({ status: "ended" }), enabled: adminTab === "ended" },
      { ...getAdminListJobsQueryOptions({ status: "rejected" }), enabled: adminTab === "ended" },
    ],
  });
  const updateStatus = useAdminUpdateJobStatus();

  const isLoading = adminTab === "ended"
    ? endedRejectedQs.some((q) => q.isLoading)
    : singleQ.isLoading;
  const isFetching = adminTab === "ended"
    ? endedRejectedQs.some((q) => q.isFetching)
    : singleQ.isFetching;

  const refetchAll = useCallback(() => {
    if (adminTab === "ended") {
      endedRejectedQs.forEach((q) => q.refetch());
    } else {
      singleQ.refetch();
    }
  }, [adminTab, singleQ, endedRejectedQs]);

  useAppStateRefetch(refetchAll);

  const items = useMemo(() => {
    if (adminTab === "ended") {
      const combined = [...(endedRejectedQs[0].data ?? []), ...(endedRejectedQs[1].data ?? [])];
      return combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return singleQ.data ?? [];
  }, [adminTab, singleQ.data, endedRejectedQs]);

  const approve = useCallback((jobId: string) => {
    Alert.alert("Onayla", "Bu ilanı yayınlamak istiyor musunuz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Yayınla",
        onPress: async () => {
          await updateStatus.mutateAsync({ jobId, data: { status: "active" } });
          await qc.invalidateQueries({ queryKey: getAdminListJobsQueryOptions({ status: adminTab }).queryKey });
        },
      },
    ]);
  }, [updateStatus, qc, adminTab]);

  const reject = useCallback((jobId: string) => {
    Alert.alert("Reddet", "Bu ilanı reddetmek istiyor musunuz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Reddet",
        style: "destructive",
        onPress: async () => {
          await updateStatus.mutateAsync({ jobId, data: { status: "rejected" } });
          await qc.invalidateQueries({ queryKey: getAdminListJobsQueryOptions({ status: adminTab }).queryKey });
        },
      },
    ]);
  }, [updateStatus, qc, adminTab]);

  const adminTabHeader = (
    <View style={styles.myTabRow}>
      {(["pending_review", "active", "ended"] as const).map((t) => {
        const labels: Record<typeof t, string> = {
          pending_review: "Bekleyen",
          active: "Yayında",
          ended: "Bitti",
        };
        return (
          <Pressable
            key={t}
            onPress={() => setAdminTab(t)}
            style={[styles.myTab, adminTab === t && styles.myTabActive]}
          >
            <Text style={[styles.myTabText, adminTab === t && styles.myTabTextActive]}>
              {labels[t]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  const renderAdminItem = useCallback(({ item }: { item: typeof items[0] }) => {
    const badge = STATUS_BADGE[item.status] ?? STATUS_BADGE.active;
    return (
      <View style={styles.card}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Badge text={badge.text} color={badge.color} />
        </View>
        <Text style={styles.cardSub}>{item.position}</Text>
        <Text style={{ fontFamily: theme.font.medium, fontSize: 12, color: theme.colors.subtext, marginTop: 2 }}>
          {item.employerName}
        </Text>
        <View style={styles.metaRow}>
          <MetaItem icon="map-pin" text={`${item.city}${item.district ? ", " + item.district : ""}`} theme={theme} />
          <MetaItem icon="clock" text={employmentTypeLabel(item.employmentType)} theme={theme} />
        </View>
        <Muted style={{ marginTop: 2 }}>{relativeTr(item.createdAt)}</Muted>
        {item.status === "pending_review" ? (
          <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
            <Pressable
              onPress={() => approve(item.id)}
              style={[styles.adminBtn, { backgroundColor: theme.colors.success }]}
            >
              <Feather name="check" size={14} color="#fff" />
              <Text style={styles.adminBtnText}>Yayınla</Text>
            </Pressable>
            <Pressable
              onPress={() => reject(item.id)}
              style={[styles.adminBtn, { backgroundColor: theme.colors.danger }]}
            >
              <Feather name="x" size={14} color="#fff" />
              <Text style={styles.adminBtnText}>Reddet</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    );
  }, [items, theme, approve, reject]);

  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={adminTabHeader}
      renderItem={renderAdminItem}
      ListEmptyComponent={
        isLoading
          ? <Loading />
          : <Empty title="Uygun ilan yok" subtitle="" />
      }
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetchAll} />}
    />
  );
}

function WorkerJobs() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<JobTab>("all");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const catsQ = useQuery(getListCategoriesQueryOptions());
  const cats = catsQ.data ?? [];

  const districts = useMemo(() => (city ? getDistrictsForCity(city) : []), [city]);
  const categoryName = useMemo(() => cats.find((c) => c.id === categoryId)?.name ?? "", [cats, categoryId]);
  const categoryNames = useMemo(() => cats.map((c) => c.name), [cats]);
  const categoryNameToId = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of cats) m[c.name] = c.id;
    return m;
  }, [cats]);

  const hasFilters = Boolean(city || district || categoryId);

  const params = useMemo(() => ({
    limit: 50,
    ...(city ? { city } : {}),
    ...(district ? { district } : {}),
    ...(activeTab === "all" && categoryId ? { categoryId } : {}),
    ...(activeTab === "daily" ? { employmentType: "daily" } : {}),
  }), [city, district, categoryId, activeTab]);

  const q = useQuery(getListOpenJobsQueryOptions(params));
  const items = q.data ?? [];

  useAppStateRefetch(q.refetch);

  function handleCityChange(val: string) {
    setCity(val);
    setDistrict("");
  }

  function handleClear() {
    setCity("");
    setDistrict("");
    setCategoryId("");
  }

  const tabHeader = (
    <View style={styles.tabRow}>
      <Pressable
        onPress={() => setActiveTab("all")}
        style={[styles.tab, activeTab === "all" && styles.tabActive]}
      >
        <Text style={[styles.tabText, activeTab === "all" && styles.tabTextActive]}>
          Tüm İlanlar
        </Text>
      </Pressable>
      <Pressable
        onPress={() => setActiveTab("daily")}
        style={[styles.tab, activeTab === "daily" && styles.tabActive]}
      >
        <Feather
          name="sun"
          size={13}
          color={activeTab === "daily" ? "#fff" : theme.colors.primary}
          style={{ marginRight: 4 }}
        />
        <Text style={[styles.tabText, activeTab === "daily" && styles.tabTextActive]}>
          Günlük İşler
        </Text>
      </Pressable>
    </View>
  );

  const filterHeader = (
    <View style={{ gap: 10 }}>
      {tabHeader}
      {activeTab === "daily" ? (
        <View style={styles.dailyInfo}>
          <Feather name="info" size={13} color={theme.colors.primary} />
          <Text style={styles.dailyInfoText}>Günlük çalışma ilanları — tek günlük işler burada</Text>
        </View>
      ) : null}
      <View style={styles.filterBox}>
        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <SelectPicker
              placeholder="İl"
              value={city}
              onSelect={handleCityChange}
              options={CITY_NAMES}
            />
          </View>
          <View style={styles.filterItem}>
            <SelectPicker
              placeholder="İlçe"
              value={district}
              onSelect={setDistrict}
              options={districts}
              disabled={!city}
            />
          </View>
        </View>
        {activeTab === "all" ? (
          <View style={styles.filterRow}>
            <View style={{ flex: 1 }}>
              <SelectPicker
                placeholder="Meslek / Kategori"
                value={categoryName}
                onSelect={(name) => {
                  setCategoryId(categoryNameToId[name] ?? "");
                }}
                options={categoryNames}
              />
            </View>
            {hasFilters ? (
              <Pressable onPress={handleClear} style={styles.clearBtn}>
                <Feather name="x" size={14} color={theme.colors.primary} />
                <Text style={styles.clearText}>Temizle</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          hasFilters ? (
            <Pressable onPress={handleClear} style={[styles.clearBtn, { alignSelf: "flex-end" }]}>
              <Feather name="x" size={14} color={theme.colors.primary} />
              <Text style={styles.clearText}>Temizle</Text>
            </Pressable>
          ) : null
        )}
        {hasFilters ? (
          <View style={styles.activeRow}>
            {city ? <ActiveTag label={city} onRemove={() => handleCityChange("")} styles={styles} primaryColor={theme.colors.primary} /> : null}
            {district ? <ActiveTag label={district} onRemove={() => setDistrict("")} styles={styles} primaryColor={theme.colors.primary} /> : null}
            {categoryName ? <ActiveTag label={categoryName} onRemove={() => setCategoryId("")} styles={styles} primaryColor={theme.colors.primary} /> : null}
          </View>
        ) : null}
      </View>
    </View>
  );

  const renderItem = useCallback(({ item }: { item: typeof items[0] }) => (
    <JobMiniCard job={item} onPress={() => router.push(`/job/${item.id}`)} />
  ), [router]);

  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={filterHeader}
      renderItem={renderItem}
      ListEmptyComponent={
        q.isLoading ? (
          <Loading />
        ) : (
          <Empty
            title={activeTab === "daily" ? "Günlük ilan yok" : "İlan yok"}
            subtitle={
              hasFilters
                ? "Bu filtrelere uygun ilan bulunamadı."
                : activeTab === "daily"
                ? "Henüz günlük iş ilanı yayınlanmamış."
                : undefined
            }
          />
        )
      }
      refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} />}
    />
  );
}

function ActiveTag({ label, onRemove, styles, primaryColor }: { label: string; onRemove: () => void; styles: ReturnType<typeof makeStyles>; primaryColor: string }) {
  return (
    <Pressable onPress={onRemove} style={styles.activeTag}>
      <Text style={styles.activeTagText} numberOfLines={1}>{label}</Text>
      <Feather name="x" size={11} color={primaryColor} />
    </Pressable>
  );
}

function MetaItem({
  icon,
  text,
  color,
  theme,
}: {
  icon: keyof typeof Feather.glyphMap;
  text: string;
  color?: string;
  theme: Theme;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <Feather name={icon} size={13} color={color ?? theme.colors.subtext} />
      <Text style={{ fontSize: 12, color: color ?? theme.colors.subtext, fontFamily: theme.font.medium }}>
        {text}
      </Text>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    list: { padding: theme.spacing.lg, gap: 10, paddingBottom: 100 },
    myTabRow: {
      flexDirection: "row",
      gap: 6,
      marginBottom: 8,
    },
    myTab: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 9,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },
    myTabActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    myTabText: { fontFamily: theme.font.semibold, fontSize: 13, color: theme.colors.subtext },
    myTabTextActive: { color: "#fff" },
    tabRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 4,
    },
    tab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.card,
    },
    tabActive: { backgroundColor: theme.colors.primary },
    tabText: { fontFamily: theme.font.semibold, fontSize: 14, color: theme.colors.primary },
    tabTextActive: { color: "#fff" },
    dailyInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: `${theme.colors.primary}0D`,
      borderRadius: theme.radius.md,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    dailyInfoText: {
      fontFamily: theme.font.regular,
      fontSize: 12,
      color: theme.colors.primary,
      flex: 1,
    },
    filterBox: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      gap: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      marginBottom: 10,
    },
    filterRow: { flexDirection: "row", gap: 8, alignItems: "center" },
    filterItem: { flex: 1 },
    clearBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: theme.radius.md,
      backgroundColor: `${theme.colors.primary}12`,
    },
    clearText: { fontFamily: theme.font.semibold, fontSize: 13, color: theme.colors.primary },
    activeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    activeTag: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: `${theme.colors.primary}15`,
      borderRadius: theme.radius.full,
      paddingHorizontal: 10,
      paddingVertical: 4,
      maxWidth: 160,
    },
    activeTagText: { fontFamily: theme.font.medium, fontSize: 12, color: theme.colors.primary, flexShrink: 1 },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      gap: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      marginBottom: 10,
    },
    dailyCard: {
      borderColor: `${theme.colors.primary}40`,
      backgroundColor: `${theme.colors.primary}05`,
    },
    cardTitle: { fontFamily: theme.font.bold, fontSize: 16, color: theme.colors.text },
    cardSub: { fontFamily: theme.font.medium, fontSize: 13, color: theme.colors.primary },
    metaRow: { flexDirection: "row", gap: 14, marginTop: 2 },
    salary: { fontFamily: theme.font.semibold, fontSize: 13, color: theme.colors.success },
    fabWrap: { position: "absolute", bottom: 16, left: 16, right: 16 },
    adminBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: theme.radius.md,
    },
    adminBtnText: { fontFamily: theme.font.semibold, fontSize: 13, color: "#fff" },
  });
}
