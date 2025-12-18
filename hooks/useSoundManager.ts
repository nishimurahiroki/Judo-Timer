"use client";

import { useRef, useEffect } from "react";

export type SoundKey = "timerStart" | "timerEnd" | "scoreWazaYuko";

type SoundMap = Record<SoundKey, HTMLAudioElement>;

const SOUND_PATHS: Record<SoundKey, string> = {
  timerStart: "/sounds/timer-start.mp3",
  timerEnd: "/sounds/timer-end.mp3",
  scoreWazaYuko: "/sounds/score-waza-yuko.mp3",
};

export function useSoundManager(enabled: boolean) {
  const audioMapRef = useRef<SoundMap | null>(null);

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

  const play = (key: SoundKey): void => {
    if (!enabled) {
      return;
    }

    const audioMap = audioMapRef.current;
    if (!audioMap) {
      return;
    }

    const audio = audioMap[key];
    if (!audio) {
      return;
    }

    // 再生前にリセット
    audio.currentTime = 0;

    // 再生（エラーを無視）
    audio.play().catch(() => {
      // ユーザー操作なしで再生できない場合など、エラーを無視
    });
  };

  return { play };
}


































