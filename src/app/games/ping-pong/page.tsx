"use client";

import React, { useState } from "react";
import { GameContainer } from "@/components/layout/GameContainer";
import { PingPongCanvas } from "@/features/games/ping-pong/PingPongCanvas";
import { GAMES_CATALOG } from "@/types/games";

export default function PingPongPage() {
  const [resetKey, setResetKey] = useState(0);
  const gameInfo = GAMES_CATALOG.find((g) => g.id === "ping-pong")!;

  return (
    <GameContainer game={gameInfo} onReset={() => setResetKey((k) => k + 1)}>
      <PingPongCanvas key={resetKey} />
    </GameContainer>
  );
}
