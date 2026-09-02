"use client";

import React from "react";

interface LottoBarrelProps {
  number: number;
  size?: "sm" | "md" | "lg";
  isAnimated?: boolean;
}

export const LottoBarrel: React.FC<LottoBarrelProps> = ({
  number,
  size = "md",
  isAnimated = false,
}) => {
  const sizeClasses = {
    sm: "w-8 h-10 text-xs",
    md: "w-14 h-18 sm:w-16 sm:h-20 text-xl sm:text-2xl",
    lg: "w-24 h-28 sm:w-28 sm:h-36 text-3xl sm:text-4xl",
  }[size];

  return (
    <div
      className={`${sizeClasses} relative rounded-2xl bg-gradient-to-b from-[#d4a373] via-[#bc6c25] to-[#8c4b14] border-2 border-[#6f370f] flex flex-col items-center justify-center text-[#7f1d1d] font-black shadow-[0_10px_25px_rgba(0,0,0,0.5)] select-none ${
        isAnimated ? "animate-bounce" : ""
      }`}
    >
      {/* Top and bottom metal rims on barrel */}
      <div className="absolute top-1.5 inset-x-1 h-1 rounded-full bg-amber-200/50 border-t border-amber-900/40" />
      <div className="absolute bottom-1.5 inset-x-1 h-1 rounded-full bg-amber-200/50 border-b border-amber-900/40" />

      {/* Engraved Barrel Number with red border */}
      <div className="w-[75%] h-[60%] rounded-full bg-[#faedcd] border border-[#d4a373] flex items-center justify-center shadow-inner">
        <span className="drop-shadow tracking-tight font-black">{number}</span>
      </div>
    </div>
  );
};
