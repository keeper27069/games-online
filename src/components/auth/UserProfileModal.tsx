"use client";

import React from "react";
import { UserAccount, logoutAccount } from "@/lib/auth-service";
import { sound } from "@/lib/sound";
import { X, Trophy, Zap, Award, Flame, LogOut, DollarSign, Shield, ArrowUpRight } from "lucide-react";
import { GAMES_CATALOG } from "@/types/games";

interface UserProfileModalProps {
  user: UserAccount;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (user: UserAccount) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onUpdate,
}) => {
  if (!isOpen) return null;

  const currentLevelXP = user.xp % 300;
  const progressPercent = Math.min(100, Math.round((currentLevelXP / 300) * 100));

  const winRate =
    user.stats.totalGames > 0
      ? Math.round((user.stats.totalWins / user.stats.totalGames) * 100)
      : 0;

  const handleLogout = () => {
    sound.playClick(400);
    const guest = logoutAccount();
    onUpdate(guest);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-lg my-auto rounded-3xl glass-panel-glow border border-cyan-500/30 shadow-2xl p-5 sm:p-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 border-2 border-white/40 flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(0,210,255,0.4)]">
              {user.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white">{user.username}</h3>
                {user.isGuest ? (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-500/30 text-purple-300">
                    Гость
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/30 text-emerald-300">
                    PRO
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400">
                Уровень {user.level} • ELO: <span className="text-cyan-400 font-bold">{user.eloRating}</span>
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick(400);
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Level XP Progress Bar */}
        <div className="my-4 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-300 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Прогресс уровня {user.level}
            </span>
            <span className="text-amber-400">{currentLevelXP} / 300 XP</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Побед</span>
            <span className="text-lg font-black text-amber-300">{user.stats.totalWins}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Игр</span>
            <span className="text-lg font-black text-white">{user.stats.totalGames}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Винрейт</span>
            <span className="text-lg font-black text-emerald-400">{winRate}%</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Монеты</span>
            <span className="text-lg font-black text-cyan-300 flex items-center justify-center">
              ${user.coins}
            </span>
          </div>
        </div>

        {/* Per-Game ELO breakdown */}
        <div className="space-y-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Рейтинг по играм (ELO)
          </span>
          <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
            {GAMES_CATALOG.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-900/40 border border-slate-800 text-xs"
              >
                <span className="font-semibold text-slate-300 truncate">{g.titleRu}</span>
                <span className="font-black text-cyan-400">
                  {user.gameRatings?.[g.id] || user.eloRating}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:border-rose-500/40 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Выйти из аккаунта
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition-all shadow-[0_0_12px_rgba(0,210,255,0.3)]"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
