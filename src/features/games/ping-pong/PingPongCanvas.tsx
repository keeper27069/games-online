"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { PingPongMode, Ball, Paddle, SparkParticle, PingPongGameState } from "./types";
import { GameOverModal } from "@/components/ui/GameOverModal";
import { sound } from "@/lib/sound";
import { recordGameResult } from "@/lib/storage";
import { Play, Pause, RotateCcw, Zap, Users, User, ArrowUp, ArrowDown } from "lucide-react";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 480;
const WIN_SCORE = 11;

export const PingPongCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [mode, setMode] = useState<PingPongMode>("1p_normal");
  const [gameState, setGameState] = useState<PingPongGameState>({
    mode: "1p_normal",
    p1Score: 0,
    p2Score: 0,
    rallyCount: 0,
    maxRally: 0,
    status: "ready",
    winner: null,
  });

  const [isGameOverOpen, setIsGameOverOpen] = useState(false);

  // Mutable Game Physics Refs
  const ballRef = useRef<Ball>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    vx: 5,
    vy: 2,
    radius: 8,
    speed: 6,
  });

  const p1Ref = useRef<Paddle>({
    x: 20,
    y: CANVAS_HEIGHT / 2 - 40,
    width: 12,
    height: 80,
    vy: 0,
    speed: 7,
    score: 0,
  });

  const p2Ref = useRef<Paddle>({
    x: CANVAS_WIDTH - 32,
    y: CANVAS_HEIGHT / 2 - 40,
    width: 12,
    height: 80,
    vy: 0,
    speed: 6,
    score: 0,
  });

  const keysRef = useRef<Record<string, boolean>>({});
  const particlesRef = useRef<SparkParticle[]>([]);
  const animFrameIdRef = useRef<number | null>(null);
  const rallyRef = useRef(0);
  const maxRallyRef = useRef(0);

  // Spawn spark particles on hit
  const createSparks = (x: number, y: number, color: string) => {
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1,
        radius: Math.random() * 3 + 1,
      });
    }
  };

  // Reset ball position after point
  const resetBall = (direction: 1 | -1) => {
    const ball = ballRef.current;
    ball.x = CANVAS_WIDTH / 2;
    ball.y = CANVAS_HEIGHT / 2;
    ball.speed = 6;
    const angle = (Math.random() * Math.PI) / 4 - Math.PI / 8;
    ball.vx = direction * ball.speed * Math.cos(angle);
    ball.vy = ball.speed * Math.sin(angle);
    rallyRef.current = 0;
    setGameState((prev) => ({ ...prev, rallyCount: 0 }));
  };

  // Start game loop
  const startGame = () => {
    sound.playClick(800);
    resetBall(Math.random() > 0.5 ? 1 : -1);
    setGameState((prev) => ({ ...prev, status: "playing" }));
  };

  // Check victory
  const checkMatchOver = (p1Score: number, p2Score: number) => {
    if (p1Score >= WIN_SCORE && p1Score - p2Score >= 2) {
      setGameState((prev) => ({
        ...prev,
        status: "gameover",
        winner: "player1",
        p1Score,
        p2Score,
      }));
      setIsGameOverOpen(true);
      recordGameResult("ping-pong", "win", p1Score * 100);
      return true;
    }
    if (p2Score >= WIN_SCORE && p2Score - p1Score >= 2) {
      setGameState((prev) => ({
        ...prev,
        status: "gameover",
        winner: "player2",
        p1Score,
        p2Score,
      }));
      setIsGameOverOpen(true);
      recordGameResult("ping-pong", "loss", p1Score * 50);
      return true;
    }
    return false;
  };

  // Main 60 FPS Physics Engine Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const ball = ballRef.current;
      const p1 = p1Ref.current;
      const p2 = p2Ref.current;
      const keys = keysRef.current;

      if (gameState.status === "playing") {
        // --- Player 1 Input (W / S or Up / Down in 1P) ---
        if (keys["KeyW"] || (mode !== "2p_local" && keys["ArrowUp"])) {
          p1.y = Math.max(10, p1.y - p1.speed);
        }
        if (keys["KeyS"] || (mode !== "2p_local" && keys["ArrowDown"])) {
          p1.y = Math.min(CANVAS_HEIGHT - p1.height - 10, p1.y + p1.speed);
        }

        // --- Player 2 Input / AI Logic ---
        if (mode === "2p_local") {
          if (keys["ArrowUp"]) {
            p2.y = Math.max(10, p2.y - p2.speed);
          }
          if (keys["ArrowDown"]) {
            p2.y = Math.min(CANVAS_HEIGHT - p2.height - 10, p2.y + p2.speed);
          }
        } else {
          // AI Paddle tracking with target lag
          const aiSpeed = mode === "1p_easy" ? 3.5 : mode === "1p_normal" ? 5.2 : 6.8;
          const targetY = ball.y - p2.height / 2;
          const diff = targetY - p2.y;

          if (Math.abs(diff) > 4) {
            p2.y += Math.sign(diff) * Math.min(Math.abs(diff), aiSpeed);
          }
          p2.y = Math.max(10, Math.min(CANVAS_HEIGHT - p2.height - 10, p2.y));
        }

        // --- Ball Physics ---
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Top & Bottom Wall Bounce
        if (ball.y - ball.radius <= 0) {
          ball.y = ball.radius;
          ball.vy = Math.abs(ball.vy);
          sound.playPingPongHit(true);
          createSparks(ball.x, ball.y, "#00d2ff");
        } else if (ball.y + ball.radius >= CANVAS_HEIGHT) {
          ball.y = CANVAS_HEIGHT - ball.radius;
          ball.vy = -Math.abs(ball.vy);
          sound.playPingPongHit(true);
          createSparks(ball.x, ball.y, "#00d2ff");
        }

        // Left Paddle Collision (Player 1)
        if (
          ball.x - ball.radius <= p1.x + p1.width &&
          ball.x + ball.radius >= p1.x &&
          ball.y >= p1.y &&
          ball.y <= p1.y + p1.height
        ) {
          ball.x = p1.x + p1.width + ball.radius;
          rallyRef.current += 1;
          maxRallyRef.current = Math.max(maxRallyRef.current, rallyRef.current);
          setGameState((prev) => ({
            ...prev,
            rallyCount: rallyRef.current,
            maxRally: maxRallyRef.current,
          }));

          // Angular deflection
          const hitOffset = (ball.y - (p1.y + p1.height / 2)) / (p1.height / 2);
          const maxBounceAngle = (5 * Math.PI) / 12; // 75 degrees
          const bounceAngle = hitOffset * maxBounceAngle;

          ball.speed = Math.min(ball.speed + 0.35, 14);
          ball.vx = ball.speed * Math.cos(bounceAngle);
          ball.vy = ball.speed * Math.sin(bounceAngle);

          sound.playPingPongHit(false);
          createSparks(ball.x, ball.y, "#00d2ff");
        }

        // Right Paddle Collision (Player 2 / AI)
        if (
          ball.x + ball.radius >= p2.x &&
          ball.x - ball.radius <= p2.x + p2.width &&
          ball.y >= p2.y &&
          ball.y <= p2.y + p2.height
        ) {
          ball.x = p2.x - ball.radius;
          rallyRef.current += 1;
          maxRallyRef.current = Math.max(maxRallyRef.current, rallyRef.current);
          setGameState((prev) => ({
            ...prev,
            rallyCount: rallyRef.current,
            maxRally: maxRallyRef.current,
          }));

          const hitOffset = (ball.y - (p2.y + p2.height / 2)) / (p2.height / 2);
          const maxBounceAngle = (5 * Math.PI) / 12;
          const bounceAngle = hitOffset * maxBounceAngle;

          ball.speed = Math.min(ball.speed + 0.35, 14);
          ball.vx = -ball.speed * Math.cos(bounceAngle);
          ball.vy = ball.speed * Math.sin(bounceAngle);

          sound.playPingPongHit(false);
          createSparks(ball.x, ball.y, "#ff2a85");
        }

        // Scoring: Goal on Right (Player 1 Scores)
        if (ball.x > CANVAS_WIDTH + 20) {
          p1.score += 1;
          sound.playPingPongScore(true);
          setGameState((prev) => ({ ...prev, p1Score: p1.score, p2Score: p2.score }));
          if (!checkMatchOver(p1.score, p2.score)) {
            resetBall(-1);
          }
        }

        // Scoring: Goal on Left (Player 2 Scores)
        if (ball.x < -20) {
          p2.score += 1;
          sound.playPingPongScore(false);
          setGameState((prev) => ({ ...prev, p1Score: p1.score, p2Score: p2.score }));
          if (!checkMatchOver(p1.score, p2.score)) {
            resetBall(1);
          }
        }
      }

      // --- Rendering Graphics ---
      ctx.fillStyle = "#080a14";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Neon Table Border
      ctx.strokeStyle = "rgba(0, 210, 255, 0.25)";
      ctx.lineWidth = 4;
      ctx.strokeRect(6, 6, CANVAS_WIDTH - 12, CANVAS_HEIGHT - 12);

      // Center dashed net
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2, 6);
      ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 6);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Player 1 Paddle (Cyan Neon)
      ctx.shadowColor = "#00d2ff";
      ctx.shadowBlur = 15;
      ctx.fillStyle = "#00d2ff";
      ctx.beginPath();
      ctx.roundRect(p1.x, p1.y, p1.width, p1.height, 6);
      ctx.fill();

      // Draw Player 2 Paddle (Pink Neon)
      ctx.shadowColor = "#ff2a85";
      ctx.shadowBlur = 15;
      ctx.fillStyle = "#ff2a85";
      ctx.beginPath();
      ctx.roundRect(p2.x, p2.y, p2.width, p2.height, 6);
      ctx.fill();

      // Draw Ball with Glow
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = 20;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Render & Update Spark Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.04;

        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [gameState.status, mode]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Mouse / Touch paddle tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState.status !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleY = CANVAS_HEIGHT / rect.height;
    const mouseY = (e.clientY - rect.top) * scaleY;
    p1Ref.current.y = Math.max(10, Math.min(CANVAS_HEIGHT - p1Ref.current.height - 10, mouseY - p1Ref.current.height / 2));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (gameState.status !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleY = CANVAS_HEIGHT / rect.height;
    const touchY = (e.touches[0].clientY - rect.top) * scaleY;
    p1Ref.current.y = Math.max(10, Math.min(CANVAS_HEIGHT - p1Ref.current.height - 10, touchY - p1Ref.current.height / 2));
  };

  const restartMatch = () => {
    setIsGameOverOpen(false);
    p1Ref.current.score = 0;
    p2Ref.current.score = 0;
    rallyRef.current = 0;
    setGameState({
      mode,
      p1Score: 0,
      p2Score: 0,
      rallyCount: 0,
      maxRally: 0,
      status: "ready",
      winner: null,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-between min-h-[640px] p-3 sm:p-6 rounded-3xl bg-slate-950 border border-pink-500/30 shadow-2xl relative select-none">
      {/* Top Header: Scores, Rally & Mode Selector */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
        {/* Score Board */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-cyan-400">Игрок 1</span>
            <span className="text-3xl font-black text-cyan-300 text-glow-blue">
              {gameState.p1Score}
            </span>
          </div>
          <span className="text-xl font-black text-slate-600">:</span>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black text-pink-400 text-glow-pink">
              {gameState.p2Score}
            </span>
            <span className="text-xs font-bold text-pink-400">
              {mode === "2p_local" ? "Игрок 2" : "Бот"}
            </span>
          </div>
        </div>

        {/* Rally counter */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">Ралли:</span>
          <span className="text-amber-300 font-extrabold">{gameState.rallyCount}</span>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => {
              sound.playClick(600);
              setMode("1p_normal");
              restartMatch();
            }}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              mode === "1p_normal"
                ? "bg-cyan-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            1P Нормально
          </button>
          <button
            onClick={() => {
              sound.playClick(600);
              setMode("1p_hard");
              restartMatch();
            }}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              mode === "1p_hard"
                ? "bg-pink-500 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            1P Эксперт
          </button>
          <button
            onClick={() => {
              sound.playClick(600);
              setMode("2p_local");
              restartMatch();
            }}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
              mode === "2p_local"
                ? "bg-purple-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            2 Игрока
          </button>
        </div>
      </div>

      {/* HTML5 Canvas Playing Field */}
      <div className="my-4 relative w-full aspect-[800/480] max-w-[800px] rounded-2xl overflow-hidden border-2 border-slate-800 shadow-[0_0_40px_rgba(0,0,0,0.8)]">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          className="w-full h-full bg-slate-950 cursor-crosshair"
        />

        {/* Start Overlay */}
        {gameState.status === "ready" && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
            <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 mb-2">
              НЕОНОВЫЙ ПИНГ-ПОНГ
            </h3>
            <p className="text-xs text-slate-300 max-w-sm mb-6">
              Игра идет до 11 очков с перевесом в 2 очка. Управляйте ракеткой мышью, тач-свайпом или клавишами W/S.
            </p>
            <button
              onClick={startGame}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-slate-950 font-black text-sm shadow-[0_0_25px_rgba(0,210,255,0.5)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              НАЧАТЬ МАТЧ
            </button>
          </div>
        )}
      </div>

      {/* Mobile Touch Control Buttons */}
      <div className="flex sm:hidden items-center justify-between w-full px-4 mb-2">
        <button
          onTouchStart={() => (keysRef.current["KeyW"] = true)}
          onTouchEnd={() => (keysRef.current["KeyW"] = false)}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-700 text-cyan-400 active:bg-cyan-950"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
        <span className="text-[10px] text-slate-400">Сенсорные стрелки</span>
        <button
          onTouchStart={() => (keysRef.current["KeyS"] = true)}
          onTouchEnd={() => (keysRef.current["KeyS"] = false)}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-700 text-cyan-400 active:bg-cyan-950"
        >
          <ArrowDown className="w-6 h-6" />
        </button>
      </div>

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={isGameOverOpen}
        isWinner={gameState.winner === "player1"}
        title={gameState.winner === "player1" ? "Победа в матче!" : "Поражение в матче"}
        subtitle={
          gameState.winner === "player1"
            ? `Вы победили со счетом ${gameState.p1Score} : ${gameState.p2Score}!`
            : `Соперник победил со счетом ${gameState.p2Score} : ${gameState.p1Score}.`
        }
        stats={[
          { label: "Ваш счет", value: gameState.p1Score },
          { label: "Счет соперника", value: gameState.p2Score },
          { label: "Макс. ралли", value: gameState.maxRally },
        ]}
        onRestart={restartMatch}
      />
    </div>
  );
};
