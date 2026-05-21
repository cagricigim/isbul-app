import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import {
  useGetNotificationPreferences,
  useUpdateNotificationPreferences,
  getGetNotificationPreferencesQueryKey,
} from "@workspace/api-client-react";
import type { NotificationPreferences } from "@workspace/api-client-react";
import { Card, H2 } from "@/components/UI";
import { useTheme, type Theme } from "@/lib/theme";

type PrefKey = keyof NotificationPreferences;

function formatHour(h: number): string {
  return `${String(h).padStart(2, "0")}:00`;
}

function isQuietHoursActive(start: number, end: number): boolean {
  if (start === end) return false;
  const currentHour = new Date().getHours();
  if (start < end) return currentHour >= start && currentHour < end;
  return currentHour >= start || currentHour < end;
}

const defaultPrefs: NotificationPreferences = {
  notifNewOffers: true,
  notifNewOffersSound: true,
  notifNewOffersVibration: true,
  notifNewMessages: true,
  notifNewMessagesSound: true,
  notifNewMessagesVibration: true,
  notifOfferStatusChange: true,
  notifOfferStatusChangeSound: true,
  notifOfferStatusChangeVibration: true,
  quietHoursEnabled: false,
  quietHoursStart: 22,
  quietHoursEnd: 8,
  quietHoursTimezone: null,
};

const subControlMap: Partial<Record<PrefKey, PrefKey[]>> = {
  notifNewOffers: ["notifNewOffersSound", "notifNewOffersVibration"],
  notifNewMessages: ["notifNewMessagesSound", "notifNewMessagesVibration"],
  notifOfferStatusChange: ["notifOfferStatusChangeSound", "notifOfferStatusChangeVibration"],
};

