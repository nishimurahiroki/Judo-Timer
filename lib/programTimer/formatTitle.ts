import type { ProgramStep } from "./types";

export type TimerTitleArgs = {
  step: ProgramStep | null;
  roundIndex: number; // 1-based
  currentSetIndex?: number; // 1-based current set number
  totalSetCount?: number; // 1-based total set count
};

/**
 * Single source of truth for timer title rendering.
 *
 * DISPLAY RULES (STRICT):
 *
 * Base title:
 * - If stepName (step.label) is not empty → use stepName
 * - If stepName is empty → use "Round {roundIndex}"
 *
 * Case 1: personMode=true && setCount>=2
 *   Display: "{Title} / Person {currentPerson} {setCount} set"
 *
 * Case 2: personMode=true && setCount===1
 *   Display: "{Title} / Person {currentPerson}"
 *   (do NOT show "1 set")
 *
 * Case 3: personMode=false && setCount>=2
 *   Display: "{Title} / {setCount} set"
 *
 * Case 4: personMode=false && setCount===1
 *   Display: "{Title}"
 *
 * Strict rules:
 * - Do NOT show "1 set" in any case
 * - Do NOT show Person info if personMode is false
 * - setCount in display refers to current set number (currentSetIndex)
 */
export function formatTimerTitle({
  step,
  roundIndex,
  currentSetIndex,
  totalSetCount,
}: TimerTitleArgs): string {
  // Base title: use stepName if not empty, otherwise "Round {roundIndex}"
  const stepName = step?.label?.trim() || "";
  const baseTitle = stepName.length > 0 ? stepName : `Round ${roundIndex}`;

  if (!step) return baseTitle;

  // Determine personMode and currentPerson
  const personMode = step.side !== undefined;
  const currentPerson = step.side === "ura" ? 2 : 1;

  // Determine setCount (default = 1 if not explicitly set)
  // Use totalSetCount to determine if we should show set info
  const setCount = totalSetCount && totalSetCount > 0 ? totalSetCount : 1;
  // Current set number for display (use currentSetIndex if available, otherwise 1)
  const currentSetNumber = currentSetIndex && currentSetIndex > 0 ? currentSetIndex : 1;

  // Case 1: personMode=true && setCount>=2
  if (personMode && setCount >= 2) {
    return `${baseTitle} / Person${currentPerson} - ${currentSetNumber}set`;
  }

  // Case 2: personMode=true && setCount===1
  if (personMode && setCount === 1) {
    return `${baseTitle} / Person${currentPerson}`;
  }

  // Case 3: personMode=false && setCount>=2
  if (!personMode && setCount >= 2) {
    return `${baseTitle} / ${currentSetNumber}set`;
  }

  // Case 4: personMode=false && setCount===1
  return baseTitle;
}



