"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  CheckersGameState,
  Position,
  CheckersMove,
  PieceColor,
} from "./types";
import {
  initCheckersGame,
  getAllValidMovesForColor,
  getPieceCaptures,
  applyMoveOnBoard,
  findBestAiMove,
} from "./engine";
import { GameOverModal } from "@/components/ui/GameOverModal";
import { sound } from "@/lib/sound";
import { recordGameResult } from "@/lib/storage";
import { Crown, Sparkles, User, Bot, Shield, Zap } from "lucide-react";

export const CheckersBoard: React.FC = () => {
  const [game, setGame] = useState<CheckersGameState>(() => initCheckersGame());
  const [isGameOverOpen, setIsGameOverOpen] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const aiTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isHumanTurn = game.currentTurn === "white" && game.status === "playing";

  // Check game over
  useEffect(() => {
    if (game.status === "gameover" && game.winner) {
      setIsGameOverOpen(true);
      const isWinner = game.winner === "white";
      recordGameResult("checkers", isWinner ? "win" : "loss", isWinner ? 700 : 200);
    }
  }, [game.status, game.winner]);

  // Execute a move
  const executeMove = useCallback(
    (move: CheckersMove, currentTurn: PieceColor) => {
      if (move.captured) {
        sound.playCheckersCapture();
      } else {
        sound.playCheckersMove();
      }

      setGame((prev) => {
        const { newBoard, capturedPiece } = applyMoveOnBoard(prev.board, move);

        const whiteCap = prev.whiteCaptured + (capturedPiece?.color === "white" ? 1 : 0);
        const blackCap = prev.blackCaptured + (capturedPiece?.color === "black" ? 1 : 0);

        // Check if current piece can continue multi-jump capture
        if (move.captured) {
          const furtherCaptures = getPieceCaptures(newBoard, move.to);
          if (furtherCaptures.length > 0) {
            // Multi-jump continues! Lock to the same piece
            return {
              ...prev,
              board: newBoard,
              selectedPos: move.to,
              validMovesForSelected: furtherCaptures,
              chainPosition: move.to,
              whiteCaptured: whiteCap,
              blackCaptured: blackCap,
              message: currentTurn === "white" ? "Продолжайте взятие!" : "Бот продолжает серию взятий...",
            };
          }
        }

        // Turn ends, pass to next player
        const nextTurn: PieceColor = currentTurn === "white" ? "black" : "white";
        const nextMoves = getAllValidMovesForColor(newBoard, nextTurn, null);

        // Check win condition (no valid moves left for next player)
        if (nextMoves.length === 0) {
          return {
            ...prev,
            board: newBoard,
            currentTurn: nextTurn,
            selectedPos: null,
            validMovesForSelected: [],
            chainPosition: null,
            whiteCaptured: whiteCap,
            blackCaptured: blackCap,
            status: "gameover",
            winner: currentTurn,
            message: currentTurn === "white" ? "Поздравляем! Вы победили!" : "Бот победил!",
          };
        }

        const nextMandatory = nextMoves.filter((m) => !!m.captured);

        return {
          ...prev,
          board: newBoard,
          currentTurn: nextTurn,
          selectedPos: null,
          validMovesForSelected: [],
          allMandatoryCaptures: nextMandatory,
          chainPosition: null,
          whiteCaptured: whiteCap,
          blackCaptured: blackCap,
          message:
            nextTurn === "white"
              ? nextMandatory.length > 0
                ? "Обязательное взятие! Выберите шашку для удара."
                : "Ваш ход (Белые)."
              : "Ход бота (Черные)...",
        };
      });
    },
    []
  );

  // Human selects square / piece
  const handleSquareClick = (r: number, c: number) => {
    if (!isHumanTurn) return;

    // If clicking on a valid destination for selected piece
    if (game.selectedPos) {
      const targetMove = game.validMovesForSelected.find(
        (m) => m.to.row === r && m.to.col === c
      );

      if (targetMove) {
        executeMove(targetMove, "white");
        return;
      }
    }

    // If in chain, human CANNOT select other pieces
    if (game.chainPosition) {
      sound.playError();
      return;
    }

    const clickedPiece = game.board[r][c];
    if (clickedPiece && clickedPiece.color === "white") {
      const allPlayerMoves = getAllValidMovesForColor(game.board, "white", null);
      const pieceMoves = allPlayerMoves.filter(
        (m) => m.from.row === r && m.from.col === c
      );

      if (pieceMoves.length > 0) {
        sound.playClick(700);
        setGame((prev) => ({
          ...prev,
          selectedPos: { row: r, col: c },
          validMovesForSelected: pieceMoves,
        }));
      } else {
        sound.playError();
      }
    } else {
      // Deselect
      setGame((prev) => ({
        ...prev,
        selectedPos: null,
        validMovesForSelected: [],
      }));
    }
  };

  // AI Turn Loop
  useEffect(() => {
    if (game.status !== "playing") return;

    if (game.currentTurn === "black") {
      setIsAiThinking(true);
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);

      const depth = game.difficulty === "easy" ? 1 : game.difficulty === "medium" ? 3 : 4;

      aiTimerRef.current = setTimeout(() => {
        setIsAiThinking(false);
        const aiMove = findBestAiMove(game.board, depth, game.chainPosition);

        if (aiMove) {
          executeMove(aiMove, "black");
        }
      }, 700);
    }

    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, [game.currentTurn, game.status, game.board, game.chainPosition, game.difficulty, executeMove]);

  const restartGame = () => {
    setIsGameOverOpen(false);
    setGame(initCheckersGame());
  };

  const columns = ["A", "B", "C", "D", "E", "F", "G", "H"];

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-between min-h-[640px] p-3 sm:p-6 rounded-3xl bg-felt-wood border border-amber-600/30 shadow-2xl relative select-none">
      {/* Top Header: Opponent & Difficulty */}
      <div className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950/70 backdrop-blur-md border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🤖</div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Бот Шашист</span>
              {isAiThinking && (
                <span className="text-xs text-amber-400 font-semibold animate-pulse">
                  (просчитывает комбинацию...)
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400">
              Сбито ваших шашек: <span className="text-white font-bold">{game.whiteCaptured}</span>
            </div>
          </div>
        </div>

        {/* Difficulty buttons */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          {(["easy", "medium", "hard"] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                sound.playClick(600);
                setGame((prev) => ({ ...prev, difficulty: lvl }));
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                game.difficulty === lvl
                  ? "bg-amber-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {lvl === "easy" ? "Легко" : lvl === "medium" ? "Нормально" : "Хардкор"}
            </button>
          ))}
        </div>
      </div>

      {/* Checkers 8x8 Board */}
      <div className="my-4 p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-950 to-stone-900 border-4 border-amber-800 shadow-[0_0_40px_rgba(0,0,0,0.8)]">
        {/* Top Letters */}
        <div className="grid grid-cols-8 gap-1 mb-1 text-center text-[10px] font-bold text-amber-300/70 px-4">
          {columns.map((c) => (
            <div key={c}>{c}</div>
          ))}
        </div>

        <div className="flex items-center">
          {/* Left Numbers */}
          <div className="flex flex-col justify-around h-[320px] sm:h-[440px] pr-1.5 text-[10px] font-bold text-amber-300/70">
            {[8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
              <div key={n}>{n}</div>
            ))}
          </div>

          {/* 8x8 Grid */}
          <div className="grid grid-cols-8 grid-rows-8 w-[320px] h-[320px] sm:w-[440px] sm:h-[440px] border-2 border-amber-900 rounded-lg overflow-hidden shadow-inner">
            {game.board.map((row, r) =>
              row.map((piece, c) => {
                const isDarkSquare = (r + c) % 2 === 1;
                const isSelected = game.selectedPos?.row === r && game.selectedPos?.col === c;
                const isValidTarget = game.validMovesForSelected.some(
                  (m) => m.to.row === r && m.to.col === c
                );
                const hasMandatoryCapture = game.allMandatoryCaptures.some(
                  (m) => m.from.row === r && m.from.col === c
                );

                return (
                  <button
                    key={`${r}_${c}`}
                    type="button"
                    onClick={() => handleSquareClick(r, c)}
                    className={`relative w-full h-full flex items-center justify-center transition-all ${
                      isDarkSquare ? "bg-[#3e2723]" : "bg-[#d7ccc8]"
                    } ${isSelected ? "ring-4 ring-amber-400 z-10" : ""}`}
                  >
                    {/* Mandatory capture pulsing indicator on dark square */}
                    {hasMandatoryCapture && !isSelected && (
                      <span className="absolute inset-0 bg-red-600/30 animate-pulse" />
                    )}

                    {/* Valid Target Dot / Ring */}
                    {isValidTarget && (
                      <div className="absolute w-5 h-5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)] animate-pulse z-20" />
                    )}

                    {/* Checkers Piece */}
                    {piece && (
                      <div
                        className={`relative w-[80%] h-[80%] rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 ${
                          piece.color === "white"
                            ? "bg-gradient-to-b from-stone-100 via-stone-200 to-stone-400 border-2 border-stone-300 text-stone-900 shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
                            : "bg-gradient-to-b from-stone-800 via-stone-900 to-black border-2 border-stone-600 text-amber-400 shadow-[0_4px_10px_rgba(0,0,0,0.7)]"
                        } ${isSelected ? "scale-110 shadow-2xl" : "hover:scale-105"}`}
                      >
                        {/* Concentric rings on checker */}
                        <div
                          className={`w-[65%] h-[65%] rounded-full border flex items-center justify-center ${
                            piece.color === "white" ? "border-stone-400" : "border-stone-700"
                          }`}
                        >
                          {piece.type === "king" && (
                            <Crown
                              className={`w-5 h-5 sm:w-6 sm:h-6 drop-shadow ${
                                piece.color === "white" ? "text-amber-600 fill-amber-500" : "text-amber-400 fill-amber-400"
                              }`}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Message and Stats Bottom Bar */}
      <div className="w-full max-w-xl mx-auto mb-2 flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{game.message}</span>
        </div>

        <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1 text-cyan-300">
            <User className="w-3.5 h-3.5" />
            Сбито врагов: {game.blackCaptured}
          </span>
        </div>
      </div>

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={isGameOverOpen}
        isWinner={game.winner === "white"}
        title={game.winner === "white" ? "Шах и мат! Победа!" : "Партия завершена"}
        subtitle={
          game.winner === "white"
            ? "Вы разгромили шашки соперника и выиграли партию!"
            : "Бот одержал верх в этой партии. Реванш?"
        }
        stats={[
          { label: "Сбито шашек бота", value: game.blackCaptured },
          { label: "Потеряно ваших", value: game.whiteCaptured },
          { label: "Сложность", value: game.difficulty },
        ]}
        onRestart={restartGame}
      />
    </div>
  );
};
