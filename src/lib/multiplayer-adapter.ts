/**
 * Abstract Realtime Room & Multiplayer Adapter
 * Allows offline AI gameplay, Pass & Play (hotseat), and room state synchronization
 * ready for Supabase Realtime Channels / PartyKit / Polling serverless endpoints.
 */

export type RoomMode = "ai" | "pass-and-play" | "online-room";

export interface PlayerInfo {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isAi: boolean;
}

export interface RoomState<T = unknown> {
  roomId: string;
  gameId: string;
  mode: RoomMode;
  players: PlayerInfo[];
  gameState: T;
  version: number;
}

export class MultiplayerAdapter<T = unknown> {
  private roomId: string;
  private gameId: string;
  private mode: RoomMode;
  private state: T | null = null;
  private listeners: ((state: T) => void)[] = [];

  constructor(gameId: string, mode: RoomMode = "ai") {
    this.gameId = gameId;
    this.mode = mode;
    this.roomId = this.generateRoomCode();
  }

  public generateRoomCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  public getRoomId(): string {
    return this.roomId;
  }

  public getMode(): RoomMode {
    return this.mode;
  }

  public setMode(mode: RoomMode) {
    this.mode = mode;
  }

  public subscribe(callback: (state: T) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  public broadcastState(nextState: T) {
    this.state = nextState;
    this.listeners.forEach((listener) => listener(nextState));
  }

  public getState(): T | null {
    return this.state;
  }
}
