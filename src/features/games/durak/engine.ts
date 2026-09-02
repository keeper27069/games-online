import { DurakCard, CardSuit, CardRank, TablePair, DurakPlayer, DurakGameState } from "./types";

const SUITS: CardSuit[] = ["hearts", "diamonds", "clubs", "spades"];
const RANKS: { rank: CardRank; value: number }[] = [
  { rank: "6", value: 6 },
  { rank: "7", value: 7 },
  { rank: "8", value: 8 },
  { rank: "9", value: 9 },
  { rank: "10", value: 10 },
  { rank: "J", value: 11 },
  { rank: "Q", value: 12 },
  { rank: "K", value: 13 },
  { rank: "A", value: 14 },
];

export const createDurakDeck = (): DurakCard[] => {
  const deck: DurakCard[] = [];
  let id = 0;
  for (const suit of SUITS) {
    for (const r of RANKS) {
      deck.push({
        id: `durak_${suit}_${r.rank}_${id++}`,
        suit,
        rank: r.rank,
        value: r.value,
      });
    }
  }
  return shuffleDeck(deck);
};

export const shuffleDeck = (deck: DurakCard[]): DurakCard[] => {
  const copy = [...deck];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/** Check if a defense card can beat an attack card */
export const canDefend = (defense: DurakCard, attack: DurakCard, trump: CardSuit): boolean => {
  // If attack is trump, defense must be a higher trump
  if (attack.suit === trump) {
    return defense.suit === trump && defense.value > attack.value;
  }
  // If attack is not trump, defense can be higher card of same suit OR any trump
  if (defense.suit === attack.suit) {
    return defense.value > attack.value;
  }
  return defense.suit === trump;
};

/** Check if a card rank is already present on the table (for podkidnoy toss) */
export const canToss = (card: DurakCard, table: TablePair[]): boolean => {
  if (table.length === 0) return true;
  return table.some((p) => p.attack.rank === card.rank || p.defense?.rank === card.rank);
};

export const initDurakGame = (humanName = "Вы"): DurakGameState => {
  let deck = createDurakDeck();

  const human: DurakPlayer = { id: "p0", name: humanName, avatar: "🎮", isAi: false, cards: [] };
  const ai: DurakPlayer = { id: "p1", name: "Бот Гроссмейстер", avatar: "🤖", isAi: true, cards: [] };
  const players = [human, ai];

  // Deal 6 cards each
  for (let i = 0; i < 6; i++) {
    players[0].cards.push(deck.pop()!);
    players[1].cards.push(deck.pop()!);
  }

  // Trump card is the bottom card of remaining deck
  const trumpCard = deck[0];
  const trumpSuit = trumpCard.suit;

  // Determine who attacks first (who has lowest trump)
  let attackerIdx = 0;
  const humanTrumps = human.cards.filter((c) => c.suit === trumpSuit).sort((a, b) => a.value - b.value);
  const aiTrumps = ai.cards.filter((c) => c.suit === trumpSuit).sort((a, b) => a.value - b.value);

  if (humanTrumps.length > 0 && aiTrumps.length > 0) {
    attackerIdx = humanTrumps[0].value < aiTrumps[0].value ? 0 : 1;
  } else if (aiTrumps.length > 0) {
    attackerIdx = 1;
  } else {
    attackerIdx = 0;
  }

  const defenderIdx = attackerIdx === 0 ? 1 : 0;

  return {
    deck,
    trumpCard,
    trumpSuit,
    discardPile: [],
    table: [],
    players,
    attackerIndex: attackerIdx,
    defenderIndex: defenderIdx,
    turnPhase: "attack",
    status: "playing",
    winner: null,
    durak: null,
    message:
      attackerIdx === 0
        ? "Ваш ход! Выберите карту для атаки."
        : "Бот атакует! Приготовьтесь защищаться.",
  };
};

/** Helper to sort player's cards nicely by suit and rank */
export const sortCards = (cards: DurakCard[], trumpSuit: CardSuit): DurakCard[] => {
  return [...cards].sort((a, b) => {
    if (a.suit === trumpSuit && b.suit !== trumpSuit) return 1;
    if (a.suit !== trumpSuit && b.suit === trumpSuit) return -1;
    if (a.suit === b.suit) return a.value - b.value;
    return a.suit.localeCompare(b.suit);
  });
};
