import React, { useMemo, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { uploadImage } from "@workspace/api-client-react";
import { useTheme, type Theme } from "@/lib/theme";
import { imageUrl } from "@/lib/auth";

export function PhotoPicker({
  value,
  onChange,
  label = "Fotoğraf",
  size = 96,
  rounded = true,
}: {
  value?: string;
  onChange: (url: string | undefined) => void;
  label?: string;
  size?: number;
  rounded?: boolean;
}) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("İzin gerekli", "Fotoğraf seçmek için galeri izni verin.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
      allowsEditing: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (!asset.base64) {
      Alert.alert("Hata", "Fotoğraf okunamadı.");
      return;
    }
    setBusy(true);
    try {
      const mimeType = asset.mimeType ?? "image/jpeg";
      const res = await uploadImage({ base64: asset.base64, mimeType });
      onChange(res.url);
    } catch {
      Alert.alert("Hata", "Fotoğraf yüklenemedi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ alignItems: "center", gap: 6 }}>
      <Pressable
        onPress={pick}
        disabled={busy}
        style={[
          styles.box,
          {
            width: size,
            height: size,
            borderRadius: rounded ? size / 2 : theme.radius.lg,
          },
        ]}
      >
        {value ? (
          <Image
            source={{ uri: imageUrl(value) }}
            style={{
              width: size,
              height: size,
              borderRadius: rounded ? size / 2 : theme.radius.lg,
            }}
          />
        ) : (
          <Feather name="camera" size={28} color={theme.colors.subtext} />
        )}
        <View style={styles.editPill}>
          <Feather name="edit-2" size={12} color="#fff" />
        </View>
      </Pressable>
      <Text style={styles.label}>{busy ? "Yükleniyor..." : label}</Text>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    box: {
      backgroundColor: theme.isDark ? theme.colors.border : "#F2F4F7",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderStyle: "dashed",
      overflow: "hidden",
    },
    editPill: {
      position: "absolute",
      bottom: 4,
      right: 4,
      backgroundColor: theme.colors.primary,
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: "#fff",
    },
    label: { fontFamily: theme.font.medium, fontSize: 12, color: theme.colors.subtext },
  });
}
