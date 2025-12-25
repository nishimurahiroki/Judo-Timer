// components/programTimer/ProgramRunScreen.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Istok_Web } from "next/font/google";
import { useProgramTimer } from "@/hooks/useProgramTimer";
import { useSoundManager } from "@/hooks/useSoundManager";
import type { ProgramStep, Program } from "@/lib/programTimer/types";
import { ProgramCreateOverlay } from "./ProgramCreateOverlay";
import { expandProgramRowsToSteps } from "@/lib/programTimer/expand";

const istokWeb = Istok_Web({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

type ProgramRunScreenProps = {
  steps: ProgramStep[];
  programTitle?: string;
  onBackToHome?: () => void;
  selectedProgram?: Program | null;
  onProgramUpdate?: (program: Program) => void;
  onStatusChange?: (status: "idle" | "running" | "paused" | "finished") => void;
  autoStart?: boolean;
};

export function ProgramRunScreen({
  steps,
  programTitle,
  onBackToHome,
  selectedProgram,
  onProgramUpdate,
  onStatusChange,
  autoStart = false,
}: ProgramRunScreenProps) {
  // iOS detection (client-side only)
  const isIOS =
    typeof navigator !== "undefined" &&
    /iP(hone|od|ad)/.test(navigator.userAgent);

  // PC detection (client-side only)
  const [isPC, setIsPC] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkPC = () => {
      setIsPC(window.innerWidth >= 1024);
    };
    checkPC();
    window.addEventListener("resize", checkPC);
    return () => window.removeEventListener("resize", checkPC);
  }, []);

  // Debug: Component mount/unmount tracking
  useEffect(() => {
    console.log("[ProgramRunScreen] mount", {
      t: performance.now(),
      timestamp: new Date().toISOString(),
    });
    
    return () => {
      console.log("[ProgramRunScreen] unmount", {
        t: performance.now(),
        timestamp: new Date().toISOString(),
      });
    };
  }, []);
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
    updateSteps,
    updateActiveTimerDuration,
  } = useProgramTimer({ steps });
  
  // status変更を親に通知
  useEffect(() => {
    console.log("[StatusChange] status changed", {
      t: performance.now(),
      status,
      currentStepIndex,
      remainingSec,
    });
    
    if (onStatusChange) {
      onStatusChange(status);
    }
  }, [status, onStatusChange, currentStepIndex, remainingSec]);
  
  // Sound manager for timer-start sound (shared with JudoTimer)
  const { play: playSound, unlockAudio, ensureUnlocked } = useSoundManager(true);
  
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);
  
  // Track if timer-start sound has been played for this program run
  const hasPlayedFirstStartSoundRef = useRef<boolean>(false);

  // End sound state
  const [endSoundPlayed, setEndSoundPlayed] = useState(false);
  const endAudioRef = useRef<HTMLAudioElement | null>(null);

  // Prep sound state (transition sound when RoundTimer reaches 00:00)
  // Track played steps using unique step key to prevent duplicates
  const prepSoundPlayedForStepRef = useRef<Set<string>>(new Set());
  // Track previous remainingSec to detect transition from >0 to 0
  const prevRemainingSecRef = useRef<number>(remainingSec);
  // Run session ID for unique step keys
  const runSessionIdRef = useRef<string>(`session-${Date.now()}-${Math.random()}`);
  
  // Initialize prevRemainingSecRef with current remainingSec
  useEffect(() => {
    prevRemainingSecRef.current = remainingSec;
  }, [remainingSec]);
  
  // Reset prep sound tracking when step changes
  useEffect(() => {
    // When step changes, reset tracking for the new step
    prepSoundPlayedForStepRef.current.clear();
    prevRemainingSecRef.current = remainingSec; // Reset to current value
  }, [currentStepIndex, remainingSec]);
  
  // Note: timer sounds are now fully managed by useSoundManager (preloaded there)

  const [isFullscreen, setIsFullscreen] = useState(false);

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

  const formatTime = (seconds: number): string => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  // iOS 専用: Start ボタンのタッチジェスチャ内でのみ開始音を鳴らす
  // タイマーの開始/停止は一切行わない
  const handleIOSStartSoundDirect = useCallback(() => {
    if (!isIOS) return;
    try {
      // iOS: ensureUnlocked は timerStart とは別のサイレント音源でアンロックする
      ensureUnlocked();
      // このタップ内で timerStart を 1 回だけ再生
      playSound("timerStart");
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[ProgramRunScreen][iOS] handleIOSStartSoundDirect error", err);
      }
    }
  }, [isIOS, ensureUnlocked, playSound]);

  // Toggle play/pause based on current status（タイマー状態の制御のみ）
  const togglePlayPause = (e?: React.MouseEvent) => {
    if (status === "idle" || status === "finished") {
      // CRITICAL: Unlock audio FIRST, synchronously within user gesture
      // This must happen before any state updates or async operations
      unlockAudio();

      // 非 iOS のみ：ここで一度だけ開始音を鳴らす
      if (!isIOS && !hasPlayedFirstStartSoundRef.current) {
        playSound("timerStart");
        hasPlayedFirstStartSoundRef.current = true;
      }
      
      // Reset end sound flag when starting a new run
      setEndSoundPlayed(false);
      // Reset run session ID
      runSessionIdRef.current = `session-${Date.now()}-${Math.random()}`;
      // Start timer immediately (no delay)
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
    // Reset prep sound tracking and run session
    prepSoundPlayedForStepRef.current.clear();
    runSessionIdRef.current = `session-${Date.now()}-${Math.random()}`;
    prevRemainingSecRef.current = remainingSec;
    // Reset start sound flag so it can play again on next start
    hasPlayedFirstStartSoundRef.current = false;
  };

  // Navigate to home
  const goHome = () => {
    if (onBackToHome) {
      onBackToHome();
    }
  };

  // オーバーレイを開く（タイマーは継続）
  const openSettings = () => {
    if (!selectedProgram) return;
    // 現在アクティブなタイマーのIDを保存
    const currentStepId = currentStep?.id ?? null;
    setActiveTimerId(currentStepId);
    setIsOverlayOpen(true);
  };
  
  // オーバーレイを閉じる
  const closeOverlay = () => {
    setIsOverlayOpen(false);
    setActiveTimerId(null);
  };
  
  // プログラム更新ハンドラー（非アクティブなタイマーの編集）
  const handleProgramUpdate = (program: Program, isActiveTimerEdit: boolean, newDuration?: number) => {
    if (!selectedProgram) return;
    
    // プログラムを更新
    if (onProgramUpdate) {
      onProgramUpdate(program);
    }
    
    // stepsを更新
    const newSteps = expandProgramRowsToSteps(program.rows);
    
    if (isActiveTimerEdit && newDuration !== undefined) {
      // アクティブなタイマーの編集：原子論的に適用
      updateActiveTimerDuration(newDuration);
      // stepsも更新（次のタイマーに影響するため）
      updateSteps(newSteps);
    } else {
      // 非アクティブなタイマーの編集：即座に適用
      updateSteps(newSteps);
    }
  };

  // Toggle fullscreen
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

  // Helper: Check if set count is configured (multi-set mode)
  const hasMultipleSets = () => {
    if (!steps.length) return false;
    // Count unique labels - if there are duplicates, sets > 1
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

  // Helper: Calculate current set index (1-based) for Role-based timers
  // Sets represents how many times the entire group is repeated
  const getCurrentSetIndexForRole = (
    stepIndex: number,
    roleGroupId: string | undefined,
    personAlternationEnabled: boolean | undefined,
  ): number => {
    if (!roleGroupId) {
      return 1; // Not a role-based timer
    }

    // Find all steps in the same role group (in order of appearance)
    const roleGroupSteps: { index: number; step: ProgramStep }[] = [];
    steps.forEach((step, idx) => {
      if (step.roleGroupId === roleGroupId) {
        roleGroupSteps.push({ index: idx, step });
      }
    });

    if (roleGroupSteps.length === 0) {
      return 1;
    }

    // Find the position of current step in the role group
    const currentStepInGroup = roleGroupSteps.findIndex(
      (item) => item.index === stepIndex,
    );

    if (currentStepInGroup < 0) {
      return 1;
    }

    // Calculate the size of one complete group loop
    // In expand.ts, the group is repeated Sets times, and each loop contains all timers in the group
    // If person alternation is enabled, each timer appears twice (omote + ura) per loop
    // Otherwise, each timer appears once per loop
    
    // Count unique timers (by label) in the first loop to determine stepsPerGroupLoop
    // We can do this by finding the first occurrence of each unique label in the first loop
    const uniqueLabelsInFirstLoop = new Set<string>();
    let firstLoopEndIndex = 0;
    
    // Find where the first loop ends by looking for the first label that repeats
    for (let i = 0; i < roleGroupSteps.length; i++) {
      const label = roleGroupSteps[i].step.label || "";
      if (uniqueLabelsInFirstLoop.has(label) && i > 0) {
        // This label appeared before, so we've completed one loop
        firstLoopEndIndex = i;
        break;
      }
      uniqueLabelsInFirstLoop.add(label);
    }
    
    // If we didn't find a repeat, the entire group is one loop
    const stepsPerGroupLoop = firstLoopEndIndex > 0 ? firstLoopEndIndex : roleGroupSteps.length;

    // Calculate which loop (set) we're in
    // Set number = floor(currentStepInGroup / stepsPerGroupLoop) + 1
    const setIndex = Math.floor(currentStepInGroup / stepsPerGroupLoop) + 1;

    // Clamp to 99 for infinite mode
    const currentStepData = steps[stepIndex];
    if (currentStepData?.setsMode === "infinite" && setIndex > 99) {
      return 99;
    }

    return setIndex;
  };

  // Helper: Calculate current set index (1-based) - legacy logic
  // When both set count > 1 and front/back mode are ON:
  // Set increments when transitioning from "ura" (back) to "omote" (front)
  const getCurrentSetIndex = (stepIndex: number, stepLabel: string): number => {
    const currentStep = steps[stepIndex];
    
    // If this step has Role settings, use Role-based logic
    if (currentStep?.roleGroupId) {
      return getCurrentSetIndexForRole(
        stepIndex,
        currentStep.roleGroupId,
        currentStep.personAlternationEnabled,
      );
    }
    
    // Legacy logic for non-Role timers
    if (!hasMultipleSets() || !hasFrontBackMode()) {
      // Fallback to old logic when conditions not met
      let setIndex = 1;
      for (let i = 0; i < stepIndex; i++) {
        if (steps[i]?.label?.trim() === stepLabel?.trim()) {
          setIndex++;
        }
      }
      return setIndex;
    }

    // New logic: Count transitions from "ura" to "omote" across ALL steps
    // Set index increments when we transition from back to front (completing a full cycle)
    let setIndex = 1;
    let prevSide: "omote" | "ura" | undefined = undefined;
    
    // Count transitions in previous steps
    for (let i = 0; i < stepIndex; i++) {
      const step = steps[i];
      if (!step) continue;
      
      const currentSide = step.side;
      
      // Increment set index when transitioning from "ura" (back) to "omote" (front)
      // This marks the start of a new set (front+back cycle)
      if (prevSide === "ura" && currentSide === "omote") {
        setIndex++;
      }
      
      prevSide = currentSide;
    }
    
    // Check if current step itself is a transition from "ura" to "omote"
    if (currentStep && prevSide === "ura" && currentStep.side === "omote") {
      setIndex++;
    }
    
    return setIndex;
  };

  // Helper: Format label with Role-based display rules
  const formatLabelWithPersonAndSet = (
    step: ProgramStep | null,
    stepIndex: number,
  ): string => {
    if (!step) {
      return `Round ${stepIndex + 1}`;
    }

    // Round番号を取得（roundNumberが設定されている場合はそれを使用、なければフォールバック）
    const roundNumber = step.roundNumber ?? (stepIndex + 1);
    const userLabel = step.label?.trim() || `Round ${roundNumber}`;
    
    // Check if this step has Role settings
    const hasRoleSettings = step.roleGroupId !== undefined;
    
    if (hasRoleSettings) {
      // Role-based display logic
      const setsMode = step.setsMode || "fixed";
      const personAlternationEnabled = step.personAlternationEnabled || false;
      
      // setNumberが設定されている場合はそれを使用（expand.tsで設定されている）
      // なければ計算（フォールバック）
      const currentSetNumber = step.setNumber !== undefined 
        ? step.setNumber 
        : getCurrentSetIndexForRole(
            stepIndex,
            step.roleGroupId,
            personAlternationEnabled,
          );
      
      // Round番号を使用（元のタイマー行のインデックス）
      const roundDisplay = `Round ${roundNumber}`;
      
      // Person1,2がONの場合: Round {roundNumber} / Person{person} - {setNumber} set
      if (personAlternationEnabled) {
        const personLabel = step.side === "omote" ? "Person1" : "Person2";
        return `${roundDisplay} / ${personLabel} - ${currentSetNumber} set`;
      }
      
      // Person1,2がOFFの場合: Round {roundNumber} / {setNumber} set
      return `${roundDisplay} / ${currentSetNumber} set`;
    }
    
    // Legacy logic for non-Role timers
    // ロールグループに属していないタイマーは、Person/Setラベルを表示しない
    // 常に "Round {roundNumber}" のみを表示
    return userLabel;
  };

  // Get step name for display (format: "Round 1", "Round 2", etc. or user-specified name)
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
    : "#0E9FFF"; // Person1 (omote) - default blue

  // Update outer container background color when side changes
  useEffect(() => {
    const outerContainer = document.getElementById('program-run-outer-container');
    const scaledContainer = document.getElementById('program-run-scaled-container');
    
    if (outerContainer) {
      outerContainer.style.backgroundColor = isUra ? "#FF7700" : "#0E9FFF";
    }
    
    if (scaledContainer) {
      scaledContainer.style.backgroundColor = isUra ? "#FF7700" : "#0E9FFF";
    }

    return () => {
      // Cleanup on unmount
      if (outerContainer) {
        outerContainer.style.backgroundColor = "";
      }
      if (scaledContainer) {
        scaledContainer.style.backgroundColor = "";
      }
    };
  }, [isUra]);

  // Auto-start timer when autoStart is true
  // Note: timer-start sound will NOT play on autoStart on iOS due to autoplay restrictions
  // (requires user gesture). For iOS, we only attempt unlock; soundは手動Start時のみ鳴らす
  useEffect(() => {
    if (autoStart && status === "idle") {
      // Attempt to unlock (will likely fail on mobile without user gesture)
      // IMPORTANT: autoStart では「手動スタート済み扱い」にしない（hasPlayedFirstStartSoundRef を触らない）
      unlockAudio();
      if (!isIOS) {
        // PC / Android では従来どおり autoStart 時にも timerStart を試みる
        playSound("timerStart");
      }

      setEndSoundPlayed(false);
      runSessionIdRef.current = `session-${Date.now()}-${Math.random()}`;
      start();
    }
  }, [autoStart, status, start, unlockAudio, playSound, isIOS]);

  // Centralized prep sound trigger (useSoundManager 管理下の timerPrep を再生)
  const triggerPrepSound = useCallback(
    (stepKey: string) => {
      // 重複防止は従来どおり stepKey セットで管理
      if (prepSoundPlayedForStepRef.current.has(stepKey)) return;
      prepSoundPlayedForStepRef.current.add(stepKey);
      playSound("timerPrep");
    },
    [playSound],
  );
  
  // Track previous step index to detect step transitions
  const prevStepIndexForSoundRef = useRef<number>(currentStepIndex);
  
  // Play prep sound when RoundTimer reaches 00:00 (detected by step transition)
  // When remainingSec reaches 0, useProgramTimer automatically advances to next step
  // So we detect the step transition as the signal that previous round ended
  useEffect(() => {
    // Don't play when finished/idle
    if (status === "finished" || status === "idle") {
      prevStepIndexForSoundRef.current = currentStepIndex;
      return;
    }
    
    if (!currentStep?.id) {
      prevStepIndexForSoundRef.current = currentStepIndex;
      return;
    }
    
    const prevStepIndex = prevStepIndexForSoundRef.current;
    const stepId = currentStep.id;
    const stepGlobalIndex = currentStepIndex;
    // Create truly unique step key: `${runSessionId}:${stepId ?? stepGlobalIndex}`
    const stepKey = `${runSessionIdRef.current}:${stepId ?? stepGlobalIndex}`;
    
    // Detect step transition: when we move from one step to the next
    // This happens when remainingSec reaches 0 and useProgramTimer advances
    const stepTransition = prevStepIndex !== currentStepIndex;
    const isForwardTransition = prevStepIndex < currentStepIndex;
    const isRunning = status === "running";
    
    // CRITICAL: Check if next step exists from PREVIOUS step index
    // When step transitions, currentStepIndex has already advanced, so nextStep might be null
    // We need to check if there was a next step from the PREVIOUS step index
    // For Round6→Round7: prevStepIndex=5, so we check if steps[6] exists (Round7)
    // For Round7→(nothing): prevStepIndex=6, so we check if steps[7] exists (doesn't exist)
    // Use steps.length from closure to avoid dependency array issues
    const totalSteps = steps.length;
    const hasNextStepFromPrev = prevStepIndex < totalSteps - 1;
    // Also check current nextStep as fallback
    const hasNextStep = nextStep !== null || hasNextStepFromPrev;
    
    // Log for debugging
    // Trigger when step transitions forward (previous round ended, new round started)
    // CRITICAL: ONLY play if there is a next step to execute (do NOT play on last round)
    // Dedupe with Set keyed by unique step key
    const shouldPlay = 
      isRunning && 
      stepTransition &&
      isForwardTransition &&  // Only play on forward transitions (automatic step advances)
      hasNextStep &&  // CRITICAL: Next Round must exist - do NOT play if this is the last round
      !prepSoundPlayedForStepRef.current.has(stepKey);
    
    if (shouldPlay) {
      triggerPrepSound(stepKey);
    }
    
    // Update previous step index AFTER checking transition
    prevStepIndexForSoundRef.current = currentStepIndex;
  }, [currentStepIndex, currentStep?.id ?? null, nextStep, status, remainingSec, triggerPrepSound, steps.length]);
  
  // Prep sound is now short one-shot; no explicit stop hook required
  
  // Play end sound when program finishes
  useEffect(() => {
    if (status === "finished" && !endSoundPlayed) {
      playSound("timerEnd");
      setEndSoundPlayed(true);
    }
  }, [status, endSoundPlayed, playSound]);

  
  return (
    <div 
      className={`w-full h-full flex flex-col text-white ${istokWeb.className} overflow-hidden`}
      style={{ backgroundColor }}
    >
      {/* Header */}
      <header className="px-1 pt-0 pb-2 flex items-start justify-between shrink-0">
        {/* Left side: Reset button + Settings + Home icons (vertical stack) + Round label */}
        <div className="flex items-start gap-3">
          {/* Vertical stack: Reset, Settings, Home */}
          <div className="flex flex-col items-start gap-5">
            {/* Reset button - circular with #00EEFF background */}
            <button
              type="button"
              onClick={resetTimer}
              className="w-10 h-10 rounded-full bg-[#00EEFF] flex items-center justify-center transition-transform duration-100 active:scale-95"
              aria-label="Reset"
            >
              <svg
                className="w-6 h-6"
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
              className="relative z-10 transition-transform duration-100 active:scale-95"
              aria-label="Settings"
            >
              <svg
                className="w-12 h-12"
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
              className="relative z-10 transition-transform duration-100 active:scale-95"
              aria-label="Home"
            >
              <svg
                className="w-12 h-12"
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
          {/* Round label - 0.5x size, next to Reset icon */}
          <span className="text-white text-center" style={{ fontSize: 'clamp(1rem, 3vw, 2rem)' }}>
            {getStepName()}
          </span>
        </div>

        {/* Right side: empty (icons moved to left) */}
        <div />
      </header>

      {/* Main timer block (center of screen) */}
      <section className="flex-1 flex flex-col items-center justify-start gap-6 -mt-20">
        {/* TimerName - 2x larger, italic, centered above MainTimer */}
        <div className="text-white italic text-center" style={{ fontSize: 'clamp(4rem, 5vw, 7rem)' }}>
          {getTimerName()}
        </div>

        {/* MainTimer - 2x larger, centered */}
        <button
          type="button"
          onClick={(e) => togglePlayPause(e)}
          className="active:scale-95 transition-transform duration-100 focus:outline-none"
        >
          <div
            className="text-white font-bold leading-none tracking-[0.01em] text-center"
            style={{
              fontSize: 'clamp(20rem, 35vw, 40rem)',
            }}
          >
            {formatTime(remainingSec)}
          </div>
        </button>
      </section>

      {/* Bottom buttons + NEXT label */}
      <footer className="px-8 pb-12 flex items-end justify-between shrink-0">
        {/* Left area - empty */}
        <div className="flex-1" />

        {/* Center: Back / Start / Skip buttons */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center justify-center gap-20">
            {/* Back (Prev) button - more neon/fluorescent */}
            <button
              type="button"
              onClick={prev}
              className="w-15 h-15 bg-[#00FFFF] rounded-md flex items-center justify-center shadow-[0_4px_0_rgba(0,0,0,0.3),0_0_15px_rgba(0,255,255,0.2)] transition-transform duration-100 active:translate-y-1 active:shadow-[0_2px_0_rgba(0,0,0,0.3),0_0_10px_rgba(0,255,255,0.15)]"
              aria-label="Previous round"
            >
              <svg
                className="w-15 h-15"
                fill="white"
                viewBox="0 0 24 24"
              >
                <path d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>

            {/* Start / Stop button - more neon/fluorescent */}
            <button
              type="button"
              onTouchStart={isIOS ? handleIOSStartSoundDirect : undefined}
              onClick={(e) => togglePlayPause(e)}
              className={`px-5 py-4 rounded-md text-white font-bold text-2xl flex items-center gap-3 shadow-[0_4px_0_rgba(0,0,0,0.3),0_0_15px_rgba(0,0,0,0.15)] transition-transform duration-100 active:translate-y-1 active:shadow-[0_2px_0_rgba(0,0,0,0.3),0_0_10px_rgba(0,0,0,0.1)] ${
                isRunning 
                  ? "bg-[#FF4444] shadow-[0_4px_0_rgba(0,0,0,0.3),0_0_20px_rgba(255,68,68,0.3)] active:shadow-[0_2px_0_rgba(0,0,0,0.3),0_0_15px_rgba(255,68,68,0.25)]" 
                  : "bg-[#00FF88] shadow-[0_4px_0_rgba(0,0,0,0.3),0_0_20px_rgba(0,255,136,0.3)] active:shadow-[0_2px_0_rgba(0,0,0,0.3),0_0_15px_rgba(0,255,136,0.25)]"
              }`}
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

            {/* Skip (Next) button - more neon/fluorescent */}
            <button
              type="button"
              onClick={next}
              className="w-15 h-15 bg-[#00FFFF] rounded-md flex items-center justify-center shadow-[0_4px_0_rgba(0,0,0,0.3),0_0_15px_rgba(0,255,255,0.2)] transition-transform duration-100 active:translate-y-1 active:shadow-[0_2px_0_rgba(0,0,0,0.3),0_0_10px_rgba(0,255,255,0.15)]"
              aria-label="Next round"
            >
              <svg
                className="w-15 h-15"
                fill="white"
                viewBox="0 0 24 24"
              >
                <path d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right area: NEXT label */}
        <div className="flex-1 flex justify-start pl-3">
          {nextStep && (
            <span className="text-black text-3xl">
              NEXT: {getNextStepName()}
            </span>
          )}
        </div>
      </footer>

      {/* Finish overlay */}
      {status === "finished" && (
        <div 
          className="absolute inset-0 flex items-center justify-center z-50 pointer-events-auto"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.8)",
          }}
        >
          {/* Buttons container - top-left */}
          {isPC ? (
            <div className="absolute top-4 left-4 z-10 flex flex-col items-center gap-3 pointer-events-auto">
              {/* Reset button - circular with #00EEFF background */}
              <button
                type="button"
                onClick={resetTimer}
                className="w-12 h-12 rounded-full bg-[#00EEFF] flex items-center justify-center transition-transform duration-100 active:scale-95 pointer-events-auto"
                style={{ touchAction: "auto" }}
                aria-label="Reset"
              >
                <svg
                  className="w-6 h-6"
                  fill="white"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
                </svg>
              </button>
              {/* Home button */}
              <button
                type="button"
                onClick={goHome}
                className="transition-transform duration-100 active:scale-95 pointer-events-auto"
                style={{ touchAction: "auto" }}
                aria-label="Home"
              >
                <svg
                  className="w-12 h-12"
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
          ) : (
            /* Home button - top-left (mobile, unchanged) */
            <button
              type="button"
              onClick={goHome}
              className="absolute top-4 left-4 z-10 transition-transform duration-100 active:scale-95 pointer-events-auto"
              style={{ touchAction: "auto" }}
              aria-label="Home"
            >
              <svg
                className="w-12 h-12"
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
          )}
          
          {/* FINISH text - centered */}
          <div
            className="text-center"
            style={{
              fontFamily: istokWeb.style.fontFamily,
              fontSize: "clamp(8rem, 15vw, 20rem)",
              fontWeight: 700,
              fontStyle: "italic",
              color: "#0015FF",
              textShadow: "0px 8px 12px rgba(0,0,0,0.35)",
            }}
          >
            FINISH
          </div>
        </div>
      )}
      
      {/* Program Create Overlay */}
      {isOverlayOpen && selectedProgram && (
        <ProgramCreateOverlay
          onClose={closeOverlay}
          onSave={(program, autoRun) => {
            // 実行モードではautoRunは無視
            if (isOverlayOpen && activeTimerId) {
              // アクティブなタイマーの編集：Doneボタンが押された
              const activeRowIndex = currentStep?.roundNumber ? currentStep.roundNumber - 1 : null;
              if (activeRowIndex !== null && program.rows[activeRowIndex]) {
                const newDuration = program.rows[activeRowIndex].durationSec;
                handleProgramUpdate(program, true, newDuration);
              } else {
                handleProgramUpdate(program, false);
              }
            } else {
              handleProgramUpdate(program, false);
            }
            closeOverlay();
          }}
          initialProgram={selectedProgram}
          activeTimerId={activeTimerId}
          currentStepIndex={currentStepIndex}
          currentStep={currentStep}
          onProgramUpdate={handleProgramUpdate}
        />
      )}
    </div>
  );
}
