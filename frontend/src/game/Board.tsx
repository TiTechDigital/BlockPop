import { View } from "react-native";
import Animated, { ZoomIn, ZoomOut } from "react-native-reanimated";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons";
import { makeStyles, useTheme } from "@/src/theme";
import { Block, useBlockColors } from "./Block";
import { SIZE, type Grid } from "./logic";

export type Ghost = { cells: Set<string>; color: number; rows: number[]; cols: number[] } | null;

export function Board({ grid, cell, ghost, gems = [] }: { grid: Grid; cell: number; ghost: Ghost; gems?: string[] }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const palette = useBlockColors();
  const idx = Array.from({ length: SIZE }, (_, i) => i);

  return (
    <View style={{ width: cell * SIZE, height: cell * SIZE }} testID="game-board">
      {idx.map((r) =>
        idx.map((c) => (
          <View
            key={`e-${r}-${c}`}
            style={[styles.empty, { top: r * cell, left: c * cell, width: cell, height: cell }]}
          />
        )),
      )}
      {idx.map((r) =>
        idx.map((c) => {
          const v = grid[r][c];
          if (v === null) return null;
          const lit = ghost && (ghost.rows.includes(r) || ghost.cols.includes(c));
          return (
            <Animated.View
              key={`b-${r}-${c}`}
              entering={ZoomIn.duration(140)}
              exiting={ZoomOut.duration(260)}
              style={[styles.abs, { top: r * cell, left: c * cell }]}
              testID={`board-cell-${r}-${c}`}
            >
              <Block size={cell} color={palette[lit ? ghost.color : v]} />
              {gems.includes(`${r}-${c}`) && (
                <View style={[styles.gem, { width: cell, height: cell }]} testID={`gem-${r}-${c}`}>
                  <MaterialDesignIcons name="diamond-stone" size={cell * 0.62} color={colors.onSurface} />
                </View>
              )}
            </Animated.View>
          );
        }),
      )}
      {ghost &&
        [...ghost.cells].map((k) => {
          const [r, c] = k.split("-").map(Number);
          const lit = ghost.rows.includes(r) || ghost.cols.includes(c);
          return (
            <View
              key={`g-${k}`}
              pointerEvents="none"
              style={[styles.abs, { top: r * cell, left: c * cell, opacity: lit ? 1 : 0.45 }]}
            >
              <Block size={cell} color={palette[ghost.color]} />
            </View>
          );
        })}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  abs: { position: "absolute" },
  gem: {
    position: "absolute", top: 0, left: 0, alignItems: "center", justifyContent: "center",
  },
  empty: {
    position: "absolute",
    backgroundColor: colors.boardCell,
    borderWidth: 0.5,
    borderColor: colors.gridLine,
  },
}));
