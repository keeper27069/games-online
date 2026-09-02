"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { LottoGameState, LottoCardMatrix, LottoPlayer } from "./types";
import { initLottoGame, LOTTO_CALLOUTS, checkCardWins } from "./engine";
import { LottoBarrel } from "./LottoBarrel";
import { GameOverModal } from "@/components/ui/GameOverModal";
import { sound } from "@/lib/sound";
import { recordGameResult } from "@/lib/storage";
import { Play, Pause, FastForward, Sparkles, Check, CheckCircle2, User, Bot, Gift } from "lucide-react";

export const LottoBoard: React.FC = () => {
  const [game, setGame] = useState<LottoGameState>(() => initLottoGame());
  const [isGameOverOpen, setIsGameOverOpen] = useState(false);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const human = game.players[0];

  // Check victory
  useEffect(() => {
    if (game.status === "gameover" && game.winner) {
      setIsGameOverOpen(true);
      const isWinner = game.winner.id === human.id;
      recordGameResult("lotto", isWinner ? "win" : "loss", isWinner ? 800 : 250);
    }
  }, [game.status, game.winner, human.id]);

  // Pull next barrel from bag
  const pullNextBarrel = useCallback(() => {
    if (game.status !== "playing") return;

    setGame((prev) => {
      if (prev.bag.length === 0) {
        return {
          ...prev,
          isPlaying: false,
          status: "gameover",
          winner: null,
          message: "Все 90 бочонков разыграны! Ничья.",
        };
      }

      const nextBag = [...prev.bag];
      const barrel = nextBag.pop()!;
      sound.playLottoBarrel();

      const callout = LOTTO_CALLOUTS[barrel] || `Бочонок номер ${barrel}!`;

      // Update AI cards & auto-mark if enabled
      const updatedPlayers = prev.players.map((player) => {
        const updatedCards = player.cards.map((card) => {
          // If auto-mode or player is AI, mark cell immediately
          if (prev.mode === "auto" || player.isAi) {
            return card.map((row) =>
              row.map((cell) =>
                cell.number === barrel ? { ...cell, isMarked: true } : cell
              )
            );
          }
          return card;
        });

        // Count marked cells
        let count = 0;
        updatedCards[0].forEach((row) =>
          row.forEach((cell) => {
            if (cell.isMarked) count++;
          })
        );

        return {
          ...player,
          cards: updatedCards,
          markedCount: count,
        };
      });

      let winWinner: LottoPlayer | null = null;
      let winType: string | null = null;

      for (const p of updatedPlayers) {
        const win = checkCardWins(p.cards[0]);
        if (win === "full") {
          winWinner = p;
          winType = "Вся карточка (Квартира)";
          break;
        } else if (win === "row" && prev.winType !== "row" && !winWinner) {
          winWinner = p;
          winType = "Линия!";
        }
      }

      return {
        ...prev,
        bag: nextBag,
        drawnBarrels: [barrel, ...prev.drawnBarrels],
        currentBarrel: barrel,
        barrelCallout: callout,
        players: updatedPlayers,
        status: winWinner ? "gameover" : "playing",
        winner: winWinner,
        winType: winType,
        isPlaying: winWinner ? false : prev.isPlaying,
        message: winWinner ? `${winWinner.name} побеждает: ${winType}!` : callout,
      };
    });
  }, [game.status]);

  // Auto-play timer loop
  useEffect(() => {
    if (game.isPlaying && game.status === "playing") {
      const delay = game.speed === "slow" ? 2800 : game.speed === "normal" ? 1800 : 900;
      autoPlayTimerRef.current = setTimeout(() => {
        pullNextBarrel();
      }, delay);
    } else {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    }

    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    };
  }, [game.isPlaying, game.status, game.speed, game.currentBarrel, pullNextBarrel]);

  // Human clicks a cell on their card (Manual marking)
  const handleCellClick = (r: number, c: number) => {
    if (game.mode === "auto") return;
    const card = human.cards[0];
    const cell = card[r][c];

    if (!cell.number) return;

    // Check if cell number was already drawn
    if (game.drawnBarrels.includes(cell.number)) {
      sound.playClick(800);
      setGame((prev) => {
        const updatedCards = prev.players[0].cards.map((currCard, idx) => {
          if (idx === 0) {
            return currCard.map((row, rowIdx) =>
              row.map((currCell, colIdx) =>
                rowIdx === r && colIdx === c ? { ...currCell, isMarked: true } : currCell
              )
            );
          }
          return currCard;
        });

        // Check if human wins
        const win = checkCardWins(updatedCards[0]);
        let winPlayer: LottoPlayer | null = null;
        let winT: string | null = null;

        if (win === "full") {
          winPlayer = prev.players[0];
          winT = "Вся карточка (Квартира)";
        } else if (win === "row") {
          winPlayer = prev.players[0];
          winT = "Линия!";
        }

        return {
          ...prev,
          players: prev.players.map((p, pIdx) =>
            pIdx === 0
              ? {
                  ...p,
                  cards: updatedCards,
                  markedCount: p.markedCount + (cell.isMarked ? 0 : 1),
                }
              : p
          ),
          status: winPlayer ? "gameover" : "playing",
          winner: winPlayer,
          winType: winT,
          isPlaying: winPlayer ? false : prev.isPlaying,
        };
      });
    } else {
      sound.playError();
    }
  };

  const togglePlay = () => {
    sound.playClick(600);
    setGame((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const restartGame = () => {
    setIsGameOverOpen(false);
    setGame(initLottoGame());
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-between min-h-[660px] p-3 sm:p-6 rounded-3xl bg-felt-purple border border-purple-500/30 shadow-2xl relative select-none">
      {/* Top Header: Barrel Bag & Callout Banner */}
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/70 backdrop-blur-md border border-purple-500/20">
        {/* Left: Current Drawn Barrel */}
        <div className="flex items-center gap-4">
          {game.currentBarrel ? (
            <LottoBarrel number={game.currentBarrel} size="md" isAnimated />
          ) : (
            <div className="w-16 h-20 rounded-2xl bg-slate-900 border-2 border-dashed border-purple-500/40 flex items-center justify-center text-xs text-purple-300 font-bold">
              Мешок
            </div>
          )}
          <div>
            <span className="text-xs uppercase tracking-wider text-purple-300 font-bold block">
              Ведущий объявляет:
            </span>
            <div className="text-base sm:text-lg font-black text-amber-300 drop-shadow flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              {game.barrelCallout}
            </div>
            <span className="text-xs text-slate-400">
              Осталось в мешке: <span className="text-white font-bold">{game.bag.length}</span> из 90
            </span>
          </div>
        </div>

        {/* Right: Game Controls (Pull, Auto-play, Speed, Auto-mark) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={pullNextBarrel}
            disabled={game.isPlaying || game.status !== "playing"}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
          >
            Тянуть бочонок
          </button>

          <button
            onClick={togglePlay}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              game.isPlaying
                ? "bg-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                : "bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]"
            }`}
          >
            {game.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{game.isPlaying ? "Пауза" : "Авто-игра"}</span>
          </button>

          {/* Mode toggle */}
          <button
            onClick={() => {
              sound.playClick(600);
              setGame((prev) => ({
                ...prev,
                mode: prev.mode === "auto" ? "manual" : "auto",
              }));
            }}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white"
            title="Переключить авто-закрытие фишек"
          >
            {game.mode === "auto" ? "Авто-фишки: ВКЛ" : "Ручной поиск"}
          </button>
        </div>
      </div>

      {/* Main Playing Area: Human Ticket & Opponents Progress */}
      <div className="w-full my-6 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left 3 Columns: Authentic Russian Lotto Ticket */}
        <div className="lg:col-span-3 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-2 px-2">
            <span className="text-sm font-bold text-white flex items-center gap-1.5">
              <User className="w-4 h-4 text-purple-400" />
              Ваша карточка
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-950 border border-purple-500/30 text-purple-300 font-bold">
              Закрыто: {human.markedCount} / 15
            </span>
          </div>

          {/* 3x9 Ticket Matrix */}
          <div className="w-full p-4 rounded-3xl bg-[#fdfbf7] border-4 border-[#d4af37] shadow-[0_10px_35px_rgba(0,0,0,0.6)]">
            {/* Vintage Ornamental Header */}
            <div className="flex items-center justify-between border-b-2 border-[#d4af37]/60 pb-2 mb-3">
              <span className="text-xs font-black tracking-widest uppercase text-[#8c4b14]">
                ★ РУССКОЕ ЛОТО ★
              </span>
              <span className="text-[10px] font-bold text-[#8c4b14]/70">Билет № 748-09</span>
            </div>

            <div className="grid grid-rows-3 gap-2 sm:gap-3">
              {human.cards[0].map((row, r) => (
                <div key={r} className="grid grid-cols-9 gap-1.5 sm:gap-2">
                  {row.map((cell, c) => {
                    const isDrawn = cell.number !== null && game.drawnBarrels.includes(cell.number);

                    return (
                      <button
                        key={`${r}_${c}`}
                        type="button"
                        onClick={() => handleCellClick(r, c)}
                        disabled={cell.number === null || cell.isMarked}
                        className={`h-12 sm:h-16 rounded-xl flex items-center justify-center font-black transition-all duration-200 relative ${
                          cell.number === null
                            ? "bg-[#efe8db]/50 border border-dashed border-[#d4af37]/30"
                            : cell.isMarked
                            ? "bg-[#d4a373] text-transparent"
                            : isDrawn
                            ? "bg-amber-100 border-2 border-amber-500 text-[#7f1d1d] animate-pulse cursor-pointer shadow-md hover:scale-105"
                            : "bg-[#fffdfa] border border-[#d4af37]/60 text-[#7f1d1d] text-lg sm:text-2xl shadow-sm hover:border-purple-500"
                        }`}
                      >
                        {/* Cell Number */}
                        {cell.number && !cell.isMarked && (
                          <span className="drop-shadow-sm font-black">{cell.number}</span>
                        )}

                        {/* Wooden Chip (Фишка) covering marked cell */}
                        {cell.isMarked && (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#bc6c25] to-[#78350f] border-2 border-[#582f0e] shadow-[0_4px_10px_rgba(0,0,0,0.6)] flex items-center justify-center text-amber-200 font-black text-xs sm:text-sm animate-scaleIn">
                            <span>{cell.number}</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Opponents Mini Cards */}
        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300">
            Соперники за столом
          </h4>

          {game.players.slice(1).map((bot) => (
            <div
              key={bot.id}
              className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 backdrop-blur-md"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{bot.avatar}</span>
                  <span className="text-xs font-bold text-white">{bot.name}</span>
                </div>
                <span className="text-[11px] font-bold text-amber-400">
                  {bot.markedCount}/15
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
                  style={{ width: `${(bot.markedCount / 15) * 100}%` }}
                />
              </div>
            </div>
          ))}

          {/* Drawn numbers history */}
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <h5 className="text-[11px] font-bold text-slate-400 mb-2">Выпавшие бочонки</h5>
            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto pr-1">
              {game.drawnBarrels.slice(0, 20).map((num, i) => (
                <span
                  key={i}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                    i === 0
                      ? "bg-amber-400 text-slate-950 shadow"
                      : "bg-slate-900 text-slate-300 border border-slate-800"
                  }`}
                >
                  {num}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={isGameOverOpen}
        isWinner={game.winner?.id === human.id}
        title={game.winner?.id === human.id ? "Квартира! Победа!" : "Партия завершена"}
        subtitle={
          game.winner?.id === human.id
            ? `Поздравляем! Вы первым закрыли карточку (${game.winType})!`
            : `${game.winner?.name} первым закрыл победную комбинацию.`
        }
        stats={[
          { label: "Победитель", value: game.winner?.name || "-" },
          { label: "Закрыто у вас", value: `${human.markedCount} / 15` },
          { label: "Бочонков вышло", value: game.drawnBarrels.length },
        ]}
        onRestart={restartGame}
      />
    </div>
  );
};
