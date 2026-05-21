import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useVerifySmsCode } from "@workspace/api-client-react";
import { Button, H1, Input, Muted } from "@/components/UI";
import { useTheme, type Theme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";

export default function CodeScreen() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const router = useRouter();
  const { phone, requestId, devCode } = useLocalSearchParams<{
    phone: string;
    requestId: string;
    devCode: string;
  }>();
  const auth = useAuth();
  const [code, setCode] = useState("");
  const mut = useVerifySmsCode();

  useEffect(() => {
    if (devCode) setCode(String(devCode));
  }, [devCode]);

  const submit = async () => {
    if (code.length !== 6) {
      Alert.alert("Hata", "6 haneli kodu girin.");
      return;
    }
    try {
      const res = await mut.mutateAsync({
        data: { requestId: String(requestId), code },
      });
      await auth.signIn(res.token, res.user);
      router.replace("/");
    } catch {
      Alert.alert("Hata", "Kod hatalı veya süresi dolmuş.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <H1>Doğrulama kodu</H1>
          <Muted>
            {phone} numarasına 6 haneli kod gönderdik. Aşağıya girin.
          </Muted>
          {devCode ? (
            <View style={styles.devBox}>
              <Text style={styles.devTitle}>Test kodu (geliştirme):</Text>
              <Text style={styles.devCode}>{devCode}</Text>
            </View>
          ) : null}
          <Input
            label="6 haneli kod"
            value={code}
            onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            placeholder="000000"
          />
          <Button title="Giriş yap" onPress={submit} loading={mut.isPending} />
          <Button title="Geri" variant="ghost" onPress={() => router.back()} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: theme.spacing.xl,
      gap: 16,
      justifyContent: "center",
    },
    devBox: {
      backgroundColor: "#FFF7E6",
      borderColor: "#F79009",
      borderWidth: 1,
      borderRadius: theme.radius.md,
      padding: 12,
      gap: 4,
    },
    devTitle: { fontFamily: theme.font.medium, fontSize: 12, color: "#92400E" },
    devCode: {
      fontFamily: theme.font.bold,
      fontSize: 22,
      letterSpacing: 6,
      color: "#92400E",
    },
  });
}
