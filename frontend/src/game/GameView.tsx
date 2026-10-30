import { type ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, Share, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import { captureRef } from "react-native-view-shot";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut, ZoomIn, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons";

import { makeStyles, useTheme } from "@/src/theme";
import { storage } from "@/src/utils/storage";
import { useGameAds } from "@/src/ads/Ads";
import { Board, type Ghost } from "./Board";
import { PieceView } from "./Block";
import { TraySlot } from "./TraySlot";
import { AdBanner } from "./AdSlot";
import { GameOverOverlay, SettingsOverlay, WinOverlay } from "./Modals";
import { useSettings } from "./settings";
import { playSound } from "./sound";
import { ADVENTURE_KEY, LEVEL_COUNT, getLevel } from "./levels";
import {
  SIZE, anyFits, canPlace, clearLines, emptyGrid, fullLines, generateTray, isEmpty, placePiece, praise,
  type Grid, type Piece,
} from "./logic";

export const SAVE_KEY = "bb_game_state";
export const BEST_KEY = "bb_best_score";
const BOARD_PAD = 6;

type Popup = { key: number; text: string; sub: string } | null;
type Props = { mode: "classic" | "adventure"; levelId?: number };

export function GameView({ mode, levelId = 1 }: Props) {
  const adventure = mode === "adventure";
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { colors } = useTheme();
  const styles = useStyles();
  const settings = useSettings();
  const ads = useGameAds();

  const usableH = height - insets.top - insets.bottom - 140 - 66;
  const cell = Math.floor(Math.min((Math.min(width, 480) - 24 - BOARD_PAD * 2) / SIZE, usableH / (SIZE + 3.4)));
  const trayCell = Math.floor(cell * 0.52);
  const slotW = Math.floor((Math.min(width, 480) - 16) / 3);
  const slotH = trayCell * 5 + 8;

  const [grid, setGrid] = useState<Grid>(emptyGrid);
  const [tray, setTray] = useState<(Piece | null)[]>([]);
  const [gems, setGems] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [startBest, setStartBest] = useState(0);
  const [streak, setStreak] = useState(0);
  const [moves, setMoves] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [revived, setRevived] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);
  const [popup, setPopup] = useState<Popup>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const rootRef = useRef<ComponentRef<typeof View>>(null);
  const boardRef = useRef<ComponentRef<typeof View>>(null);
  const shareRef = useRef<ComponentRef<typeof View>>(null);
  const rootOff = useRef({ x: 0, y: 0 });
  const boardOrigin = useRef({ x: 0, y: 0 });
  const hoverRef = useRef<{ r: number; c: number } | null>(null);
  const dragRef = useRef<number | null>(null);
  const endTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);

  const startLevel = useCallback(() => {
    const lv = getLevel(levelId);
    setGrid(lv.grid);
    setGems(lv.gems);
    setTray(generateTray(lv.grid));
  }, [levelId]);

  // ---------- load / save ----------
  useEffect(() => {
    (async () => {
      const b = Number(await storage.getItem(BEST_KEY, 0)) || 0;
      setBest(b);
      setStartBest(b);
      if (adventure) {
        startLevel();
      } else {
        const saved = await storage.getItem(SAVE_KEY, null as string | null);
        let restored = false;
        if (typeof saved === "string") {
          try {
            const s = JSON.parse(saved);
            if (s.grid && s.tray) {
              setGrid(s.grid); setTray(s.tray); setScore(s.score || 0);
              setStreak(s.streak || 0); setMoves(s.moves || 0); setRevived(!!s.revived);
              restored = true;
            }
          } catch {}
        }
        if (!restored) setTray(generateTray(emptyGrid()));
      }
      setLoaded(true);
    })();
    return () => {
      if (endTimer.current) clearTimeout(endTimer.current);
    };
  }, [adventure, startLevel]);

  useEffect(() => {
    if (!loaded || adventure) return;
    if (gameOver) storage.removeItem(SAVE_KEY);
    else storage.setItem(SAVE_KEY, JSON.stringify({ grid, tray, score, streak, moves, revived }));
  }, [loaded, adventure, gameOver, grid, tray, score, streak, moves, revived]);

  useEffect(() => {
    if (loaded && !adventure && score > best) {
      setBest(score);
      storage.setItem(BEST_KEY, score);
    }
  }, [score, best, loaded, adventure]);

  useEffect(() => {
    if (!popup) return;
    const t = setTimeout(() => setPopup(null), 1000);
    return () => clearTimeout(t);
  }, [popup]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const buzz = (kind: "select" | "light" | "medium" | "heavy" | "error") => {
    if (!settings.haptics || Platform.OS === "web") return;
    if (kind === "select") Haptics.selectionAsync();
    else if (kind === "error") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    else Haptics.impactAsync(
      kind === "light" ? Haptics.ImpactFeedbackStyle.Light
        : kind === "medium" ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Heavy,
    );
  };

  const measure = useCallback(() => {
    rootRef.current?.measureInWindow((x, y) => (rootOff.current = { x, y }));
    boardRef.current?.measureInWindow((x, y) => (boardOrigin.current = { x: x + BOARD_PAD, y: y + BOARD_PAD }));
  }, []);

  // ---------- placing ----------
  const commit = (i: number, r: number, c: number) => {
    const piece = tray[i];
    if (!piece || !canPlace(grid, piece, r, c)) return;
    const placed = placePiece(grid, piece, r, c);
    const { rows, cols } = fullLines(placed);
    const { grid: next, lines } = clearLines(placed);
    const leftGems = gems.filter((k) => {
      const [gr, gc] = k.split("-").map(Number);
      return !rows.includes(gr) && !cols.includes(gc);
    });
    let gain = piece.cells.length;
    let newStreak = streak;
    let newMoves = moves;
    if (lines > 0) {
      newStreak = streak + 1;
      newMoves = 0;
      gain += 10 * lines * lines * newStreak;
      const cleared = isEmpty(next);
      if (cleared) gain += 300;
      const gemsGot = gems.length - leftGems.length;
      setPopup({
        key: Date.now(),
        text: cleared ? "Board Clear!" : praise(lines),
        sub: [newStreak > 1 ? `Combo x${newStreak}` : "", `+${gain}`, gemsGot ? `${gemsGot} gem${gemsGot > 1 ? "s" : ""}` : ""]
          .filter(Boolean).join("  "),
      });
      playSound(newStreak > 1 ? "combo" : "clear");
      buzz("heavy");
    } else {
      newMoves = moves + 1;
      if (newMoves >= 3) newStreak = 0;
      playSound("place");
      buzz("medium");
    }
    let nextTray = tray.map((p, k) => (k === i ? null : p));
    if (nextTray.every((p) => p === null)) nextTray = generateTray(next);
    setGrid(next);
    setTray(nextTray);
    setGems(leftGems);
    setScore((s) => s + gain);
    setStreak(newStreak);
    setMoves(newMoves);

    if (adventure && leftGems.length === 0) {
      endTimer.current = setTimeout(() => {
        setWon(true);
        playSound("win");
      }, 700);
      (async () => {
        const u = Number(await storage.getItem(ADVENTURE_KEY, 1)) || 1;
        if (levelId + 1 > u) storage.setItem(ADVENTURE_KEY, Math.min(levelId + 1, LEVEL_COUNT + 1));
      })();
      return;
    }
    if (!nextTray.some((p) => p && anyFits(next, p))) {
      endTimer.current = setTimeout(() => {
        setGameOver(true);
        playSound("gameover");
        buzz("error");
      }, 700);
    }
  };

  // ---------- drag handlers (latest closure via ref) ----------
  const handlers = useRef({ start: (_i: number, _x: number, _y: number) => {}, move: (_x: number, _y: number) => {}, end: () => {} });
  const updatePos = (piece: Piece, ax: number, ay: number) => {
    const pw = piece.w * cell;
    const ph = piece.h * cell;
    const left = ax - pw / 2;
    const top = ay - ph - cell * 1.3;
    dragX.value = left - rootOff.current.x;
    dragY.value = top - rootOff.current.y;
    const r = Math.round((top - boardOrigin.current.y) / cell);
    const c = Math.round((left - boardOrigin.current.x) / cell);
    const h = canPlace(grid, piece, r, c) ? { r, c } : null;
    const prev = hoverRef.current;
    if (h?.r !== prev?.r || h?.c !== prev?.c) {
      hoverRef.current = h;
      setHover(h);
      if (h) buzz("light");
    }
  };
  handlers.current.start = (i, ax, ay) => {
    const piece = tray[i];
    if (!piece || gameOver || won) return;
    measure();
    dragRef.current = i;
    setDragIndex(i);
    updatePos(piece, ax, ay);
    buzz("select");
  };
  handlers.current.move = (ax, ay) => {
    const i = dragRef.current;
    if (i === null || !tray[i]) return;
    updatePos(tray[i] as Piece, ax, ay);
  };
  handlers.current.end = () => {
    const i = dragRef.current;
    const h = hoverRef.current;
    dragRef.current = null;
    hoverRef.current = null;
    setDragIndex(null);
    setHover(null);
    if (i !== null && h) commit(i, h.r, h.c);
  };
  const onStart = useCallback((i: number, x: number, y: number) => handlers.current.start(i, x, y), []);
  const onMove = useCallback((x: number, y: number) => handlers.current.move(x, y), []);
  const onEnd = useCallback(() => handlers.current.end(), []);

  // ---------- actions ----------
  const restart = () => {
    if (endTimer.current) clearTimeout(endTimer.current);
    if (adventure) startLevel();
    else {
      setGrid(emptyGrid());
      setTray(generateTray(emptyGrid()));
    }
    setScore(0); setStreak(0); setMoves(0); setRevived(false);
    setGameOver(false); setWon(false); setSettingsOpen(false); setPopup(null);
    setStartBest(best);
  };

  const playAgain = async () => {
    await ads.maybeShowInterstitial();
    restart();
  };

  const leave = async (to: "/" | "/adventure") => {
    await ads.maybeShowInterstitial();
    if (router.canGoBack()) router.back();
    else router.replace(to);
  };

  const nextLevel = async () => {
    await ads.maybeShowInterstitial();
    router.replace(`/adventure/${levelId + 1}`);
  };

  // Rewarded ad: clears the 4 middle rows (gems stay) and deals a fresh set.
  const revive = () => {
    ads.showRewardedToContinue(() => {
      const g = grid.map((row, r) => row.map((v, c) => (r >= 2 && r <= 5 && !gems.includes(`${r}-${c}`) ? null : v)));
      setGrid(g);
      setTray(generateTray(g));
      setRevived(true);
      setGameOver(false);
    });
  };

  const share = async () => {
    const msg = adventure
      ? `I just played Level ${levelId} in Block Pop and scored ${score}! Can you beat it?`
      : `I scored ${score} in Block Pop! Can you beat me?`;
    try {
      if (Platform.OS !== "web" && shareRef.current && (await Sharing.isAvailableAsync())) {
        const uri = await captureRef(shareRef, { format: "png", quality: 0.9 });
        await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: msg, UTI: "public.png" });
        return;
      }
      await Share.share({ message: msg });
    } catch {
      setToast("Sharing isn't available here");
    }
  };

  const dragPiece = dragIndex !== null ? tray[dragIndex] : null;
  const ghost: Ghost = useMemo(() => {
    if (!dragPiece || !hover) return null;
    const g = placePiece(grid, dragPiece, hover.r, hover.c);
    const { rows, cols } = fullLines(g);
    return {
      cells: new Set(dragPiece.cells.map(([dr, dc]) => `${hover.r + dr}-${hover.c + dc}`)),
      color: dragPiece.color,
      rows,
      cols,
    };
  }, [dragPiece, hover, grid]);

  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateX: dragX.value }, { translateY: dragY.value }] }));

  return (
    <View ref={rootRef} style={styles.root} onLayout={measure}>
      <StatusBar style="light" />
      <LinearGradient colors={[colors.bgTop, colors.bgBottom]} style={styles.fill} />
      <View style={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            testID="back-button"
            hitSlop={8}
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          >
            <MaterialDesignIcons name="chevron-left" size={30} color={colors.onSurface} />
          </Pressable>
          {adventure ? (
            <Text style={styles.levelTitle} testID="level-title">Level {levelId}</Text>
          ) : (
            <View style={styles.bestWrap} testID="best-score">
              <MaterialDesignIcons name="crown" size={26} color={colors.brandPrimary} />
              <Text style={styles.bestText} testID="best-score-value">{best}</Text>
            </View>
          )}
          <Pressable
            testID="settings-button"
            hitSlop={8}
            onPress={() => setSettingsOpen(true)}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          >
            <MaterialDesignIcons name="cog" size={26} color={colors.onSurface} />
          </Pressable>
        </View>

        {/* Shareable area: score + board */}
        <View ref={shareRef} collapsable={false} style={styles.shareArea}>
          {adventure ? (
            <View style={styles.gemGoal} testID="gems-left">
              <MaterialDesignIcons name="diamond-stone" size={30} color={colors.blockCyan} />
              <Text style={styles.gemGoalText} testID="gems-left-value">{gems.length}</Text>
              <Text style={styles.gemGoalLabel}>gems left · {score} pts</Text>
            </View>
          ) : (
            <Text style={styles.score} testID="current-score">{score}</Text>
          )}
          <View style={styles.boardArea}>
            <View ref={boardRef} onLayout={measure} style={[styles.boardFrame, { padding: BOARD_PAD }]}>
              <Board grid={grid} cell={cell} ghost={ghost} gems={gems} />
            </View>
            {popup && (
              <Animated.View
                key={popup.key}
                entering={ZoomIn.springify().damping(12)}
                exiting={FadeOut.duration(250)}
                pointerEvents="none"
                style={styles.popup}
                testID="combo-popup"
              >
                <Text style={styles.popupText}>{popup.text}</Text>
                <Text style={styles.popupSub}>{popup.sub}</Text>
              </Animated.View>
            )}
          </View>
        </View>

        {/* Tray */}
        <View style={[styles.tray, { height: slotH }]} testID="piece-tray">
          {[0, 1, 2].map((i) => (
            <TraySlot
              key={tray[i]?.id ?? `empty-${i}`}
              index={i}
              piece={tray[i] ?? null}
              cell={trayCell}
              width={slotW}
              height={slotH}
              hidden={dragIndex === i}
              disabled={gameOver || won}
              onStart={onStart}
              onMove={onMove}
              onEnd={onEnd}
            />
          ))}
        </View>

        <AdBanner />
      </View>

      {dragPiece && (
        <Animated.View pointerEvents="none" style={[styles.floating, floatStyle]} testID="dragging-piece">
          <PieceView piece={dragPiece} cell={cell} />
        </Animated.View>
      )}

      <GameOverOverlay
        visible={gameOver}
        adventure={adventure}
        levelId={levelId}
        score={score}
        best={best}
        isNewBest={score > 0 && score > startBest}
        canRevive={ads.rewardedReady && !revived}
        onRevive={revive}
        onPlayAgain={playAgain}
        onHome={() => leave(adventure ? "/adventure" : "/")}
        onShare={share}
      />
      <WinOverlay
        visible={won}
        levelId={levelId}
        score={score}
        hasNext={levelId < LEVEL_COUNT}
        onNext={nextLevel}
        onLevels={() => leave("/adventure")}
        onShare={share}
      />
      <SettingsOverlay
        visible={settingsOpen}
        sound={settings.sound}
        haptics={settings.haptics}
        onToggleSound={settings.toggleSound}
        onToggleHaptics={settings.toggleHaptics}
        onRestart={restart}
        onClose={() => setSettingsOpen(false)}
      />
      {toast && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={[styles.toast, { top: insets.top + 64 }]}
          testID="toast-message"
        >
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  fill: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  content: { flex: 1, paddingHorizontal: 12, alignItems: "center" },
  header: {
    flexDirection: "row", alignSelf: "stretch", maxWidth: 480, width: "100%",
    justifyContent: "space-between", alignItems: "center", height: 48,
  },
  pressed: { transform: [{ scale: 0.92 }] },
  bestWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  bestText: { color: colors.brandPrimary, fontSize: 22, fontWeight: "900" },
  levelTitle: { color: colors.onSurface, fontSize: 22, fontWeight: "900" },
  iconBtn: {
    width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
  },
  shareArea: { flex: 1, alignSelf: "stretch", alignItems: "center" },
  score: {
    color: colors.onSurface, fontSize: 48, fontWeight: "900", lineHeight: 56,
    textShadowColor: colors.gridLine, textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 0,
  },
  gemGoal: { flexDirection: "row", alignItems: "center", gap: 8, height: 56 },
  gemGoalText: { color: colors.onSurface, fontSize: 36, fontWeight: "900" },
  gemGoalLabel: { color: colors.muted, fontSize: 15, fontWeight: "800" },
  boardArea: { flex: 1, justifyContent: "center", alignItems: "center" },
  boardFrame: {
    backgroundColor: colors.board, borderRadius: 10, borderWidth: 2, borderColor: colors.surfaceTertiary,
  },
  popup: { position: "absolute", alignItems: "center" },
  popupText: {
    color: colors.brandPrimary, fontSize: 40, fontWeight: "900",
    textShadowColor: colors.surfaceTertiary, textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 0,
  },
  popupSub: { color: colors.onSurface, fontSize: 20, fontWeight: "900" },
  tray: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginVertical: 8 },
  floating: { position: "absolute", top: 0, left: 0 },
  toast: {
    position: "absolute", alignSelf: "center", backgroundColor: colors.surfaceInverse,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999,
  },
  toastText: { color: colors.onSurfaceInverse, fontWeight: "800" },
}));
