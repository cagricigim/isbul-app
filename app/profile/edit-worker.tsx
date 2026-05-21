import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import {
  getGetMyWorkerProfileQueryOptions,
  useAddMyWorkerEducation,
  useAddMyWorkerExperience,
  useDeleteMyWorkerEducation,
  useDeleteMyWorkerExperience,
  useUpdateMyWorkerProfile,
  useSendMeEmailVerification,
  useConfirmMeEmailVerification,
  getGetCurrentUserQueryOptions,
} from "@workspace/api-client-react";
import { Button, Card, DateInput, ErrorState, H2, Input, Loading, Muted } from "@/components/UI";
import { PhotoPicker } from "@/components/PhotoPicker";
import { CategoryPicker } from "@/components/CategoryPicker";
import { SelectPicker } from "@/components/SelectPicker";
import { DatePartsPicker } from "@/components/DatePartsPicker";
import { CITY_NAMES, getDistrictsForCity } from "@/lib/turkey-locations";
import { useTheme, type Theme } from "@/lib/theme";
import { isoToDisplay } from "@/lib/format";

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

export default function EditWorker() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const router = useRouter();
  const qc = useQueryClient();
  const q = useQuery(getGetMyWorkerProfileQueryOptions());
  const meQ = useQuery(getGetCurrentUserQueryOptions());
  const update = useUpdateMyWorkerProfile();
  const sendEmailVerif = useSendMeEmailVerification();
  const confirmEmailVerif = useConfirmMeEmailVerification();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [skills, setSkills] = useState("");
  const [customCategories, setCustomCategories] = useState("");
  const [disability, setDisability] = useState<boolean | null>(null);
  const [disabilityCategory, setDisabilityCategory] = useState("");
  const [disabilityRateStr, setDisabilityRateStr] = useState("");

  const [emailInput, setEmailInput] = useState("");
  const [emailRequestId, setEmailRequestId] = useState<string | null>(null);
  const [emailCode, setEmailCode] = useState("");
  const [emailStep, setEmailStep] = useState<"idle" | "sent">("idle");

  useEffect(() => {
    if (q.data) {
      setFirstName(q.data.firstName);
      setLastName(q.data.lastName);
      const rawDob = q.data.dateOfBirth;
      setDob(rawDob ? String(rawDob).slice(0, 10) : "");
      setCity(q.data.city);
      setDistrict(q.data.district);
      setBio(q.data.bio ?? "");
      setPhotoUrl(q.data.photoUrl);
      setCategoryIds((q.data.categories ?? []).map((c) => c.id));
      setSkills((q.data.skills ?? []).join(", "));
      setCustomCategories((q.data.customCategories ?? []).join(", "));
      setDisability(q.data.disability ?? null);
      setDisabilityCategory(q.data.disabilityCategory ?? "");
      setDisabilityRateStr(q.data.disabilityRate != null ? `%${q.data.disabilityRate}` : "");
    }
  }, [q.data]);

  function handleCitySelect(selectedCity: string) {
    setCity(selectedCity);
    setDistrict("");
  }

  function isAtLeast18(iso: string): boolean {
    const [y, m, d] = iso.split("-").map(Number);
    const dobDate = new Date(y, m - 1, d);
    const today = new Date();
    const age = today.getFullYear() - dobDate.getFullYear() -
      (today.getMonth() < dobDate.getMonth() ||
        (today.getMonth() === dobDate.getMonth() && today.getDate() < dobDate.getDate())
        ? 1
        : 0);
    return age >= 18;
  }

  const submit = async () => {
    if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      Alert.alert("Hata", "Lütfen doğum tarihinizi seçin.");
      return;
    }
    if (!isAtLeast18(dob)) {
      Alert.alert("Hata", "Kayıt olmak için en az 18 yaşında olmanız gereklidir.");
      return;
    }
    if (disability === true && !disabilityCategory) {
      Alert.alert("Hata", "Lütfen engel kategorinizi seçin.");
      return;
    }
    if (disability === true && !disabilityRateStr) {
      Alert.alert("Hata", "Lütfen engellilik oranınızı seçin.");
      return;
    }
    try {
      await update.mutateAsync({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dateOfBirth: dob,
          city,
          district,
          bio: bio.trim() || undefined,
          photoUrl,
          categoryIds,
          customCategories: customCategories.split(",").map((s) => s.trim()).filter(Boolean),
          skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
          disability: disability ?? undefined,
          disabilityCategory: disability && disabilityCategory ? (disabilityCategory as "gorme" | "isitme" | "ortopedik" | "zihinsel" | "ruhsal" | "kronik" | "konusma" | "diger") : undefined,
          disabilityRate: disability && disabilityRateStr ? parseInt(disabilityRateStr.replace("%", ""), 10) : undefined,
        },
      });
      await qc.invalidateQueries({ queryKey: getGetMyWorkerProfileQueryOptions().queryKey });
      Alert.alert("Kaydedildi", "Profiliniz güncellendi.");
    } catch (e: unknown) {
      const apiMsg =
        (e as { data?: { error?: string } } | null)?.data?.error;
      Alert.alert("Hata", apiMsg || "Profil kaydedilemedi. Lütfen tekrar deneyin.");
    }
  };

  if (q.isLoading) return <Loading />;
  if (q.error || !q.data) {
    return <ErrorState message="Profil yüklenemedi." onRetry={() => q.refetch()} />;
  }

  const districts = getDistrictsForCity(city);

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={{ alignItems: "center" }}>
        <PhotoPicker value={photoUrl} onChange={setPhotoUrl} label="Fotoğraf" />
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Input label="Ad" value={firstName} onChangeText={setFirstName} />
        </View>
        <View style={{ flex: 1 }}>
          <Input label="Soyad" value={lastName} onChangeText={setLastName} />
        </View>
      </View>
      <DatePartsPicker label="Doğum tarihi" value={dob} onChange={setDob} />
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <SelectPicker
            label="Şehir"
            placeholder="Şehir seçin"
            value={city}
            onSelect={handleCitySelect}
            options={CITY_NAMES}
          />
        </View>
        <View style={{ flex: 1 }}>
          <SelectPicker
            label="İlçe"
            placeholder="İlçe seçin"
            value={district}
            onSelect={setDistrict}
            options={districts}
            disabled={!city}
          />
        </View>
      </View>
      <Input
        label="Hakkımda"
        value={bio}
        onChangeText={setBio}
        multiline
        numberOfLines={4}
        style={{ minHeight: 100, textAlignVertical: "top" }}
      />
      <Text style={styles.label}>Kategoriler</Text>
      <CategoryPicker selected={categoryIds} onChange={setCategoryIds} />
      <Input label="Özel kategoriler (virgülle)" value={customCategories} onChangeText={setCustomCategories} />
      <Input label="Yetenekler (virgülle)" value={skills} onChangeText={setSkills} />

      <Card>
        <Text style={styles.label}>Engellilik Durumu</Text>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 8 }}>
          <TouchableOpacity
            style={[styles.pill, disability === true && styles.pillSelected]}
            onPress={() => setDisability(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, disability === true && styles.pillTextSelected]}>Evet</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pill, disability === false && styles.pillSelected]}
            onPress={() => { setDisability(false); setDisabilityCategory(""); setDisabilityRateStr(""); }}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, disability === false && styles.pillTextSelected]}>Hayır</Text>
          </TouchableOpacity>
        </View>
        {disability === true && (
          <View style={{ gap: 8 }}>
            <Text style={styles.label}>Engel Kategorisi</Text>
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
            <View style={{ marginTop: 4 }}>
              <SelectPicker
                label="Engellilik Oranı"
                placeholder="Oran seçin"
                value={disabilityRateStr}
                onSelect={setDisabilityRateStr}
                options={ENGELLILIK_ORANLARI}
              />
            </View>
          </View>
        )}
      </Card>

      <ExperiencesSection styles={styles} theme={theme} />
      <EducationsSection styles={styles} theme={theme} />

      <EmailVerificationCard
        theme={theme}
        styles={styles}
        currentEmail={meQ.data?.email}
        emailVerified={meQ.data?.emailVerified ?? false}
        emailInput={emailInput}
        setEmailInput={setEmailInput}
        emailCode={emailCode}
        setEmailCode={setEmailCode}
        emailStep={emailStep}
        sending={sendEmailVerif.isPending}
        confirming={confirmEmailVerif.isPending}
        onSend={async () => {
          if (!emailInput.trim() || !emailInput.includes("@")) {
            Alert.alert("Hata", "Lütfen geçerli bir e-posta adresi girin.");
            return;
          }
          try {
            const res = await sendEmailVerif.mutateAsync({ data: { email: emailInput.trim() } });
            setEmailRequestId(res.requestId);
            setEmailStep("sent");
            if (res.devCode) Alert.alert("Dev Kodu", res.devCode);
          } catch {
            Alert.alert("Hata", "Kod gönderilemedi. Lütfen tekrar deneyin.");
          }
        }}
        onConfirm={async () => {
          if (!emailRequestId || !emailCode.trim()) return;
          try {
            await confirmEmailVerif.mutateAsync({ data: { requestId: emailRequestId, code: emailCode.trim() } });
            await qc.invalidateQueries({ queryKey: getGetCurrentUserQueryOptions().queryKey });
            setEmailStep("idle");
            setEmailCode("");
            Alert.alert("Başarılı", "E-posta adresiniz doğrulandı.");
          } catch {
            Alert.alert("Hata", "Kod hatalı veya süresi dolmuş.");
          }
        }}
        onReset={() => { setEmailStep("idle"); setEmailCode(""); setEmailRequestId(null); }}
      />

      <Button title="Kaydet" onPress={submit} loading={update.isPending} />
    </ScrollView>
  );
}

