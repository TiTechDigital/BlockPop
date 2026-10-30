import type { ReactNode } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons";
import { makeStyles, useTheme } from "@/src/theme";
import { AdBox } from "./AdSlot";

// Overlays are plain absolute views (not RN Modal) so the native share sheet
// and full-screen ads can present on top without conflicts.
function Overlay({ visible, onBackdrop, children, testID }: {
  visible: boolean; onBackdrop?: () => void; children: ReactNode; testID: string;
}) {
  const styles = useStyles();
  if (!visible) return null;
  return (
    <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(150)} style={styles.backdrop}>
      {onBackdrop && <Pressable style={StyleSheet.absoluteFill} onPress={onBackdrop} testID={`${testID}-backdrop`} />}
      <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.card} testID={testID}>
        {children}
      </Animated.View>
    </Animated.View>
  );
}

type BtnProps = { testID: string; label: string; icon: string; onPress: () => void; tone?: "success" | "warning" | "info" };
function BigButton({ testID, label, icon, onPress, tone = "success" }: BtnProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const bg = tone === "warning" ? colors.warning : tone === "info" ? colors.brandTertiary : colors.success;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [styles.primary, { backgroundColor: bg }, pressed && styles.pressed]}
    >
      <MaterialDesignIcons name={icon as any} size={22} color={colors.onSuccess} />
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

function SmallRow({ children }: { children: ReactNode }) {
  const styles = useStyles();
  return <View style={styles.smallRow}>{children}</View>;
}

function SmallButton({ testID, label, icon, onPress }: Omit<BtnProps, "tone">) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable testID={testID} onPress={onPress} style={({ pressed }) => [styles.small, pressed && styles.pressed]}>
      <MaterialDesignIcons name={icon as any} size={20} color={colors.onSurface} />
      <Text style={styles.smallText}>{label}</Text>
    </Pressable>
  );
}

export function GameOverOverlay(props: {
  visible: boolean; adventure: boolean; levelId: number; score: number; best: number; isNewBest: boolean;
  canRevive: boolean; onRevive: () => void; onPlayAgain: () => void; onHome: () => void; onShare: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Overlay visible={props.visible} testID="game-over-modal">
      <Text style={styles.title}>{props.adventure ? `Level ${props.levelId} Failed` : "No More Space!"}</Text>
      {props.isNewBest && !props.adventure && (
        <View style={styles.badge} testID="new-best-badge">
          <MaterialDesignIcons name="crown" size={18} color={colors.onBrandPrimary} />
          <Text style={styles.badgeText}>NEW BEST</Text>
        </View>
      )}
      <Text style={styles.caption}>SCORE</Text>
      <Text style={styles.score} testID="game-over-score">{props.score}</Text>
      {!props.adventure && <Text style={styles.bestLine} testID="game-over-best">Best: {props.best}</Text>}
      <AdBox />
      {props.canRevive && (
        <BigButton testID="revive-button" label="Keep Playing" icon="play-box-multiple" tone="warning" onPress={props.onRevive} />
      )}
      <BigButton testID="play-again-button" label={props.adventure ? "Retry" : "Play Again"} icon="restart" onPress={props.onPlayAgain} />
      <SmallRow>
        <SmallButton testID="game-over-share-button" label="Share" icon="share-variant" onPress={props.onShare} />
        <SmallButton testID="game-over-home-button" label="Home" icon="home" onPress={props.onHome} />
      </SmallRow>
    </Overlay>
  );
}

