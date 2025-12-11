// lib/programTimer/utils.ts

/**
 * MM:SS 形式の文字列を秒数に変換
 */
export function parseTimeToSeconds(timeStr: string): number {
  if (!timeStr || timeStr.trim() === "") return 0;

  const parts = timeStr.split(":");
  if (parts.length === 1) {
    // 秒のみ
    const sec = parseInt(parts[0], 10);
    return isNaN(sec) || sec < 0 ? 0 : sec;
  } else if (parts.length === 2) {
    // MM:SS
    const min = parseInt(parts[0], 10);
    const sec = parseInt(parts[1], 10);
    if (isNaN(min) || isNaN(sec) || min < 0 || sec < 0) return 0;
    return min * 60 + sec;
  }

  return 0;
}

/**
 * 秒数を MM:SS 形式の文字列に変換
 */
export function formatSecondsToTime(seconds: number): string {
  const sec = Math.max(0, Math.floor(seconds));
  const min = Math.floor(sec / 60);
  const remainingSec = sec % 60;
  return `${String(min).padStart(2, "0")}:${String(remainingSec).padStart(2, "0")}`;
}




