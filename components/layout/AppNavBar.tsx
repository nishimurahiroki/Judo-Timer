"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/judo", label: "Judo Timer" },
  { href: "/kosen", label: "Kosen Timer" },
  { href: "/program", label: "Program Timer" },
  { href: "/help", label: "Help" },
];

export function AppNavBar() {
  const pathname = usePathname();
  const [shouldHide, setShouldHide] = useState(false);

  // Check if we're in ProgramTimer Run mode on mobile
  useEffect(() => {
    if (pathname !== "/program") {
      setShouldHide(false);
      return;
    }

    const checkRunMode = () => {
      const isRunMode =
        typeof document !== "undefined" &&
        document.body.hasAttribute("data-program-run-mode");
      setShouldHide(isRunMode);
    };

    checkRunMode();
    const interval = setInterval(checkRunMode, 100);

    return () => clearInterval(interval);
  }, [pathname]);

  // Hide AppNavBar when in ProgramTimer Run mode on mobile
  if (shouldHide) {
    return null;
  }

  return (
    <header className="border-b border-neutral-800 bg-black/80 backdrop-blur relative z-40">
      <div className="mx-auto max-w-5xl flex items-center justify-between px-3 sm:px-4 py-2">
        {/* 左側：ロゴ / タイトル */}
        <Link href="/" className="text-sm sm:text-base font-semibold">
          Gatame Judo Timer
        </Link>

        {/* 右側：ナビ */}
        <nav className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "px-2 py-1 rounded-md transition",
                  isActive
                    ? "bg-white text-black"
                    : "text-neutral-300 hover:bg-neutral-800",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
