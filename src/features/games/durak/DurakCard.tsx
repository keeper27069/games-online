"use client";

import React from "react";
import { DurakCard as DurakCardType, CardSuit } from "./types";

interface DurakCardProps {
  card: DurakCardType;
  isTrump?: boolean;
  onClick?: () => void;
  isPlayable?: boolean;
  isFaceDown?: boolean;
  isSelected?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SUIT_SYMBOLS: Record<CardSuit, { symbol: string; color: string }> = {
  hearts: { symbol: "♥", color: "text-rose-500" },
  diamonds: { symbol: "♦", color: "text-amber-500" },
  clubs: { symbol: "♣", color: "text-slate-900" },
  spades: { symbol: "♠", color: "text-slate-950" },
};

export const DurakCardComponent: React.FC<DurakCardProps> = ({
  card,
  isTrump = false,
  onClick,
  isPlayable = true,
  isFaceDown = false,
  isSelected = false,
  className = "",
  size = "md",
}) => {
  const sizeClasses = {
    sm: "w-10 h-16 text-xs",
    md: "w-16 h-24 sm:w-20 sm:h-32 text-sm sm:text-base",
    lg: "w-24 h-36 sm:w-28 sm:h-44 text-base sm:text-lg",
  }[size];

  if (isFaceDown) {
    return (
      <div
        className={`${sizeClasses} rounded-xl bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 border-2 border-slate-700 p-1 flex items-center justify-center shadow-lg select-none ${className}`}
      >
        <div className="w-full h-full rounded-lg border border-cyan-500/30 bg-radial-gradient flex items-center justify-center bg-slate-900/80">
          <span className="text-cyan-400 font-bold text-xs opacity-60">♠ ♣</span>
        </div>
      </div>
    );
  }

  const suitInfo = SUIT_SYMBOLS[card.suit];

  return (
    <button
      type="button"
      onClick={isPlayable ? onClick : undefined}
      disabled={!isPlayable && !!onClick}
      className={`${sizeClasses} relative rounded-xl bg-white border-2 flex flex-col justify-between p-1.5 sm:p-2 shadow-lg transition-all duration-200 select-none ${
        isSelected
          ? "border-amber-400 -translate-y-4 ring-4 ring-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.6)]"
          : isTrump
          ? "border-amber-400/80 shadow-[0_0_12px_rgba(251,191,36,0.3)]"
          : "border-slate-300 hover:border-cyan-400"
      } ${
        isPlayable && onClick
          ? "cursor-pointer hover:-translate-y-2 hover:shadow-xl"
          : onClick
          ? "opacity-50 cursor-not-allowed"
          : ""
      } ${className}`}
    >
      {/* Trump badge */}
      {isTrump && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 rounded-full shadow-md">
          КОЗЫРЬ
        </span>
      )}

      {/* Top Left corner */}
      <div className={`flex flex-col items-start leading-none font-bold ${suitInfo.color}`}>
        <span className="text-xs sm:text-sm font-black">{card.rank}</span>
        <span className="text-xs">{suitInfo.symbol}</span>
      </div>

      {/* Center large suit icon */}
      <div className={`text-2xl sm:text-3xl self-center font-bold ${suitInfo.color}`}>
        {suitInfo.symbol}
      </div>

      {/* Bottom Right corner */}
      <div className={`flex flex-col items-end leading-none font-bold rotate-180 ${suitInfo.color}`}>
        <span className="text-xs sm:text-sm font-black">{card.rank}</span>
        <span className="text-xs">{suitInfo.symbol}</span>
      </div>
    </button>
  );
};
