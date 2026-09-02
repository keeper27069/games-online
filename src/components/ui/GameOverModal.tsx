"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Trophy, Frown, RotateCcw, Home, Sparkles } from "lucide-react";
import { triggerConfetti, triggerSideCannons } from "@/lib/confetti";
import { sound } from "@/lib/sound";

interface GameOverModalProps {
  isOpen: boolean;
  isWinner: boolean;
  title?: string;
  subtitle?: string;
  score?: number;
  stats?: { label: string; value: string | number }[];
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  isWinner,
  title,
  subtitle,
  score,
  stats,
  onRestart,
}) => {
  useEffect(() => {
    if (isOpen) {
      if (isWinner) {
        sound.playWin();
        triggerConfetti();
        setTimeout(() => triggerSideCannons(), 500);
      } else {
        sound.playGameOver();
      }
    }
  }, [isOpen, isWinner]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-fadeIn">
      <div
        className={`relative w-full max-w-md overflow-hidden rounded-3xl p-8 text-center glass-panel border ${
          isWinner
            ? "border-amber-400/40 shadow-[0_0_50px_rgba(251,191,36,0.3)] bg-gradient-to-b from-slate-900/90 via-amber-950/20 to-slate-950/90"
            : "border-rose-500/40 shadow-[0_0_50px_rgba(244,63,94,0.2)] bg-gradient-to-b from-slate-900/90 via-rose-950/20 to-slate-950/90"
        }`}
      >
        {/* Glow orb */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-50 ${
            isWinner ? "bg-amber-400" : "bg-rose-500"
          }`}
        />

        {/* Icon */}
        <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl shadow-xl">
          {isWinner ? (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 shadow-[0_0_30px_rgba(251,191,36,0.6)] animate-bounce">
              <Trophy className="h-10 w-10 text-slate-950" />
            </div>
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-500 shadow-[0_0_30px_rgba(244,63,94,0.5)]">
              <Frown className="h-10 w-10 text-white" />
            </div>
          )}
        </div>

        {/* Title */}
        <h2
          className={`text-3xl font-black tracking-wide mb-2 ${
            isWinner ? "text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 drop-shadow" : "text-rose-400"
          }`}
        >
          {title || (isWinner ? "Блестящая Победа!" : "Игра Окончена")}
        </h2>

        {/* Subtitle */}
        <p className="text-sm text-slate-300 mb-6">
          {subtitle || (isWinner ? "Поздравляем! Вы продемонстрировали отличную игру." : "Не расстраивайтесь! В следующий раз обязательно повезет.")}
        </p>

        {/* Score display */}
        {score !== undefined && (
          <div className="mb-6 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs uppercase tracking-widest text-slate-400">Итоговый счет</span>
            <div className="text-3xl font-extrabold text-cyan-400 text-glow-blue mt-1">
              {score.toLocaleString()}
            </div>
          </div>
        )}

        {/* Custom Stats list */}
        {stats && stats.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-6">
            {stats.map((st, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-left">
                <span className="text-xs text-slate-400 block">{st.label}</span>
                <span className="text-sm font-bold text-white mt-0.5 block">{st.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
          <button
            onClick={() => {
              sound.playClick(700);
              onRestart();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-[0_0_20px_rgba(0,210,255,0.4)] transition-all transform active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            Сыграть еще раз
          </button>
          <Link
            href="/"
            onClick={() => sound.playClick(500)}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-slate-700 transition-all"
          >
            <Home className="w-4 h-4" />
            В главное меню
          </Link>
        </div>
      </div>
    </div>
  );
};
