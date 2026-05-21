import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import {
  getGetWorkerProfileQueryOptions,
  useOpenConversation,
  useSendOffer,
} from "@workspace/api-client-react";
import { Badge, Button, Card, ErrorState, H1, H2, Loading, Muted } from "@/components/UI";
import { useTheme, type Theme } from "@/lib/theme";
import { useAuth, imageUrl } from "@/lib/auth";
import { isoToDisplay } from "@/lib/format";
import { useAppStateRefetch } from "@/lib/useAppStateRefetch";

const DISABILITY_CAT_LABEL: Record<string, string> = {
  gorme: "Görme Engeli",
  isitme: "İşitme Engeli",
  ortopedik: "Ortopedik Engel",
  zihinsel: "Zihinsel Engel",
  ruhsal: "Ruhsal / Duygusal Engel",
  kronik: "Kronik Hastalık",
  konusma: "Konuşma Engeli",
  diger: "Diğer",
};

export default function WorkerDetail() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const auth = useAuth();
  const q = useQuery(getGetWorkerProfileQueryOptions(String(id)));
  const open = useOpenConversation();
  const sendOffer = useSendOffer();
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerMsg, setOfferMsg] = useState("");

  useAppStateRefetch(q.refetch);

  const w = q.data;
  if (q.isLoading) return <Loading />;
  if (q.error || !w) {
    return <ErrorState message="İş arayan profili yüklenemedi." onRetry={() => q.refetch()} />;
  }

  const onMessage = async () => {
    try {
      const conv = await open.mutateAsync({ data: { participantUserId: w.userId } });
      router.push(`/chat/${conv.id}`);
    } catch {
      Alert.alert("Hata", "Sohbet açılamadı.");
    }
  };

  const submitOffer = async () => {
    if (!offerMsg.trim()) {
      Alert.alert("Hata", "Bir mesaj yazın.");
      return;
    }
    try {
      await sendOffer.mutateAsync({
        data: { workerUserId: w.userId, message: offerMsg.trim() },
      });
      setOfferOpen(false);
      setOfferMsg("");
      Alert.alert("Başarılı", "Teklifiniz gönderildi.");
    } catch {
      Alert.alert("Hata", "Teklif gönderilemedi.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        {w.photoUrl ? (
          <Image source={{ uri: imageUrl(w.photoUrl) }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoPh]}>
            <Feather name="user" size={40} color={theme.colors.subtext} />
          </View>
        )}
        <H1>
          {w.firstName} {w.lastName}
        </H1>
        <Muted>
          {w.age} yaş · {w.city}, {w.district}
        </Muted>
        <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
          {w.premium ? (
            <Badge text={`Premium${w.premiumMonthsActive ? ` +${w.premiumMonthsActive} ay` : ""}`} color={theme.colors.premium} />
          ) : null}
          {w.boostActive ? <Badge text="Öne çıkan" color={theme.colors.boost} /> : null}
        </View>
      </View>

      {auth.user?.role === "employer" && w.userId !== auth.user.id ? (
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Button title="Mesaj gönder" onPress={onMessage} loading={open.isPending} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Teklif gönder" variant="secondary" onPress={() => setOfferOpen(true)} />
          </View>
        </View>
      ) : null}

      {w.disability ? (
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Feather name="shield" size={16} color={theme.colors.primary} />
            <Text style={styles.infoLabel}>Engelli Çalışan</Text>
          </View>
          {w.disabilityCategory ? (
            <Muted style={{ marginTop: 4 }}>
              {DISABILITY_CAT_LABEL[w.disabilityCategory] ?? w.disabilityCategory}
              {w.disabilityRate != null ? ` · %${w.disabilityRate}` : ""}
            </Muted>
          ) : null}
        </Card>
      ) : null}

      {w.bio ? (
        <Card>
          <H2>Hakkında</H2>
          <Text style={styles.bio}>{w.bio}</Text>
        </Card>
      ) : null}

      {(w.categories?.length ?? 0) + (w.customCategories?.length ?? 0) > 0 ? (
        <Card>
          <H2>Kategoriler</H2>
          <View style={styles.chipRow}>
            {(w.categories ?? []).map((c) => (
              <Badge key={c.id} text={c.name} color={theme.colors.primary} />
            ))}
            {(w.customCategories ?? []).map((c) => (
              <Badge key={c} text={c} color={theme.colors.accent} />
            ))}
          </View>
        </Card>
      ) : null}

      {w.skills?.length ? (
        <Card>
          <H2>Yetenekler</H2>
          <View style={styles.chipRow}>
            {w.skills.map((s) => (
              <Badge key={s} text={s} color={theme.colors.subtext} />
            ))}
          </View>
        </Card>
      ) : null}

      {w.experiences?.length ? (
        <Card>
          <H2>Deneyimler</H2>
          {w.experiences.map((e) => (
            <View key={e.id} style={{ marginTop: 10 }}>
              <Text style={styles.expPos}>
                {e.position} - {e.workplace}
              </Text>
              <Muted>
                {isoToDisplay(e.startDate)} → {e.endDate ? isoToDisplay(e.endDate) : "Devam ediyor"}
              </Muted>
              {e.description ? <Text style={{ marginTop: 4, color: theme.colors.text, fontFamily: theme.font.regular }}>{e.description}</Text> : null}
            </View>
          ))}
        </Card>
      ) : null}

      {w.educations?.length ? (
        <Card>
          <H2>Eğitim</H2>
          {w.educations.map((e) => (
            <View key={e.id} style={{ marginTop: 10 }}>
              <Text style={styles.expPos}>
                {e.degree} - {e.school}
              </Text>
              <Muted>
                {e.startYear} → {e.endYear ?? "Devam ediyor"}
              </Muted>
            </View>
          ))}
        </Card>
      ) : null}

      <Modal visible={offerOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalBg}
        >
          <View style={styles.modalCard}>
            <H2>Teklif Gönder</H2>
            <Muted>{w.firstName} {w.lastName}'a doğrudan teklif yazın.</Muted>
            <TextInput
              value={offerMsg}
              onChangeText={setOfferMsg}
              multiline
              placeholder="Merhaba, sizinle çalışmak isteriz..."
              placeholderTextColor={theme.colors.subtext}
              style={styles.modalInput}
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Button title="İptal" variant="ghost" onPress={() => setOfferOpen(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Gönder" onPress={submitOffer} loading={sendOffer.isPending} />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: { padding: theme.spacing.lg, gap: 12, paddingBottom: 80 },
    headerCard: { alignItems: "center", padding: theme.spacing.lg, gap: 4 },
    photo: { width: 100, height: 100, borderRadius: 50, marginBottom: 8 },
    photoPh: { backgroundColor: theme.colors.border, alignItems: "center", justifyContent: "center" },
    bio: { marginTop: 6, color: theme.colors.text, fontFamily: theme.font.regular, lineHeight: 20 },
    infoLabel: { fontFamily: theme.font.semibold, fontSize: 14, color: theme.colors.text },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
    expPos: { fontFamily: theme.font.semibold, color: theme.colors.text },
    modalBg: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "flex-end",
    },
    modalCard: {
      backgroundColor: theme.colors.bg,
      padding: theme.spacing.xl,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      gap: 12,
    },
    modalInput: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.md,
      padding: 12,
      minHeight: 120,
      textAlignVertical: "top",
      fontFamily: theme.font.regular,
      color: theme.colors.text,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
  });
}
