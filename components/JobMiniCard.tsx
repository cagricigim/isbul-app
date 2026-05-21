import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme, type Theme } from "@/lib/theme";
import { employmentTypeLabel, formatWorkDate, relativeTr } from "@/lib/format";

export interface JobMiniCardData {
  id: string;
  title: string;
  position: string;
  employerName: string;
  city: string;
  district?: string;
  employmentType: string;
  category?: { name: string } | null;
  customCategory?: string;
  createdAt: string | Date;
  workDate?: string;
  dailyWage?: number;
  workersNeeded?: number;
}

export function JobMiniCard({
  job,
  onPress,
}: {
  job: JobMiniCardData;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const catLabel = job.category?.name ?? job.customCategory ?? "";
  const location = `${job.city}${job.district ? ", " + job.district : ""}`;
  const isDaily = job.employmentType === "daily";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, isDaily && styles.dailyCard, pressed && { opacity: 0.85 }]}
    >
      {isDaily ? (
        <View style={styles.dailyBadge}>
          <Feather name="sun" size={11} color="#fff" />
          <Text style={styles.dailyBadgeText}>Günlük İş</Text>
        </View>
      ) : null}
      <Text style={styles.title} numberOfLines={1}>{job.title}</Text>
      <Text style={styles.employer} numberOfLines={1}>
        {job.employerName}{catLabel ? ` · ${catLabel}` : ""}
      </Text>
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Feather name="map-pin" size={12} color={theme.colors.subtext} />
          <Text style={styles.metaText} numberOfLines={1}>{location}</Text>
        </View>
        {isDaily && job.workDate ? (
          <View style={styles.metaItem}>
            <Feather name="calendar" size={12} color={theme.colors.primary} />
            <Text style={[styles.metaText, { color: theme.colors.primary }]} numberOfLines={1}>
              {formatWorkDate(job.workDate)}
            </Text>
          </View>
        ) : (
          <View style={styles.metaItem}>
            <Feather name="clock" size={12} color={theme.colors.subtext} />
            <Text style={styles.metaText} numberOfLines={1}>{employmentTypeLabel(job.employmentType)}</Text>
          </View>
        )}
      </View>
      {isDaily && (job.dailyWage || job.workersNeeded) ? (
        <View style={styles.metaRow}>
          {job.dailyWage ? (
            <View style={styles.metaItem}>
              <Feather name="dollar-sign" size={12} color={theme.colors.success} />
              <Text style={[styles.metaText, { color: theme.colors.success }]} numberOfLines={1}>
                {job.dailyWage} TL/gün
              </Text>
            </View>
          ) : null}
          {job.workersNeeded ? (
            <View style={styles.metaItem}>
              <Feather name="users" size={12} color={theme.colors.subtext} />
              <Text style={styles.metaText} numberOfLines={1}>{job.workersNeeded} kişi</Text>
            </View>
          ) : null}
        </View>
      ) : null}
      <Text style={styles.time}>{relativeTr(job.createdAt)}</Text>
    </Pressable>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      gap: 5,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      minHeight: 110,
      justifyContent: "center",
    },
    dailyCard: {
      borderColor: `${theme.colors.primary}40`,
      backgroundColor: `${theme.colors.primary}08`,
    },
    dailyBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      alignSelf: "flex-start",
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radius.full,
      paddingHorizontal: 8,
      paddingVertical: 3,
      marginBottom: 2,
    },
    dailyBadgeText: { fontFamily: theme.font.semibold, fontSize: 10, color: "#fff" },
    title: { fontFamily: theme.font.bold, fontSize: 15, color: theme.colors.text },
    employer: { fontFamily: theme.font.medium, fontSize: 13, color: theme.colors.primary },
    metaRow: { flexDirection: "row", gap: 12, marginTop: 2 },
    metaItem: { flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 1 },
    metaText: { fontSize: 12, color: theme.colors.subtext, fontFamily: theme.font.medium, flexShrink: 1 },
    time: { fontFamily: theme.font.regular, fontSize: 11, color: theme.colors.subtext, marginTop: 2 },
  });
}
