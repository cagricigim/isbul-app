import React, { useMemo } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useDeleteAccount, useLogout } from "@workspace/api-client-react";
import { Button, Card, H2, Muted } from "@/components/UI";
import { useTheme, useThemeMode, type Theme, type ThemeMode } from "@/lib/theme";
import { useAuth } from "@/lib/auth";

const PRIVACY_URL = "https://api.isinebakk.app/api/gizlilik";

export default function SettingsScreen() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { mode, setMode } = useThemeMode();
  const router = useRouter();
  const auth = useAuth();
  const qc = useQueryClient();
  const logout = useLogout();
  const del = useDeleteAccount();

  const onLogout = async () => {
    try {
      await logout.mutateAsync();
    } catch {}
    qc.clear();
    await auth.signOut();
    router.replace("/auth/phone");
  };

  const onDelete = () =>
    Alert.alert(
      "Hesabı sil",
      "Hesabınız ve tüm verileriniz kalıcı olarak silinecek. Onaylıyor musunuz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await del.mutateAsync();
            } catch {}
            qc.clear();
            await auth.signOut();
            router.replace("/auth/phone");
          },
        },
      ],
    );

  const APPEARANCE_OPTIONS: { label: string; value: ThemeMode; icon: string }[] = [
    { label: "Açık", value: "light", icon: "sun" },
    { label: "Koyu", value: "dark", icon: "moon" },
    { label: "Sistem", value: "system", icon: "smartphone" },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card>
        <H2>Hesap</H2>
        <Muted>{auth.user?.phone}</Muted>
        <Muted>Rol: {auth.user?.role === "employer" ? "İşveren" : "İş Arayan"}</Muted>
      </Card>

      <Card>
        <H2>Görünüm</H2>
        <Muted style={{ marginBottom: 10 }}>Uygulama temasını seçin</Muted>
        <View style={styles.appearanceRow}>
          {APPEARANCE_OPTIONS.map((opt) => {
            const active = mode === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setMode(opt.value)}
                style={({ pressed }) => [
                  styles.appearanceBtn,
                  active && styles.appearanceBtnActive,
                  pressed && !active && { opacity: 0.7 },
                ]}
              >
                <Feather
                  name={opt.icon as React.ComponentProps<typeof Feather>["name"]}
                  size={16}
                  color={active ? "#fff" : theme.colors.subtext}
                />
                <Text style={[styles.appearanceBtnText, active && styles.appearanceBtnTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Pressable style={styles.row} onPress={() => router.push("/settings/notifications")}>
        <Feather name="bell" size={18} color={theme.colors.text} />
        <Text style={styles.rowText}>Bildirimler</Text>
        <Feather name="chevron-right" size={18} color={theme.colors.subtext} />
      </Pressable>

      <Pressable style={styles.row}>
        <Feather name="globe" size={18} color={theme.colors.text} />
        <Text style={styles.rowText}>Dil</Text>
        <Text style={styles.rowMeta}>Türkçe</Text>
      </Pressable>
      <Pressable style={styles.row} onPress={() => router.push("/premium")}>
        <Feather name="award" size={18} color={theme.colors.premium} />
        <Text style={styles.rowText}>Premium üyelik</Text>
        <Feather name="chevron-right" size={18} color={theme.colors.subtext} />
      </Pressable>

      <Pressable style={styles.row} onPress={() => void WebBrowser.openBrowserAsync(PRIVACY_URL)}>
        <Feather name="shield" size={18} color={theme.colors.text} />
        <Text style={styles.rowText}>Gizlilik Politikası</Text>
        <Feather name="external-link" size={16} color={theme.colors.subtext} />
      </Pressable>

      <Pressable style={styles.row} onPress={() => void WebBrowser.openBrowserAsync(PRIVACY_URL)}>
        <Feather name="file-text" size={18} color={theme.colors.text} />
        <Text style={styles.rowText}>KVKK Aydınlatma Metni</Text>
        <Feather name="external-link" size={16} color={theme.colors.subtext} />
      </Pressable>

      <View style={{ height: 8 }} />
      <Button title="Çıkış yap" variant="ghost" onPress={onLogout} loading={logout.isPending} />
      <Button title="Hesabı sil" variant="danger" onPress={onDelete} loading={del.isPending} />
    </ScrollView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: { padding: theme.spacing.lg, gap: 10, paddingBottom: 80 },
    appearanceRow: { flexDirection: "row", gap: 8 },
    appearanceBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      borderRadius: theme.radius.md,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.bg,
    },
    appearanceBtnActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    appearanceBtnText: {
      fontFamily: theme.font.medium,
      fontSize: 13,
      color: theme.colors.subtext,
    },
    appearanceBtnTextActive: { color: "#fff" },
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
    rowMeta: { fontFamily: theme.font.regular, color: theme.colors.subtext, fontSize: 12 },
  });
}
