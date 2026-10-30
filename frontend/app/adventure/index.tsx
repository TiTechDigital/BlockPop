import { useCallback, useState } from "react";
import { FlatList, Pressable, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons";
import { makeStyles, useTheme } from "@/src/theme";
import { storage } from "@/src/utils/storage";
import { ADVENTURE_KEY, LEVEL_COUNT } from "@/src/game/levels";

const COLS = 5;
const LEVELS = Array.from({ length: LEVEL_COUNT }, (_, i) => i + 1);

export default function AdventureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const styles = useStyles();
  const [unlocked, setUnlocked] = useState(1);
  const tile = Math.floor((Math.min(width, 480) - 32 - (COLS - 1) * 12) / COLS);

  useFocusEffect(
    useCallback(() => {
      storage.getItem(ADVENTURE_KEY, 1).then((v) => setUnlocked(Number(v) || 1));
    }, []),
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient colors={[colors.bgTop, colors.bgBottom]} style={styles.fill} />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          testID="adventure-back-button"
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
          style={({ pressed }) => [styles.iconBtn, pressed && { transform: [{ scale: 0.92 }] }]}
        >
          <MaterialDesignIcons name="chevron-left" size={30} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.title}>Adventure</Text>
        <View style={styles.progress} testID="adventure-progress">
          <MaterialDesignIcons name="star" size={20} color={colors.brandPrimary} />
          <Text style={styles.progressText}>{Math.min(unlocked - 1, LEVEL_COUNT)}/{LEVEL_COUNT}</Text>
        </View>
      </View>
      <Text style={styles.subtitle}>Clear every gem from the board to win a level.</Text>
      <FlatList
        data={LEVELS}
        numColumns={COLS}
        keyExtractor={(n) => String(n)}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        renderItem={({ item: n, index }) => {
          const done = n < unlocked;
          const current = n === unlocked;
          const locked = n > unlocked;
          return (
            <Animated.View entering={FadeInDown.delay(index * 18).duration(260)}>
              <Pressable
                testID={`level-tile-${n}`}
                disabled={locked}
                onPress={() => router.push(`/adventure/${n}`)}
                style={({ pressed }) => [
                  styles.tile,
                  { width: tile, height: tile },
                  done && { backgroundColor: colors.success },
                  current && { backgroundColor: colors.brandPrimary },
                  locked && styles.locked,
                  pressed && { transform: [{ scale: 0.94 }] },
                ]}
              >
                {locked ? (
                  <MaterialDesignIcons name="lock" size={22} color={colors.muted} />
                ) : (
                  <Text style={[styles.tileText, current && { color: colors.onBrandPrimary }]}>{n}</Text>
                )}
                {done && <MaterialDesignIcons name="check-bold" size={14} color={colors.onSuccess} />}
              </Pressable>
            </Animated.View>
          );
        }}
      />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  fill: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16,
  },
  iconBtn: {
    width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
  },
  title: { color: colors.onSurface, fontSize: 24, fontWeight: "900" },
  progress: { flexDirection: "row", alignItems: "center", gap: 4, minWidth: 44, justifyContent: "flex-end" },
  progressText: { color: colors.brandPrimary, fontWeight: "900", fontSize: 16 },
  subtitle: { color: colors.muted, fontSize: 14, fontWeight: "700", textAlign: "center", marginVertical: 16 },
  list: { paddingHorizontal: 16, gap: 12, alignSelf: "center" },
  tile: {
    borderRadius: 14, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center",
    borderBottomWidth: 4, borderBottomColor: colors.blockBevelDark,
  },
  locked: { backgroundColor: colors.surfaceTertiary, opacity: 0.8 },
  tileText: { color: colors.onSurface, fontSize: 22, fontWeight: "900" },
}));