function EmailVerificationCard({
  theme, styles, currentEmail, emailVerified,
  emailInput, setEmailInput, emailCode, setEmailCode,
  emailStep, sending, confirming, onSend, onConfirm, onReset,
}: {
  theme: Theme;
  styles: ReturnType<typeof makeStyles>;
  currentEmail?: string;
  emailVerified: boolean;
  emailInput: string;
  setEmailInput: (v: string) => void;
  emailCode: string;
  setEmailCode: (v: string) => void;
  emailStep: "idle" | "sent";
  sending: boolean;
  confirming: boolean;
  onSend: () => void;
  onConfirm: () => void;
  onReset: () => void;
}) {
  return (
    <Card>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Feather
          name={emailVerified ? "check-circle" : "mail"}
          size={18}
          color={emailVerified ? theme.colors.success ?? "#22c55e" : theme.colors.primary}
        />
        <Text style={[styles.label, { marginBottom: 0 }]}>E-posta Doğrulaması</Text>
      </View>
      {emailVerified ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ fontFamily: theme.font.regular, color: theme.colors.success ?? "#22c55e", fontSize: 14 }}>
            {currentEmail} ✓ Doğrulandı
          </Text>
        </View>
      ) : (
        <>
          <Text style={{ fontFamily: theme.font.regular, color: theme.colors.subtext, fontSize: 13, marginBottom: 10 }}>
            Mesajlaşabilmek için e-posta adresinizi doğrulamanız gerekiyor.
          </Text>
          {emailStep === "idle" ? (
            <>
              <Input
                label="E-posta adresi"
                value={emailInput}
                onChangeText={setEmailInput}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Button title="Doğrulama Kodu Gönder" onPress={onSend} loading={sending} />
            </>
          ) : (
            <>
              <Text style={{ fontFamily: theme.font.regular, color: theme.colors.subtext, fontSize: 13, marginBottom: 8 }}>
                {emailInput} adresine 6 haneli bir kod gönderdik.
              </Text>
              <Input
                label="Doğrulama Kodu"
                value={emailCode}
                onChangeText={setEmailCode}
                keyboardType="number-pad"
                maxLength={6}
              />
              <Button title="Onayla" onPress={onConfirm} loading={confirming} />
              <Pressable onPress={onReset} style={{ marginTop: 8, alignItems: "center" }}>
                <Text style={{ fontFamily: theme.font.regular, color: theme.colors.primary, fontSize: 13 }}>
                  Farklı e-posta kullan
                </Text>
              </Pressable>
            </>
          )}
        </>
      )}
    </Card>
  );
}

