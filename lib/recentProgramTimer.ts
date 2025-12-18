// lib/recentProgramTimer.ts
// Utility for managing the last started Program timer

const LAST_STARTED_PROGRAM_ID_KEY = "gatame:lastStartedProgramId";

/**
 * Store the ID of the last started Program timer
 */
export function setLastStartedProgramId(programId: string): void {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LAST_STARTED_PROGRAM_ID_KEY, programId);
    } catch (error) {
      console.error("Failed to save last started program ID", error);
    }
  }
}

/**
 * Get the ID of the last started Program timer
 * @returns The program timer ID, or null if not found
 */
export function getLastStartedProgramId(): string | null {
  if (typeof window !== "undefined") {
    try {
      return window.localStorage.getItem(LAST_STARTED_PROGRAM_ID_KEY);
    } catch (error) {
      console.error("Failed to read last started program ID", error);
      return null;
    }
  }
  return null;
}

