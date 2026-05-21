import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { getListWorkersQueryOptions } from "@workspace/api-client-react";
import { Empty, Loading } from "@/components/UI";
import { WorkerCard } from "@/components/WorkerCard";
import { CategorySelectPicker } from "@/components/CategorySelectPicker";
import { SelectPicker } from "@/components/SelectPicker";
import { CITY_NAMES, getDistrictsForCity } from "@/lib/turkey-locations";
import { useTheme, type Theme } from "@/lib/theme";
import { useAppStateRefetch } from "@/lib/useAppStateRefetch";

export default function WorkersTab() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const router = useRouter();
  const [searchRaw, setSearchRaw] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [disabilityOnly, setDisabilityOnly] = useState(false);
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const districts = useMemo(() => (city ? getDistrictsForCity(city) : []), [city]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleCityChange(val: string) {
    setCity(val);
    setDistrict("");
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(searchRaw);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchRaw]);

  const params = useMemo(
    () => ({
      search: search || undefined,
      categoryId: category,
      city: city || undefined,
      district: district || undefined,
      disabilityOnly: disabilityOnly || undefined,
      limit: 50,
    }),
    [search, category, city, district, disabilityOnly],
  );

  const q = useQuery(getListWorkersQueryOptions(params));
  const items = q.data?.items ?? [];

  useAppStateRefetch(q.refetch);

  const renderItem = useCallback(
    ({ item }: { item: typeof items[number] }) => (
      <View style={{ marginBottom: 12 }}>
        <WorkerCard worker={item} onPress={() => router.push(`/worker/${item.id}`)} />
      </View>
    ),
    [router],
  );

  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.id}
      contentContainerStyle={styles.list}
      renderItem={renderItem}
      removeClippedSubviews={Platform.OS === "android"}
      maxToRenderPerBatch={10}
      initialNumToRender={8}
      windowSize={10}
      ListHeaderComponent={
        <View style={{ gap: 10, paddingBottom: 12 }}>
          <View style={styles.searchRow}>
            <Feather name="search" size={18} color={theme.colors.subtext} />
            <TextInput
              value={searchRaw}
              onChangeText={setSearchRaw}
              placeholder="İsim, beceri veya açıklama..."
              placeholderTextColor={theme.colors.subtext}
              style={styles.searchInput}
            />
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <CategorySelectPicker value={category} onChange={setCategory} />
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 4 }}>
              <View style={{ flex: 1 }}>
                <SelectPicker
                  label=""
                  placeholder="İl seçin"
                  value={city}
                  onSelect={handleCityChange}
                  options={CITY_NAMES}
                />
              </View>
              {city ? (
                <Pressable onPress={() => { setCity(""); setDistrict(""); }} hitSlop={8} style={styles.clearBtn}>
                  <Feather name="x" size={14} color={theme.colors.subtext} />
                </Pressable>
              ) : null}
            </View>
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 4 }}>
              <View style={{ flex: 1 }}>
                <SelectPicker
                  label=""
                  placeholder="İlçe seçin"
                  value={district}
                  onSelect={setDistrict}
                  options={districts}
                  disabled={!city}
                />
              </View>
              {district ? (
                <Pressable onPress={() => setDistrict("")} hitSlop={8} style={styles.clearBtn}>
                  <Feather name="x" size={14} color={theme.colors.subtext} />
                </Pressable>
              ) : null}
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -2 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}>
            <Pressable
              onPress={() => setDisabilityOnly((v) => !v)}
              style={({ pressed }) => [
                styles.filterChip,
                disabilityOnly && styles.filterChipActive,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Feather name="shield" size={14} color={disabilityOnly ? "#fff" : theme.colors.subtext} />
              <Text style={[styles.filterChipText, disabilityOnly && styles.filterChipTextActive]}>
                Engelli adaylar
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      }
      ListEmptyComponent={
        q.isLoading ? <Loading /> : <Empty title="İş Arayan Bulunamadı" subtitle="Farklı kategori ya da arama deneyin." />
      }
      refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} />}
    />
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    list: { padding: theme.spacing.lg, paddingBottom: 100 },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.card,
      paddingHorizontal: 12,
      borderRadius: theme.radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      fontFamily: theme.font.regular,
      color: theme.colors.text,
    },
    filterChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      alignSelf: "flex-start",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: theme.radius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },
    filterChipActive: { backgroundColor: "#5B8DEF", borderColor: "#5B8DEF" },
    filterChipText: { fontFamily: theme.font.medium, fontSize: 13, color: theme.colors.subtext },
    filterChipTextActive: { color: "#fff" },
    clearBtn: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
