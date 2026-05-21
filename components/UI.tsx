import React, { useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import { useTheme, type Theme } from "@/lib/theme";
import { isoToDisplay, toIso } from "@/lib/format";

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.card,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border,
          ...Platform.select({
            android: { elevation: 2 },
            default: {},
          }),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Button({
  title,
  onPress,
  variant = "primary",
  loading,
  disabled,
  icon,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const isDisabled = disabled || loading;
  const bg =
    variant === "primary"
      ? theme.colors.primary
      : variant === "danger"
        ? theme.colors.danger
        : variant === "secondary"
          ? `${theme.colors.primary}25`
          : "transparent";
  const fg =
    variant === "primary" || variant === "danger"
      ? "#fff"
      : variant === "secondary"
        ? theme.colors.primaryDark
        : theme.colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        {
          paddingVertical: 14,
          paddingHorizontal: 18,
          borderRadius: theme.radius.lg,
          alignItems: "center" as const,
          justifyContent: "center" as const,
          backgroundColor: bg,
          opacity: isDisabled ? 0.6 : pressed ? 0.85 : 1,
          borderWidth: variant === "ghost" ? 1 : 0,
          borderColor: theme.colors.border,
          ...Platform.select({
            android: {
              elevation: variant === "primary" || variant === "danger" ? 3 : variant === "secondary" ? 1 : 0,
            },
            default: {},
          }),
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {icon}
          <Text style={{ fontFamily: theme.font.semibold, fontSize: 15, color: fg }}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function Input({
  label,
  error,
  style,
  ...rest
}: TextInputProps & { label?: string; error?: string }) {
  const theme = useTheme();
  const styles = useMemo(() => makeInputStyles(theme), [theme]);
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={theme.colors.subtext}
        {...rest}
        style={[styles.input, style]}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function makeInputStyles(theme: Theme) {
  return StyleSheet.create({
    label: { fontFamily: theme.font.medium, fontSize: 13, color: theme.colors.text },
    input: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      fontFamily: theme.font.regular,
      fontSize: 15,
      color: theme.colors.text,
    },
    errorText: { fontSize: 12, color: theme.colors.danger, fontFamily: theme.font.medium },
  });
}

export function DateInput({
  label,
  value,
  onChange,
  error,
  minAge,
}: {
  label?: string;
  value: string;
  onChange: (iso: string) => void;
  error?: string;
  minAge?: number;
}) {
  const theme = useTheme();
  const styles = useMemo(() => makeDateInputStyles(theme), [theme]);
  const [showPicker, setShowPicker] = useState(false);

  const ageError = (() => {
    if (!minAge) return undefined;
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
    const [y, m, d] = value.split("-").map(Number);
    const dob = new Date(y, m - 1, d);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear() -
      (today.getMonth() < dob.getMonth() ||
        (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
        ? 1
        : 0);
    return age < minAge ? `En az ${minAge} yaşında olmanız gereklidir.` : undefined;
  })();

  const displayError = error ?? ageError;

  function handleChange(raw: string) {
    const cleaned = raw.replace(/[^\d/]/g, "");
    const digits = cleaned.replace(/\//g, "");
    if (digits.length > 8) return;
    let formatted = digits;
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    onChange(toIso(formatted));
  }

  function handlePickerChange(_event: unknown, selected?: Date) {
    if (Platform.OS === "android") setShowPicker(false);
    if (selected) {
      const y = selected.getFullYear();
      const m = String(selected.getMonth() + 1).padStart(2, "0");
      const d = String(selected.getDate()).padStart(2, "0");
      onChange(`${y}-${m}-${d}`);
    }
  }

  const pickerDate = (() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split("-").map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date(2000, 0, 1);
  })();

  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.dateRow}>
        <TextInput
          value={isoToDisplay(value)}
          onChangeText={handleChange}
          placeholder="GG/AA/YYYY"
          placeholderTextColor={theme.colors.subtext}
          keyboardType="numeric"
          maxLength={10}
          style={[styles.input, { flex: 1 }]}
        />
        <Pressable onPress={() => setShowPicker(true)} style={styles.calendarBtn} hitSlop={8}>
          <Feather name="calendar" size={20} color={theme.colors.primary} />
        </Pressable>
      </View>
      {showPicker && (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handlePickerChange}
          maximumDate={(() => {
            if (minAge) {
              const d = new Date();
              d.setFullYear(d.getFullYear() - minAge);
              return d;
            }
            return new Date();
          })()}
        />
      )}
      {Platform.OS === "ios" && showPicker && (
        <Pressable onPress={() => setShowPicker(false)} style={styles.pickerDone}>
          <Text style={styles.pickerDoneText}>Tamam</Text>
        </Pressable>
      )}
      {displayError ? <Text style={styles.errorText}>{displayError}</Text> : null}
    </View>
  );
}

function makeDateInputStyles(theme: Theme) {
  return StyleSheet.create({
    label: { fontFamily: theme.font.medium, fontSize: 13, color: theme.colors.text },
    input: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      fontFamily: theme.font.regular,
      fontSize: 15,
      color: theme.colors.text,
    },
    errorText: { fontSize: 12, color: theme.colors.danger, fontFamily: theme.font.medium },
    dateRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    calendarBtn: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      padding: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    pickerDone: { alignSelf: "flex-end", paddingHorizontal: 16, paddingVertical: 6 },
    pickerDoneText: { fontFamily: theme.font.semibold, fontSize: 15, color: theme.colors.primary },
  });
}

export function H1({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const theme = useTheme();
  return (
    <Text style={[{ fontFamily: theme.font.bold, fontSize: 26, color: theme.colors.text }, style]}>
      {children}
    </Text>
  );
}

export function H2({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const theme = useTheme();
  return (
    <Text style={[{ fontFamily: theme.font.semibold, fontSize: 18, color: theme.colors.text }, style]}>
      {children}
    </Text>
  );
}

export function P({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const theme = useTheme();
  return (
    <Text style={[{ fontFamily: theme.font.regular, fontSize: 15, color: theme.colors.text, lineHeight: 22 }, style]}>
      {children}
    </Text>
  );
}

export function Muted({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  const theme = useTheme();
  return (
    <Text style={[{ fontFamily: theme.font.regular, fontSize: 13, color: theme.colors.subtext }, style]}>
      {children}
    </Text>
  );
}

export function Badge({
  text,
  color,
  bg,
  icon,
}: {
  text: string;
  color?: string;
  bg?: string;
  icon?: keyof typeof Feather.glyphMap;
}) {
  const theme = useTheme();
  const resolvedColor = color ?? theme.colors.primary;
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: theme.radius.full,
          borderWidth: 1,
          alignSelf: "flex-start" as const,
          backgroundColor: bg ?? `${resolvedColor}1A`,
          borderColor: `${resolvedColor}33`,
        },
      ]}
    >
      {icon ? <Feather name={icon} size={10} color={resolvedColor} /> : null}
      <Text style={{ fontFamily: theme.font.semibold, fontSize: 11, color: resolvedColor }}>
        {text}
      </Text>
    </View>
  );
}

export function Empty({ title, subtitle }: { title: string; subtitle?: string }) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: "center", padding: theme.spacing.xl, gap: 6 }}>
      <H2>{title}</H2>
      {subtitle ? <Muted>{subtitle}</Muted> : null}
    </View>
  );
}

export function Loading() {
  const theme = useTheme();
  return (
    <View style={{ padding: theme.spacing.xl, alignItems: "center" }}>
      <ActivityIndicator color={theme.colors.primary} />
    </View>
  );
}

export function ErrorState({
  message = "Bir şeyler ters gitti.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={{ padding: theme.spacing.xl, alignItems: "center", gap: 12 }}>
      <H2>Hata</H2>
      <Muted style={{ textAlign: "center" }}>{message}</Muted>
      {onRetry ? (
        <Button title="Tekrar dene" variant="secondary" onPress={onRetry} />
      ) : null}
    </View>
  );
}
