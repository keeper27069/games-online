"use client";

import React, { useState } from "react";
import { X, BookOpen, Lightbulb, CheckCircle2 } from "lucide-react";
import { GameInfo } from "@/types/games";
import { sound } from "@/lib/sound";

interface RulesModalProps {
  game: GameInfo;
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ game, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<"rules" | "tips">("rules");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl glass-panel-glow border border-cyan-500/30 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700/60 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                Правила игры: <span className="text-cyan-400">{game.titleRu}</span>
              </h3>
              <p className="text-xs text-slate-400">
                {game.playersCount} • {game.avgDuration} • Сложность: {game.difficulty}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick(500);
              onClose();
            }}
            className="p-2 text-slate-400 rounded-lg hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 pt-2">
          <button
            onClick={() => {
              sound.playClick(600);
              setActiveTab("rules");
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "rules"
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Основные правила
          </button>
          <button
            onClick={() => {
              sound.playClick(600);
              setActiveTab("tips");
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "tips"
                ? "border-amber-400 text-amber-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            Советы и тактика
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4 text-slate-300 text-sm leading-relaxed">
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-cyan-200 text-sm">
            <span className="font-semibold text-cyan-300">Цель: </span>
            {game.rules.summary}
          </div>

          {activeTab === "rules" ? (
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Порядок игры:</h4>
              <ul className="space-y-2.5">
                {game.rules.details.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-wider text-amber-400 font-semibold">Секреты победы:</h4>
              <ul className="space-y-2.5">
                {game.rules.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-3 bg-amber-950/20 p-3 rounded-xl border border-amber-500/20 text-amber-200">
                    <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end p-4 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={() => {
              sound.playClick(600);
              onClose();
            }}
            className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-[0_0_15px_rgba(0,210,255,0.3)]"
          >
            Понятно, играть!
          </button>
        </div>
      </div>
    </div>
  );
};
