import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { useGetCurrentUser } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

export default function IndexRoute() {
  const auth = useAuth();
  const theme = useTheme();
  const { data, isLoading } = useGetCurrentUser({
    query: { enabled: !!auth.token, queryKey: ["me"] },
  });

  useEffect(() => {
    if (data) {
      void auth.setUser(data);
    }
  }, [data]);

  if (!auth.ready || (auth.token && isLoading && !data && !auth.user)) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.bg,
        }}
      >
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (!auth.token) {
    return <Redirect href="/auth/phone" />;
  }
  const user = data ?? auth.user;
  if (!user) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.bg,
        }}
      >
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }
  if (user.isAdmin) {
    return <Redirect href="/(tabs)" />;
  }
  if (!user.role) {
    return <Redirect href="/auth/role" />;
  }
  if (user.role === "worker" && !user.hasWorkerProfile) {
    return <Redirect href="/onboard/worker" />;
  }
  if (user.role === "employer" && !user.hasEmployerProfile) {
    return <Redirect href="/onboard/employer" />;
  }
  return <Redirect href="/(tabs)" />;
}
