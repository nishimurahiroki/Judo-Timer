// lib/programTimer/types.ts

// 編集用：EditorRow
export type EditorRowId = string;

export type EditorRow = {
  id: EditorRowId;      // 行ID（DnD・チェックボックス選択の識別子）
  name: string;         // 種目名（空なら番号表示）
  durationSec: number;  // 1セットあたりの時間（秒）
  setCount: number;     // セット数 (1以上)
  hasSides: boolean;    // 裏表 ON/OFF
};

// LocalStorage 保存用：Program
export type Program = {
  id: string;
  title: string;
  rows: EditorRow[];
};

// 再生用：ProgramStep（RunScreen 専用）
export type ProgramStep = {
  id: string;
  label: string;             // 画面に表示するラベル
  duration: number;          // 秒
  color?: string;            // 赤・青などのテーマ色
  side?: "omote" | "ura";    // 裏表 ON の場合のみ付与
};

// タイマー状態
export type ProgramTimerStatus =
  | "idle"
  | "running"
  | "paused"
  | "finished";




