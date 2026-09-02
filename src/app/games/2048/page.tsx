"use client";

import React, { useState } from "react";
import { GameContainer } from "@/components/layout/GameContainer";
import { Board2048 } from "@/features/games/2048/Board2048";
import { GAMES_CATALOG } from "@/types/games";

export default function Game2048Page() {
  const [resetKey, setResetKey] = useState(0);
  const gameInfo = GAMES_CATALOG.find((g) => g.id === "2048")!;

  return (
    <GameContainer game={gameInfo} onReset={() => setResetKey((k) => k + 1)}>
      <Board2048 key={resetKey} />
    </GameContainer>
  );
}
