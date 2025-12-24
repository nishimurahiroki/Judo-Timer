"use client";

import { useEffect } from "react";
import { installAudioAudit } from "@/lib/debugAudioAudit";

export function AudioAuditInstaller() {
  useEffect(() => {
    installAudioAudit();
  }, []);

  return null;
}



