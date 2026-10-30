import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons";
import { makeStyles, useTheme } from "@/src/theme";
import { storage } from "@/src/utils/storage";
import { Block, useBlockColors } from "@/src/game/Block";
import { AdBanner } from "@/src/game/AdSlot";
import { SettingsOverlay } from "@/src/game/Modals";
import { useSettings } from "@/src/game/settings";
import { BEST_KEY } from "@/src/game/GameView";
import { ADVENTURE_KEY, LEVEL_COUNT } from "@/src/game/levels";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useStyles();
  const palette = useBlockColors();
  const settings = useSettings();
  const [best, setBest] = useState(0);
  const [level, setLevel] = useState(1);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      storage.getItem(BEST_KEY, 0).then((v) => setBest(Number(v) || 0));
      storage.getItem(ADVENTURE_KEY, 1).then((v) => setLevel(Math.min(Number(v) || 1, LEVEL_COUNT)));
    }, []),
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient colors={[colors.bgTop, colors.bgBottom]} style={styles.fill} />
      <View style={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.topRow}>
          <View style={styles.bestWrap} testID="home-best-score">
            <MaterialDesignIcons name="crown" size={24} color={colors.brandPrimary} />
            <Text style={styles.bestText}>{best}</Text>
          </View>
          <Pressable
            testID="home-settings-button"
            onPress={() => setSettingsOpen(true)}
            style={({ pressed }) => [styles.iconBtn, pressed && { transform: [{ scale: 0.92 }] }]}
          >
            <MaterialDesignIcons name="cog" size={26} color={colors.onSurface} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Animated.View entering={FadeInDown.duration(500)} style={styles.logoBlocks}>
            {[0, 2, 1, 3, 5].map((c, i) => (
              <View key={i} style={{ transform: [{ translateY: i % 2 ? -10 : 0 }] }}>
                <Block size={36} color={palette[c]} />
              </View>
            ))}
          </Animated.View>
          <Animated.Text entering={FadeInDown.delay(120).duration(500)} style={styles.title} testID="app-title">
            BLOCK POP
          </Animated.Text>
          <Text style={styles.tagline}>Drag. Drop. Blast lines.</Text>
        </View>

        <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.buttons}>
          <Pressable
            testID="play-classic-button"
            onPress={() => router.push("/classic")}
            style={({ pressed }) => [styles.mainBtn, { backgroundColor: colors.success }, pressed && styles.pressed]}
          >
            <MaterialDesignIcons name="play" size={30} color={colors.onSuccess} />
            <Text style={styles.mainBtnText}>Classic</Text>
          </Pressable>
          <Pressable
            testID="play-adventure-button"
            onPress={() => router.push("/adventure")}
            style={({ pressed }) => [styles.mainBtn, { backgroundColor: colors.warning }, pressed && styles.pressed]}
          >
            <MaterialDesignIcons name="map-marker-star" size={28} color={colors.onWarning} />
            <View>
              <Text style={styles.mainBtnText}>Adventure</Text>
              <Text style={styles.mainBtnSub} testID="home-adventure-level">Level {level}</Text>
            </View>
          </Pressable>
        </Animated.View>

        <AdBanner />
      </View>

      <SettingsOverlay
        visible={settingsOpen}
        sound={settings.sound}
        haptics={settings.haptics}
        onToggleSound={settings.toggleSound}
        onToggleHaptics={settings.toggleHaptics}
        onClose={() => setSettingsOpen(false)}
      />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  fill: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  content: { flex: 1, paddingHorizontal: 16 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", height: 48 },
  bestWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  bestText: { color: colors.brandPrimary, fontSize: 22, fontWeight: "900" },
  iconBtn: {
    width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
  },
  hero: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  logoBlocks: { flexDirection: "row", gap: 4, marginBottom: 8 },
  title: {
    color: colors.onSurface, fontSize: 52, fontWeight: "900", letterSpacing: 2,
    textShadowColor: colors.surfaceTertiary, textShadowOffset: { width: 0, height: 5 }, textShadowRadius: 0,
  },
  tagline: { color: colors.muted, fontSize: 16, fontWeight: "800" },
  buttons: { gap: 16, marginBottom: 32, width: "100%", maxWidth: 420, alignSelf: "center" },
  mainBtn: {
    height: 72, borderRadius: 20, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12,
    borderBottomWidth: 5, borderBottomColor: colors.blockBevelDark,
  },
  pressed: { transform: [{ scale: 0.96 }] },
  mainBtnText: { color: colors.onSuccess, fontSize: 26, fontWeight: "900" },
  mainBtnSub: { color: colors.onSuccess, fontSize: 13, fontWeight: "800", opacity: 0.9 },
}));
