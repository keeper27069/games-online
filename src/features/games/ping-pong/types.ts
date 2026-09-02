export type PingPongMode = "1p_easy" | "1p_normal" | "1p_hard" | "2p_local";

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  speed: number;
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
  speed: number;
  score: number;
}

export interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  radius: number;
}

export interface PingPongGameState {
  mode: PingPongMode;
  p1Score: number;
  p2Score: number;
  rallyCount: number;
  maxRally: number;
  status: "ready" | "playing" | "paused" | "gameover";
  winner: "player1" | "player2" | null;
}
