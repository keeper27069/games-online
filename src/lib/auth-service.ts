/**
 * Authentication and User Profile Management Service
 * Supports persistent registered accounts, 1-click guest login,
 * ELO ratings, levels, XP, coin economy, and match history.
 */

export interface UserAccount {
  id: string;
  email?: string;
  username: string;
  avatar: string;
  isGuest: boolean;
  eloRating: number;
  level: number;
  xp: number;
  coins: number;
  createdAt: string;
  stats: {
    totalGames: number;
    totalWins: number;
    totalLosses: number;
    streak: number;
    bestStreak: number;
  };
  gameRatings: Record<string, number>; // per-game ELO
}

const STORAGE_KEY_AUTH_USER = "arcadehub_auth_user";
const STORAGE_KEY_ALL_ACCOUNTS = "arcadehub_all_accounts";

export const generateGuestId = (): string => {
  return `guest_${Math.random().toString(36).substring(2, 9)}`;
};

export const createDefaultAccount = (username = "Игрок #1", avatar = "🎮", isGuest = true, email?: string): UserAccount => {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return {
    id: isGuest ? generateGuestId() : `user_${Date.now()}`,
    email,
    username: isGuest ? `Гость_${randomSuffix}` : username,
    avatar,
    isGuest,
    eloRating: 1200,
    level: 1,
    xp: 0,
    coins: 500,
    createdAt: new Date().toISOString(),
    stats: {
      totalGames: 0,
      totalWins: 0,
      totalLosses: 0,
      streak: 0,
      bestStreak: 0,
    },
    gameRatings: {
      uno: 1200,
      durak: 1200,
      checkers: 1200,
      lotto: 1200,
      monopoly: 1200,
      bingo: 1200,
      "ping-pong": 1200,
      "2048": 1200,
    },
  };
};

export const getCurrentUser = (): UserAccount => {
  if (typeof window === "undefined") {
    return createDefaultAccount();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH_USER);
    if (raw) {
      return JSON.parse(raw);
    }
    const defaultAcc = createDefaultAccount();
    localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(defaultAcc));
    return defaultAcc;
  } catch {
    return createDefaultAccount();
  }
};

export const saveCurrentUser = (user: UserAccount): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));

    // Also update in registered accounts index
    const all = getAllRegisteredAccounts();
    const idx = all.findIndex((a) => a.id === user.id);
    if (idx >= 0) {
      all[idx] = user;
    } else {
      all.push(user);
    }
    localStorage.setItem(STORAGE_KEY_ALL_ACCOUNTS, JSON.stringify(all));
  } catch {}
};

export const getAllRegisteredAccounts = (): UserAccount[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ALL_ACCOUNTS);
    if (raw) return JSON.parse(raw);
    return [];
  } catch {
    return [];
  }
};

export const registerAccount = (email: string, username: string, passwordHash: string, avatar = "🚀"): { success: boolean; user?: UserAccount; error?: string } => {
  if (typeof window === "undefined") return { success: false, error: "Client-side only" };

  const all = getAllRegisteredAccounts();
  if (all.some((a) => a.email?.toLowerCase() === email.toLowerCase())) {
    return { success: false, error: "Пользователь с таким Email уже зарегистрирован!" };
  }

  const newUser: UserAccount = {
    ...createDefaultAccount(username, avatar, false, email),
    coins: 1000, // Welcome bonus
  };

  all.push(newUser);
  localStorage.setItem(STORAGE_KEY_ALL_ACCOUNTS, JSON.stringify(all));
  saveCurrentUser(newUser);

  return { success: true, user: newUser };
};

export const loginAccount = (email: string, passwordHash: string): { success: boolean; user?: UserAccount; error?: string } => {
  if (typeof window === "undefined") return { success: false, error: "Client-side only" };

  const all = getAllRegisteredAccounts();
  const found = all.find((a) => a.email?.toLowerCase() === email.toLowerCase());

  if (!found) {
    return { success: false, error: "Пользователь с таким Email не найден." };
  }

  saveCurrentUser(found);
  return { success: true, user: found };
};

export const logoutAccount = (): UserAccount => {
  const guest = createDefaultAccount();
  saveCurrentUser(guest);
  return guest;
};

/**
 * Calculates ELO and XP rewards after game completion
 */
export const recordMatchOutcome = (
  gameId: string,
  isWinner: boolean,
  opponentElo = 1200
): UserAccount => {
  const user = getCurrentUser();

  // ELO calculation (K-factor = 32)
  const currentElo = user.gameRatings[gameId] || user.eloRating;
  const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - currentElo) / 400));
  const actualScore = isWinner ? 1 : 0;
  const eloDelta = Math.round(32 * (actualScore - expectedScore));

  const newGameElo = Math.max(800, currentElo + eloDelta);
  const newOverallElo = Math.max(800, user.eloRating + Math.round(eloDelta * 0.7));

  // XP & Coins reward
  const xpGained = isWinner ? 100 : 35;
  const coinsGained = isWinner ? 50 : 15;

  const totalXp = user.xp + xpGained;
  const newLevel = Math.floor(totalXp / 300) + 1;

  const nextStreak = isWinner ? user.stats.streak + 1 : 0;
  const bestStreak = Math.max(user.stats.bestStreak, nextStreak);

  const updated: UserAccount = {
    ...user,
    eloRating: newOverallElo,
    level: newLevel,
    xp: totalXp,
    coins: user.coins + coinsGained,
    stats: {
      totalGames: user.stats.totalGames + 1,
      totalWins: user.stats.totalWins + (isWinner ? 1 : 0),
      totalLosses: user.stats.totalLosses + (isWinner ? 0 : 1),
      streak: nextStreak,
      bestStreak: bestStreak,
    },
    gameRatings: {
      ...user.gameRatings,
      [gameId]: newGameElo,
    },
  };

  saveCurrentUser(updated);
  return updated;
};
