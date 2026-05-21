import React, { useState, useMemo } from "react";
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

interface SelectPickerProps {
  label?: string;
  placeholder?: string;
  value: string;
  onSelect: (value: string) => void;
  options: string[];
  disabled?: boolean;
  error?: string;
}

export function SelectPicker({
  label,
  placeholder = "Seçiniz",
  value,
  onSelect,
  options,
  disabled,
  error,
}: SelectPickerProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, search]);

  function handleSelect(item: string) {
    onSelect(item);
    setOpen(false);
    setSearch("");
  }

  return (
    <>
      <View style={{ gap: 6 }}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <Pressable
          onPress={() => !disabled && setOpen(true)}
          style={({ pressed }) => [
            styles.field,
            disabled && styles.fieldDisabled,
            pressed && !disabled && styles.fieldPressed,
          ]}
        >
          <Text style={[styles.fieldText, !value && styles.fieldPlaceholder]} numberOfLines={1}>
            {value || placeholder}
          </Text>
          <Feather name="chevron-down" size={16} color={theme.colors.subtext} />
        </Pressable>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => { setOpen(false); setSearch(""); }}
      >
        <View style={styles.modalContainer}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => { setOpen(false); setSearch(""); }} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label || "Seçiniz"}</Text>
              <Pressable onPress={() => { setOpen(false); setSearch(""); }} hitSlop={12}>
                <Feather name="x" size={22} color={theme.colors.text} />
              </Pressable>
            </View>
            {options.length > 8 && (
              <View style={styles.searchBox}>
                <Feather name="search" size={16} color={theme.colors.subtext} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Ara..."
                  placeholderTextColor={theme.colors.subtext}
                  style={styles.searchInput}
                  autoFocus
                />
                {search ? (
                  <Pressable onPress={() => setSearch("")} hitSlop={8}>
                    <Feather name="x-circle" size={16} color={theme.colors.subtext} />
                  </Pressable>
                ) : null}
              </View>
            )}
            <FlatList
              data={filtered}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelect(item)}
                  style={({ pressed }) => [
                    styles.option,
                    item === value && styles.optionSelected,
                    pressed && styles.optionPressed,
                  ]}
                >
                  <Text style={[styles.optionText, item === value && styles.optionTextSelected]}>
                    {item}
                  </Text>
                  {item === value && (
                    <Feather name="check" size={16} color={theme.colors.primary} />
                  )}
                </Pressable>
              )}
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
    label: { fontFamily: theme.font.medium, fontSize: 13, color: theme.colors.text },
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
    fieldDisabled: { opacity: 0.5 },
    fieldPressed: { opacity: 0.7 },
    fieldText: { fontFamily: theme.font.regular, fontSize: 15, color: theme.colors.text, flex: 1 },
    fieldPlaceholder: { color: theme.colors.subtext },
    errorText: { fontSize: 12, color: theme.colors.danger, fontFamily: theme.font.medium },
    modalContainer: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
    sheet: {
      backgroundColor: theme.colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "70%",
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
    sheetTitle: { fontFamily: theme.font.semibold, fontSize: 16, color: theme.colors.text },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginHorizontal: 16,
      marginVertical: 10,
      backgroundColor: theme.colors.bg,
      borderRadius: theme.radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    searchInput: {
      flex: 1,
      fontFamily: theme.font.regular,
      fontSize: 15,
      color: theme.colors.text,
      padding: 0,
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
    optionText: { fontFamily: theme.font.regular, fontSize: 15, color: theme.colors.text },
    optionTextSelected: { fontFamily: theme.font.semibold, color: theme.colors.primary },
    separator: { height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border, marginLeft: 20 },
  });
}
