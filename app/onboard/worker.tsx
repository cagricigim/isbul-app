import React, { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { useUpdateMyWorkerProfile, useGetCurrentUser } from "@workspace/api-client-react";
import { Input } from "@/components/UI";
import { SelectPicker } from "@/components/SelectPicker";
import { DatePartsPicker } from "@/components/DatePartsPicker";
import { CITY_NAMES, getDistrictsForCity } from "@/lib/turkey-locations";
import { useTheme, type Theme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { Feather } from "@expo/vector-icons";

const TOTAL_STEPS = 4;

const ASKERLIK_OPTIONS = [
  { value: "yapildi", label: "Yapıldı" },
  { value: "muaf", label: "Muaf" },
  { value: "yapilmadi", label: "Yapılmadı" },
  { value: "tecilli", label: "Tecilli" },
] as const;

const ENGEL_KATEGORILERI = [
  { value: "gorme", label: "Görme Engeli" },
  { value: "isitme", label: "İşitme Engeli" },
  { value: "ortopedik", label: "Ortopedik Engel" },
  { value: "zihinsel", label: "Zihinsel Engel" },
  { value: "ruhsal", label: "Ruhsal / Duygusal Engel" },
  { value: "kronik", label: "Kronik Hastalık" },
  { value: "konusma", label: "Konuşma Engeli" },
  { value: "diger", label: "Diğer" },
] as const;

const ENGELLILIK_ORANLARI = Array.from({ length: 20 }, (_, i) => `%${(i + 1) * 5}`);

const EGITIM_SEVIYELERI = [
  { value: "ilkokul", label: "İlkokul", sub: "1–4. sınıf" },
  { value: "ortaokul", label: "Ortaokul", sub: "5–8. sınıf" },
  { value: "lise", label: "Lise", sub: "9–12. sınıf" },
  { value: "onlisans", label: "Ön Lisans", sub: "2 yıllık" },
  { value: "lisans", label: "Lisans", sub: "4 yıllık üniversite" },
  { value: "yukseklisans", label: "Yüksek Lisans", sub: "Mastır" },
  { value: "doktora", label: "Doktora", sub: "Phd" },
  { value: "diger", label: "Diğer", sub: "Meslek kursu vb." },
] as const;

type Gender = "erkek" | "kadin";
type MilitaryStatus = "yapildi" | "muaf" | "yapilmadi" | "tecilli";
type DisabilityCategory = "gorme" | "isitme" | "ortopedik" | "zihinsel" | "ruhsal" | "kronik" | "konusma" | "diger";
type EducationLevel = "ilkokul" | "ortaokul" | "lise" | "onlisans" | "lisans" | "yukseklisans" | "doktora" | "diger";

function PillButton({
  label,
  selected,
  onPress,
  styles,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.pill, selected && styles.pillSelected]}
      activeOpacity={0.7}
    >
      <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

function StepHeader({ step, title, subtitle, styles }: { step: number; title: string; subtitle: string; styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.stepHeader}>
      <View style={styles.progressRow}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View
            key={i}
            style={[styles.progressBar, i < step && styles.progressBarFilled]}
          />
        ))}
      </View>
      <Text style={styles.stepLabel}>Adım {step} / {TOTAL_STEPS}</Text>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepSubtitle}>{subtitle}</Text>
    </View>
  );
}

