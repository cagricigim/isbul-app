import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme, type Theme } from "@/lib/theme";

export const COMPANY_SIZE_OPTIONS = ["1-10", "11-50", "51-100", "101-250", "250+"];

interface CompanySizePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
}

export function CompanySizePicker({ label, value, onChange }: CompanySizePickerProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={{ gap: 8 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {COMPANY_SIZE_OPTIONS.map((option) => {
          const selected = value === option;
          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              style={({ pressed }) => [
                styles.chip,
                selected && styles.chipSelected,
                pressed && !selected && styles.chipPressed,
              ]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    label: {
      fontFamily: theme.font.medium,
      fontSize: 13,
      color: theme.colors.text,
    },
    chips: {
      flexDirection: "row",
      gap: 8,
      paddingRight: 4,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: theme.radius.full,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },
    chipSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: `${theme.colors.primary}15`,
    },
    chipPressed: {
      opacity: 0.7,
    },
    chipText: {
      fontFamily: theme.font.medium,
      fontSize: 14,
      color: theme.colors.subtext,
    },
    chipTextSelected: {
      color: theme.colors.primary,
      fontFamily: theme.font.semibold,
    },
  });
}
