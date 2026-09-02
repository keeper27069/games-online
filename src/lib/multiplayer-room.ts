/**
 * Realtime Multiplayer Room Engine
 * Manages room creation, matchmaking queue, presence status,
 * cross-window / WebSockets / BroadcastChannel synchronization, and game events.
 */

import { getCurrentUser, UserAccount } from "./auth-service";

export interface RoomParticipant {
  id: string;
  username: string;
  avatar: string;
  eloRating: number;
  isHost: boolean;
  isReady: boolean;
  isAi: boolean;
  joinedAt: number;
}

export interface RoomChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  avatar: string;
  text: string;
  timestamp: number;
  isReaction?: boolean;
}

export interface MultiplayerGameRoom {
  roomCode: string;
  gameId: string;
  hostId: string;
  maxPlayers: number;
  status: "waiting" | "ready" | "in_game" | "finished";
  participants: RoomParticipant[];
  createdAt: number;
  currentTurnPlayerId?: string;
  gameState?: unknown;
}

export interface RoomActionPayload<T = unknown> {
  type: string;
  playerId: string;
  roomCode: string;
  data: T;
  timestamp: number;
}

type ActionCallback<T = unknown> = (action: RoomActionPayload<T>) => void;
type ChatCallback = (message: RoomChatMessage) => void;
type RoomUpdateCallback = (room: MultiplayerGameRoom) => void;

