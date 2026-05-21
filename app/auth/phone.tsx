import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRequestSmsCode } from "@workspace/api-client-react";
import { Button, H1, Input, Muted } from "@/components/UI";
import { useTheme, type Theme } from "@/lib/theme";

export default function PhoneScreen() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const router = useRouter();
  const [phone, setPhone] = useState("+90");
  const mut = useRequestSmsCode();

  const submit = async () => {
    const cleaned = phone.replace(/\s+/g, "");
    if (cleaned.length < 11) {
      Alert.alert("Hata", "Lütfen geçerli bir telefon numarası girin.");
      return;
    }
    try {
      const res = await mut.mutateAsync({ data: { phone: cleaned } });
      router.push({
        pathname: "/auth/code",
        params: { phone: cleaned, requestId: res.requestId, devCode: res.devCode },
      });
    } catch {
      Alert.alert("Hata", "SMS gönderilemedi. Tekrar deneyin.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <View style={styles.logo}>
            <Feather name="briefcase" size={32} color="#fff" />
          </View>
          <H1>İşine Bak'a hoş geldiniz</H1>
          <Muted>
            Türkiye'nin en hızlı iş arayan-işveren buluşma platformu. Devam etmek için telefon
            numaranızı girin.
          </Muted>
          <Input
            label="Telefon numaranız"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+90 5XX XXX XX XX"
            maxLength={14}
            autoFocus
          />
          <Button title="Devam et" onPress={submit} loading={mut.isPending} />
          <Muted style={{ textAlign: "center" }}>
            Devam ederek kullanım koşullarını kabul etmiş olursunuz.
          </Muted>
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
    logo: {
      width: 64,
      height: 64,
      borderRadius: 16,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
  });
}
