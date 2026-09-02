"use client";

import React, { useState } from "react";
import { GameContainer } from "@/components/layout/GameContainer";
import { UnoBoard } from "@/features/games/uno/UnoBoard";
import { GAMES_CATALOG } from "@/types/games";

export default function UnoPage() {
  const [resetKey, setResetKey] = useState(0);
  const gameInfo = GAMES_CATALOG.find((g) => g.id === "uno")!;

  return (
    <GameContainer game={gameInfo} onReset={() => setResetKey((k) => k + 1)}>
      <UnoBoard key={resetKey} />
    </GameContainer>
  );
}
