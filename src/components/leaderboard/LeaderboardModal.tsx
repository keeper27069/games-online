"use client";

import React, { useState } from "react";
import { getLeaderboardData, LeaderboardEntry } from "@/lib/leaderboard-service";
import { GAMES_CATALOG } from "@/types/games";
import { sound } from "@/lib/sound";
import { Trophy, Medal, Crown, X, Sparkles, User, Flame } from "lucide-react";

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose }) => {
  const [selectedGame, setSelectedGame] = useState<string>("all");

  if (!isOpen) return null;

  const data = getLeaderboardData(selectedGame === "all" ? undefined : selectedGame);
  const topThree = data.slice(0, 3);
  const restOfList = data.slice(3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl my-auto rounded-3xl glass-panel-glow border border-amber-500/30 shadow-2xl p-5 sm:p-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.5)]">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                Таблица лидеров <span className="text-amber-400">ArcadeHub</span>
              </h3>
              <p className="text-xs text-slate-400">Лучшие игроки портала по ELO-рейтингу</p>
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

        {/* Game Filters Horizontal Scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-3 border-b border-slate-800/80">
          <button
            onClick={() => {
              sound.playClick(500);
              setSelectedGame("all");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
              selectedGame === "all"
                ? "bg-amber-400 text-slate-950 shadow"
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
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                selectedGame === g.id
                  ? "bg-amber-400 text-slate-950 shadow"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {g.titleRu}
            </button>
          ))}
        </div>

        {/* Podium: Top 3 Players */}
        {topThree.length >= 3 && (
          <div className="grid grid-cols-3 gap-3 my-4 items-end text-center">
            {/* 2nd Place */}
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700/60 flex flex-col items-center">
              <div className="text-2xl mb-1">{topThree[1].avatar}</div>
              <div className="w-6 h-6 rounded-full bg-slate-400 text-slate-950 font-black text-xs flex items-center justify-center -mt-3 mb-1 shadow">
                2
              </div>
              <span className="text-xs font-bold text-white truncate max-w-[90px]">
                {topThree[1].username}
              </span>
              <span className="text-xs font-extrabold text-cyan-400">{topThree[1].eloRating} ELO</span>
            </div>

            {/* 1st Place Champion */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 border-2 border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.3)] flex flex-col items-center -translate-y-2">
              <Crown className="w-6 h-6 text-amber-400 animate-bounce mb-1" />
              <div className="text-3xl mb-1">{topThree[0].avatar}</div>
              <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center -mt-3 mb-1 shadow">
                1
              </div>
              <span className="text-sm font-black text-amber-300 truncate max-w-[100px]">
                {topThree[0].username}
              </span>
              <span className="text-xs font-extrabold text-amber-400">{topThree[0].eloRating} ELO</span>
            </div>

            {/* 3rd Place */}
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-amber-700/40 flex flex-col items-center">
              <div className="text-2xl mb-1">{topThree[2].avatar}</div>
              <div className="w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center -mt-3 mb-1 shadow">
                3
              </div>
              <span className="text-xs font-bold text-white truncate max-w-[90px]">
                {topThree[2].username}
              </span>
              <span className="text-xs font-extrabold text-cyan-400">{topThree[2].eloRating} ELO</span>
            </div>
          </div>
        )}

        {/* Full Rank Table */}
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {data.map((entry) => (
            <div
              key={entry.id}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-xs ${
                entry.isCurrentUser
                  ? "bg-cyan-950/60 border-cyan-400 shadow-[0_0_12px_rgba(0,210,255,0.3)] font-bold text-white"
                  : "bg-slate-900/50 border-slate-800 text-slate-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 text-center font-black text-slate-400">
                  #{entry.rank}
                </span>
                <span className="text-lg">{entry.avatar}</span>
                <div>
                  <span className="font-bold flex items-center gap-1.5">
                    {entry.username}
                    {entry.isCurrentUser && (
                      <span className="text-[9px] px-1 rounded bg-cyan-900 text-cyan-300">
                        Вы
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Уровень {entry.level} • {entry.totalWins} побед ({entry.winRate}%)
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-black text-cyan-400 block text-sm">
                  {entry.eloRating}
                </span>
                <span className="text-[9px] uppercase font-bold text-slate-500">ELO</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
