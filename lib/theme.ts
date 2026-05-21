import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeMode = "light" | "dark" | "system";

export const lightColors = {
  primary: "#FF6A00",
  primaryDark: "#E65A00",
  accent: "#0F2D52",
  bg: "#F6F7FB",
  card: "#FFFFFF",
  text: "#101828",
  subtext: "#667085",
  border: "#E4E7EC",
  success: "#12B76A",
  danger: "#F04438",
  warning: "#F79009",
  premium: "#7B61FF",
  boost: "#FF6A00",
};

export const darkColors = {
  primary: "#FF6A00",
  primaryDark: "#E65A00",
  accent: "#C47A3A",
  bg: "#0F0E0C",
  card: "#1A1815",
  text: "#F2EEE8",
  subtext: "#9B9088",
  border: "#2A2620",
  success: "#12B76A",
  danger: "#F04438",
  warning: "#F79009",
  premium: "#9B8FF7",
  boost: "#FF6A00",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

export const font = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
};

export type ThemeColors = typeof lightColors;
export type Theme = {
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  font: typeof font;
  isDark: boolean;
};

const THEME_MODE_KEY = "@theme_mode";

const defaultTheme: Theme = {
  colors: lightColors,
  spacing,
  radius,
  font,
  isDark: false,
};

const ThemeContext = createContext<{
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}>({
  theme: defaultTheme,
  mode: "system",
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    void AsyncStorage.getItem(THEME_MODE_KEY).then((stored) => {
      if (stored === "light" || stored === "dark" || stored === "system") {
        setModeState(stored);
      }
    });
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    void AsyncStorage.setItem(THEME_MODE_KEY, newMode);
  }, []);

  const isDark = mode === "system" ? systemScheme === "dark" : mode === "dark";
  const colors = isDark ? darkColors : lightColors;

  const themeValue = useMemo<Theme>(
    () => ({ colors, spacing, radius, font, isDark }),
    [colors, isDark],
  );

  const contextValue = useMemo(
    () => ({ theme: themeValue, mode, setMode }),
    [themeValue, mode, setMode],
  );

  return React.createElement(ThemeContext.Provider, { value: contextValue }, children);
}

export function useTheme(): Theme {
  return useContext(ThemeContext).theme;
}

export function useThemeMode() {
  const { mode, setMode, theme } = useContext(ThemeContext);
  return { mode, setMode, isDark: theme.isDark };
}

export const theme = defaultTheme;
export type { Theme as ThemeType };
