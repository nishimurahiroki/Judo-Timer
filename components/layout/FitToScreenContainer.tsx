// components/layout/FitToScreenContainer.tsx
"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";

type FitToScreenContainerProps = {
  children: ReactNode;
};

// Use the same base constants as non-iPhone mobile (16:9 ratio)
const BASE_W = 1600; // DESKTOP_BASE_W
const BASE_H = 900;  // DESKTOP_BASE_H

export function FitToScreenContainer({
  children,
}: FitToScreenContainerProps) {
  const [scale, setScale] = useState(1);
  const [baseWidth, setBaseWidth] = useState(BASE_W);
  const [baseHeight, setBaseHeight] = useState(BASE_H);
  const [isPortrait, setIsPortrait] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect iPhone using user agent
  const isIPhone = () => {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return false;
    }
    return /iPhone/.test(navigator.userAgent);
  };

  const calculateScale = () => {
    if (typeof window === "undefined") {
      return;
    }

    // Use iPhone-correct viewport measurement
    const vw = window.visualViewport?.width ?? window.innerWidth;
    const vh = window.visualViewport?.height ?? window.innerHeight;

    // Determine orientation
    const portrait = vh > vw;
    setIsPortrait(portrait);

    // Decide zoomFactor for iPhone (same as non-iPhone mobile)
    // If landscape on iPhone: zoomFactor = 0.7
    // Else: zoomFactor = 1
    const zoomFactor = !portrait ? 0.7 : 1;

    // Compute scaling exactly like non-iPhone mobile
    const scaledBaseW = BASE_W * zoomFactor;
    const scaledBaseH = BASE_H * zoomFactor;

    setBaseWidth(scaledBaseW);
    setBaseHeight(scaledBaseH);

    // Scale calculation: ensure viewport is not exceeded
    const scaleX = vw / scaledBaseW;
    const scaleY = vh / scaledBaseH;
    const newScale = Math.min(scaleX, scaleY);

    setScale(newScale);
  };

  useEffect(() => {
    // Mark as client-side rendered
    setIsClient(true);

    // Only apply on iPhone
    if (!isIPhone()) {
      return;
    }

    calculateScale();

    const handleResize = () => {
      calculateScale();
    };

    const handleOrientationChange = () => {
      // Delay to allow viewport to update
      setTimeout(calculateScale, 100);
    };

    // Prevent iOS gesture zoom
    const preventGestureZoom = (e: Event) => {
      e.preventDefault();
    };

    // Use visualViewport if available for more accurate resize detection
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
    } else {
      window.addEventListener("resize", handleResize);
    }

    window.addEventListener("orientationchange", handleOrientationChange);
    
    // Add iOS gesture zoom prevention
    document.addEventListener("gesturestart", preventGestureZoom, { passive: false });
    document.addEventListener("gesturechange", preventGestureZoom, { passive: false });
    document.addEventListener("gestureend", preventGestureZoom, { passive: false });

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize);
      } else {
        window.removeEventListener("resize", handleResize);
      }
      window.removeEventListener("orientationchange", handleOrientationChange);
      document.removeEventListener("gesturestart", preventGestureZoom);
      document.removeEventListener("gesturechange", preventGestureZoom);
      document.removeEventListener("gestureend", preventGestureZoom);
    };
  }, []);

  // Only apply fit-to-screen on iPhone (after client-side hydration)
  // During SSR or on non-iPhone, render children directly to avoid hydration mismatch
  if (!isClient || !isIPhone()) {
    return <>{children}</>;
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: "100vw",
        height: "100dvh",
        background: "black",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: "env(safe-area-inset-top, 0)",
        paddingBottom: "env(safe-area-inset-bottom, 0)",
        paddingLeft: "env(safe-area-inset-left, 0)",
        paddingRight: "env(safe-area-inset-right, 0)",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        overflow: "hidden",
      }}
    >
      {/* Container with scaled base size */}
      <div
        style={{
          width: `${baseWidth}px`,
          height: `${baseHeight}px`,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          position: "relative",
          pointerEvents: isPortrait ? "none" : "auto",
          opacity: isPortrait ? 0 : 1,
        }}
      >
        {children}
      </div>

      {/* Portrait overlay */}
      {isPortrait && (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          style={{
            pointerEvents: "auto",
          }}
        >
          <div className="text-center text-white px-8">
            <p className="text-3xl font-semibold mb-4">
              Rotate device for match view
            </p>
            <p className="text-lg text-gray-300">
              Please rotate your device to landscape mode
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

