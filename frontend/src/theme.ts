// Design tokens for this app. Light theme only.Always modify the colors and theme to Dark, Light or Dark and Light according to the design guidelines.
//
// The keys match the "color" block of /app/design_guidelines.json. Fill the
// values from that file (or from the user's brand colors). Keep every key; do
// not add a second theme or colors file; do not write color literals in
// components.
//
// How the names work: a plain key is a background, and its `on` partner is the
// text or icon color that sits on top of it. Always use them as a pair.
//   <View style={{ backgroundColor: colors.brandPrimary }}>
//     <Text style={{ color: colors.onBrandPrimary }}>Continue</Text>
//   </View>
//
// Styling a screen or component: build the sheet with makeStyles so colors
// and layout live together and follow the active scheme:
//   const useStyles = makeStyles((colors) => ({
//     card: { backgroundColor: colors.surfaceSecondary, padding: 16 },
//     title: { color: colors.onSurfaceSecondary, fontSize: 16 },
//   }));
//   function Screen() {
//     const styles = useStyles();
//     return <View style={styles.card}><Text style={styles.title}>Hi</Text></View>;
//   }
// For color props that are not styles (icon color, placeholderTextColor,
// ActivityIndicator) read useTheme().colors inside the component.
// Never call StyleSheet.create with color values at module level; it cannot
// follow the scheme.
//
// To support dark mode later: add `dark` to `themes` with every key filled.
// Nothing else changes; the device setting takes over automatically.
// Feel free to add as many new colors as you need to support the design guidelines.

import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  // ---------------------------------------------------------------------------
  // Surfaces: backgrounds, from the screen down to small fills.
  // Each `on` key is the text and icon color for that background.
  // ---------------------------------------------------------------------------
  surface: "#3554A5", // primary canvas, most of every screen
  onSurface: "#FFFFFF", // text and icons on the canvas
  surfaceSecondary: "#243A7A", // cards, sheets, list rows
  onSurfaceSecondary: "#FFFFFF", // text and icons on cards, sheets, rows
  surfaceTertiary: "#1C2E63", // input backgrounds, chips, deepest nesting
  onSurfaceTertiary: "#FFFFFF", // text on inputs and chips; also muted text
  surfaceInverse: "#FFFFFF", // tooltips, snackbars, anything popping against the theme
  onSurfaceInverse: "#1B1D22", // text and icons on the inverse surface
  muted: "#A9B7E0", // subdued text on surface: captions, timestamps, placeholders

  // Game-specific (Block Blast look)
  bgTop: "#4B70C9",
  bgBottom: "#2B4590",
  board: "#1B2856",
  boardCell: "#22336A",
  gridLine: "rgba(0,0,0,0.28)",
  overlay: "rgba(8,14,36,0.75)",
  blockRed: "#E8232E",
  blockBlue: "#3D6BFF",
  blockYellow: "#FFC83D",
  blockGreen: "#3DAD4A",
  blockPurple: "#9C3DE8",
  blockOrange: "#FF7A2E",
  blockCyan: "#3DE0FF",
  blockPink: "#FF6BCC",
  blockBevelLight: "rgba(255,255,255,0.35)",
  blockBevelDark: "rgba(0,0,0,0.3)",
  blockShine: "rgba(255,255,255,0.35)",

  // ---------------------------------------------------------------------------
  // Brand: the identity color and the fills built from it.
  // Neutral by default; replace with the design guidelines values.
  // ---------------------------------------------------------------------------
  brand: "#FFC83D", // base hue, anchor only; Primary, Secondary, Tertiary are weights of it
  onBrand: "#1B1D22", // text and icons placed directly on brand
  brandPrimary: "#FFC83D", // primary CTA, active tab indicator, selected states
  onBrandPrimary: "#1B1D22", // text and icons on brandPrimary
  brandSecondary: "#E8232E", // secondary CTA, less prominent accents
  onBrandSecondary: "#FFFFFF", // text and icons on brandSecondary
  brandTertiary: "#3D6BFF", // chips, tags, badges, subtle brand moments
  onBrandTertiary: "#FFFFFF", // text and icons on brandTertiary

  // ---------------------------------------------------------------------------
  // Status: semantic only, never decorative. Fill for badges, banners and
  // toasts; the `on` key is text on that fill. The plain key is also safe as
  // text on `surface`.
  // ---------------------------------------------------------------------------
  success: "#3DAD4A",
  onSuccess: "#FFFFFF",
  warning: "#FF7A2E",
  onWarning: "#FFFFFF",
  error: "#E8232E",
  onError: "#FFFFFF",
  info: "#3DE0FF",
  onInfo: "#1B1D22",

  // ---------------------------------------------------------------------------
  // Lines
  // ---------------------------------------------------------------------------
  border: "#2F4689", // hairline outline, 0.5pt or 1pt max: inputs, cards
  borderStrong: "#5A74C2", // focus rings, selected outlines, 1.5pt max
  divider: "#2F4689", // subtle list separators
};

export type ThemeColors = typeof light;

export const defaultScheme = "light" satisfies ColorScheme;

export const themes: { light: ThemeColors; dark?: ThemeColors } = { light };

// In-app theme toggle, only after `dark` exists in `themes`. Call
// setColorScheme("dark"), setColorScheme("light"), or setColorScheme(null) to
// follow the device. Every useTheme() consumer re-renders. Persisting the
// choice and re-applying it on launch is the toggle's job.
export function setColorScheme(scheme: ColorScheme | null) {
  // RN 0.86 re-reads the device scheme only for the literal "unspecified";
  // null would pin useColorScheme() to null and the app to light.
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

// Keep native surfaces (alerts, pickers, navigation chrome) on the schemes this
// app ships: light only forces light; once `dark` exists the device decides.
// Optional call because react-native-web does not implement it.
setColorScheme?.(themes.dark ? null : defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = (system === "light" || system === "dark") && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

// Themed StyleSheet: returns a hook that builds the sheet from the active
// scheme's colors and memoizes it until the scheme changes.
export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}


