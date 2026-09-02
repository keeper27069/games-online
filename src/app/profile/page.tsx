"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getCurrentUser, saveCurrentUser, logoutAccount, UserAccount } from "@/lib/auth-service";
import { sound } from "@/lib/sound";
import { GAMES_CATALOG } from "@/types/games";
import { Trophy, Zap, Award, Flame, LogOut, DollarSign, Shield, ArrowLeft, ArrowUpRight, Check, User, Sparkles } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserAccount | null>(null);

  useEffect(() => {
    const curr = getCurrentUser();
    setUser(curr);
  }, []);

  if (!user) return null;

  const currentLevelXP = user.xp % 300;
  const progressPercent = Math.min(100, Math.round((currentLevelXP / 300) * 100));

  const winRate =
    user.stats.totalGames > 0
      ? Math.round((user.stats.totalWins / user.stats.totalGames) * 100)
      : 0;

  const handleLogout = () => {
    sound.playClick(400);
    logoutAccount();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-arcade-dark text-slate-100 flex flex-col justify-between">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Главная
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-xs text-cyan-400 font-bold">Профиль игрока</span>
        </div>

        {/* Profile Card Banner */}
        <div className="rounded-3xl glass-panel-glow border border-cyan-500/30 p-6 sm:p-8 bg-slate-950/90 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 pb-6 border-b border-slate-800">
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-500 to-blue-600 border-2 border-white/40 flex items-center justify-center text-4xl shadow-[0_0_25px_rgba(0,210,255,0.4)]">
                {user.avatar}
              </div>
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-white">{user.username}</h1>
                  {user.isGuest ? (
                    <span className="text-xs uppercase font-bold px-2.5 py-1 rounded-lg bg-purple-950/80 border border-purple-500/30 text-purple-300">
                      Гость
                    </span>
                  ) : (
                    <span className="text-xs uppercase font-bold px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-300">
                      PRO Игрок
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {user.email ? user.email : "Гостевой аккаунт"} • В игре с {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user.isGuest && (
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold text-xs shadow hover:scale-105 transition-all"
                >
                  Зарегистрироваться
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:border-rose-500/40 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                Выйти
              </button>
            </div>
          </div>

          {/* Level XP Bar */}
          <div className="my-6 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-200 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                Уровень {user.level} (Прогресс)
              </span>
              <span className="text-amber-400">{currentLevelXP} / 300 XP</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-[11px] uppercase font-bold text-slate-400 block mb-0.5">Всего побед</span>
              <span className="text-2xl font-black text-amber-300">{user.stats.totalWins}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-[11px] uppercase font-bold text-slate-400 block mb-0.5">Сыграно матчей</span>
              <span className="text-2xl font-black text-white">{user.stats.totalGames}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-[11px] uppercase font-bold text-slate-400 block mb-0.5">Винрейт</span>
              <span className="text-2xl font-black text-emerald-400">{winRate}%</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-[11px] uppercase font-bold text-slate-400 block mb-0.5">Монеты</span>
              <span className="text-2xl font-black text-cyan-300">${user.coins}</span>
            </div>
          </div>
        </div>

        {/* Ratings per Game */}
        <div className="rounded-3xl glass-panel-glow border border-slate-800 p-6 sm:p-8 bg-slate-950/80 shadow-xl space-y-4">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Индивидуальный рейтинг по играм (ELO)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {GAMES_CATALOG.map((g) => (
              <Link
                key={g.id}
                href={`/games/${g.id}`}
                className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 hover:bg-cyan-950/20 transition-all flex items-center justify-between group"
              >
                <div>
                  <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 block truncate">
                    {g.titleRu}
                  </span>
                  <span className="text-[10px] text-slate-500">{g.category}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-cyan-400 block">
                    {user.gameRatings?.[g.id] || user.eloRating}
                  </span>
                  <span className="text-[9px] uppercase font-bold text-slate-500">ELO</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
