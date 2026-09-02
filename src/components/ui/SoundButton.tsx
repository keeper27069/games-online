"use client";

import React, { useState, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { sound } from "@/lib/sound";

interface SoundButtonProps {
  className?: string;
  showLabel?: boolean;
}

export const SoundButton: React.FC<SoundButtonProps> = ({ className = "", showLabel = false }) => {
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setIsMuted(sound.getMuted());
  }, []);

  const handleToggle = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      sound.playClick(800);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
        isMuted
          ? "bg-slate-900/60 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600"
          : "bg-cyan-950/40 border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/60 hover:border-cyan-400 shadow-[0_0_12px_rgba(0,210,255,0.2)]"
      } ${className}`}
      title={isMuted ? "Включить звук" : "Выключить звук"}
      aria-label={isMuted ? "Включить звук" : "Выключить звук"}
    >
      {isMuted ? (
        <VolumeX className="w-4 h-4 text-rose-400" />
      ) : (
        <div className="flex items-center gap-1.5">
          <Volume2 className="w-4 h-4 text-cyan-400" />
          <div className="flex items-end gap-0.5 h-3">
            <span className="w-0.5 h-2 bg-cyan-400 rounded-full animate-pulse" />
            <span className="w-0.5 h-3 bg-cyan-400 rounded-full animate-pulse delay-75" />
            <span className="w-0.5 h-1.5 bg-cyan-400 rounded-full animate-pulse delay-150" />
          </div>
        </div>
      )}
      {showLabel && <span>{isMuted ? "Без звука" : "Звук ВКЛ"}</span>}
    </button>
  );
};
