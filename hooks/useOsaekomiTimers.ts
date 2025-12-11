// hooks/useOsaekomiTimers.ts
"use client";

import { useEffect, useRef, useState } from "react";

export type OsaekomiSide = "white" | "blue" | null;

type OsaekomiTimersConfig = {
  maxSeconds: number; // 20 (Judo) / 30 (Kosen) など
};

export function useOsaekomiTimers(config: OsaekomiTimersConfig) {
  const [whiteSeconds, setWhiteSeconds] = useState(0);
  const [blueSeconds, setBlueSeconds] = useState(0);
  const [maxSeconds, setMaxSecondsState] = useState(config.maxSeconds);
  const [runningSide, setRunningSide] = useState<OsaekomiSide>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearIntervalIfNeeded = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // カウントアップ処理
  useEffect(() => {
    if (!runningSide) {
      clearIntervalIfNeeded();
      return;
    }

    intervalRef.current = setInterval(() => {
      if (runningSide === "white") {
        setWhiteSeconds((prev) => {
          if (prev >= maxSeconds) {
            // すでに上限に達している場合はこれ以上カウントせず、interval だけ止める
            clearIntervalIfNeeded();
            return maxSeconds;
          }
          const next = prev + 1;
          if (next >= maxSeconds) {
            // maxSeconds 到達でピタッと止める（runningSide はこのままにしておく）
            clearIntervalIfNeeded();
            return maxSeconds;
          }
          return next;
        });
      } else if (runningSide === "blue") {
        setBlueSeconds((prev) => {
          if (prev >= maxSeconds) {
            clearIntervalIfNeeded();
            return maxSeconds;
          }
          const next = prev + 1;
          if (next >= maxSeconds) {
            clearIntervalIfNeeded();
            return maxSeconds;
          }
          return next;
        });
      }
    }, 1000);

    return () => {
      clearIntervalIfNeeded();
    };
  }, [runningSide, maxSeconds]);

  const setMaxSeconds = (next: number) => {
    const clamped = Math.min(30, Math.max(5, next));
    setMaxSecondsState((prev) => {
      if (prev === clamped) return prev;
      return clamped;
    });

    // 上限を下げた場合でも現在値がはみ出さないように調整
    setWhiteSeconds((prev) => Math.min(clamped, Math.max(0, prev)));
    setBlueSeconds((prev) => Math.min(clamped, Math.max(0, prev)));
  };

  const setOsaekomiSeconds = (
    side: Exclude<OsaekomiSide, null>,
    value: number
  ) => {
    const clamped = Math.min(maxSeconds, Math.max(0, value));
    if (side === "white") {
      setWhiteSeconds(clamped);
    } else {
      setBlueSeconds(clamped);
    }
  };

  const adjustOsaekomiSeconds = (
    side: Exclude<OsaekomiSide, null>,
    delta: number
  ) => {
    if (side === "white") {
      setWhiteSeconds((prev) =>
        Math.min(maxSeconds, Math.max(0, prev + delta))
      );
    } else {
      setBlueSeconds((prev) =>
        Math.min(maxSeconds, Math.max(0, prev + delta))
      );
    }
  };

  const startOsaekomi = (side: Exclude<OsaekomiSide, null>) => {
    setRunningSide(side);
  };

  const stopOsaekomi = () => {
    setRunningSide(null);
    clearIntervalIfNeeded();
  };

  const resetOsaekomi = (side?: Exclude<OsaekomiSide, null>) => {
    setRunningSide(null);
    clearIntervalIfNeeded();
    if (!side || side === "white") setWhiteSeconds(0);
    if (!side || side === "blue") setBlueSeconds(0);
  };

  return {
    whiteSeconds,
    blueSeconds,
    maxSeconds,
    runningSide,
    startOsaekomi,
    stopOsaekomi,
    resetOsaekomi,
    setMaxSeconds,
    setOsaekomiSeconds,
    adjustOsaekomiSeconds,
  };
}