export default function WorkerOnboardScreen() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const router = useRouter();
  const auth = useAuth();
  const mut = useUpdateMyWorkerProfile();
  const me = useGetCurrentUser({ query: { enabled: false, queryKey: ["me"] } });

  const [step, setStep] = useState(1);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");

  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [militaryStatus, setMilitaryStatus] = useState<MilitaryStatus | "">("");

  const [disability, setDisability] = useState<boolean | null>(null);
  const [disabilityCategory, setDisabilityCategory] = useState<DisabilityCategory | "">("");
  const [disabilityRateStr, setDisabilityRateStr] = useState("");

  const [educationLevel, setEducationLevel] = useState<EducationLevel | "">("");

  function isAtLeast18(iso: string): boolean {
    const [y, m, d] = iso.split("-").map(Number);
    const dobDate = new Date(y, m - 1, d);
    const today = new Date();
    const age =
      today.getFullYear() -
      dobDate.getFullYear() -
      (today.getMonth() < dobDate.getMonth() ||
      (today.getMonth() === dobDate.getMonth() && today.getDate() < dobDate.getDate())
        ? 1
        : 0);
    return age >= 18;
  }

  function handleNext() {
    if (step === 1) {
      if (!firstName.trim() || !lastName.trim()) { Alert.alert("Hata", "Ad ve soyad zorunludur."); return; }
      if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) { Alert.alert("Hata", "Lütfen doğum tarihinizi seçin."); return; }
      if (!isAtLeast18(dob)) { Alert.alert("Hata", "Kayıt olmak için en az 18 yaşında olmanız gereklidir."); return; }
    } else if (step === 2) {
      if (!city || !district) { Alert.alert("Hata", "Şehir ve ilçe seçimi zorunludur."); return; }
      if (!gender) { Alert.alert("Hata", "Cinsiyet seçimi zorunludur."); return; }
      if (gender === "erkek" && !militaryStatus) { Alert.alert("Hata", "Askerlik durumu seçimi zorunludur."); return; }
    } else if (step === 3) {
      if (disability === null) { Alert.alert("Hata", "Lütfen engellilik durumunuzu belirtin."); return; }
      if (disability && !disabilityCategory) { Alert.alert("Hata", "Lütfen engel kategorinizi seçin."); return; }
      if (disability && !disabilityRateStr) { Alert.alert("Hata", "Lütfen engellilik oranınızı seçin."); return; }
    }
    setStep((s) => s + 1);
  }

  function handleBack() { setStep((s) => s - 1); }

  async function handleSubmit() {
    if (!educationLevel) { Alert.alert("Hata", "Lütfen eğitim durumunuzu seçin."); return; }
    const disabilityRate = disabilityRateStr ? parseInt(disabilityRateStr.replace("%", ""), 10) : undefined;
    try {
      await mut.mutateAsync({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dateOfBirth: dob,
          city,
          district,
          gender: gender as Gender,
          militaryStatus: gender === "erkek" ? (militaryStatus as MilitaryStatus) : undefined,
          disability: disability ?? undefined,
          disabilityCategory: disability ? (disabilityCategory as DisabilityCategory) : undefined,
          disabilityRate: disability ? disabilityRate : undefined,
          educationLevel: educationLevel as EducationLevel,
          categoryIds: [],
          customCategories: [],
          skills: [],
        },
      });
      const refreshed = await me.refetch();
      if (refreshed.data) await auth.setUser(refreshed.data);
      router.replace("/(tabs)");
    } catch (e: unknown) {
      const apiMsg = (e as { data?: { error?: string } } | null)?.data?.error;
      Alert.alert("Hata", apiMsg || "Profil kaydedilemedi. Lütfen tekrar deneyin.");
    }
  }

  const districts = getDistrictsForCity(city);

  const subSectionBg = theme.isDark ? `${theme.colors.primary}15` : "#FFF5EE";
  const subSectionBorder = theme.isDark ? `${theme.colors.primary}30` : "#FFD4B3";

  return (
    <SafeAreaView style={styles.safeArea}>
      {step === 1 && (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <StepHeader step={1} title="Sizi tanıyalım" subtitle="Kimlik bilgilerinizi girin" styles={styles} />
          <View style={styles.form}>
            <Input label="Ad *" value={firstName} onChangeText={setFirstName} placeholder="Adınız" />
            <Input label="Soyad *" value={lastName} onChangeText={setLastName} placeholder="Soyadınız" />
            <DatePartsPicker label="Doğum Tarihi *" value={dob} onChange={setDob} />
          </View>
          <View style={styles.footer}>
            <TouchableOpacity style={styles.btnPrimary} onPress={handleNext} activeOpacity={0.8}>
              <Text style={styles.btnPrimaryText}>İleri</Text>
              <Feather name="chevron-right" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {step === 2 && (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <StepHeader step={2} title="Konum & Bilgiler" subtitle="Nerede çalışmak istersiniz?" styles={styles} />
          <View style={styles.form}>
            <SelectPicker
              label="Şehir *"
              placeholder="Şehir seçin"
              value={city}
              onSelect={(v) => { setCity(v); setDistrict(""); }}
              options={CITY_NAMES}
            />
            <SelectPicker
              label="İlçe *"
              placeholder="İlçe seçin"
              value={district}
              onSelect={setDistrict}
              options={districts}
              disabled={!city}
            />
            <Text style={styles.fieldLabel}>Cinsiyet *</Text>
            <View style={styles.pillRow}>
              <PillButton label="Erkek" selected={gender === "erkek"} onPress={() => { setGender("erkek"); }} styles={styles} />
              <PillButton label="Kadın" selected={gender === "kadin"} onPress={() => { setGender("kadin"); setMilitaryStatus(""); }} styles={styles} />
            </View>
            {gender === "erkek" && (
              <View style={[styles.subSection, { backgroundColor: subSectionBg, borderColor: subSectionBorder }]}>
                <Text style={styles.fieldLabel}>Askerlik Durumu *</Text>
                <View style={styles.pillGrid}>
                  {ASKERLIK_OPTIONS.map((opt) => (
                    <PillButton key={opt.value} label={opt.label} selected={militaryStatus === opt.value} onPress={() => setMilitaryStatus(opt.value)} styles={styles} />
                  ))}
                </View>
              </View>
            )}
          </View>
          <View style={styles.footer}>
            <TouchableOpacity style={styles.btnSecondary} onPress={handleBack} activeOpacity={0.8}>
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
          <StepHeader step={3} title="Sağlık Bilgisi" subtitle="Bu bilgiler gizli tutulur" styles={styles} />
          <View style={styles.form}>
            <Text style={styles.fieldLabel}>Engelli misiniz? *</Text>
            <View style={styles.pillRow}>
              <PillButton label="Evet" selected={disability === true} onPress={() => setDisability(true)} styles={styles} />
              <PillButton label="Hayır" selected={disability === false} onPress={() => { setDisability(false); setDisabilityCategory(""); setDisabilityRateStr(""); }} styles={styles} />
            </View>
            {disability === true && (
              <View style={[styles.subSection, { backgroundColor: subSectionBg, borderColor: subSectionBorder }]}>
                <Text style={styles.fieldLabel}>Engel Kategorisi *</Text>
                {ENGEL_KATEGORILERI.map((k) => (
                  <TouchableOpacity
                    key={k.value}
                    onPress={() => setDisabilityCategory(k.value)}
                    style={[styles.listItem, disabilityCategory === k.value && styles.listItemSelected]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.listItemText, disabilityCategory === k.value && styles.listItemTextSelected]}>
                      {k.label}
                    </Text>
                    {disabilityCategory === k.value && (
                      <Feather name="check" size={16} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
                <View style={{ marginTop: 8 }}>
                  <SelectPicker
                    label="Engellilik Oranı *"
                    placeholder="Oran seçin"
                    value={disabilityRateStr}
                    onSelect={setDisabilityRateStr}
                    options={ENGELLILIK_ORANLARI}
                  />
                </View>
              </View>
            )}
          </View>
          <View style={styles.footer}>
            <TouchableOpacity style={styles.btnSecondary} onPress={handleBack} activeOpacity={0.8}>
              <Feather name="chevron-left" size={20} color={theme.colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnPrimary, { flex: 1 }]} onPress={handleNext} activeOpacity={0.8}>
              <Text style={styles.btnPrimaryText}>İleri</Text>
              <Feather name="chevron-right" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {step === 4 && (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <StepHeader step={4} title="Eğitim Durumu" subtitle="En son tamamladığınız eğitim" styles={styles} />
          <View style={styles.form}>
            {EGITIM_SEVIYELERI.map((e, i) => (
              <TouchableOpacity
                key={e.value}
                onPress={() => setEducationLevel(e.value)}
                style={[styles.eduItem, educationLevel === e.value && styles.eduItemSelected]}
                activeOpacity={0.7}
              >
                <View style={[styles.eduNum, educationLevel === e.value && styles.eduNumSelected]}>
                  <Text style={[styles.eduNumText, educationLevel === e.value && styles.eduNumTextSelected]}>
                    {i + 1}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.eduLabel, educationLevel === e.value && styles.eduLabelSelected]}>
                    {e.label}
                  </Text>
                  <Text style={[styles.eduSub, educationLevel === e.value && styles.eduSubSelected]}>
                    {e.sub}
                  </Text>
                </View>
                {educationLevel === e.value && (
                  <View style={styles.eduCheck}>
                    <Feather name="check" size={14} color={theme.colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.footer}>
            <TouchableOpacity style={styles.btnSecondary} onPress={handleBack} activeOpacity={0.8}>
              <Feather name="chevron-left" size={20} color={theme.colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnPrimary, { flex: 1 }, mut.isPending && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={mut.isPending}
              activeOpacity={0.8}
            >
              <Text style={styles.btnPrimaryText}>{mut.isPending ? "Kaydediliyor…" : "Tamamla"}</Text>
              {!mut.isPending && <Feather name="check" size={20} color="#fff" />}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
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
    fieldLabel: { fontFamily: theme.font.medium, fontSize: 13, color: theme.colors.text, marginBottom: 6 },
    pillRow: { flexDirection: "row", gap: 10 },
    pillGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
    pill: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      alignItems: "center",
    },
    pillSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    pillText: { fontFamily: theme.font.medium, fontSize: 14, color: theme.colors.text },
    pillTextSelected: { color: "#fff" },
    subSection: {
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      gap: 8,
      borderWidth: 1,
    },
    listItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },
    listItemSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.isDark ? `${theme.colors.primary}15` : "#FFF5EE",
    },
    listItemText: { fontFamily: theme.font.regular, fontSize: 14, color: theme.colors.text },
    listItemTextSelected: { fontFamily: theme.font.medium, color: theme.colors.primary },
    eduItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },
    eduItemSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.isDark ? `${theme.colors.primary}15` : "#FFF5EE",
    },
    eduNum: {
      width: 32,
      height: 32,
      borderRadius: 99,
      backgroundColor: theme.colors.bg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    eduNumSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    eduNumText: { fontFamily: theme.font.bold, fontSize: 13, color: theme.colors.subtext },
    eduNumTextSelected: { color: "#fff" },
    eduLabel: { fontFamily: theme.font.semibold, fontSize: 14, color: theme.colors.text },
    eduLabelSelected: { color: theme.colors.primary },
    eduSub: { fontFamily: theme.font.regular, fontSize: 12, color: theme.colors.subtext, marginTop: 1 },
    eduSubSelected: { color: theme.colors.primary, opacity: 0.7 },
    eduCheck: {
      width: 24,
      height: 24,
      borderRadius: 99,
      backgroundColor: theme.isDark ? `${theme.colors.primary}30` : "#FFD4B3",
      alignItems: "center",
      justifyContent: "center",
    },
    footer: { flexDirection: "row", gap: 10, marginTop: 28 },
    btnPrimary: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: theme.colors.primary,
      paddingVertical: 16,
      borderRadius: theme.radius.xl,
    },
    btnPrimaryText: { fontFamily: theme.font.semibold, fontSize: 16, color: "#fff" },
    btnSecondary: {
      width: 54,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.xl,
    },
  });
}
