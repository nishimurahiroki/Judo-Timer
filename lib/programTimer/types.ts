// lib/programTimer/types.ts

// 編集用：EditorRow
export type EditorRow = {
  id: string;      // 行ID（DnD・チェックボックス選択の識別子）
  name: string;         // 種目名（空なら番号表示）
  durationSec: number;  // 1セットあたりの時間（秒）
  setCount: number;     // セット数 (1以上)
  hasSides: boolean;    // 裏表 ON/OFF
  setsMode?: "infinite" | "fixed";  // セットモード（無限または固定）
  fixedSetsCount?: number;          // 固定セット数（1-99、setsMode = fixedの時のみ）
  personAlternationEnabled?: boolean; // Person1,2の交互切り替えが有効か
  roleGroupId?: string; // ロールグループID（同じグループのタイマーは同じIDを持つ）
};

// ロールグループの定義
export type RoleGroup = {
  id: string;                    // ロールグループID
  color: string;                  // 背景色（例: "#00EEFF"）
  timerIds: string[];             // このグループに属するタイマーのID配列
  setsMode: "infinite" | "fixed";  // セットモード
  fixedSetsCount?: number;        // 固定セット数（setsMode = "fixed"の時のみ）
  personAlternationEnabled: boolean; // Person1,2の交互切り替えが有効か
};

// LocalStorage 保存用：Program
export type Program = {
  id: string;
  title: string;
  rows: EditorRow[];
  roleGroups?: RoleGroup[];       // ロールグループの配列（順序を保持）
  origin?: {
    type: "template" | "saved";
    templateId?: string;
  };
};

// 再生用：ProgramStep（RunScreen 専用）
export type ProgramStep = {
  id: string;
  label: string;             // 画面に表示するラベル
  duration: number;          // 秒
  color?: string;            // 赤・青などのテーマ色
  side?: "omote" | "ura";    // 裏表 ON の場合のみ付与
  roleGroupId?: string;      // ロールグループID
  setsMode?: "infinite" | "fixed";  // セットモード（無限または固定）
  fixedSetsCount?: number;          // 固定セット数（1-99、setsMode = fixedの時のみ）
  personAlternationEnabled?: boolean; // Person1,2の交互切り替えが有効か
  roundNumber?: number;       // 元のタイマー行のインデックス（1ベース）
  setNumber?: number;         // 現在のループ回数（1ベース、ロールグループの場合）
};

// タイマー状態
export type ProgramTimerStatus =
  | "idle"
  | "running"
  | "paused"
  | "finished";




