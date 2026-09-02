import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    platform: "ArcadeHub Vercel Edge Serverless",
    serverStatus: "HEALTHY",
    activeMatchmakingQueues: [
      { game: "uno", onlinePlayers: 18, openRooms: 4 },
      { game: "durak", onlinePlayers: 24, openRooms: 6 },
      { game: "checkers", onlinePlayers: 12, openRooms: 3 },
      { game: "ping-pong", onlinePlayers: 15, openRooms: 5 },
      { game: "monopoly", onlinePlayers: 9, openRooms: 2 },
    ],
    timestamp: new Date().toISOString(),
  });
}
