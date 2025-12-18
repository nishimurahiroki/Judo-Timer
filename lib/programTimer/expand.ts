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
 * ロールグループがある場合、グループ全体をSets回数だけ繰り返す
 */
export function expandProgramRowsToSteps(rows: EditorRow[]): ProgramStep[] {
  const steps: ProgramStep[] = [];

  if (!rows.length) {
    return steps;
  }

  // ロールグループを識別し、グループごとに処理
  // グループ化されていない行は個別に処理
  // 重要: 行は順番に処理され、未チェックのタイマー（roleGroupIdなし）は
  // ロールグループの前に実行される
  const processedIndices = new Set<number>();
  let currentIndex = 0;

  while (currentIndex < rows.length) {
    const currentRow = rows[currentIndex];
    
    // 既に処理済みの場合はスキップ
    if (processedIndices.has(currentIndex)) {
      currentIndex++;
      continue;
    }

    // ロールグループがある場合
    // 同じroleGroupIdを持つすべての行を収集してグループとして処理
    if (currentRow.roleGroupId) {
      // 同じロールグループのすべての行を収集
      const roleGroupRows: { row: EditorRow; index: number }[] = [];
      for (let i = currentIndex; i < rows.length; i++) {
        if (rows[i].roleGroupId === currentRow.roleGroupId) {
          roleGroupRows.push({ row: rows[i], index: i });
          processedIndices.add(i);
        }
      }

      // ロールグループの設定を取得（最初の行から）
      const groupSetsMode = roleGroupRows[0]?.row.setsMode || "fixed";
      const groupFixedSetsCount = roleGroupRows[0]?.row.fixedSetsCount || 1;
      const groupPersonAlternationEnabled = roleGroupRows[0]?.row.personAlternationEnabled || false;
      const groupHasSides = roleGroupRows.some((item) => item.row.hasSides);

      // Sets回数だけグループ全体を繰り返す
      // 1セット = グループ内のすべてのタイマーを1回ずつ実行
      const loopCount = groupSetsMode === "infinite" ? 99 : groupFixedSetsCount;

      for (let setIndex = 1; setIndex <= loopCount; setIndex++) {
        if (groupPersonAlternationEnabled) {
          // Person1,2がONの場合: セット → Person → タイマーの順で展開
          // 各セットで、Person1の全タイマー、次にPerson2の全タイマーを実行
          // Person1から開始（明示的に順序を保証）
          // 注意: hasSidesのチェックは不要。Person1,2がONなら常にPerson1/Person2を実行
          
          // 重要: Person1 (omote) を必ず先に処理する
          // グループ内の各タイマーに対してPerson1を先に追加
          for (const { row, index } of roleGroupRows) {
            const label = row.name.trim() || `Round ${index + 1}`;
            const roundNumber = index + 1; // 1ベースのRound番号
            
            // Person1 (omote) を先に追加
            steps.push({
              id: generateUUID(),
              label,
              duration: row.durationSec,
              color: "red",
              side: "omote",
              roleGroupId: row.roleGroupId,
              setsMode: groupSetsMode,
              fixedSetsCount: groupFixedSetsCount,
              personAlternationEnabled: groupPersonAlternationEnabled,
              roundNumber,
              setNumber: setIndex,
            });
          }
          
          // 次にPerson2 (ura) を処理
          // グループ内の各タイマーに対してPerson2を次に追加
          for (const { row, index } of roleGroupRows) {
            const label = row.name.trim() || `Round ${index + 1}`;
            const roundNumber = index + 1; // 1ベースのRound番号
            
            // Person2 (ura) を次に追加
            steps.push({
              id: generateUUID(),
              label,
              duration: row.durationSec,
              color: "blue",
              side: "ura",
              roleGroupId: row.roleGroupId,
              setsMode: groupSetsMode,
              fixedSetsCount: groupFixedSetsCount,
              personAlternationEnabled: groupPersonAlternationEnabled,
              roundNumber,
              setNumber: setIndex,
            });
          }
        } else if (groupHasSides && !groupPersonAlternationEnabled) {
          // グループ内の各タイマーを順番に処理（これが1セット）
          // 裏表設定はONだがPerson1,2がOFF: 各セットで交互に表裏
          for (const { row, index } of roleGroupRows) {
            const label = row.name.trim() || `Round ${index + 1}`;
            const roundNumber = index + 1; // 1ベースのRound番号
            // セット内のタイマーの順序に応じて表裏を決定
            const timerIndexInSet = roleGroupRows.findIndex((item) => item.row.id === row.id);
            const isOmoteBlock = (setIndex + timerIndexInSet) % 2 === 1;
            steps.push({
              id: generateUUID(),
              label,
              duration: row.durationSec,
              color: isOmoteBlock ? "red" : "blue",
              side: isOmoteBlock ? "omote" : "ura",
              roleGroupId: row.roleGroupId,
              setsMode: groupSetsMode,
              fixedSetsCount: groupFixedSetsCount,
              personAlternationEnabled: groupPersonAlternationEnabled,
              roundNumber,
              setNumber: setIndex,
            });
          }
        } else {
          // 裏表設定がOFF
          for (const { row, index } of roleGroupRows) {
            const label = row.name.trim() || `Round ${index + 1}`;
            const roundNumber = index + 1; // 1ベースのRound番号
            steps.push({
              id: generateUUID(),
              label,
              duration: row.durationSec,
              roleGroupId: row.roleGroupId,
              setsMode: groupSetsMode,
              fixedSetsCount: groupFixedSetsCount,
              personAlternationEnabled: groupPersonAlternationEnabled,
              roundNumber,
              setNumber: setIndex,
            });
          }
        }
      }
    } else {
      // ロールグループがない場合: 個別に処理
      // 未チェックのタイマーはここで処理され、ロールグループの前に実行される
      const row = currentRow;
      const setCount = Math.max(1, row.setCount ?? 1);
      const hasSides = row.hasSides;
      const label = row.name.trim() || `Round ${currentIndex + 1}`;

      const roundNumber = currentIndex + 1; // 1ベースのRound番号（元のタイマー行のインデックス）

      if (hasSides) {
        // 各セットで表＋裏を必ず1サイクル実行
        for (let setIndex = 1; setIndex <= setCount; setIndex++) {
          // 表（omote）
          steps.push({
            id: generateUUID(),
            label,
            duration: row.durationSec,
            color: "red",
            side: "omote",
            roundNumber,
            setNumber: setIndex,
          });
          // 裏（ura）
          steps.push({
            id: generateUUID(),
            label,
            duration: row.durationSec,
            color: "blue",
            side: "ura",
            roundNumber,
            setNumber: setIndex,
          });
        }
      } else {
        // 裏表なし: セット数だけ繰り返す
        for (let loop = 1; loop <= setCount; loop++) {
          steps.push({
            id: generateUUID(),
            label,
            duration: row.durationSec,
            roundNumber,
            setNumber: loop,
          });
        }
      }

      processedIndices.add(currentIndex);
    }

    currentIndex++;
  }

  return steps;
}


