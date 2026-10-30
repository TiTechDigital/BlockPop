import { Modal, Pressable, Switch, Text, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons";
import { makeStyles, useTheme } from "@/src/theme";
import { AdBox } from "./AdSlot";

export function GameOverModal({
  visible, score, best, isNewBest, onRestart,
}: { visible: boolean; score: number; best: number; isNewBest: boolean; onRestart: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <Animated.View entering={ZoomIn.springify()} style={styles.card} testID="game-over-modal">
          <Text style={styles.title}>No More Space!</Text>
          {isNewBest && (
            <View style={styles.badge} testID="new-best-badge">
              <MaterialDesignIcons name="crown" size={18} color={colors.onBrandPrimary} />
              <Text style={styles.badgeText}>NEW BEST</Text>
            </View>
          )}
          <Text style={styles.caption}>SCORE</Text>
          <Text style={styles.score} testID="game-over-score">{score}</Text>
          <Text style={styles.bestLine} testID="game-over-best">Best: {best}</Text>
          <AdBox />
          <Pressable
            testID="play-again-button"
            onPress={onRestart}
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
          >
            <MaterialDesignIcons name="restart" size={22} color={colors.onBrandSecondary} />
            <Text style={styles.primaryText}>Play Again</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

export function SettingsModal({
  visible, haptics, onToggleHaptics, onRestart, onClose,
}: {
  visible: boolean; haptics: boolean; onToggleHaptics: (v: boolean) => void; onRestart: () => void; onClose: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} testID="settings-backdrop">
        <Pressable style={styles.card} testID="settings-modal">
          <Text style={styles.title}>Settings</Text>
          <View style={styles.row}>
            <MaterialDesignIcons name="vibrate" size={22} color={colors.onSurfaceSecondary} />
            <Text style={styles.rowText}>Vibration</Text>
            <Switch
              testID="haptics-switch"
              value={haptics}
              onValueChange={onToggleHaptics}
              trackColor={{ true: colors.success, false: colors.borderStrong }}
            />
          </View>
          <Pressable
            testID="settings-restart-button"
            onPress={onRestart}
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
          >
            <MaterialDesignIcons name="restart" size={22} color={colors.onBrandSecondary} />
            <Text style={styles.primaryText}>Restart Game</Text>
          </Pressable>
          <Pressable testID="settings-close-button" onPress={onClose} style={styles.secondary}>
            <Text style={styles.secondaryText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const useStyles = makeStyles((colors) => ({
  backdrop: { flex: 1, backgroundColor: colors.overlay, alignItems: "center", justifyContent: "center", padding: 24 },
  card: {
    width: "100%", maxWidth: 360, backgroundColor: colors.surfaceSecondary, borderRadius: 20,
    padding: 24, alignItems: "center", gap: 12, borderWidth: 2, borderColor: colors.borderStrong,
  },
  title: { color: colors.onSurface, fontSize: 28, fontWeight: "900" },
  caption: { color: colors.muted, fontSize: 12, fontWeight: "800", letterSpacing: 2, marginTop: 4 },
  score: { color: colors.onSurface, fontSize: 48, fontWeight: "900", lineHeight: 52 },
  bestLine: { color: colors.brandPrimary, fontSize: 16, fontWeight: "800" },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.brandPrimary,
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999,
  },
  badgeText: { color: colors.onBrandPrimary, fontWeight: "900", fontSize: 14 },
  primary: {
    flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", alignSelf: "stretch",
    height: 56, borderRadius: 16, backgroundColor: colors.success,
  },
  pressed: { transform: [{ scale: 0.96 }], opacity: 0.9 },
  primaryText: { color: colors.onSuccess, fontSize: 20, fontWeight: "900" },
  secondary: { height: 44, alignSelf: "stretch", alignItems: "center", justifyContent: "center" },
  secondaryText: { color: colors.muted, fontSize: 16, fontWeight: "800" },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12, alignSelf: "stretch", height: 56,
    paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.surfaceTertiary,
  },
  rowText: { flex: 1, color: colors.onSurface, fontSize: 16, fontWeight: "800" },
}));
