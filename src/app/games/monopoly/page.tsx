"use client";

import React, { useState } from "react";
import { GameContainer } from "@/components/layout/GameContainer";
import { MonopolyBoard } from "@/features/games/monopoly/MonopolyBoard";
import { GAMES_CATALOG } from "@/types/games";

export default function MonopolyPage() {
  const [resetKey, setResetKey] = useState(0);
  const gameInfo = GAMES_CATALOG.find((g) => g.id === "monopoly")!;

  return (
    <GameContainer game={gameInfo} onReset={() => setResetKey((k) => k + 1)}>
      <MonopolyBoard key={resetKey} />
    </GameContainer>
  );
}
