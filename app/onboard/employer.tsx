import React, { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import {
  useUpdateMyEmployerProfile,
  useGetCurrentUser,
} from "@workspace/api-client-react";
import { Input } from "@/components/UI";
import { PhotoPicker } from "@/components/PhotoPicker";
import { SelectPicker } from "@/components/SelectPicker";
import { SectorPicker } from "@/components/SectorPicker";
import { CITY_NAMES, getDistrictsForCity } from "@/lib/turkey-locations";
import { useTheme, type Theme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { Feather } from "@expo/vector-icons";

const TOTAL_STEPS = 3;

function StepHeader({ step, title, subtitle, styles }: { step: number; title: string; subtitle: string; styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.stepHeader}>
      <View style={styles.progressRow}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View key={i} style={[styles.progressBar, i < step && styles.progressBarFilled]} />
        ))}
      </View>
      <Text style={styles.stepLabel}>Adım {step} / {TOTAL_STEPS}</Text>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepSubtitle}>{subtitle}</Text>
    </View>
  );
}

export default function EmployerOnboardScreen() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const router = useRouter();
  const auth = useAuth();
  const mut = useUpdateMyEmployerProfile();
  const me = useGetCurrentUser({ query: { enabled: false, queryKey: ["me"] } });
  const [step, setStep] = useState(1);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [companyTitle, setCompanyTitle] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [sector, setSector] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [corporateEmail, setCorporateEmail] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState("");
  const [consentApproved, setConsentApproved] = useState(false);
  const [emailConsent, setEmailConsent] = useState(false);

  const [taxDocumentUrl, setTaxDocumentUrl] = useState<string | undefined>(undefined);

  const districts = getDistrictsForCity(city);

  const handleNext = () => {
    if (step === 1) {
      if (!firstName.trim() || !lastName.trim()) {
        Alert.alert("Hata", "İşveren adı ve soyadı zorunludur.");
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!companyName.trim() || !sector.trim() || !city || !district) {
        Alert.alert("Hata", "Lütfen işyeri bilgilerini eksiksiz doldurun.");
        return;
      }
      if (!companyTitle.trim()) {
        Alert.alert("Hata", "Şirket unvanı zorunludur.");
        return;
      }
      if (!taxNumber.trim()) {
        Alert.alert("Hata", "Vergi numarası zorunludur.");
        return;
      }
      if (!consentApproved) {
        Alert.alert("Hata", "Açık rıza metnini onaylamanız gerekiyor.");
        return;
      }
      setStep(3);
      return;
    }
    void handleSubmit();
  };

  const handleSubmit = async () => {
    try {
      await mut.mutateAsync({
        data: {
          companyName: companyName.trim(),
          companyTitle: companyTitle.trim(),
          taxNumber: taxNumber.trim(),
          sector: sector.trim(),
          city,
          district,
          corporateEmail: corporateEmail.trim(),
          taxDocumentUrl,
          description: description.trim() || undefined,
          logoUrl,
        },
      });
      const refreshed = await me.refetch();
      if (refreshed.data) await auth.setUser(refreshed.data);
      router.replace("/(tabs)");
    } catch (e: unknown) {
      const apiMsg = (e as { data?: { error?: string } } | null)?.data?.error;
      Alert.alert("Hata", apiMsg || "Profil kaydedilemedi. Lütfen tekrar deneyin.");
    }
  };

  return (
    <View style={styles.safeArea}>
      {step === 1 && (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <StepHeader step={1} title="İşveren bilgileri" subtitle="İlk olarak sizi tanıyalım" styles={styles} />
          <View style={styles.form}>
            <Input label="İşverenin adı *" value={firstName} onChangeText={setFirstName} placeholder="Adınız" />
            <Input label="İşverenin soyadı *" value={lastName} onChangeText={setLastName} placeholder="Soyadınız" />
          </View>
          <View style={styles.footer}>
            <TouchableOpacity style={[styles.btnPrimary, { flex: 1 }]} onPress={handleNext} activeOpacity={0.8}>
              <Text style={styles.btnPrimaryText}>İleri</Text>
              <Feather name="chevron-right" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {step === 2 && (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <StepHeader step={2} title="İşyeri bilgileri" subtitle="İşyerinizi tanımlayın ve doğrulayın" styles={styles} />
          <View style={styles.form}>
            <View style={{ alignItems: "center", marginVertical: 8 }}>
              <PhotoPicker value={logoUrl} onChange={setLogoUrl} label="İş yeri logosu" rounded={false} />
            </View>
            <Input label="İş yeri adı *" value={companyName} onChangeText={setCompanyName} placeholder="Ticari adınız" />
            <Input label="Şirket unvanı" value={companyTitle} onChangeText={setCompanyTitle} placeholder="Ticaret sicilindeki resmi unvan" />
            <Input
              label="Vergi numarası *"
              value={taxNumber}
              onChangeText={setTaxNumber}
              placeholder="10 haneli vergi no"
              keyboardType="numeric"
            />
            <SectorPicker label="Sektör *" value={sector} onChange={setSector} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <SelectPicker label="Şehir *" placeholder="Şehir seçin" value={city} onSelect={(v) => { setCity(v); setDistrict(""); }} options={CITY_NAMES} />
              </View>
              <View style={{ flex: 1 }}>
                <SelectPicker label="İlçe *" placeholder="İlçe seçin" value={district} onSelect={setDistrict} options={districts} disabled={!city} />
              </View>
            </View>

            <Input
              label="Kurumsal e-posta *"
              value={corporateEmail}
              onChangeText={setCorporateEmail}
              placeholder="ornek@sirket.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={styles.emailHint}>
              İletişim için kullanılacak e-posta adresinizi girin.
            </Text>

            <Input label="İş yeri hakkında (opsiyonel)" value={description} onChangeText={setDescription} multiline numberOfLines={4} style={{ minHeight: 100, textAlignVertical: "top" }} />

            <View style={styles.consentBox}>
              <View style={styles.consentRow}>
                <Switch value={consentApproved} onValueChange={setConsentApproved} />
                <Text style={styles.consentText}>Açık rıza metnini onaylıyorum.</Text>
              </View>
              <View style={styles.consentRow}>
                <Switch value={emailConsent} onValueChange={setEmailConsent} />
                <Text style={styles.consentText}>İletişim bilgilerime e-ileti gönderilmesine izin veriyorum.</Text>
              </View>
            </View>
          </View>
          <View style={styles.footer}>
            <TouchableOpacity style={styles.btnSecondary} onPress={() => setStep(1)} activeOpacity={0.8}>
              <Feather name="chevron-left" size={20} color={theme.colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnPrimary, { flex: 1 }]} onPress={handleNext} activeOpacity={0.8}>
              <Text style={styles.btnPrimaryText}>İleri</Text>
              <Feather name="chevron-right" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {step === 3 && (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <StepHeader step={3} title="Vergi levhası" subtitle="Kurumsal kimliğinizi belgeleyin (opsiyonel)" styles={styles} />
          <View style={styles.form}>
            <Text style={styles.docHint}>
              Vergi levhası yükleyerek işveren profiliniz doğrulanmış olarak görünür. Bu adımı atlayabilirsiniz.
            </Text>
            <View style={{ alignItems: "center", marginVertical: 16 }}>
              <PhotoPicker value={taxDocumentUrl} onChange={setTaxDocumentUrl} label="Vergi Levhası" rounded={false} />
            </View>
          </View>
          <View style={styles.footer}>
            <TouchableOpacity style={styles.btnSecondary} onPress={() => setStep(2)} activeOpacity={0.8}>
              <Feather name="chevron-left" size={20} color={theme.colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnOutline, { flex: 1 }]}
              onPress={() => void handleSubmit()}
              activeOpacity={0.8}
            >
              <Text style={[styles.btnPrimaryText, { color: theme.colors.text }]}>Atla</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnPrimary, { flex: 1 }]}
              onPress={() => void handleSubmit()}
              activeOpacity={0.8}
              disabled={mut.isPending}
            >
              <Text style={styles.btnPrimaryText}>{mut.isPending ? "Kaydediliyor..." : "Kaydet"}</Text>
              <Feather name="check" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.bg },
    scroll: { padding: theme.spacing.xl, paddingBottom: 40, gap: 0 },
    stepHeader: { marginBottom: theme.spacing.xl },
    progressRow: { flexDirection: "row", gap: 6, marginBottom: 6 },
    progressBar: { flex: 1, height: 4, borderRadius: 99, backgroundColor: theme.colors.border },
    progressBarFilled: { backgroundColor: theme.colors.primary },
    stepLabel: { fontFamily: theme.font.regular, fontSize: 12, color: theme.colors.subtext, marginBottom: 12 },
    stepTitle: { fontFamily: theme.font.bold, fontSize: 24, color: theme.colors.text, marginBottom: 4 },
    stepSubtitle: { fontFamily: theme.font.regular, fontSize: 14, color: theme.colors.subtext },
    form: { gap: 14 },
    footer: { flexDirection: "row", gap: 10, marginTop: 28 },
    btnPrimary: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: theme.colors.primary, paddingVertical: 16, borderRadius: theme.radius.xl },
    btnPrimaryText: { fontFamily: theme.font.semibold, fontSize: 16, color: "#fff" },
    btnSecondary: { width: 54, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.xl },
    btnOutline: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: theme.colors.card, paddingVertical: 16, borderRadius: theme.radius.xl, borderWidth: 1, borderColor: theme.colors.border },
    consentBox: { gap: 12, padding: theme.spacing.md, borderRadius: theme.radius.lg, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border },
    consentRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    consentText: { flex: 1, fontFamily: theme.font.regular, fontSize: 13, color: theme.colors.text },
    emailHint: { fontFamily: theme.font.regular, fontSize: 12, color: theme.colors.subtext, marginTop: -4 },
    docHint: { fontFamily: theme.font.regular, fontSize: 14, color: theme.colors.subtext, lineHeight: 20 },
  });
}
