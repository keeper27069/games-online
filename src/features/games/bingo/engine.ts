import { BingoCardMatrix, BingoBall, BingoPlayer, BingoGameState, BingoPattern } from "./types";

export const getLetterForNumber = (num: number): "B" | "I" | "N" | "G" | "O" => {
  if (num <= 15) return "B";
  if (num <= 30) return "I";
  if (num <= 45) return "N";
  if (num <= 60) return "G";
  return "O";
};

export const generateBingoCard = (): BingoCardMatrix => {
  const ranges = [
    { min: 1, max: 15 },   // B
    { min: 16, max: 30 },  // I
    { min: 31, max: 45 },  // N
    { min: 46, max: 60 },  // G
    { min: 61, max: 75 },  // O
  ];

  const columns: number[][] = [];
  for (let c = 0; c < 5; c++) {
    const range = ranges[c];
    const pool: number[] = [];
    for (let i = range.min; i <= range.max; i++) pool.push(i);

    // Shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    columns.push(pool.slice(0, 5));
  }

  const matrix: BingoCardMatrix = [];
  for (let r = 0; r < 5; r++) {
    const row = [];
    for (let c = 0; c < 5; c++) {
      if (r === 2 && c === 2) {
        // Free center square
        row.push({ number: 0, isFree: true, isMarked: true });
      } else {
        row.push({ number: columns[c][r], isMarked: false });
      }
    }
    matrix.push(row);
  }

  return matrix;
};

export const createBingoCage = (): number[] => {
  const numbers: number[] = [];
  for (let i = 1; i <= 75; i++) numbers.push(i);
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  return numbers;
};

export const checkBingoPatterns = (card: BingoCardMatrix): { hasWon: boolean; patternName: string | null } => {
  // 1. Check Rows
  for (let r = 0; r < 5; r++) {
    if (card[r].every((cell) => cell.isMarked)) {
      return { hasWon: true, patternName: `Горизонталь (Ряд ${r + 1})` };
    }
  }

  // 2. Check Columns
  for (let c = 0; c < 5; c++) {
    let colMarked = true;
    for (let r = 0; r < 5; r++) {
      if (!card[r][c].isMarked) {
        colMarked = false;
        break;
      }
    }
    if (colMarked) {
      const colLetter = ["B", "I", "N", "G", "O"][c];
      return { hasWon: true, patternName: `Вертикаль (Колонка ${colLetter})` };
    }
  }

  // 3. Check Main Diagonal
  let diag1 = true;
  for (let i = 0; i < 5; i++) {
    if (!card[i][i].isMarked) diag1 = false;
  }
  if (diag1) return { hasWon: true, patternName: "Главная Диагональ" };

  // 4. Check Anti-Diagonal
  let diag2 = true;
  for (let i = 0; i < 5; i++) {
    if (!card[i][4 - i].isMarked) diag2 = false;
  }
  if (diag2) return { hasWon: true, patternName: "Обратная Диагональ" };

  // 5. Check 4 Corners
  if (
    card[0][0].isMarked &&
    card[0][4].isMarked &&
    card[4][0].isMarked &&
    card[4][4].isMarked
  ) {
    return { hasWon: true, patternName: "4 Угла" };
  }

  return { hasWon: false, patternName: null };
};

export const initBingoGame = (humanName = "Вы"): BingoGameState => {
  const p0: BingoPlayer = {
    id: "p0",
    name: humanName,
    avatar: "🎮",
    isAi: false,
    cards: [generateBingoCard(), generateBingoCard()],
  };

  const p1: BingoPlayer = {
    id: "p1",
    name: "Бот Счастливчик",
    avatar: "🤖",
    isAi: true,
    cards: [generateBingoCard()],
  };

  const p2: BingoPlayer = {
    id: "p2",
    name: "Бинго Мастер",
    avatar: "👾",
    isAi: true,
    cards: [generateBingoCard()],
  };

  return {
    drawnBalls: [],
    currentBall: null,
    remainingNumbers: createBingoCage(),
    players: [p0, p1, p2],
    activeCardCount: 2,
    isPlaying: false,
    status: "playing",
    winner: null,
    winningPattern: null,
    message: "Нажмите «Вытянуть шар» или включите «Авто-игру»!",
  };
};
