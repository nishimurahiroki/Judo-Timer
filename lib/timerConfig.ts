// lib/timerConfig.ts
import type { TimerConfig } from "@/hooks/useJudoTimer";

export const JUDO_CONFIG: TimerConfig = {
  mainSeconds: 240,
  osaekomiSeconds: 20,
};

export const KOSEN_CONFIG: TimerConfig = {
  mainSeconds: 240,
  osaekomiSeconds: 30,
};
