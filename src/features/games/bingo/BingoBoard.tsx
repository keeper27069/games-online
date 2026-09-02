"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { BingoGameState, BingoBall, BingoPlayer } from "./types";
import { initBingoGame, getLetterForNumber, checkBingoPatterns } from "./engine";
import { GameOverModal } from "@/components/ui/GameOverModal";
import { sound } from "@/lib/sound";
import { recordGameResult } from "@/lib/storage";
import { Play, Pause, Sparkles, User, Bot, Award, Star } from "lucide-react";

export const BingoBoard: React.FC = () => {
  const [game, setGame] = useState<BingoGameState>(() => initBingoGame());
  const [isGameOverOpen, setIsGameOverOpen] = useState(false);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const human = game.players[0];

  // Check game over
  useEffect(() => {
    if (game.status === "gameover" && game.winner) {
      setIsGameOverOpen(true);
      const isWinner = game.winner.id === human.id;
      recordGameResult("bingo", isWinner ? "win" : "loss", isWinner ? 750 : 200);
    }
  }, [game.status, game.winner, human.id]);

  // Pull next ball
  const pullNextBall = useCallback(() => {
    if (game.status !== "playing") return;

    setGame((prev) => {
      if (prev.remainingNumbers.length === 0) {
        return {
          ...prev,
          isPlaying: false,
          status: "gameover",
          winner: null,
          message: "Все 75 шаров разыграны!",
        };
      }

      const nextPool = [...prev.remainingNumbers];
      const num = nextPool.pop()!;
      const letter = getLetterForNumber(num);
      const ball: BingoBall = { letter, number: num };

      sound.playLottoBarrel();

      // Auto mark AI cards
      const updatedPlayers = prev.players.map((player) => {
        const updatedCards = player.cards.map((card) => {
          if (player.isAi) {
            return card.map((row) =>
              row.map((cell) =>
                cell.number === num ? { ...cell, isMarked: true } : cell
              )
            );
          }
          return card;
        });

        return { ...player, cards: updatedCards };
      });

      let detectedWinner: BingoPlayer | null = null;
      let patternName: string | null = null;

      for (const player of updatedPlayers) {
        if (player.isAi) {
          for (const card of player.cards) {
            const res = checkBingoPatterns(card);
            if (res.hasWon) {
              detectedWinner = player;
              patternName = res.patternName;
              break;
            }
          }
          if (detectedWinner) break;
        }
      }

      return {
        ...prev,
        remainingNumbers: nextPool,
        drawnBalls: [ball, ...prev.drawnBalls],
        currentBall: ball,
        players: updatedPlayers,
        status: detectedWinner ? "gameover" : "playing",
        winner: detectedWinner,
        winningPattern: patternName,
        isPlaying: detectedWinner ? false : prev.isPlaying,
        message: detectedWinner
          ? `🎉 ${detectedWinner.name} кричит БИНГО! (${patternName})`
          : `Выпал шар: ${letter}-${num}!`,
      };
    });
  }, [game.status]);

  // Auto-play loop
  useEffect(() => {
    if (game.isPlaying && game.status === "playing") {
      autoPlayTimerRef.current = setTimeout(() => {
        pullNextBall();
      }, 1600);
    } else {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    }

    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    };
  }, [game.isPlaying, game.status, game.currentBall, pullNextBall]);

  // Human clicks cell to stamp
  const handleCellClick = (cardIdx: number, r: number, c: number) => {
    const card = human.cards[cardIdx];
    const cell = card[r][c];

    if (cell.isFree || cell.isMarked) return;

    // Verify number was drawn
    const wasDrawn = game.drawnBalls.some((b) => b.number === cell.number);

    if (wasDrawn) {
      sound.playClick(850);
      setGame((prev) => {
        const updatedPlayers = prev.players.map((p, pIdx) => {
          if (pIdx !== 0) return p;
          const updatedCards = p.cards.map((currCard, cIdx) => {
            if (cIdx !== cardIdx) return currCard;
            return currCard.map((row, rowIdx) =>
              row.map((currCell, colIdx) =>
                rowIdx === r && colIdx === c ? { ...currCell, isMarked: true } : currCell
              )
            );
          });
          return { ...p, cards: updatedCards };
        });

        // Check if this move completes BINGO for human
        const updatedCard = updatedPlayers[0].cards[cardIdx];
        const res = checkBingoPatterns(updatedCard);

        return {
          ...prev,
          players: updatedPlayers,
          status: res.hasWon ? "gameover" : "playing",
          winner: res.hasWon ? updatedPlayers[0] : null,
          winningPattern: res.patternName,
          isPlaying: res.hasWon ? false : prev.isPlaying,
          message: res.hasWon
            ? `🎉 BINGO! Вы собрали узор: ${res.patternName}!`
            : `Отмечено число: ${cell.number}`,
        };
      });
    } else {
      sound.playError();
    }
  };

  const shoutBingo = () => {
    for (let i = 0; i < human.cards.length; i++) {
      const res = checkBingoPatterns(human.cards[i]);
      if (res.hasWon) {
        setGame((prev) => ({
          ...prev,
          status: "gameover",
          winner: human,
          winningPattern: res.patternName,
          isPlaying: false,
        }));
        return;
      }
    }
    sound.playError();
  };

  const restartGame = () => {
    setIsGameOverOpen(false);
    setGame(initBingoGame());
  };

  const BINGO_HEADERS = [
    { letter: "B", color: "text-red-400 border-red-500/40 bg-red-950/40" },
    { letter: "I", color: "text-amber-400 border-amber-500/40 bg-amber-950/40" },
    { letter: "N", color: "text-emerald-400 border-emerald-500/40 bg-emerald-950/40" },
    { letter: "G", color: "text-cyan-400 border-cyan-500/40 bg-cyan-950/40" },
    { letter: "O", color: "text-purple-400 border-purple-500/40 bg-purple-950/40" },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-between min-h-[660px] p-3 sm:p-6 rounded-3xl bg-slate-950 border border-cyan-500/30 shadow-2xl relative select-none">
      {/* Top Header: Ball Tube & Draw Controls */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        {/* Active Ball Callout */}
        <div className="flex items-center gap-4">
          {game.currentBall ? (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 border-2 border-white/60 flex flex-col items-center justify-center shadow-[0_0_25px_rgba(0,210,255,0.6)] animate-bounce">
              <span className="text-[10px] font-black text-amber-300">
                {game.currentBall.letter}
              </span>
              <span className="text-xl font-black text-white leading-none">
                {game.currentBall.number}
              </span>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-slate-950 border-2 border-dashed border-cyan-500/40 flex items-center justify-center text-xs text-cyan-400 font-bold">
              Лототрон
            </div>
          )}

          <div>
            <span className="text-xs uppercase tracking-wider text-cyan-300 font-bold block">
              Выпавший шар:
            </span>
            <div className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              {game.currentBall
                ? `${game.currentBall.letter}-${game.currentBall.number}`
                : "Готов к старту"}
            </div>
            <span className="text-xs text-slate-400">
              Осталось шаров: <span className="text-white font-bold">{game.remainingNumbers.length}</span> / 75
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={pullNextBall}
            disabled={game.isPlaying || game.status !== "playing"}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black text-xs shadow-[0_0_15px_rgba(0,210,255,0.4)] hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
          >
            Вытянуть шар
          </button>

          <button
            onClick={() => {
              sound.playClick(600);
              setGame((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              game.isPlaying
                ? "bg-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]"
            }`}
          >
            {game.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{game.isPlaying ? "Пауза" : "Авто-выдача"}</span>
          </button>

          {/* Shout Bingo button */}
          <button
            onClick={shoutBingo}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(251,191,36,0.6)] animate-pulse hover:scale-105 active:scale-95 transition-all"
          >
            BINGO!
          </button>
        </div>
      </div>

      {/* Main Playing Grid: Human Cards */}
      <div className="w-full my-6 flex flex-col md:flex-row items-center justify-center gap-6">
        {human.cards.slice(0, game.activeCardCount).map((card, cardIdx) => (
          <div
            key={cardIdx}
            className="p-4 rounded-3xl bg-slate-900/90 border-2 border-cyan-500/30 shadow-[0_0_30px_rgba(0,0,0,0.6)] w-full max-w-sm"
          >
            {/* Card Header B-I-N-G-O */}
            <div className="grid grid-cols-5 gap-2 mb-2 text-center">
              {BINGO_HEADERS.map((h) => (
                <div
                  key={h.letter}
                  className={`py-1.5 rounded-xl border text-sm font-black ${h.color} shadow-sm`}
                >
                  {h.letter}
                </div>
              ))}
            </div>

            {/* 5x5 Matrix */}
            <div className="grid grid-cols-5 gap-2">
              {card.map((row, r) =>
                row.map((cell, c) => {
                  const wasDrawn = cell.number !== 0 && game.drawnBalls.some((b) => b.number === cell.number);

                  return (
                    <button
                      key={`${r}_${c}`}
                      type="button"
                      onClick={() => handleCellClick(cardIdx, r, c)}
                      disabled={cell.isMarked || cell.isFree}
                      className={`h-12 rounded-xl flex items-center justify-center font-black transition-all relative select-none ${
                        cell.isFree
                          ? "bg-amber-400 text-slate-950 border border-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                          : cell.isMarked
                          ? "bg-cyan-500 text-slate-950 border border-cyan-300 shadow-[0_0_12px_rgba(0,210,255,0.6)]"
                          : wasDrawn
                          ? "bg-cyan-950/80 border-2 border-cyan-400 text-cyan-200 animate-pulse hover:scale-105 cursor-pointer"
                          : "bg-slate-950 border border-slate-800 text-slate-200 hover:border-slate-700"
                      }`}
                    >
                      {cell.isFree ? (
                        <Star className="w-5 h-5 fill-slate-950" />
                      ) : cell.isMarked ? (
                        <div className="w-8 h-8 rounded-full bg-slate-950/30 flex items-center justify-center text-xs">
                          {cell.number}
                        </div>
                      ) : (
                        <span className="text-sm font-bold">{cell.number}</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Message and Ball History Bar */}
      <div className="w-full max-w-2xl mx-auto mb-2 flex flex-col items-center gap-2">
        <div className="w-full text-center py-2 px-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-semibold text-cyan-300 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{game.message}</span>
        </div>

        {/* Drawn ball pills */}
        <div className="flex items-center gap-1 max-w-full overflow-x-auto py-1">
          {game.drawnBalls.slice(0, 12).map((b, idx) => (
            <span
              key={idx}
              className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                idx === 0
                  ? "bg-cyan-400 text-slate-950 shadow"
                  : "bg-slate-900 text-slate-300 border border-slate-800"
              }`}
            >
              {b.letter}-{b.number}
            </span>
          ))}
        </div>
      </div>

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={isGameOverOpen}
        isWinner={game.winner?.id === human.id}
        title={game.winner?.id === human.id ? "BINGO! Победа!" : "Игра окончена"}
        subtitle={
          game.winner?.id === human.id
            ? `Поздравляем! Вы победили с узором «${game.winningPattern}»!`
            : `${game.winner?.name} первым собрал победную линию!`
        }
        stats={[
          { label: "Победитель", value: game.winner?.name || "-" },
          { label: "Узор победы", value: game.winningPattern || "-" },
          { label: "Шаров вышло", value: game.drawnBalls.length },
        ]}
        onRestart={restartGame}
      />
    </div>
  );
};
