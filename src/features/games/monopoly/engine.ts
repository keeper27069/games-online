import { MonopolyTile, MonopolyPlayer, MonopolyGameState } from "./types";

export const BOARD_TILES: MonopolyTile[] = [
  { id: 0, name: "СТАРТ", type: "go" },
  { id: 1, name: "Ул. Арбат", type: "property", group: "brown", price: 60, baseRent: 10, houseCost: 50, ownerId: null, houses: 0 },
  { id: 2, name: "Казна", type: "chest" },
  { id: 3, name: "Тверская ул.", type: "property", group: "brown", price: 80, baseRent: 15, houseCost: 50, ownerId: null, houses: 0 },
  { id: 4, name: "Налог", type: "tax" },
  { id: 5, name: "Сев. Вокзал", type: "railroad", price: 150, baseRent: 35, ownerId: null },
  { id: 6, name: "Тюрьма", type: "jail" },
  { id: 7, name: "Невский пр.", type: "property", group: "cyan", price: 100, baseRent: 20, houseCost: 60, ownerId: null, houses: 0 },
  { id: 8, name: "Шанс", type: "chance" },
  { id: 9, name: "Дворцовая пл.", type: "property", group: "cyan", price: 120, baseRent: 25, houseCost: 60, ownerId: null, houses: 0 },
  { id: 10, name: "Энергосеть", type: "utility", price: 140, baseRent: 30, ownerId: null },
  { id: 11, name: "Казанская ул.", type: "property", group: "cyan", price: 140, baseRent: 30, houseCost: 60, ownerId: null, houses: 0 },
  { id: 12, name: "Стоянка", type: "parking" },
  { id: 13, name: "Красная пл.", type: "property", group: "orange", price: 180, baseRent: 40, houseCost: 100, ownerId: null, houses: 0 },
  { id: 14, name: "Казна", type: "chest" },
  { id: 15, name: "Театральный пр.", type: "property", group: "orange", price: 200, baseRent: 45, houseCost: 100, ownerId: null, houses: 0 },
  { id: 16, name: "Южн. Вокзал", type: "railroad", price: 150, baseRent: 35, ownerId: null },
  { id: 17, name: "Никольская ул.", type: "property", group: "orange", price: 220, baseRent: 50, houseCost: 100, ownerId: null, houses: 0 },
  { id: 18, name: "В тюрьму!", type: "gotojail" },
  { id: 19, name: "Кутузовский пр.", type: "property", group: "blue", price: 280, baseRent: 65, houseCost: 150, ownerId: null, houses: 0 },
  { id: 20, name: "Шанс", type: "chance" },
  { id: 21, name: "Ленинский пр.", type: "property", group: "blue", price: 300, baseRent: 75, houseCost: 150, ownerId: null, houses: 0 },
  { id: 22, name: "Водоканал", type: "utility", price: 140, baseRent: 30, ownerId: null },
  { id: 23, name: "Патриаршие", type: "property", group: "blue", price: 350, baseRent: 95, houseCost: 150, ownerId: null, houses: 0 },
];

export const CHANCE_CARDS = [
  { text: "Выигрыш в лотерею! Получите $100", amount: 100 },
  { text: "Штраф за превышение скорости: -$50", amount: -50 },
  { text: "Налоговый возврат! Получите $75", amount: 75 },
  { text: "Ремонт недвижимости: -$80", amount: -80 },
  { text: "Дивиденды по акциям! Получите $120", amount: 120 },
];

export const calculateRent = (tile: MonopolyTile, allTiles: MonopolyTile[]): number => {
  if (!tile.baseRent || !tile.ownerId) return 0;

  // If railroad or utility
  if (tile.type === "railroad") {
    const ownedRailroads = allTiles.filter((t) => t.type === "railroad" && t.ownerId === tile.ownerId).length;
    return tile.baseRent * (ownedRailroads || 1);
  }
  if (tile.type === "utility") {
    const ownedUtilities = allTiles.filter((t) => t.type === "utility" && t.ownerId === tile.ownerId).length;
    return tile.baseRent * (ownedUtilities || 1);
  }

  // Check full monopoly
  const groupTiles = allTiles.filter((t) => t.group === tile.group);
  const isFullMonopoly = groupTiles.every((t) => t.ownerId === tile.ownerId);

  let rent = tile.baseRent;
  if (isFullMonopoly && (!tile.houses || tile.houses === 0)) {
    rent *= 2; // Double base rent for full color set
  } else if (tile.houses) {
    rent += tile.houses * (tile.baseRent * 1.5);
  }

  return Math.round(rent);
};

export const initMonopolyGame = (humanName = "Вы"): MonopolyGameState => {
  const players: MonopolyPlayer[] = [
    { id: "p0", name: humanName, avatar: "🎩", isAi: false, money: 1000, position: 0, inJail: false, jailTurns: 0, isBankrupt: false, color: "#00d2ff" },
    { id: "p1", name: "Олигарх Бот", avatar: "💼", isAi: true, money: 1000, position: 0, inJail: false, jailTurns: 0, isBankrupt: false, color: "#a855f7" },
    { id: "p2", name: "Банкир Бот", avatar: "🏦", isAi: true, money: 1000, position: 0, inJail: false, jailTurns: 0, isBankrupt: false, color: "#fbbf24" },
  ];

  return {
    tiles: BOARD_TILES.map((t) => ({ ...t, ownerId: null, houses: 0 })),
    players,
    currentTurnIndex: 0,
    dice: [1, 2],
    isRolling: false,
    canRoll: true,
    canEndTurn: false,
    status: "playing",
    winner: null,
    logs: ["Игра началась! Каждый игрок получил стартовый капитал $1,000."],
    message: "Ваш ход! Бросьте кубики, чтобы начать движение по полю.",
  };
};
