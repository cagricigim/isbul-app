import { Stack } from "expo-router";
import { useTheme } from "@/lib/theme";

export default function OnboardLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.bg },
        headerTitleStyle: { fontFamily: theme.font.semibold },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.colors.bg },
      }}
    >
      <Stack.Screen name="worker" options={{ title: "İş Arayan Profili" }} />
      <Stack.Screen name="employer" options={{ title: "İşveren Profili" }} />
    </Stack>
  );
}
