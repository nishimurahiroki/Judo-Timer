// components/overlay/A2HSNotice.tsx
"use client";

import { useState, useEffect } from "react";
import { isIPhone } from "@/lib/deviceDetection";

const STORAGE_KEY = "ios_a2hs_dismissed";

export function A2HSNotice() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    // Only show on iPhone
    if (!isIPhone()) {
      return;
    }

    // Check if already dismissed
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed === "1") {
      return;
    }

    // Show notice after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleGotIt = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      style={{
        paddingTop: "env(safe-area-inset-top, 0)",
        paddingBottom: "env(safe-area-inset-bottom, 0)",
        paddingLeft: "env(safe-area-inset-left, 0)",
        paddingRight: "env(safe-area-inset-right, 0)",
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900">
          For the best experience on iPhone
        </h2>
        <p className="text-gray-700 mb-4">
          Add this app to your Home Screen for a better experience.
        </p>

        {showSteps ? (
          <div className="mb-4 space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-gray-900">1.</span>
              <span>Tap the Share button at the bottom of the screen</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-gray-900">2.</span>
              <span>Scroll down and tap "Add to Home Screen"</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-gray-900">3.</span>
              <span>Tap "Add" to confirm</span>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowSteps(true)}
            className="text-blue-600 hover:text-blue-800 underline text-sm mb-4"
          >
            How to add to Home Screen
          </button>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleGotIt}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

