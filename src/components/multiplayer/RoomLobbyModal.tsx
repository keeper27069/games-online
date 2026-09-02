"use client";

import React, { useState, useEffect } from "react";
import { multiplayerManager, MultiplayerGameRoom, RoomParticipant } from "@/lib/multiplayer-room";
import { sound } from "@/lib/sound";
import { Users, Copy, Check, Plus, Play, X, UserPlus, Sparkles, Shield, Bot } from "lucide-react";
import { getCurrentUser } from "@/lib/auth-service";

interface RoomLobbyModalProps {
  gameId: string;
  isOpen: boolean;
  onClose: () => void;
  onGameStart: () => void;
}

export const RoomLobbyModal: React.FC<RoomLobbyModalProps> = ({
  gameId,
  isOpen,
  onClose,
  onGameStart,
}) => {
  const [room, setRoom] = useState<MultiplayerGameRoom | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUser = getCurrentUser();

  useEffect(() => {
    if (isOpen && !room) {
      // Auto-create initial room if not joined
      const created = multiplayerManager.createRoom(gameId, 4);
      setRoom(created);
    }

    const unsub = multiplayerManager.onRoomUpdate((updated) => {
      setRoom({ ...updated });
      if (updated.status === "in_game") {
        sound.playWin();
        onGameStart();
      }
    });

    return () => {
      unsub();
    };
  }, [isOpen, gameId, onGameStart, room]);

  if (!isOpen || !room) return null;

  const isHost = room.hostId === currentUser.id;
  const currentParticipant = room.participants.find((p) => p.id === currentUser.id);

  const copyRoomCode = () => {
    sound.playClick(700);
    navigator.clipboard.writeText(room.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode) return;
    sound.playClick(600);
    setError(null);

    const res = multiplayerManager.joinRoom(joinCode.trim().toUpperCase());
    if (res.success && res.room) {
      setRoom(res.room);
      sound.playWin();
    } else {
      setError(res.error || "Не удалось подключиться к комнате");
      sound.playError();
    }
  };

  const handleAddBot = () => {
    sound.playClick(600);
    multiplayerManager.addBotToRoom();
  };

  const handleToggleReady = () => {
    sound.playClick(600);
    multiplayerManager.toggleReady();
  };

  const handleStartGame = () => {
    sound.playWin();
    multiplayerManager.startRoomGame();
    onGameStart();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-lg my-auto rounded-3xl glass-panel-glow border border-cyan-500/40 shadow-2xl p-5 sm:p-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(0,210,255,0.4)]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Онлайн-Комната (Мультиплеер)</h3>
              <p className="text-xs text-slate-400">Играйте с реальными игроками или друзьями</p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick(400);
              multiplayerManager.leaveRoom();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Room Code Badge & Copy */}
        <div className="my-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Код вашей комнаты
            </span>
            <span className="text-2xl font-black text-cyan-400 tracking-widest text-glow-blue">
              {room.roomCode}
            </span>
          </div>

          <button
            onClick={copyRoomCode}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900 text-xs font-bold transition-all shadow-[0_0_12px_rgba(0,210,255,0.2)]"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Скопировано!" : "Копировать код"}</span>
          </button>
        </div>

        {/* Join by Code input */}
        <form onSubmit={handleJoinByCode} className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Ввести код другой комнаты..."
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono tracking-wider placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 transition-all"
          >
            Подключиться
          </button>
        </form>

        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Connected Participants List */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
            <span>Игроки в комнате ({room.participants.length}/{room.maxPlayers})</span>
            {isHost && room.participants.length < room.maxPlayers && (
              <button
                onClick={handleAddBot}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
              >
                <Bot className="w-3.5 h-3.5" />
                Добавить бота
              </button>
            )}
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {room.participants.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="text-2xl">{player.avatar}</div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white">{player.username}</span>
                      {player.isHost && (
                        <span className="text-[9px] px-1 rounded bg-amber-950 border border-amber-500/30 text-amber-300 font-bold">
                          Хост
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      ELO: <span className="text-cyan-400 font-bold">{player.eloRating}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {player.isReady ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-black flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      ГОТОВ
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold">
                      Ожидание...
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons: Ready & Start Game */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleReady}
            className={`flex-1 py-3 rounded-xl font-black text-xs transition-all shadow-md ${
              currentParticipant?.isReady
                ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                : "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
            }`}
          >
            {currentParticipant?.isReady ? "Отменить готовность" : "Я ГОТОВ К ИГРЕ"}
          </button>

          {isHost && (
            <button
              onClick={handleStartGame}
              disabled={room.participants.length < 2}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(0,210,255,0.4)] hover:scale-102 active:scale-98 disabled:opacity-40 transition-all flex items-center justify-center gap-1.5"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              НАЧАТЬ ИГРУ
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
