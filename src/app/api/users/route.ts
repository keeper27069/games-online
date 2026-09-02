import { NextResponse } from "next/server";

// In-memory serverless cache
const serverUsers: Array<{
  id: string;
  username: string;
  avatar: string;
  email?: string;
  eloRating: number;
  level: number;
  coins: number;
  createdAt: string;
}> = [
  {
    id: "champ_1",
    username: "GrandMaster_Pro",
    avatar: "👑",
    email: "grandmaster@arcadehub.io",
    eloRating: 2180,
    level: 42,
    coins: 15400,
    createdAt: "2026-01-10T12:00:00Z",
  },
  {
    id: "champ_2",
    username: "CyberQueen",
    avatar: "⚡",
    email: "cyberqueen@arcadehub.io",
    eloRating: 1980,
    level: 35,
    coins: 11200,
    createdAt: "2026-02-01T12:00:00Z",
  },
];

const sanitize = (str: string) => {
  return str.replace(/[<>'"&/]/g, "").trim();
};

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      totalUsers: serverUsers.length,
      users: serverUsers.map((u) => ({
        id: u.id,
        username: u.username,
        avatar: u.avatar,
        eloRating: u.eloRating,
        level: u.level,
        coins: u.coins,
        createdAt: u.createdAt,
      })),
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
      },
    }
  );
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { success: false, error: "Content-Type must be application/json" },
        { status: 415 }
      );
    }

    const body = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { email, username, avatar } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Некорректный Email" },
        { status: 400 }
      );
    }

    if (!username || typeof username !== "string" || username.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Никнейм должен быть не менее 2 символов" },
        { status: 400 }
      );
    }

    const cleanEmail = sanitize(email).toLowerCase();
    const cleanUsername = sanitize(username).slice(0, 20);
    const cleanAvatar = typeof avatar === "string" ? sanitize(avatar).slice(0, 4) : "🚀";

    const newUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      email: cleanEmail,
      username: cleanUsername,
      avatar: cleanAvatar || "🚀",
      eloRating: 1200,
      level: 1,
      coins: 1000,
      createdAt: new Date().toISOString(),
    };

    serverUsers.push(newUser);

    return NextResponse.json({
      success: true,
      message: "Пользователь успешно зарегистрирован",
      user: {
        id: newUser.id,
        username: newUser.username,
        avatar: newUser.avatar,
        eloRating: newUser.eloRating,
        level: newUser.level,
        coins: newUser.coins,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Ошибка обработки запроса" },
      { status: 500 }
    );
  }
}
