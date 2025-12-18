// components/programTimer/ProgramRunScreenMobile.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Istok_Web } from "next/font/google";
import { useProgramTimer } from "@/hooks/useProgramTimer";
import type { ProgramStep, Program } from "@/lib/programTimer/types";
import { ProgramCreateOverlay } from "./ProgramCreateOverlay";
import { expandProgramRowsToSteps } from "@/lib/programTimer/expand";
import { formatTimerTitle } from "@/lib/programTimer/formatTitle";
import { asset } from "@/lib/asset";

const istokWeb = Istok_Web({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

type ProgramRunScreenMobileProps = {
  steps: ProgramStep[];
  programTitle?: string;
  onBackToHome?: () => void;
  selectedProgram?: Program | null;
  onProgramUpdate?: (program: Program) => void;
  autoStart?: boolean;
};

export function ProgramRunScreenMobile({
  steps,
  programTitle,
  onBackToHome,
  selectedProgram,
  onProgramUpdate,
  autoStart = false,
}: ProgramRunScreenMobileProps) {
  const router = useRouter();
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
  
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);

  // Ready overlay state
  const [readyActive, setReadyActive] = useState(false);
  const [readySecondsLeft, setReadySecondsLeft] = useState(3);
  const [readyOverlayShown, setReadyOverlayShown] = useState(false);
  const readyIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const readyAudioRef = useRef<HTMLAudioElement | null>(null);

  // End sound state
  const [endSoundPlayed, setEndSoundPlayed] = useState(false);
  const endAudioRef = useRef<HTMLAudioElement | null>(null);

  // Prep sound state (transition sound when RoundTimer reaches 00:00)
  // Use a single reusable audio instance (per spec)
  const prepAudioRef = useRef<HTMLAudioElement | null>(null);
  // Track played steps using unique step key to prevent duplicates
  const prepSoundPlayedForStepRef = useRef<Set<string>>(new Set());
  // Track previous remainingSec to detect transition from >0 to 0
  const prevRemainingSecRef = useRef<number>(remainingSec);
  // Run session ID for unique step keys
  const runSessionIdRef = useRef<string>(`session-${Date.now()}-${Math.random()}`);
  // Force-stop flag so that STOP/Pause immediately cancels any in-flight prep sound
  const prepForceStopRef = useRef<boolean>(false);
  
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
  
  // Preload audio files on mount to prevent delay on first play
  useEffect(() => {
    // Preload ready_count.mp3
    const readyAudio = new Audio(asset("/sounds/ready_count.mp3"));
    readyAudio.preload = "auto";
    readyAudio.load(); // Force load
    readyAudioRef.current = readyAudio;
    
    // Preload timer-end.mp3
    const endAudio = new Audio(asset("/sounds/timer-end.mp3"));
    endAudio.preload = "auto";
    endAudio.load(); // Force load
    endAudioRef.current = endAudio;
    
    // Preload timer-prep.mp3 - use single reusable instance (per spec)
    // Force: preload="auto", volume=1.0, muted=false
    const prepAudio = new Audio(asset("/sounds/timer-prep.mp3"));
    prepAudio.preload = "auto";
    prepAudio.volume = 1.0;
    prepAudio.muted = false;
    prepAudio.load(); // Force load
    prepAudioRef.current = prepAudio;
  }, []);

  // Stop ALL sounds (ready, prep, end) – used on explicit user actions (STOP/RESET/RESTART)
  const stopAllSounds = useCallback(() => {
    if (readyAudioRef.current) {
      try {
        readyAudioRef.current.pause();
        readyAudioRef.current.currentTime = 0;
      } catch (e) {
        console.warn("[timer-audio] Failed to stop ready sound (mobile):", e);
      }
    }
    if (prepAudioRef.current) {
      try {
        prepAudioRef.current.pause();
        prepAudioRef.current.currentTime = 0;
      } catch (e) {
        console.warn("[timer-audio] Failed to stop prep sound (mobile):", e);
      }
    }
    if (endAudioRef.current) {
      try {
        endAudioRef.current.pause();
        endAudioRef.current.currentTime = 0;
      } catch (e) {
        console.warn("[timer-audio] Failed to stop end sound (mobile):", e);
      }
    }
  }, []);

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

  // Start ready overlay
  const startReadyOverlay = useCallback(() => {
    if (readyOverlayShown) return; // Already shown in this session
    
    setReadyActive(true);
    setReadySecondsLeft(3);
    setReadyOverlayShown(true);
    // Reset end sound flag when starting a new run
    setEndSoundPlayed(false);
    
    // Play audio - create new instance each time to avoid delay
    try {
      // Create new audio instance for immediate playback
      const audio = new Audio(asset("/sounds/ready_count.mp3"));
      audio.currentTime = 0;
      
      // Play immediately
      audio.play().catch((err) => {
        console.error("Failed to play ready audio:", err);
      });
      
      // Also update ref for cleanup
      readyAudioRef.current = audio;
    } catch (err) {
      console.error("Failed to play ready audio:", err);
    }
    
    // Countdown interval
    readyIntervalRef.current = setInterval(() => {
      setReadySecondsLeft((prev) => {
        if (prev <= 1) {
          // Countdown finished
          if (readyIntervalRef.current) {
            clearInterval(readyIntervalRef.current);
            readyIntervalRef.current = null;
          }
          setReadyActive(false);
          // Start the timer
          start();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [readyOverlayShown, start]);

  // Auto-start ready overlay when autoStart is true
  useEffect(() => {
    if (autoStart && status === "idle" && !readyOverlayShown) {
      startReadyOverlay();
    }
  }, [autoStart, status, readyOverlayShown, startReadyOverlay]);

  // Centralized prep sound playback function with comprehensive logging
  const playPrepSound = useCallback((stepKey: string, ctx: {
    prevRemainingSec: number;
    remainingSec: number;
    isRunning: boolean;
    isPaused: boolean;
    isReadyOverlay: boolean;
  }) => {
    // If force-stop is requested (e.g. user pressed STOP), do not start playback
    if (prepForceStopRef.current) {
      console.log("[timer-prep] Force-stop flag is ON, skipping playPrepSound for stepKey:", stepKey);
      return;
    }

    const audio = prepAudioRef.current;
    if (!audio) {
      console.error("[timer-prep] Audio instance not initialized");
      return;
    }
    
    // Log audio state before playback
    console.log("[timer-prep] playPrepSound called:", {
      stepKey,
      src: audio.src,
      muted: audio.muted,
      volume: audio.volume,
      paused: audio.paused,
      currentTime: audio.currentTime,
      ...ctx,
    });
    
    // IMPORTANT: Do NOT stop currently playing prep sound
    // The prep sound should continue playing even when transitioning to the next step
    // Only reset and play if the audio is not already playing
    // This ensures the sound continues uninterrupted across step transitions
    
    // ALWAYS create a NEW audio instance for each play attempt
    // This is the most reliable way to ensure playback works
    // Reusing the same instance can cause issues with browser autoplay policies
    try {
      const newAudio = new Audio(asset("/sounds/timer-prep.mp3"));
      newAudio.volume = 1.0;
      newAudio.muted = false;
      newAudio.currentTime = 0;
      // 常に最新のインスタンスを参照できるよう、再生前にrefを更新しておく
      prepAudioRef.current = newAudio;
      
      console.log("[timer-prep] 🎵 Creating NEW audio instance and playing:", {
        volume: newAudio.volume,
        muted: newAudio.muted,
        src: newAudio.src,
      });
      
      const playPromise = newAudio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // If STOP/Pause was pressed while play() was in-flight, immediately stop this instance
            if (prepForceStopRef.current) {
              console.log("[timer-prep] Force-stop flag turned ON during play; stopping newAudio - stepKey:", stepKey);
              newAudio.pause();
              newAudio.currentTime = 0;
              return;
            }
            // Mark this step as played to prevent duplicates
            prepSoundPlayedForStepRef.current.add(stepKey);
            console.log("[timer-prep] ✅✅✅ SUCCESS! Audio is playing! - stepKey:", stepKey);
            console.log("[timer-prep] Audio state:", {
              volume: newAudio.volume,
              muted: newAudio.muted,
              paused: newAudio.paused,
              currentTime: newAudio.currentTime,
              duration: newAudio.duration,
            });
            
            // Store reference for potential cleanup
            prepAudioRef.current = newAudio;
          })
          .catch((err) => {
            // AbortError is expected when pause() interrupts play() - ignore it
            if (err.name === "AbortError" || err.message?.includes("interrupted")) {
              console.log("[timer-prep] play() interrupted (likely by pause) - stepKey:", stepKey);
              // Still mark as played to prevent duplicate attempts
              prepSoundPlayedForStepRef.current.add(stepKey);
              return;
            }
            
            console.error("[timer-prep] ❌❌❌ FAILED to play audio! - stepKey:", stepKey);
            console.error("[timer-prep] Error:", {
              name: err.name,
              message: err.message,
              code: (err as any).code,
            });
            console.error("[timer-prep] This usually means:");
            console.error("  1. Browser autoplay policy blocked the sound");
            console.error("  2. User interaction is required first");
            console.error("  3. Audio file path is incorrect");
            console.error("  4. Audio file is corrupted or unsupported format");
            
            // Still mark as played to prevent duplicate attempts
            prepSoundPlayedForStepRef.current.add(stepKey);
          });
      } else {
        console.warn("[timer-prep] ⚠️ play() returned undefined - stepKey:", stepKey);
        prepSoundPlayedForStepRef.current.add(stepKey);
      }
    } catch (err) {
      console.error("[timer-prep] ❌❌❌ EXCEPTION creating audio:", err);
      prepSoundPlayedForStepRef.current.add(stepKey);
    }
  }, []);
  
  // Stop prep sound only on user Pause/Stop (not on normal step transitions)
  const stopPrepSound = useCallback(() => {
    if (prepAudioRef.current) {
      prepAudioRef.current.pause();
      prepAudioRef.current.currentTime = 0;
      console.log("[timer-prep] Stopped by user pause/stop");
    }
  }, []);
  
  // Track previous step index to detect step transitions
  const prevStepIndexForSoundRef = useRef<number>(currentStepIndex);
  
  // Play prep sound when RoundTimer reaches 00:00 (detected by step transition)
  // When remainingSec reaches 0, useProgramTimer automatically advances to next step
  // So we detect the step transition as the signal that previous round ended
  useEffect(() => {
    // Don't play during ready overlay or when finished/idle
    if (readyActive || status === "finished" || status === "idle") {
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
    const isReadyOverlay = readyActive;
    
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
    console.log("[timer-prep] Step transition check:", {
      stepKey,
      prevStepIndex,
      currentStepIndex,
      stepTransition,
      isForwardTransition,
      remainingSec,
      hasNextStep,
      hasNextStepFromPrev,
      nextStepExists: nextStep !== null,
      totalSteps,
      isRunning,
      isReadyOverlay,
      alreadyPlayed: prepSoundPlayedForStepRef.current.has(stepKey),
    });
    
    // Trigger when step transitions forward (previous round ended, new round started)
    // CRITICAL: ONLY play if there is a next step to execute (do NOT play on last round)
    // Exclude Ready overlay and dedupe with Set keyed by unique step key
    const shouldPlay = 
      isRunning && 
      stepTransition &&
      isForwardTransition &&  // Only play on forward transitions (automatic step advances)
      hasNextStep &&  // CRITICAL: Next Round must exist - do NOT play if this is the last round
      !isReadyOverlay &&
      !prepSoundPlayedForStepRef.current.has(stepKey);
    
    if (shouldPlay) {
      console.log("[timer-prep] ✅✅✅ SHOULD PLAY - Previous round ended, new round started - Calling playPrepSound - stepKey:", stepKey);
      playPrepSound(stepKey, {
        prevRemainingSec: 0,
        remainingSec,
        isRunning,
        isPaused: false,
        isReadyOverlay,
      });
    } else if (stepTransition && !hasNextStep && isRunning && !isReadyOverlay) {
      console.log("[timer-prep] ⏸️ Step transition but NO NEXT ROUND - skipping prep sound (last round)");
    } else if (stepTransition && !isForwardTransition) {
      console.log("[timer-prep] ⏸️ Step transition but not forward (manual prev/next) - skipping prep sound");
    } else if (stepTransition && !isRunning) {
      console.log("[timer-prep] ⏸️ Step transition but not running - skipping prep sound");
    } else if (stepTransition && isReadyOverlay) {
      console.log("[timer-prep] ⏸️ Step transition but ready overlay active - skipping prep sound");
    } else if (stepTransition && prepSoundPlayedForStepRef.current.has(stepKey)) {
      console.log("[timer-prep] ⏸️ Step transition but already played for this step - skipping prep sound");
    }
    
    // Update previous step index AFTER checking transition
    prevStepIndexForSoundRef.current = currentStepIndex;
  }, [currentStepIndex, currentStep?.id ?? null, nextStep, readyActive, status, remainingSec, playPrepSound, steps.length]);
  
  // Play end sound when program finishes
  useEffect(() => {
    if (status === "finished" && !endSoundPlayed) {
      try {
        const audio = endAudioRef.current || new Audio(asset("/sounds/timer-end.mp3"));
        audio.currentTime = 0; // Reset to start
        audio.play().catch((err) => {
          console.error("Failed to play end sound:", err);
        });
        endAudioRef.current = audio;
        setEndSoundPlayed(true);
      } catch (err) {
        console.error("Failed to play end sound:", err);
      }
    }
  }, [status, endSoundPlayed]);
  
  // Stop prep sound only on user Pause/Stop (not on normal step transitions)
  useEffect(() => {
    // Only stop on explicit pause/stop, not on step transitions
    // Step transitions keep status === "running", so we only stop when status changes to paused/idle/finished
    // Use a small delay to avoid interrupting play() calls that happen during step transitions
    if (status === "paused" || status === "idle" || status === "finished") {
      // Use setTimeout to avoid interrupting play() calls that might be in progress
      const timeoutId = setTimeout(() => {
        stopPrepSound();
      }, 100); // Small delay to let play() complete
      
      return () => clearTimeout(timeoutId);
    }
  }, [status, stopPrepSound]);
  
  // Cleanup ready overlay, prep sound, and end sound on unmount
  useEffect(() => {
    return () => {
      if (readyIntervalRef.current) {
        clearInterval(readyIntervalRef.current);
      }
      if (readyAudioRef.current) {
        readyAudioRef.current.pause();
      }
      if (prepAudioRef.current) {
        prepAudioRef.current.pause();
        prepAudioRef.current.currentTime = 0;
      }
      if (endAudioRef.current) {
        endAudioRef.current.pause();
      }
    };
  }, []);

  // Unlock audio on user gesture (Start button) to bypass autoplay restrictions
  const unlockAudio = useCallback(() => {
    if (prepAudioRef.current) {
      const audio = prepAudioRef.current;
      // Play then immediately pause/reset to unlock
      audio.play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          console.log("[timer-prep] Audio unlocked via user gesture");
        })
        .catch((err) => {
          console.error("[timer-prep] Failed to unlock audio:", err);
        });
    }
  }, []);

  // Toggle play/pause based on current status
  const togglePlayPause = () => {
    if (status === "idle" || status === "finished") {
      // Userが新しいRunを開始するタイミングなので、過去の全サウンドを完全停止
      stopAllSounds();
      // New run starts: allow prep sound playback again
      prepForceStopRef.current = false;
      // Unlock audio on user gesture (Start button)
      unlockAudio();
      // Start ready overlay if not shown yet
      if (!readyOverlayShown) {
        startReadyOverlay();
        return;
      }
      // Reset end sound flag when starting a new run
      setEndSoundPlayed(false);
      // Reset run session ID
      runSessionIdRef.current = `session-${Date.now()}-${Math.random()}`;
      start();
    } else if (status === "running") {
      // STOP: ensure prep sound is force-stopped and cannot continue
      prepForceStopRef.current = true;
      // 進行中の全サウンド（ready/prep/end）を停止
      stopAllSounds();
      pause();
    } else if (status === "paused") {
      // Resume: allow prep sound playback again
      prepForceStopRef.current = false;
      resume();
    }
  };

  // Reset timer to beginning of current step
  const resetTimer = () => {
    reset();
    // Reset ready overlay flag so it can show again
    setReadyOverlayShown(false);
    setReadyActive(false);
    setReadySecondsLeft(3);
    // Reset prep sound tracking and run session
    prepSoundPlayedForStepRef.current.clear();
    runSessionIdRef.current = `session-${Date.now()}-${Math.random()}`;
    prevRemainingSecRef.current = remainingSec;
    // Also force-stop any prep sound
    prepForceStopRef.current = true;
    // Clean up interval and audio
    if (readyIntervalRef.current) {
      clearInterval(readyIntervalRef.current);
      readyIntervalRef.current = null;
    }
    if (readyAudioRef.current) {
      readyAudioRef.current.pause();
      readyAudioRef.current = null;
    }
    // 明示的なリセット時は全サウンドを完全停止
    stopAllSounds();
  };

  // Navigate to home - fully stop timer and navigate
  const goHome = useCallback(() => {
    // Step 1: Stop the active timer
    if (status === "running" || status === "paused") {
      pause();
    }
    
    // Step 2: Clear any setInterval
    if (readyIntervalRef.current) {
      clearInterval(readyIntervalRef.current);
      readyIntervalRef.current = null;
    }
    
    // Step 3: Force-stop all sounds and set force-stop flag
    prepForceStopRef.current = true;
    stopAllSounds();
    
    // Step 4: Stop any playing audio
    if (readyAudioRef.current) {
      readyAudioRef.current.pause();
      readyAudioRef.current.currentTime = 0;
      readyAudioRef.current = null;
    }
    if (prepAudioRef.current) {
      prepAudioRef.current.pause();
      prepAudioRef.current.currentTime = 0;
    }
    if (endAudioRef.current) {
      endAudioRef.current.pause();
      endAudioRef.current.currentTime = 0;
      endAudioRef.current = null;
    }
    
    // Step 5: Reset run-related state
    reset();
    setReadyOverlayShown(false);
    setReadyActive(false);
    setReadySecondsLeft(3);
    setEndSoundPlayed(false);
    prepSoundPlayedForStepRef.current.clear();
    runSessionIdRef.current = `session-${Date.now()}-${Math.random()}`;
    
    // Step 6: Navigate to ProgramTimerHome
    if (onBackToHome) {
      onBackToHome();
    } else {
      router.push("/program");
    }
  }, [status, pause, reset, stopAllSounds, router, onBackToHome]);

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

  const computeSetProgress = (step: ProgramStep | null, stepIndex: number) => {
    if (!step) return { currentSetIndex: 1, totalSetCount: 1 };

    const currentSetIndex = step.setNumber && step.setNumber > 0 ? step.setNumber : 1;

    const baseLabel = step.label?.trim() || `__round_${step.roundNumber ?? stepIndex + 1}`;
    const groupKey = step.roleGroupId ? `${baseLabel}__rg_${step.roleGroupId}` : baseLabel;

    let totalSetCount = 1;
    const sameGroupSteps = steps.filter((s) => {
      if (!s) return false;
      const lbl = s.label?.trim() || `__round_${s.roundNumber ?? 0}`;
      const key = s.roleGroupId ? `${lbl}__rg_${s.roleGroupId}` : lbl;
      return key === groupKey;
    });

    if (sameGroupSteps.length > 0) {
      const maxSetNumber = Math.max(
        ...sameGroupSteps.map((s) => (s.setNumber && s.setNumber > 0 ? s.setNumber : 1)),
      );
      const fixedFromGroup = sameGroupSteps.find(
        (s) => s.fixedSetsCount && s.fixedSetsCount > 0,
      )?.fixedSetsCount;
      totalSetCount = Math.max(maxSetNumber, fixedFromGroup ?? 1);
    }

    return { currentSetIndex, totalSetCount };
  };

  // Get step name for display
  const getStepName = () => {
    const roundNumber = currentStep?.roundNumber ?? currentStepIndex + 1;
    const { currentSetIndex, totalSetCount } = computeSetProgress(currentStep, currentStepIndex);
    return formatTimerTitle({
      step: currentStep,
      roundIndex: roundNumber,
      currentSetIndex,
      totalSetCount,
    });
  };

  // Get next step name for display
  const getNextStepName = () => {
    if (!nextStep) return "";
    const nextIndex = currentStepIndex + 1;
    const roundNumber = nextStep.roundNumber ?? nextIndex + 1;
    const { currentSetIndex, totalSetCount } = computeSetProgress(nextStep, nextIndex);
    return formatTimerTitle({
      step: nextStep,
      roundIndex: roundNumber,
      currentSetIndex,
      totalSetCount,
    });
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

        {/* Ready overlay */}
        {readyActive && (
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center z-[60] pointer-events-auto"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.8)",
            }}
          >
            {/* "Are you ready?" text */}
            <div
              className="text-center mb-8"
              style={{
                fontFamily: istokWeb.style.fontFamily,
                fontSize: "clamp(3rem, 8vw, 8rem)",
                fontWeight: 700,
                color: "#0015FF",
              }}
            >
              Are you ready?
            </div>
            
            {/* Countdown number */}
            <div
              className="text-center"
              style={{
                fontFamily: istokWeb.style.fontFamily,
                fontSize: "clamp(8rem, 20vw, 20rem)",
                fontWeight: 700,
                color: "#000000",
              }}
            >
              {readySecondsLeft}
            </div>
          </div>
        )}

        {/* Finish overlay */}
        {status === "finished" && (
          <div 
            className="absolute inset-0 flex items-center justify-center z-50 pointer-events-auto"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.8)",
            }}
          >
            {/* Home button - top-left */}
            <button
              type="button"
              onClick={goHome}
              className="absolute top-4 left-4 z-10 transition-transform duration-100 active:scale-95 pointer-events-auto"
              style={{ touchAction: "auto" }}
              aria-label="Home"
            >
              <svg
                className="w-8 h-8 md:w-12 md:h-12"
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
            
            {/* FINISH text - centered */}
            <div
              className="text-center"
              style={{
                fontFamily: istokWeb.style.fontFamily,
                fontSize: "clamp(6rem, 20vw, 15rem)",
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
          {/* Vertical stack: Reset, Settings */}
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
          {/* Round label - white, with role/set info same as PC */}
          <span className="text-white text-center" style={{ fontSize: 'clamp(1.5rem, 3vw, 4rem)', lineHeight: 1.2 }}>
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

      {/* Ready overlay */}
      {readyActive && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center z-[60] pointer-events-auto"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.8)",
          }}
        >
          {/* "Are you ready?" text */}
          <div
            className="text-center mb-8"
            style={{
              fontFamily: istokWeb.style.fontFamily,
              fontSize: "clamp(3rem, 8vw, 8rem)",
              fontWeight: 700,
              color: "#0015FF",
            }}
          >
            Are you ready?
          </div>
          
          {/* Countdown number */}
          <div
            className="text-center"
            style={{
              fontFamily: istokWeb.style.fontFamily,
              fontSize: "clamp(8rem, 20vw, 20rem)",
              fontWeight: 700,
              color: "#000000",
            }}
          >
            {readySecondsLeft}
          </div>
        </div>
      )}

      {/* Finished overlay - Portrait mode */}
      {status === "finished" && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center z-50 pointer-events-auto"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.8)", // White with 80% opacity
          }}
        >
          {/* Home buttons - top-left (two icons: black outline and light gray) */}
          <div className="absolute top-4 left-4 flex flex-col gap-3 z-10">
            {/* First Home icon - black outline */}
            <button
              type="button"
              onClick={goHome}
              className="transition-transform duration-100 active:scale-95 pointer-events-auto"
              style={{ touchAction: "auto" }}
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
            {/* Second Home icon - light gray outline */}
            <button
              type="button"
              onClick={goHome}
              className="transition-transform duration-100 active:scale-95 pointer-events-auto opacity-40"
              style={{ touchAction: "auto" }}
              aria-label="Home"
            >
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="gray"
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

          {/* Timer name - top center, light gray, italic */}
          <div 
            className="text-center mb-4 shrink-0 absolute top-20"
            style={{
              fontFamily: istokWeb.style.fontFamily,
              fontSize: "clamp(1.5rem, 4vw, 3rem)",
              fontWeight: 400,
              fontStyle: "italic",
              color: "#CCCCCC",
            }}
          >
            {getTimerName()}
          </div>

          {/* FINISH text - centered */}
          <div
            className="text-center shrink-0"
            style={{
              fontFamily: istokWeb.style.fontFamily,
              fontSize: "clamp(6rem, 20vw, 15rem)",
              fontWeight: 700,
              fontStyle: "italic",
              color: "#0015FF",
              textShadow: "0px 8px 12px rgba(0,0,0,0.35)",
            }}
          >
            FINISH
          </div>

          {/* NEXT label - bottom right */}
          {nextStep && (
            <div className="absolute bottom-20 right-4">
              <span 
                className="text-black text-md font-semibold"
                style={{
                  color: "#CCCCCC",
                }}
              >
                NEXT: {getNextStepName()}
              </span>
        </div>
          )}

          {/* Bottom buttons - keep existing buttons visible */}
          <div className="absolute bottom-4 flex items-center justify-center gap-6">
            {/* Back button */}
            <button
              type="button"
              onClick={prev}
              className="w-14 h-14 bg-[#00FFFF] rounded-md flex items-center justify-center shadow-[0_3px_0_rgba(0,0,0,0.3),0_0_10px_rgba(0,255,255,0.2)] transition-transform duration-100 active:translate-y-1 active:shadow-[0_2px_0_rgba(0,0,0,0.3),0_0_8px_rgba(0,255,255,0.15)] pointer-events-auto"
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

            {/* Start button */}
            <button
              type="button"
              onClick={togglePlayPause}
              className="px-8 py-2 rounded-md text-white font-bold text-lg flex items-center gap-1 shadow-[0_3px_0_rgba(0,0,0,0.3),0_0_10px_rgba(0,0,0,0.15)] transition-transform duration-100 active:translate-y-1 active:shadow-[0_2px_0_rgba(0,0,0,0.3),0_0_8px_rgba(0,0,0,0.1)] bg-[#00FF88] shadow-[0_3px_0_rgba(0,0,0,0.3),0_0_15px_rgba(0,255,136,0.3)] active:shadow-[0_2px_0_rgba(0,0,0,0.3),0_0_12px_rgba(0,255,136,0.25)] pointer-events-auto"
              style={{ touchAction: "auto" }}
            >
              <svg
                className="w-11 h-11"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
              START
            </button>

            {/* Skip button */}
            <button
              type="button"
              onClick={next}
              className="w-14 h-14 bg-[#00FFFF] rounded-md flex items-center justify-center shadow-[0_3px_0_rgba(0,0,0,0.3),0_0_10px_rgba(0,255,255,0.2)] transition-transform duration-100 active:translate-y-1 active:shadow-[0_2px_0_rgba(0,0,0,0.3),0_0_8px_rgba(0,255,255,0.15)] pointer-events-auto"
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
        </div>
      )}
      
      {/* Program Create Overlay */}
      {isOverlayOpen && selectedProgram && (
        <ProgramCreateOverlay
          onClose={closeOverlay}
          transparentBackground={true}
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
