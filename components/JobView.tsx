import React, { useMemo } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useOpenConversation, type Job } from "@workspace/api-client-react";
import { Badge, Button, Card, H1, H2 } from "@/components/UI";
import { useTheme, type Theme } from "@/lib/theme";
import { employmentTypeLabel, formatDateTr, formatWorkDateLong } from "@/lib/format";

export function JobView({ job, employerUserId }: { job: Job; employerUserId?: string }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const router = useRouter();
  const open = useOpenConversation();

  const handleContact = async () => {
    if (!employerUserId) return;
    try {
      const conv = await open.mutateAsync({ data: { participantUserId: employerUserId, jobId: job.id } });
      router.push(`/chat/${conv.id}`);
    } catch (e: unknown) {
      const code = (e as { data?: { code?: string } } | null)?.data?.code;
      if (code === "EMAIL_NOT_VERIFIED") {
        Alert.alert(
          "E-posta Doğrulaması Gerekli",
          "Mesaj gönderebilmek için e-posta adresinizi doğrulamanız gerekiyor.",
          [
            { text: "İptal", style: "cancel" },
            { text: "Doğrula", onPress: () => router.push("/profile/edit-worker" as never) },
          ],
        );
      } else {
        Alert.alert("Hata", "Sohbet açılamadı.");
      }
    }
  };

  const isDaily = job.employmentType === "daily";

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={{ gap: 8 }}>
          <H1>{job.title}</H1>
          <Text style={styles.position}>{job.position}</Text>
          <Text style={styles.employer}>{job.employerName}</Text>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            {job.category ? <Badge text={job.category.name} color={theme.colors.primary} /> : null}
            {job.customCategory ? <Badge text={job.customCategory} color={theme.colors.accent} /> : null}
            <Badge text={employmentTypeLabel(job.employmentType)} color={isDaily ? theme.colors.warning : theme.colors.subtext} />
            {job.disabilityFriendly ? <Badge text="Engelli Dostu" color="#5B8DEF" icon="shield" /> : null}
          </View>
        </Card>

        {isDaily && (job.workDate || job.dailyWage || job.workersNeeded) ? (
          <Card style={{ gap: 0, backgroundColor: `${theme.colors.primary}0A`, borderColor: `${theme.colors.primary}25` }}>
            <Text style={styles.dailyHeader}>Günlük İş Detayları</Text>
            {job.workDate ? (
              <Row icon="calendar" text={formatWorkDateLong(job.workDate)} highlight theme={theme} />
            ) : null}
            {job.dailyWage ? (
              <Row icon="dollar-sign" text={`${job.dailyWage} TL / gün`} highlight theme={theme} />
            ) : null}
            {job.workersNeeded ? (
              <Row icon="users" text={`${job.workersNeeded} kişi aranıyor`} highlight theme={theme} />
            ) : null}
          </Card>
        ) : null}

        <Card>
          <Row icon="map-pin" text={`${job.city}${job.district ? ", " + job.district : ""}`} theme={theme} />
          {!isDaily && (job.salaryMin || job.salaryMax) ? (
            <Row
              icon="dollar-sign"
              text={`${job.salaryMin ?? ""}${job.salaryMin && job.salaryMax ? " - " : ""}${job.salaryMax ?? ""} TL`}
              theme={theme}
            />
          ) : null}
          <Row icon="clock" text={formatDateTr(job.createdAt)} theme={theme} />
        </Card>
        {job.description ? (
          <Card>
            <H2>Açıklama</H2>
            <Text style={styles.desc}>{job.description}</Text>
          </Card>
        ) : null}
        {employerUserId ? <View style={{ height: 80 }} /> : null}
      </ScrollView>
      {employerUserId ? (
        <View style={styles.footer}>
          <Button
            title={open.isPending ? "Bağlanıyor..." : "İrtibat Kur"}
            onPress={handleContact}
            disabled={open.isPending}
          />
        </View>
      ) : null}
    </View>
  );
}

function Row({
  icon,
  text,
  highlight,
  theme,
}: {
  icon: keyof typeof Feather.glyphMap;
  text: string;
  highlight?: boolean;
  theme: Theme;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 }}>
      <Feather name={icon} size={16} color={highlight ? theme.colors.primary : theme.colors.subtext} />
      <Text style={{ fontFamily: theme.font.medium, color: highlight ? theme.colors.primary : theme.colors.text, flex: 1 }}>
        {text}
      </Text>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: { padding: theme.spacing.lg, gap: 10 },
    position: { fontFamily: theme.font.semibold, color: theme.colors.primary, fontSize: 15 },
    employer: { fontFamily: theme.font.medium, color: theme.colors.subtext, fontSize: 13 },
    dailyHeader: {
      fontFamily: theme.font.semibold,
      fontSize: 13,
      color: theme.colors.primary,
      marginBottom: 4,
    },
    desc: {
      fontFamily: theme.font.regular,
      color: theme.colors.text,
      lineHeight: 22,
      marginTop: 6,
    },
    footer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: theme.spacing.lg,
      paddingBottom: 28,
      backgroundColor: theme.colors.bg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
    },
  });
}
