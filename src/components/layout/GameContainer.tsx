"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, BookOpen, Maximize2, Minimize2, Timer, Trophy, Users, Bot } from "lucide-react";
import { GameInfo } from "@/types/games";
import { RulesModal } from "@/components/ui/RulesModal";
import { SoundButton } from "@/components/ui/SoundButton";
import { RoomLobbyModal } from "@/components/multiplayer/RoomLobbyModal";
import { InGameChat } from "@/components/multiplayer/InGameChat";
import { multiplayerManager } from "@/lib/multiplayer-room";
import { sound } from "@/lib/sound";

interface GameContainerProps {
  game: GameInfo;
  score?: number | string;
  scoreLabel?: string;
  onReset?: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export const GameContainer: React.FC<GameContainerProps> = ({
  game,
  score,
  scoreLabel = "Счет",
  onReset,
  children,
  actions,
}) => {
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isLobbyOpen, setIsLobbyOpen] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMultiplayerActive, setIsMultiplayerActive] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleFullscreen = () => {
    sound.playClick(600);
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleReset = () => {
    sound.playClick(500);
    setSecondsElapsed(0);
    if (onReset) onReset();
  };

  return (
    <div className="min-h-screen bg-arcade-dark text-slate-100 flex flex-col">
      {/* Game Control Bar */}
      <div className="sticky top-0 z-30 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl px-3 py-2.5 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2">
          {/* Back & Title */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              onClick={() => sound.playClick(400)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-800 transition-all text-xs font-semibold"
              title="В меню"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">В меню</span>
            </Link>

            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
                {game.titleRu}
              </h1>
              {isMultiplayerActive ? (
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 animate-pulse">
                  Онлайн 2P
                </span>
              ) : (
                <span className="hidden md:inline text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
                  Одиночная (AI)
                </span>
              )}
            </div>
          </div>

          {/* Center Stats: Timer, Score, Multiplayer mode */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-medium text-slate-300">
              <Timer className="w-3.5 h-3.5 text-cyan-400" />
              <span>{formatTimer(secondsElapsed)}</span>
            </div>

            {score !== undefined && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-bold text-amber-300">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] text-slate-400 hidden sm:inline">{scoreLabel}:</span>
                <span>{score}</span>
              </div>
            )}

            {/* Multiplayer Room Trigger */}
            <button
              onClick={() => {
                sound.playClick(600);
                setIsLobbyOpen(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600/40 to-pink-600/40 border border-purple-500/40 text-purple-300 hover:text-white hover:border-purple-400 text-xs font-bold transition-all shadow-[0_0_12px_rgba(168,85,247,0.2)]"
              title="Создать онлайн комнату или подключиться"
            >
              <Users className="w-3.5 h-3.5 text-pink-400" />
              <span className="hidden sm:inline">Онлайн комната</span>
            </button>

            {actions}
          </div>

          {/* Right Action buttons: Chat, Rules, Reset, Sound, Fullscreen */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <InGameChat />

            {onReset && (
              <button
                onClick={handleReset}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-800 transition-all"
                title="Перезапустить игру"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => {
                sound.playClick(600);
                setIsRulesOpen(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-cyan-500/40 hover:bg-cyan-950/30 transition-all text-xs font-semibold"
              title="Правила игры"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Правила</span>
            </button>

            <SoundButton />

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 hidden sm:inline-flex"
              title="Во весь экран"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Game Screen Canvas */}
      <main className="flex-1 flex flex-col justify-center items-center p-2 sm:p-4 md:p-6 overflow-hidden relative">
        {children}
      </main>

      {/* Rules Modal */}
      <RulesModal game={game} isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      {/* Multiplayer Lobby Modal */}
      <RoomLobbyModal
        gameId={game.id}
        isOpen={isLobbyOpen}
        onClose={() => setIsLobbyOpen(false)}
        onGameStart={() => {
          setIsLobbyOpen(false);
          setIsMultiplayerActive(true);
        }}
      />
    </div>
  );
};
