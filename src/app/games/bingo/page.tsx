"use client";

import React, { useState } from "react";
import { GameContainer } from "@/components/layout/GameContainer";
import { BingoBoard } from "@/features/games/bingo/BingoBoard";
import { GAMES_CATALOG } from "@/types/games";

export default function BingoPage() {
  const [resetKey, setResetKey] = useState(0);
  const gameInfo = GAMES_CATALOG.find((g) => g.id === "bingo")!;

  return (
    <GameContainer game={gameInfo} onReset={() => setResetKey((k) => k + 1)}>
      <BingoBoard key={resetKey} />
    </GameContainer>
  );
}
