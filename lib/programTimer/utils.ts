// lib/programTimer/utils.ts

/**
 * 秒数を MM:SS 形式の文字列に変換
 */
export function formatSecondsToTime(seconds: number): string {
  const sec = Math.max(0, Math.floor(seconds));
  const min = Math.floor(sec / 60);
  const remainingSec = sec % 60;
  return `${String(min).padStart(2, "0")}:${String(remainingSec).padStart(2, "0")}`;
}




