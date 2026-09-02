export type PieceColor = "white" | "black";
export type PieceType = "man" | "king";

export interface CheckersPiece {
  id: string;
  color: PieceColor;
  type: PieceType;
}

export type BoardMatrix = (CheckersPiece | null)[][];

export interface Position {
  row: number;
  col: number;
}

export interface CheckersMove {
  from: Position;
  to: Position;
  captured?: Position;
  isPromotion?: boolean;
}

export interface CheckersGameState {
  board: BoardMatrix;
  currentTurn: PieceColor;
  selectedPos: Position | null;
  validMovesForSelected: CheckersMove[];
  allMandatoryCaptures: CheckersMove[];
  chainPosition: Position | null; // If multi-jump is currently ongoing
  whiteCaptured: number;
  blackCaptured: number;
  status: "playing" | "gameover";
  winner: PieceColor | null;
  difficulty: "easy" | "medium" | "hard";
  message: string;
}
