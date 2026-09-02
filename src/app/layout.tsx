import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "ArcadeHub — Портал Настольных и Казуальных Онлайн Игр",
  description: "Играйте в UNO, Дурака, Шашки, Русское Лото, Монополию, Бинго 75, Пинг-Понг и 2048 прямо в браузере. Умный AI, Web Audio API звук, мультиплеер и мгновенный деплой на Vercel.",
  keywords: ["игры онлайн", "настольные игры", "UNO", "Дурак", "Шашки", "Русское лото", "Монополия", "Бинго", "Пинг-понг", "2048", "казуальные игры", "Next.js 15"],
  openGraph: {
    title: "ArcadeHub — Игровой веб-портал нового поколения",
    description: "Коллекция культовых настольных и аркадных игр с чистым звуком и умными ботами.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <body className="min-h-screen bg-arcade-dark text-slate-100 flex flex-col antialiased selection:bg-cyan-500 selection:text-slate-950">
        <Header />
        <div className="flex-1 flex flex-col">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
