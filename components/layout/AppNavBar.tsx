 "use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * アプリ共通の上部ナビゲーションバー
 *
 * - `/judo`, `/kosen`, `/program`, `/help` へのリンクを表示
 * - `program` 実行画面モバイル表示時は、`body[data-program-run-mode="true"]` を見て非表示
 */
export const AppNavBar: React.FC = () => {
  const pathname = usePathname();
  const [hideOnMobileRunMode, setHideOnMobileRunMode] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      if (typeof window === "undefined") return;

      const isProgramRunMode =
        document.body.getAttribute("data-program-run-mode") === "true";
      const isMobile = window.innerWidth < 1024; // Tailwind の lg ブレークポイントに合わせる

      setHideOnMobileRunMode(isProgramRunMode && isMobile);
    };

    updateVisibility();

    window.addEventListener("resize", updateVisibility);

    const observer = new MutationObserver(() => {
      updateVisibility();
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-program-run-mode"],
    });

    return () => {
      window.removeEventListener("resize", updateVisibility);
      observer.disconnect();
    };
  }, []);

  if (hideOnMobileRunMode) {
    return null;
  }

  const navItems: { href: string; label: string }[] = [
    { href: "/judo", label: "柔道タイマー" },
    { href: "/kosen", label: "高専柔道タイマー" },
    { href: "/program", label: "プログラムタイマー" },
    { href: "/help", label: "使い方" },
  ];

  return (
    <header className="w-full border-b border-white/10 bg-black/60 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto max-w-5xl px-3 sm:px-4 py-2 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-wide text-white">
            Gatame Judo Timer
          </span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-1 transition-colors ${
                  isActive
                    ? "bg-white text-black font-semibold"
                    : "text-gray-200 hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};





