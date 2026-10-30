import { useLocalSearchParams } from "expo-router";
import { GameView } from "@/src/game/GameView";
import { LEVEL_COUNT } from "@/src/game/levels";

export default function AdventureLevelScreen() {
  const { level } = useLocalSearchParams<{ level: string }>();
  const n = Math.min(Math.max(parseInt(level ?? "1", 10) || 1, 1), LEVEL_COUNT);
  return <GameView key={n} mode="adventure" levelId={n} />;
}
