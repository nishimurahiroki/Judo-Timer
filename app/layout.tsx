import type { Metadata } from "next";
import { Istok_Web } from "next/font/google";
import "./globals.css";
import { AppNavBar } from "@/components/layout/AppNavBar";

const istokWeb = Istok_Web({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-istok-web",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gatame Judo Timer",
  description:
    "Judo match timer, Kosen judo timer, and program training timer.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={istokWeb.variable}>
      <body className="bg-black text-white">
        <div className="min-h-screen flex flex-col">
          <AppNavBar />
          {/* 各ページがレイアウトを決めやすいように、mainはシンプルにしておく */}
          <main className="flex-1 px-2 sm:px-4 py-4">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
