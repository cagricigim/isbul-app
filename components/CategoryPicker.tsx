import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getListCategoriesQueryOptions, type Category } from "@workspace/api-client-react";
import { useTheme, type Theme } from "@/lib/theme";

export function useCategories() {
  return useQuery(getListCategoriesQueryOptions());
}

export function CategoryPicker({
  selected,
  onChange,
  multi = true,
  horizontal = false,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
  multi?: boolean;
  horizontal?: boolean;
}) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { data } = useCategories();
  const cats = data ?? [];
  const toggle = (id: string) => {
    if (multi) {
      if (selected.includes(id)) onChange(selected.filter((x) => x !== id));
      else onChange([...selected, id]);
    } else {
      onChange(selected.includes(id) ? [] : [id]);
    }
  };
  if (horizontal) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 6 }}
      >
        {cats.map((c) => (
          <Chip
            key={c.id}
            label={c.name}
            selected={selected.includes(c.id)}
            onPress={() => toggle(c.id)}
            styles={styles}
          />
        ))}
      </ScrollView>
    );
  }
  return (
    <View style={styles.grid}>
      {cats.map((c: Category) => (
        <Chip
          key={c.id}
          label={c.name}
          selected={selected.includes(c.id)}
          onPress={() => toggle(c.id)}
          styles={styles}
        />
      ))}
    </View>
  );
}

function Chip({
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
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: theme.radius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },
    chipSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    chipText: { fontFamily: theme.font.medium, fontSize: 13, color: theme.colors.text },
    chipTextSelected: { color: "#fff" },
  });
}
