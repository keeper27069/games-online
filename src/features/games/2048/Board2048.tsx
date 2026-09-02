"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Game2048State, MoveDirection } from "./types";
import {
  init2048Game,
  moveTiles,
  spawnRandomTile,
  buildGridFromTiles,
  hasAvailableMoves,
} from "./engine";
import { Tile2048Component } from "./Tile2048";
import { GameOverModal } from "@/components/ui/GameOverModal";
import { sound } from "@/lib/sound";
import { recordGameResult, getGameStats } from "@/lib/storage";
import { RotateCcw, Undo2, Trophy, Sparkles, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";

export const Board2048: React.FC = () => {
  const [game, setGame] = useState<Game2048State>(() => {
    const stats = getGameStats("2048");
    return init2048Game(stats.highScore || 0);
  });

  const [isGameOverOpen, setIsGameOverOpen] = useState(false);
  const [isWinModalOpen, setIsWinModalOpen] = useState(false);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  // Perform Move in given direction
  const handleMove = useCallback(
    (direction: MoveDirection) => {
      if (game.status === "gameover") return;

      setGame((prev) => {
        const { newTiles, scoreGained, hasMoved, maxMergedValue } = moveTiles(
          prev.tiles,
          direction
        );

        if (!hasMoved) return prev;

        // Play sounds
        if (maxMergedValue > 0) {
          sound.playMerge2048(maxMergedValue);
        } else {
          sound.playSlide2048();
        }

        const newGrid = buildGridFromTiles(newTiles);
        const { grid: spawnedGrid, tiles: finalTiles } = spawnRandomTile(newGrid, newTiles);

        const newScore = prev.score + scoreGained;
        const newBest = Math.max(prev.bestScore, newScore);

        // Check 2048 tile creation
        const reached2048Now =
          !prev.hasReached2048 && finalTiles.some((t) => t.value === 2048);

        // Check if no moves remain -> Game Over
        const hasMoves = hasAvailableMoves(spawnedGrid);

        if (!hasMoves) {
          setIsGameOverOpen(true);
          recordGameResult("2048", "loss", newScore);
        }

        if (reached2048Now && !prev.continuedAfter2048) {
          setIsWinModalOpen(true);
          recordGameResult("2048", "win", newScore);
        }

        return {
          ...prev,
          grid: spawnedGrid,
          tiles: finalTiles,
          score: newScore,
          bestScore: newBest,
          previousState: { tiles: prev.tiles, score: prev.score },
          status: !hasMoves ? "gameover" : reached2048Now ? "won" : "playing",
          hasReached2048: prev.hasReached2048 || reached2048Now,
        };
      });
    },
    [game.status]
  );

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "KeyW"].includes(e.code)) {
        e.preventDefault();
        handleMove("UP");
      } else if (["ArrowDown", "KeyS"].includes(e.code)) {
        e.preventDefault();
        handleMove("DOWN");
      } else if (["ArrowLeft", "KeyA"].includes(e.code)) {
        e.preventDefault();
        handleMove("LEFT");
      } else if (["ArrowRight", "KeyD"].includes(e.code)) {
        e.preventDefault();
        handleMove("RIGHT");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleMove]);

  // Touch swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;

    const deltaX = e.changedTouches[0].clientX - touchStartPos.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartPos.current.y;
    const minSwipeDistance = 35;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > minSwipeDistance) {
        handleMove(deltaX > 0 ? "RIGHT" : "LEFT");
      }
    } else {
      if (Math.abs(deltaY) > minSwipeDistance) {
        handleMove(deltaY > 0 ? "DOWN" : "UP");
      }
    }

    touchStartPos.current = null;
  };

  // Undo Move
  const handleUndo = () => {
    if (!game.previousState) return;
    sound.playClick(600);
    setGame((prev) => {
      if (!prev.previousState) return prev;
      const restoredGrid = buildGridFromTiles(prev.previousState.tiles);
      return {
        ...prev,
        tiles: prev.previousState.tiles,
        grid: restoredGrid,
        score: prev.previousState.score,
        previousState: null,
      };
    });
  };

  const restartGame = () => {
    setIsGameOverOpen(false);
    setIsWinModalOpen(false);
    setGame(init2048Game(game.bestScore));
  };

  const continuePlaying = () => {
    setIsWinModalOpen(false);
    setGame((prev) => ({ ...prev, continuedAfter2048: true, status: "playing" }));
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-between min-h-[620px] p-4 sm:p-6 rounded-3xl bg-slate-950 border border-amber-500/30 shadow-2xl relative select-none">
      {/* Top Header: Scores & Undo Action */}
      <div className="w-full flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500">
            2048 CYBER
          </h2>
          <p className="text-xs text-slate-400">Объединяйте одинаковые числа!</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Current Score */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-center min-w-[70px]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Счет
            </span>
            <span className="text-sm font-black text-white">{game.score}</span>
          </div>

          {/* Best Score */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-center min-w-[70px]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
              Рекорд
            </span>
            <span className="text-sm font-black text-amber-300">{game.bestScore}</span>
          </div>

          {/* Undo Button */}
          <button
            onClick={handleUndo}
            disabled={!game.previousState}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-40 transition-all"
            title="Отменить ход"
          >
            <Undo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4x4 Playing Grid Board */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full aspect-square max-w-[380px] sm:max-w-[420px] p-3 rounded-3xl bg-slate-900 border-2 border-slate-800 shadow-[0_0_40px_rgba(0,0,0,0.6)] touch-none"
      >
        {/* Background Empty Grid Slots */}
        <div className="w-full h-full grid grid-cols-4 grid-rows-4 gap-2">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className="w-full h-full rounded-2xl bg-slate-950/80 border border-slate-800/60 shadow-inner"
            />
          ))}
        </div>

        {/* Animated Framer Motion Tiles */}
        {game.tiles.map((tile) => (
          <Tile2048Component key={tile.id} tile={tile} />
        ))}
      </div>

      {/* On-screen Direction Arrows (Mobile & Mouse friendly) */}
      <div className="grid grid-cols-3 gap-2 w-48 mt-4">
        <div />
        <button
          onClick={() => handleMove("UP")}
          className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <div />
        <button
          onClick={() => handleMove("LEFT")}
          className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleMove("DOWN")}
          className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleMove("RIGHT")}
          className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* 2048 Victory Modal (with option to Continue playing) */}
      {isWinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl glass-panel-glow border border-amber-400/50 p-6 text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 shadow-[0_0_25px_rgba(251,191,36,0.6)] animate-bounce">
              <Trophy className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-amber-300 mb-1">ЛЕГЕНДАРНЫЙ 2048!</h3>
            <p className="text-xs text-slate-300 mb-6">
              Вы успешно собрали плитку 2048! Хотите продолжить игру до 4096 / 8192?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={continuePlaying}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-xs shadow-[0_0_15px_rgba(251,191,36,0.4)] hover:scale-102 transition-transform"
              >
                Продолжить игру
              </button>
              <button
                onClick={restartGame}
                className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
              >
                Начать новую партию
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={isGameOverOpen}
        isWinner={game.hasReached2048}
        title={game.hasReached2048 ? "Рекорд установлен!" : "Ходов больше нет"}
        subtitle="Сетка заполнена, доступных слияний не осталось."
        score={game.score}
        stats={[
          { label: "Ваш счет", value: game.score },
          { label: "Рекорд", value: game.bestScore },
        ]}
        onRestart={restartGame}
      />
    </div>
  );
};
