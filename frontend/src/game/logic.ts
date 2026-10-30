export const SIZE = 8;
export const COLOR_COUNT = 8;

export type Grid = (number | null)[][];
export type Piece = { id: string; cells: [number, number][]; color: number; w: number; h: number };

// Shapes drawn as rows; '#' = block
const SHAPES: string[][] = [
  ["#"],
  ["##"], ["#", "#"],
  ["###"], ["#", "#", "#"],
  ["####"], ["#", "#", "#", "#"],
  ["#####"], ["#", "#", "#", "#", "#"],
  ["##", "##"],
  ["###", "###", "###"],
  ["###", "###"], ["##", "##", "##"],
  ["#.", "##"], [".#", "##"], ["##", "#."], ["##", ".#"],
  ["#..", "###"], ["..#", "###"], ["###", "#.."], ["###", "..#"],
  ["#.", "#.", "##"], [".#", ".#", "##"], ["##", "#.", "#."], ["##", ".#", ".#"],
  ["###", ".#."], [".#.", "###"], ["#.", "##", "#."], [".#", "##", ".#"],
  ["##.", ".##"], [".##", "##."], ["#.", "##", ".#"], [".#", "##", "#."],
  ["#..", ".#.", "..#"], ["..#", ".#.", "#.."],
];

let idCounter = 0;

export function emptyGrid(): Grid {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
}

export function randomPiece(): Piece {
  const rows = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const cells: [number, number][] = [];
  rows.forEach((row, r) => row.split("").forEach((ch, c) => ch === "#" && cells.push([r, c])));
  idCounter += 1;
  return {
    id: `${Date.now()}-${idCounter}`,
    cells,
    color: Math.floor(Math.random() * COLOR_COUNT),
    w: Math.max(...rows.map((r) => r.length)),
    h: rows.length,
  };
}

export function canPlace(grid: Grid, piece: Piece, r: number, c: number): boolean {
  return piece.cells.every(([dr, dc]) => {
    const rr = r + dr;
    const cc = c + dc;
    return rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE && grid[rr][cc] === null;
  });
}

export function anyFits(grid: Grid, piece: Piece): boolean {
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (canPlace(grid, piece, r, c)) return true;
  return false;
}

export function placePiece(grid: Grid, piece: Piece, r: number, c: number): Grid {
  const g = grid.map((row) => [...row]);
  piece.cells.forEach(([dr, dc]) => (g[r + dr][c + dc] = piece.color));
  return g;
}

export function fullLines(grid: Grid): { rows: number[]; cols: number[] } {
  const rows: number[] = [];
  const cols: number[] = [];
  for (let i = 0; i < SIZE; i++) {
    if (grid[i].every((v) => v !== null)) rows.push(i);
    if (grid.every((row) => row[i] !== null)) cols.push(i);
  }
  return { rows, cols };
}

export function clearLines(grid: Grid): { grid: Grid; lines: number } {
  const { rows, cols } = fullLines(grid);
  const g = grid.map((row) => [...row]);
  rows.forEach((r) => g[r].fill(null));
  cols.forEach((c) => g.forEach((row) => (row[c] = null)));
  return { grid: g, lines: rows.length + cols.length };
}

export function isEmpty(grid: Grid): boolean {
  return grid.every((row) => row.every((v) => v === null));
}

// New set of 3; retries so that at least one piece fits the board when possible.
export function generateTray(grid: Grid): Piece[] {
  let tray: Piece[] = [];
  for (let i = 0; i < 20; i++) {
    tray = [randomPiece(), randomPiece(), randomPiece()];
    if (tray.some((p) => anyFits(grid, p))) break;
  }
  return tray;
}

export function praise(lines: number): string {
  if (lines >= 4) return "Unbelievable!";
  if (lines === 3) return "Excellent!";
  if (lines === 2) return "Great!";
  return "Good!";
}
