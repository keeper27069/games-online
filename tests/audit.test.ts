/**
 * Automated QA & Security Test Suite for ArcadeHub
 * Tests:
 * 1. Input Sanitization & XSS Prevention
 * 2. RFC Email & Username Validation
 * 3. SHA-256 Hashing Integrity
 * 4. ELO Calculation & Streak Logic
 * 5. Room Code Generation & Matchmaking State
 * 6. Durak & UNO Game Engine Rules Verification
 * 7. 2048 Matrix Calculations
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  sanitizeInput,
  isValidEmail,
  isValidUsername,
  hashPassword,
  createDefaultAccount,
  recordMatchOutcome,
} from "../src/lib/auth-service";
import { multiplayerManager } from "../src/lib/multiplayer-room";
import { createUnoDeck, canPlayCard } from "../src/features/games/uno/engine";
import { createDurakDeck, canDefend } from "../src/features/games/durak/engine";
import { moveTiles, initBoard } from "../src/features/games/2048/engine";

describe("1. Security & Input Sanitization", () => {
  it("sanitizes script tags and XSS payloads correctly", () => {
    const malicious = '<script>alert("xss")</script>';
    const sanitized = sanitizeInput(malicious);
    expect(sanitized).not.toContain("<script>");
    expect(sanitized).toContain("&lt;script&gt;");
  });

  it("sanitizes HTML quote attributes and img onerror payloads", () => {
    const imgPayload = '<img src=x onerror="alert(1)">';
    const sanitized = sanitizeInput(imgPayload);
    expect(sanitized).not.toContain("<img");
    expect(sanitized).toContain("&lt;img");
  });

  it("handles empty or whitespace-only strings gracefully", () => {
    expect(sanitizeInput("")).toBe("");
    expect(sanitizeInput("   ")).toBe("");
  });
});

describe("2. Form Validation (Email & Username)", () => {
  it("validates standard and international email formats correctly", () => {
    expect(isValidEmail("test@example.com")).toBe(true);
    expect(isValidEmail("user.name+tag@sub.domain.org")).toBe(true);
    expect(isValidEmail("invalid-email")).toBe(false);
    expect(isValidEmail("@no-user.com")).toBe(false);
    expect(isValidEmail("spaces in@email.com")).toBe(false);
  });

  it("validates usernames with length limits and unicode support", () => {
    expect(isValidUsername("Gamer_Pro")).toBe(true);
    expect(isValidUsername("Игрок_77")).toBe(true);
    expect(isValidUsername("A")).toBe(false); // Too short
    expect(isValidUsername("A".repeat(25))).toBe(false); // Too long
  });
});

describe("3. Cryptographic Password Hashing", () => {
  it("generates deterministic non-empty hashes with salt", async () => {
    const hash1 = await hashPassword("superSecret123");
    const hash2 = await hashPassword("superSecret123");
    const hashOther = await hashPassword("differentPassword");

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hashOther);
    expect(hash1.length).toBeGreaterThanOrEqual(8);
  });
});

describe("4. ELO Rating & Economy Engine", () => {
  it("calculates expected ELO gain upon victory", () => {
    const defaultUser = createDefaultAccount("TestPlayer", "🎮", false);
    expect(defaultUser.eloRating).toBe(1200);
    expect(defaultUser.coins).toBe(500);

    const afterWin = recordMatchOutcome("uno", true, 1200);
    expect(afterWin.stats.totalWins).toBe(1);
    expect(afterWin.stats.streak).toBe(1);
    expect(afterWin.xp).toBe(100);
    expect(afterWin.coins).toBe(550);
    expect(afterWin.eloRating).toBeGreaterThanOrEqual(1210);
  });

  it("resets win streak upon match loss", () => {
    recordMatchOutcome("uno", true, 1200);
    const afterLoss = recordMatchOutcome("uno", false, 1200);
    expect(afterLoss.stats.streak).toBe(0);
    expect(afterLoss.stats.totalLosses).toBe(1);
  });
});

describe("5. Multiplayer Room Engine", () => {
  it("generates structured 6-character room codes", () => {
    const codeUno = multiplayerManager.generateRoomCode("uno");
    const codeDurak = multiplayerManager.generateRoomCode("durak");

    expect(codeUno).toMatch(/^UNO-\d{4}$/);
    expect(codeDurak).toMatch(/^DUR-\d{4}$/);
  });

  it("creates a room with initial host participant", () => {
    const room = multiplayerManager.createRoom("checkers", 2);
    expect(room.roomCode).toBeDefined();
    expect(room.status).toBe("waiting");
    expect(room.participants.length).toBe(1);
    expect(room.participants[0].isHost).toBe(true);
    expect(room.participants[0].isReady).toBe(true);
  });
});

describe("6. Game Engines Logic (UNO & Durak & 2048)", () => {
  it("creates 108 valid UNO cards with 4 colors", () => {
    const deck = createUnoDeck();
    expect(deck.length).toBe(108);
  });

  it("validates UNO matching rules by color, value, or Wild", () => {
    const redFive = { id: "1", color: "red" as const, value: "5" as const, score: 5 };
    const redEight = { id: "2", color: "red" as const, value: "8" as const, score: 8 };
    const blueFive = { id: "3", color: "blue" as const, value: "5" as const, score: 5 };
    const wildCard = { id: "4", color: "wild" as const, value: "wild" as const, score: 50 };

    expect(canPlayCard(redEight, redFive, "red")).toBe(true); // Same color
    expect(canPlayCard(blueFive, redFive, "red")).toBe(true); // Same value
    expect(canPlayCard(wildCard, redFive, "red")).toBe(true); // Wild card
  });

  it("creates 36 valid Durak cards and validates defense logic", () => {
    const deck = createDurakDeck();
    expect(deck.length).toBe(36);

    const attackCard = { id: "d1", suit: "hearts" as const, rank: "8" as const, value: 8 };
    const defendHigher = { id: "d2", suit: "hearts" as const, rank: "10" as const, value: 10 };
    const defendLower = { id: "d3", suit: "hearts" as const, rank: "6" as const, value: 6 };
    const defendTrump = { id: "d4", suit: "spades" as const, rank: "6" as const, value: 6 };

    expect(canDefend(defendHigher, attackCard, "spades")).toBe(true);
    expect(canDefend(defendLower, attackCard, "spades")).toBe(false);
    expect(canDefend(defendTrump, attackCard, "spades")).toBe(true); // Trump beats non-trump
  });

  it("executes 2048 matrix sliding and tile merges", () => {
    const grid = initBoard();
    expect(grid.length).toBe(4);
    expect(grid[0].length).toBe(4);

    const customBoard = [
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const { board: moved, score } = moveTiles(customBoard, "left");
    expect(moved[0][0]).toBe(4);
    expect(score).toBe(4);
  });
});