function ExperiencesSection({ styles, theme }: { styles: ReturnType<typeof makeStyles>; theme: Theme }) {
  const qc = useQueryClient();
  const q = useQuery(getGetMyWorkerProfileQueryOptions());
  const add = useAddMyWorkerExperience();
  const del = useDeleteMyWorkerExperience();
  const [adding, setAdding] = useState(false);
  const [workplace, setWorkplace] = useState("");
  const [position, setPosition] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [description, setDescription] = useState("");

  const onAdd = async () => {
    if (!workplace.trim() || !position.trim() || !start.trim()) {
      Alert.alert("Hata", "İşyeri, pozisyon ve başlangıç tarihi zorunludur.");
      return;
    }
    try {
      await add.mutateAsync({
        data: {
          workplace: workplace.trim(),
          position: position.trim(),
          startDate: start,
          endDate: end || undefined,
          description: description.trim() || undefined,
        },
      });
      await qc.invalidateQueries({ queryKey: getGetMyWorkerProfileQueryOptions().queryKey });
      setWorkplace(""); setPosition(""); setStart(""); setEnd(""); setDescription("");
      setAdding(false);
    } catch {
      Alert.alert("Hata", "Eklenemedi.");
    }
  };

  return (
    <Card>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <H2>Deneyimler</H2>
        <Pressable onPress={() => setAdding(!adding)} hitSlop={8}>
          <Feather name={adding ? "x" : "plus"} size={20} color={theme.colors.primary} />
        </Pressable>
      </View>
      {q.data?.experiences?.map((e) => (
        <View key={e.id} style={styles.itemRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{e.position} - {e.workplace}</Text>
            <Muted>{isoToDisplay(e.startDate)} → {e.endDate ? isoToDisplay(e.endDate) : "Devam ediyor"}</Muted>
          </View>
          <Pressable
            onPress={async () => {
              await del.mutateAsync({ experienceId: e.id });
              await qc.invalidateQueries({ queryKey: getGetMyWorkerProfileQueryOptions().queryKey });
            }}
          >
            <Feather name="trash-2" size={16} color={theme.colors.danger} />
          </Pressable>
        </View>
      ))}
      {adding ? (
        <View style={{ gap: 8, marginTop: 10 }}>
          <Input label="İşyeri" value={workplace} onChangeText={setWorkplace} />
          <Input label="Pozisyon" value={position} onChangeText={setPosition} />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <DateInput label="Başlangıç" value={start} onChange={setStart} />
            </View>
            <View style={{ flex: 1 }}>
              <DateInput label="Bitiş (opsiyonel)" value={end} onChange={setEnd} />
            </View>
          </View>
          <Input
            label="Açıklama"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={{ minHeight: 70, textAlignVertical: "top" }}
          />
          <Button title="Ekle" onPress={onAdd} loading={add.isPending} />
        </View>
      ) : null}
    </Card>
  );
}

function EducationsSection({ styles, theme }: { styles: ReturnType<typeof makeStyles>; theme: Theme }) {
  const qc = useQueryClient();
  const q = useQuery(getGetMyWorkerProfileQueryOptions());
  const add = useAddMyWorkerEducation();
  const del = useDeleteMyWorkerEducation();
  const [adding, setAdding] = useState(false);
  const [school, setSchool] = useState("");
  const [degree, setDegree] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const onAdd = async () => {
    if (!school.trim() || !degree.trim() || !start.trim()) {
      Alert.alert("Hata", "Okul, derece ve başlangıç yılı zorunludur.");
      return;
    }
    try {
      await add.mutateAsync({
        data: {
          school: school.trim(),
          degree: degree.trim(),
          startYear: Number(start),
          endYear: end ? Number(end) : undefined,
        },
      });
      await qc.invalidateQueries({ queryKey: getGetMyWorkerProfileQueryOptions().queryKey });
      setSchool(""); setDegree(""); setStart(""); setEnd("");
      setAdding(false);
    } catch {
      Alert.alert("Hata", "Eklenemedi.");
    }
  };

  return (
    <Card>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <H2>Eğitim</H2>
        <Pressable onPress={() => setAdding(!adding)} hitSlop={8}>
          <Feather name={adding ? "x" : "plus"} size={20} color={theme.colors.primary} />
        </Pressable>
      </View>
      {q.data?.educations?.map((e) => (
        <View key={e.id} style={styles.itemRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{e.degree} - {e.school}</Text>
            <Muted>{e.startYear} → {e.endYear ?? "Devam ediyor"}</Muted>
          </View>
          <Pressable
            onPress={async () => {
              await del.mutateAsync({ educationId: e.id });
              await qc.invalidateQueries({ queryKey: getGetMyWorkerProfileQueryOptions().queryKey });
            }}
          >
            <Feather name="trash-2" size={16} color={theme.colors.danger} />
          </Pressable>
        </View>
      ))}
      {adding ? (
        <View style={{ gap: 8, marginTop: 10 }}>
          <Input label="Okul" value={school} onChangeText={setSchool} />
          <Input label="Derece" value={degree} onChangeText={setDegree} placeholder="Lise / Lisans / vb." />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Input label="Başlangıç yılı" value={start} onChangeText={setStart} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Bitiş yılı (opsiyonel)" value={end} onChangeText={setEnd} keyboardType="numeric" />
            </View>
          </View>
          <Button title="Ekle" onPress={onAdd} loading={add.isPending} />
        </View>
      ) : null}
    </Card>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: { padding: theme.spacing.lg, gap: 12, paddingBottom: 80 },
    label: { fontFamily: theme.font.medium, fontSize: 13, color: theme.colors.text, marginBottom: 6 },
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      gap: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    itemTitle: { fontFamily: theme.font.semibold, fontSize: 13, color: theme.colors.text },
    pill: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.bg,
      alignItems: "center",
    },
    pillSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    pillText: { fontFamily: theme.font.medium, fontSize: 14, color: theme.colors.text },
    pillTextSelected: { color: "#fff" },
    listItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.bg,
    },
    listItemSelected: { borderColor: theme.colors.primary, backgroundColor: theme.isDark ? `${theme.colors.primary}15` : "#EEF4FF" },
    listItemText: { fontFamily: theme.font.regular, fontSize: 13, color: theme.colors.text },
    listItemTextSelected: { fontFamily: theme.font.medium, color: theme.colors.primary },
  });
}
