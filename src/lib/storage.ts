/**
 * Local Storage and User Statistics Manager
 */

export interface GameStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  highScore: number;
  bestTimeSeconds?: number;
}

export interface UserProfile {
  name: string;
  avatar: string;
  theme: "cyber" | "neon" | "retro";
}

const DEFAULT_PROFILE: UserProfile = {
  name: "Игрок #1",
  avatar: "🎮",
  theme: "cyber",
};

export const getStoredProfile = (): UserProfile => {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const data = localStorage.getItem("games_user_profile");
    return data ? JSON.parse(data) : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
};

export const saveStoredProfile = (profile: Partial<UserProfile>): UserProfile => {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const current = getStoredProfile();
    const updated = { ...current, ...profile };
    localStorage.setItem("games_user_profile", JSON.stringify(updated));
    return updated;
  } catch {
    return DEFAULT_PROFILE;
  }
};

export const getGameStats = (gameId: string): GameStats => {
  if (typeof window === "undefined") {
    return { gamesPlayed: 0, wins: 0, losses: 0, highScore: 0 };
  }
  try {
    const data = localStorage.getItem(`games_stats_${gameId}`);
    return data ? JSON.parse(data) : { gamesPlayed: 0, wins: 0, losses: 0, highScore: 0 };
  } catch {
    return { gamesPlayed: 0, wins: 0, losses: 0, highScore: 0 };
  }
};

export const recordGameResult = (
  gameId: string,
  result: "win" | "loss" | "draw",
  score?: number,
  timeSeconds?: number
): GameStats => {
  if (typeof window === "undefined") {
    return { gamesPlayed: 0, wins: 0, losses: 0, highScore: 0 };
  }
  try {
    const current = getGameStats(gameId);
    const updated: GameStats = {
      gamesPlayed: current.gamesPlayed + 1,
      wins: current.wins + (result === "win" ? 1 : 0),
      losses: current.losses + (result === "loss" ? 1 : 0),
      highScore: Math.max(current.highScore, score || 0),
      bestTimeSeconds:
        timeSeconds !== undefined
          ? current.bestTimeSeconds
            ? Math.min(current.bestTimeSeconds, timeSeconds)
            : timeSeconds
          : current.bestTimeSeconds,
    };
    localStorage.setItem(`games_stats_${gameId}`, JSON.stringify(updated));
    return updated;
  } catch {
    return { gamesPlayed: 0, wins: 0, losses: 0, highScore: 0 };
  }
};
