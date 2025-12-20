"use client";

import { useRef, useEffect } from "react";
import { asset } from "@/lib/asset";

export type SoundKey = "timerStart" | "timerEnd" | "scoreWazaYuko";

type SoundMap = Record<SoundKey, HTMLAudioElement>;

const SOUND_PATHS: Record<SoundKey, string> = {
  timerStart: asset("/sounds/timer-start.mp3"),
  timerEnd: asset("/sounds/timer-end.mp3"),
  scoreWazaYuko: asset("/sounds/score-waza-yuko.mp3"),
};

export function useSoundManager(enabled: boolean) {
  const audioMapRef = useRef<SoundMap | null>(null);
  const audioUnlockedRef = useRef<boolean>(false);

  // マウント時にサウンドファイルをプリロード
  useEffect(() => {
    const audioMap: SoundMap = {} as SoundMap;

    // 各サウンドファイルをプリロード
    (Object.keys(SOUND_PATHS) as SoundKey[]).forEach((key) => {
      const audio = new Audio(SOUND_PATHS[key]);
      audio.preload = "auto";
      audioMap[key] = audio;
    });

    audioMapRef.current = audioMap;

    // クリーンアップ時にオーディオを停止
    return () => {
      Object.values(audioMap).forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
    };
  }, []);

  // オーディオアンロック（ユーザー操作後に呼び出される）
  const unlockAudio = () => {
    if (audioUnlockedRef.current) {
      return;
    }
    audioUnlockedRef.current = true;

    const audioMap = audioMapRef.current;
    if (!audioMap) {
      return;
    }

    // すべてのオーディオインスタンスをアンロック
    Object.values(audioMap).forEach((audio) => {
      const originalMuted = audio.muted;
      const originalVolume = audio.volume;
      audio.muted = true;
      audio.volume = 0;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // 少し待ってからpause（AbortErrorを避けるため）
            setTimeout(() => {
              audio.pause();
              audio.currentTime = 0;
              audio.muted = originalMuted;
              audio.volume = originalVolume;
            }, 10);
          })
          .catch((err) => {
            // AbortErrorは正常な動作なので無視
            if (err.name !== "AbortError" && process.env.NODE_ENV === "development") {
              console.warn("[useSoundManager] Failed to unlock audio:", err);
            }
            audio.muted = originalMuted;
            audio.volume = originalVolume;
          });
      } else {
        audio.muted = originalMuted;
        audio.volume = originalVolume;
      }
    });
  };

  const play = (key: SoundKey): void => {
    if (!enabled) {
      return;
    }

    // 最初の再生時にオーディオをアンロック
    if (!audioUnlockedRef.current) {
      unlockAudio();
    }

    const audioMap = audioMapRef.current;
    if (!audioMap) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[useSoundManager] Audio map not initialized");
      }
      return;
    }

    const audio = audioMap[key];
    if (!audio) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[useSoundManager] Audio not found for key: ${key}`);
      }
      return;
    }

    // 再生前に既存の再生を停止（AbortErrorを避けるため）
    if (!audio.paused) {
      audio.pause();
    }
    audio.currentTime = 0;

    // 再生（エラーをログに記録、AbortErrorは無視）
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // AbortErrorは正常な動作（pause()による中断）なので無視
        if (err.name !== "AbortError" && process.env.NODE_ENV === "development") {
          console.error(`[useSoundManager] Failed to play sound "${key}":`, err);
        }
      });
    }
  };

  return { play, unlockAudio };
}


































