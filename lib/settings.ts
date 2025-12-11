// lib/settings.ts

export type RuleType = "judo" | "kosen";

export type ScoreConfig = {
  useYuko: boolean;
  maxShidoToHansokumake: number; // 0–4
  ipponToWin: number; // 1–9
  // 将来の判定ロジック用：何本の技ありで勝ちとするか
  wazaariToWin?: number;
};

export type OsaekomiConfig = {
  yukoSeconds: number;
  wazaariSeconds: number;
  ipponSeconds: number;
};

export type LayoutColorKey =
  | "blue"
  | "red"
  | "green"
  | "yellow"
  | "orange"
  | "cyan"
  | "black"
  | "white";

export type LayoutConfig = {
  backgroundColor: LayoutColorKey;
  mainTimerColor: LayoutColorKey;
  player1Color: LayoutColorKey; // P1 score & name color
  player2Color: LayoutColorKey; // P2 score & name color
};

export type PlayerNames = {
  white: string; // Player1
  blue: string;  // Player2
};

export type SoundConfig = {
  enabled: boolean;
};

export type AppSettings = {
  mainTimerSeconds: number;
  rule: RuleType;
  score: ScoreConfig;
  osaekomi: OsaekomiConfig;
  layout: LayoutConfig;
  playerNames: PlayerNames;
  sound: SoundConfig;
};

// Default settings
export const DEFAULT_SETTINGS: AppSettings = {
  mainTimerSeconds: 240, // 4 minutes
  rule: "judo",
  score: {
    useYuko: true,
    maxShidoToHansokumake: 3,
    ipponToWin: 1,
    wazaariToWin: 2,
  },
  osaekomi: {
    yukoSeconds: 5,
    wazaariSeconds: 10,
    ipponSeconds: 20,
  },
  layout: {
    backgroundColor: "black",
    mainTimerColor: "orange",
    player1Color: "red",
    player2Color: "white",
  },
  playerNames: {
    white: "Player1",
    blue: "Player2",
  },
  sound: {
    enabled: true,
  },
};

// Kosen default settings
export const DEFAULT_KOSEN_SETTINGS: AppSettings = {
  ...DEFAULT_SETTINGS,
  rule: "kosen",
  mainTimerSeconds: 360, // 6 minutes
  osaekomi: {
    yukoSeconds: 5,
    wazaariSeconds: 15,
    ipponSeconds: 30,
  },
  score: {
    useYuko: false,
    maxShidoToHansokumake: 4,
    ipponToWin: 1,
    wazaariToWin: 2,
  },
  sound: {
    enabled: true,
  },
};

