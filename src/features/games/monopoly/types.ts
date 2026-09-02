export type TileType =
  | "go"
  | "property"
  | "railroad"
  | "utility"
  | "chance"
  | "chest"
  | "tax"
  | "jail"
  | "gotojail"
  | "parking";

export type PropertyGroup = "brown" | "cyan" | "pink" | "orange" | "red" | "yellow" | "green" | "blue" | "special";

export interface MonopolyTile {
  id: number;
  name: string;
  type: TileType;
  group?: PropertyGroup;
  price?: number;
  baseRent?: number;
  houseCost?: number;
  ownerId?: string | null;
  houses?: number; // 0-3 houses, 4 = hotel
}

export interface MonopolyPlayer {
  id: string;
  name: string;
  avatar: string;
  isAi: boolean;
  money: number;
  position: number;
  inJail: boolean;
  jailTurns: number;
  isBankrupt: boolean;
  color: string;
}

export interface MonopolyGameState {
  tiles: MonopolyTile[];
  players: MonopolyPlayer[];
  currentTurnIndex: number;
  dice: [number, number];
  isRolling: boolean;
  canRoll: boolean;
  canEndTurn: boolean;
  status: "playing" | "gameover";
  winner: MonopolyPlayer | null;
  logs: string[];
  message: string;
}
