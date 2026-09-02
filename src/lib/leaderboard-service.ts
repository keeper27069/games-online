/**
 * Leaderboard & Rankings Service
 * Computes global ranking tables, win-rate podiums, and top player stats.
 */

import { UserAccount, getAllRegisteredAccounts, getCurrentUser } from "./auth-service";

export interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  avatar: string;
  eloRating: number;
  level: number;
  totalWins: number;
  totalGames: number;
  winRate: number;
  isCurrentUser: boolean;
}

// Built-in champions / top players data for rich competitive feel
const BOT_CHAMPIONS: UserAccount[] = [
  {
    id: "champ_1",
    username: "GrandMaster_Pro",
    avatar: "👑",
    isGuest: false,
    eloRating: 2180,
    level: 42,
    xp: 12400,
    coins: 15400,
    createdAt: "2026-01-10T12:00:00Z",
    stats: { totalGames: 420, totalWins: 345, totalLosses: 75, streak: 8, bestStreak: 24 },
    gameRatings: { uno: 2200, durak: 2150, checkers: 2300, lotto: 1900, monopoly: 2100, bingo: 1850, "ping-pong": 2250, "2048": 2400 },
  },
  {
    id: "champ_2",
    username: "CyberQueen",
    avatar: "⚡",
    isGuest: false,
    eloRating: 1980,
    level: 35,
    xp: 9800,
    coins: 11200,
    createdAt: "2026-02-01T12:00:00Z",
    stats: { totalGames: 310, totalWins: 230, totalLosses: 80, streak: 5, bestStreak: 18 },
    gameRatings: { uno: 2050, durak: 2000, checkers: 1950, lotto: 2100, monopoly: 2050, bingo: 1920, "ping-pong": 1900, "2048": 2150 },
  },
  {
    id: "champ_3",
    username: "Vortex_Ace",
    avatar: "👾",
    isGuest: false,
    eloRating: 1850,
    level: 28,
    xp: 7400,
    coins: 8900,
    createdAt: "2026-02-15T12:00:00Z",
    stats: { totalGames: 240, totalWins: 165, totalLosses: 75, streak: 3, bestStreak: 14 },
    gameRatings: { uno: 1850, durak: 1900, checkers: 1800, lotto: 1750, monopoly: 1950, bingo: 1800, "ping-pong": 2000, "2048": 1900 },
  },
  {
    id: "champ_4",
    username: "LuckyStrike",
    avatar: "🎲",
    isGuest: false,
    eloRating: 1720,
    level: 22,
    xp: 5900,
    coins: 6400,
    createdAt: "2026-03-01T12:00:00Z",
    stats: { totalGames: 190, totalWins: 120, totalLosses: 70, streak: 2, bestStreak: 11 },
    gameRatings: { uno: 1700, durak: 1650, checkers: 1600, lotto: 1950, monopoly: 1800, bingo: 1850, "ping-pong": 1650, "2048": 1700 },
  },
];

export const getLeaderboardData = (gameId?: string): LeaderboardEntry[] => {
  const currentUser = getCurrentUser();
  const registered = getAllRegisteredAccounts();

  // Combine bot champions, registered users, and current user
  const pool = [...BOT_CHAMPIONS];

  for (const reg of registered) {
    if (!pool.some((p) => p.id === reg.id)) {
      pool.push(reg);
    }
  }

  if (!pool.some((p) => p.id === currentUser.id)) {
    pool.push(currentUser);
  }

  // Sort by game rating or overall ELO
  pool.sort((a, b) => {
    const eloA = gameId ? a.gameRatings?.[gameId] || a.eloRating : a.eloRating;
    const eloB = gameId ? b.gameRatings?.[gameId] || b.eloRating : b.eloRating;
    return eloB - eloA;
  });

  return pool.map((acc, index) => {
    const elo = gameId ? acc.gameRatings?.[gameId] || acc.eloRating : acc.eloRating;
    const games = acc.stats.totalGames;
    const wins = acc.stats.totalWins;
    const rate = games > 0 ? Math.round((wins / games) * 100) : 0;

    return {
      rank: index + 1,
      id: acc.id,
      username: acc.username,
      avatar: acc.avatar,
      eloRating: elo,
      level: acc.level,
      totalWins: wins,
      totalGames: games,
      winRate: rate,
      isCurrentUser: acc.id === currentUser.id,
    };
  });
};
