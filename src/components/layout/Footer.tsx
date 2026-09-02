import React from "react";
import Link from "next/link";
import { Gamepad2, Heart, Zap, ShieldCheck } from "lucide-react";
import { GAMES_CATALOG } from "@/types/games";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-md mt-16 py-12 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600">
                <Gamepad2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-black tracking-tight text-white">
                ARCADE<span className="text-cyan-400">HUB</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-4">
              Современный игровой веб-портал настольных и казуальных развлечений. 
              Мгновенный запуск прямо в браузере, умные боты, звук Web Audio API и полная поддержка любых экранов.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Vercel Serverless
              </span>
              <span>•</span>
              <Link href="/admin" className="text-cyan-400 hover:text-cyan-300 font-semibold underline">
                Бэкенд & База пользователей
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Игры портала</h4>
            <ul className="space-y-1.5 text-xs">
              {GAMES_CATALOG.slice(0, 4).map((g) => (
                <li key={g.id}>
                  <Link href={`/games/${g.id}`} className="hover:text-cyan-400 transition-colors">
                    {g.titleRu} ({g.title})
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Аркады & Настолки</h4>
            <ul className="space-y-1.5 text-xs">
              {GAMES_CATALOG.slice(4).map((g) => (
                <li key={g.id}>
                  <Link href={`/games/${g.id}`} className="hover:text-cyan-400 transition-colors">
                    {g.titleRu} ({g.title})
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-800/80 pt-6 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} ArcadeHub Gaming Portal. Все права защищены.</p>
          <p className="flex items-center gap-1 mt-2 sm:mt-0">
            Создано с <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> на Next.js & React 19
          </p>
        </div>
      </div>
    </footer>
  );
};
