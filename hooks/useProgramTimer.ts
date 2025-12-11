// hooks/useProgramTimer.ts
"use client";

import { useEffect, useMemo, useState } from "react";
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

  // steps変更時にリセット
  // steps配列の内容（特にduration）が変更された場合もリセットする必要があるため、
  // steps配列全体を依存配列に使用する
  useEffect(() => {
    setState(createInitialState(steps));
  }, [steps]); // steps配列全体に依存して、内容変更時もリセット

  const currentStep: ProgramStep | null =
    steps[state.currentStepIndex] ?? null;
  const nextStep: ProgramStep | null =
    steps[state.currentStepIndex + 1] ?? null;

  const totalDurationSec: number = useMemo(() => {
    return steps.reduce((sum, s) => sum + s.duration, 0);
  }, [steps]);

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
      const prevStep = steps[prevIndex] ?? null;
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
    if (!steps.length) return;

    const id = window.setInterval(() => {
      setState((prev) => {
        if (prev.status !== "running") return prev;
        if (!steps.length) {
          return { ...prev, status: "finished" };
        }

        const current = steps[prev.currentStepIndex];
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

        if (nextIndex >= steps.length) {
          return {
            ...prev,
            status: "finished",
            currentStepIndex: steps.length - 1,
            remainingSec: 0,
            elapsedInStepSec: current.duration,
            totalElapsedSec: prev.totalElapsedSec + consumed,
          };
        }

        const nextStep = steps[nextIndex];

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
  }, [state.status, steps.length, steps]);

  const start = () => {
    if (!steps.length) return;

    setState((prev) => {
      const first = steps[0];

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
    setState(createInitialState(steps));
  };

  const skipToStep = (index: number) => {
    if (index < 0 || index >= steps.length) return;
    const target = steps[index];

    setState((prev) => ({
      ...prev,
      currentStepIndex: index,
      remainingSec: target.duration,
      elapsedInStepSec: 0,
      // totalElapsedSec は v1 ではそのまま保持
    }));
  };

  const next = () => skipToStep(state.currentStepIndex + 1);
  const prev = () => skipToStep(state.currentStepIndex - 1);

  useEffect(() => {
    if (!autoStart) return;
    if (!steps.length) return;
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
  };
}
