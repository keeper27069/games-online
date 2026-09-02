"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Gamepad2,
  Search,
  Dices,
  Sparkles,
  Trophy,
  Users,
  Clock,
  Layers,
  ShieldAlert,
  Grid3X3,
  Gift,
  Landmark,
  Boxes,
  Zap,
  BookOpen,
  ArrowRight,
  Flame,
} from "lucide-react";
import { GAMES_CATALOG, GameCategory, GameInfo } from "@/types/games";
import { RulesModal } from "@/components/ui/RulesModal";
import { sound } from "@/lib/sound";
import { getStoredProfile, getGameStats } from "@/lib/storage";

const CATEGORY_TABS: { id: GameCategory; label: string }[] = [
  { id: "all", label: "Все игры" },
  { id: "cards", label: "Карточные" },
  { id: "board", label: "Настольные" },
  { id: "arcade", label: "Аркады / Экшен" },
  { id: "puzzle", label: "Головоломки" },
];

const ICONS_MAP: Record<string, React.ReactNode> = {
  Layers: <Layers className="w-8 h-8" />,
  ShieldAlert: <ShieldAlert className="w-8 h-8" />,
  Grid3X3: <Grid3X3 className="w-8 h-8" />,
  Gift: <Gift className="w-8 h-8" />,
  Landmark: <Landmark className="w-8 h-8" />,
  Sparkles: <Sparkles className="w-8 h-8" />,
  Gamepad2: <Gamepad2 className="w-8 h-8" />,
  Boxes: <Boxes className="w-8 h-8" />,
};

export default function HomePage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewGame, setPreviewGame] = useState<GameInfo | null>(null);
  const [totalWins, setTotalWins] = useState(0);
  const [totalPlayed, setTotalPlayed] = useState(0);
  const [playerName, setPlayerName] = useState("Игрок");

  useEffect(() => {
    const prof = getStoredProfile();
    setPlayerName(prof.name);

    let wins = 0;
    let played = 0;
    GAMES_CATALOG.forEach((g) => {
      const stats = getGameStats(g.id);
      wins += stats.wins;
      played += stats.gamesPlayed;
    });
    setTotalWins(wins);
    setTotalPlayed(played);
  }, []);

  const filteredGames = GAMES_CATALOG.filter((game) => {
    const matchesCat = selectedCategory === "all" || game.category === selectedCategory;
    const matchesSearch =
      game.titleRu.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleRandomPlay = () => {
    sound.playDiceRoll();
    const randomIndex = Math.floor(Math.random() * GAMES_CATALOG.length);
    const selected = GAMES_CATALOG[randomIndex];
    router.push(`/games/${selected.id}`);
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-10">
      {/* Hero Showcase Section */}
      <section className="relative overflow-hidden rounded-3xl p-6 sm:p-10 border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-[#0d1222] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        {/* Glow ambient lights */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-xs font-bold text-cyan-300">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>8 полноценных онлайн-игр нового поколения</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Интерактивный портал <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 text-glow-blue">
                настольных и казуальных игр
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Мгновенный запуск прямо в браузере без установок и рекламы. Умный AI-бот для одиночной игры, 
              звуковой процессор Web Audio API, физика 60 FPS и поддержка любого экрана.
            </p>

            {/* Quick Hero Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleRandomPlay}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-slate-950 font-black text-sm shadow-[0_0_20px_rgba(0,210,255,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                <Dices className="w-4 h-4 text-slate-950" />
                Случайная игра
              </button>

              <a
                href="#catalog"
                onClick={() => sound.playClick(400)}
                className="px-6 py-3 rounded-2xl bg-slate-900 border border-slate-700 hover:border-cyan-500/40 text-slate-200 hover:text-white font-bold text-sm transition-all flex items-center gap-2"
              >
                Выбрать из каталога
                <ArrowRight className="w-4 h-4 text-cyan-400" />
              </a>
            </div>
          </div>

          {/* User Quick Stats Card */}
          <div className="lg:col-span-4 p-5 rounded-2xl glass-panel border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Ваша статистика
              </span>
              <span className="text-xs font-semibold text-cyan-400">Привет, {playerName}!</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Всего сыграно
                </span>
                <span className="text-2xl font-black text-white mt-0.5 block">{totalPlayed}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-amber-400 block flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-400" />
                  Побед
                </span>
                <span className="text-2xl font-black text-amber-300 mt-0.5 block">{totalWins}</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Прогресс автоматически сохраняется в профиле</span>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Search & Category Filters */}
      <section id="catalog" className="space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-cyan-400" />
              Каталог игр
            </h2>
            <p className="text-xs text-slate-400">Выберите игру для старта</p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск по названию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                sound.playClick(600);
                setSelectedCategory(tab.id);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                selectedCategory === tab.id
                  ? "bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,210,255,0.4)]"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 3D Interactive Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredGames.map((game) => {
            const stats = getGameStats(game.id);

            return (
              <div
                key={game.id}
                className="group relative flex flex-col justify-between p-5 rounded-3xl glass-card border border-slate-800 overflow-hidden"
              >
                {/* Accent glow on top */}
                <div
                  className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-30 transition-opacity group-hover:opacity-70"
                  style={{ backgroundColor: game.glowColor }}
                />

                <div>
                  {/* Top Badges & Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`p-3 rounded-2xl bg-gradient-to-br ${game.accentColor} text-white shadow-lg`}
                    >
                      {ICONS_MAP[game.iconName] || <Gamepad2 className="w-8 h-8" />}
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {game.badge && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 shadow-sm">
                          {game.badge}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {game.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-black text-white group-hover:text-cyan-400 transition-colors">
                    {game.titleRu}
                  </h3>
                  <span className="text-xs text-slate-500 font-medium -mt-1 block mb-2">
                    {game.title}
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4">
                    {game.description}
                  </p>
                </div>

                {/* Metadata & Actions */}
                <div className="space-y-3 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      {game.playersCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      {game.avgDuration}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/games/${game.id}`}
                      onClick={() => sound.playClick(800)}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black text-xs text-center shadow-[0_0_12px_rgba(0,210,255,0.3)] hover:scale-102 active:scale-98 transition-all"
                    >
                      ИГРАТЬ
                    </Link>

                    <button
                      onClick={() => {
                        sound.playClick(600);
                        setPreviewGame(game);
                      }}
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all"
                      title="Правила игры"
                    >
                      <BookOpen className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredGames.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">
            Игры по вашему запросу «{searchQuery}» не найдены.
          </div>
        )}
      </section>

      {/* Portal Architecture & Features Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
        <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Zap className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-white">Vercel Serverless Ready</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Чистый билд без тяжелых зависимостей. Мгновенная загрузка статики и заголовки безопасности.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-white">Web Audio API Synth</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Процедурный синтез звуков кликов, ходов, бросков костей и победы без внешних MP3 файлов.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-white">Умные AI-Боты</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Полноценный офлайн-режим против искусственного интеллекта (Minimax в шашках, эвристики в UNO).
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-pink-950/80 border border-pink-500/30 flex items-center justify-center text-pink-400">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-white">Touch & Keyboard</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Полная поддержка смартфонов (Touch Swipes), мыши и классической раскладки клавиатуры.
          </p>
        </div>
      </section>

      {/* Rules Modal for Catalog Card Preview */}
      {previewGame && (
        <RulesModal
          game={previewGame}
          isOpen={!!previewGame}
          onClose={() => setPreviewGame(null)}
        />
      )}
    </div>
  );
}
