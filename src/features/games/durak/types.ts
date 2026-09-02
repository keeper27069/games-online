export type CardSuit = "hearts" | "diamonds" | "clubs" | "spades";

export type CardRank = "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";

export interface DurakCard {
  id: string;
  suit: CardSuit;
  rank: CardRank;
  value: number; // 6=6 ... A=14
}

export interface TablePair {
  attack: DurakCard;
  defense?: DurakCard;
}

export interface DurakPlayer {
  id: string;
  name: string;
  avatar: string;
  isAi: boolean;
  cards: DurakCard[];
}

export interface DurakGameState {
  deck: DurakCard[];
  trumpCard: DurakCard;
  trumpSuit: CardSuit;
  discardPile: DurakCard[];
  table: TablePair[];
  players: DurakPlayer[];
  attackerIndex: number;
  defenderIndex: number;
  turnPhase: "attack" | "defend" | "toss";
  status: "playing" | "gameover";
  winner: DurakPlayer | null;
  durak: DurakPlayer | null;
  message: string;
}
