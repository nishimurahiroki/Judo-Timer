"use client";

import { useState, useEffect, useMemo } from "react";

/**
 * Returns the visible viewport dimensions using visualViewport API when available,
 * falling back to window.innerWidth/innerHeight.
 * Updates on visualViewport resize, window resize, and orientation change.
 */
export function useVisibleViewport() {
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>(() => {
    if (typeof window === "undefined") {
      return { width: 0, height: 0 };
    }

    // Prefer visualViewport if available
    if (window.visualViewport) {
      return {
        width: window.visualViewport.width,
        height: window.visualViewport.height,
      };
    }

    // Fallback to innerWidth/innerHeight
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  });

  useEffect(() => {
    const updateDimensions = () => {
      requestAnimationFrame(() => {
        if (typeof window === "undefined") return;

        let newWidth: number;
        let newHeight: number;

        if (window.visualViewport) {
          newWidth = window.visualViewport.width;
          newHeight = window.visualViewport.height;
        } else {
          newWidth = window.innerWidth;
          newHeight = window.innerHeight;
        }

        setDimensions((prev) => {
          // Only update if changed to avoid unnecessary re-renders
          if (prev.width !== newWidth || prev.height !== newHeight) {
            return { width: newWidth, height: newHeight };
          }
          return prev;
        });
      });
    };

    // Listen to visualViewport resize if available
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateDimensions);
    }

    // Also listen to window resize and orientation change
    window.addEventListener("resize", updateDimensions);
    window.addEventListener("orientationchange", updateDimensions);

    // Initial update
    updateDimensions();

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", updateDimensions);
      }
      window.removeEventListener("resize", updateDimensions);
      window.removeEventListener("orientationchange", updateDimensions);
    };
  }, []);

  const isPortrait = useMemo(() => dimensions.height > dimensions.width, [dimensions.width, dimensions.height]);
  const isLandscape = useMemo(() => dimensions.width > dimensions.height, [dimensions.width, dimensions.height]);

  return {
    vvW: dimensions.width,
    vvH: dimensions.height,
    isPortrait,
    isLandscape,
  };
}

