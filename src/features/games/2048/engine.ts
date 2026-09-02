import { Tile, Grid, MoveDirection, Game2048State } from "./types";

let tileIdCounter = 0;

export const createTile = (row: number, col: number, value?: number): Tile => {
  return {
    id: `tile_${++tileIdCounter}_${Date.now()}_${Math.random()}`,
    value: value ?? (Math.random() < 0.9 ? 2 : 4),
    row,
    col,
  };
};

export const createEmptyGrid = (): Grid => {
  return Array(4)
    .fill(null)
    .map(() => Array(4).fill(null));
};

export const getEmptyCells = (grid: Grid): { row: number; col: number }[] => {
  const empty: { row: number; col: number }[] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!grid[r][c]) {
        empty.push({ row: r, col: c });
      }
    }
  }
  return empty;
};

export const spawnRandomTile = (grid: Grid, tiles: Tile[]): { grid: Grid; tiles: Tile[] } => {
  const emptyCells = getEmptyCells(grid);
  if (emptyCells.length === 0) return { grid, tiles };

  const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const newTile = createTile(randomCell.row, randomCell.col);

  const newGrid = grid.map((r) => [...r]);
  newGrid[randomCell.row][randomCell.col] = newTile;

  return {
    grid: newGrid,
    tiles: [...tiles, newTile],
  };
};

export const buildGridFromTiles = (tiles: Tile[]): Grid => {
  const grid = createEmptyGrid();
  for (const t of tiles) {
    grid[t.row][t.col] = t;
  }
  return grid;
};

export const hasAvailableMoves = (grid: Grid): boolean => {
  // 1. Any empty cell?
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!grid[r][c]) return true;
    }
  }

  // 2. Any adjacent matching cells?
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const val = grid[r][c]!.value;
      if (r < 3 && grid[r + 1][c]!.value === val) return true;
      if (c < 3 && grid[r][c + 1]!.value === val) return true;
    }
  }

  return false;
};

export const moveTiles = (
  tiles: Tile[],
  direction: MoveDirection
): {
  newTiles: Tile[];
  scoreGained: number;
  hasMoved: boolean;
  maxMergedValue: number;
} => {
  const grid = buildGridFromTiles(tiles);
  let scoreGained = 0;
  let hasMoved = false;
  let maxMergedValue = 0;

  const resultTiles: Tile[] = [];

  const traverse = (callback: (r: number, c: number) => void) => {
    const rows = direction === "DOWN" ? [3, 2, 1, 0] : [0, 1, 2, 3];
    const cols = direction === "RIGHT" ? [3, 2, 1, 0] : [0, 1, 2, 3];
    for (const r of rows) {
      for (const c of cols) {
        callback(r, c);
      }
    }
  };

  const getVector = (dir: MoveDirection) => {
    switch (dir) {
      case "UP":
        return { r: -1, c: 0 };
      case "DOWN":
        return { r: 1, c: 0 };
      case "LEFT":
        return { r: 0, c: -1 };
      case "RIGHT":
        return { r: 0, c: 1 };
    }
  };

  const vector = getVector(direction);
  const mergedGrid: boolean[][] = Array(4)
    .fill(false)
    .map(() => Array(4).fill(false));

  traverse((r, c) => {
    const tile = grid[r][c];
    if (!tile) return;

    let currR = r;
    let currC = c;
    let nextR = currR + vector.r;
    let nextC = currC + vector.c;

    // Slide as far as possible
    while (nextR >= 0 && nextR < 4 && nextC >= 0 && nextC < 4 && !grid[nextR][nextC]) {
      currR = nextR;
      currC = nextC;
      nextR = currR + vector.r;
      nextC = currC + vector.c;
    }

    // Check if can merge with neighbor
    if (
      nextR >= 0 &&
      nextR < 4 &&
      nextC >= 0 &&
      nextC < 4 &&
      grid[nextR][nextC] &&
      grid[nextR][nextC]!.value === tile.value &&
      !mergedGrid[nextR][nextC]
    ) {
      // Merge!
      const targetTile = grid[nextR][nextC]!;
      const mergedValue = tile.value * 2;
      scoreGained += mergedValue;
      maxMergedValue = Math.max(maxMergedValue, mergedValue);

      grid[r][c] = null;
      grid[nextR][nextC] = {
        ...targetTile,
        value: mergedValue,
      };
      mergedGrid[nextR][nextC] = true;

      resultTiles.push({
        id: targetTile.id,
        value: mergedValue,
        row: nextR,
        col: nextC,
      });

      hasMoved = true;
    } else {
      // Just slide
      if (currR !== r || currC !== c) {
        grid[r][c] = null;
        grid[currR][currC] = {
          ...tile,
          row: currR,
          col: currC,
        };
        hasMoved = true;
      }
      resultTiles.push({
        ...tile,
        row: currR,
        col: currC,
      });
    }
  });

  return {
    newTiles: resultTiles,
    scoreGained,
    hasMoved,
    maxMergedValue,
  };
};

export const init2048Game = (savedBest = 0): Game2048State => {
  let grid = createEmptyGrid();
  let tiles: Tile[] = [];

  // Spawn 2 initial tiles
  const first = spawnRandomTile(grid, tiles);
  const second = spawnRandomTile(first.grid, first.tiles);

  return {
    grid: second.grid,
    tiles: second.tiles,
    score: 0,
    bestScore: savedBest,
    previousState: null,
    status: "playing",
    hasReached2048: false,
    continuedAfter2048: false,
  };
};
