"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getLeaderboardData } from "@/lib/leaderboard-service";
import { GAMES_CATALOG } from "@/types/games";
import { sound } from "@/lib/sound";
import { Trophy, Crown, ArrowLeft, Medal, Sparkles, User, Flame } from "lucide-react";

export default function LeaderboardPage() {
  const [selectedGame, setSelectedGame] = useState<string>("all");

  const data = getLeaderboardData(selectedGame === "all" ? undefined : selectedGame);
  const topThree = data.slice(0, 3);
  const restOfList = data.slice(3);

  return (
    <div className="min-h-screen bg-arcade-dark text-slate-100 flex flex-col justify-between">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Главная
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-xs text-amber-400 font-bold">Таблица лидеров</span>
        </div>

        {/* Header Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 shadow-[0_0_20px_rgba(251,191,36,0.5)]">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Таблица лидеров <span className="text-amber-400">ArcadeHub</span>
              </h1>
              <p className="text-xs text-slate-400">Рейтинг игроков по ELO и количеству побед</p>
            </div>
          </div>
        </div>

        {/* Game Filters Horizontal */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => {
              sound.playClick(500);
              setSelectedGame("all");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
              selectedGame === "all"
                ? "bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.4)]"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            Общий рейтинг
          </button>
          {GAMES_CATALOG.map((g) => (
            <button
              key={g.id}
              onClick={() => {
                sound.playClick(500);
                setSelectedGame(g.id);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                selectedGame === g.id
                  ? "bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.4)]"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {g.titleRu}
            </button>
          ))}
        </div>

        {/* Podium */}
        {topThree.length >= 3 && (
          <div className="grid grid-cols-3 gap-3 sm:gap-4 my-6 items-end text-center">
            {/* 2nd Place */}
            <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-700/60 flex flex-col items-center">
              <div className="text-3xl mb-1">{topThree[1].avatar}</div>
              <div className="w-7 h-7 rounded-full bg-slate-400 text-slate-950 font-black text-xs flex items-center justify-center -mt-3.5 mb-2 shadow">
                2
              </div>
              <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[120px]">
                {topThree[1].username}
              </span>
              <span className="text-xs font-extrabold text-cyan-400 mt-0.5">{topThree[1].eloRating} ELO</span>
              <span className="text-[10px] text-slate-500 mt-1">{topThree[1].totalWins} побед</span>
            </div>

            {/* 1st Place */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 border-2 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.3)] flex flex-col items-center -translate-y-3">
              <Crown className="w-7 h-7 text-amber-400 animate-bounce mb-1" />
              <div className="text-4xl mb-1">{topThree[0].avatar}</div>
              <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center -mt-4 mb-2 shadow">
                1
              </div>
              <span className="text-sm sm:text-base font-black text-amber-300 truncate max-w-[140px]">
                {topThree[0].username}
              </span>
              <span className="text-sm font-extrabold text-amber-400 mt-0.5">{topThree[0].eloRating} ELO</span>
              <span className="text-[11px] text-amber-300/80 font-bold mt-1">{topThree[0].totalWins} побед ({topThree[0].winRate}%)</span>
            </div>

            {/* 3rd Place */}
            <div className="p-4 rounded-3xl bg-slate-900/80 border border-amber-700/40 flex flex-col items-center">
              <div className="text-3xl mb-1">{topThree[2].avatar}</div>
              <div className="w-7 h-7 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center -mt-3.5 mb-2 shadow">
                3
              </div>
              <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[120px]">
                {topThree[2].username}
              </span>
              <span className="text-xs font-extrabold text-cyan-400 mt-0.5">{topThree[2].eloRating} ELO</span>
              <span className="text-[10px] text-slate-500 mt-1">{topThree[2].totalWins} побед</span>
            </div>
          </div>
        )}

        {/* Full Table */}
        <div className="rounded-3xl glass-panel-glow border border-slate-800 p-4 sm:p-6 bg-slate-950/80 shadow-xl space-y-2">
          {data.map((entry) => (
            <div
              key={entry.id}
              className={`flex items-center justify-between p-3 sm:p-4 rounded-2xl border transition-all text-xs sm:text-sm ${
                entry.isCurrentUser
                  ? "bg-cyan-950/60 border-cyan-400 shadow-[0_0_15px_rgba(0,210,255,0.3)] font-bold text-white"
                  : "bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="w-6 text-center font-black text-slate-400 text-sm">
                  #{entry.rank}
                </span>
                <span className="text-2xl">{entry.avatar}</span>
                <div>
                  <span className="font-bold flex items-center gap-1.5 text-white">
                    {entry.username}
                    {entry.isCurrentUser && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-900 text-cyan-300">
                        Вы
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Уровень {entry.level} • {entry.totalWins} побед ({entry.winRate}%)
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-black text-cyan-400 block text-base">
                  {entry.eloRating}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-500">ELO Рейтинг</span>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
