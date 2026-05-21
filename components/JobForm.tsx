import React, { useState, useMemo } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListMyJobsQueryOptions,
  useCreateJob,
  useUpdateJob,
  type Job,
} from "@workspace/api-client-react";
import { Button, Input, Muted } from "@/components/UI";
import { CategoryPicker } from "@/components/CategoryPicker";
import { SelectPicker } from "@/components/SelectPicker";
import { CITY_NAMES, getDistrictsForCity } from "@/lib/turkey-locations";
import { useTheme, type Theme } from "@/lib/theme";

const TYPES = [
  { id: "fullTime", label: "Tam zamanlı" },
  { id: "partTime", label: "Yarı zamanlı" },
  { id: "daily", label: "Günlük" },
] as const;

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDateSafe(s?: string | null): Date {
  if (s) {
    const d = new Date(s + "T00:00:00");
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

function formatDisplayDate(s?: string | null): string {
  if (!s) return "";
  const d = new Date(s + "T00:00:00");
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
}

export function JobForm({ mode, job }: { mode: "create" | "edit"; job?: Job }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const router = useRouter();
  const qc = useQueryClient();
  const create = useCreateJob();
  const update = useUpdateJob();

  const [title, setTitle] = useState(job?.title ?? "");
  const [position, setPosition] = useState(job?.position ?? "");
  const [city, setCity] = useState(job?.city ?? "");
  const [district, setDistrict] = useState(job?.district ?? "");
  const districts = useMemo(() => (city ? getDistrictsForCity(city) : []), [city]);

  function handleCityChange(val: string) {
    setCity(val);
    setDistrict("");
  }
  const [type, setType] = useState<typeof TYPES[number]["id"]>(
    (job?.employmentType as "fullTime") ?? "fullTime",
  );
  const [salaryMin, setSalaryMin] = useState(job?.salaryMin?.toString() ?? "");
  const [salaryMax, setSalaryMax] = useState(job?.salaryMax?.toString() ?? "");
  const [description, setDescription] = useState(job?.description ?? "");
  const [categoryIds, setCategoryIds] = useState<string[]>(job?.categoryId ? [job.categoryId] : []);
  const [customCategory, setCustomCategory] = useState(job?.customCategory ?? "");

  const [workDate, setWorkDate] = useState<string>(job?.workDate ?? "");
  const [dailyWage, setDailyWage] = useState(job?.dailyWage?.toString() ?? "");
  const [workersNeeded, setWorkersNeeded] = useState(job?.workersNeeded?.toString() ?? "");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [disabilityFriendly, setDisabilityFriendly] = useState(job?.disabilityFriendly ?? false);

  const isDaily = type === "daily";

  const submit = async () => {
    if (!title.trim() || !position.trim() || !city.trim()) {
      Alert.alert("Hata", "Başlık, pozisyon ve şehir zorunludur.");
      return;
    }
    if (!categoryIds[0] && !customCategory.trim()) {
      Alert.alert("Hata", "Bir kategori seçin veya özel kategori yazın.");
      return;
    }
    if (isDaily && !workDate) {
      Alert.alert("Hata", "Günlük ilan için çalışma tarihi seçin.");
      return;
    }
    const payload = {
      title: title.trim(),
      position: position.trim(),
      city: city.trim(),
      district: district.trim() || undefined,
      employmentType: type,
      salaryMin: salaryMin ? Number(salaryMin) : undefined,
      salaryMax: salaryMax ? Number(salaryMax) : undefined,
      description: description.trim() || undefined,
      categoryId: categoryIds[0],
      customCategory: customCategory.trim() || undefined,
      workDate: isDaily ? (workDate || undefined) : undefined,
      dailyWage: isDaily && dailyWage ? Number(dailyWage) : undefined,
      workersNeeded: isDaily && workersNeeded ? Number(workersNeeded) : undefined,
      disabilityFriendly,
    };
    try {
      if (mode === "create") {
        await create.mutateAsync({ data: payload });
      } else if (job) {
        await update.mutateAsync({ jobId: job.id, data: payload });
      }
      await qc.invalidateQueries({ queryKey: getListMyJobsQueryOptions().queryKey });
      router.back();
    } catch (err: unknown) {
      const apiData = err && typeof err === "object" && "data" in err
        ? (err as { data?: { code?: string; error?: string } }).data
        : undefined;
      if (apiData?.code === "EMAIL_NOT_VERIFIED") {
        Alert.alert(
          "E-posta doğrulanmadı",
          "İlan oluşturmak için kurumsal e-postanızı doğrulamanız gerekiyor.",
          [
            { text: "Kapat", style: "cancel" },
            { text: "Profili Düzenle", onPress: () => router.push("/profile/edit-employer") },
          ],
        );
      } else {
        Alert.alert("Hata", "İlan kaydedilemedi.");
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Input label="İlan başlığı*" value={title} onChangeText={setTitle} placeholder="Örn: Tecrübeli inşaat personeli aranıyor" />
      <Input label="Pozisyon*" value={position} onChangeText={setPosition} placeholder="Örn: Çalışan, Garson, Şoför" />
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <SelectPicker
            label="Şehir*"
            placeholder="İl seçin"
            value={city}
            onSelect={handleCityChange}
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
      <Text style={styles.label}>Çalışma türü*</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {TYPES.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => setType(t.id)}
            style={[styles.typeChip, type === t.id && styles.typeChipSelected]}
          >
            <Text style={[styles.typeChipText, type === t.id && styles.typeChipTextSelected]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {isDaily ? (
        <View style={styles.dailyBox}>
          <Text style={styles.dailyTitle}>Günlük İş Detayları</Text>
          <Text style={styles.label}>Çalışma tarihi*</Text>
          <Pressable onPress={() => setShowDatePicker(true)} style={styles.dateRow}>
            <Text style={[styles.dateText, !workDate && { color: theme.colors.subtext }]}>
              {workDate ? formatDisplayDate(workDate) : "Tarih seçin"}
            </Text>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={parseDateSafe(workDate)}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              minimumDate={new Date()}
              onChange={(_e, selected) => {
                setShowDatePicker(Platform.OS === "ios");
                if (selected) setWorkDate(toIsoDate(selected));
              }}
            />
          )}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Input label="Günlük ücret (TL)" value={dailyWage} onChangeText={setDailyWage} keyboardType="numeric" placeholder="Örn: 800" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Kişi sayısı" value={workersNeeded} onChangeText={setWorkersNeeded} keyboardType="numeric" placeholder="Örn: 3" />
            </View>
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Input label="Min ücret (TL)" value={salaryMin} onChangeText={setSalaryMin} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Max ücret (TL)" value={salaryMax} onChangeText={setSalaryMax} keyboardType="numeric" />
          </View>
        </View>
      )}

      <Text style={styles.label}>Kategori*</Text>
      <CategoryPicker selected={categoryIds} onChange={setCategoryIds} multi={false} />
      <Input
        label="Özel kategori (opsiyonel)"
        value={customCategory}
        onChangeText={setCustomCategory}
        placeholder="Listede yoksa yazın"
      />
      <Input
        label="Açıklama"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        style={{ minHeight: 100, textAlignVertical: "top" }}
      />
      <Pressable
        onPress={() => setDisabilityFriendly((v) => !v)}
        style={[styles.toggleRow, disabilityFriendly && { borderColor: theme.colors.success }]}
      >
        <Text style={[styles.label, { flex: 1 }]}>Engelli çalışan tercih edilir</Text>
        <View style={[styles.toggle, disabilityFriendly && styles.toggleOn]}>
          <View style={[styles.toggleDot, disabilityFriendly && styles.toggleDotOn]} />
        </View>
      </Pressable>
      <Button
        title={mode === "create" ? "İlanı yayınla" : "Değişiklikleri kaydet"}
        onPress={submit}
        loading={create.isPending || update.isPending}
      />
      <Muted style={{ textAlign: "center" }}>
        İlanlar 30 gün boyunca yayında kalır.
      </Muted>
    </ScrollView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: { padding: theme.spacing.lg, gap: 12, paddingBottom: 80 },
    label: { fontFamily: theme.font.medium, fontSize: 13, color: theme.colors.text },
    typeChip: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      alignItems: "center",
    },
    typeChipSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    typeChipText: { fontFamily: theme.font.medium, color: theme.colors.text, fontSize: 13 },
    typeChipTextSelected: { color: "#fff" },
    dailyBox: {
      backgroundColor: `${theme.colors.primary}0A`,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      gap: 10,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}25`,
    },
    dailyTitle: {
      fontFamily: theme.font.semibold,
      fontSize: 14,
      color: theme.colors.primary,
    },
    dateRow: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.card,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    dateText: {
      fontFamily: theme.font.medium,
      fontSize: 14,
      color: theme.colors.text,
    },
    toggleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 14,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      backgroundColor: theme.colors.card,
    },
    toggle: { width: 38, height: 22, borderRadius: 11, backgroundColor: "#E5E7EB", padding: 2 },
    toggleOn: { backgroundColor: theme.colors.success },
    toggleDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: "#fff" },
    toggleDotOn: { transform: [{ translateX: 16 }] },
  });
}