export function WinOverlay(props: {
  visible: boolean; levelId: number; score: number; hasNext: boolean; onNext: () => void; onLevels: () => void; onShare: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Overlay visible={props.visible} testID="level-complete-modal">
      <MaterialDesignIcons name="trophy" size={56} color={colors.brandPrimary} />
      <Text style={styles.title}>Level {props.levelId} Complete!</Text>
      <Text style={styles.caption}>SCORE</Text>
      <Text style={styles.score} testID="level-complete-score">{props.score}</Text>
      {props.hasNext ? (
        <BigButton testID="next-level-button" label="Next Level" icon="arrow-right-bold" onPress={props.onNext} />
      ) : (
        <Text style={styles.bestLine}>You finished every level!</Text>
      )}
      <SmallRow>
        <SmallButton testID="level-complete-share-button" label="Share" icon="share-variant" onPress={props.onShare} />
        <SmallButton testID="level-complete-levels-button" label="Levels" icon="view-grid" onPress={props.onLevels} />
      </SmallRow>
    </Overlay>
  );
}

export function SettingsOverlay(props: {
  visible: boolean; sound: boolean; haptics: boolean; onToggleSound: (v: boolean) => void;
  onToggleHaptics: (v: boolean) => void; onRestart?: () => void; onClose: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const row = (icon: string, label: string, value: boolean, onChange: (v: boolean) => void, testID: string) => (
    <View style={styles.row}>
      <MaterialDesignIcons name={icon as any} size={22} color={colors.onSurfaceSecondary} />
      <Text style={styles.rowText}>{label}</Text>
      <Switch testID={testID} value={value} onValueChange={onChange} trackColor={{ true: colors.success, false: colors.borderStrong }} />
    </View>
  );
  return (
    <Overlay visible={props.visible} onBackdrop={props.onClose} testID="settings-modal">
      <Text style={styles.title}>Settings</Text>
      {row(props.sound ? "volume-high" : "volume-off", "Sound", props.sound, props.onToggleSound, "sound-switch")}
      {row("vibrate", "Vibration", props.haptics, props.onToggleHaptics, "haptics-switch")}
      {props.onRestart && (
        <BigButton testID="settings-restart-button" label="Restart" icon="restart" onPress={props.onRestart} />
      )}
      <Pressable testID="settings-close-button" onPress={props.onClose} style={styles.secondary}>
        <Text style={styles.secondaryText}>Close</Text>
      </Pressable>
    </Overlay>
  );
}

const useStyles = makeStyles((colors) => ({
  backdrop: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.overlay,
    alignItems: "center", justifyContent: "center", padding: 24,
  },
  card: {
    width: "100%", maxWidth: 360, backgroundColor: colors.surfaceSecondary, borderRadius: 20,
    padding: 24, alignItems: "center", gap: 12, borderWidth: 2, borderColor: colors.borderStrong,
  },
  title: { color: colors.onSurface, fontSize: 26, fontWeight: "900", textAlign: "center" },
  caption: { color: colors.muted, fontSize: 12, fontWeight: "800", letterSpacing: 2 },
  score: { color: colors.onSurface, fontSize: 44, fontWeight: "900", lineHeight: 50 },
  bestLine: { color: colors.brandPrimary, fontSize: 16, fontWeight: "800" },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.brandPrimary,
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999,
  },
  badgeText: { color: colors.onBrandPrimary, fontWeight: "900", fontSize: 14 },
  primary: {
    flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", alignSelf: "stretch",
    height: 52, borderRadius: 16,
  },
  pressed: { transform: [{ scale: 0.96 }], opacity: 0.9 },
  primaryText: { color: colors.onSuccess, fontSize: 19, fontWeight: "900" },
  smallRow: { flexDirection: "row", gap: 12, alignSelf: "stretch" },
  small: {
    flex: 1, height: 46, borderRadius: 14, flexDirection: "row", gap: 6, alignItems: "center",
    justifyContent: "center", backgroundColor: colors.surfaceTertiary,
  },
  smallText: { color: colors.onSurface, fontSize: 15, fontWeight: "800" },
  secondary: { height: 44, alignSelf: "stretch", alignItems: "center", justifyContent: "center" },
  secondaryText: { color: colors.muted, fontSize: 16, fontWeight: "800" },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12, alignSelf: "stretch", height: 56,
    paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.surfaceTertiary,
  },
  rowText: { flex: 1, color: colors.onSurface, fontSize: 16, fontWeight: "800" },
}));
