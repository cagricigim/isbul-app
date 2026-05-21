import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getGetMyEmployerProfileQueryOptions,
  useUpdateMyEmployerProfile,
} from "@workspace/api-client-react";
import { Button, ErrorState, Input, Loading } from "@/components/UI";
import { PhotoPicker } from "@/components/PhotoPicker";
import { SelectPicker } from "@/components/SelectPicker";
import { SectorPicker } from "@/components/SectorPicker";
import { CompanySizePicker } from "@/components/CompanySizePicker";
import { CITY_NAMES, getDistrictsForCity } from "@/lib/turkey-locations";
import { useTheme, type Theme } from "@/lib/theme";

export default function EditEmployer() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const qc = useQueryClient();
  const q = useQuery(getGetMyEmployerProfileQueryOptions());
  const update = useUpdateMyEmployerProfile();

  const [companyName, setCompanyName] = useState("");
  const [companyTitle, setCompanyTitle] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [sector, setSector] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [corporateEmail, setCorporateEmail] = useState("");
  const [taxDocumentUrl, setTaxDocumentUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (q.data) {
      setCompanyName(q.data.companyName);
      setCompanyTitle(q.data.companyTitle ?? "");
      setTaxNumber(q.data.taxNumber ?? "");
      setSector(q.data.sector);
      setCity(q.data.city);
      setDistrict(q.data.district);
      setCompanySize(q.data.companySize ?? "");
      setDescription(q.data.description ?? "");
      setLogoUrl(q.data.logoUrl);
      setCorporateEmail(q.data.corporateEmail ?? "");
      setTaxDocumentUrl(q.data.taxDocumentUrl ?? undefined);
    }
  }, [q.data]);

  function handleCitySelect(selectedCity: string) {
    setCity(selectedCity);
    setDistrict("");
  }

  const submit = async () => {
    try {
      if (!companyTitle.trim()) {
        Alert.alert("Hata", "Şirket unvanı zorunludur.");
        return;
      }
      if (!taxNumber.trim()) {
        Alert.alert("Hata", "Vergi numarası zorunludur.");
        return;
      }
      await update.mutateAsync({
        data: {
          companyName: companyName.trim(),
          companyTitle: companyTitle.trim(),
          taxNumber: taxNumber.trim(),
          sector: sector.trim(),
          city,
          district,
          description: description.trim() || undefined,
          logoUrl,
          companySize: companySize || undefined,
          corporateEmail: corporateEmail.trim() || undefined,
          taxDocumentUrl: taxDocumentUrl || undefined,
        },
      });
      await qc.invalidateQueries({ queryKey: getGetMyEmployerProfileQueryOptions().queryKey });
      Alert.alert("Kaydedildi", "Profiliniz güncellendi.");
    } catch (e: unknown) {
      const apiMsg =
        (e as { data?: { error?: string } } | null)?.data?.error;
      Alert.alert("Hata", apiMsg || "Kaydedilemedi. Lütfen tekrar deneyin.");
    }
  };

  if (q.isLoading) return <Loading />;
  if (q.error || !q.data) {
    return <ErrorState message="Profil yüklenemedi." onRetry={() => q.refetch()} />;
  }

  const districts = getDistrictsForCity(city);

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <PhotoPicker value={logoUrl} onChange={setLogoUrl} label="Logo" rounded={false} />
      <Input label="Şirket adı" value={companyName} onChangeText={setCompanyName} />
      <Input label="Şirket unvanı" value={companyTitle} onChangeText={setCompanyTitle} placeholder="Ticaret sicilindeki resmi unvan" />
      <Input label="Vergi numarası" value={taxNumber} onChangeText={setTaxNumber} placeholder="10 haneli vergi no" keyboardType="numeric" />
      <SectorPicker label="Sektör" value={sector} onChange={setSector} />
      <SelectPicker label="Şehir" placeholder="Şehir seçin" value={city} onSelect={handleCitySelect} options={CITY_NAMES} />
      <SelectPicker label="İlçe" placeholder="İlçe seçin" value={district} onSelect={setDistrict} options={districts} disabled={!city} />
      <CompanySizePicker label="Çalışan sayısı" value={companySize} onChange={setCompanySize} />
      <Input
        label="Kurumsal e-posta (opsiyonel)"
        value={corporateEmail}
        onChangeText={setCorporateEmail}
        placeholder="ornek@sirket.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <PhotoPicker value={taxDocumentUrl} onChange={setTaxDocumentUrl} label="Vergi Levhası" rounded={false} />
      <Input
        label="Şirket hakkında"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        style={{ minHeight: 100, textAlignVertical: "top" }}
      />
      <Button title="Kaydet" onPress={submit} loading={update.isPending} />
    </ScrollView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: { padding: theme.spacing.lg, gap: 12, paddingBottom: 80 },
  });
}
