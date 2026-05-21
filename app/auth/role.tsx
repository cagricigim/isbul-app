import React, { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelectUserRole } from "@workspace/api-client-react";
import { Button, H1, Muted } from "@/components/UI";
import { useTheme, type Theme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";

export default function RoleScreen() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const router = useRouter();
  const auth = useAuth();
  const [role, setRole] = useState<"worker" | "employer" | null>(null);
  const mut = useSelectUserRole();

  const submit = async () => {
    if (!role) {
      Alert.alert("Hata", "Lütfen bir rol seçin.");
      return;
    }
    try {
      const updated = await mut.mutateAsync({ data: { role } });
      await auth.setUser(updated);
      router.replace(role === "worker" ? "/onboard/worker" : "/onboard/employer");
    } catch {
      Alert.alert("Hata", "Rol kaydedilemedi.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View style={styles.container}>
        <H1>Hesap türünüz?</H1>
        <Muted>İhtiyacınıza uygun deneyimi açabilmemiz için seçim yapın.</Muted>
        <RoleCard
          icon="user"
          title="İş Arayanım — iş arıyorum"
          subtitle="Profilimi oluşturup işverenlerden teklif alacağım."
          selected={role === "worker"}
          onPress={() => setRole("worker")}
          styles={styles}
          theme={theme}
        />
        <RoleCard
          icon="briefcase"
          title="İşverenim — iş arayan arıyorum"
          subtitle="İlan vereceğim ve doğrudan iş arayanlara teklif göndereceğim."
          selected={role === "employer"}
          onPress={() => setRole("employer")}
          styles={styles}
          theme={theme}
        />
        <Button title="Devam et" onPress={submit} loading={mut.isPending} />
      </View>
    </SafeAreaView>
  );
}

function RoleCard({
  icon,
  fallbackIcon,
  title,
  subtitle,
  selected,
  onPress,
  styles,
  theme,
}: {
  icon: keyof typeof Feather.glyphMap | string;
  fallbackIcon?: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
  theme: Theme;
}) {
  const iconName: keyof typeof Feather.glyphMap = (
    Feather.glyphMap as Record<string, number>
  )[icon as string]
    ? (icon as keyof typeof Feather.glyphMap)
    : (fallbackIcon ?? "briefcase");
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <View
        style={[
          styles.iconBox,
          { backgroundColor: selected ? theme.colors.primary : theme.isDark ? `${theme.colors.primary}25` : "#FFE9DA" },
        ]}
      >
        <Feather
          name={iconName}
          size={26}
          color={selected ? "#fff" : theme.colors.primary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>{subtitle}</Text>
      </View>
      <Feather
        name={selected ? "check-circle" : "circle"}
        size={22}
        color={selected ? theme.colors.primary : theme.colors.border}
      />
    </Pressable>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: theme.spacing.xl,
      gap: 14,
      justifyContent: "center",
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
    },
    cardSelected: { borderColor: theme.colors.primary },
    iconBox: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    title: { fontFamily: theme.font.semibold, fontSize: 15, color: theme.colors.text },
    sub: { fontFamily: theme.font.regular, fontSize: 13, color: theme.colors.subtext, marginTop: 2 },
  });
}
