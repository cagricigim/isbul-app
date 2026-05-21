/**
 * Semantic design tokens for the mobile app.
 *
 * Light and dark palettes are defined here.
 * The useColors() hook automatically picks the right one based on the
 * device color scheme. The primary app-wide theming is handled by
 * lib/theme.ts (ThemeProvider / useTheme), which also supports manual
 * user overrides persisted via AsyncStorage.
 */

const colors = {
  light: {
    text: "#0a0a0a",
    tint: "#FF6A00",

    background: "#F5F6FA",
    foreground: "#0a0a0a",

    card: "#FFFFFF",
    cardForeground: "#0a0a0a",

    primary: "#FF6A00",
    primaryForeground: "#ffffff",

    secondary: "#f0f0f0",
    secondaryForeground: "#1a1a1a",

    muted: "#f0f0f0",
    mutedForeground: "#737373",

    accent: "#4A90D9",
    accentForeground: "#ffffff",

    destructive: "#ef4444",
    destructiveForeground: "#ffffff",

    border: "#E8EAF0",
    input: "#E8EAF0",
  },

  dark: {
    text: "#F2F4F7",
    tint: "#FF6A00",

    background: "#0F1117",
    foreground: "#F2F4F7",

    card: "#1A1D27",
    cardForeground: "#F2F4F7",

    primary: "#FF6A00",
    primaryForeground: "#ffffff",

    secondary: "#2A2D3E",
    secondaryForeground: "#F2F4F7",

    muted: "#2A2D3E",
    mutedForeground: "#8D96A7",

    accent: "#4A90D9",
    accentForeground: "#ffffff",

    destructive: "#F87171",
    destructiveForeground: "#ffffff",

    border: "#2A2D3E",
    input: "#2A2D3E",
  },

  radius: 8,
};

export default colors;
