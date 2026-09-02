"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getAllRegisteredAccounts, getCurrentUser, UserAccount } from "@/lib/auth-service";
import { Server, Database, Users, ShieldCheck, Activity, ArrowLeft, RefreshCw, Mail, Trophy, Zap } from "lucide-react";
import { sound } from "@/lib/sound";

export default function AdminPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = () => {
    setIsRefreshing(true);
    sound.playClick(600);
    const regUsers = getAllRegisteredAccounts();
    const curr = getCurrentUser();
    setCurrentUser(curr);

    // Combine current user if not in regUsers
    const list = [...regUsers];
    if (curr && !list.some((u) => u.id === curr.id)) {
      list.push(curr);
    }
    setUsers(list);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-arcade-dark text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumb & Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/"
                className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Главная
              </Link>
              <span className="text-slate-600">/</span>
              <span className="text-xs text-cyan-400 font-bold">Бэкенд & База Пользователей</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              Панель управления & База данных
              <span className="text-xs uppercase font-bold px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                Live Edge
              </span>
            </h1>
          </div>

          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500 text-xs font-bold text-slate-200 hover:text-white transition-all shadow"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
            Обновить данные
          </button>
        </div>

        {/* Server & Backend Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 glass-panel">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Всего аккаунтов</span>
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-3xl font-black text-white">{users.length}</div>
            <span className="text-[11px] text-emerald-400 mt-1 block">● Активные профили</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 glass-panel">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Платформа</span>
              <Server className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-xl font-bold text-purple-300">Vercel Serverless</div>
            <span className="text-[11px] text-slate-400 mt-1 block">Edge Network Global</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 glass-panel">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Realtime Шлюз</span>
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-emerald-400">Broadcast Bus</div>
            <span className="text-[11px] text-slate-400 mt-1 block">&lt; 25ms latency</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 glass-panel">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Статус API</span>
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-xl font-bold text-cyan-400">200 OK</div>
            <span className="text-[11px] text-slate-400 mt-1 block">/api/users • /api/rooms</span>
          </div>
        </div>

        {/* Database Table of Users */}
        <div className="rounded-3xl glass-panel-glow border border-slate-800/90 overflow-hidden shadow-2xl p-6">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/30 text-cyan-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Реестр пользователей (База данных)</h3>
                <p className="text-xs text-slate-400">Все зарегистрированные аккаунты, ELO и статистика</p>
              </div>
            </div>

            <div className="text-xs text-slate-400">
              Найдено: <span className="text-cyan-400 font-bold">{users.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold bg-slate-950/40">
                  <th className="py-3 px-4">Игрок</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Тип</th>
                  <th className="py-3 px-4">Уровень / XP</th>
                  <th className="py-3 px-4">ELO Рейтинг</th>
                  <th className="py-3 px-4">Монеты</th>
                  <th className="py-3 px-4">Дата создания</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Пользователей пока нет. Создайте первый аккаунт!
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-900/50 transition-colors ${
                        currentUser?.id === u.id ? "bg-cyan-950/30 font-semibold" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 flex items-center gap-3">
                        <span className="text-2xl">{u.avatar}</span>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            {u.username}
                            {currentUser?.id === u.id && (
                              <span className="text-[9px] px-1 rounded bg-cyan-900 text-cyan-300">
                                Вы
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">{u.id}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        {u.email ? (
                          <span className="flex items-center gap-1 text-slate-200">
                            <Mail className="w-3 h-3 text-cyan-400" />
                            {u.email}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {u.isGuest ? (
                          <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/30 text-purple-300 text-[10px] font-bold">
                            Гость
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                            Зарегистрирован
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        Ур. {u.level} <span className="text-slate-500">({u.xp} XP)</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-cyan-400">{u.eloRating}</span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-amber-300">
                        ${u.coins}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {new Date(u.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
