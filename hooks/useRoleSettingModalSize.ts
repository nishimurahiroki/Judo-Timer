"use client";

import { useMemo } from "react";
import { useVisibleViewport } from "./useVisibleViewport";

/**
 * Computes the modal size for RoleSettingPanel based on visible viewport.
 * Returns inline style object with pixel width/height.
 */
export function useRoleSettingModalSize(isMobile: boolean) {
  const { vvW: vvWidth, vvH: vvHeight } = useVisibleViewport();

  const style = useMemo(() => {
    if (vvWidth === 0 || vvHeight === 0) {
      // Not yet initialized, return empty style (will use fallback CSS)
      return {};
    }

    // Safe area padding (conservative estimate for iOS)
    const safePad = isMobile ? 16 : 0;
    const availableH = vvHeight * 0.9 - safePad * 2;

    let finalW: number;
    let finalH: number;

    if (isMobile) {
      // Mobile: 72% of viewport, max 600px, aspect 631/817
      const cand1 = vvWidth * 0.72;
      const cand2 = vvHeight * 0.72 * (631 / 681);
      const baseW = Math.min(cand1, cand2, 600);
      const aspect = 631 / 817;
      const hFromW = baseW * (817 / 631);

      if (hFromW > availableH) {
        // Height constraint: fit to available height
        finalH = availableH;
        finalW = finalH * (631 / 817);
      } else {
        // Width constraint: use computed width
        finalW = baseW;
        finalH = hFromW;
      }
    } else {
      // Desktop: 60% of viewport, max 500px, aspect 631/681
      const cand1 = vvWidth * 0.6;
      const cand2 = vvHeight * 0.6 * (631 / 681);
      const baseW = Math.min(cand1, cand2, 500);
      const aspect = 631 / 681;
      const hFromW = baseW * (681 / 631);

      if (hFromW > availableH) {
        // Height constraint: fit to available height
        finalH = availableH;
        finalW = finalH * (631 / 681);
      } else {
        // Width constraint: use computed width
        finalW = baseW;
        finalH = hFromW;
      }
    }

    return {
      width: `${finalW}px`,
      height: `${finalH}px`,
    };
  }, [vvWidth, vvHeight, isMobile]);

  return {
    style,
    dimensions: {
      vvWidth,
      vvHeight,
      finalWidth: style.width ? parseFloat(style.width) : 0,
      finalHeight: style.height ? parseFloat(style.height) : 0,
    },
  };
}

