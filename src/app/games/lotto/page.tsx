"use client";

import React, { useState } from "react";
import { GameContainer } from "@/components/layout/GameContainer";
import { LottoBoard } from "@/features/games/lotto/LottoBoard";
import { GAMES_CATALOG } from "@/types/games";

export default function LottoPage() {
  const [resetKey, setResetKey] = useState(0);
  const gameInfo = GAMES_CATALOG.find((g) => g.id === "lotto")!;

  return (
    <GameContainer game={gameInfo} onReset={() => setResetKey((k) => k + 1)}>
      <LottoBoard key={resetKey} />
    </GameContainer>
  );
}
