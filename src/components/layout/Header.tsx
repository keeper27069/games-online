"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gamepad2, Dices, Volume2, User, Sparkles, Trophy, ChevronDown } from "lucide-react";
import { SoundButton } from "@/components/ui/SoundButton";
import { GAMES_CATALOG } from "@/types/games";
import { getStoredProfile, saveStoredProfile, UserProfile } from "@/lib/storage";
import { sound } from "@/lib/sound";

export const Header: React.FC = () => {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>({ name: "Игрок #1", avatar: "🎮", theme: "cyber" });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempAvatar, setTempAvatar] = useState("🎮");
  const [isGamesMenuOpen, setIsGamesMenuOpen] = useState(false);

  useEffect(() => {
    const prof = getStoredProfile();
    setProfile(prof);
    setTempName(prof.name);
    setTempAvatar(prof.avatar);
  }, []);

  const avatars = ["🎮", "👾", "👑", "🃏", "🎲", "🚀", "⚡", "🔥", "🐱", "🤖"];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = saveStoredProfile({ name: tempName || "Игрок", avatar: tempAvatar });
    setProfile(updated);
    setIsProfileOpen(false);
    sound.playClick(700);
  };

  const handleRandomGame = () => {
    sound.playDiceRoll();
    const randomIndex = Math.floor(Math.random() * GAMES_CATALOG.length);
    const selected = GAMES_CATALOG[randomIndex];
    router.push(`/games/${selected.id}`);
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

        {/* Quick Game Selector & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Games dropdown */}
          <div className="relative hidden md:block">
            <button
              onClick={() => {
                sound.playClick(400);
                setIsGamesMenuOpen(!isGamesMenuOpen);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all"
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

          {/* Random Game button */}
          <button
            onClick={handleRandomGame}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-500/40 text-purple-300 hover:text-white hover:border-purple-400 hover:bg-purple-600/40 transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)] active:scale-95"
            title="Случайная игра"
          >
            <Dices className="w-4 h-4 text-pink-400 animate-spin-slow" />
            <span className="hidden sm:inline">Случайная</span>
          </button>

          {/* Sound Mute Toggle */}
          <SoundButton />

          {/* User Profile avatar */}
          <button
            onClick={() => {
              sound.playClick(600);
              setIsProfileOpen(true);
            }}
            className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800 transition-all group"
            title="Профиль игрока"
          >
            <span className="text-lg">{profile.avatar}</span>
            <span className="text-xs font-semibold text-slate-300 group-hover:text-cyan-300 max-w-[80px] truncate hidden sm:inline">
              {profile.name}
            </span>
          </button>
        </div>
      </div>

      {/* User Profile Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl glass-panel border border-slate-700/80 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              Профиль игрока
            </h3>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">Ваш никнейм</label>
                <input
                  type="text"
                  maxLength={15}
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-cyan-400 focus:outline-none"
                  placeholder="Введите имя..."
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">Выберите аватар</label>
                <div className="grid grid-cols-5 gap-2">
                  {avatars.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => {
                        sound.playClick(700);
                        setTempAvatar(av);
                      }}
                      className={`h-11 flex items-center justify-center text-xl rounded-xl border transition-all ${
                        tempAvatar === av
                          ? "bg-cyan-950 border-cyan-400 scale-105 shadow-[0_0_12px_rgba(0,210,255,0.4)]"
                          : "bg-slate-900 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all shadow-[0_0_15px_rgba(0,210,255,0.3)]"
                >
                  Сохранить
                </button>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-slate-800 hover:bg-slate-700 hover:text-white transition-all"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
