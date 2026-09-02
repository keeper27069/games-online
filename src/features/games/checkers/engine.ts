import {
  PieceColor,
  PieceType,
  CheckersPiece,
  BoardMatrix,
  Position,
  CheckersMove,
  CheckersGameState,
} from "./types";

export const createInitialBoard = (): BoardMatrix => {
  const board: BoardMatrix = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  let idCounter = 0;

  // Black pieces on rows 0, 1, 2
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) {
        board[r][c] = {
          id: `b_${idCounter++}`,
          color: "black",
          type: "man",
        };
      }
    }
  }

  // White pieces on rows 5, 6, 7
  for (let r = 5; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) {
        board[r][c] = {
          id: `w_${idCounter++}`,
          color: "white",
          type: "man",
        };
      }
    }
  }

  return board;
};

export const isValidCoord = (r: number, c: number): boolean => r >= 0 && r < 8 && c >= 0 && c < 8;

/** Get all single jump captures available for a piece at (r, c) */
export const getPieceCaptures = (board: BoardMatrix, pos: Position): CheckersMove[] => {
  const piece = board[pos.row][pos.col];
  if (!piece) return [];

  const captures: CheckersMove[] = [];
  const enemyColor: PieceColor = piece.color === "white" ? "black" : "white";
  const directions = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];

  if (piece.type === "man") {
    // Russian Draughts: Man captures in all 4 diagonal directions
    for (const [dr, dc] of directions) {
      const midR = pos.row + dr;
      const midC = pos.col + dc;
      const destR = pos.row + 2 * dr;
      const destC = pos.col + 2 * dc;

      if (isValidCoord(destR, destC)) {
        const midPiece = board[midR][midC];
        const destPiece = board[destR][destC];

        if (midPiece && midPiece.color === enemyColor && destPiece === null) {
          const isPromotion =
            (piece.color === "white" && destR === 0) || (piece.color === "black" && destR === 7);
          captures.push({
            from: pos,
            to: { row: destR, col: destC },
            captured: { row: midR, col: midC },
            isPromotion,
          });
        }
      }
    }
  } else {
    // Flying King capture logic
    for (const [dr, dc] of directions) {
      let r = pos.row + dr;
      let c = pos.col + dc;
      let enemyPos: Position | null = null;

      while (isValidCoord(r, c)) {
        const currentPiece = board[r][c];

        if (currentPiece) {
          if (currentPiece.color === piece.color) {
            break; // Blocked by friendly piece
          }
          if (enemyPos !== null) {
            break; // Second enemy piece in line, cannot jump two
          }
          enemyPos = { row: r, col: c };
        } else if (enemyPos !== null) {
          // Landing square after enemy piece
          captures.push({
            from: pos,
            to: { row: r, col: c },
            captured: enemyPos,
          });
        }
        r += dr;
        c += dc;
      }
    }
  }

  return captures;
};

/** Get normal non-capture moves for a piece at (r, c) */
export const getPieceNormalMoves = (board: BoardMatrix, pos: Position): CheckersMove[] => {
  const piece = board[pos.row][pos.col];
  if (!piece) return [];

  const moves: CheckersMove[] = [];
  const directions = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];

  if (piece.type === "man") {
    // White moves up (dr = -1), Black moves down (dr = +1)
    const forwardDr = piece.color === "white" ? -1 : 1;
    for (const dc of [-1, 1]) {
      const destR = pos.row + forwardDr;
      const destC = pos.col + dc;

      if (isValidCoord(destR, destC) && board[destR][destC] === null) {
        const isPromotion =
          (piece.color === "white" && destR === 0) || (piece.color === "black" && destR === 7);
        moves.push({
          from: pos,
          to: { row: destR, col: destC },
          isPromotion,
        });
      }
    }
  } else {
    // Flying King normal slide
    for (const [dr, dc] of directions) {
      let r = pos.row + dr;
      let c = pos.col + dc;
      while (isValidCoord(r, c) && board[r][c] === null) {
        moves.push({
          from: pos,
          to: { row: r, col: c },
        });
        r += dr;
        c += dc;
      }
    }
  }

  return moves;
};

/** Get all valid moves for a player, enforcing mandatory capture rule */
export const getAllValidMovesForColor = (
  board: BoardMatrix,
  color: PieceColor,
  chainPos: Position | null = null
): CheckersMove[] => {
  // If we are in a multi-jump chain, only the chain piece can capture
  if (chainPos) {
    return getPieceCaptures(board, chainPos);
  }

  const allCaptures: CheckersMove[] = [];
  const allNormals: CheckersMove[] = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color) {
        const caps = getPieceCaptures(board, { row: r, col: c });
        if (caps.length > 0) {
          allCaptures.push(...caps);
        } else {
          allNormals.push(...getPieceNormalMoves(board, { row: r, col: c }));
        }
      }
    }
  }

  // Mandatory capture: if any capture exists, ONLY captures are allowed
  return allCaptures.length > 0 ? allCaptures : allNormals;
};

