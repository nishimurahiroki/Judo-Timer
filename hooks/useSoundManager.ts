"use client";

import { useRef, useEffect } from "react";
import { asset } from "@/lib/asset";

export type SoundKey =
  | "timerStart"
  | "timerEnd"
  | "timerPrep"
  | "timerReady"
  | "scoreWazaYuko";

type SoundMap = Record<SoundKey, HTMLAudioElement>;

const SOUND_PATHS: Record<SoundKey, string> = {
  timerStart: asset("/sounds/timer-start.mp3"),
  timerEnd: asset("/sounds/timer-end.mp3"),
  timerPrep: asset("/sounds/timer-prep.mp3"),
  timerReady: asset("/sounds/ready_count.mp3"),
  scoreWazaYuko: asset("/sounds/score-waza-yuko.mp3"),
};

// Module-scope iOS 判定（クライアント専用フックなので navigator 使用可）
const isIOS =
  typeof navigator !== "undefined" &&
  /iP(hone|od|ad)/.test(navigator.userAgent);

// iOS 専用: サイレントアンロック用の Audio インスタンス（timerStart とは別物）
let iosUnlockAudio: HTMLAudioElement | null = null;

const getIOSUnlockAudio = (): HTMLAudioElement | null => {
  if (typeof window === "undefined") return null;
  if (iosUnlockAudio) return iosUnlockAudio;

  try {
    // 短いサイレント音源（実ファイルは public/sounds/silence.mp3 に配置想定）
    // GitHub Pages の basePath 対応のため asset() を通す
    iosUnlockAudio = new Audio(asset("/sounds/silence.mp3"));
    iosUnlockAudio.preload = "auto";
    iosUnlockAudio.playsInline = true;
    iosUnlockAudio.muted = true;
    iosUnlockAudio.volume = 0;
    return iosUnlockAudio;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[useSoundManager] Failed to create iOS unlock audio:", err);
    }
    iosUnlockAudio = null;
    return null;
  }
};

// グローバルなアンロック状態（ページライフタイム全体で 1 回だけアンロックすれば十分）
let globalAudioUnlocked = false;

// サウンド優先度（数値が大きいほど優先）
const SOUND_PRIORITY: Record<SoundKey, number> = {
  timerStart: 100,
  timerEnd: 80,
  timerReady: 60,
  timerPrep: 50,
  scoreWazaYuko: 40,
};

// すべてのタイマー系サウンドを停止（集中管理）
const stopAllTimerSounds = (
  audioMapRef: React.RefObject<SoundMap | null>,
  currentSoundRef: React.RefObject<SoundKey | null>,
) => {
  const audioMap = audioMapRef.current;
  if (!audioMap) return;

  (Object.keys(audioMap) as SoundKey[]).forEach((key) => {
    const audio = audioMap[key];
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
    }
    try {
      audio.currentTime = 0;
    } catch {
      // ignore
    }
  });
  currentSoundRef.current = null;
};

