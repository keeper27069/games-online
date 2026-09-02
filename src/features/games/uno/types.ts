export type UnoColor = "red" | "blue" | "green" | "yellow" | "wild";

export type UnoValue =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "skip"
  | "reverse"
  | "draw2"
  | "wild"
  | "wild_draw4";

export interface UnoCard {
  id: string;
  color: UnoColor;
  value: UnoValue;
}

export interface UnoPlayer {
  id: string;
  name: string;
  avatar: string;
  isAi: boolean;
  cards: UnoCard[];
  hasCalledUno: boolean;
}

export interface UnoGameState {
  deck: UnoCard[];
  discardPile: UnoCard[];
  players: UnoPlayer[];
  currentTurnIndex: number;
  direction: 1 | -1; // 1 = clockwise, -1 = counter-clockwise
  currentColor: UnoColor;
  isColorPickerOpen: boolean;
  pendingCard: UnoCard | null;
  status: "playing" | "gameover";
  winner: UnoPlayer | null;
  unoPenaltyCountdown: number | null; // Countdown in seconds when player must click UNO
  message: string;
}
