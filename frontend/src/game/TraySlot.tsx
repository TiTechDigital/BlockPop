import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { PieceView } from "./Block";
import type { Piece } from "./logic";

type Props = {
  index: number;
  piece: Piece | null;
  cell: number;
  width: number;
  height: number;
  hidden: boolean;
  disabled: boolean;
  onStart: (i: number, x: number, y: number) => void;
  onMove: (x: number, y: number) => void;
  onEnd: () => void;
};

export function TraySlot({ index, piece, cell, width, height, hidden, disabled, onStart, onMove, onEnd }: Props) {
  const gesture = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .enabled(!!piece && !disabled)
    .onBegin((e) => onStart(index, e.absoluteX, e.absoluteY))
    .onUpdate((e) => onMove(e.absoluteX, e.absoluteY))
    .onFinalize(() => onEnd());

  return (
    <GestureDetector gesture={gesture}>
      <View
        testID={`tray-slot-${index}`}
        style={{ width, height, alignItems: "center", justifyContent: "center", opacity: hidden ? 0 : 1 }}
      >
        {piece && <PieceView piece={piece} cell={cell} />}
      </View>
    </GestureDetector>
  );
}