export default function NotificationSettingsScreen() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const qc = useQueryClient();
  const { data: prefs } = useGetNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();

  const p = prefs ?? defaultPrefs;
  const isPending = updatePrefs.isPending;

  const updatePrefsWithTimezone = (next: NotificationPreferences) => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const withTz: NotificationPreferences = { ...next, quietHoursTimezone: tz };
    qc.setQueryData(getGetNotificationPreferencesQueryKey(), withTz);
    updatePrefs.mutate({ data: withTz }, {
      onError: () => {
        qc.setQueryData(getGetNotificationPreferencesQueryKey(), prefs);
      },
    });
  };

  const togglePref = (key: PrefKey) => {
    if (!prefs) return;
    const newValue = !prefs[key];
    let next: NotificationPreferences = { ...prefs, [key]: newValue };
    if (!newValue && subControlMap[key]) {
      for (const subKey of subControlMap[key]!) {
        next = { ...next, [subKey]: false };
      }
    }
    updatePrefsWithTimezone(next);
  };

  const setQuietHour = (field: "quietHoursStart" | "quietHoursEnd", delta: number) => {
    if (!prefs) return;
    const current = prefs[field] ?? (field === "quietHoursStart" ? 22 : 8);
    updatePrefsWithTimezone({ ...prefs, [field]: (current + delta + 24) % 24 });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card>
        <H2>Bildirim türleri</H2>

        <NotifRow
          label="Yeni teklifler"
          desc="Biri size iş teklifi gönderdiğinde"
          enabled={p.notifNewOffers}
          sound={p.notifNewOffersSound}
          vibration={p.notifNewOffersVibration}
          disabled={isPending}
          onToggleEnabled={() => togglePref("notifNewOffers")}
          onToggleSound={() => togglePref("notifNewOffersSound")}
          onToggleVibration={() => togglePref("notifNewOffersVibration")}
          styles={styles}
          theme={theme}
        />

        <View style={styles.separator} />

        <NotifRow
          label="Yeni mesajlar"
          desc="Biri size mesaj gönderdiğinde"
          enabled={p.notifNewMessages}
          sound={p.notifNewMessagesSound}
          vibration={p.notifNewMessagesVibration}
          disabled={isPending}
          onToggleEnabled={() => togglePref("notifNewMessages")}
          onToggleSound={() => togglePref("notifNewMessagesSound")}
          onToggleVibration={() => togglePref("notifNewMessagesVibration")}
          styles={styles}
          theme={theme}
        />

        <View style={styles.separator} />

        <NotifRow
          label="Teklif sonuçları"
          desc="Teklifiniz kabul veya reddedildiğinde"
          enabled={p.notifOfferStatusChange}
          sound={p.notifOfferStatusChangeSound}
          vibration={p.notifOfferStatusChangeVibration}
          disabled={isPending}
          onToggleEnabled={() => togglePref("notifOfferStatusChange")}
          onToggleSound={() => togglePref("notifOfferStatusChangeSound")}
          onToggleVibration={() => togglePref("notifOfferStatusChangeVibration")}
          styles={styles}
          theme={theme}
        />
      </Card>

      <Card>
        <H2>Sessiz saatler</H2>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Sessiz saatler</Text>
            <Text style={styles.toggleDesc}>Bu saatler arasında bildirim gönderilmez</Text>
          </View>
          <Switch
            value={p.quietHoursEnabled}
            onValueChange={() => togglePref("quietHoursEnabled")}
            disabled={isPending}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={theme.colors.card}
          />
        </View>

        {p.quietHoursEnabled && (
          <View style={styles.quietHoursContainer}>
            <QuietHourRow
              label="Başlangıç"
              hour={p.quietHoursStart ?? 22}
              disabled={isPending}
              onDecrement={() => setQuietHour("quietHoursStart", -1)}
              onIncrement={() => setQuietHour("quietHoursStart", 1)}
              styles={styles}
              theme={theme}
            />
            <QuietHourRow
              label="Bitiş"
              hour={p.quietHoursEnd ?? 8}
              disabled={isPending}
              onDecrement={() => setQuietHour("quietHoursEnd", -1)}
              onIncrement={() => setQuietHour("quietHoursEnd", 1)}
              styles={styles}
              theme={theme}
            />
            {isQuietHoursActive(p.quietHoursStart ?? 22, p.quietHoursEnd ?? 8) && (
              <View style={styles.quietHoursBanner}>
                <Feather name="moon" size={13} color={theme.colors.primary} />
                <Text style={styles.quietHoursBannerText}>
                  Bildirimler {formatHour(p.quietHoursEnd ?? 8)}'e kadar duraklatıldı
                </Text>
              </View>
            )}
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

interface NotifRowProps {
  label: string;
  desc: string;
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  disabled: boolean;
  onToggleEnabled: () => void;
  onToggleSound: () => void;
  onToggleVibration: () => void;
  styles: ReturnType<typeof makeStyles>;
  theme: Theme;
}

function NotifRow({
  label, desc, enabled, sound, vibration, disabled,
  onToggleEnabled, onToggleSound, onToggleVibration, styles, theme,
}: NotifRowProps) {
  const subDisabled = disabled || !enabled;
  const subIconColor = enabled ? theme.colors.subtext : theme.colors.border;
  const subLabelColor = enabled ? theme.colors.subtext : theme.colors.border;

  return (
    <View>
      <View style={styles.toggleRow}>
        <View style={styles.toggleInfo}>
          <Text style={styles.toggleLabel}>{label}</Text>
          <Text style={styles.toggleDesc}>{desc}</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggleEnabled}
          disabled={disabled}
          trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          thumbColor={theme.colors.card}
        />
      </View>
      <View style={styles.subControls}>
        <View style={styles.subRow}>
          <Feather name="volume-2" size={14} color={subIconColor} />
          <Text style={[styles.subLabel, { color: subLabelColor }]}>Ses</Text>
          <Switch
            value={sound}
            onValueChange={onToggleSound}
            disabled={subDisabled}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={theme.colors.card}
            style={styles.subSwitch}
          />
        </View>
        <View style={styles.subRow}>
          <Feather name="smartphone" size={14} color={subIconColor} />
          <Text style={[styles.subLabel, { color: subLabelColor }]}>Titreşim</Text>
          <Switch
            value={vibration}
            onValueChange={onToggleVibration}
            disabled={subDisabled}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={theme.colors.card}
            style={styles.subSwitch}
          />
        </View>
      </View>
    </View>
  );
}

interface QuietHourRowProps {
  label: string;
  hour: number;
  disabled: boolean;
  onDecrement: () => void;
  onIncrement: () => void;
  styles: ReturnType<typeof makeStyles>;
  theme: Theme;
}

function QuietHourRow({ label, hour, disabled, onDecrement, onIncrement, styles, theme: _theme }: QuietHourRowProps) {
  return (
    <View style={styles.quietHourRow}>
      <Text style={styles.quietHourLabel}>{label}</Text>
      <View style={styles.quietHourStepper}>
        <TouchableOpacity
          onPress={onDecrement}
          disabled={disabled}
          style={styles.stepperBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="minus" size={16} color={_theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.quietHourValue}>{formatHour(hour)}</Text>
        <TouchableOpacity
          onPress={onIncrement}
          disabled={disabled}
          style={styles.stepperBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="plus" size={16} color={_theme.colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: { padding: theme.spacing.lg, gap: 10, paddingBottom: 80 },
    toggleRow: { flexDirection: "row", alignItems: "center", paddingVertical: 4 },
    toggleInfo: { flex: 1 },
    toggleLabel: { fontFamily: theme.font.medium, fontSize: 14, color: theme.colors.text },
    toggleDesc: { fontFamily: theme.font.regular, fontSize: 12, color: theme.colors.subtext, marginTop: 2 },
    separator: { height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border, marginVertical: 8 },
    subControls: {
      marginTop: 8,
      marginLeft: 4,
      gap: 6,
      paddingLeft: 8,
      borderLeftWidth: 2,
      borderLeftColor: theme.colors.border,
    },
    subRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    subLabel: { flex: 1, fontFamily: theme.font.regular, fontSize: 13 },
    subSwitch: { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] },
    quietHoursContainer: {
      marginTop: 8,
      marginLeft: 4,
      gap: 8,
      paddingLeft: 8,
      borderLeftWidth: 2,
      borderLeftColor: theme.colors.border,
    },
    quietHourRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    quietHourLabel: { fontFamily: theme.font.regular, fontSize: 13, color: theme.colors.subtext, flex: 1 },
    quietHourStepper: { flexDirection: "row", alignItems: "center", gap: 12 },
    stepperBtn: {
      width: 28,
      height: 28,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.bg,
      borderRadius: theme.radius.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    quietHourValue: {
      fontFamily: theme.font.medium,
      fontSize: 14,
      color: theme.colors.text,
      minWidth: 44,
      textAlign: "center",
    },
    quietHoursBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 4,
      paddingVertical: 6,
      paddingHorizontal: 10,
      backgroundColor: theme.colors.primary + "18",
      borderRadius: theme.radius.sm,
    },
    quietHoursBannerText: {
      fontFamily: theme.font.medium,
      fontSize: 12,
      color: theme.colors.primary,
      flex: 1,
    },
  });
}
