"use client";

import React, { useState, useEffect, useRef } from "react";
import { User, Lock, Mail, Sparkles, X, Check, UserPlus, LogIn, AlertCircle, Loader2 } from "lucide-react";
import { registerAccount, loginAccount, getCurrentUser, saveCurrentUser, createDefaultAccount, UserAccount, sanitizeInput } from "@/lib/auth-service";
import { sound } from "@/lib/sound";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserAccount) => void;
}

const AVATARS = ["🎮", "👾", "🚀", "⚡", "👑", "🔥", "🐱", "🎲", "🎩", "🃏"];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [tab, setTab] = useState<"login" | "register" | "guest">("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("🚀");
  const [error, setError] = useState<string | null>(null);
  const [canAutoRegister, setCanAutoRegister] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const initialInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus first input on open
    setTimeout(() => {
      initialInputRef.current?.focus();
    }, 100);

    // Keyboard ESC listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        sound.playClick(400);
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, tab]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setCanAutoRegister(false);
    setIsSubmitting(true);

    try {
      const res = await loginAccount(email.trim(), password);
      if (res.success && res.user) {
        sound.playWin();
        onSuccess(res.user);
        onClose();
      } else {
        setError(res.error || "Пользователь с таким Email не найден.");
        if (res.error?.includes("не найден")) {
          setCanAutoRegister(true);
        }
        sound.playError();
      }
    } catch {
      setError("Непредвиденная ошибка при входе. Попробуйте еще раз.");
      sound.playError();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickRegister = async () => {
    if (!email || !password || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const defaultNick = email.split("@")[0] || "Игрок";
      const res = await registerAccount(email.trim(), defaultNick, password, selectedAvatar);
      if (res.success && res.user) {
        sound.playWin();
        onSuccess(res.user);
        onClose();
      } else {
        setError(res.error || "Ошибка регистрации");
        sound.playError();
      }
    } catch {
      setError("Ошибка регистрации");
      sound.playError();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await registerAccount(email.trim(), username.trim(), password, selectedAvatar);
      if (res.success && res.user) {
        sound.playWin();
        onSuccess(res.user);
        onClose();
      } else {
        setError(res.error || "Ошибка регистрации");
        sound.playError();
      }
    } catch {
      setError("Непредвиденная ошибка при регистрации.");
      sound.playError();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestLogin = () => {
    sound.playClick(700);
    const cleanNick = sanitizeInput(username.trim()) || "Игрок";
    const guest = createDefaultAccount(cleanNick, selectedAvatar, true);
    saveCurrentUser(guest);
    onSuccess(guest);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md animate-fadeIn"
    >
      <div className="flex min-h-full items-center justify-center p-3 sm:p-6 text-center">
        <div
          ref={modalRef}
          className="relative w-full max-w-md transform rounded-3xl glass-panel-glow border border-cyan-500/30 shadow-2xl p-5 sm:p-6 text-left bg-slate-950/95 transition-all my-6 sm:my-8 focus:outline-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 id="auth-modal-title" className="text-lg font-black text-white">
                  Аккаунт ArcadeHub
                </h3>
                <p className="text-xs text-slate-400">Сохраняйте ELO-рейтинг и играйте онлайн</p>
              </div>
            </div>
            <button
              onClick={() => {
                sound.playClick(400);
                onClose();
              }}
              aria-label="Закрыть окно"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-cyan-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800 my-3.5 text-xs font-bold">
            <button
              onClick={() => {
                sound.playClick(500);
                setTab("login");
                setError(null);
                setCanAutoRegister(false);
              }}
              className={`min-h-[44px] rounded-xl transition-all flex items-center justify-center ${
                tab === "login"
                  ? "bg-cyan-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-400"
              }`}
            >
              Вход
            </button>
            <button
              onClick={() => {
                sound.playClick(500);
                setTab("register");
                setError(null);
                if (!username && email) {
                  setUsername(email.split("@")[0]);
                }
              }}
              className={`min-h-[44px] rounded-xl transition-all flex items-center justify-center ${
                tab === "register"
                  ? "bg-cyan-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-400"
              }`}
            >
              Регистрация
            </button>
            <button
              onClick={() => {
                sound.playClick(500);
                setTab("guest");
                setError(null);
              }}
              className={`min-h-[44px] rounded-xl transition-all flex items-center justify-center ${
                tab === "guest"
                  ? "bg-purple-600 text-white shadow"
                  : "text-slate-400 hover:text-white focus-visible:ring-2 focus-visible:ring-purple-400"
              }`}
            >
              Гость
            </button>
          </div>

          {/* Error Banner with Smart 1-Click Action */}
          {error && (
            <div className="mb-3.5 p-3 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs space-y-2 animate-fadeIn" role="alert">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>

              {canAutoRegister && (
                <div className="pt-2 border-t border-rose-800/50 flex flex-col gap-1.5">
                  <span className="text-[11px] text-slate-300">
                    Хотите создать новый аккаунт с этим email прямо сейчас?
                  </span>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleQuickRegister}
                    className="min-h-[44px] w-full px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs shadow-[0_0_12px_rgba(16,185,129,0.4)] hover:scale-102 active:scale-98 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    Создать аккаунт в 1 клик (+1000 монет)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Forms */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Email адрес</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    ref={initialInputRef}
                    type="email"
                    required
                    maxLength={128}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-base sm:text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Пароль</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    maxLength={64}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-base sm:text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-[46px] w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black text-sm shadow-[0_0_15px_rgba(0,210,255,0.4)] hover:scale-102 active:scale-98 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-4"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                Войти в профиль
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick(500);
                    setTab("register");
                    if (!username && email) setUsername(email.split("@")[0]);
                  }}
                  className="min-h-[44px] text-xs text-slate-400 hover:text-cyan-300 transition-colors"
                >
                  Нет аккаунта? <span className="font-bold text-cyan-400 underline">Зарегистрироваться</span>
                </button>
              </div>
            </form>
          )}

          {tab === "register" && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Никнейм</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    ref={initialInputRef}
                    type="text"
                    required
                    maxLength={20}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ваш никнейм..."
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-base sm:text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    maxLength={128}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-base sm:text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Пароль (мин. 4 символа)</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    minLength={4}
                    maxLength={64}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-base sm:text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Выберите аватар</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {AVATARS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => {
                        sound.playClick(600);
                        setSelectedAvatar(av);
                      }}
                      className={`min-h-[44px] rounded-xl text-lg flex items-center justify-center border transition-all ${
                        selectedAvatar === av
                          ? "bg-cyan-950 border-cyan-400 scale-105 shadow-[0_0_10px_rgba(0,210,255,0.4)]"
                          : "bg-slate-900 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-[46px] w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black text-sm shadow-[0_0_15px_rgba(0,210,255,0.4)] hover:scale-102 active:scale-98 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                Зарегистрироваться (+1000 монет)
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick(500);
                    setTab("login");
                  }}
                  className="min-h-[44px] text-xs text-slate-400 hover:text-cyan-300 transition-colors"
                >
                  Уже есть аккаунт? <span className="font-bold text-cyan-400 underline">Войти</span>
                </button>
              </div>
            </form>
          )}

          {tab === "guest" && (
            <div className="space-y-4 text-center py-2">
              <p className="text-xs text-slate-300">
                Мгновенный доступ без регистрации. Вы сможете сохранять прогресс и играть онлайн.
              </p>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1 text-left">Ваш аватар</label>
                <div className="grid grid-cols-5 gap-2">
                  {AVATARS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => {
                        sound.playClick(600);
                        setSelectedAvatar(av);
                      }}
                      className={`min-h-[44px] rounded-xl text-xl flex items-center justify-center border transition-all ${
                        selectedAvatar === av
                          ? "bg-purple-950 border-purple-400 scale-105 shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                          : "bg-slate-900 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGuestLogin}
                className="min-h-[46px] w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-sm shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Начать играть как Гость
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
