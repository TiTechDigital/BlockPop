import { COLOR_COUNT, SIZE, emptyGrid, type Grid } from "./logic";

// Adventure levels: original puzzles generated from a fixed seed per level, so
// every player gets the same board for the same level. Clear every gem to win.
export const LEVEL_COUNT = 30;
export const ADVENTURE_KEY = "bb_adventure_unlocked";

export type Level = { id: number; grid: Grid; gems: string[] };

function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getLevel(id: number): Level {
  const rand = seeded(id * 7919 + 13);
  const grid = emptyGrid();
  const rowCount = Array(SIZE).fill(0);
  const colCount = Array(SIZE).fill(0);
  const fillTarget = Math.min(6 + Math.floor(id * 1.1), 34);
  const filled: string[] = [];
  for (let tries = 0; filled.length < fillTarget && tries < 800; tries++) {
    const r = Math.floor(rand() * SIZE);
    const c = Math.floor(rand() * SIZE);
    if (grid[r][c] !== null || rowCount[r] >= 6 || colCount[c] >= 6) continue;
    grid[r][c] = Math.floor(rand() * COLOR_COUNT);
    rowCount[r]++;
    colCount[c]++;
    filled.push(`${r}-${c}`);
  }
  for (let i = filled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [filled[i], filled[j]] = [filled[j], filled[i]];
  }
  const gemCount = Math.min(2 + Math.floor(id / 3), 10, filled.length);
  return { id, grid, gems: filled.slice(0, gemCount) };
}
