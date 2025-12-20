// components/layout/MobileZoomPrevention.tsx
"use client";

import { useEffect } from "react";

/**
 * Global mobile zoom prevention component.
 * Applies to all pages, but only on touch devices.
 * Does not affect desktop zoom behavior.
 */
export function MobileZoomPrevention() {
  useEffect(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return;
    }

    // Only apply on touch devices
    const isTouchDevice = navigator.maxTouchPoints > 0;
    if (!isTouchDevice) {
      return;
    }

    // Block iOS gesture events
    const preventGestureZoom = (e: Event) => {
      e.preventDefault();
    };

    // Block pinch zoom using touch events
    const preventPinchZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Block double-tap zoom
    let lastTouchEndTime = 0;
    const preventDoubleTapZoom = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEndTime < 300) {
        e.preventDefault();
      }
      lastTouchEndTime = now;
    };

    // Add event listeners
    // iOS gesture events
    window.addEventListener("gesturestart", preventGestureZoom, { passive: false });
    window.addEventListener("gesturechange", preventGestureZoom, { passive: false });
    window.addEventListener("gestureend", preventGestureZoom, { passive: false });
    
    // Touch events for pinch zoom prevention
    document.addEventListener("touchstart", preventPinchZoom, { passive: false });
    document.addEventListener("touchmove", preventPinchZoom, { passive: false });
    document.addEventListener("touchend", preventDoubleTapZoom, { passive: false });

    // Cleanup
    return () => {
      window.removeEventListener("gesturestart", preventGestureZoom);
      window.removeEventListener("gesturechange", preventGestureZoom);
      window.removeEventListener("gestureend", preventGestureZoom);
      document.removeEventListener("touchstart", preventPinchZoom);
      document.removeEventListener("touchmove", preventPinchZoom);
      document.removeEventListener("touchend", preventDoubleTapZoom);
    };
  }, []);

  // This component renders nothing
  return null;
}

