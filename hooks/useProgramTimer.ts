// hooks/useProgramTimer.ts
"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import type {
  ProgramStep,
  ProgramTimerStatus,
} from "@/lib/programTimer/types";

export type UseProgramTimerOptions = {
  steps: ProgramStep[];
  autoStart?: boolean;
  onStepChange?: (payload: {
    step: ProgramStep;
    index: number;
    prevStep: ProgramStep | null;
  }) => void;
  onFinish?: () => void;
};

export type UseProgramTimerResult = {
  status: ProgramTimerStatus;
  currentStepIndex: number;
  currentStep: ProgramStep | null;
  nextStep: ProgramStep | null;

  remainingSec: number;
  elapsedInStepSec: number;
  totalElapsedSec: number;

  progressInStep: number;    // 0〜1
  programProgress: number;   // 0〜1

  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;

  next: () => void;
  prev: () => void;
  skipToStep: (index: number) => void;
  
  // プログラム編集用メソッド
  updateSteps: (newSteps: ProgramStep[]) => void;
  updateActiveTimerDuration: (newDuration: number) => void;
};

type InternalState = {
  status: ProgramTimerStatus;
  currentStepIndex: number;
  remainingSec: number;
  elapsedInStepSec: number;
  totalElapsedSec: number;
};

function createInitialState(steps: ProgramStep[]): InternalState {
  const firstStep = steps[0];

  if (!firstStep) {
    return {
      status: "idle",
      currentStepIndex: 0,
      remainingSec: 0,
      elapsedInStepSec: 0,
      totalElapsedSec: 0,
    };
  }

  return {
    status: "idle",
    currentStepIndex: 0,
    remainingSec: firstStep.duration,
    elapsedInStepSec: 0,
    totalElapsedSec: 0,
  };
}