class MultiplayerRoomManager {
  private activeRoom: MultiplayerGameRoom | null = null;
  private actionListeners: Map<string, ActionCallback[]> = new Map();
  private chatListeners: ChatCallback[] = [];
  private roomUpdateListeners: RoomUpdateCallback[] = [];
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        this.broadcastChannel = new BroadcastChannel("arcadehub_multiplayer_bus");
        this.broadcastChannel.onmessage = (event) => {
          this.handleIncomingBroadcast(event.data);
        };
      } catch {}
    }
  }

  public generateRoomCode(gameId: string): string {
    const prefix = gameId.toUpperCase().slice(0, 3);
    const num = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${num}`;
  }

  public createRoom(gameId: string, maxPlayers = 2): MultiplayerGameRoom {
    const user = getCurrentUser();
    const code = this.generateRoomCode(gameId);

    const room: MultiplayerGameRoom = {
      roomCode: code,
      gameId,
      hostId: user.id,
      maxPlayers,
      status: "waiting",
      participants: [
        {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          eloRating: user.gameRatings?.[gameId] || user.eloRating,
          isHost: true,
          isReady: true,
          isAi: false,
          joinedAt: Date.now(),
        },
      ],
      createdAt: Date.now(),
    };

    this.activeRoom = room;
    this.saveRoomToStorage(room);
    this.broadcast({ type: "ROOM_CREATED", room });
    this.notifyRoomUpdate();

    return room;
  }

  public joinRoom(roomCode: string): { success: boolean; room?: MultiplayerGameRoom; error?: string } {
    const user = getCurrentUser();
    const existing = this.getRoomFromStorage(roomCode);

    if (!existing) {
      return { success: false, error: "Комната с таким кодом не найдена!" };
    }

    if (existing.participants.length >= existing.maxPlayers) {
      return { success: false, error: "Комната уже заполнена!" };
    }

    // Add user if not already in participants
    if (!existing.participants.some((p) => p.id === user.id)) {
      existing.participants.push({
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        eloRating: user.gameRatings?.[existing.gameId] || user.eloRating,
        isHost: false,
        isReady: false,
        isAi: false,
        joinedAt: Date.now(),
      });

      if (existing.participants.length >= existing.maxPlayers) {
        existing.status = "ready";
      }

      this.saveRoomToStorage(existing);
      this.broadcast({ type: "ROOM_UPDATED", room: existing });
    }

    this.activeRoom = existing;
    this.notifyRoomUpdate();

    return { success: true, room: existing };
  }

  public addBotToRoom(): void {
    if (!this.activeRoom) return;
    if (this.activeRoom.participants.length >= this.activeRoom.maxPlayers) return;

    const botAvatars = ["🤖", "👾", "🚀", "⚡", "🐱"];
    const botNames = ["Бот Снайпер", "Кибер Бот", "Нейросеть", "Бот Ветеран", "Бот Гроссмейстер"];
    const rnd = Math.floor(Math.random() * botNames.length);

    this.activeRoom.participants.push({
      id: `bot_${Date.now()}`,
      username: botNames[rnd],
      avatar: botAvatars[rnd],
      eloRating: 1350,
      isHost: false,
      isReady: true,
      isAi: true,
      joinedAt: Date.now(),
    });

    if (this.activeRoom.participants.length >= this.activeRoom.maxPlayers) {
      this.activeRoom.status = "ready";
    }

    this.saveRoomToStorage(this.activeRoom);
    this.broadcast({ type: "ROOM_UPDATED", room: this.activeRoom });
    this.notifyRoomUpdate();
  }

  public toggleReady(): void {
    if (!this.activeRoom) return;
    const user = getCurrentUser();

    this.activeRoom.participants = this.activeRoom.participants.map((p) =>
      p.id === user.id ? { ...p, isReady: !p.isReady } : p
    );

    const allReady = this.activeRoom.participants.every((p) => p.isReady);
    if (allReady && this.activeRoom.participants.length >= 2) {
      this.activeRoom.status = "ready";
    }

    this.saveRoomToStorage(this.activeRoom);
    this.broadcast({ type: "ROOM_UPDATED", room: this.activeRoom });
    this.notifyRoomUpdate();
  }

  public startRoomGame(): void {
    if (!this.activeRoom) return;
    this.activeRoom.status = "in_game";
    this.saveRoomToStorage(this.activeRoom);
    this.broadcast({ type: "GAME_STARTED", room: this.activeRoom });
    this.notifyRoomUpdate();
  }

  public sendAction<T = unknown>(actionType: string, data: T): void {
    if (!this.activeRoom) return;
    const user = getCurrentUser();

    const payload: RoomActionPayload<T> = {
      type: actionType,
      playerId: user.id,
      roomCode: this.activeRoom.roomCode,
      data,
      timestamp: Date.now(),
    };

    this.broadcast({ type: "GAME_ACTION", payload });
  }

  public sendChatMessage(text: string, isReaction = false): void {
    if (!this.activeRoom) return;
    const user = getCurrentUser();

    const msg: RoomChatMessage = {
      id: `msg_${Date.now()}_${Math.random()}`,
      senderId: user.id,
      senderName: user.username,
      avatar: user.avatar,
      text,
      timestamp: Date.now(),
      isReaction,
    };

    this.broadcast({ type: "CHAT_MESSAGE", message: msg });
    this.chatListeners.forEach((cb) => cb(msg));
  }

  public onAction<T = unknown>(actionType: string, callback: ActionCallback<T>): () => void {
    const list = this.actionListeners.get(actionType) || [];
    list.push(callback as ActionCallback);
    this.actionListeners.set(actionType, list);

    return () => {
      const current = this.actionListeners.get(actionType) || [];
      this.actionListeners.set(
        actionType,
        current.filter((cb) => cb !== callback)
      );
    };
  }

  public onChat(callback: ChatCallback): () => void {
    this.chatListeners.push(callback);
    return () => {
      this.chatListeners = this.chatListeners.filter((cb) => cb !== callback);
    };
  }

  public onRoomUpdate(callback: RoomUpdateCallback): () => void {
    this.roomUpdateListeners.push(callback);
    return () => {
      this.roomUpdateListeners = this.roomUpdateListeners.filter((cb) => cb !== callback);
    };
  }

  public getActiveRoom(): MultiplayerGameRoom | null {
    return this.activeRoom;
  }

  public leaveRoom(): void {
    if (!this.activeRoom) return;
    const user = getCurrentUser();

    this.activeRoom.participants = this.activeRoom.participants.filter((p) => p.id !== user.id);
    if (this.activeRoom.participants.length === 0) {
      this.deleteRoomFromStorage(this.activeRoom.roomCode);
    } else {
      this.saveRoomToStorage(this.activeRoom);
      this.broadcast({ type: "ROOM_UPDATED", room: this.activeRoom });
    }

    this.activeRoom = null;
    this.notifyRoomUpdate();
  }

  // --- Private Helpers ---

  private broadcast(data: unknown): void {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(data);
      } catch {}
    }
  }

  private handleIncomingBroadcast(data: any): void {
    if (!data) return;

    if (data.type === "ROOM_UPDATED" || data.type === "GAME_STARTED") {
      if (this.activeRoom && this.activeRoom.roomCode === data.room?.roomCode) {
        this.activeRoom = data.room;
        this.notifyRoomUpdate();
      }
    } else if (data.type === "GAME_ACTION") {
      const payload: RoomActionPayload = data.payload;
      if (this.activeRoom && this.activeRoom.roomCode === payload.roomCode) {
        const listeners = this.actionListeners.get(payload.type) || [];
        listeners.forEach((cb) => cb(payload));
      }
    } else if (data.type === "CHAT_MESSAGE") {
      const msg: RoomChatMessage = data.message;
      this.chatListeners.forEach((cb) => cb(msg));
    }
  }

  private notifyRoomUpdate(): void {
    if (this.activeRoom) {
      this.roomUpdateListeners.forEach((cb) => cb(this.activeRoom!));
    }
  }

  private saveRoomToStorage(room: MultiplayerGameRoom): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(`arcadehub_room_${room.roomCode}`, JSON.stringify(room));
    } catch {}
  }

  private getRoomFromStorage(code: string): MultiplayerGameRoom | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(`arcadehub_room_${code}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private deleteRoomFromStorage(code: string): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(`arcadehub_room_${code}`);
    } catch {}
  }
}

export const multiplayerManager = new MultiplayerRoomManager();
