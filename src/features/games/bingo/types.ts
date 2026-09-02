export interface BingoCell {
  number: number;
  isFree?: boolean;
  isMarked: boolean;
}

export type BingoCardMatrix = BingoCell[][]; // 5x5 grid

export type BingoPattern = "row" | "col" | "diagonal" | "corners" | "blackout";

export interface BingoPlayer {
  id: string;
  name: string;
  avatar: string;
  isAi: boolean;
  cards: BingoCardMatrix[];
}

export interface BingoBall {
  letter: "B" | "I" | "N" | "G" | "O";
  number: number;
}

export interface BingoGameState {
  drawnBalls: BingoBall[];
  currentBall: BingoBall | null;
  remainingNumbers: number[];
  players: BingoPlayer[];
  activeCardCount: 1 | 2;
  isPlaying: boolean;
  status: "playing" | "gameover";
  winner: BingoPlayer | null;
  winningPattern: string | null;
  message: string;
}
