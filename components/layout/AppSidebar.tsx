// components/layout/AppSidebar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";

type MenuItem = "home" | "judo" | "kosen" | "program";

type AppSidebarProps = {
  activeItem: MenuItem;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  drawerMode?: boolean; // If true, always show as drawer overlay (for Home page on PC)
};

export function AppSidebar({
  activeItem,
  isMobile = false,
  isOpen = false,
  onClose,
  drawerMode = false,
}: AppSidebarProps) {
  const menuItems: Array<{
    href: string;
    label: string;
    item: MenuItem;
    iconType?: "home";
    iconPath?: string;
  }> = [
    { href: "/", label: "Home", item: "home", iconType: "home" },
    { href: "/judo", label: "Judo", item: "judo", iconPath: "/image/judo_timer_icon.png" },
    { href: "/kosen", label: "Kosen", item: "kosen", iconPath: "/image/kosen_timer_icon.png" },
    { href: "/program", label: "Program", item: "program", iconPath: "/image/program_timer_icon.png" },
  ];

  // Drawer mode (mobile or PC drawer)
  if (isMobile || drawerMode) {
    if (!isOpen) {
      return null;
    }

    return (
      <>
        {/* Backdrop overlay */}
        <div
          className="fixed inset-0"
          onClick={onClose}
          style={{ zIndex: 20, backgroundColor: "rgba(0, 0, 0, 0.3)" }}
        />
        {/* Drawer */}
        <aside
          className="fixed top-0 left-0 h-full flex flex-col shadow-xl"
          style={{
            width: isMobile ? "60vw" : "calc(100vw * (273 / 1440))",
            maxWidth: isMobile ? "60vw" : "calc(100vw * (273 / 1440))",
            zIndex: 25,
            transition: "transform 0.3s ease-in-out",
            borderRadius: "0 10px 10px 0",
            overflow: "hidden",
            backgroundColor: "rgba(228, 244, 255, 0.9)",
          }}
        >
          {/* Close button */}
          <div className="flex items-center justify-end p-4">
            <button
              onClick={onClose}
              className="text-[#2B00FF] hover:bg-[#D0E8FF] rounded-md p-2 transition-colors"
              aria-label="Close menu"
              style={{
                width: isMobile ? "10vw" : "calc(120vw * (30 / 1440))",
                height: isMobile ? "10vw" : "calc(120vw * (30 / 1440))",
              }}
            >
              <svg
                style={{ width: "100%", height: "100%" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {menuItems.map((item) => {
            const isActive = item.item === activeItem;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center transition-colors ${
                  isActive
                    ? "bg-[#2B00FF] text-white"
                    : "text-[#2B00FF] hover:bg-[#D0E8FF]"
                }`}
                style={{
                  padding: isMobile ? "3vh 4vw" : "2vh 2vw",
                  gap: isMobile ? "4vw" : "3vw",
                }}
              >
                <div
                  className="relative flex-shrink-0"
                  style={{
                    width: isMobile ? "12vw" : "calc(100vw * (30 / 1440))",
                    height: isMobile ? "12vw" : "calc(100vw * (30 / 1440))",
                    aspectRatio: "1/1",
                    borderRadius: "10px",
                    overflow: "hidden",
                  }}
                >
                  {item.iconType === "home" ? (
                    <svg
                      style={{ width: "100%", height: "100%" }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                  ) : (
                    <Image
                      src={item.iconPath!}
                      alt={item.label}
                      fill
                      className="object-contain"
                    />
                  )}
                </div>
                <span
                  className="font-medium"
                  style={{ fontSize: isMobile ? "4.5vw" : "calc(100vw * (24 / 1440))" }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </aside>
      </>
    );
  }

  // PC: fixed sidebar
  return (
    <aside
      className="h-full flex flex-col"
      style={{ 
        width: "calc(100vw * (273 / 1440))",
        backgroundColor: "rgba(228, 244, 255, 0.9)",
      }}
    >
      {menuItems.map((item) => {
        const isActive = item.item === activeItem;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center transition-colors ${
              isActive
                ? "bg-[#2B00FF] text-white"
                : "text-[#2B00FF] hover:bg-[#D0E8FF]"
            }`}
            style={{
              padding: "2vh 2vw",
              gap: "3vw",
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            <div
              className="relative flex-shrink-0"
              style={{
                width: "calc(100vw * (30 / 1440))",
                height: "calc(100vw * (30 / 1440))",
                aspectRatio: "1/1",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              {item.iconType === "home" ? (
                <svg
                  style={{ width: "100%", height: "100%" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              ) : (
                <Image
                  src={item.iconPath!}
                  alt={item.label}
                  fill
                  className="object-contain"
                />
              )}
            </div>
            <span
              className="font-medium"
              style={{ fontSize: "calc(100vw * (24 / 1440))" }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </aside>
  );
}

