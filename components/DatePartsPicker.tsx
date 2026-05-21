import React, { useState, useMemo } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import { SelectPicker } from "./SelectPicker";
import { useTheme, type Theme } from "@/lib/theme";

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

function daysInMonth(month: number, year: number): number {
  if (!month || !year) return 31;
  return new Date(year, month, 0).getDate();
}

function isoToDate(iso: string): Date | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function dateToIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatTurkish(iso: string): string {
  const d = isoToDate(iso);
  if (!d) return "";
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

interface DatePartsPickerProps {
  label?: string;
  value: string;
  onChange: (iso: string) => void;
  maxYear?: number;
  minYear?: number;
  error?: string;
}

export function DatePartsPicker(props: DatePartsPickerProps) {
  if (Platform.OS === "web") return <WebPicker {...props} />;
  if (Platform.OS === "ios") return <IOSPicker {...props} />;
  return <AndroidPicker {...props} />;
}

function AndroidPicker({
  label, value, onChange, maxYear, minYear = 1930, error,
}: DatePartsPickerProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const now = new Date();
  const maxDate = maxYear
    ? new Date(maxYear, 11, 31)
    : new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
  const minDate = new Date(minYear, 0, 1);
  const [open, setOpen] = useState(false);

  const currentDate = isoToDate(value) ?? maxDate;
  const displayText = formatTurkish(value) || "Tarih seçin";

  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.field, pressed && styles.fieldPressed]}
      >
        <Text style={[styles.fieldText, !value && styles.fieldPlaceholder]}>
          {displayText}
        </Text>
        <Feather name="calendar" size={16} color={theme.colors.subtext} />
      </Pressable>

      {open && (
        <DateTimePicker
          value={currentDate}
          mode="date"
          display="default"
          locale="tr-TR"
          maximumDate={maxDate}
          minimumDate={minDate}
          onChange={(event, date) => {
            setOpen(false);
            if (event.type === "set" && date) {
              onChange(dateToIso(date));
            }
          }}
        />
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function IOSPicker({
  label, value, onChange, maxYear, minYear = 1930, error,
}: DatePartsPickerProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const now = new Date();
  const maxDate = maxYear
    ? new Date(maxYear, 11, 31)
    : new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
  const minDate = new Date(minYear, 0, 1);
  const [open, setOpen] = useState(false);
  const [temp, setTemp] = useState<Date>(() => isoToDate(value) ?? maxDate);

  const display = formatTurkish(value) || "Tarih seçin";

  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        onPress={() => { setTemp(isoToDate(value) ?? maxDate); setOpen(true); }}
        style={({ pressed }) => [styles.field, pressed && styles.fieldPressed]}
      >
        <Text style={[styles.fieldText, !value && styles.fieldPlaceholder]}>
          {display}
        </Text>
        <Feather name="calendar" size={16} color={theme.colors.subtext} />
      </Pressable>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.iosOverlay}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setOpen(false)} />
          <View style={styles.iosSheet}>
            <View style={styles.iosToolbar}>
              <Pressable hitSlop={12} onPress={() => setOpen(false)}>
                <Text style={styles.iosCancelText}>İptal</Text>
              </Pressable>
              <Pressable hitSlop={12} onPress={() => { onChange(dateToIso(temp)); setOpen(false); }}>
                <Text style={styles.iosDoneText}>Tamam</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={temp}
              mode="date"
              display="spinner"
              locale="tr-TR"
              maximumDate={maxDate}
              minimumDate={minDate}
              onChange={(_, date) => { if (date) setTemp(date); }}
              style={{ width: "100%" }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function WebPicker({
  label, value, onChange, maxYear, minYear = 1930, error,
}: DatePartsPickerProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const effectiveMaxYear = maxYear ?? new Date().getFullYear() - 18;

  const parsed = useMemo(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split("-").map(Number);
      return { y, m, d };
    }
    return { y: 0, m: 0, d: 0 };
  }, [value]);

  const years = useMemo(() => {
    const arr: string[] = [];
    for (let y = effectiveMaxYear; y >= minYear; y--) arr.push(String(y));
    return arr;
  }, [effectiveMaxYear, minYear]);

  const days = useMemo(() => {
    const count = daysInMonth(parsed.m, parsed.y);
    return Array.from({ length: count }, (_, i) => String(i + 1).padStart(2, "0"));
  }, [parsed.m, parsed.y]);

  function emit(y: number, m: number, d: number) {
    if (!y || !m || !d) { onChange(""); return; }
    const maxD = daysInMonth(m, y);
    onChange(`${y}-${String(m).padStart(2, "0")}-${String(Math.min(d, maxD)).padStart(2, "0")}`);
  }

  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.webRow}>
        <View style={styles.dayCol}>
          <SelectPicker
            placeholder="Gün"
            value={parsed.d ? String(parsed.d).padStart(2, "0") : ""}
            onSelect={(v) => emit(parsed.y, parsed.m, Number(v))}
            options={days}
          />
        </View>
        <View style={styles.monthCol}>
          <SelectPicker
            placeholder="Ay"
            value={parsed.m ? MONTHS[parsed.m - 1] : ""}
            onSelect={(v) => emit(parsed.y, MONTHS.indexOf(v) + 1, parsed.d)}
            options={MONTHS}
          />
        </View>
        <View style={styles.yearCol}>
          <SelectPicker
            placeholder="Yıl"
            value={parsed.y ? String(parsed.y) : ""}
            onSelect={(v) => emit(Number(v), parsed.m, parsed.d)}
            options={years}
          />
        </View>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
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
    fieldPressed: { opacity: 0.7 },
    fieldText: { fontFamily: theme.font.regular, fontSize: 15, color: theme.colors.text, flex: 1 },
    fieldPlaceholder: { color: theme.colors.subtext },
    errorText: { fontSize: 12, color: theme.colors.danger, fontFamily: theme.font.medium },
    iosOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
    iosSheet: {
      backgroundColor: theme.colors.bg,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 32,
    },
    iosToolbar: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    iosCancelText: { fontFamily: theme.font.regular, fontSize: 16, color: theme.colors.subtext },
    iosDoneText: { fontFamily: theme.font.semibold, fontSize: 16, color: theme.colors.primary },
    webRow: { flexDirection: "row", gap: 8 },
    dayCol: { flex: 1.1 },
    monthCol: { flex: 2 },
    yearCol: { flex: 1.5 },
  });
}
