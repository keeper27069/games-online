"use client";

import React from "react";
import { UnoCard as UnoCardType, UnoColor } from "./types";
import { Ban, RefreshCw, Plus } from "lucide-react";

interface UnoCardProps {
  card: UnoCardType;
  onClick?: () => void;
  isPlayable?: boolean;
  isFaceDown?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const COLOR_MAP: Record<UnoColor, { bg: string; border: string; text: string; glow: string }> = {
  red: {
    bg: "bg-gradient-to-br from-red-500 to-red-700",
    border: "border-red-400",
    text: "text-red-500",
    glow: "shadow-[0_0_15px_rgba(239,68,68,0.5)]",
  },
  blue: {
    bg: "bg-gradient-to-br from-blue-500 to-blue-700",
    border: "border-blue-400",
    text: "text-blue-500",
    glow: "shadow-[0_0_15px_rgba(59,130,246,0.5)]",
  },
  green: {
    bg: "bg-gradient-to-br from-emerald-500 to-emerald-700",
    border: "border-emerald-400",
    text: "text-emerald-500",
    glow: "shadow-[0_0_15px_rgba(16,185,129,0.5)]",
  },
  yellow: {
    bg: "bg-gradient-to-br from-amber-400 to-amber-600",
    border: "border-amber-300",
    text: "text-amber-500",
    glow: "shadow-[0_0_15px_rgba(245,158,11,0.5)]",
  },
  wild: {
    bg: "bg-gradient-to-br from-purple-700 via-pink-600 to-slate-900",
    border: "border-pink-400",
    text: "text-pink-400",
    glow: "shadow-[0_0_15px_rgba(219,39,119,0.5)]",
  },
};

export const UnoCardComponent: React.FC<UnoCardProps> = ({
  card,
  onClick,
  isPlayable = true,
  isFaceDown = false,
  className = "",
  size = "md",
}) => {
  const sizeClasses = {
    sm: "w-12 h-18 text-xs",
    md: "w-20 h-28 sm:w-24 sm:h-36 text-sm sm:text-base",
    lg: "w-28 h-40 sm:w-32 sm:h-48 text-base sm:text-xl",
  }[size];

  if (isFaceDown) {
    return (
      <div
        className={`${sizeClasses} rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 border-2 border-slate-700 p-1 flex items-center justify-center shadow-lg transition-transform ${className}`}
      >
        <div className="w-full h-full rounded-lg border border-red-500/40 bg-gradient-to-br from-red-900/60 to-black flex items-center justify-center">
          <span className="font-black italic tracking-tighter text-amber-400 text-xs sm:text-sm drop-shadow">
            UNO
          </span>
        </div>
      </div>
    );
  }

  const theme = COLOR_MAP[card.color];

  const renderValue = () => {
    switch (card.value) {
      case "skip":
        return <Ban className="w-6 h-6 stroke-[2.5]" />;
      case "reverse":
        return <RefreshCw className="w-6 h-6 stroke-[2.5]" />;
      case "draw2":
        return (
          <span className="font-black tracking-tight flex items-center">
            <Plus className="w-3.5 h-3.5 stroke-[3]" />2
          </span>
        );
      case "wild":
        return (
          <div className="grid grid-cols-2 gap-0.5 w-6 h-6 rounded-full overflow-hidden border border-white/40 shadow-inner">
            <div className="bg-red-500" />
            <div className="bg-blue-500" />
            <div className="bg-amber-400" />
            <div className="bg-emerald-500" />
          </div>
        );
      case "wild_draw4":
        return (
          <div className="flex flex-col items-center">
            <div className="grid grid-cols-2 gap-0.5 w-5 h-5 rounded-full overflow-hidden border border-white/40 mb-0.5">
              <div className="bg-red-500" />
              <div className="bg-blue-500" />
              <div className="bg-amber-400" />
              <div className="bg-emerald-500" />
            </div>
            <span className="font-black text-xs leading-none">+4</span>
          </div>
        );
      default:
        return <span className="font-black text-2xl sm:text-3xl drop-shadow-md">{card.value}</span>;
    }
  };

  return (
    <button
      type="button"
      onClick={isPlayable ? onClick : undefined}
      disabled={!isPlayable && !!onClick}
      className={`${sizeClasses} ${theme.bg} rounded-2xl border-2 ${theme.border} p-1.5 flex flex-col justify-between text-white shadow-xl transition-all duration-200 select-none ${
        isPlayable && onClick
          ? "cursor-pointer hover:-translate-y-3 hover:scale-105 " + theme.glow
          : onClick
          ? "opacity-40 cursor-not-allowed saturate-50"
          : ""
      } ${className}`}
    >
      {/* Top Left Corner */}
      <div className="text-[10px] sm:text-xs font-black self-start leading-none drop-shadow">
        {card.value === "draw2" ? "+2" : card.value === "wild_draw4" ? "+4" : card.value.toUpperCase()}
      </div>

      {/* Center Ellipse with value */}
      <div className="w-full flex-1 mx-auto my-0.5 rounded-full bg-white/95 flex items-center justify-center shadow-inner text-slate-950 font-black overflow-hidden transform -rotate-6">
        <div className={theme.text}>{renderValue()}</div>
      </div>

      {/* Bottom Right Corner */}
      <div className="text-[10px] sm:text-xs font-black self-end leading-none drop-shadow rotate-180">
        {card.value === "draw2" ? "+2" : card.value === "wild_draw4" ? "+4" : card.value.toUpperCase()}
      </div>
    </button>
  );
};
