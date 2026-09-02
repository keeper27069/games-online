"use client";

import React, { useState } from "react";
import { GameContainer } from "@/components/layout/GameContainer";
import { DurakBoard } from "@/features/games/durak/DurakBoard";
import { GAMES_CATALOG } from "@/types/games";

export default function DurakPage() {
  const [resetKey, setResetKey] = useState(0);
  const gameInfo = GAMES_CATALOG.find((g) => g.id === "durak")!;

  return (
    <GameContainer game={gameInfo} onReset={() => setResetKey((k) => k + 1)}>
      <DurakBoard key={resetKey} />
    </GameContainer>
  );
}
