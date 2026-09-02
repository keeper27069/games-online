"use client";

import React from "react";
import { motion } from "framer-motion";
import { Tile } from "./types";

interface Tile2048Props {
  tile: Tile;
}

const TILE_COLORS: Record<number, { bg: string; text: string; glow?: string; border?: string }> = {
  2: { bg: "bg-slate-800", text: "text-slate-200", border: "border-slate-700" },
  4: { bg: "bg-slate-700", text: "text-slate-100", border: "border-slate-600" },
  8: { bg: "bg-amber-600", text: "text-white", glow: "shadow-[0_0_12px_rgba(245,158,11,0.4)]" },
  16: { bg: "bg-orange-600", text: "text-white", glow: "shadow-[0_0_15px_rgba(234,88,12,0.4)]" },
  32: { bg: "bg-rose-600", text: "text-white", glow: "shadow-[0_0_15px_rgba(225,29,72,0.4)]" },
  64: { bg: "bg-red-600", text: "text-white", glow: "shadow-[0_0_18px_rgba(220,38,38,0.5)]" },
  128: { bg: "bg-amber-500", text: "text-slate-950", glow: "shadow-[0_0_20px_rgba(245,158,11,0.6)]" },
  256: { bg: "bg-yellow-400", text: "text-slate-950", glow: "shadow-[0_0_25px_rgba(250,204,21,0.7)]" },
  512: { bg: "bg-emerald-500", text: "text-white", glow: "shadow-[0_0_25px_rgba(16,185,129,0.7)]" },
  1024: { bg: "bg-cyan-500", text: "text-slate-950", glow: "shadow-[0_0_30px_rgba(6,182,212,0.8)]" },
  2048: {
    bg: "bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600",
    text: "text-white",
    glow: "shadow-[0_0_35px_rgba(0,210,255,0.9)]",
  },
};

export const Tile2048Component: React.FC<Tile2048Props> = ({ tile }) => {
  const theme =
    TILE_COLORS[tile.value] || {
      bg: "bg-gradient-to-tr from-pink-500 to-rose-600",
      text: "text-white",
      glow: "shadow-[0_0_35px_rgba(255,42,133,0.9)]",
    };

  // Convert row/col to percentage coordinates in 4x4 grid (with gaps)
  // Grid width: 100%, 4 items with gap 12px
  const x = tile.col * 25;
  const y = tile.row * 25;

  return (
    <motion.div
      layoutId={tile.id}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 450, damping: 28 }}
      style={{
        left: `calc(${x}% + 4px)`,
        top: `calc(${y}% + 4px)`,
        width: "calc(25% - 8px)",
        height: "calc(25% - 8px)",
      }}
      className={`absolute flex items-center justify-center rounded-2xl font-black ${theme.bg} ${theme.text} ${
        theme.glow || ""
      } ${theme.border || "border border-white/20"} select-none`}
    >
      <span
        className={`drop-shadow font-black ${
          tile.value >= 1024 ? "text-xl sm:text-2xl" : tile.value >= 128 ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"
        }`}
      >
        {tile.value}
      </span>
    </motion.div>
  );
};
