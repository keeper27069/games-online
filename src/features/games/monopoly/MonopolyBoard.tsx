"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { MonopolyGameState, MonopolyTile, MonopolyPlayer } from "./types";
import { initMonopolyGame, calculateRent, CHANCE_CARDS } from "./engine";
import { GameOverModal } from "@/components/ui/GameOverModal";
import { sound } from "@/lib/sound";
import { recordGameResult } from "@/lib/storage";
import { Dices, Building, Home, DollarSign, Sparkles, User, Bot, AlertTriangle } from "lucide-react";

export const MonopolyBoard: React.FC = () => {
  const [game, setGame] = useState<MonopolyGameState>(() => initMonopolyGame());
  const [isGameOverOpen, setIsGameOverOpen] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const aiTimerRef = useRef<NodeJS.Timeout | null>(null);

  const human = game.players[0];
  const activePlayer = game.players[game.currentTurnIndex];
  const isHumanTurn = game.currentTurnIndex === 0 && !human.isBankrupt && game.status === "playing";
  const currentTile = game.tiles[activePlayer?.position || 0];

  // Check game over (only 1 player remaining non-bankrupt)
  useEffect(() => {
    const activePlayers = game.players.filter((p) => !p.isBankrupt);
    if (activePlayers.length === 1 && game.status === "playing") {
      const winner = activePlayers[0];
      setGame((prev) => ({
        ...prev,
        status: "gameover",
        winner,
        message: `${winner.name} победил всех соперников и стал Монополистом!`,
      }));
      setIsGameOverOpen(true);
      const isWinner = winner.id === human.id;
      recordGameResult("monopoly", isWinner ? "win" : "loss", winner.money);
    }
  }, [game.players, game.status, human.id]);

  // Roll Dice & Move
  const rollDice = useCallback(() => {
    if (game.isRolling || !game.canRoll || game.status !== "playing") return;

    sound.playDiceRoll();
    setGame((prev) => ({ ...prev, isRolling: true }));

    setTimeout(() => {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      const totalSteps = d1 + d2;

      setGame((prev) => {
        const player = prev.players[prev.currentTurnIndex];
        let newPos = (player.position + totalSteps) % prev.tiles.length;
        let newMoney = player.money;
        let logs = [...prev.logs];
        let nextMessage = "";

        // Passed GO (+ $200)
        if (player.position + totalSteps >= prev.tiles.length && newPos !== 0) {
          newMoney += 200;
          logs.unshift(`${player.name} прошел СТАРТ и получил $200.`);
        }

        const landedTile = prev.tiles[newPos];
        let inJail = player.inJail;

        // Tile Actions
        if (landedTile.type === "go") {
          newMoney += 200;
          nextMessage = `${player.name} попал на СТАРТ (+$200).`;
        } else if (landedTile.type === "gotojail") {
          newPos = 6; // Jail
          inJail = true;
          logs.unshift(`${player.name} отправлен в ТЮРЬМУ!`);
          nextMessage = `${player.name} попал в Тюрьму!`;
        } else if (landedTile.type === "tax") {
          newMoney -= 100;
          logs.unshift(`${player.name} оплатил налог $100.`);
          nextMessage = `${player.name} оплатил налог $100.`;
        } else if (landedTile.type === "chance" || landedTile.type === "chest") {
          const card = CHANCE_CARDS[Math.floor(Math.random() * CHANCE_CARDS.length)];
          newMoney += card.amount;
          logs.unshift(`${player.name} вытянул Шанс: ${card.text}`);
          nextMessage = `Шанс: ${card.text}`;
        } else if (
          landedTile.ownerId &&
          landedTile.ownerId !== player.id
        ) {
          // Pay Rent to owner
          const owner = prev.players.find((p) => p.id === landedTile.ownerId);
          if (owner && !owner.isBankrupt) {
            const rent = calculateRent(landedTile, prev.tiles);
            newMoney -= rent;
            logs.unshift(`${player.name} заплатил аренду $${rent} игроку ${owner.name} за «${landedTile.name}».`);
            nextMessage = `${player.name} заплатил аренду $${rent}.`;

            // Credit owner
            prev.players = prev.players.map((p) =>
              p.id === owner.id ? { ...p, money: p.money + rent } : p
            );
          }
        } else if (!landedTile.ownerId && landedTile.price) {
          nextMessage = `Вы на «${landedTile.name}». Можно купить за $${landedTile.price}.`;
        }

        // Bankrupt check
        let isBankrupt = player.isBankrupt;
        if (newMoney <= 0) {
          isBankrupt = true;
          newMoney = 0;
          logs.unshift(`💥 ${player.name} ОБАНКРОТИЛСЯ и выбывает из игры!`);
        }

        const updatedPlayers = prev.players.map((p, idx) =>
          idx === prev.currentTurnIndex
            ? {
                ...p,
                position: newPos,
                money: newMoney,
                inJail,
                isBankrupt,
              }
            : p
        );

        return {
          ...prev,
          dice: [d1, d2],
          isRolling: false,
          canRoll: false,
          canEndTurn: true,
          players: updatedPlayers,
          logs: logs.slice(0, 15),
          message: nextMessage || `${player.name} выбросил [${d1} + ${d2} = ${totalSteps}].`,
        };
      });
    }, 800);
  }, [game.isRolling, game.canRoll, game.status]);

  // Buy Property
  const buyProperty = () => {
    sound.playClick(800);
    setGame((prev) => {
      const player = prev.players[prev.currentTurnIndex];
      const tile = prev.tiles[player.position];

      if (!tile.price || tile.ownerId || player.money < tile.price) return prev;

      const updatedTiles = prev.tiles.map((t, idx) =>
        idx === player.position ? { ...t, ownerId: player.id } : t
      );

      const updatedPlayers = prev.players.map((p, idx) =>
        idx === prev.currentTurnIndex ? { ...p, money: p.money - tile.price! } : p
      );

      const logs = [`${player.name} купил «${tile.name}» за $${tile.price}.`, ...prev.logs];

      return {
        ...prev,
        tiles: updatedTiles,
        players: updatedPlayers,
        logs: logs.slice(0, 15),
        message: `Вы приобрели «${tile.name}»!`,
      };
    });
  };

  // Build House
  const buildHouse = (tileId: number) => {
    sound.playClick(700);
    setGame((prev) => {
      const player = prev.players[prev.currentTurnIndex];
      const tile = prev.tiles[tileId];

      if (!tile.houseCost || tile.ownerId !== player.id || (tile.houses || 0) >= 4 || player.money < tile.houseCost) {
        return prev;
      }

      const updatedTiles = prev.tiles.map((t) =>
        t.id === tileId ? { ...t, houses: (t.houses || 0) + 1 } : t
      );

      const updatedPlayers = prev.players.map((p, idx) =>
        idx === prev.currentTurnIndex ? { ...p, money: p.money - tile.houseCost! } : p
      );

      return {
        ...prev,
        tiles: updatedTiles,
        players: updatedPlayers,
        logs: [`${player.name} построил филиал на «${tile.name}» за $${tile.houseCost}.`, ...prev.logs].slice(0, 15),
        message: `Филиал построен на «${tile.name}»!`,
      };
    });
  };

  // End Turn
  const endTurn = useCallback(() => {
    sound.playClick(600);
    setGame((prev) => {
      let nextIdx = (prev.currentTurnIndex + 1) % prev.players.length;
      while (prev.players[nextIdx].isBankrupt) {
        nextIdx = (nextIdx + 1) % prev.players.length;
      }

      const nextPlayer = prev.players[nextIdx];

      return {
        ...prev,
        currentTurnIndex: nextIdx,
        canRoll: true,
        canEndTurn: false,
        message: nextIdx === 0 ? "Ваш ход! Бросайте кубики." : `Ход игрока ${nextPlayer.name}...`,
      };
    });
  }, []);

  // AI Turn Automation
  useEffect(() => {
    if (game.status !== "playing") return;

    if (activePlayer && activePlayer.isAi && !activePlayer.isBankrupt) {
      setIsAiThinking(true);
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);

      aiTimerRef.current = setTimeout(() => {
        if (game.canRoll) {
          rollDice();
        } else if (game.canEndTurn) {
          // AI checks if it can buy the landed tile
          const tile = game.tiles[activePlayer.position];
          if (tile.price && !tile.ownerId && activePlayer.money >= tile.price + 150) {
            buyProperty();
          }

          // AI checks if it can build houses on its properties
          const ownedSet = game.tiles.filter((t) => t.ownerId === activePlayer.id && t.houseCost && (t.houses || 0) < 3);
          if (ownedSet.length > 0 && activePlayer.money > 300) {
            buildHouse(ownedSet[0].id);
          }

          setTimeout(() => {
            setIsAiThinking(false);
            endTurn();
          }, 800);
        }
      }, 1000);
    }

    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, [game.currentTurnIndex, game.canRoll, game.canEndTurn, game.status, activePlayer, rollDice, endTurn]);

  const restartGame = () => {
    setIsGameOverOpen(false);
    setGame(initMonopolyGame());
  };

  const GROUP_COLORS: Record<string, string> = {
    brown: "bg-amber-900",
    cyan: "bg-cyan-500",
    orange: "bg-orange-500",
    blue: "bg-blue-600",
  };

  const canBuyCurrent =
    isHumanTurn &&
    game.canEndTurn &&
    currentTile.price &&
    !currentTile.ownerId &&
    human.money >= currentTile.price;

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center justify-between min-h-[680px] p-3 sm:p-6 rounded-3xl bg-slate-950 border border-blue-500/30 shadow-2xl relative select-none">
      {/* Top Header: Players Balances */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
        {game.players.map((p, idx) => {
          const isTurn = game.currentTurnIndex === idx && !p.isBankrupt;
          return (
            <div
              key={p.id}
              className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                p.isBankrupt
                  ? "bg-slate-950/40 border-slate-800/40 opacity-40"
                  : isTurn
                  ? "bg-blue-950/60 border-cyan-400 shadow-[0_0_15px_rgba(0,210,255,0.3)] scale-102"
                  : "bg-slate-900/60 border-slate-800"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="text-2xl">{p.avatar}</div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">{p.name}</span>
                    {p.isBankrupt && (
                      <span className="text-[9px] font-black px-1 rounded bg-rose-900 text-rose-300">
                        БАНКРОТ
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-emerald-400 font-extrabold flex items-center">
                    <DollarSign className="w-3.5 h-3.5" />
                    {p.money.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Player color dot */}
              <div
                className="w-3.5 h-3.5 rounded-full border border-white/50 shadow"
                style={{ backgroundColor: p.color }}
              />
            </div>
          );
        })}
      </div>

      {/* Main Board Layout: Perimeter 24 Tiles + Center Command Stage */}
      <div className="w-full my-6 grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
        {/* Left 3 Cols: Board Tiles Grid (6x6 perimeter simulation) */}
        <div className="lg:col-span-3 grid grid-cols-3 sm:grid-cols-6 gap-2 p-3 rounded-3xl bg-slate-900/60 border border-slate-800 max-h-[460px] overflow-y-auto">
          {game.tiles.map((tile) => {
            const owner = game.players.find((p) => p.id === tile.ownerId);
            const playersOnTile = game.players.filter((p) => p.position === tile.id && !p.isBankrupt);

            return (
              <div
                key={tile.id}
                className={`relative flex flex-col justify-between p-2 rounded-xl border text-left min-h-[90px] transition-all ${
                  tile.ownerId
                    ? "bg-slate-900/90 border-slate-700"
                    : "bg-slate-950/80 border-slate-800/80"
                } ${playersOnTile.length > 0 ? "ring-2 ring-cyan-400 shadow-md" : ""}`}
              >
                {/* Tile Group Color Bar */}
                {tile.group && (
                  <div className={`h-2 -mx-2 -mt-2 rounded-t-xl ${GROUP_COLORS[tile.group] || "bg-slate-600"}`} />
                )}

                {/* Tile Name & Type */}
                <div className="mt-1">
                  <div className="text-[11px] font-bold text-white truncate leading-tight">
                    {tile.name}
                  </div>
                  {tile.price && (
                    <div className="text-[10px] text-amber-300 font-extrabold">
                      ${tile.price}
                    </div>
                  )}
                </div>

                {/* Houses indicator */}
                {tile.houses && tile.houses > 0 && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {Array.from({ length: tile.houses }).map((_, i) => (
                      <Home key={i} className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                    ))}
                  </div>
                )}

                {/* Owner Tag */}
                {owner && (
                  <div className="text-[9px] font-semibold text-slate-400 truncate">
                    Владелец: <span style={{ color: owner.color }}>{owner.name}</span>
                  </div>
                )}

                {/* Player Tokens on this tile */}
                {playersOnTile.length > 0 && (
                  <div className="absolute -bottom-2 right-1 flex items-center -space-x-1">
                    {playersOnTile.map((p) => (
                      <span
                        key={p.id}
                        className="text-base drop-shadow animate-bounce"
                        title={p.name}
                      >
                        {p.avatar}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right 1 Col: Dice, Actions & Live Feed */}
        <div className="flex flex-col gap-3">
          {/* Dice Roller Card */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block mb-2">
              Бросок кубиков
            </span>

            <div className="flex items-center justify-center gap-3 mb-3">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br from-white to-slate-200 border-2 border-slate-400 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg ${
                  game.isRolling ? "animate-dice-shake" : ""
                }`}
              >
                {game.dice[0]}
              </div>
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br from-white to-slate-200 border-2 border-slate-400 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg ${
                  game.isRolling ? "animate-dice-shake" : ""
                }`}
              >
                {game.dice[1]}
              </div>
            </div>

            {/* Actions for Human Player */}
            {isHumanTurn && (
              <div className="space-y-2">
                {game.canRoll && (
                  <button
                    onClick={rollDice}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-extrabold text-xs shadow-[0_0_15px_rgba(0,210,255,0.4)] hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Dices className="w-4 h-4" />
                    Бросить кубики
                  </button>
                )}

                {canBuyCurrent && (
                  <button
                    onClick={buyProperty}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-xs shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Building className="w-4 h-4" />
                    Купить «{currentTile.name}» (${currentTile.price})
                  </button>
                )}

                {game.canEndTurn && (
                  <button
                    onClick={endTurn}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all"
                  >
                    Завершить ход
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Event Log Feed */}
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 max-h-48 overflow-y-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              События партии
            </span>
            <div className="space-y-1 text-xs text-slate-300">
              {game.logs.map((log, i) => (
                <div key={i} className="py-0.5 border-b border-slate-800/50 leading-tight">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Message Bottom Banner */}
      <div className="w-full max-w-xl mx-auto mb-2 text-center py-2 px-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-semibold text-cyan-300 flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
        <span>{game.message}</span>
      </div>

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={isGameOverOpen}
        isWinner={game.winner?.id === human.id}
        title={game.winner?.id === human.id ? "Вы Монополист!" : "Игра окончена"}
        subtitle={
          game.winner?.id === human.id
            ? "Поздравляем! Вы разорили всех оппонентов и завладели городом!"
            : `${game.winner?.name} выиграл партию в Монополию.`
        }
        stats={[
          { label: "Победитель", value: game.winner?.name || "-" },
          { label: "Ваш баланс", value: `$${human.money}` },
        ]}
        onRestart={restartGame}
      />
    </div>
  );
};
