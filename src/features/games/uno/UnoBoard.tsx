"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { UnoGameState, UnoCard, UnoColor, UnoPlayer } from "./types";
import { initUnoGame, isValidMove, getBestAiColor, shuffleDeck } from "./engine";
import { UnoCardComponent } from "./UnoCard";
import { GameOverModal } from "@/components/ui/GameOverModal";
import { sound } from "@/lib/sound";
import { recordGameResult } from "@/lib/storage";
import { RotateCw, RotateCcw, AlertTriangle, Sparkles, User, Bot } from "lucide-react";

export const UnoBoard: React.FC = () => {
  const [game, setGame] = useState<UnoGameState>(() => initUnoGame(3));
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isGameOverOpen, setIsGameOverOpen] = useState(false);
  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const topCard = game.discardPile[game.discardPile.length - 1];
  const humanPlayer = game.players[0];
  const isHumanTurn = game.currentTurnIndex === 0 && game.status === "playing";

  // Check game over
  useEffect(() => {
    if (game.status === "gameover" && game.winner) {
      setIsGameOverOpen(true);
      const isWinner = game.winner.id === humanPlayer.id;
      recordGameResult("uno", isWinner ? "win" : "loss", isWinner ? 500 : 100);
    }
  }, [game.status, game.winner, humanPlayer.id]);

  // Handle deck replenishment if empty
  const ensureDeck = (currentDeck: UnoCard[], discard: UnoCard[]): { deck: UnoCard[]; discard: UnoCard[] } => {
    if (currentDeck.length > 0) return { deck: currentDeck, discard };
    if (discard.length <= 1) return { deck: currentDeck, discard };
    const top = discard[discard.length - 1];
    const newDeck = shuffleDeck(discard.slice(0, -1));
    return { deck: newDeck, discard: [top] };
  };

  // Next turn advance
  const advanceTurn = useCallback((
    state: UnoGameState,
    step = 1,
    skipNext = false,
    extraDrawCount = 0
  ) => {
    let nextIndex = (state.currentTurnIndex + step * state.direction) % state.players.length;
    if (nextIndex < 0) nextIndex += state.players.length;

    let currentDeck = [...state.deck];
    let currentDiscard = [...state.discardPile];

    // If cards need to be drawn by the next player (e.g. +2 or +4)
    if (extraDrawCount > 0) {
      const targetPlayer = state.players[nextIndex];
      const drawnCards: UnoCard[] = [];
      for (let i = 0; i < extraDrawCount; i++) {
        const replenished = ensureDeck(currentDeck, currentDiscard);
        currentDeck = replenished.deck;
        currentDiscard = replenished.discard;
        if (currentDeck.length > 0) {
          drawnCards.push(currentDeck.pop()!);
        }
      }
      targetPlayer.cards.push(...drawnCards);
      sound.playCardDeal();

      // Next player gets skipped after drawing penalty cards
      nextIndex = (nextIndex + 1 * state.direction) % state.players.length;
      if (nextIndex < 0) nextIndex += state.players.length;
    } else if (skipNext) {
      nextIndex = (nextIndex + 1 * state.direction) % state.players.length;
      if (nextIndex < 0) nextIndex += state.players.length;
    }

    setGame((prev) => ({
      ...prev,
      deck: currentDeck,
      discardPile: currentDiscard,
      currentTurnIndex: nextIndex,
      isColorPickerOpen: false,
      pendingCard: null,
      message:
        nextIndex === 0
          ? "Ваш ход! Выберите карту или возьмите из колоды."
          : `Ход игрока: ${state.players[nextIndex].name}...`,
    }));
  }, []);

  // Play a card
  const playCard = useCallback((card: UnoCard, chosenColor?: UnoColor) => {
    sound.playCardFlip();
    setGame((prev) => {
      const currentPlayer = prev.players[prev.currentTurnIndex];
      const remainingCards = currentPlayer.cards.filter((c) => c.id !== card.id);

      // Check Uno condition: if player had 2 cards and now has 1, check if they called UNO
      let hasUno = currentPlayer.hasCalledUno;
      let penaltyMessage = "";

      if (currentPlayer.cards.length === 2 && !hasUno && !currentPlayer.isAi) {
        // Player forgot to press UNO: Penalty 2 cards!
        const { deck: freshDeck, discard: freshDiscard } = ensureDeck(prev.deck, prev.discardPile);
        const penaltyCards: UnoCard[] = [];
        for (let i = 0; i < 2; i++) {
          if (freshDeck.length > 0) penaltyCards.push(freshDeck.pop()!);
        }
        remainingCards.push(...penaltyCards);
        penaltyMessage = "Штраф 2 карты: вы не нажали UNO!";
        sound.playError();
      }

      const updatedPlayers = prev.players.map((p, idx) =>
        idx === prev.currentTurnIndex
          ? { ...p, cards: remainingCards, hasCalledUno: false }
          : p
      );

      // Check victory
      if (remainingCards.length === 0) {
        return {
          ...prev,
          players: updatedPlayers,
          discardPile: [...prev.discardPile, card],
          status: "gameover",
          winner: currentPlayer,
          message: `${currentPlayer.name} выиграл партию!`,
        };
      }

      // Handle card effects
      let nextDir = prev.direction;
      if (card.value === "reverse") {
        nextDir = (prev.direction * -1) as 1 | -1;
      }

      const nextColor = card.color === "wild" ? chosenColor || "red" : card.color;
      const skip = card.value === "skip";
      const extraDraw = card.value === "draw2" ? 2 : card.value === "wild_draw4" ? 4 : 0;

      const nextState: UnoGameState = {
        ...prev,
        players: updatedPlayers,
        discardPile: [...prev.discardPile, card],
        currentColor: nextColor,
        direction: nextDir,
      };

      setTimeout(() => {
        advanceTurn(nextState, 1, skip, extraDraw);
      }, 300);

      return {
        ...nextState,
        message: penaltyMessage || `Сыграна карта: ${card.color.toUpperCase()} ${card.value}`,
      };
    });
  }, [advanceTurn]);

  // Human player clicks a card
  const handleCardClick = (card: UnoCard) => {
    if (!isHumanTurn) return;
    if (!isValidMove(card, topCard, game.currentColor)) {
      sound.playError();
      return;
    }

    if (card.color === "wild") {
      sound.playClick();
      setGame((prev) => ({
        ...prev,
        isColorPickerOpen: true,
        pendingCard: card,
      }));
      return;
    }

    playCard(card);
  };

  // Human selects color for wild card
  const handleColorSelect = (color: UnoColor) => {
    if (!game.pendingCard) return;
    const card = game.pendingCard;
    setGame((prev) => ({ ...prev, isColorPickerOpen: false, pendingCard: null }));
    playCard(card, color);
  };

  // Human draws a card from deck
  const handleDrawCard = () => {
    if (!isHumanTurn) return;
    sound.playCardDeal();

    setGame((prev) => {
      const { deck: freshDeck, discard: freshDiscard } = ensureDeck(prev.deck, prev.discardPile);
      if (freshDeck.length === 0) return prev;

      const drawn = freshDeck.pop()!;
      const updatedPlayers = prev.players.map((p, idx) =>
        idx === 0 ? { ...p, cards: [...p.cards, drawn] } : p
      );

      // Check if drawn card can be played immediately
      const canPlay = isValidMove(drawn, topCard, prev.currentColor);

      const nextState = {
        ...prev,
        deck: freshDeck,
        discardPile: freshDiscard,
        players: updatedPlayers,
      };

      if (!canPlay) {
        setTimeout(() => advanceTurn(nextState, 1), 600);
      }

      return {
        ...nextState,
        message: canPlay
          ? "Вы взяли карту! Вы можете сыграть её или пропустить ход."
          : "Вы взяли карту. Подходящих карт нет, ход переходит дальше.",
      };
    });
  };

  // Human yells UNO!
  const handleCallUno = () => {
    sound.playUnoAlert();
    setGame((prev) => ({
      ...prev,
      players: prev.players.map((p, idx) => (idx === 0 ? { ...p, hasCalledUno: true } : p)),
      message: "🔥 ВЫ КРИКНУЛИ: UNO!",
    }));
  };

  // AI turn automation
  useEffect(() => {
    if (game.status !== "playing") return;
    const activePlayer = game.players[game.currentTurnIndex];

    if (activePlayer.isAi) {
      setIsAiThinking(true);
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);

      aiTimeoutRef.current = setTimeout(() => {
        setIsAiThinking(false);

        // Find valid card in AI's hand
        const playableCards = activePlayer.cards.filter((c) =>
          isValidMove(c, topCard, game.currentColor)
        );

        if (playableCards.length > 0) {
          // AI prefers non-wild first, then action cards, then wild
          const normalCard = playableCards.find((c) => c.color !== "wild");
          const cardToPlay = normalCard || playableCards[0];

          // If AI has 2 cards and plays 1, it automatically calls UNO with 90% chance
          if (activePlayer.cards.length === 2 && Math.random() < 0.9) {
            sound.playUnoAlert();
          }

          if (cardToPlay.color === "wild") {
            const bestColor = getBestAiColor(activePlayer.cards);
            playCard(cardToPlay, bestColor);
          } else {
            playCard(cardToPlay);
          }
        } else {
          // AI must draw from deck
          sound.playCardDeal();
          setGame((prev) => {
            const { deck: freshDeck, discard: freshDiscard } = ensureDeck(prev.deck, prev.discardPile);
            if (freshDeck.length === 0) return prev;

            const drawn = freshDeck.pop()!;
            const updatedAiCards = [...activePlayer.cards, drawn];

            const updatedPlayers = prev.players.map((p, idx) =>
              idx === prev.currentTurnIndex ? { ...p, cards: updatedAiCards } : p
            );

            // Can AI play the drawn card immediately?
            const canPlayDrawn = isValidMove(drawn, topCard, prev.currentColor);

            const nextState = {
              ...prev,
              deck: freshDeck,
              discardPile: freshDiscard,
              players: updatedPlayers,
            };

            if (canPlayDrawn) {
              setTimeout(() => {
                if (drawn.color === "wild") {
                  playCard(drawn, getBestAiColor(updatedAiCards));
                } else {
                  playCard(drawn);
                }
              }, 600);
            } else {
              setTimeout(() => advanceTurn(nextState, 1), 600);
            }

            return {
              ...nextState,
              message: `${activePlayer.name} берет карту из колоды...`,
            };
          });
        }
      }, 1200);
    }

    return () => {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    };
  }, [game.currentTurnIndex, game.status, game.currentColor, topCard, playCard, advanceTurn]);

  const restartGame = () => {
    setIsGameOverOpen(false);
    setGame(initUnoGame(3));
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-between min-h-[650px] p-2 sm:p-6 rounded-3xl bg-felt-blue border border-cyan-500/20 shadow-2xl relative select-none">
      {/* Top Bar: Opponents Row */}
      <div className="w-full flex items-center justify-around gap-4 p-3 rounded-2xl bg-slate-950/60 backdrop-blur-md border border-slate-800">
        {game.players.slice(1).map((bot, i) => {
          const isCurrent = game.currentTurnIndex === i + 1;
          return (
            <div
              key={bot.id}
              className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                isCurrent
                  ? "bg-cyan-950/60 border-cyan-400 shadow-[0_0_15px_rgba(0,210,255,0.4)] scale-105"
                  : "bg-slate-900/50 border-slate-800"
              }`}
            >
              <div className="text-2xl">{bot.avatar}</div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">{bot.name}</span>
                  {isCurrent && isAiThinking && (
                    <span className="text-[10px] text-cyan-300 font-semibold animate-pulse">
                      (думает...)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[11px] font-bold text-slate-300">
                    {bot.cards.length} {bot.cards.length === 1 ? "карта" : "карт"}
                  </span>
                  {bot.cards.length === 1 && (
                    <span className="text-[9px] font-black px-1 rounded bg-red-600 text-white animate-bounce">
                      UNO!
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle Playing Area: Direction, Deck, Discard Pile & Color Indicator */}
      <div className="my-6 flex flex-col sm:flex-row items-center justify-center gap-8 relative">
        {/* Table Felt Circle Background */}
        <div className="flex items-center justify-center gap-6 p-6 rounded-3xl bg-slate-950/40 backdrop-blur-md border border-slate-700/50 shadow-inner">
          {/* Draw Deck */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleDrawCard}
              disabled={!isHumanTurn}
              className={`relative transition-transform active:scale-95 ${
                isHumanTurn
                  ? "cursor-pointer hover:scale-105 ring-4 ring-cyan-400/50 rounded-2xl"
                  : "opacity-80"
              }`}
              title="Взять карту из колоды"
            >
              <UnoCardComponent
                card={{ id: "deck_back", color: "red", value: "0" }}
                isFaceDown
                size="md"
              />
              <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[10px] font-extrabold text-cyan-300 shadow">
                {game.deck.length} карт
              </span>
            </button>
            <span className="text-[11px] font-semibold text-slate-400">Колода</span>
          </div>

          {/* Direction Indicator */}
          <div className="flex flex-col items-center justify-center gap-1 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            {game.direction === 1 ? (
              <RotateCw className="w-7 h-7 text-cyan-400 animate-spin-slow" />
            ) : (
              <RotateCcw className="w-7 h-7 text-pink-400 animate-spin-slow" />
            )}
            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">
              {game.direction === 1 ? "По часовой" : "Против часовой"}
            </span>
          </div>

          {/* Active Discard Pile */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              {topCard && (
                <UnoCardComponent card={topCard} isPlayable={false} size="md" />
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400">Текущий цвет:</span>
              <span
                className={`w-3.5 h-3.5 rounded-full border border-white/50 shadow ${
                  game.currentColor === "red"
                    ? "bg-red-500 shadow-red-500/50"
                    : game.currentColor === "blue"
                    ? "bg-blue-500 shadow-blue-500/50"
                    : game.currentColor === "green"
                    ? "bg-emerald-500 shadow-emerald-500/50"
                    : "bg-amber-400 shadow-amber-400/50"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Big UNO Scream Button */}
        {humanPlayer.cards.length <= 2 && isHumanTurn && (
          <button
            onClick={handleCallUno}
            className="flex flex-col items-center justify-center w-24 h-24 rounded-full bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 text-white font-black text-2xl tracking-tighter border-4 border-amber-300 shadow-[0_0_35px_rgba(239,68,68,0.8)] animate-pulse hover:scale-110 active:scale-95 transition-transform"
          >
            <span>UNO!</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-amber-200">
              ЖМИ!
            </span>
          </button>
        )}
      </div>

      {/* Action Notification Message Bar */}
      <div className="w-full max-w-xl mx-auto mb-3 text-center py-2 px-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-semibold text-cyan-300 flex items-center justify-center gap-2 shadow">
        <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
        <span>{game.message}</span>
      </div>

      {/* Human Player Hand */}
      <div className="w-full flex flex-col items-center">
        <div className="flex items-center justify-between w-full max-w-2xl px-4 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white flex items-center gap-1.5">
              <User className="w-4 h-4 text-cyan-400" />
              {humanPlayer.name} (Вы)
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-300 font-bold">
              {humanPlayer.cards.length} карт
            </span>
          </div>

          {isHumanTurn && (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Ваш ход
            </span>
          )}
        </div>

        {/* Horizontal Scrollable Hand Cards */}
        <div className="w-full max-w-3xl overflow-x-auto pb-4 pt-2 px-4 flex items-center justify-center gap-2 sm:gap-3">
          {humanPlayer.cards.map((card) => {
            const playable = isHumanTurn && isValidMove(card, topCard, game.currentColor);
            return (
              <div key={card.id} className="shrink-0 transition-transform">
                <UnoCardComponent
                  card={card}
                  isPlayable={playable}
                  onClick={() => handleCardClick(card)}
                  size="md"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Wild Card Color Picker Modal */}
      {game.isColorPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl glass-panel border border-cyan-500/40 p-6 text-center shadow-2xl">
            <h3 className="text-lg font-black text-white mb-2">Выберите цвет хода</h3>
            <p className="text-xs text-slate-300 mb-6">Дикая карта позволяет назначить любой цвет</p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleColorSelect("red")}
                className="py-4 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 text-white font-black text-base shadow-[0_0_15px_rgba(239,68,68,0.5)] hover:scale-105 transition-transform"
              >
                КРАСНЫЙ
              </button>
              <button
                onClick={() => handleColorSelect("blue")}
                className="py-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white font-black text-base shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:scale-105 transition-transform"
              >
                СИНИЙ
              </button>
              <button
                onClick={() => handleColorSelect("green")}
                className="py-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-black text-base shadow-[0_0_15px_rgba(16,185,129,0.5)] hover:scale-105 transition-transform"
              >
                ЗЕЛЕНЫЙ
              </button>
              <button
                onClick={() => handleColorSelect("yellow")}
                className="py-4 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white font-black text-base shadow-[0_0_15px_rgba(245,158,11,0.5)] hover:scale-105 transition-transform"
              >
                ЖЕЛТЫЙ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={isGameOverOpen}
        isWinner={game.winner?.id === humanPlayer.id}
        title={game.winner?.id === humanPlayer.id ? "УНО! Победа!" : "Партия завершена"}
        subtitle={
          game.winner?.id === humanPlayer.id
            ? "Вы успешно избавились от всех карт и одолели ботов!"
            : `${game.winner?.name} первым сбросил свои карты.`
        }
        stats={[
          { label: "Победитель", value: game.winner?.name || "-" },
          { label: "Карт у вас", value: humanPlayer.cards.length },
        ]}
        onRestart={restartGame}
      />
    </div>
  );
};
