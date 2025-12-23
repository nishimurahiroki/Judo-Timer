import type { Metadata, Viewport } from "next";
import { Istok_Web } from "next/font/google";
import { MobileZoomPrevention } from "@/components/layout/MobileZoomPrevention";
import { AudioAuditInstaller } from "@/components/dev/AudioAuditInstaller";
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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={istokWeb.variable}>
      <body className="bg-black text-white">
        <MobileZoomPrevention />
        {/* 開発時のみ有効なオーディオ監査フック（UIには影響しない） */}
        <AudioAuditInstaller />
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
