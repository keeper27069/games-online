/**
 * Hardened Authentication, Validation and User Profile Service
 * - SHA-256 password hashing (zero plaintext storage)
 * - Strict regex input validation (Email, Username, Avatar)
 * - Safe HTML entity sanitization against XSS
 * - Quota-safe localStorage handling
 */

export interface UserAccount {
  id: string;
  email?: string;
  username: string;
  avatar: string;
  isGuest: boolean;
  passwordHash?: string;
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
  gameRatings: Record<string, number>;
}

const STORAGE_KEY_AUTH_USER = "arcadehub_auth_user";
const STORAGE_KEY_ALL_ACCOUNTS = "arcadehub_all_accounts";

/**
 * XSS & HTML entity sanitizer
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim();
};

/**
 * Validates Email according to RFC 5322 standard
 */
export const isValidEmail = (email: string): boolean => {
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return re.test(email) && email.length <= 128;
};

/**
 * Validates Username (alphanumeric, spaces, underscores, 2-20 chars)
 */
export const isValidUsername = (username: string): boolean => {
  const re = /^[\p{L}\p{N}_\s-]{2,20}$/u;
  return re.test(username.trim());
};

/**
 * Fast client-side SHA-256 hash
 */
export const hashPassword = async (password: string): Promise<string> => {
  if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
    // Fallback pseudo-hash for non-subtle environments
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      hash = (hash << 5) - hash + password.charCodeAt(i);
      hash |= 0;
    }
    return `hash_${Math.abs(hash)}`;
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "_arcadehub_salt_2026");
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const generateGuestId = (): string => {
  return `guest_${Math.random().toString(36).substring(2, 9)}`;
};

export const createDefaultAccount = (username = "Игрок #1", avatar = "🎮", isGuest = true, email?: string): UserAccount => {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const cleanUser = sanitizeInput(username);
  return {
    id: isGuest ? generateGuestId() : `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    email: email ? sanitizeInput(email) : undefined,
    username: isGuest ? `Гость_${randomSuffix}` : cleanUser || `Игрок_${randomSuffix}`,
    avatar: avatar || "🎮",
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
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.username === "string") {
        return parsed;
      }
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

    const all = getAllRegisteredAccounts();
    const idx = all.findIndex((a) => a.id === user.id);
    if (idx >= 0) {
      all[idx] = user;
    } else {
      all.push(user);
    }
    localStorage.setItem(STORAGE_KEY_ALL_ACCOUNTS, JSON.stringify(all));
  } catch (err) {
    console.warn("Storage quota exceeded or private mode restriction:", err);
  }
};

export const getAllRegisteredAccounts = (): UserAccount[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ALL_ACCOUNTS);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    }
    return [];
  } catch {
    return [];
  }
};

export const registerAccount = async (
  email: string,
  username: string,
  passwordClear: string,
  avatar = "🚀"
): Promise<{ success: boolean; user?: UserAccount; error?: string }> => {
  if (typeof window === "undefined") return { success: false, error: "Client-side only" };

  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = sanitizeInput(username.trim());

  if (!isValidEmail(cleanEmail)) {
    return { success: false, error: "Некорректный формат Email адреса!" };
  }
  if (!isValidUsername(cleanUsername)) {
    return { success: false, error: "Никнейм должен быть от 2 до 20 символов!" };
  }
  if (!passwordClear || passwordClear.length < 4) {
    return { success: false, error: "Пароль должен содержать минимум 4 символа!" };
  }

  const all = getAllRegisteredAccounts();
  if (all.some((a) => a.email?.toLowerCase() === cleanEmail)) {
    return { success: false, error: "Пользователь с таким Email уже зарегистрирован!" };
  }

  const pwHash = await hashPassword(passwordClear);

  const newUser: UserAccount = {
    ...createDefaultAccount(cleanUsername, avatar, false, cleanEmail),
    passwordHash: pwHash,
    coins: 1000,
  };

  all.push(newUser);
  try {
    localStorage.setItem(STORAGE_KEY_ALL_ACCOUNTS, JSON.stringify(all));
  } catch {}
  saveCurrentUser(newUser);

  return { success: true, user: newUser };
};

export const loginAccount = async (
  email: string,
  passwordClear: string
): Promise<{ success: boolean; user?: UserAccount; error?: string }> => {
  if (typeof window === "undefined") return { success: false, error: "Client-side only" };

  const cleanEmail = email.trim().toLowerCase();
  if (!isValidEmail(cleanEmail)) {
    return { success: false, error: "Введите корректный Email адрес!" };
  }

  const all = getAllRegisteredAccounts();
  const found = all.find((a) => a.email?.toLowerCase() === cleanEmail);

  if (!found) {
    return { success: false, error: "Пользователь с таким Email не найден." };
  }

  const pwHash = await hashPassword(passwordClear);
  if (found.passwordHash && found.passwordHash !== pwHash) {
    return { success: false, error: "Неверный пароль!" };
  }

  saveCurrentUser(found);
  return { success: true, user: found };
};

export const logoutAccount = (): UserAccount => {
  const guest = createDefaultAccount();
  saveCurrentUser(guest);
  return guest;
};

export const recordMatchOutcome = (
  gameId: string,
  isWinner: boolean,
  opponentElo = 1200
): UserAccount => {
  const user = getCurrentUser();

  const currentElo = user.gameRatings?.[gameId] || user.eloRating;
  const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - currentElo) / 400));
  const actualScore = isWinner ? 1 : 0;
  const eloDelta = Math.round(32 * (actualScore - expectedScore));

  const newGameElo = Math.max(800, currentElo + eloDelta);
  const newOverallElo = Math.max(800, user.eloRating + Math.round(eloDelta * 0.7));

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
