// components/programTimer/ProgramRunScreenMobile.tsx
"use client";

import { useState, useEffect } from "react";
import { Istok_Web } from "next/font/google";
import { useProgramTimer } from "@/hooks/useProgramTimer";
import type { ProgramStep } from "@/lib/programTimer/types";

const istokWeb = Istok_Web({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

type ProgramRunScreenMobileProps = {
  steps: ProgramStep[];
  programTitle?: string;
  onBackToHome?: () => void;
};

export function ProgramRunScreenMobile({
  steps,
  programTitle,
  onBackToHome,
}: ProgramRunScreenMobileProps) {
  const {
    status,
    currentStepIndex,
    currentStep,
    nextStep,
    remainingSec,
    start,
    pause,
    resume,
    reset,
    next,
    prev,
  } = useProgramTimer({ steps });

  const [isLandscape, setIsLandscape] = useState(false);

  // Landscape orientation detection
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  // Toggle play/pause based on current status
  const togglePlayPause = () => {
    if (status === "idle" || status === "finished") {
      start();
    } else if (status === "running") {
      pause();
    } else if (status === "paused") {
      resume();
    }
  };

  // Reset timer to beginning of current step
  const resetTimer = () => {
    reset();
  };

  // Navigate to home
  const goHome = () => {
    if (onBackToHome) {
      onBackToHome();
    }
  };

  // Toggle settings (placeholder - timer continues running)
  const openSettings = () => {
    // Settings functionality to be implemented
  };

  // Helper: Check if set count is configured (multi-set mode)
  const hasMultipleSets = () => {
    if (!steps.length) return false;
    const labelCounts = new Map<string, number>();
    steps.forEach((step) => {
      const label = step.label?.trim() || "";
      labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
    });
    return Array.from(labelCounts.values()).some((count) => count > 1);
  };

  // Helper: Check if front/back mode is ON
  const hasFrontBackMode = () => {
    return steps.some((step) => step.side !== undefined);
  };

  // Helper: Calculate current set index (1-based)
  const getCurrentSetIndex = (stepIndex: number, stepLabel: string): number => {
    if (!hasMultipleSets() || !hasFrontBackMode()) {
      let setIndex = 1;
      for (let i = 0; i < stepIndex; i++) {
        if (steps[i]?.label?.trim() === stepLabel?.trim()) {
          setIndex++;
        }
      }
      return setIndex;
    }

    let setIndex = 1;
    let prevSide: "omote" | "ura" | undefined = undefined;
    
    for (let i = 0; i < stepIndex; i++) {
      const step = steps[i];
      if (!step) continue;
      
      const currentSide = step.side;
      
      if (prevSide === "ura" && currentSide === "omote") {
        setIndex++;
      }
      
      prevSide = currentSide;
    }
    
    const currentStep = steps[stepIndex];
    if (currentStep && prevSide === "ura" && currentStep.side === "omote") {
      setIndex++;
    }
    
    return setIndex;
  };

  // Helper: Format label with Person1/Person2 × set count
  const formatLabelWithPersonAndSet = (
    step: ProgramStep | null,
    stepIndex: number,
  ): string => {
    if (!step) {
      return `Round ${stepIndex + 1}`;
    }

    const userLabel = step.label?.trim() || `Round ${stepIndex + 1}`;
    const shouldShowPersonAndSet = hasMultipleSets() && hasFrontBackMode();

    if (!shouldShowPersonAndSet) {
      return userLabel;
    }

    const personLabel = step.side === "omote" ? "Person1" : "Person2";
    const setIndex = getCurrentSetIndex(stepIndex, step.label || "");
    return `${userLabel} / ${personLabel} - ${setIndex}`;
  };

  // Get step name for display
  const getStepName = () => {
    return formatLabelWithPersonAndSet(currentStep, currentStepIndex);
  };

  // Get next step name for display
  const getNextStepName = () => {
    if (!nextStep) return "";
    const nextIndex = currentStepIndex + 1;
    return formatLabelWithPersonAndSet(nextStep, nextIndex);
  };

  // Get timer name (program title or default)
  const getTimerName = () => {
    if (!programTitle || programTitle.trim() === "" || programTitle === "Untitled Program") {
      return "Gatame Timer";
    }
    return programTitle;
  };

  // Determine if Start/Stop button should show START (green) or STOP (red)
  const isRunning = status === "running";

  // Determine background color based on side (omote/ura)
  const isUra = currentStep?.side === "ura";
  const backgroundColor = isUra 
    ? "#FF7700" // Person2 (ura) - orange background
    : "#0E9FFF"; // Person1 (omote) - blue background

  // Landscape: Desktop-like layout (same as ProgramRunScreen)
  if (isLandscape) {
    return (
      <div 
        className={`w-screen h-dvh flex flex-col text-white ${istokWeb.className} overflow-hidden fixed inset-0`}
        style={{ 
          backgroundColor: backgroundColor,
          touchAction: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        {/* Header */}
        <header className="px-1 pt-0.5 pb-0.5 flex items-start justify-between shrink-0 mt-3">
          {/* Left side: Reset button + Settings + Home icons (vertical stack) + Round label */}
          <div className="flex items-start gap-3">
            {/* Vertical stack: Reset, Settings, Home */}
            <div className="flex flex-col items-start gap-5">
              {/* Reset button - circular with #00EEFF background */}
              <button
                type="button"
                onClick={resetTimer}
                className="w-9 h-9 rounded-full bg-[#00EEFF] flex items-center justify-center transition-transform duration-100 active:scale-95"
                style={{ touchAction: "auto" }}
                aria-label="Reset"
              >
                <svg
                  className="w-8 h-8"
                  fill="white"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
                </svg>
              </button>
              {/* Settings icon - outlined */}
              <button
                type="button"
                onClick={openSettings}
                className="relative z-20 transition-transform duration-100 active:scale-95"
                style={{ touchAction: "manipulation", pointerEvents: "auto" }}
                aria-label="Settings"
              >
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="black"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
              {/* Home icon - outlined */}
              <button
                type="button"
                onClick={goHome}
                className="relative z-20 transition-transform duration-100 active:scale-95"
                style={{ touchAction: "manipulation", pointerEvents: "auto" }}
                aria-label="Home"
              >
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="black"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </button>
            </div>
            {/* Round label */}
            <span className="text-white text-center" style={{ fontSize: 'clamp(1.3rem, 2vw, 4rem)' }}>
              {getStepName()}
            </span>
          </div>

          {/* Right side: empty (icons moved to left) */}
          <div />
        </header>

        {/* Main timer block (center of screen) */}
        <section className="flex-1 flex flex-col items-center justify-center gap-1 min-h-0 -mt-25">
          {/* TimerName - 2x larger, italic, centered above MainTimer */}
          <div className="text-white italic text-center shrink-0" style={{ fontSize: 'clamp(2.5rem, 2.4vw, 4rem)' }}>
            {getTimerName()}
          </div>

          {/* MainTimer - 2x larger, centered */}
          <button
            type="button"
            onClick={togglePlayPause}
            className="active:scale-95 transition-transform duration-100 focus:outline-none shrink-0"
            style={{ touchAction: "auto" }}
          >
            <div
              className="text-white font-bold leading-none tracking-[0.05em] text-center"
              style={{
                fontSize: 'clamp(10rem, 25vw, 25rem)',
              }}
            >
              {formatTime(remainingSec)}
            </div>
          </button>
        </section>

        {/* Bottom buttons + NEXT label */}
        <footer className="px-2 pb-4 flex items-end justify-between shrink-0">
          {/* Left area - empty */}
          <div className="flex-1" />

          {/* Center: Back / Start / Skip buttons */}
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center justify-center gap-10">
              {/* Back (Prev) button */}
              <button
                type="button"
                onClick={prev}
                className="w-12 h-12 bg-[#00FFFF] rounded-md flex items-center justify-center shadow-[0_3px_0_rgba(0,0,0,0.3),0_0_10px_rgba(0,255,255,0.2)] transition-transform duration-100 active:translate-y-1 active:shadow-[0_2px_0_rgba(0,0,0,0.3),0_0_8px_rgba(0,255,255,0.15)]"
                style={{ touchAction: "auto" }}
                aria-label="Previous round"
              >
                <svg
                  className="w-10 h-10"
                  fill="white"
                  viewBox="0 0 24 24"
                >
                  <path d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>

              {/* Start / Stop button */}
              <button
                type="button"
                onClick={togglePlayPause}
                className={`px-3 py-2.5 rounded-md text-white font-bold text-lg flex items-center gap-1.5 shadow-[0_3px_0_rgba(0,0,0,0.3),0_0_10px_rgba(0,0,0,0.15)] transition-transform duration-100 active:translate-y-1 active:shadow-[0_2px_0_rgba(0,0,0,0.3),0_0_8px_rgba(0,0,0,0.1)] ${
                  isRunning 
                    ? "bg-[#FF4444] shadow-[0_3px_0_rgba(0,0,0,0.3),0_0_15px_rgba(255,68,68,0.3)] active:shadow-[0_2px_0_rgba(0,0,0,0.3),0_0_12px_rgba(255,68,68,0.25)]" 
                    : "bg-[#00FF88] shadow-[0_3px_0_rgba(0,0,0,0.3),0_0_15px_rgba(0,255,136,0.3)] active:shadow-[0_2px_0_rgba(0,0,0,0.3),0_0_12px_rgba(0,255,136,0.25)]"
                }`}
                style={{ touchAction: "auto" }}
              >
                {isRunning ? (
                  <>
                    <svg
                      className="w-8 h-8"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                    STOP
                  </>
                ) : (
                  <>
                    <svg
                      className="w-8 h-8"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    START
                  </>
                )}
              </button>

              {/* Skip (Next) button */}
              <button
                type="button"
                onClick={next}
                className="w-12 h-12 bg-[#00FFFF] rounded-md flex items-center justify-center shadow-[0_3px_0_rgba(0,0,0,0.3),0_0_10px_rgba(0,255,255,0.2)] transition-transform duration-100 active:translate-y-1 active:shadow-[0_2px_0_rgba(0,0,0,0.3),0_0_8px_rgba(0,255,255,0.15)]"
                style={{ touchAction: "auto" }}
                aria-label="Next round"
              >
                <svg
                  className="w-10 h-10"
                  fill="white"
                  viewBox="0 0 24 24"
                >
                  <path d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right area: NEXT label */}
          <div className="flex-1 flex justify-start">
            {nextStep && (
              <span className="text-black text-md pl-3">
                NEXT: {getNextStepName()}
              </span>
            )}
          </div>
        </footer>

        {/* Finished overlay */}
        {status === "finished" && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-50">
            <div className="text-2xl font-semibold text-green-600">Finished</div>
          </div>
        )}
      </div>
    );
  }

  // Portrait: Simplified vertical layout (matching the provided image)
  return (
    <div 
      className={`w-screen h-dvh flex flex-col text-white ${istokWeb.className} overflow-hidden fixed inset-0`}
      style={{ 
        backgroundColor: backgroundColor,
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {/* Top bar */}
      <header className="px-2 pt-2 pb-1 flex items-start justify-between shrink-0 mt-3">
        {/* Left side: Reset button + Settings + Home icons (vertical stack) + Round label */}
        <div className="flex items-start gap-3">
          {/* Vertical stack: Reset, Settings, Home */}
          <div className="flex flex-col items-start gap-5">
            {/* Reset button - circular with #00EEFF background */}
            <button
              type="button"
              onClick={resetTimer}
              className="w-10 h-10 rounded-full bg-[#00EEFF] flex items-center justify-center transition-transform duration-100 active:scale-95"
              style={{ touchAction: "auto" }}
              aria-label="Reset"
            >
              <svg
                className="w-8 h-8"
                fill="white"
                viewBox="0 0 24 24"
              >
                <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
              </svg>
            </button>
            {/* Settings icon - outlined */}
            <button
              type="button"
              onClick={openSettings}
              className="transition-transform duration-100 active:scale-95 relative z-20"
              style={{ touchAction: "manipulation", pointerEvents: "auto" }}
              aria-label="Settings"
            >
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="black"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
            {/* Home icon - outlined */}
            <button
              type="button"
              onClick={goHome}
              className="transition-transform duration-100 active:scale-95 relative z-20"
              style={{ touchAction: "manipulation", pointerEvents: "auto" }}
              aria-label="Home"
            >
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="black"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </button>
          </div>
          {/* Round label - white */}
          <span className="text-white text-center" style={{ fontSize: 'clamp(1.5rem, 3vw, 4rem)' }}>
            {getStepName()}
          </span>
        </div>

        {/* Right side: empty (icons moved to left) */}
        <div />
      </header>

      {/* Center area - Timer name and Main timer */}
      <section className="flex-1 flex flex-col items-center justify-center min-h-0 -mt-20">
        {/* Timer name - white, italic, not bold */}
        <div className="text-white italic text-center mb-3 shrink-0" style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}>
          {getTimerName()}
        </div>

        {/* MainTimer - large, bold, white, centered */}
        <button
          type="button"
          onClick={togglePlayPause}
          className="active:scale-95 transition-transform duration-100 focus:outline-none shrink-0"
          style={{ touchAction: "auto" }}
        >
          <div
            className="text-white font-bold leading-none tracking-tight text-center"
            style={{
              fontSize: 'clamp(9rem, 25vw, 30rem)',
            }}
          >
            {formatTime(remainingSec)}
          </div>
        </button>
      </section>

      {/* Bottom area - Buttons and NEXT label */}
      <footer className="px-4 pb-3 flex flex-col items-center gap-1 shrink-0 mb-15">
        {/* Three buttons in a row */}
        <div className="flex items-center justify-center gap-6">
          {/* Back button - neon cyan */}
          <button
            type="button"
            onClick={prev}
            className="w-14 h-14 bg-[#00FFFF] rounded-md flex items-center justify-center shadow-[0_3px_0_rgba(0,0,0,0.3),0_0_10px_rgba(0,255,255,0.2)] transition-transform duration-100 active:translate-y-1 active:shadow-[0_2px_0_rgba(0,0,0,0.3),0_0_8px_rgba(0,255,255,0.15)]"
            style={{ touchAction: "auto" }}
            aria-label="Previous step"
          >
            <svg
              className="w-12 h-12"
              fill="white"
              viewBox="0 0 24 24"
            >
              <path d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>

          {/* Start/Stop button - neon green/red */}
          <button
            type="button"
            onClick={togglePlayPause}
            className={`px-8 py-2 rounded-md text-white font-bold text-lg flex items-center gap-1 shadow-[0_3px_0_rgba(0,0,0,0.3),0_0_10px_rgba(0,0,0,0.15)] transition-transform duration-100 active:translate-y-1 active:shadow-[0_2px_0_rgba(0,0,0,0.3),0_0_8px_rgba(0,0,0,0.1)] ${
              isRunning 
                ? "bg-[#FF4444] shadow-[0_3px_0_rgba(0,0,0,0.3),0_0_15px_rgba(255,68,68,0.3)] active:shadow-[0_2px_0_rgba(0,0,0,0.3),0_0_12px_rgba(255,68,68,0.25)]" 
                : "bg-[#00FF88] shadow-[0_3px_0_rgba(0,0,0,0.3),0_0_15px_rgba(0,255,136,0.3)] active:shadow-[0_2px_0_rgba(0,0,0,0.3),0_0_12px_rgba(0,255,136,0.25)]"
            }`}
            style={{ touchAction: "auto" }}
          >
            {isRunning ? (
              <>
                <svg
                  className="w-11 h-11"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
                STOP
              </>
            ) : (
              <>
                <svg
                  className="w-11 h-11"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                START
              </>
            )}
          </button>

          {/* Skip button - neon cyan */}
          <button
            type="button"
            onClick={next}
            className="w-14 h-14 bg-[#00FFFF] rounded-md flex items-center justify-center shadow-[0_3px_0_rgba(0,0,0,0.3),0_0_10px_rgba(0,255,255,0.2)] transition-transform duration-100 active:translate-y-1 active:shadow-[0_2px_0_rgba(0,0,0,0.3),0_0_8px_rgba(0,255,255,0.15)]"
            style={{ touchAction: "auto" }}
            aria-label="Next step"
          >
            <svg
              className="w-11 h-11"
              fill="white"
              viewBox="0 0 24 24"
            >
              <path d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* NEXT label - bottom right */}
        {nextStep && (
          <div className="self-end">
            <span className="text-black text-md font-semibold">
              NEXT: {getNextStepName()}
            </span>
          </div>
        )}
      </footer>

      {/* Finished overlay */}
      {status === "finished" && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-50">
          <div className="text-2xl font-semibold text-green-600">Finished</div>
        </div>
      )}
    </div>
  );
}
