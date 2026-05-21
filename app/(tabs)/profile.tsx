import React, { useMemo } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import {
  getGetMyEmployerProfileQueryOptions,
  getGetMyWorkerProfileQueryOptions,
  getGetMySubscriptionQueryOptions,
} from "@workspace/api-client-react";
import { Badge, Card, H2, Loading, Muted } from "@/components/UI";
import { useTheme, type Theme } from "@/lib/theme";
import { useAuth, imageUrl } from "@/lib/auth";
import { isoToDisplay } from "@/lib/format";

export default function ProfileTab() {
  const auth = useAuth();
  const router = useRouter();
  if (auth.user?.role === "worker") return <WorkerProfile />;
  if (auth.user?.role === "employer") return <EmployerProfile />;
  return <Loading />;
}

function WorkerProfile() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const router = useRouter();
  const q = useQuery(getGetMyWorkerProfileQueryOptions());
  const sub = useQuery(getGetMySubscriptionQueryOptions());
  const p = q.data;
  if (!p) return <Loading />;
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        {p.photoUrl ? (
          <Image source={{ uri: imageUrl(p.photoUrl) }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoPh]}>
            <Feather name="user" size={36} color={theme.colors.subtext} />
          </View>
        )}
        <Text style={styles.name}>{p.firstName} {p.lastName}</Text>
        <Text style={styles.meta}>{p.age} yaş · {p.city}, {p.district}</Text>
        <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
          {sub.data?.tier === "premium" ? (
            <Badge text="Premium" color={theme.colors.premium} />
          ) : null}
          {p.boostActive ? <Badge text="Öne çıkan" color={theme.colors.boost} /> : null}
        </View>
      </View>

      <Pressable style={styles.row} onPress={() => router.push("/profile/edit-worker")}>
        <Feather name="edit-2" size={18} color={theme.colors.text} />
        <Text style={styles.rowText}>Profili düzenle</Text>
        <Feather name="chevron-right" size={18} color={theme.colors.subtext} />
      </Pressable>
      <Pressable style={styles.row} onPress={() => router.push("/views")}>
        <Feather name="eye" size={18} color={theme.colors.text} />
        <Text style={styles.rowText}>Profilimi görüntüleyenler</Text>
        <Feather name="chevron-right" size={18} color={theme.colors.subtext} />
      </Pressable>
      <Pressable style={styles.row} onPress={() => router.push("/boost")}>
        <Feather name="zap" size={18} color={theme.colors.boost} />
        <Text style={styles.rowText}>Profili öne çıkar</Text>
        <Feather name="chevron-right" size={18} color={theme.colors.subtext} />
      </Pressable>
      <Pressable style={styles.row} onPress={() => router.push("/premium")}>
        <Feather name="award" size={18} color={theme.colors.premium} />
        <Text style={styles.rowText}>Premium üyelik</Text>
        <Feather name="chevron-right" size={18} color={theme.colors.subtext} />
      </Pressable>
      <Pressable style={styles.row} onPress={() => router.push("/settings")}>
        <Feather name="settings" size={18} color={theme.colors.text} />
        <Text style={styles.rowText}>Ayarlar</Text>
        <Feather name="chevron-right" size={18} color={theme.colors.subtext} />
      </Pressable>

      {p.bio ? (
        <Card>
          <H2>Hakkımda</H2>
          <Text style={{ marginTop: 6, color: theme.colors.text, fontFamily: theme.font.regular, lineHeight: 20 }}>{p.bio}</Text>
        </Card>
      ) : null}
      {(p.categories?.length ?? 0) + (p.customCategories?.length ?? 0) > 0 ? (
        <Card>
          <H2>Kategoriler</H2>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {(p.categories ?? []).map((c) => (
              <Badge key={c.id} text={c.name} color={theme.colors.primary} />
            ))}
            {(p.customCategories ?? []).map((c) => (
              <Badge key={c} text={c} color={theme.colors.accent} />
            ))}
          </View>
        </Card>
      ) : null}
      {p.experiences?.length ? (
        <Card>
          <H2>Deneyimler</H2>
          {p.experiences.map((e) => (
            <View key={e.id} style={{ marginTop: 10 }}>
              <Text style={{ fontFamily: theme.font.semibold, color: theme.colors.text }}>
                {e.position} - {e.workplace}
              </Text>
              <Muted>{isoToDisplay(e.startDate)} → {e.endDate ? isoToDisplay(e.endDate) : "Devam ediyor"}</Muted>
              {e.description ? <Text style={{ marginTop: 4, color: theme.colors.text, fontFamily: theme.font.regular }}>{e.description}</Text> : null}
            </View>
          ))}
        </Card>
      ) : null}
    </ScrollView>
  );
}

