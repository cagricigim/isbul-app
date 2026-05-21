import React, { useMemo } from "react";
import { FlatList, Image, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { getGetMyProfileViewsQueryOptions } from "@workspace/api-client-react";
import { Button, Card, Empty, H2, Loading, Muted } from "@/components/UI";
import { useTheme, type Theme } from "@/lib/theme";
import { imageUrl } from "@/lib/auth";
import { relativeTr } from "@/lib/format";

export default function ViewsScreen() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const router = useRouter();
  const q = useQuery(getGetMyProfileViewsQueryOptions());
  const data = q.data;

  if (q.isLoading || !data) return <Loading />;

  if (data.premiumRequired) {
    return (
      <View style={{ flex: 1, padding: theme.spacing.xl, gap: 16, justifyContent: "center" }}>
        <View style={styles.lockIcon}>
          <Feather name="lock" size={32} color="#fff" />
        </View>
        <H2 style={{ textAlign: "center" }}>{data.totalCount} işveren profilini görüntüledi</H2>
        <Muted style={{ textAlign: "center" }}>
          Profilini görüntüleyen şirketleri görmek için Premium üye olun.
        </Muted>
        <Button title="Premium'a yükselt" onPress={() => router.push("/premium")} />
      </View>
    );
  }

  return (
    <FlatList
      data={data.viewers ?? []}
      keyExtractor={(v) => v.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <Card>
          <H2>{data.totalCount} işveren profilini görüntüledi</H2>
        </Card>
      }
      ListEmptyComponent={<Empty title="Henüz görüntülenmedi" />}
      renderItem={({ item }) => (
        <View style={styles.row}>
          {item.logoUrl ? (
            <Image source={{ uri: imageUrl(item.logoUrl) }} style={styles.logo} />
          ) : (
            <View style={[styles.logo, styles.logoPh]}>
              <Feather name="briefcase" size={20} color={theme.colors.subtext} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.companyName}</Text>
            {item.sector ? <Muted>{item.sector}</Muted> : null}
          </View>
          <Text style={styles.time}>{relativeTr(item.viewedAt)}</Text>
        </View>
      )}
    />
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    list: { padding: theme.spacing.lg, gap: 8, paddingBottom: 80 },
    lockIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.premium,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
    },
    row: {
      backgroundColor: theme.colors.card,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      marginBottom: 8,
    },
    logo: { width: 44, height: 44, borderRadius: theme.radius.md, backgroundColor: theme.colors.border },
    logoPh: { alignItems: "center", justifyContent: "center" },
    name: { fontFamily: theme.font.semibold, color: theme.colors.text },
    time: { fontSize: 11, color: theme.colors.subtext, fontFamily: theme.font.regular },
  });
}