export function useSoundManager(enabled: boolean) {
  const audioMapRef = useRef<SoundMap | null>(null);
  const currentSoundRef = useRef<SoundKey | null>(null);

  // マウント時にサウンドファイルをプリロード
  useEffect(() => {
    const audioMap: SoundMap = {} as SoundMap;

    // 各サウンドファイルをプリロード
    (Object.keys(SOUND_PATHS) as SoundKey[]).forEach((key) => {
      const audio = new Audio(SOUND_PATHS[key]);
      audio.preload = "auto";
      audio.playsInline = true;
      audioMap[key] = audio;
    });

    audioMapRef.current = audioMap;

    // クリーンアップ時にオーディオを停止
    return () => {
      Object.values(audioMap).forEach((audio) => {
        audio.pause();
        try {
          audio.currentTime = 0;
        } catch {
          // ignore
        }
      });
    };
  }, []);

  // オーディオアンロック（ユーザー操作後に呼び出される）
  // IMPORTANT: Must be called synchronously within user gesture context
  const unlockAudio = () => {
    if (globalAudioUnlocked) {
      return;
    }

    const audioMap = audioMapRef.current;
    if (!audioMap) {
      return;
    }

    // iOS: timerStart を一切触らず、サイレント専用 Audio インスタンスでアンロックする
    if (isIOS) {
      const unlockAudioEl = getIOSUnlockAudio();
      if (!unlockAudioEl) {
        return;
      }

      const originalMuted = unlockAudioEl.muted;
      const originalVolume = unlockAudioEl.volume;
      unlockAudioEl.muted = true;
      unlockAudioEl.volume = 0;
      unlockAudioEl.currentTime = 0;

      const playPromise = unlockAudioEl.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            unlockAudioEl.pause();
            unlockAudioEl.currentTime = 0;
            // 常にサイレント用途なので、muted/volume=0 のままでも良いが、元に戻しておく
            unlockAudioEl.muted = originalMuted;
            unlockAudioEl.volume = originalVolume;
            globalAudioUnlocked = true;
          })
          .catch((err) => {
            if (err.name !== "AbortError" && process.env.NODE_ENV === "development") {
              console.warn("[useSoundManager] iOS unlock audio failed:", err);
            }
            // 失敗時は unlocked=false のままにして、次のタップで再試行できるようにする
            unlockAudioEl.muted = originalMuted;
            unlockAudioEl.volume = originalVolume;
          });
      }
      return;
    }

    // 非 iOS: 既存ロジック（timerStart を用いたアンロック）を維持
    globalAudioUnlocked = true;

    // すべてのオーディオインスタンスをアンロック（実質 timerStart のみ使用）
    const timerStartAudio = audioMap.timerStart;
    if (timerStartAudio) {
      const originalMuted = timerStartAudio.muted;
      const originalVolume = timerStartAudio.volume;
      timerStartAudio.muted = true;
      timerStartAudio.volume = 0;
      timerStartAudio.currentTime = 0;

      // Call play() synchronously - must not use setTimeout/requestAnimationFrame
      const playPromise = timerStartAudio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Immediately pause and reset - must be synchronous
            timerStartAudio.pause();
            timerStartAudio.currentTime = 0;
            timerStartAudio.muted = originalMuted;
            timerStartAudio.volume = originalVolume;
          })
          .catch((err) => {
            // AbortErrorは正常な動作なので無視
            if (err.name !== "AbortError" && process.env.NODE_ENV === "development") {
              console.warn("[useSoundManager] Failed to unlock audio:", err);
            }
            timerStartAudio.muted = originalMuted;
            timerStartAudio.volume = originalVolume;
          });
      } else {
        timerStartAudio.muted = originalMuted;
        timerStartAudio.volume = originalVolume;
      }
    }
  };

  const play = (key: SoundKey): void => {
    if (!enabled) {
      return;
    }

    // 最初の再生時にオーディオをアンロック
    if (!globalAudioUnlocked) {
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

    // timerStart は常に最優先で確実に鳴らす（Android / iOS / PC 共通）
    if (key === "timerStart") {
      // 既存のタイマーサウンドは一旦すべて止める（ミックス防止）
      stopAllTimerSounds(audioMapRef, currentSoundRef);

      // iOS は fire-and-forget（pause/currentTime を触らない）
      if (isIOS) {
        if (!audio.paused) {
          // すでに鳴っていれば新規再生は不要
          return;
        }
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            if (err.name !== "AbortError" && process.env.NODE_ENV === "development") {
              console.error(`[useSoundManager] Failed to play sound "${key}":`, err);
            }
          });
        }
        currentSoundRef.current = key;
        return;
      }

      // 非 iOS は従来どおり安全にリセットしてから再生
      if (!audio.paused) {
        audio.pause();
      }
      try {
        audio.currentTime = 0;
      } catch {
        // ignore
      }
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          if (err.name !== "AbortError" && process.env.NODE_ENV === "development") {
            console.error(`[useSoundManager] Failed to play sound "${key}":`, err);
          }
        });
      }
      currentSoundRef.current = key;
      return;
    }

    // timerStart 以外（end / prep / ready / score）は
    // 「常に新しいリクエストを優先して再生」するシンプルな排他制御に変更
    // （現在の音が何であっても、次の音を鳴らす前に必ず全停止する）
    const current = currentSoundRef.current;
    if (current) {
      stopAllTimerSounds(audioMapRef, currentSoundRef);
    }

    if (!audio.paused) {
      audio.pause();
    }
    try {
      audio.currentTime = 0;
    } catch {
      // ignore
    }

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        if (err.name !== "AbortError" && process.env.NODE_ENV === "development") {
          console.error(`[useSoundManager] Failed to play sound "${key}":`, err);
        }
      });
    }

    currentSoundRef.current = key;
  };

  const ensureUnlocked = () => {
    if (!globalAudioUnlocked) {
      unlockAudio();
    }
  };

  return { play, unlockAudio, ensureUnlocked };
}


