function EmployerProfile() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const router = useRouter();
  const q = useQuery(getGetMyEmployerProfileQueryOptions());
  const sub = useQuery(getGetMySubscriptionQueryOptions());
  const p = q.data;
  if (!p) return <Loading />;
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        {p.logoUrl ? (
          <Image source={{ uri: imageUrl(p.logoUrl) }} style={[styles.photo, { borderRadius: theme.radius.lg }]} />
        ) : (
          <View style={[styles.photo, styles.photoPh, { borderRadius: theme.radius.lg }]}>
            <Feather name="briefcase" size={36} color={theme.colors.subtext} />
          </View>
        )}
        <Text style={styles.name}>{p.companyName}</Text>
        <Text style={styles.meta}>{p.sector} · {p.city}, {p.district}</Text>
        {sub.data?.tier === "premium" ? (
          <Badge text="Premium" color={theme.colors.premium} />
        ) : null}
      </View>

      <Pressable style={styles.row} onPress={() => router.push("/profile/edit-employer")}>
        <Feather name="edit-2" size={18} color={theme.colors.text} />
        <Text style={styles.rowText}>Profili düzenle</Text>
        <Feather name="chevron-right" size={18} color={theme.colors.subtext} />
      </Pressable>
      <Pressable style={styles.row} onPress={() => router.push("/(tabs)/jobs")}>
        <Feather name="briefcase" size={18} color={theme.colors.text} />
        <Text style={styles.rowText}>İlanlarım</Text>
        <Feather name="chevron-right" size={18} color={theme.colors.subtext} />
      </Pressable>
      <Pressable style={styles.row} onPress={() => router.push("/premium")}>
        <Feather name="award" size={18} color={theme.colors.premium} />
        <Text style={styles.rowText}>Premium üyelik</Text>
        <Feather name="chevron-right" size={18} color={theme.colors.subtext} />
      </Pressable>
      <Pressable style={styles.row} onPress={() => router.push("/settings")}>
        <Feather name="settings" size={18} color={theme.colors.text} />
        <Text style={styles.rowText}>Ayarlar</Text>
        <Feather name="chevron-right" size={18} color={theme.colors.subtext} />
      </Pressable>

      {p.description ? (
        <Card>
          <H2>Hakkımızda</H2>
          <Text style={{ marginTop: 6, fontFamily: theme.font.regular, color: theme.colors.text, lineHeight: 20 }}>{p.description}</Text>
        </Card>
      ) : null}
    </ScrollView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: { padding: theme.spacing.lg, gap: 10, paddingBottom: 80 },
    header: { alignItems: "center", paddingVertical: 12, gap: 4 },
    photo: { width: 96, height: 96, borderRadius: 48, backgroundColor: theme.colors.border },
    photoPh: { alignItems: "center", justifyContent: "center" },
    name: { fontFamily: theme.font.bold, fontSize: 20, color: theme.colors.text, marginTop: 8 },
    meta: { fontFamily: theme.font.regular, color: theme.colors.subtext },
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.card,
      padding: theme.spacing.lg,
      borderRadius: theme.radius.md,
      gap: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    rowText: { flex: 1, fontFamily: theme.font.medium, fontSize: 14, color: theme.colors.text },
  });
}
