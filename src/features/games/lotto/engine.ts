import { LottoCardMatrix, LottoPlayer, LottoGameState } from "./types";

export const LOTTO_CALLOUTS: Record<number, string> = {
  1: "Кол / Петр Первый",
  2: "Пара",
  3: "Троица",
  7: "Семерка счастья",
  10: "Червонец",
  11: "Барабанные палочки",
  12: "Дюжина",
  13: "Чертова дюжина",
  18: "Совершеннолетие",
  20: "Гусь на лебеде",
  21: "Очко",
  22: "Гуси-лебеди",
  25: "Четвертак",
  33: "Кучерявый",
  44: "Стульчики",
  45: "Баба ягодка опять",
  50: "Полтинник",
  55: "Перчатки",
  66: "Валенки",
  69: "Туда-сюда",
  70: "Топор и ноль",
  77: "Топорики",
  80: "Бабушка",
  88: "Матрешки / Крендельки",
  89: "Дедушкин сосед",
  90: "Дедушка",
};

/** Generate standard Russian Lotto ticket (3x9 with 15 numbers) */
export const generateLottoCard = (): LottoCardMatrix => {
  // Define column ranges
  const colRanges = [
    { min: 1, max: 9 },
    { min: 10, max: 19 },
    { min: 20, max: 29 },
    { min: 30, max: 39 },
    { min: 40, max: 49 },
    { min: 50, max: 59 },
    { min: 60, max: 69 },
    { min: 70, max: 79 },
    { min: 80, max: 90 },
  ];

  // Pick 15 numbers across columns
  const card: (number | null)[][] = [
    Array(9).fill(null),
    Array(9).fill(null),
    Array(9).fill(null),
  ];

  // Distribute 5 filled columns per row
  for (let r = 0; r < 3; r++) {
    const cols = [0, 1, 2, 3, 4, 5, 6, 7, 8].sort(() => Math.random() - 0.5).slice(0, 5);
    for (const c of cols) {
      const range = colRanges[c];
      let num = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;

      // Ensure no duplicate in same column
      while (card[0][c] === num || card[1][c] === num || card[2][c] === num) {
        num = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
      }
      card[r][c] = num;
    }
  }

  // Sort numbers in columns vertically
  for (let c = 0; c < 9; c++) {
    const numsInCol: number[] = [];
    for (let r = 0; r < 3; r++) {
      if (card[r][c] !== null) numsInCol.push(card[r][c]!);
    }
    numsInCol.sort((a, b) => a - b);
    let idx = 0;
    for (let r = 0; r < 3; r++) {
      if (card[r][c] !== null) {
        card[r][c] = numsInCol[idx++];
      }
    }
  }

  return card.map((row) =>
    row.map((num) => ({
      number: num,
      isMarked: false,
    }))
  );
};

export const createLottoBag = (): number[] => {
  const bag: number[] = [];
  for (let i = 1; i <= 90; i++) {
    bag.push(i);
  }
  // Fisher-Yates shuffle
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
};

export const checkCardWins = (card: LottoCardMatrix): "full" | "row" | null => {
  // Check full card (all 15 numbers marked)
  const allMarked = card.every((row) =>
    row.every((cell) => cell.number === null || cell.isMarked)
  );
  if (allMarked) return "full";

  // Check any complete row (5 numbers in row marked)
  const anyRowMarked = card.some((row) =>
    row.every((cell) => cell.number === null || cell.isMarked)
  );
  if (anyRowMarked) return "row";

  return null;
};

export const initLottoGame = (humanName = "Вы"): LottoGameState => {
  const p0: LottoPlayer = {
    id: "p0",
    name: humanName,
    avatar: "🎮",
    isAi: false,
    cards: [generateLottoCard()],
    markedCount: 0,
  };

  const p1: LottoPlayer = {
    id: "p1",
    name: "Дядя Вася",
    avatar: "👴",
    isAi: true,
    cards: [generateLottoCard()],
    markedCount: 0,
  };

  const p2: LottoPlayer = {
    id: "p2",
    name: "Тетя Галя",
    avatar: "👵",
    isAi: true,
    cards: [generateLottoCard()],
    markedCount: 0,
  };

  return {
    bag: createLottoBag(),
    drawnBarrels: [],
    currentBarrel: null,
    barrelCallout: "Нажмите «Тянуть бочонок» или запустите «Авто-игру»!",
    players: [p0, p1, p2],
    mode: "manual",
    speed: "normal",
    isPlaying: false,
    status: "playing",
    winner: null,
    winType: null,
    message: "Партия в Русское Лото началась! Следите за выпадающими номерами.",
  };
};
