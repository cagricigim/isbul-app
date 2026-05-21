import React, { useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme, type Theme } from "@/lib/theme";
import { imageUrl } from "@/lib/auth";
import { Badge } from "./UI";

export interface WorkerCardData {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  age: number;
  city: string;
  district: string;
  bio?: string;
  premium: boolean;
  boostActive?: boolean;
  premiumMonthsActive?: number;
  primaryCategory?: { name: string; icon?: string };
  skills?: string[];
  disability?: boolean;
  disabilityCategory?: string;
  disabilityRate?: number;
}

const DISABILITY_CAT_LABEL: Record<string, string> = {
  gorme: "Görme",
  isitme: "İşitme",
  ortopedik: "Ortopedik",
  zihinsel: "Zihinsel",
  ruhsal: "Ruhsal",
  kronik: "Kronik",
  konusma: "Konuşma",
  diger: "Diğer",
};

export function WorkerCard({
  worker,
  onPress,
}: {
  worker: WorkerCardData;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        worker.boostActive && styles.boosted,
        pressed && { opacity: 0.85 },
      ]}
    >
      {worker.boostActive ? (
        <View style={styles.boostStripe}>
          <Feather name="zap" size={11} color="#fff" />
          <Text style={styles.boostStripeText}>ÖNE ÇIKAN</Text>
        </View>
      ) : null}
      <View style={styles.row}>
        {worker.photoUrl ? (
          <Image source={{ uri: imageUrl(worker.photoUrl) }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Feather name="user" size={28} color={theme.colors.subtext} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <Text style={styles.name}>
              {worker.firstName} {worker.lastName}
            </Text>
            {worker.premium ? (
              <View style={styles.premiumDot}>
                <Feather name="check" size={10} color="#fff" />
              </View>
            ) : null}
            {worker.premium && (worker.premiumMonthsActive ?? 0) > 0 ? (
              <Badge text={`+${worker.premiumMonthsActive} ay`} color={theme.colors.premium} />
            ) : null}
            {worker.disability ? (
              <Badge
                text={
                  worker.disabilityCategory
                    ? `${DISABILITY_CAT_LABEL[worker.disabilityCategory] ?? worker.disabilityCategory}${worker.disabilityRate ? ` %${worker.disabilityRate}` : ""}`
                    : "Engelli"
                }
                color="#5B8DEF"
              />
            ) : null}
          </View>
          <Text style={styles.meta}>
            {worker.age} yaş · {worker.city}
            {worker.district ? `, ${worker.district}` : ""}
          </Text>
          {worker.primaryCategory ? (
            <Text style={styles.category}>{worker.primaryCategory.name}</Text>
          ) : null}
        </View>
      </View>
      {worker.bio ? (
        <Text style={styles.bio} numberOfLines={2}>{worker.bio}</Text>
      ) : null}
      {worker.skills && worker.skills.length > 0 ? (
        <View style={styles.skillsRow}>
          {worker.skills.slice(0, 4).map((s) => (
            <View key={s} style={styles.skillChip}>
              <Text style={styles.skillText}>{s}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      gap: 10,
      overflow: "hidden",
    },
    boosted: { borderColor: theme.colors.boost, borderWidth: 1.5 },
    boostStripe: {
      position: "absolute",
      top: 0,
      right: 0,
      backgroundColor: theme.colors.boost,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderBottomLeftRadius: theme.radius.md,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    boostStripeText: { color: "#fff", fontSize: 10, fontFamily: theme.font.bold, letterSpacing: 0.5 },
    row: { flexDirection: "row", gap: 12, alignItems: "center" },
    photo: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.colors.border },
    photoPlaceholder: { alignItems: "center", justifyContent: "center" },
    name: { fontFamily: theme.font.bold, fontSize: 16, color: theme.colors.text },
    meta: { fontFamily: theme.font.regular, fontSize: 13, color: theme.colors.subtext, marginTop: 2 },
    category: { fontFamily: theme.font.semibold, fontSize: 13, color: theme.colors.primary, marginTop: 4 },
    bio: { fontFamily: theme.font.regular, fontSize: 13, color: theme.colors.text, lineHeight: 18 },
    skillsRow: { flexDirection: "row", gap: 6 },
    skillChip: {
      backgroundColor: theme.isDark ? theme.colors.border : "#F2F4F7",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: theme.radius.full,
    },
    skillText: { fontSize: 11, color: theme.colors.text, fontFamily: theme.font.medium },
    premiumDot: {
      backgroundColor: theme.colors.premium,
      width: 16,
      height: 16,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