export function useProgramTimer(
  options: UseProgramTimerOptions,
): UseProgramTimerResult {
  const { steps, autoStart = false, onStepChange, onFinish } = options;

  const [state, setState] = useState<InternalState>(() =>
    createInitialState(steps),
  );

  // stepsの参照を保持（手動更新を許可するため）
  const [internalSteps, setInternalSteps] = useState<ProgramStep[]>(steps);
  const stepsRef = useRef<ProgramStep[]>(steps);
  const isInitialMountRef = useRef(true);
  
  // stepsが外部から変更された場合のみ更新（初回マウント時のみリセット）
  useEffect(() => {
    // 参照が変わった場合のみ更新（手動更新を区別するため）
    if (steps !== stepsRef.current) {
      stepsRef.current = steps;
      setInternalSteps(steps);
      // 初回マウント時のみリセット
      if (isInitialMountRef.current) {
    setState(createInitialState(steps));
        isInitialMountRef.current = false;
      }
    }
  }, [steps]);

  const currentStep: ProgramStep | null =
    internalSteps[state.currentStepIndex] ?? null;
  const nextStep: ProgramStep | null =
    internalSteps[state.currentStepIndex + 1] ?? null;

  const totalDurationSec: number = useMemo(() => {
    return internalSteps.reduce((sum, s) => sum + s.duration, 0);
  }, [internalSteps]);

  const progressInStep =
    currentStep && currentStep.duration > 0
      ? state.elapsedInStepSec / currentStep.duration
      : 0;

  const programProgress =
    totalDurationSec > 0 ? state.totalElapsedSec / totalDurationSec : 0;

  // Step変更 / finish 検出用
  const [prevIndex, setPrevIndex] = useState<number>(state.currentStepIndex);
  const [prevStatus, setPrevStatus] =
    useState<ProgramTimerStatus>(state.status);

  useEffect(() => {
    if (
      state.currentStepIndex !== prevIndex &&
      currentStep &&
      typeof onStepChange === "function"
    ) {
      const prevStep = internalSteps[prevIndex] ?? null;
      onStepChange({
        step: currentStep,
        index: state.currentStepIndex,
        prevStep,
      });
    }

    if (
      state.status === "finished" &&
      prevStatus !== "finished" &&
      typeof onFinish === "function"
    ) {
      onFinish();
    }

    setPrevIndex(state.currentStepIndex);
    setPrevStatus(state.status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentStepIndex, state.status]);

  // 1秒ごとの tick
  useEffect(() => {
    if (state.status !== "running") return;
    if (!internalSteps.length) return;

    const id = window.setInterval(() => {
      setState((prev) => {
        if (prev.status !== "running") return prev;
        if (!internalSteps.length) {
          return { ...prev, status: "finished" };
        }

        const current = internalSteps[prev.currentStepIndex];
        if (!current) {
          return { ...prev, status: "finished" };
        }

        if (prev.remainingSec > 1) {
          return {
            ...prev,
            remainingSec: prev.remainingSec - 1,
            elapsedInStepSec: prev.elapsedInStepSec + 1,
            totalElapsedSec: prev.totalElapsedSec + 1,
          };
        }

        const consumed = prev.remainingSec || 1;
        const nextIndex = prev.currentStepIndex + 1;

        if (nextIndex >= internalSteps.length) {
          return {
            ...prev,
            status: "finished",
            currentStepIndex: internalSteps.length - 1,
            remainingSec: 0,
            elapsedInStepSec: current.duration,
            totalElapsedSec: prev.totalElapsedSec + consumed,
          };
        }

        const nextStep = internalSteps[nextIndex];

        return {
          ...prev,
          status: "running",
          currentStepIndex: nextIndex,
          remainingSec: nextStep.duration,
          elapsedInStepSec: 0,
          totalElapsedSec: prev.totalElapsedSec + consumed,
        };
      });
    }, 1000);

    return () => {
      window.clearInterval(id);
    };
  }, [state.status, internalSteps]);

  const start = () => {
    if (!internalSteps.length) return;

    setState((prev) => {
      const first = internalSteps[0];

      if (prev.status === "idle" || prev.status === "finished") {
        return {
          status: "running",
          currentStepIndex: 0,
          remainingSec: first.duration,
          elapsedInStepSec: 0,
          totalElapsedSec: 0,
        };
      }

      if (prev.status === "paused") {
        return {
          ...prev,
          status: "running",
        };
      }

      return prev;
    });
  };

  const pause = () => {
    setState((prev) =>
      prev.status === "running" ? { ...prev, status: "paused" } : prev,
    );
  };

  const resume = () => {
    setState((prev) =>
      prev.status === "paused" ? { ...prev, status: "running" } : prev,
    );
  };

  const reset = () => {
    setState(createInitialState(internalSteps));
  };

  const skipToStep = (index: number) => {
    if (index < 0 || index >= internalSteps.length) return;
    const target = internalSteps[index];

    setState((prev) => ({
      ...prev,
      currentStepIndex: index,
      remainingSec: target.duration,
      elapsedInStepSec: 0,
      // totalElapsedSec は v1 ではそのまま保持
    }));
  };
  
  // プログラム編集用メソッド
  const updateSteps = (newSteps: ProgramStep[]) => {
    setInternalSteps(newSteps);
    stepsRef.current = newSteps;
    // 非アクティブなタイマーの変更は即座に適用（リセットしない）
  };
  
  // アクティブなタイマーのdurationを更新（原子論的に適用）
  const updateActiveTimerDuration = (newDuration: number) => {
    setState((prev) => ({
      ...prev,
      remainingSec: newDuration,
      elapsedInStepSec: 0, // 経過時間をリセット
    }));
    // stepsも更新
    setInternalSteps((prevSteps) => {
      const updated = [...prevSteps];
      if (updated[state.currentStepIndex]) {
        updated[state.currentStepIndex] = {
          ...updated[state.currentStepIndex],
          duration: newDuration,
        };
      }
      return updated;
    });
  };

  const next = () => skipToStep(state.currentStepIndex + 1);
  const prev = () => skipToStep(state.currentStepIndex - 1);

  useEffect(() => {
    if (!autoStart) return;
    if (!internalSteps.length) return;
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    status: state.status,
    currentStepIndex: state.currentStepIndex,
    currentStep,
    nextStep,
    remainingSec: state.remainingSec,
    elapsedInStepSec: state.elapsedInStepSec,
    totalElapsedSec: state.totalElapsedSec,
    progressInStep,
    programProgress,
    start,
    pause,
    resume,
    reset,
    next,
    prev,
    skipToStep,
    updateSteps,
    updateActiveTimerDuration,
  };
}
