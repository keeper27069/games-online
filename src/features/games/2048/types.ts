export interface Tile {
  id: string;
  value: number;
  row: number;
  col: number;
  mergedFrom?: Tile[];
}

export type Grid = (Tile | null)[][];

export type MoveDirection = "UP" | "DOWN" | "LEFT" | "RIGHT";

export interface Game2048State {
  grid: Grid;
  tiles: Tile[];
  score: number;
  bestScore: number;
  previousState: { tiles: Tile[]; score: number } | null;
  status: "playing" | "won" | "gameover";
  hasReached2048: boolean;
  continuedAfter2048: boolean;
}
