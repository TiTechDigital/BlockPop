import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeOut, ZoomIn, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons";

import { makeStyles, useTheme } from "@/src/theme";
import { storage } from "@/src/utils/storage";
import { Board, type Ghost } from "@/src/game/Board";
import { PieceView } from "@/src/game/Block";
import { TraySlot } from "@/src/game/TraySlot";
import { AdBanner } from "@/src/game/AdSlot";
import { GameOverModal, SettingsModal } from "@/src/game/Modals";
import {
  SIZE, anyFits, canPlace, clearLines, emptyGrid, fullLines, generateTray, isEmpty, placePiece, praise,
  type Grid, type Piece,
} from "@/src/game/logic";

const SAVE_KEY = "bb_game_state";
const BEST_KEY = "bb_best_score";
const HAPTICS_KEY = "bb_haptics";
const BOARD_PAD = 6;

type Popup = { key: number; text: string; sub: string } | null;

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { colors } = useTheme();
  const styles = useStyles();

  // Sizing: board fills width, tray below at ~half cell size.
  const usableH = height - insets.top - insets.bottom - 130 - 66;
  const cell = Math.floor(Math.min((Math.min(width, 480) - 24 - BOARD_PAD * 2) / SIZE, usableH / (SIZE + 3.4)));
  const trayCell = Math.floor(cell * 0.52);
  const slotW = Math.floor((Math.min(width, 480) - 16) / 3);
  const slotH = trayCell * 5 + 8;

  const [grid, setGrid] = useState<Grid>(emptyGrid);
  const [tray, setTray] = useState<(Piece | null)[]>([]);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [startBest, setStartBest] = useState(0);
  const [streak, setStreak] = useState(0);
  const [moves, setMoves] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);
  const [popup, setPopup] = useState<Popup>(null);
  const [haptics, setHaptics] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const rootRef = useRef<View>(null);
  const boardRef = useRef<View>(null);
  const rootOff = useRef({ x: 0, y: 0 });
  const boardOrigin = useRef({ x: 0, y: 0 });
  const hoverRef = useRef<{ r: number; c: number } | null>(null);
  const dragRef = useRef<number | null>(null);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);

  // ---------- load / save ----------
  useEffect(() => {
    (async () => {
      const [b, h, saved] = await Promise.all([
        storage.getItem(BEST_KEY, 0),
        storage.getItem(HAPTICS_KEY, true),
        storage.getItem(SAVE_KEY, null as string | null),
      ]);
      setBest(Number(b) || 0);
      setStartBest(Number(b) || 0);
      setHaptics(h !== false);
      let restored = false;
      if (typeof saved === "string") {
        try {
          const s = JSON.parse(saved);
          if (s.grid && s.tray) {
            setGrid(s.grid); setTray(s.tray); setScore(s.score || 0);
            setStreak(s.streak || 0); setMoves(s.moves || 0);
            restored = true;
          }
        } catch {}
      }
      if (!restored) setTray(generateTray(emptyGrid()));
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (gameOver) storage.removeItem(SAVE_KEY);
    else storage.setItem(SAVE_KEY, JSON.stringify({ grid, tray, score, streak, moves }));
  }, [loaded, gameOver, grid, tray, score, streak, moves]);

  useEffect(() => {
    if (loaded && score > best) {
      setBest(score);
      storage.setItem(BEST_KEY, score);
    }
  }, [score, best, loaded]);

  useEffect(() => {
    if (!popup) return;
    const t = setTimeout(() => setPopup(null), 1000);
    return () => clearTimeout(t);
  }, [popup]);

  const buzz = useCallback(
    (kind: "select" | "light" | "medium" | "heavy" | "error") => {
      if (!haptics || Platform.OS === "web") return;
      if (kind === "select") Haptics.selectionAsync();
      else if (kind === "error") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      else Haptics.impactAsync(
        kind === "light" ? Haptics.ImpactFeedbackStyle.Light
          : kind === "medium" ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Heavy,
      );
    },
    [haptics],
  );

  const measure = useCallback(() => {
    rootRef.current?.measureInWindow((x, y) => (rootOff.current = { x, y }));
    boardRef.current?.measureInWindow((x, y) => (boardOrigin.current = { x: x + BOARD_PAD, y: y + BOARD_PAD }));
  }, []);

  // ---------- placing ----------
  const commit = (i: number, r: number, c: number) => {
    const piece = tray[i];
    if (!piece || !canPlace(grid, piece, r, c)) return;
    const placed = placePiece(grid, piece, r, c);
    const { grid: next, lines } = clearLines(placed);
    let gain = piece.cells.length;
    let newStreak = streak;
    let newMoves = moves;
    if (lines > 0) {
      newStreak = streak + 1;
      newMoves = 0;
      gain += 10 * lines * lines * newStreak;
      const cleared = isEmpty(next);
      if (cleared) gain += 300;
      setPopup({
        key: Date.now(),
        text: cleared ? "Board Clear!" : praise(lines),
        sub: newStreak > 1 ? `Combo x${newStreak}  +${gain}` : `+${gain}`,
      });
      buzz("heavy");
    } else {
      newMoves = moves + 1;
      if (newMoves >= 3) newStreak = 0;
      buzz("medium");
    }
    let nextTray = tray.map((p, k) => (k === i ? null : p));
    if (nextTray.every((p) => p === null)) nextTray = generateTray(next);
    setGrid(next);
    setTray(nextTray);
    setScore((s) => s + gain);
    setStreak(newStreak);
    setMoves(newMoves);
    if (!nextTray.some((p) => p && anyFits(next, p))) {
      setTimeout(() => {
        setGameOver(true);
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
    if (!piece || gameOver) return;
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

  const restart = () => {
    setGrid(emptyGrid());
    setTray(generateTray(emptyGrid()));
    setScore(0); setStreak(0); setMoves(0);
    setGameOver(false); setSettingsOpen(false); setPopup(null);
    setStartBest(best);
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
          <View style={styles.bestWrap} testID="best-score">
            <MaterialDesignIcons name="crown" size={26} color={colors.brandPrimary} />
            <Text style={styles.bestText} testID="best-score-value">{best}</Text>
          </View>
          <Pressable
            testID="settings-button"
            hitSlop={8}
            onPress={() => setSettingsOpen(true)}
            style={({ pressed }) => [styles.iconBtn, pressed && { transform: [{ scale: 0.92 }] }]}
          >
            <MaterialDesignIcons name="cog" size={26} color={colors.onSurface} />
          </Pressable>
        </View>
        <Text style={styles.score} testID="current-score">{score}</Text>

        {/* Board */}
        <View style={styles.boardArea}>
          <View
            ref={boardRef}
            onLayout={measure}
            style={[styles.boardFrame, { padding: BOARD_PAD }]}
          >
            <Board grid={grid} cell={cell} ghost={ghost} />
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
              disabled={gameOver}
              onStart={onStart}
              onMove={onMove}
              onEnd={onEnd}
            />
          ))}
        </View>

        <AdBanner />
      </View>

      {/* Piece following the finger */}
      {dragPiece && (
        <Animated.View pointerEvents="none" style={[styles.floating, floatStyle]} testID="dragging-piece">
          <PieceView piece={dragPiece} cell={cell} />
        </Animated.View>
      )}

      <GameOverModal
        visible={gameOver}
        score={score}
        best={best}
        isNewBest={score > 0 && score > startBest}
        onRestart={restart}
      />
      <SettingsModal
        visible={settingsOpen}
        haptics={haptics}
        onToggleHaptics={(v) => {
          setHaptics(v);
          storage.setItem(HAPTICS_KEY, v);
        }}
        onRestart={restart}
        onClose={() => setSettingsOpen(false)}
      />
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
  bestWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  bestText: { color: colors.brandPrimary, fontSize: 22, fontWeight: "900" },
  iconBtn: {
    width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
  },
  score: {
    color: colors.onSurface, fontSize: 48, fontWeight: "900", lineHeight: 56,
    textShadowColor: colors.gridLine, textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 0,
  },
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
}));
