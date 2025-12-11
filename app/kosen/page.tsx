"use client";

import { JudoTimerScreen } from "@/components/layout/JudoTimerScreen";
import { JudoTimerScaledContainer } from "@/components/layout/JudoTimerScaledContainer";
import { DEFAULT_KOSEN_SETTINGS } from "@/lib/settings";

export default function KosenPage() {
  return (
    <JudoTimerScaledContainer>
      <JudoTimerScreen initialSettings={DEFAULT_KOSEN_SETTINGS} />
    </JudoTimerScaledContainer>
  );
}