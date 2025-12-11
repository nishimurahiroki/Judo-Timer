"use client";

import { useEffect, useRef, useState } from "react";

export type TimerConfig = {
  mainSeconds: number;
  osaekomiSeconds: number; // 将来用。今は未使用でOK
};

export type UseJudoTimerResult = {
  remainingSeconds: number;
  isRunning: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
  adjustMainSeconds: (delta: number) => void;
};

export function useJudoTimer(config: TimerConfig): UseJudoTimerResult {
  const [remainingSeconds, setRemainingSeconds] = useState(config.mainSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearIntervalIfNeeded = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (!isRunning) {
      clearIntervalIfNeeded();
      return;
    }

    if (intervalRef.current) {
      return; // 二重起動防止
    }

    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearIntervalIfNeeded();
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearIntervalIfNeeded();
    };
  }, [isRunning]);

  // 設定（config.mainSeconds）が変わったときは、
  // タイマーを停止しつつ新しい初期値にリセットする。
  // （ルール変更やメインタイマー秒数変更時のフルリセット用）
  useEffect(() => {
    setIsRunning(false);
    clearIntervalIfNeeded();
    setRemainingSeconds(config.mainSeconds);
  }, [config.mainSeconds]);

  const start = () => {
    if (isRunning) return;
    if (remainingSeconds <= 0) return;
    setIsRunning(true);
  };

  const stop = () => {
    setIsRunning(false);
    clearIntervalIfNeeded();
  };

  const reset = () => {
    setIsRunning(false);
    clearIntervalIfNeeded();
    setRemainingSeconds(config.mainSeconds);
  };

  const adjustMainSeconds = (delta: number) => {
    setRemainingSeconds((prev) => {
      const next = prev + delta;
      if (next < 0) return 0;
      return next;
    });
  };

  return { remainingSeconds, isRunning, start, stop, reset, adjustMainSeconds };
}
