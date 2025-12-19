"use client";

import { useState, useEffect } from "react";
import { JudoTimerScreen } from "@/components/layout/JudoTimerScreen";
import { JudoTimerScaledContainer } from "@/components/layout/JudoTimerScaledContainer";
import { FitToScreenContainer } from "@/components/layout/FitToScreenContainer";
import { A2HSNotice } from "@/components/overlay/A2HSNotice";
import { isIPhone } from "@/lib/deviceDetection";
import { DEFAULT_SETTINGS } from "@/lib/settings";

export default function JudoPage() {
  const [isIPhoneDevice, setIsIPhoneDevice] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setIsIPhoneDevice(isIPhone());
  }, []);

  // During SSR and initial client render, use default container to avoid hydration mismatch
  if (!isClient) {
    return (
      <>
        <JudoTimerScaledContainer>
          <JudoTimerScreen initialSettings={DEFAULT_SETTINGS} />
        </JudoTimerScaledContainer>
        <A2HSNotice />
      </>
    );
  }

  return (
    <>
      {isIPhoneDevice ? (
        <FitToScreenContainer>
          <JudoTimerScreen initialSettings={DEFAULT_SETTINGS} />
        </FitToScreenContainer>
      ) : (
        <JudoTimerScaledContainer>
          <JudoTimerScreen initialSettings={DEFAULT_SETTINGS} />
        </JudoTimerScaledContainer>
      )}
      <A2HSNotice />
    </>
  );
}
