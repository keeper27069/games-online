export interface LottoCell {
  number: number | null; // null if empty cell in 3x9 grid
  isMarked: boolean;
}

export type LottoCardMatrix = LottoCell[][]; // 3 rows x 9 columns

export interface LottoPlayer {
  id: string;
  name: string;
  avatar: string;
  isAi: boolean;
  cards: LottoCardMatrix[];
  markedCount: number;
}

export interface LottoGameState {
  bag: number[]; // remaining barrels
  drawnBarrels: number[];
  currentBarrel: number | null;
  barrelCallout: string;
  players: LottoPlayer[];
  mode: "auto" | "manual";
  speed: "slow" | "normal" | "fast";
  isPlaying: boolean;
  status: "playing" | "gameover";
  winner: LottoPlayer | null;
  winType: string | null;
  message: string;
}
