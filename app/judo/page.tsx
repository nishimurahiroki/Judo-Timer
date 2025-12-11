"use client";

import { JudoTimerScreen } from "@/components/layout/JudoTimerScreen";
import { JudoTimerScaledContainer } from "@/components/layout/JudoTimerScaledContainer";
import { DEFAULT_SETTINGS } from "@/lib/settings";

export default function JudoPage() {
  return (
    <JudoTimerScaledContainer>
      <JudoTimerScreen initialSettings={DEFAULT_SETTINGS} />
    </JudoTimerScaledContainer>
  );
}
