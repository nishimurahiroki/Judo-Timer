// app/program/page.tsx
"use client";

import { useEffect, useState } from "react";
import type { Program } from "@/lib/programTimer/types";
import { expandProgramRowsToSteps } from "@/lib/programTimer/expand";
import { ProgramTimerHome } from "@/components/programTimer/ProgramTimerHome";
import { ProgramRunScreen } from "@/components/programTimer/ProgramRunScreen";
import { ProgramRunScreenMobile } from "@/components/programTimer/ProgramRunScreenMobile";
import { ProgramCreateOverlay } from "@/components/programTimer/ProgramCreateOverlay";
import { JudoTimerScaledContainer } from "@/components/layout/JudoTimerScaledContainer";

// フルスクリーン切り替え関数
const toggleFullscreen = async () => {
  try {
    if (
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    ) {
      // Exit fullscreen
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    } else {
      // Enter fullscreen
      const element = document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      }
    }
  } catch (error) {
    console.error("Fullscreen error:", error);
  }
};

type Mode = "home" | "run";

export default function ProgramPage() {
  const [mode, setMode] = useState<Mode>("home");
  const [isCreating, setIsCreating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [savedPrograms, setSavedPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [stepsToRun, setStepsToRun] = useState<
    ReturnType<typeof expandProgramRowsToSteps>
  >([]);

  // テンプレート（現時点では空）
  const templatePrograms: Program[] = [];

  // LocalStorage から保存済みProgramを読み込み
  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? window.localStorage.getItem("saved-programs")
          : null;
      if (!raw) return;

      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // ゆるく Program[] として扱う（厳密にやりたければ型ガードを追加）
        setSavedPrograms(parsed as Program[]);
      }
    } catch (e) {
      console.error("Failed to load saved programs", e);
    }
  }, []);

  const handleCreateNew = () => {
    setEditingProgram(null);
    setIsCreating(true);
  };

  const handleCloseCreate = () => {
    setIsCreating(false);
    setEditingProgram(null);
  };

  const handleSaveProgram = (program: Program, autoRun: boolean) => {
    setSavedPrograms((prev) => {
      const exists = prev.some((p) => p.id === program.id);

      const updated = exists
        ? prev.map((p) => (p.id === program.id ? program : p))
        : [...prev, program];

      // LocalStorage に保存
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "saved-programs",
          JSON.stringify(updated),
        );
      }

      return updated;
    });

    setIsCreating(false);
    setEditingProgram(null);

    if (autoRun) {
      // 展開してから実行
      const steps = expandProgramRowsToSteps(program.rows);
      setStepsToRun(steps);
      setSelectedProgram(program);
      setMode("run");
    }
  };

  const handleRunProgram = (program: Program) => {
    // 展開してから実行
    const steps = expandProgramRowsToSteps(program.rows);
    setStepsToRun(steps);
    setSelectedProgram(program);
    setMode("run");
  };

  const handleBackToHome = () => {
    setMode("home");
    setSelectedProgram(null);
    setStepsToRun([]);
  };

  const handleEditProgram = (program: Program) => {
    setEditingProgram(program);
    setIsCreating(true);
  };

  const handleDeleteProgram = (programId: string) => {
    setSavedPrograms((prev) => {
      const updated = prev.filter((p) => p.id !== programId);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "saved-programs",
          JSON.stringify(updated),
        );
      }

      return updated;
    });

    // もし実行中のプログラムを消したら Home に戻す
    if (selectedProgram && selectedProgram.id === programId) {
      setSelectedProgram(null);
      setStepsToRun([]);
      setMode("home");
    }
  };

  // Fullscreen state tracking
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        !!(
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement ||
          (document as any).msFullscreenElement
        ),
      );
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  // Hide AppNavBar when in run mode (mobile only)
  useEffect(() => {
    if (mode === "run" && selectedProgram && stepsToRun.length > 0) {
      const checkMobile = () => {
        const isMobile = window.innerWidth < 1024; // lg breakpoint
        if (isMobile) {
          document.body.setAttribute("data-program-run-mode", "true");
        } else {
          document.body.removeAttribute("data-program-run-mode");
        }
      };

      checkMobile();
      window.addEventListener("resize", checkMobile);

      return () => {
        document.body.removeAttribute("data-program-run-mode");
        window.removeEventListener("resize", checkMobile);
      };
    } else {
      document.body.removeAttribute("data-program-run-mode");
    }
  }, [mode, selectedProgram, stepsToRun.length]);

  // Run mode: hybrid layout (desktop = 16:9, mobile = responsive)
  if (mode === "run" && selectedProgram && stepsToRun.length > 0) {
    return (
      <>
        {/* Desktop / large: keep existing 16:9 implementation */}
        <div id="program-run-outer-container" className="hidden lg:block w-full h-full bg-[#0E9FFF] relative">
          {/* フルスクリーンボタン - Round表示と同じ高さに配置 */}
          <button
            onClick={toggleFullscreen}
            className="absolute top-0 right-4 z-[100] rounded-md px-3 py-2 transition-colors shadow-lg bg-white/90 text-blue-500 hover:bg-white border-2 border-blue-400"
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? (
              <svg
                className="w-6 h-6"
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
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            )}
          </button>
          <JudoTimerScaledContainer id="program-run-scaled-container" className="bg-[#0E9FFF]">
            <ProgramRunScreen
              steps={stepsToRun}
              programTitle={selectedProgram.title}
              onBackToHome={handleBackToHome}
            />
          </JudoTimerScaledContainer>
        </div>

        {/* Mobile: new responsive, no 16:9 */}
        <div 
          className="block lg:hidden w-screen h-dvh relative overflow-hidden fixed inset-0" 
          style={{ 
            backgroundColor: '#0E9FFF',
            touchAction: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        >
          {/* フルスクリーンボタン - Round表示と同じ高さに配置 */}
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 z-[100] rounded-md px-3 py-2 transition-colors shadow-lg bg-white/90 text-blue-500 hover:bg-white border-2 border-blue-400"
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? (
              <svg
                className="w-6 h-6"
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
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            )}
          </button>
          <ProgramRunScreenMobile
            steps={stepsToRun}
            programTitle={selectedProgram.title}
            onBackToHome={handleBackToHome}
          />
        </div>
      </>
    );
  }

  // Home mode: normal page layout
  return (
    <div className="min-h-screen w-full bg-white">
          <ProgramTimerHome
            templates={templatePrograms}
            saved={savedPrograms}
            onCreateNew={handleCreateNew}
            onRunProgram={handleRunProgram}
        onEditProgram={handleEditProgram}
        onDeleteProgram={handleDeleteProgram}
          />
          {isCreating && (
            <ProgramCreateOverlay
              onClose={handleCloseCreate}
              onSave={handleSaveProgram}
          initialProgram={editingProgram}
        />
      )}
    </div>
  );
}
