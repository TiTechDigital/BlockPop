import { View, StyleSheet } from "react-native";
import { useTheme } from "@/src/theme";
import type { Piece } from "./logic";

export function useBlockColors(): string[] {
  const { colors } = useTheme();
  return [
    colors.blockRed, colors.blockBlue, colors.blockYellow, colors.blockGreen,
    colors.blockPurple, colors.blockOrange, colors.blockCyan, colors.blockPink,
  ];
}

export function Block({ size, color }: { size: number; color: string }) {
  const { colors } = useTheme();
  const bw = Math.max(2, Math.round(size * 0.13));
  return (
    <View
      style={[
        styles.block,
        {
          width: size,
          height: size,
          backgroundColor: color,
          borderWidth: bw,
          borderTopColor: colors.blockBevelLight,
          borderLeftColor: colors.blockBevelLight,
          borderBottomColor: colors.blockBevelDark,
          borderRightColor: colors.blockBevelDark,
        },
      ]}
    >
      <View style={[styles.shine, { backgroundColor: colors.blockShine, height: size * 0.18 }]} />
    </View>
  );
}

export function PieceView({ piece, cell }: { piece: Piece; cell: number }) {
  const palette = useBlockColors();
  return (
    <View style={{ width: piece.w * cell, height: piece.h * cell }}>
      {piece.cells.map(([r, c]) => (
        <View key={`${r}-${c}`} style={{ position: "absolute", top: r * cell, left: c * cell }}>
          <Block size={cell} color={palette[piece.color]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { borderRadius: 3, overflow: "hidden" },
  shine: { marginHorizontal: 2, marginTop: 1, borderRadius: 2 },
});
