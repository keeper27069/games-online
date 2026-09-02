"use client";

import React, { useState } from "react";
import { GameContainer } from "@/components/layout/GameContainer";
import { CheckersBoard } from "@/features/games/checkers/CheckersBoard";
import { GAMES_CATALOG } from "@/types/games";

export default function CheckersPage() {
  const [resetKey, setResetKey] = useState(0);
  const gameInfo = GAMES_CATALOG.find((g) => g.id === "checkers")!;

  return (
    <GameContainer game={gameInfo} onReset={() => setResetKey((k) => k + 1)}>
      <CheckersBoard key={resetKey} />
    </GameContainer>
  );
}
