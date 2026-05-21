import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme, type Theme } from "@/lib/theme";

export const SECTORS = [
  "İnşaat",
  "Temizlik",
  "Güvenlik",
  "Fabrika / Üretim",
  "Tarım",
  "Nakliyat / Lojistik",
  "Restoran / Otel",
  "Perakende / Mağaza",
  "Tekstil",
  "Bakım / Sağlık",
  "Teknoloji",
  "Eğitim",
  "Diğer",
];

interface SectorPickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function SectorPicker({ label, value, onChange, error }: SectorPickerProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [open, setOpen] = useState(false);

  const isOther = value !== "" && !SECTORS.slice(0, -1).includes(value);
  const displaySector = isOther ? "Diğer" : value;

  function handleSelect(item: string) {
    if (item === "Diğer") {
      onChange("Diğer");
    } else {
      onChange(item);
    }
    setOpen(false);
  }

  return (
    <>
      <View style={{ gap: 6 }}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <Pressable
          onPress={() => setOpen(true)}
          style={({ pressed }) => [styles.field, pressed && styles.fieldPressed]}
        >
          <Text
            style={[styles.fieldText, !value && styles.fieldPlaceholder]}
            numberOfLines={1}
          >
            {value || "Sektör seçin"}
          </Text>
          <Feather name="chevron-down" size={16} color={theme.colors.subtext} />
        </Pressable>

        {(isOther || displaySector === "Diğer") && (
          <TextInput
            value={isOther && value !== "Diğer" ? value : ""}
            onChangeText={onChange}
            placeholder="Sektörünüzü yazın..."
            placeholderTextColor={theme.colors.subtext}
            style={styles.customInput}
            autoFocus={displaySector === "Diğer"}
          />
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.modalContainer}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label || "Sektör seçin"}</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={12}>
                <Feather name="x" size={22} color={theme.colors.text} />
              </Pressable>
            </View>
            <FlatList
              data={SECTORS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const selected = item === "Diğer" ? isOther || value === "Diğer" : item === value;
                return (
                  <Pressable
                    onPress={() => handleSelect(item)}
                    style={({ pressed }) => [
                      styles.option,
                      selected && styles.optionSelected,
                      pressed && styles.optionPressed,
                    ]}
                  >
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                      {item}
                    </Text>
                    {selected && (
                      <Feather name="check" size={16} color={theme.colors.primary} />
                    )}
                  </Pressable>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              contentContainerStyle={{ paddingBottom: 40 }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    label: {
      fontFamily: theme.font.medium,
      fontSize: 13,
      color: theme.colors.text,
    },
    field: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    fieldPressed: { opacity: 0.7 },
    fieldText: {
      fontFamily: theme.font.regular,
      fontSize: 15,
      color: theme.colors.text,
      flex: 1,
    },
    fieldPlaceholder: { color: theme.colors.subtext },
    customInput: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.primary,
      fontFamily: theme.font.regular,
      fontSize: 15,
      color: theme.colors.text,
    },
    errorText: {
      fontSize: 12,
      color: theme.colors.danger,
      fontFamily: theme.font.medium,
    },
    modalContainer: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.35)",
    },
    sheet: {
      backgroundColor: theme.colors.bg,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "65%",
      paddingTop: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 10,
    },
    sheetHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    sheetTitle: {
      fontFamily: theme.font.semibold,
      fontSize: 16,
      color: theme.colors.text,
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      paddingHorizontal: 20,
    },
    optionSelected: { backgroundColor: `${theme.colors.primary}10` },
    optionPressed: { backgroundColor: theme.colors.border },
    optionText: {
      fontFamily: theme.font.regular,
      fontSize: 15,
      color: theme.colors.text,
    },
    optionTextSelected: {
      fontFamily: theme.font.semibold,
      color: theme.colors.primary,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
      marginLeft: 20,
    },
  });
}
