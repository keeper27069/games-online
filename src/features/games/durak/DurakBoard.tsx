"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { DurakGameState, DurakCard, TablePair } from "./types";
import { initDurakGame, canDefend, canToss, sortCards } from "./engine";
import { DurakCardComponent } from "./DurakCard";
import { GameOverModal } from "@/components/ui/GameOverModal";
import { sound } from "@/lib/sound";
import { recordGameResult } from "@/lib/storage";
import { ShieldCheck, ShieldAlert, Sparkles, User, Bot, Layers } from "lucide-react";

export const DurakBoard: React.FC = () => {
  const [game, setGame] = useState<DurakGameState>(() => initDurakGame());
  const [isGameOverOpen, setIsGameOverOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const aiTimerRef = useRef<NodeJS.Timeout | null>(null);

  const human = game.players[0];
  const ai = game.players[1];
  const isHumanAttacker = game.attackerIndex === 0;
  const isHumanDefender = game.defenderIndex === 0;

  // Check victory / durak
  useEffect(() => {
    if (game.status === "gameover") {
      setIsGameOverOpen(true);
      const isWinner = game.winner?.id === human.id;
      recordGameResult("durak", isWinner ? "win" : "loss", isWinner ? 600 : 150);
    }
  }, [game.status, game.winner, human.id]);

  // Replenish hands to 6 cards
  const replenishCards = useCallback(
    (
      deck: DurakCard[],
      attackerCards: DurakCard[],
      defenderCards: DurakCard[],
      attackerIdx: number
    ): {
      deck: DurakCard[];
      p0Cards: DurakCard[];
      p1Cards: DurakCard[];
    } => {
      let currentDeck = [...deck];
      let p0 = attackerIdx === 0 ? [...attackerCards] : [...defenderCards];
      let p1 = attackerIdx === 1 ? [...attackerCards] : [...defenderCards];

      // Attacker draws first up to 6
      if (attackerIdx === 0) {
        while (p0.length < 6 && currentDeck.length > 0) {
          p0.push(currentDeck.pop()!);
        }
        while (p1.length < 6 && currentDeck.length > 0) {
          p1.push(currentDeck.pop()!);
        }
      } else {
        while (p1.length < 6 && currentDeck.length > 0) {
          p1.push(currentDeck.pop()!);
        }
        while (p0.length < 6 && currentDeck.length > 0) {
          p0.push(currentDeck.pop()!);
        }
      }

      return { deck: currentDeck, p0Cards: p0, p1Cards: p1 };
    },
    []
  );

  // Check if someone won (empty hand and empty deck)
  const checkWinner = (p0Cards: DurakCard[], p1Cards: DurakCard[], deckLen: number) => {
    if (deckLen === 0) {
      if (p0Cards.length === 0 && p1Cards.length === 0) {
        return { winner: null, durak: null, isOver: true }; // Draw
      }
      if (p0Cards.length === 0) {
        return { winner: human, durak: ai, isOver: true };
      }
      if (p1Cards.length === 0) {
        return { winner: ai, durak: human, isOver: true };
      }
    }
    return { winner: null, durak: null, isOver: false };
  };

  // End turn: Bito (Cards to discard pile)
  const handleBito = useCallback(() => {
    sound.playCardDeal();

    setGame((prev) => {
      const allTableCards = prev.table.flatMap((p) => (p.defense ? [p.attack, p.defense] : [p.attack]));
      const newDiscard = [...prev.discardPile, ...allTableCards];

      const { deck: newDeck, p0Cards, p1Cards } = replenishCards(
        prev.deck,
        prev.players[prev.attackerIndex].cards,
        prev.players[prev.defenderIndex].cards,
        prev.attackerIndex
      );

      const winCheck = checkWinner(p0Cards, p1Cards, newDeck.length);
      if (winCheck.isOver) {
        return {
          ...prev,
          deck: newDeck,
          discardPile: newDiscard,
          table: [],
          players: [
            { ...prev.players[0], cards: p0Cards },
            { ...prev.players[1], cards: p1Cards },
          ],
          status: "gameover",
          winner: winCheck.winner,
          durak: winCheck.durak,
          message: winCheck.winner?.id === human.id ? "Вы победили! Бот остался в дураках!" : "Бот победил! Вы дурак!",
        };
      }

      // Flip attacker and defender
      const nextAttacker = prev.defenderIndex;
      const nextDefender = prev.attackerIndex;

      return {
        ...prev,
        deck: newDeck,
        discardPile: newDiscard,
        table: [],
        players: [
          { ...prev.players[0], cards: p0Cards },
          { ...prev.players[1], cards: p1Cards },
        ],
        attackerIndex: nextAttacker,
        defenderIndex: nextDefender,
        turnPhase: "attack",
        message: nextAttacker === 0 ? "Бито! Ваш ход атаковать." : "Бито! Ход бота атаковать.",
      };
    });
    setSelectedCardId(null);
  }, [replenishCards, human.id, ai.id]);

  // End turn: Take cards (Defender takes all table cards)
  const handleTake = useCallback(() => {
    sound.playCardDeal();

    setGame((prev) => {
      const allTableCards = prev.table.flatMap((p) => (p.defense ? [p.attack, p.defense] : [p.attack]));
      const defIdx = prev.defenderIndex;
      const atkIdx = prev.attackerIndex;

      const defenderCards = [...prev.players[defIdx].cards, ...allTableCards];

      // Attacker replenishes to 6, defender doesn't draw because they took cards
      let currentDeck = [...prev.deck];
      let attackerCards = [...prev.players[atkIdx].cards];
      while (attackerCards.length < 6 && currentDeck.length > 0) {
        attackerCards.push(currentDeck.pop()!);
      }

      const p0 = atkIdx === 0 ? attackerCards : defenderCards;
      const p1 = atkIdx === 1 ? attackerCards : defenderCards;

      const winCheck = checkWinner(p0, p1, currentDeck.length);
      if (winCheck.isOver) {
        return {
          ...prev,
          deck: currentDeck,
          table: [],
          players: [
            { ...prev.players[0], cards: p0 },
            { ...prev.players[1], cards: p1 },
          ],
          status: "gameover",
          winner: winCheck.winner,
          durak: winCheck.durak,
          message: "Партия окончена!",
        };
      }

      // Attacker remains attacker since defender took cards
      return {
        ...prev,
        deck: currentDeck,
        table: [],
        players: [
          { ...prev.players[0], cards: p0 },
          { ...prev.players[1], cards: p1 },
        ],
        turnPhase: "attack",
        message: atkIdx === 0 ? "Карты взяты! Вы продолжаете атаку." : "Карты взяты! Бот продолжает атаку.",
      };
    });
    setSelectedCardId(null);
  }, [human.id, ai.id]);

  // Human attacks with card
  const handleHumanAttack = (card: DurakCard) => {
    if (game.attackerIndex !== 0) return;
    if (game.table.length >= 6) return;
    if (game.table.length > 0 && !canToss(card, game.table)) {
      sound.playError();
      return;
    }

    sound.playCardFlip();
    setGame((prev) => ({
      ...prev,
      players: prev.players.map((p, idx) =>
        idx === 0 ? { ...p, cards: p.cards.filter((c) => c.id !== card.id) } : p
      ),
      table: [...prev.table, { attack: card }],
      turnPhase: "defend",
      message: "Вы пошли картой. Ожидание защиты бота...",
    }));
    setSelectedCardId(null);
  };

  // Human defends against an open attack pair
  const handleHumanDefend = (card: DurakCard, tableIndex: number) => {
    const targetPair = game.table[tableIndex];
    if (!targetPair || targetPair.defense) return;

    if (!canDefend(card, targetPair.attack, game.trumpSuit)) {
      sound.playError();
      return;
    }

    sound.playCardFlip();
    setGame((prev) => {
      const updatedTable = prev.table.map((pair, idx) =>
        idx === tableIndex ? { ...pair, defense: card } : pair
      );

      const allDefended = updatedTable.every((p) => !!p.defense);

      return {
        ...prev,
        players: prev.players.map((p, idx) =>
          idx === 0 ? { ...p, cards: p.cards.filter((c) => c.id !== card.id) } : p
        ),
        table: updatedTable,
        turnPhase: allDefended ? "toss" : "defend",
        message: allDefended
          ? "Все карты отбиты! Бот решает, подкидывать ли еще..."
          : "Вы отбили карту! Защищайтесь дальше или ждите.",
      };
    });
    setSelectedCardId(null);
  };

  // AI Turn Logic Loop
  useEffect(() => {
    if (game.status !== "playing") return;

    // AI as Attacker
    if (game.attackerIndex === 1) {
      if (game.turnPhase === "attack" || game.turnPhase === "toss") {
        setIsAiThinking(true);
        if (aiTimerRef.current) clearTimeout(aiTimerRef.current);

        aiTimerRef.current = setTimeout(() => {
          setIsAiThinking(false);

          const aiCards = ai.cards;
          if (aiCards.length === 0) return;

          // First card of attack: AI chooses lowest non-trump card, or lowest trump
          if (game.table.length === 0) {
            const nonTrumps = aiCards.filter((c) => c.suit !== game.trumpSuit).sort((a, b) => a.value - b.value);
            const trumps = aiCards.filter((c) => c.suit === game.trumpSuit).sort((a, b) => a.value - b.value);
            const attackCard = nonTrumps[0] || trumps[0];

            sound.playCardFlip();
            setGame((prev) => ({
              ...prev,
              players: prev.players.map((p, idx) =>
                idx === 1 ? { ...p, cards: p.cards.filter((c) => c.id !== attackCard.id) } : p
              ),
              table: [...prev.table, { attack: attackCard }],
              turnPhase: "defend",
              message: `Бот пошел картой ${attackCard.rank} ${attackCard.suit}. Отбивайтесь!`,
            }));
          } else {
            // Tossing phase: check if AI can toss matching card (avoid tossing high trumps)
            const allDefended = game.table.every((p) => !!p.defense);
            if (allDefended) {
              const tossable = aiCards
                .filter((c) => canToss(c, game.table))
                .filter((c) => c.suit !== game.trumpSuit || c.value <= 10)
                .sort((a, b) => a.value - b.value);

              if (tossable.length > 0 && game.table.length < 6 && human.cards.length > 0) {
                const tossCard = tossable[0];
                sound.playCardFlip();
                setGame((prev) => ({
                  ...prev,
                  players: prev.players.map((p, idx) =>
                    idx === 1 ? { ...p, cards: p.cards.filter((c) => c.id !== tossCard.id) } : p
                  ),
                  table: [...prev.table, { attack: tossCard }],
                  turnPhase: "defend",
                  message: `Бот подкинул ${tossCard.rank} ${tossCard.suit}!`,
                }));
              } else {
                // AI cannot toss more -> BITO!
                handleBito();
              }
            }
          }
        }, 1200);
      }
    }

    // AI as Defender
    if (game.defenderIndex === 1 && game.turnPhase === "defend") {
      const undefendedIdx = game.table.findIndex((p) => !p.defense);
      if (undefendedIdx !== -1) {
        const attackCard = game.table[undefendedIdx].attack;
        setIsAiThinking(true);
        if (aiTimerRef.current) clearTimeout(aiTimerRef.current);

        aiTimerRef.current = setTimeout(() => {
          setIsAiThinking(false);

          // Find valid defense cards
          const validDefenses = ai.cards
            .filter((c) => canDefend(c, attackCard, game.trumpSuit))
            .sort((a, b) => {
              // Prefer non-trump over trump
              if (a.suit === game.trumpSuit && b.suit !== game.trumpSuit) return 1;
              if (a.suit !== game.trumpSuit && b.suit === game.trumpSuit) return -1;
              return a.value - b.value;
            });

          if (validDefenses.length > 0) {
            const defenseCard = validDefenses[0];
            sound.playCardFlip();

            setGame((prev) => {
              const updatedTable = prev.table.map((pair, idx) =>
                idx === undefendedIdx ? { ...pair, defense: defenseCard } : pair
              );
              const allDefended = updatedTable.every((p) => !!p.defense);

              return {
                ...prev,
                players: prev.players.map((p, idx) =>
                  idx === 1 ? { ...p, cards: p.cards.filter((c) => c.id !== defenseCard.id) } : p
                ),
                table: updatedTable,
                turnPhase: allDefended ? "toss" : "defend",
                message: `Бот отбил ${attackCard.rank} картой ${defenseCard.rank} ${defenseCard.suit}!`,
              };
            });
          } else {
            // AI cannot beat this card -> Takes all cards
            handleTake();
          }
        }, 1200);
      }
    }

    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, [
    game.status,
    game.attackerIndex,
    game.defenderIndex,
    game.turnPhase,
    game.table,
    game.trumpSuit,
    ai.cards,
    human.cards.length,
    handleBito,
    handleTake,
  ]);

  const sortedHumanCards = sortCards(human.cards, game.trumpSuit);

  const canHumanBito =
    isHumanAttacker &&
    game.table.length > 0 &&
    game.table.every((p) => !!p.defense);

  const canHumanTake =
    isHumanDefender &&
    game.table.some((p) => !p.defense);

  const restartGame = () => {
    setIsGameOverOpen(false);
    setGame(initDurakGame());
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-between min-h-[660px] p-3 sm:p-6 rounded-3xl bg-felt-green border border-emerald-500/30 shadow-2xl relative select-none">
      {/* Top AI Opponent Header */}
      <div className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950/70 backdrop-blur-md border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{ai.avatar}</div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{ai.name}</span>
              {isAiThinking && (
                <span className="text-xs text-emerald-400 font-semibold animate-pulse">
                  (думает...)
                </span>
              )}
            </div>
            <div className="text-xs text-slate-300 font-semibold">
              Карт на руках: {ai.cards.length}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto max-w-xs">
          {ai.cards.map((c, i) => (
            <DurakCardComponent key={c.id || i} card={c} isFaceDown size="sm" />
          ))}
        </div>
      </div>

      {/* Middle Area: Deck, Trump Card & Table Slots */}
      <div className="w-full flex-1 my-4 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Side: Deck with Trump card horizontally underneath */}
        <div className="flex md:flex-col items-center gap-3 p-4 rounded-2xl bg-slate-950/50 backdrop-blur-md border border-emerald-500/20">
          <div className="relative flex items-center justify-center w-28 h-32">
            {/* Trump Card (horizontal bottom) */}
            {game.deck.length > 0 ? (
              <div className="absolute transform rotate-90 scale-90 translate-y-2">
                <DurakCardComponent card={game.trumpCard} isTrump size="md" />
              </div>
            ) : (
              <div className="absolute px-2 py-1 rounded bg-slate-900 border border-amber-400 text-[10px] font-black text-amber-300">
                Козырь: {game.trumpSuit.toUpperCase()}
              </div>
            )}

            {/* Deck of remaining cards on top */}
            {game.deck.length > 0 && (
              <div className="absolute top-0 left-0">
                <DurakCardComponent
                  card={{ id: "back", suit: "spades", rank: "6", value: 6 }}
                  isFaceDown
                  size="md"
                />
                <span className="absolute -bottom-2 right-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[10px] font-extrabold text-amber-300 shadow">
                  {game.deck.length} карт
                </span>
              </div>
            )}
          </div>

          {/* Discard Pile (Бито) */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Бито: {game.discardPile.length}</span>
          </div>
        </div>

        {/* Center: Table attack and defense pairs (up to 6 pairs) */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-3xl bg-slate-950/30 border border-emerald-500/20 min-h-[180px] items-center justify-center">
          {game.table.length === 0 ? (
            <div className="col-span-full text-center text-emerald-300/60 font-semibold text-sm py-8">
              Стол пуст. Ожидание первого хода...
            </div>
          ) : (
            game.table.map((pair, idx) => (
              <div
                key={idx}
                className="relative flex items-center justify-center p-2 rounded-2xl bg-slate-900/40 border border-slate-700/50"
              >
                {/* Attack Card */}
                <div className="relative">
                  <DurakCardComponent card={pair.attack} isTrump={pair.attack.suit === game.trumpSuit} size="md" />
                </div>

                {/* Defense Card (overlapping top) */}
                {pair.defense ? (
                  <div className="absolute top-3 left-6 shadow-2xl">
                    <DurakCardComponent
                      card={pair.defense}
                      isTrump={pair.defense.suit === game.trumpSuit}
                      size="md"
                    />
                  </div>
                ) : (
                  isHumanDefender && (
                    <div className="absolute -bottom-2 right-2 px-1.5 py-0.5 rounded bg-rose-600/90 text-white text-[9px] font-black animate-pulse">
                      ОТБЕЙ
                    </div>
                  )
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message and Action Buttons Bar */}
      <div className="w-full max-w-xl mx-auto mb-3 flex items-center justify-between gap-3 p-2 rounded-2xl bg-slate-950/80 border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 px-2 truncate">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="truncate">{game.message}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canHumanBito && (
            <button
              onClick={handleBito}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95 transition-all"
            >
              БИТО
            </button>
          )}

          {canHumanTake && (
            <button
              onClick={handleTake}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold text-xs shadow-[0_0_15px_rgba(244,63,94,0.4)] hover:scale-105 active:scale-95 transition-all"
            >
              ВЗЯТЬ КАРТЫ
            </button>
          )}
        </div>
      </div>

      {/* Human Player Hand Area */}
      <div className="w-full flex flex-col items-center">
        <div className="flex items-center justify-between w-full max-w-3xl px-4 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-400" />
              {human.name} (Вы)
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-300 font-bold">
              {human.cards.length} карт
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isHumanAttacker ? (
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                Вы атакуете
              </span>
            ) : (
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Вы защищаетесь
              </span>
            )}
          </div>
        </div>

        {/* Player Cards Hand */}
        <div className="w-full max-w-4xl overflow-x-auto pb-4 pt-2 px-4 flex items-center justify-center gap-2 sm:gap-3">
          {sortedHumanCards.map((card) => {
            const isTrump = card.suit === game.trumpSuit;

            const handleCardClick = () => {
              if (isHumanAttacker) {
                handleHumanAttack(card);
              } else if (isHumanDefender) {
                // Find first undefended table pair
                const openIdx = game.table.findIndex((p) => !p.defense);
                if (openIdx !== -1) {
                  handleHumanDefend(card, openIdx);
                }
              }
            };

            return (
              <div key={card.id} className="shrink-0">
                <DurakCardComponent
                  card={card}
                  isTrump={isTrump}
                  isSelected={selectedCardId === card.id}
                  onClick={handleCardClick}
                  size="md"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={isGameOverOpen}
        isWinner={game.winner?.id === human.id}
        title={game.winner?.id === human.id ? "Победа! Вы вышли из игры!" : "Дурак!"}
        subtitle={
          game.winner?.id === human.id
            ? "Поздравляем! Вы избавились от всех карт и выиграли партию."
            : "В этот раз бот переиграл вас. Попробуйте еще раз!"
        }
        stats={[
          { label: "Козырная масть", value: game.trumpSuit.toUpperCase() },
          { label: "Карт в сбросе", value: game.discardPile.length },
        ]}
        onRestart={restartGame}
      />
    </div>
  );
};
