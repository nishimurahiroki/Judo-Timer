// lib/programTimer/expand.ts

import type { EditorRow } from "./types";
import type { ProgramStep } from "./types";

/**
 * UUIDを生成する（ブラウザとサーバーの両方で動作）
 */
export function generateUUID(): string {
  // ブラウザ環境
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  // Node.js環境
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // フォールバック: 簡易UUID v4形式
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * EditorRow[] を ProgramStep[] に展開する
 */
export function expandProgramRowsToSteps(rows: EditorRow[]): ProgramStep[] {
  const steps: ProgramStep[] = [];

  if (!rows.length) {
    return steps;
  }

  // 1セットあたりの「行シーケンス」を作る（Row1 → Row2 → ... → RowN）
  const singleSequence: { label: string; duration: number }[] = rows.map(
    (row, rowIndex) => ({
      label: row.name.trim() || `Round ${rowIndex + 1}`,
      duration: row.durationSec,
    }),
  );

  // セット数は最初の行の setCount を代表値として使う
  const setCount = Math.max(1, rows[0]?.setCount ?? 1);

  // Omote/Ura トグル：少なくとも1行でも hasSides が true なら ON とみなす
  const omoteUraEnabled = rows.some((row) => row.hasSides);

  // セット数 > 1 かつ 裏表設定 ON の場合: 1セット = 表+裏の完全なサイクル
  // それ以外: 従来通り（セットごとにシーケンスを繰り返す）
  if (setCount > 1 && omoteUraEnabled) {
    // 1セット = 表（omote）の全ステップ + 裏（ura）の全ステップ
    for (let setIndex = 1; setIndex <= setCount; setIndex++) {
      // 表（omote）のステップを追加
      for (const seqItem of singleSequence) {
        steps.push({
          id: generateUUID(),
          label: seqItem.label,
          duration: seqItem.duration,
          color: "red",
          side: "omote",
        });
      }
      // 裏（ura）のステップを追加
      for (const seqItem of singleSequence) {
        steps.push({
          id: generateUUID(),
          label: seqItem.label,
          duration: seqItem.duration,
          color: "blue",
          side: "ura",
        });
      }
    }
  } else {
    // 従来のロジック: セットごとにシーケンスを繰り返す（裏表設定がOFF、またはセット数=1）
    for (let loop = 1; loop <= setCount; loop++) {
      const isOmoteBlock = loop % 2 === 1;
      const blockColor = omoteUraEnabled
        ? isOmoteBlock
          ? "red"
          : "blue"
        : undefined;
      const blockSide = omoteUraEnabled
        ? (isOmoteBlock ? "omote" : "ura")
        : undefined;

      for (const seqItem of singleSequence) {
        steps.push({
          id: generateUUID(),
          label: seqItem.label,
          duration: seqItem.duration,
          color: blockColor,
          side: blockSide,
        });
      }
    }
  }

  return steps;
}


