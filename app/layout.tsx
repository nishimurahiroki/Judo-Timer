import type { Metadata } from "next";
import { Istok_Web } from "next/font/google";
import "./globals.css";

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
  viewport: {
    width: "device-width",
    initialScale: 1.0,
    maximumScale: 1.0,
    userScalable: false,
    viewportFit: "cover",
  },
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
          {/* 各ページがレイアウトを決めやすいように、mainはシンプルにしておく */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