/** Apply a move on the board and return the updated board */
export const applyMoveOnBoard = (
  board: BoardMatrix,
  move: CheckersMove
): { newBoard: BoardMatrix; capturedPiece: CheckersPiece | null } => {
  const newBoard: BoardMatrix = board.map((row) => [...row]);
  const piece = newBoard[move.from.row][move.from.col]!;

  newBoard[move.from.row][move.from.col] = null;

  let capturedPiece: CheckersPiece | null = null;
  if (move.captured) {
    capturedPiece = newBoard[move.captured.row][move.captured.col];
    newBoard[move.captured.row][move.captured.col] = null;
  }

  let finalType: PieceType = piece.type;
  if (move.isPromotion || (piece.color === "white" && move.to.row === 0) || (piece.color === "black" && move.to.row === 7)) {
    finalType = "king";
  }

  newBoard[move.to.row][move.to.col] = {
    ...piece,
    type: finalType,
  };

  return { newBoard, capturedPiece };
};

export const initCheckersGame = (): CheckersGameState => {
  const board = createInitialBoard();
  const allMandatory = getAllValidMovesForColor(board, "white");

  return {
    board,
    currentTurn: "white",
    selectedPos: null,
    validMovesForSelected: [],
    allMandatoryCaptures: allMandatory.filter((m) => !!m.captured),
    chainPosition: null,
    whiteCaptured: 0,
    blackCaptured: 0,
    status: "playing",
    winner: null,
    difficulty: "medium",
    message: "Ваш ход (Белые). Выберите шашку для хода.",
  };
};

// --- Minimax AI Evaluation ---

const evaluateBoard = (board: BoardMatrix): number => {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      let pieceVal = piece.type === "king" ? 350 : 100;
      // Positional bonus: advance towards king row + control center
      if (piece.type === "man") {
        pieceVal += piece.color === "black" ? r * 5 : (7 - r) * 5;
        if ((r === 3 || r === 4) && (c === 3 || c === 4)) {
          pieceVal += 15;
        }
      }

      score += piece.color === "black" ? pieceVal : -pieceVal;
    }
  }
  return score;
};

export const findBestAiMove = (
  board: BoardMatrix,
  depth = 3,
  chainPos: Position | null = null
): CheckersMove | null => {
  const moves = getAllValidMovesForColor(board, "black", chainPos);
  if (moves.length === 0) return null;

  let bestMove: CheckersMove = moves[0];
  let bestScore = -Infinity;

  for (const move of moves) {
    const { newBoard } = applyMoveOnBoard(board, move);
    let nextScore = 0;

    if (move.captured) {
      // Check multi-jump continuation
      const furtherJumps = getPieceCaptures(newBoard, move.to);
      if (furtherJumps.length > 0) {
        nextScore = minimax(newBoard, depth - 1, -Infinity, Infinity, true, move.to);
      } else {
        nextScore = minimax(newBoard, depth - 1, -Infinity, Infinity, false, null);
      }
    } else {
      nextScore = minimax(newBoard, depth - 1, -Infinity, Infinity, false, null);
    }

    if (nextScore > bestScore) {
      bestScore = nextScore;
      bestMove = move;
    }
  }

  return bestMove;
};

const minimax = (
  board: BoardMatrix,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  chainPos: Position | null
): number => {
  if (depth === 0) return evaluateBoard(board);

  const turnColor: PieceColor = isMaximizing ? "black" : "white";
  const moves = getAllValidMovesForColor(board, turnColor, chainPos);

  if (moves.length === 0) {
    return isMaximizing ? -10000 : 10000;
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const { newBoard } = applyMoveOnBoard(board, move);
      const subJumps = move.captured ? getPieceCaptures(newBoard, move.to) : [];
      const score =
        subJumps.length > 0
          ? minimax(newBoard, depth - 1, alpha, beta, true, move.to)
          : minimax(newBoard, depth - 1, alpha, beta, false, null);

      maxEval = Math.max(maxEval, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const { newBoard } = applyMoveOnBoard(board, move);
      const subJumps = move.captured ? getPieceCaptures(newBoard, move.to) : [];
      const score =
        subJumps.length > 0
          ? minimax(newBoard, depth - 1, alpha, beta, false, move.to)
          : minimax(newBoard, depth - 1, alpha, beta, true, null);

      minEval = Math.min(minEval, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return minEval;
  }
};
