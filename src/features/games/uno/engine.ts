import { UnoCard, UnoColor, UnoValue, UnoPlayer, UnoGameState } from "./types";

const COLORS: ("red" | "blue" | "green" | "yellow")[] = ["red", "blue", "green", "yellow"];

/** Generates standard 108-card UNO deck */
export const createUnoDeck = (): UnoCard[] => {
  const deck: UnoCard[] = [];
  let idCounter = 0;

  for (const color of COLORS) {
    // One '0' card per color
    deck.push({ id: `card_${idCounter++}`, color, value: "0" });

    // Two of '1' through '9'
    for (let num = 1; num <= 9; num++) {
      const val = String(num) as UnoValue;
      deck.push({ id: `card_${idCounter++}`, color, value: val });
      deck.push({ id: `card_${idCounter++}`, color, value: val });
    }

    // Two 'skip', 'reverse', 'draw2' per color
    const actionValues: UnoValue[] = ["skip", "reverse", "draw2"];
    for (const val of actionValues) {
      deck.push({ id: `card_${idCounter++}`, color, value: val });
      deck.push({ id: `card_${idCounter++}`, color, value: val });
    }
  }

  // 4 Wild cards and 4 Wild Draw 4 cards
  for (let i = 0; i < 4; i++) {
    deck.push({ id: `card_${idCounter++}`, color: "wild", value: "wild" });
    deck.push({ id: `card_${idCounter++}`, color: "wild", value: "wild_draw4" });
  }

  return shuffleDeck(deck);
};

export const shuffleDeck = (deck: UnoCard[]): UnoCard[] => {
  const copy = [...deck];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export const isValidMove = (card: UnoCard, topCard: UnoCard, currentColor: UnoColor): boolean => {
  if (card.color === "wild") return true;
  if (card.color === currentColor) return true;
  if (card.value === topCard.value) return true;
  return false;
};

export const initUnoGame = (playerCount = 3, humanName = "Вы"): UnoGameState => {
  let deck = createUnoDeck();
  const players: UnoPlayer[] = [
    { id: "player_0", name: humanName, avatar: "🎮", isAi: false, cards: [], hasCalledUno: false },
    { id: "player_1", name: "Бот Артём", avatar: "🤖", isAi: true, cards: [], hasCalledUno: false },
  ];

  if (playerCount >= 3) {
    players.push({ id: "player_2", name: "Бот София", avatar: "👾", isAi: true, cards: [], hasCalledUno: false });
  }
  if (playerCount >= 4) {
    players.push({ id: "player_3", name: "Бот Макс", avatar: "🚀", isAi: true, cards: [], hasCalledUno: false });
  }

  // Deal 7 cards to each player
  for (let i = 0; i < 7; i++) {
    for (const player of players) {
      if (deck.length > 0) {
        player.cards.push(deck.pop()!);
      }
    }
  }

  // Draw first non-wild card for discard pile
  let initialCardIndex = deck.findIndex((c) => c.color !== "wild" && c.value !== "draw2" && c.value !== "skip" && c.value !== "reverse");
  if (initialCardIndex === -1) initialCardIndex = 0;
  const initialCard = deck.splice(initialCardIndex, 1)[0];

  return {
    deck,
    discardPile: [initialCard],
    players,
    currentTurnIndex: 0,
    direction: 1,
    currentColor: initialCard.color,
    isColorPickerOpen: false,
    pendingCard: null,
    status: "playing",
    winner: null,
    unoPenaltyCountdown: null,
    message: "Ваш ход! Сыграйте подходящую карту или возьмите из колоды.",
  };
};

/** Get the most frequent color in player's hand (for AI wild card choice) */
export const getBestAiColor = (cards: UnoCard[]): UnoColor => {
  const colorCounts: Record<string, number> = { red: 0, blue: 0, green: 0, yellow: 0 };
  for (const c of cards) {
    if (c.color !== "wild") {
      colorCounts[c.color] = (colorCounts[c.color] || 0) + 1;
    }
  }
  let bestColor: UnoColor = "red";
  let maxCount = -1;
  for (const [col, count] of Object.entries(colorCounts)) {
    if (count > maxCount) {
      maxCount = count;
      bestColor = col as UnoColor;
    }
  }
  return bestColor;
};
