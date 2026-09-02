"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gamepad2, Dices, Trophy, User, ChevronDown, Sparkles, LogIn, DollarSign } from "lucide-react";
import { SoundButton } from "@/components/ui/SoundButton";
import { GAMES_CATALOG } from "@/types/games";
import { getCurrentUser, UserAccount } from "@/lib/auth-service";
import { AuthModal } from "@/components/auth/AuthModal";
import { UserProfileModal } from "@/components/auth/UserProfileModal";
import { LeaderboardModal } from "@/components/leaderboard/LeaderboardModal";
import { sound } from "@/lib/sound";

export const Header: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<UserAccount>(() => getCurrentUser());
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isGamesMenuOpen, setIsGamesMenuOpen] = useState(false);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const handleRandomGame = () => {
    sound.playDiceRoll();
    const randomIndex = Math.floor(Math.random() * GAMES_CATALOG.length);
    const selected = GAMES_CATALOG[randomIndex];
    router.push(`/games/${selected.id}`);
  };

  const handleUserClick = (e: React.MouseEvent) => {
    sound.playClick(600);
    // Navigate to dedicated page for clean UX, or open modal
    if (user.isGuest) {
      router.push("/login");
    } else {
      router.push("/profile");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          href="/"
          onClick={() => sound.playClick(500)}
          className="group flex items-center gap-3 transition-transform duration-200 active:scale-95"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 shadow-[0_0_20px_rgba(0,210,255,0.4)] group-hover:shadow-[0_0_30px_rgba(0,210,255,0.7)] transition-all">
            <Gamepad2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              ARCADE<span className="text-cyan-400 text-glow-blue">HUB</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
                Online
              </span>
            </span>
            <p className="hidden sm:block text-[10px] text-slate-400 font-medium -mt-1 tracking-wider">
              Настольные & Казуальные игры
            </p>
          </div>
        </Link>

        {/* Center & Right Navigation Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Games Dropdown */}
          <div className="relative hidden lg:block">
            <button
              onClick={() => {
                sound.playClick(400);
                setIsGamesMenuOpen(!isGamesMenuOpen);
              }}
              className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all"
            >
              Каталог игр ({GAMES_CATALOG.length})
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isGamesMenuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsGamesMenuOpen(false)} />
                <div className="absolute left-0 mt-2 w-56 rounded-2xl glass-panel-glow border border-slate-700/80 p-2 shadow-2xl z-30 animate-fadeIn">
                  <div className="text-[11px] font-semibold text-slate-400 px-3 py-1.5 uppercase tracking-wider">
                    Выберите игру
                  </div>
                  <div className="space-y-0.5 max-h-72 overflow-y-auto">
                    {GAMES_CATALOG.map((g) => (
                      <Link
                        key={g.id}
                        href={`/games/${g.id}`}
                        onClick={() => {
                          sound.playClick(600);
                          setIsGamesMenuOpen(false);
                        }}
                        className="flex items-center justify-between px-3 py-2 text-xs rounded-lg text-slate-200 hover:bg-cyan-950/50 hover:text-cyan-300 transition-colors"
                      >
                        <span className="font-medium">{g.titleRu}</span>
                        <span className="text-[10px] text-slate-500">{g.playersCount}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Leaderboard Link */}
          <Link
            href="/leaderboard"
            onClick={() => sound.playClick(600)}
            className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 hover:bg-amber-900/40 hover:text-white transition-all shadow-[0_0_12px_rgba(251,191,36,0.2)]"
            title="Таблица лидеров"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Лидеры</span>
          </Link>

          {/* Random Game button */}
          <button
            onClick={handleRandomGame}
            className="min-h-[44px] flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-500/40 text-purple-300 hover:text-white hover:border-purple-400 hover:bg-purple-600/40 transition-all shadow-[0_0_12px_rgba(168,85,247,0.2)] active:scale-95"
            title="Случайная игра"
          >
            <Dices className="w-4 h-4 text-pink-400" />
            <span className="hidden md:inline">Случайная</span>
          </button>

          {/* Sound Mute Toggle */}
          <SoundButton />

          {/* User Account / Profile Link */}
          <button
            onClick={handleUserClick}
            className="min-h-[44px] flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800 transition-all group focus-visible:ring-2 focus-visible:ring-cyan-400"
            title={user.isGuest ? "Войти в аккаунт" : "Профиль игрока"}
          >
            <span className="text-xl">{user.avatar}</span>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 max-w-[90px] truncate leading-tight">
                {user.username}
              </div>
              <div className="text-[10px] text-cyan-400 font-semibold leading-none flex items-center gap-1">
                <span>Ур.{user.level}</span>
                <span>•</span>
                <span>{user.eloRating} ELO</span>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Fallback Modals for in-game contexts */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(updated) => setUser(updated)}
      />

      <UserProfileModal
        user={user}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onUpdate={(updated) => setUser(updated)}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />
    </header>
  );
};
