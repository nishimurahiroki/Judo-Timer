"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { asset } from "@/lib/asset";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { getLastStartedProgramId } from "@/lib/recentProgramTimer";
import type { Program } from "@/lib/programTimer/types";

type TimerType = "judo" | "kosen" | "program";

const LAST_USED_TIMER_KEY = "lastUsedTimer";

export default function HomePage() {
  const router = useRouter();
  const [lastUsedTimer, setLastUsedTimer] = useState<TimerType | null>(null);
  const [lastStartedProgramId, setLastStartedProgramId] = useState<string | null>(null);
  const [savedPrograms, setSavedPrograms] = useState<Program[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load last used timer from localStorage
    const stored = window.localStorage.getItem(LAST_USED_TIMER_KEY);
    if (stored && ["judo", "kosen", "program"].includes(stored)) {
      setLastUsedTimer(stored as TimerType);
    }

    // Load last started Program timer
    const programId = getLastStartedProgramId();
    if (programId) {
      setLastStartedProgramId(programId);
    }

    // Load saved programs to find the last started one
    try {
      const raw = window.localStorage.getItem("saved-programs");
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSavedPrograms(parsed as Program[]);
        }
      }
    } catch (e) {
      console.error("Failed to load saved programs", e);
    }

    // Track mobile layout breakpoint
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const handleTimerClick = (type: TimerType) => {
    // Store last used timer
    if (typeof window !== "undefined") {
      localStorage.setItem(LAST_USED_TIMER_KEY, type);
      setLastUsedTimer(type);
    }
  };

  const handleRecentlyUsedClick = () => {
    if (!lastStartedProgramId) return;

    // Check if it's a template ID or a saved program ID
    if (lastStartedProgramId.startsWith("template:")) {
      // Template ID - navigate to program page with template ID
      router.push(`/program?run=${lastStartedProgramId}`);
      return;
    }

    // Saved program ID - find the program
    const program = savedPrograms.find((p) => p.id === lastStartedProgramId);
    if (program) {
      // Navigate to program page with the program ID in the URL
      router.push(`/program?run=${program.id}`);
    } else {
      // Program not found, just navigate to program page
      router.push("/program");
    }
  };

  // ---------- PC LAYOUT CONSTANTS ----------
  const headerHeightPc = "calc(100vh * (100 / 1024))";
  const mainContentHeightPc = "calc(100vh - calc(100vh * (100 / 1024)))";
  const logoHeightPc = "calc(100vh * (79 / 1024))";
  const logoWidthPc = "calc(100vh * (140 / 1024))";
  const cardSizePc = "calc(100vw * (300 / 1440))";
  const cardMaxSizePc = "300px";
  const startButtonWidthPc = "clamp(100px, calc(100vw * (120 / 1440)), 150px)";
  const startButtonHeightPc = "clamp(44px, calc(100vw * (55 / 1440)), 70px)";

  // ---------- MOBILE LAYOUT CONSTANTS ----------
  // Header: 179 / 1920 of viewport height
  const headerHeightMobile = "calc(100vh * (179 / 1920))";
  // Hamburger: 102/1080 vw, 108/1920 vh
  const hamburgerWidthMobile = "calc(100vw * (102 / 1080))";
  const hamburgerHeightMobile = "calc(100vh * (108 / 1920))";
  // Logo: 178/1080 vw, 100/1920 vh
  const logoWidthMobile = "calc(100vw * (178 / 1080))";
  const logoHeightMobile = "calc(100vh * (100 / 1920))";
  // Card: 1020/1080 vw, 266/1920 vh
  const mobileCardWidth = "calc(100vw * (1020 / 1080))";
  const mobileCardHeight = "calc(100vh * (266 / 1920))";

  // -------- MOBILE LAYOUT --------
  if (isMobile) {
    return (
      <div
        className="w-screen h-screen overflow-hidden flex flex-col bg-white relative"
        style={{ width: "100vw", height: "100vh" }}
      >
        {/* Sidebar Drawer (mobile mode) */}
        <AppSidebar
          activeItem="home"
          isMobile={true}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Header */}
        <header
          className="w-full bg-[#2B00FF] flex items-center shrink-0"
          style={{
            height: headerHeightMobile,
            paddingLeft: "calc(100vw * (40 / 1080))",
            paddingRight: "calc(100vw * (40 / 1080))",
            gap: "calc(100vw * (32 / 1080))",
          }}
        >
          {/* Hamburger menu icon */}
          <button
            className="flex-shrink-0 text-white"
            aria-label="Menu"
            onClick={() => setIsSidebarOpen(true)}
            style={{
              width: hamburgerWidthMobile,
              height: hamburgerHeightMobile,
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
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Logo */}
          <div
            className="relative flex-shrink-0"
            style={{
              width: logoWidthMobile,
              height: logoHeightMobile,
            }}
          >
          <Image
            src={asset("/image/GatameKosenJudo_logo.png")}
            alt="Gatame Kosen Judo Logo"
            fill
            style={{ objectFit: "contain" }}
            priority
          />
          </div>

          {/* Text: "Gatame Timer" */}
          <h1
            className="text-white font-bold"
            style={{
              fontSize: "clamp(14px, calc(100vw * (42 / 1080)), 28px)",
            }}
          >
            Gatame Timer
          </h1>
        </header>

        {/* Main Content */}
        <main
          className="flex-1 overflow-hidden flex flex-col"
          style={{
            paddingTop: "calc(100vh * (40 / 1920))",
            paddingBottom: "calc(100vh * (40 / 1920))",
            gap: "calc(100vh * (40 / 1920))",
          }}
        >
          {/* Tagline */}
          <div
            style={{
              paddingLeft: "calc(100vw * (60 / 1080))",
              paddingRight: "calc(100vw * (60 / 1080))",
            }}
          >
            <h2
              className="font-bold text-black"
              style={{
                fontSize: "clamp(18px, calc(100vw * (52 / 1080)), 28px)",
                lineHeight: "1.3",
              }}
            >
              Clear for competition. Flexible for training.
            </h2>
          </div>

          {/* Stacked Timer Cards */}
          <div
            className="flex flex-col"
            style={{
              gap: "calc(100vh * (32 / 1920))",
              paddingLeft: "calc(100vw * (30 / 1080))",
              paddingRight: "calc(100vw * (30 / 1080))",
            }}
          >
            {/* Judo / Kosen / Program cards */}
            {[
                  {
                    title: "Judo Timer",
                    href: "/judo",
                    image: asset("/image/judo_timer_icon_mobile.png"),
                    timerType: "judo" as TimerType,
                  },
                  {
                    title: "Kosen Judo Timer",
                    href: "/kosen",
                    image: asset("/image/kosen_timer_icon_mobile.png"),
                    timerType: "kosen" as TimerType,
                  },
                  {
                    title: "Program Timer",
                    href: "/program",
                    image: asset("/image/program_timer_icon_mobile.png"),
                    timerType: "program" as TimerType,
                  },
            ].map((card) => (
              <button
                key={card.title}
                onClick={() => {
                  handleTimerClick(card.timerType);
                  router.push(card.href);
                }}
                style={{
                  width: mobileCardWidth,
                  height: mobileCardHeight,
                  margin: "0 auto",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >
                <Image
                  src={card.image}
                  alt={card.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                  width={1080}
                  height={266}
                />
              </button>
            ))}

            {/* Recently Used Timer Card */}
            <button
              onClick={handleRecentlyUsedClick}
              disabled={!lastStartedProgramId}
              style={{
                width: mobileCardWidth,
                height: mobileCardHeight,
                margin: "0 auto",
                borderRadius: "10px",
                overflow: "hidden",
                opacity: lastStartedProgramId ? 1 : 0.5,
                cursor: lastStartedProgramId ? "pointer" : "not-allowed",
                pointerEvents: lastStartedProgramId ? "auto" : "none",
              }}
            >
              <Image
                src={asset("/image/recently_used_timer_mobile.png")}
                alt="Recently Used Timer"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
                width={1080}
                height={266}
              />
            </button>
          </div>
        </main>
      </div>
    );
  }

  // -------- PC LAYOUT --------
  const headerHeight = headerHeightPc;
  const mainContentHeight = mainContentHeightPc;
  const logoHeight = logoHeightPc;
  const logoWidth = logoWidthPc;
  const cardSize = cardSizePc;
  const cardMaxSize = cardMaxSizePc;
  const startButtonWidth = startButtonWidthPc;
  const startButtonHeight = startButtonHeightPc;

  return (
    <div
      className="w-screen h-screen overflow-hidden flex flex-col bg-white relative"
      style={{ width: "100vw", height: "100vh" }}
    >
      {/* Sidebar Drawer */}
      <AppSidebar
        activeItem="home"
        isMobile={false}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        drawerMode={true}
      />

      {/* Header */}
      <header
        className="w-full bg-[#2B00FF] flex items-center shrink-0"
        style={{
          height: headerHeight,
          paddingLeft: "calc(100vw * (40 / 1440))",
          gap: "calc(100vw * (20 / 1440))",
        }}
      >
        {/* Hamburger menu icon */}
        <button
          className="flex-shrink-0 text-white"
          aria-label="Menu"
          onClick={() => setIsSidebarOpen(true)}
          style={{
            width: "calc(100vw * (30 / 1440))",
            height: "calc(100vw * (30 / 1440))",
            minWidth: "20px",
            minHeight: "20px",
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
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Logo */}
        <div
          className="relative flex-shrink-0"
          style={{
            width: logoWidth,
            height: logoHeight,
          }}
        >
          <Image
            src={asset("/image/GatameKosenJudo_logo.png")}
            alt="Gatame Kosen Judo Logo"
            fill
            style={{ objectFit: "contain" }}
            priority
          />
        </div>

        {/* Text: "Gatame Timer" */}
        <h1
          className="text-white font-bold"
          style={{
            fontSize: "clamp(16px, calc(100vw * (32 / 1440)), 32px)",
          }}
        >
          Gatame Timer
        </h1>
      </header>

      {/* Main Content */}
      <main
        className="flex-1 overflow-hidden flex flex-col relative"
        style={{ height: mainContentHeight }}
      >
        {/* Title & Description Section */}
        <div
          className="flex-shrink-0"
          style={{
            paddingTop: "calc(100vh * (60 / 1024))",
            paddingLeft: "calc(100vw * (80 / 1440))",
            paddingRight: "calc(100vw * (80 / 1440))",
            paddingBottom: "calc(100vh * (40 / 1024))",
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Title */}
              <h2
                className="font-bold text-black mb-4"
                style={{
                  fontSize: "clamp(20px, calc(100vw * (48 / 1440)), 48px)",
                  lineHeight: "1.2",
                }}
              >
                Clear for competition. Flexible for training.
              </h2>

              {/* Body text */}
              <p
                className="text-black"
                style={{
                  fontSize: "clamp(14px, calc(100vw * (20 / 1440)), 20px)",
                  lineHeight: "1.6",
                  maxWidth: "calc(100vw * (800 / 1440))",
                }}
              >
                Designed for Judo and Kosen Judo.
                <br />
                High-visibility timers for matches, and fully customizable
                timers for training.
                <br />
                Built to adapt to sport, practice, and everyday use.
              </p>
            </div>

            {/* Primary Action Button: "+ Create Timer" */}
            <button
              className="flex-shrink-0 text-white font-medium transition-opacity hover:opacity-90"
              style={{
                backgroundColor: "#0044FF",
                padding: "calc(100vw * (16 / 1440)) calc(100vw * (32 / 1440))",
                fontSize: "clamp(22px, calc(100vw * (24 / 1440)), 24px)",
                marginLeft: "calc(100vw * (40 / 1440))",
                borderRadius: "20px",
              }}
              onClick={() => {
                // Navigate to program timer create (respects basePath via Next.js router)
                router.push("/program");
              }}
            >
              + Create Timer
            </button>
          </div>
        </div>

        {/* Center Timer Icon Grid */}
        <div
          className="flex-1 flex items-start justify-center"
          style={{
            paddingLeft: "calc(100vw * (80 / 1440))",
            paddingRight: "calc(100vw * (80 / 1440))",
            paddingBottom: "calc(100vh * (60 / 1024))",
            gap: "calc(100vw * (40 / 1440))",
            paddingTop: "calc(100vh * (40 / 1024))",
          }}
        >
          {/* Judo Timer Card */}
          <Link
            href="/judo"
            onClick={() => handleTimerClick("judo")}
            className="flex flex-col items-center group"
            style={{ flexShrink: 0 }}
          >
            <div
              className="relative"
              style={{
                width: cardSize,
                height: cardSize,
                maxWidth: cardMaxSize,
                maxHeight: cardMaxSize,
                aspectRatio: "1 / 1",
                borderRadius: "20px",
                overflow: "hidden",
              }}
            >
              <Image
                src={asset("/image/judo_timer_icon.png")}
                alt="Judo Timer"
                fill
                style={{ objectFit: "contain" }}
              />
              {/* Start button overlay */}
              <button
                className="absolute bottom-0 right-0 text-white font-bold transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: "rgba(0, 228, 103, 0.7)",
                  width: startButtonWidth,
                  height: startButtonHeight,
                  fontSize: "clamp(12px, calc(100vw * (18 / 1440)), 18px)",
                  borderRadius: "20px",
                }}
                onClick={(e) => {
                  e.preventDefault();
                  handleTimerClick("judo");
                  router.push("/judo");
                }}
              >
                Start
              </button>
            </div>
            <span
              className="text-black font-bold mt-2"
              style={{
                fontSize: "clamp(16px, calc(100vw * (24 / 1440)), 24px)",
              }}
            >
              Judo Timer
            </span>
          </Link>

          {/* Kosen Timer Card */}
          <Link
            href="/kosen"
            onClick={() => handleTimerClick("kosen")}
            className="flex flex-col items-center group"
            style={{ flexShrink: 0 }}
          >
            <div
              className="relative"
              style={{
                width: cardSize,
                height: cardSize,
                maxWidth: cardMaxSize,
                maxHeight: cardMaxSize,
                aspectRatio: "1 / 1",
                borderRadius: "20px",
                overflow: "hidden",
              }}
            >
              <Image
                src={asset("/image/kosen_timer_icon.png")}
                alt="Kosen Timer"
                fill
                style={{ objectFit: "contain" }}
              />
              {/* Start button overlay */}
              <button
                className="absolute bottom-0 right-0 text-white font-bold transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: "rgba(0, 228, 103, 0.7)",
                  width: startButtonWidth,
                  height: startButtonHeight,
                  fontSize: "clamp(12px, calc(100vw * (18 / 1440)), 18px)",
                  borderRadius: "20px",
                }}
                onClick={(e) => {
                  e.preventDefault();
                  handleTimerClick("kosen");
                  router.push("/kosen");
                }}
              >
                Start
              </button>
            </div>
            <span
              className="text-black font-bold mt-2"
              style={{
                fontSize: "clamp(16px, calc(100vw * (24 / 1440)), 24px)",
              }}
            >
              Kosen Judo Timer
            </span>
          </Link>

          {/* Program Timer Card */}
          <Link
            href="/program"
            onClick={() => handleTimerClick("program")}
            className="flex flex-col items-center group"
            style={{ flexShrink: 0 }}
          >
            <div
              className="relative"
              style={{
                width: cardSize,
                height: cardSize,
                maxWidth: cardMaxSize,
                maxHeight: cardMaxSize,
                aspectRatio: "1 / 1",
                borderRadius: "20px",
                overflow: "hidden",
              }}
            >
              <Image
                src={asset("/image/program_timer_icon.png")}
                alt="Program Timer"
                fill
                style={{ objectFit: "contain" }}
              />
              {/* Start button overlay */}
              <button
                className="absolute bottom-0 right-0 text-white font-bold transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: "rgba(0, 228, 103, 0.7)",
                  width: startButtonWidth,
                  height: startButtonHeight,
                  fontSize: "clamp(12px, calc(100vw * (18 / 1440)), 18px)",
                  borderRadius: "20px",
                }}
                onClick={(e) => {
                  e.preventDefault();
                  handleTimerClick("program");
                  router.push("/program");
                }}
              >
                Start
              </button>
            </div>
            <span
              className="text-black font-bold mt-2"
              style={{
                fontSize: "clamp(16px, calc(100vw * (24 / 1440)), 24px)",
              }}
            >
              Program Timer
            </span>
          </Link>

          {/* Recently Used Timer Card */}
          <div
            className="flex flex-col items-center group"
            style={{ flexShrink: 0 }}
          >
            <div
              className="relative"
              style={{
                width: cardSize,
                height: cardSize,
                maxWidth: cardMaxSize,
                maxHeight: cardMaxSize,
                aspectRatio: "1 / 1",
                opacity: lastStartedProgramId ? 1 : 0.5,
                cursor: lastStartedProgramId ? "pointer" : "not-allowed",
                borderRadius: "20px",
                overflow: "hidden",
              }}
              onClick={handleRecentlyUsedClick}
            >
              <Image
                src={asset("/image/recently_used_timer.png")}
                alt="Recently Used Timer"
                fill
                style={{ objectFit: "contain" }}
              />
              {/* Start button overlay */}
              {lastStartedProgramId && (
                <button
                  className="absolute bottom-0 right-0 text-white font-bold transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: "rgba(0, 228, 103, 0.7)",
                    width: startButtonWidth,
                    height: startButtonHeight,
                    fontSize: "clamp(12px, calc(100vw * (18 / 1440)), 18px)",
                    borderRadius: "20px",
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    handleRecentlyUsedClick();
                  }}
                >
                  Start
                </button>
              )}
            </div>
            {/* Empty label space to maintain alignment with other cards - same structure as other cards */}
            <span
              className="text-black font-bold mt-2"
              style={{
                fontSize: "clamp(16px, calc(100vw * (24 / 1440)), 24px)",
                lineHeight: "1.2",
                display: "block",
                minHeight: "clamp(16px, calc(100vw * (24 / 1440)), 24px)",
              }}
              aria-hidden="true"
            >
              {"\u00A0"}
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
