import { NextResponse } from "next/server";

// In-memory / serverless store simulation for Vercel
let serverUsers: any[] = [
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

export async function GET() {
  return NextResponse.json({
    success: true,
    totalUsers: serverUsers.length,
    users: serverUsers,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, username, avatar } = body;

    if (!email || !username) {
      return NextResponse.json(
        { success: false, error: "Email и никнейм обязательны" },
        { status: 400 }
      );
    }

    const newUser = {
      id: `user_${Date.now()}`,
      email,
      username,
      avatar: avatar || "🚀",
      eloRating: 1200,
      level: 1,
      coins: 1000,
      createdAt: new Date().toISOString(),
    };

    serverUsers.push(newUser);

    return NextResponse.json({
      success: true,
      message: "Пользователь успешно зарегистрирован на сервере",
      user: newUser,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Ошибка сервера" },
      { status: 500 }
    );
  }
}
